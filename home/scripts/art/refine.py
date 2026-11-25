"""
Turns lifted subjects (PNG with alpha, from lift.swift) into paper cut-outs for the story:
  1. smooths the cut line (closes hairline cracks, feathers stair-steps, then re-tightens),
  2. keys the studio grey out from between cage bars and other see-through gaps,
  3. adds a soft cream paper border, like a figure cut from a magazine with scissors,
  4. writes WebP with full-quality alpha into public/story/.

usage: python3 -I scripts/art/refine.py <lifted-dir> public/story
"""
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SRC, OUT = Path(sys.argv[1]), Path(sys.argv[2])
PAPER = (252, 248, 238)

# lifted file -> published name, and (optionally) a box (fractions) where studio grey shows through gaps
MAP = {
    'girl-a-1': 'girl-phone', 'girl-a-2': 'girl-sit', 'girl-a-3': 'girl-list',
    'girl-b-1': 'girl-lens', 'girl-b-2': 'girl-baton', 'girl-b-3': 'girl-walk',
    'boy-a-1': 'boy-laptop', 'boy-a-2': 'boy-sit', 'boy-a-3': 'boy-plan',
    'boy-b-1': 'boy-run', 'boy-b-2': 'boy-thumb', 'boy-b-3': 'boy-wave',
    'robots-1': 'bot-type', 'robots-2': 'bot-lens', 'robots-3': 'bot-paper',
    'robots-4': 'bot-block', 'robots-5': 'bot-stand', 'robots-6': 'bot-horn',
    'bots2-1': ('bot-cage-open', (0.45, 0.05, 1.0, 0.45)),
    'bots2-2': ('bot-cage', (0.0, 0.0, 0.45, 0.33)),
    'bots2-3': 'bot-wave',
    'props-1': 'bug', 'props-2': 'tv', 'props-3': 'blocks', 'props-4': 'stamp', 'props-5': 'desk',
    'train-1': 'engine', 'train-2': 'coach', 'squad': 'squad',
}

# the trainer: real photos (home/public/vivek), lifted the same way, then printed in warm black and white
# and scaled down, so he reads as a real person cut out of a magazine, standing in the paper world
# standing poses only, so he is always the same height on the floor
PHOTOS = {
    'viv11': 'vivek-walk', 'viv10': 'vivek-dance',  # viv7 (the kick) was dropped from the story
    'viv8': 'vivek-step', 'viv9': 'vivek-chair', 'viv5': 'vivek-lean',
}
PHOTO_HEIGHT = 1000


def mono(path):
    """Warm black and white, a touch more contrast, at most PHOTO_HEIGHT tall."""
    im = Image.open(path).convert('RGBA')
    if im.height > PHOTO_HEIGHT:
        im = im.resize((round(im.width * PHOTO_HEIGHT / im.height), PHOTO_HEIGHT), Image.LANCZOS)
    a = np.array(im).astype(np.float32)
    y = (0.299 * a[:, :, 0] + 0.587 * a[:, :, 1] + 0.114 * a[:, :, 2]) / 255
    y = np.clip((y - 0.5) * 1.12 + 0.52, 0, 1)
    shadow, light = np.array([22, 20, 30], np.float32), np.array([250, 244, 230], np.float32)
    a[:, :, :3] = shadow + (light - shadow) * y[:, :, None]
    return Image.fromarray(a.astype(np.uint8))


def curve(a, lo, hi):
    """Re-tighten a blurred alpha: below lo -> 0, above hi -> 255, smooth in between."""
    t = np.clip((a.astype(np.float32) - lo) / (hi - lo), 0, 1)
    return (t * t * (3 - 2 * t) * 255).astype(np.uint8)


def key_gaps(rgba, box):
    """Make studio-grey pixels inside box transparent (light, unsaturated)."""
    h, w = rgba.shape[:2]
    x0, y0, x1, y1 = int(box[0] * w), int(box[1] * h), int(box[2] * w), int(box[3] * h)
    reg = rgba[y0:y1, x0:x1, :3].astype(np.int16)
    spread = reg.max(axis=2) - reg.min(axis=2)
    light = reg.mean(axis=2)
    grey = (spread < 16) & (light > 168)
    m = Image.fromarray((grey * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    keep = 255 - np.asarray(m)
    rgba[y0:y1, x0:x1, 3] = np.minimum(rgba[y0:y1, x0:x1, 3], keep)
    return rgba


def refine(path, box, photo=False):
    im = mono(path) if photo else Image.open(path).convert('RGBA')
    w, h = im.size
    border = int(np.clip(round(max(w, h) * 0.0115), 4, 10))
    pad = border * 3
    canvas = Image.new('RGBA', (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    canvas.paste(im, (pad, pad))
    rgba = np.array(canvas)
    if box:
        sub = rgba[pad:pad + h, pad:pad + w]
        rgba[pad:pad + h, pad:pad + w] = key_gaps(sub, box)

    alpha = Image.fromarray(rgba[:, :, 3])
    # 1. close hairline cracks, then feather and re-tighten the cut line
    closed = alpha.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    subject = curve(np.asarray(closed.filter(ImageFilter.GaussianBlur(1.1))), 60, 196)
    # the paper: a rounded dilation of the silhouette (gaps inside it stay open), with a soft edge
    solid = Image.fromarray(np.where(np.asarray(closed) > 40, 255, 0).astype(np.uint8))
    grown = solid.filter(ImageFilter.MaxFilter(2 * border + 1)).filter(ImageFilter.GaussianBlur(border * 0.55))
    paper = curve(np.asarray(grown), 104, 152)
    paper = curve(np.asarray(Image.fromarray(paper).filter(ImageFilter.GaussianBlur(0.9))), 70, 185)

    out = np.zeros_like(rgba)
    out[:, :, :3] = PAPER
    out[:, :, 3] = paper
    base = Image.fromarray(out)
    rgba[:, :, 3] = subject
    base.alpha_composite(Image.fromarray(rgba))
    bbox = base.getchannel('A').getbbox()
    return base.crop(bbox)


OUT.mkdir(parents=True, exist_ok=True)
for src, spec in {**MAP, **PHOTOS}.items():
    name, box = (spec, None) if isinstance(spec, str) else spec
    f = SRC / f'{src}.png'
    if not f.exists():
        continue
    img = refine(f, box, photo=src in PHOTOS)
    with tempfile.NamedTemporaryFile(suffix='.png') as tmp:
        img.save(tmp.name)
        subprocess.run(['cwebp', '-quiet', '-q', '86', '-alpha_q', '100', '-alpha_filter', 'best', '-m', '6', tmp.name, '-o', str(OUT / f'{name}.webp')], check=True)
    print(f'{name:14s} {img.size[0]}x{img.size[1]}  {(OUT / f"{name}.webp").stat().st_size // 1024} KB')

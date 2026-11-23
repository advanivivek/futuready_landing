// Futuready page maker: the pictures (wide cover, square cover, thumbnail, partner-logo strip), drawn on a canvas
// with the main page's own fonts and cut-outs, so what you see is exactly what you download.
import { derive } from './sections.js';

const BLUE = '#3463af', GOLD = '#f2b230', CREAM = '#efe6d2', PAPER = '#fffcf5', INK = '#161a3a';
const img = {};
const load = src => (img[src] ||= new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; }));

export async function ready() {
  const fonts = [
    ['Great Vibes', '/fonts/great-vibes.woff2', '400'],
    ['Unbounded', '/fonts/unbounded.woff2', '700'],
    ['Syncopate', '/fonts/syncopate-700.woff2', '700'],
    ['Geist Mono', '/fonts/geist-mono.woff2', '700'],
  ];
  await Promise.all(fonts.map(async ([f, u, w]) => document.fonts.add(await new FontFace(f, `url(${u})`, { weight: w }).load())));
  await Promise.all(['/story/girl-phone.webp', '/story/boy-laptop.webp', '/story/bot-wave.webp', '/h2s-logo.png'].map(load));
}

let grain;
function noise() {
  if (grain) return grain;
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const g = c.getContext('2d'), d = g.createImageData(160, 160);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.random() < 0.5 ? 0 : 255;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = Math.random() * 22;
  }
  g.putImageData(d, 0, 0);
  return (grain = c);
}

// the cream floor: plain, with a fine concrete grain and a soft shadow where it meets the wall.
// `grain` is how strong the grain is (the small thumbnail needs less, or it reads as a road)
function floor(ctx, W, y, H, k, grain = 2) {
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, y, W, H - y);
  ctx.save();
  ctx.fillStyle = ctx.createPattern(noise(), 'repeat');
  for (let g = grain; g > 0; g--) {
    ctx.globalAlpha = Math.min(1, g);
    ctx.fillRect(0, y, W, H - y);
  }
  ctx.restore();
  const sh = ctx.createLinearGradient(0, y, 0, y + 30 * k);
  sh.addColorStop(0, 'rgba(22,26,58,.16)');
  sh.addColorStop(1, 'rgba(22,26,58,0)');
  ctx.fillStyle = sh;
  ctx.fillRect(0, y, W, 30 * k);
}

async function cut(ctx, src, x, bottom, h, k) {
  const i = await load(src), w = (i.width / i.height) * h;
  ctx.save();
  ctx.shadowColor = 'rgba(10,12,30,.24)';
  ctx.shadowBlur = 22 * k;
  ctx.shadowOffsetY = 10 * k;
  ctx.drawImage(i, x, bottom - h, w, h);
  ctx.restore();
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// the split-flap board: a label and rows of letters, right-aligned at `right`
function board(ctx, label, rows, right, top, f) {
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 ${f * 0.34}px "Geist Mono"`;
  ctx.letterSpacing = `${f * 0.06}px`;
  ctx.fillStyle = PAPER;
  ctx.fillText(label.toUpperCase(), right, top + f * 0.34);
  ctx.letterSpacing = '0px';
  let y = top + f * 0.55;
  for (const row of rows) {
    const cw = f * 0.78, chh = f * 1.08, gap = f * 0.08, pad = f * 0.1;
    const w = row.length * cw + (row.length - 1) * gap + pad * 2, x = right - w;
    ctx.save();
    ctx.shadowColor = 'rgba(10,12,30,.3)';
    ctx.shadowBlur = f * 0.3;
    ctx.shadowOffsetY = f * 0.15;
    ctx.fillStyle = INK;
    rr(ctx, x, y, w, chh + pad * 2, f * 0.16);
    ctx.fill();
    ctx.restore();
    [...row].forEach((ch, i) => {
      const cx = x + pad + i * (cw + gap), cy = y + pad;
      const g = ctx.createLinearGradient(0, cy, 0, cy + chh);
      g.addColorStop(0.5, '#2a2f5c');
      g.addColorStop(0.5, '#242952');
      ctx.fillStyle = g;
      rr(ctx, cx, cy, cw, chh, f * 0.08);
      ctx.fill();
      ctx.fillStyle = PAPER;
      ctx.font = `700 ${f}px "Geist Mono"`;
      ctx.textAlign = 'center';
      ctx.fillText(ch, cx + cw / 2, cy + chh * 0.79);
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(cx, cy + chh / 2 - 1, cw, 2);
    });
    ctx.textAlign = 'right';
    y += chh + pad * 2 + f * 0.14;
  }
}

function words(ctx, parts, x, y, size) {
  ctx.font = `700 ${size}px Unbounded`;
  ctx.letterSpacing = `${-size * 0.045}px`;
  ctx.textAlign = 'left';
  for (const [t, c] of parts) {
    ctx.fillStyle = c;
    ctx.fillText(t, x, y);
    x += ctx.measureText(t).width;
  }
  ctx.letterSpacing = '0px';
}

function script(ctx, text, x, y, size, color, align = 'left') {
  ctx.font = `400 ${size}px "Great Vibes"`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

// the H2S logo, and (unless turned off) a thin rule and FUTUREADY, its capitals exactly as tall as the logo
// (shrunk to fit in maxW, so it never runs into the characters)
async function logo(ctx, x, cy, h, brand = true, maxW = Infinity) {
  const i = await load('/h2s-logo.png'), r = i.width / i.height;
  ctx.font = '700 100px Syncopate';
  ctx.letterSpacing = '8px';
  const m = ctx.measureText('FUTUREADY'), per = (r + 1.15) + m.width / m.actualBoundingBoxAscent; // width per unit of height
  ctx.letterSpacing = '0px';
  if (brand) h = Math.min(h, maxW / per);
  const w = r * h;
  ctx.drawImage(i, x, cy - h / 2, w, h);
  if (!brand) return;
  const size = (100 * h) / m.actualBoundingBoxAscent;
  const gap = h * 0.55;
  ctx.fillStyle = 'rgba(22,26,58,.3)';
  ctx.fillRect(x + w + gap, cy - h / 2, Math.max(2, h * 0.05), h);
  ctx.font = `700 ${size}px Syncopate`;
  ctx.letterSpacing = `${size * 0.08}px`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = INK;
  ctx.fillText('FUTUREADY', x + w + gap * 2, cy + h / 2);
  ctx.letterSpacing = '0px';
}

function boardFor(e) {
  const x = derive(e);
  return x.virtual ? ['Virtual', ['LIVE', 'ONLINE']] : [x.weekday || 'Date', [x.day, x.mon]];
}

export async function cover(canvas, e, wide) {
  const x = derive(e), [W, H] = wide ? [1800, 600] : [1080, 1080];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d'), k = wide ? 1 : 1.2;
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, W, H);
  const fy = wide ? 468 : 830;
  floor(ctx, W, fy, H, k);
  const hello = x.hello ? `${x.hello},` : '';
  const [label, rows] = boardFor(e);
  ctx.textBaseline = 'alphabetic';
  if (wide) {
    script(ctx, hello, 88, 160, 104, PAPER);
    words(ctx, [['are you ready', PAPER]], 90, 300, 92);
    words(ctx, [['for the ', PAPER], ['future?', GOLD]], 90, 405, 92);
    board(ctx, label, rows, 1716, 52, 60);
    await cut(ctx, '/story/girl-phone.webp', 1080, 578, 400, k);
    await cut(ctx, '/story/boy-laptop.webp', 1262, 590, 382, k);
    await cut(ctx, '/story/bot-wave.webp', 1500, 584, 232, k);
    await logo(ctx, 90, fy + (H - fy) / 2, 40, e.brand !== 'off');
  } else {
    script(ctx, hello, 68, 200, 120, PAPER);
    words(ctx, [['are you', PAPER]], 72, 350, 100);
    words(ctx, [['ready for', PAPER]], 72, 462, 100);
    words(ctx, [['the ', PAPER], ['future?', GOLD]], 72, 574, 100);
    board(ctx, label, rows, 1010, 48, 66);
    await cut(ctx, '/story/girl-phone.webp', 548, 1024, 372, k);
    await cut(ctx, '/story/boy-laptop.webp', 735, 1040, 356, k);
    await cut(ctx, '/story/bot-wave.webp', 920, 1034, 218, k);
    await logo(ctx, 72, fy + (H - fy) / 2, 48, e.brand !== 'off', 440);
  }
}

export async function thumb(canvas, e) {
  const x = derive(e), W = 600;
  canvas.width = canvas.height = W;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, W, W);
  floor(ctx, W, 430, W, 0.6, 0.45);
  ctx.textBaseline = 'alphabetic';
  ctx.font = '700 50px Syncopate';
  ctx.letterSpacing = '5px';
  ctx.textAlign = 'center';
  ctx.fillStyle = PAPER;
  ctx.fillText('FUTUREADY', W / 2 + 2.5, 112);
  ctx.letterSpacing = '0px';
  let size = 104;
  ctx.font = `400 ${size}px "Great Vibes"`;
  const word = x.virtual ? 'Virtual' : e.city || x.hello;
  while (ctx.measureText(word).width > 520 && size > 60) ctx.font = `400 ${(size -= 4)}px "Great Vibes"`;
  script(ctx, word, W / 2, 238, size, GOLD, 'center');
  await cut(ctx, '/story/girl-phone.webp', 182, 580, 300, 0.6);
  await cut(ctx, '/story/bot-wave.webp', 318, 574, 196, 0.6);
}

// partner logos side by side on a clear background (one logo works too)
function trim(i) {
  const c = document.createElement('canvas');
  c.width = i.width;
  c.height = i.height;
  const g = c.getContext('2d');
  g.drawImage(i, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < c.width; x++) {
      const p = (y * c.width + x) * 4;
      const ink = d[p + 3] > 12 && !(d[p] > 245 && d[p + 1] > 245 && d[p + 2] > 245);
      if (ink) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
  if (x1 <= x0 || y1 <= y0) return c;
  const o = document.createElement('canvas');
  o.width = x1 - x0 + 1;
  o.height = y1 - y0 + 1;
  o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
  return o;
}

export async function strip(canvas, files) {
  const pics = (await Promise.all(files.map(f => load(URL.createObjectURL(f))))).map(trim);
  const h = 120, gap = 80;
  const ws = pics.map(i => (i.width / i.height) * h);
  canvas.width = Math.max(1, Math.round(ws.reduce((a, b) => a + b, 0) + gap * (pics.length - 1)));
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  let x = 0;
  pics.forEach((i, n) => { ctx.drawImage(i, x, 0, ws[n], h); x += ws[n] + gap; });
  return { w: canvas.width, h };
}

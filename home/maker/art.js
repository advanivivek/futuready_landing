// Futuready page maker: the pictures (wide cover, square cover, thumbnail, partner-logo strip), drawn on a canvas
// with the main page's own fonts and cut-outs, so what you see is exactly what you download.
//
// Every element of a picture is a "part" (greeting, headline, date board, people, logo, partner logos, ...). Each part
// can be nudged and resized in the maker (drag it, then use the size slider); the nudges live in e.tweak[picture][part]
// as { x, y, s }. After drawing, canvas.__parts lists where each part sits, so the maker knows what you clicked.
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

// one part of a picture, drawn with its nudge (moved by x, y and resized by s around its own centre)
async function part(ctx, pic, name, label, box, draw) {
  const t = pic.tw[name] || {}, dx = +t.x || 0, dy = +t.y || 0, s = +t.s || 1;
  const [bx, by, bw, bh] = box, ax = bx + bw / 2, ay = by + bh / 2;
  ctx.save();
  ctx.translate(ax + dx, ay + dy);
  ctx.scale(s, s);
  ctx.translate(-ax, -ay);
  await draw();
  ctx.restore();
  pic.parts.push({ name, label, box: [ax + dx - (bw * s) / 2, ay + dy - (bh * s) / 2, bw * s, bh * s] });
}

function cutBox(i, x, bottom, h) {
  return [x, bottom - h, (i.width / i.height) * h, h];
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
// several cut-outs as one part: [src, x, bottom, h]
async function people(ctx, pic, list, k) {
  const boxes = await Promise.all(list.map(async ([src, x, b, h]) => cutBox(await load(src), x, b, h)));
  const x0 = Math.min(...boxes.map(b => b[0])), y0 = Math.min(...boxes.map(b => b[1]));
  const x1 = Math.max(...boxes.map(b => b[0] + b[2])), y1 = Math.max(...boxes.map(b => b[1] + b[3]));
  await part(ctx, pic, 'people', 'Characters', [x0, y0, x1 - x0, y1 - y0], async () => {
    for (const [src, x, b, h] of list) await cut(ctx, src, x, b, h, k);
  });
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// the split-flap board: a label and rows of letters, right-aligned at `right`
function boardBox(rows, right, top, f) {
  const cw = f * 0.78, chh = f * 1.08, gap = f * 0.08, pad = f * 0.1;
  const w = Math.max(...rows.map(r => r.length * cw + (r.length - 1) * gap + pad * 2));
  return [right - w, top, w, f * 0.55 + rows.length * (chh + pad * 2 + f * 0.14)];
}
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

// lines of the headline: each line is [[text, colour], ...]
function headBox(ctx, lines, x, y0, size, lead) {
  ctx.font = `700 ${size}px Unbounded`;
  ctx.letterSpacing = `${-size * 0.045}px`;
  const w = Math.max(...lines.map(l => l.reduce((a, [t]) => a + ctx.measureText(t).width, 0)));
  ctx.letterSpacing = '0px';
  return [x, y0 - size * 0.78, w, lead * (lines.length - 1) + size];
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

function scriptBox(ctx, text, x, y, size, align = 'left') {
  ctx.font = `400 ${size}px "Great Vibes"`;
  const w = ctx.measureText(text).width;
  return [align === 'center' ? x - w / 2 : x, y - size * 0.8, w, size * 1.05];
}
function script(ctx, text, x, y, size, color, align = 'left') {
  ctx.font = `400 ${size}px "Great Vibes"`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

// the H2S logo, and (unless turned off) a thin rule and FUTUREADY, its capitals exactly as tall as the logo
async function lockupSize(ctx, h, brand) {
  const i = await load('/h2s-logo.png'), r = i.width / i.height;
  if (!brand) return { w: r * h, per: r };
  ctx.font = '700 100px Syncopate';
  ctx.letterSpacing = '8px';
  const m = ctx.measureText('FUTUREADY');
  ctx.letterSpacing = '0px';
  const per = r + 1.15 + m.width / m.actualBoundingBoxAscent; // width for each unit of height
  return { w: per * h, per, asc: m.actualBoundingBoxAscent };
}
async function lockup(ctx, x, cy, h, brand) {
  const i = await load('/h2s-logo.png'), w = (i.width / i.height) * h;
  ctx.drawImage(i, x, cy - h / 2, w, h);
  if (!brand) return;
  const { asc } = await lockupSize(ctx, h, brand);
  const size = (100 * h) / asc, gap = h * 0.55;
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

const tweaks = (e, pic) => ({ tw: (e.tweak && e.tweak[pic]) || {}, parts: [] });
// the partner logos (a strip, already trimmed) for the covers, unless turned off
const coverLogos = e => (!e || e.kind === 'virtual' || e.coverLogos === 'off' ? '' : e.coverStrip || '');

export async function cover(canvas, e, wide) {
  const x = derive(e), [W, H] = wide ? [1800, 600] : [1080, 1080];
  const pic = tweaks(e, wide ? 'wide' : 'square');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d'), k = wide ? 1 : 1.2;
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, W, H);
  const fy = wide ? 468 : 830;
  floor(ctx, W, fy, H, k);
  const hello = x.hello ? `${x.hello},` : '';
  const [label, rows] = boardFor(e);
  const brand = e.brand !== 'off', strip = coverLogos(e);
  ctx.textBaseline = 'alphabetic';
  const L = wide
    ? { greet: [88, 160, 104], head: [[[['are you ready', PAPER]], [['for the ', PAPER], ['future?', GOLD]]], 90, 300, 92, 105], board: [1716, 52, 60],
        // with partner logos on the floor, the characters step a little right to make room for them
        people: [['/story/girl-phone.webp', 1080 + (strip ? 90 : 0), 578, 400], ['/story/boy-laptop.webp', 1262 + (strip ? 80 : 0), 590, 382], ['/story/bot-wave.webp', 1500 + (strip ? 70 : 0), 584, 232]],
        logo: [90, fy + (H - fy) / 2, strip ? 36 : 40, 940] }
    : { greet: [68, 200, 120], head: [[[['are you', PAPER]], [['ready for', PAPER]], [['the ', PAPER], ['future?', GOLD]]], 72, 350, 100, 112], board: [1010, 48, 66],
        people: [['/story/girl-phone.webp', 548, 1024, 372], ['/story/boy-laptop.webp', 735, 1040, 356], ['/story/bot-wave.webp', 920, 1034, 218]],
        logo: [72, strip ? fy + 82 : fy + (H - fy) / 2, 48, 440] };

  if (hello) {
    const [gx, gy, gs] = L.greet;
    await part(ctx, pic, 'greeting', 'Greeting', scriptBox(ctx, hello, gx, gy, gs), () => script(ctx, hello, gx, gy, gs, PAPER));
  }
  const [lines, hx, hy, hs, lead] = L.head;
  await part(ctx, pic, 'headline', 'Headline', headBox(ctx, lines, hx, hy, hs, lead), () => lines.forEach((l, j) => words(ctx, l, hx, hy + j * lead, hs)));
  const [br, bt, bf] = L.board;
  await part(ctx, pic, 'board', 'Date board', boardBox(rows, br, bt, bf), () => board(ctx, label, rows, br, bt, bf));
  await people(ctx, pic, L.people, k);

  // the logo, then (wide) the partner logos beside it, or (square) under it
  let [lx, ly, lh, maxW] = L.logo;
  const size = await lockupSize(ctx, lh, brand);
  if (brand && size.per * lh > maxW) lh = maxW / size.per;
  const lw = (await lockupSize(ctx, lh, brand)).w;
  await part(ctx, pic, 'logo', 'H2S logo', [lx, ly - lh / 2, lw, lh], () => lockup(ctx, lx, ly, lh, brand));
  if (strip) {
    const s = await load(strip), ph = wide ? 46 : 50, pw = (s.width / s.height) * ph;
    const [px, py] = wide ? [lx + lw + 56, ly - ph / 2] : [lx, ly + lh / 2 + 34];
    await part(ctx, pic, 'partners', 'Partner logos', [px, py, pw, ph], () => {
      if (wide) {
        ctx.fillStyle = 'rgba(22,26,58,.3)';
        ctx.fillRect(px - 30, ly - lh / 2, 2, lh);
      }
      ctx.drawImage(s, px, py, pw, ph);
    });
  }
  canvas.__parts = pic.parts;
}

export async function thumb(canvas, e) {
  const x = derive(e), W = 600, pic = tweaks(e, 'thumb');
  canvas.width = canvas.height = W;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, W, W);
  floor(ctx, W, 430, W, 0.6, 0.45);
  ctx.textBaseline = 'alphabetic';
  const campus = !x.virtual && e.thumbCampus !== 'off' ? (e.campus || '').trim() : '';
  // with the campus name everything sits a little higher and the characters a touch smaller
  const Y = campus ? { title: 96, city: 204, campus: 262, girl: [184, 586, 282], bot: [318, 580, 186] } : { title: 112, city: 238, girl: [182, 580, 300], bot: [318, 574, 196] };

  ctx.font = '700 50px Syncopate';
  ctx.letterSpacing = '5px';
  const tw = ctx.measureText('FUTUREADY').width;
  ctx.letterSpacing = '0px';
  await part(ctx, pic, 'title', 'FUTUREADY', [W / 2 - tw / 2, Y.title - 38, tw, 40], () => {
    ctx.font = '700 50px Syncopate';
    ctx.letterSpacing = '5px';
    ctx.textAlign = 'center';
    ctx.fillStyle = PAPER;
    ctx.fillText('FUTUREADY', W / 2 + 2.5, Y.title);
    ctx.letterSpacing = '0px';
  });

  let size = campus ? 96 : 104;
  const word = x.virtual ? 'Virtual' : e.city || x.hello;
  ctx.font = `400 ${size}px "Great Vibes"`;
  while (ctx.measureText(word).width > 520 && size > 60) ctx.font = `400 ${(size -= 4)}px "Great Vibes"`;
  await part(ctx, pic, 'city', 'City', scriptBox(ctx, word, W / 2, Y.city, size, 'center'), () => script(ctx, word, W / 2, Y.city, size, GOLD, 'center'));

  if (campus) {
    let cs = 30;
    const fit = () => {
      ctx.font = `700 ${cs}px Unbounded`;
      ctx.letterSpacing = `${cs * 0.02}px`;
      return ctx.measureText(campus.toUpperCase()).width;
    };
    while (fit() > 500 && cs > 16) cs -= 1;
    const cw = fit();
    ctx.letterSpacing = '0px';
    await part(ctx, pic, 'campus', 'Campus name', [W / 2 - cw / 2, Y.campus - cs * 0.8, cw, cs], () => {
      ctx.font = `700 ${cs}px Unbounded`;
      ctx.letterSpacing = `${cs * 0.02}px`;
      ctx.textAlign = 'center';
      ctx.fillStyle = PAPER;
      ctx.fillText(campus.toUpperCase(), W / 2, Y.campus);
      ctx.letterSpacing = '0px';
    });
  }
  await people(ctx, pic, [['/story/girl-phone.webp', ...Y.girl], ['/story/bot-wave.webp', ...Y.bot]], 0.6);
  canvas.__parts = pic.parts;
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

// the main page's link preview (og.jpg, 1200 x 630): what WhatsApp, LinkedIn, X and search results show.
// Made by scripts/brand.mjs; nothing in it changes per city.
export async function share(canvas) {
  const W = 1200, H = 630, fy = 486, pic = tweaks({}, 'share');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, W, H);
  floor(ctx, W, fy, H, 1, 0.8);
  ctx.textBaseline = 'alphabetic';
  const lines = [[['Are you ready', PAPER]], [['for the ', PAPER], ['future?', GOLD]]];
  await part(ctx, pic, 'headline', 'Headline', headBox(ctx, lines, 64, 148, 72, 84), () => lines.forEach((l, j) => words(ctx, l, 64, 148 + j * 84, 72)));
  // what a student gets, in plain words
  const notes = ['› Free AI bootcamp for college students', '› Spec writing, AI evals, AI agents', '› An e-passport at the end'];
  ctx.font = '700 25px "Geist Mono"';
  ctx.textAlign = 'left';
  notes.forEach((t, j) => {
    ctx.fillStyle = 'rgba(255,252,245,.9)';
    ctx.fillText(t, 66, 316 + j * 40);
  });
  ctx.font = '700 25px "Geist Mono"';
  ctx.fillStyle = GOLD;
  ctx.fillText('futuready.hack2skill.com', 66, 444);
  await people(ctx, pic, [['/story/girl-phone.webp', 700, 600, 410], ['/story/boy-laptop.webp', 872, 612, 392], ['/story/bot-wave.webp', 1046, 606, 236]], 1);
  const lh = 32, { w } = await lockupSize(ctx, lh, true);
  await part(ctx, pic, 'logo', 'H2S logo', [64, 558 - lh / 2, w, lh], () => lockup(ctx, 64, 558, lh, true));
  canvas.__parts = pic.parts;
}

import { LEVELS } from './data';

const TILT = [-14, 9, -6, 12, -9];
const SANS = '"Geist Variable", system-ui, sans-serif';
const MONO = '"Geist Mono Variable", ui-monospace, monospace';

export const mrzName = name =>
  (name.trim().toUpperCase().replace(/[^A-Z ]/g, '').replace(/\s+/g, '<') || 'READY<PLAYER<YOU').slice(0, 22);

function stamp(x, lv, r) {
  x.globalAlpha = 0.9;
  x.strokeStyle = lv.color;
  x.fillStyle = lv.color;
  x.lineWidth = r * 0.06;
  x.beginPath();
  x.arc(0, 0, r, 0, Math.PI * 2);
  x.stroke();
  x.lineWidth = r * 0.025;
  x.beginPath();
  x.arc(0, 0, r * 0.66, 0, Math.PI * 2);
  x.stroke();
  x.font = `800 ${r * 0.7}px ${SANS}`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(lv.k, 0, r * 0.04);
  const ring = `FUTUREADY · EPISODE 01 · ${lv.name.toUpperCase()} · `;
  x.font = `600 ${r * 0.15}px ${MONO}`;
  const step = (Math.PI * 2) / ring.length;
  [...ring].forEach((ch, j) => {
    x.save();
    x.rotate(j * step);
    x.fillText(ch, 0, -r * 0.83);
    x.restore();
  });
  x.globalAlpha = 1;
}

/* The pass, 720 x 1000, as a canvas. */
export async function paintPass(name) {
  await document.fonts?.ready;
  const W = 720;
  const H = 1000;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');

  const paper = x.createLinearGradient(0, 0, W, H);
  paper.addColorStop(0, '#f7f0e2');
  paper.addColorStop(1, '#e8dcc6');
  x.fillStyle = paper;
  x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(52,99,175,0.09)';
  x.lineWidth = 1.5;
  for (let r = 30; r < 1300; r += 18) {
    x.beginPath();
    x.arc(W + 60, H + 80, r, 0, Math.PI * 2);
    x.stroke();
  }

  const band = x.createLinearGradient(0, 0, W, 0);
  ['#3463af', '#2f3a96', '#3c1b7e', '#1d1236'].forEach((col, i) => band.addColorStop(i / 3, col));
  x.fillStyle = band;
  x.fillRect(0, 0, W, 110);
  x.fillStyle = '#fff';
  x.textBaseline = 'middle';
  x.font = `600 32px ${SANS}`;
  x.fillText('Futuready pass', 44, 56);
  x.font = `500 22px ${MONO}`;
  x.textAlign = 'right';
  x.fillText('Hack2skill', W - 44, 56);
  x.textAlign = 'left';

  // the holder's "photo": the orb they charged
  const ph = { x: 44, y: 150, w: 210, h: 262 };
  x.save();
  x.beginPath();
  x.roundRect(ph.x, ph.y, ph.w, ph.h, 22);
  x.clip();
  x.fillStyle = '#05060f';
  x.fillRect(ph.x, ph.y, ph.w, ph.h);
  const cx = ph.x + ph.w / 2;
  const cy = ph.y + ph.h / 2;
  const glow = x.createRadialGradient(cx, cy, 6, cx, cy, 120);
  glow.addColorStop(0, '#ffffff');
  glow.addColorStop(0.25, '#5fd4ff');
  glow.addColorStop(0.55, '#3463af');
  glow.addColorStop(0.85, 'rgba(60,27,126,0.55)');
  glow.addColorStop(1, 'rgba(5,6,15,0)');
  x.fillStyle = glow;
  x.fillRect(ph.x, ph.y, ph.w, ph.h);
  x.strokeStyle = 'rgba(255,255,255,0.4)';
  x.lineWidth = 2;
  x.beginPath();
  x.arc(cx, cy, 86, 0, Math.PI * 2);
  x.stroke();
  x.restore();

  const fx = ph.x + ph.w + 36;
  const maxW = W - fx - 40;
  const rows = [
    ['Holder', name.trim() || 'Ready Player You', 46],
    ['Edition', 'Builders Lab 01', 28],
    ['Issued by', 'Hack2skill', 28],
    ['Valid', 'From today, for life', 28],
  ];
  let fy = ph.y + 14;
  rows.forEach(([k, v, size]) => {
    x.fillStyle = 'rgba(27,31,59,0.55)';
    x.font = `500 18px ${MONO}`;
    x.fillText(k, fx, fy);
    x.fillStyle = '#1b1f3b';
    x.font = `${size > 40 ? 720 : 620} ${size}px ${SANS}`;
    let text = v;
    while (x.measureText(text).width > maxW && text.length > 3) text = text.slice(0, -2);
    if (text !== v) text = text.trimEnd() + '…';
    x.fillText(text, fx, fy + size * 0.5 + 20);
    fy += size + 46;
  });

  const pos = [
    [0.2, 0],
    [0.5, 0],
    [0.8, 0],
    [0.35, 1],
    [0.65, 1],
  ];
  LEVELS.forEach((lv, i) => {
    x.save();
    x.translate(W * pos[i][0], 540 + pos[i][1] * 190);
    x.rotate((TILT[i] * Math.PI) / 180);
    stamp(x, lv, 84);
    x.restore();
  });

  x.fillStyle = 'rgba(27,31,59,0.72)';
  x.font = `500 22px ${MONO}`;
  x.textBaseline = 'alphabetic';
  x.fillText(`P<FUTUREADY<<${mrzName(name)}`.padEnd(40, '<'), 44, H - 74);
  x.fillText('R<E<A<D<Y<<HACK2SKILL<<<<<<<<<<<<<2031', 44, H - 38);
  return c;
}

/* Instagram-portrait picture (1080 x 1350) with the pass on the night sky, for saving or sharing. */
export async function sharePass(name) {
  const card = await paintPass(name);
  const W = 1080;
  const H = 1350;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#05060f';
  x.fillRect(0, 0, W, H);
  const g = x.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 700);
  g.addColorStop(0, 'rgba(50,183,236,0.45)');
  g.addColorStop(0.5, 'rgba(52,99,175,0.25)');
  g.addColorStop(1, 'rgba(5,6,15,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  const cw = 720;
  const ch = 1000;
  x.save();
  x.translate(W / 2, H / 2 - 20);
  x.rotate(-0.03);
  x.shadowColor = 'rgba(0,0,0,0.6)';
  x.shadowBlur = 60;
  x.shadowOffsetY = 30;
  x.beginPath();
  x.roundRect(-cw / 2, -ch / 2, cw, ch, 32);
  x.clip();
  x.drawImage(card, -cw / 2, -ch / 2);
  x.restore();
  x.fillStyle = 'rgba(243,245,255,0.6)';
  x.font = `500 24px ${MONO}`;
  x.textAlign = 'center';
  x.fillText('Futuready by Hack2skill', W / 2, H - 50);

  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  const file = new File([blob], 'futuready-pass.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'My Futuready pass' });
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

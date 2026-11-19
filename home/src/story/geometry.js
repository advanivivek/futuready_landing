/*
  Line drawings for the trainer's wall: the five Platonic solids, a Klein bottle and a Poincaré disk
  (non-Euclidean geometry), turning slowly as you scroll. Returns SVG path strings in pixels.
*/
const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;

function solid(verts) {
  const r = Math.hypot(...verts[0]);
  const v = verts.map(p => p.map(c => c / r));
  let min = Infinity;
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) min = Math.min(min, Math.hypot(v[i][0] - v[j][0], v[i][1] - v[j][1], v[i][2] - v[j][2]));
  const edges = [];
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) if (Math.hypot(v[i][0] - v[j][0], v[i][1] - v[j][1], v[i][2] - v[j][2]) < min * 1.01) edges.push([i, j]);
  return { v, edges };
}
const signs = n => Array.from({ length: 1 << n }, (_, m) => Array.from({ length: n }, (_, i) => (m >> i) & 1 ? -1 : 1));
const g = 1 / PHI;
export const SOLIDS = {
  tetra: solid([
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ]),
  cube: solid(signs(3)),
  octa: solid([
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ]),
  ico: solid(signs(2).flatMap(([a, b]) => [[0, a, b * PHI], [a, b * PHI, 0], [a * PHI, 0, b]])),
  dodeca: solid([...signs(3), ...signs(2).flatMap(([a, b]) => [[0, a * g, b * PHI], [a * g, b * PHI, 0], [a * PHI, 0, b * g]])]),
};

const rot = ([x, y, z], ax, ay) => {
  const x1 = x * Math.cos(ay) + z * Math.sin(ay);
  const z1 = -x * Math.sin(ay) + z * Math.cos(ay);
  return [x1, y * Math.cos(ax) - z1 * Math.sin(ax)];
};

export function solidPath({ v, edges }, cx, cy, size, ax, ay) {
  const p = v.map(q => rot(q, ax, ay));
  return edges.map(([i, j]) => `M${(cx + p[i][0] * size).toFixed(1)} ${(cy - p[i][1] * size).toFixed(1)}L${(cx + p[j][0] * size).toFixed(1)} ${(cy - p[j][1] * size).toFixed(1)}`).join('');
}

// the classic "bottle" Klein bottle, as rings and a few lines along it
function klein(u, v) {
  const cu = Math.cos(u);
  const su = Math.sin(u);
  const cv = Math.cos(v);
  const x = (-2 / 15) * cu * (3 * cv - 30 * su + 90 * cu ** 4 * su - 60 * cu ** 6 * su + 5 * cu * cv * su);
  const y = (-1 / 15) * su * (3 * cv - 3 * cu ** 2 * cv - 48 * cu ** 4 * cv + 48 * cu ** 6 * cv - 60 * su + 5 * cu * cv * su - 5 * cu ** 3 * cv * su - 80 * cu ** 5 * cv * su + 80 * cu ** 7 * cv * su);
  const z = (2 / 15) * (3 + 5 * cu * su) * Math.sin(v);
  return [x, y, z];
}
const KLEIN = (() => {
  const lines = [];
  for (let i = 0; i < 15; i++) lines.push(Array.from({ length: 25 }, (_, j) => klein(((i + 0.5) / 15) * Math.PI, (j / 24) * TAU)));
  for (let i = 0; i < 6; i++) lines.push(Array.from({ length: 49 }, (_, j) => klein((j / 48) * Math.PI, (i / 6) * TAU)));
  const all = lines.flat();
  const lo = [0, 1, 2].map(k => Math.min(...all.map(p => p[k])));
  const hi = [0, 1, 2].map(k => Math.max(...all.map(p => p[k])));
  const c = lo.map((l, k) => (l + hi[k]) / 2);
  const r = Math.max(...hi.map((h, k) => h - lo[k])) / 2;
  return lines.map(l => l.map(p => p.map((q, k) => (q - c[k]) / r)));
})();

export function kleinPath(cx, cy, size, ax, ay) {
  return KLEIN.map(l => 'M' + l.map(q => {
    const [x, y] = rot(q, ax, ay);
    return `${(cx + x * size).toFixed(1)} ${(cy - y * size).toFixed(1)}`;
  }).join('L')).join('');
}

// straight lines of the hyperbolic plane, drawn in the Poincaré disk: arcs meeting its edge at right angles
function geodesic(cx, cy, R, a, b) {
  let d = (((b - a) % TAU) + TAU) % TAU;
  if (d > Math.PI) [a, d] = [b, TAU - d];
  const m = a + d / 2;
  const ox = cx + (R / Math.cos(d / 2)) * Math.cos(m);
  const oy = cy + (R / Math.cos(d / 2)) * Math.sin(m);
  const r = R * Math.tan(d / 2);
  const t1 = Math.atan2(cy + R * Math.sin(a) - oy, cx + R * Math.cos(a) - ox);
  let dt = Math.atan2(cy + R * Math.sin(a + d) - oy, cx + R * Math.cos(a + d) - ox) - t1;
  while (dt > Math.PI) dt -= TAU;
  while (dt < -Math.PI) dt += TAU;
  return 'M' + Array.from({ length: 21 }, (_, i) => `${(ox + r * Math.cos(t1 + (dt * i) / 20)).toFixed(1)} ${(oy + r * Math.sin(t1 + (dt * i) / 20)).toFixed(1)}`).join('L');
}

export function diskPath(cx, cy, R, turn) {
  const out = [];
  for (let k = 0; k < 7; k++) {
    const a = turn + (k * TAU) / 7;
    out.push(geodesic(cx, cy, R, a, a + (2 * TAU) / 7), geodesic(cx, cy, R, a, a + (3 * TAU) / 7));
  }
  for (let k = 0; k < 14; k++) {
    const a = -turn * 0.5 + (k * TAU) / 14;
    out.push(geodesic(cx, cy, R, a, a + TAU / 14));
  }
  return out.join('');
}

// banknote-style lines, for the back of the passport scene (a 1000 x 1000 box, stretched): two even sets of
// waves, half a wave apart, so they weave into a calm rope pattern
export const GUILLOCHE = [0, Math.PI].map(shift =>
  Array.from({ length: 28 }, (_, k) => {
    const pts = [];
    for (let x = -20; x <= 1020; x += 8) pts.push(`${x} ${(18 + k * 36 + 13 * Math.sin((x / 250) * TAU + k * 0.42 + shift)).toFixed(1)}`);
    return 'M' + pts.join('L');
  }).join('')
);

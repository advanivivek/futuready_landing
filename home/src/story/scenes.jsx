import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { arc, back, Cut, inout, lerp, Lines, Note, out, pick, poke, Rows, seg, Typed } from './kit';
import { sound } from './sound';
import { diskPath, GUILLOCHE, kleinPath, SOLIDS, solidPath } from './geometry';
import { LEVELS, SUPPORT, TRAINER, TV_SCREENS, VIRTUAL_URL, VOICES_FULL } from '../data';
import { ShareButton } from './Extras';
import { pic, storyPic } from './pics';

/*
  Every scene:
    wall, floor, F (floor height, 0 for none), ink (text colour)
    rest   when everything is on the scene (s, in screens). The scroll then gets heavy for a moment, so the
           scene can be looked at before it moves on. Scenes without rest have a fixed len.
    after  how much happens after that pause, before the next scene comes in (default 0.12)
    enter  how this scene arrives over the last one: { type, T (screens), at (where, for iris and tv) }
    cam    (s, k) => { z, x, y }  zoom and where it zooms into (fractions of the stage)
    cues   [[s, sound], ...]      sounds as you scroll forward past s
    world  (s, k) => the set: people, robots, props (moves with the camera)
    ui     (s, k) => the words (stay sharp and still)
  s is how far into the scene you are, in screens. k has W, H, land, F, the cities, jump, and
  after0 (when the pause ends).
*/

// pictures live in public/ (see pics.js: on the live site they arrive in a few files, not one by one)
const A = storyPic;
const CREAM = '#efe6d2';
const INK = '#161a3a';
const BLUE = '#3463af';
const INDIGO = '#2f3a96';
const NIGHT = '#232c6e';

function Letter({ k, s, color }) {
  const rise = out(seg(s, 0, 0.55));
  return (
    <div className="letter-box" aria-hidden="true">
      <div className="letter" style={{ color, transform: `translateY(${(1 - rise) * 105}%)` }}>
        {k}
      </div>
    </div>
  );
}

function Floaters({ items, s, on, x, y, spread = 30, rise, speed = 0.9, className }) {
  return items.map((g, j) => {
    const f = (((s * speed + j / items.length) % 1) + 1) % 1;
    return (
      <span
        key={j}
        className={`floater ${className || ''}`}
        aria-hidden="true"
        style={{
          opacity: on * Math.sin(f * Math.PI),
          transform: `translate3d(${(x + Math.sin(j * 2.3) * spread).toFixed(1)}px, ${(-(y + f * rise)).toFixed(1)}px, 0) translateX(-50%) rotate(${Math.sin(j) * 14}deg) scale(${0.8 + f * 0.4})`,
        }}
      >
        {g}
      </span>
    );
  });
}

function LevelLines({ i, s, a, b }) {
  const lv = LEVELS[i];
  return (
    <Lines fit className="lines--level">
      <p className="level-label" style={{ opacity: seg(s, 0.04, 0.25) }}>
        <i style={{ background: lv.color }} aria-hidden="true" />
        Level {i + 1} • {lv.name}
      </p>
      <Rows rows={a} p={seg(s, 0.15, 0.62)} />
      <div className="learn">
        <Rows rows={b} p={seg(s, 0.72, 1.16)} />
      </div>
    </Lines>
  );
}

const enterL = (s, a, b, W) => (1 - out(seg(s, a, b))) * -W * 0.6;
const enterR = (s, a, b, W) => (1 - out(seg(s, a, b))) * W * 0.6;

/* ---------- the opening: where her phone is, so 2031 can open out of it ---------- */
const HERO = { F: 0.24, girl: { x: [0.27, 0.58], h: [0.37, 0.58], d: 0.08 }, cam: { z: 1.07, x: 0.5, y: 0.72 } };
function heroPhone({ W, H, land }) {
  const g = HERO.girl;
  const h = pick(g.h, land) * H;
  const top = H - (HERO.F - g.d) * H - h;
  const p = { x: pick(g.x, land) * W - W * 0.03, y: top + 0.225 * h };
  const o = { x: HERO.cam.x * W, y: HERO.cam.y * H };
  return { x: o.x + (p.x - o.x) * HERO.cam.z, y: o.y + (p.y - o.y) * HERO.cam.z, r0: 0, zoom: 2.4 };
}

/* ---------- "you?": its dot drops down a dotted line and opens the next scene ---------- */
const YOU_F = 0.24;
const dotEnd = ({ W, H }) => ({ x: W * 0.5, y: H * (1 - YOU_F + 0.075), r: Math.max(9, Math.min(W, H) * 0.028) });

// where the dot of a "?" sits in a font, measured once from a canvas
const glyphs = {};
function questionDot(font, size) {
  const key = `${font}|${size}`;
  if (glyphs[key]) return glyphs[key];
  const w = Math.ceil(size * 1.2);
  const h = Math.ceil(size * 1.6);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.font = font;
  const base = Math.round(size * 1.2);
  x.fillText('?', 0, base);
  const ascent = x.measureText('?').fontBoundingBoxAscent ?? size * 0.95;
  const d = x.getImageData(0, 0, w, h).data;
  const ink = y => {
    let a = w;
    let b = -1;
    for (let i = 0; i < w; i++) {
      if (d[(y * w + i) * 4 + 3] > 110) {
        a = Math.min(a, i);
        b = i;
      }
    }
    return b >= 0 ? [a, b] : null;
  };
  let y = h - 1;
  while (y > 0 && !ink(y)) y--;
  const bottom = y;
  let l = w;
  let r = 0;
  for (let row = ink(y); y > 0 && row; row = ink(--y)) {
    l = Math.min(l, row[0]);
    r = Math.max(r, row[1]);
  }
  const res = { cx: (l + r + 1) / 2, cy: (y + 1 + bottom + 1) / 2 - base, r: (bottom - y) / 2, gap: y + 1 - base, ascent };
  glyphs[key] = res;
  return res;
}

function You({ s, k }) {
  const wrap = useRef(null);
  const word = useRef(null);
  const q = useRef(null);
  const [m, setM] = useState(null);
  useLayoutEffect(() => {
    const measure = () => {
      const el = q.current;
      const you = word.current;
      if (!el || !you) return;
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize);
      const g = questionDot(`${cs.fontWeight} ${size}px ${cs.fontFamily}`, size);
      // the word's place in the scene, ignoring its pop-in scale
      let ox = 0;
      let oy = 0;
      for (let n = you; n && !n.classList.contains('scene'); n = n.offsetParent) {
        ox += n.offsetLeft;
        oy += n.offsetTop;
      }
      // the crowd photo fills the word like background-size: cover at 40% 45%; the dot takes its piece with it
      const bw = you.offsetWidth;
      const bh = you.offsetHeight;
      const sc = Math.max(bw / 1400, bh / 934);
      setM({ x: el.offsetLeft + g.cx, y: el.offsetTop + g.ascent + g.cy, r: g.r, ox, oy, bg: { w: 1400 * sc, h: 934 * sc, x: (bw - 1400 * sc) * 0.4, y: (bh - 934 * sc) * 0.45 } });
    };
    measure();
    let alive = true;
    document.fonts?.ready.then(() => alive && measure());
    addEventListener('resize', measure);
    return () => {
      alive = false;
      removeEventListener('resize', measure);
    };
  }, [k.W, k.H]);

  const pop = seg(s, 0.5, 0.7);
  const t = inout(seg(s, k.after0, k.after0 + 0.5));
  const end = dotEnd(k);
  let path = null;
  if (m && t > 0) {
    const p0 = { x: m.ox + m.x, y: m.oy + m.y };
    const p1 = { x: p0.x - k.W * 0.34, y: p0.y + k.H * 0.06 };
    const p2 = { x: end.x, y: end.y - k.H * 0.32 };
    const at = u => {
      const v = 1 - u;
      return {
        x: v * v * v * p0.x + 3 * v * v * u * p1.x + 3 * v * u * u * p2.x + u * u * u * end.x,
        y: v * v * v * p0.y + 3 * v * v * u * p1.y + 3 * v * u * u * p2.y + u * u * u * end.y,
      };
    };
    const n = 18;
    path = { head: at(t), r: lerp(m.r, end.r, seg(t, 0.75, 1)), ink: seg(t, 0.05, 0.45), trail: Array.from({ length: Math.floor(t * n) }, (_, j) => at((j + 0.5) / n)) };
  }
  // once the dot has left, the word keeps a hole where it was
  const hole = path ? `radial-gradient(circle at ${m.x}px ${m.y}px, transparent ${m.r + 1.5}px, #000 ${m.r + 2}px)` : undefined;
  return (
    <>
      <Lines className="lines--you">
        <Typed text="So what’s left for" p={seg(s, 0.1, 0.5)} className="line" />
        <span ref={wrap} className="you-wrap" aria-hidden="true" style={{ opacity: pop, transform: `scale(${lerp(0.6, 1, back(seg(s, 0.5, 1.0)))})` }}>
          <span ref={word} className="you" style={{ WebkitMaskImage: hole, maskImage: hole }}>
            you<span ref={q}>?</span>
          </span>
        </span>
        <span className="sr-only">you?</span>
      </Lines>
      {path ? (
        <div className="trail" aria-hidden="true">
          {path.trail.map((p, j) => (
            <i key={j} style={{ transform: `translate3d(${p.x}px, ${p.y}px, 0)` }} />
          ))}
          <i
            className="qdot"
            style={{
              width: path.r * 2,
              height: path.r * 2,
              transform: `translate3d(${path.head.x}px, ${path.head.y}px, 0)`,
              backgroundSize: `${m.bg.w}px ${m.bg.h}px`,
              backgroundPosition: `${m.bg.x - (m.x - path.r)}px ${m.bg.y - (m.y - path.r)}px`,
              boxShadow: `inset 0 0 0 ${path.r + 1}px rgba(35, 44, 110, ${path.ink})`,
            }}
          />
        </div>
      ) : null}
    </>
  );
}

/* ---------- the trainer ---------- */
// standing poses only (tap him for the next). k: how much taller the picture is than he is (a chair, a raised foot),
// so he is the same size in every one. a: width / height of the picture.
const POSES = [
  { src: 'vivek-dance', a: 443 / 1022, k: 1.03 },
  { src: 'vivek-kick', a: 692 / 986, k: 1.05 },
  { src: 'vivek-walk', a: 343 / 1022, k: 1 },
  { src: 'vivek-step', a: 287 / 1002, k: 1.3 },
  { src: 'vivek-chair', a: 715 / 1022, k: 1.33 },
  { src: 'vivek-lean', a: 341 / 1010, k: 1.06 },
];
const POSE_H = [0.45, 0.56];
const POSE_D = [0.11, 0.06];
// cream, red, blue and yellow label tape (cream and yellow take dark letters)
const TAPE = ['#fffcf5', '#c8312f', '#1a6fc0', '#f2b230'];

// where the drawings sit on the wall: [x, y, size] as fractions of the stage width / height, [portrait, landscape]
const ART = {
  disk: [[0.5, 0.57, 0.44], [0.66, 0.55, 0.22]],
  ico: [[0.85, 0.4, 0.085], [0.88, 0.3, 0.05]],
  dodeca: [[0.15, 0.45, 0.085], [0.44, 0.5, 0.045]],
  klein: [[0.16, 0.7, 0.13], [0.2, 0.68, 0.075]],
  cube: [[0.87, 0.68, 0.06], [0.9, 0.68, 0.032]],
  tetra: [[0.1, 0.9, 0.05], [0.07, 0.88, 0.03]],
  octa: [[0.9, 0.9, 0.05], [0.95, 0.88, 0.03]],
};

function Geometry({ s, k }) {
  const { W, H, land } = k;
  const a = s * 0.9;
  const at = id => {
    const [x, y, z] = ART[id][land ? 1 : 0];
    return [x * W, y * H, z * W];
  };
  const [dx, dy, dr] = at('disk');
  const solids = ['ico', 'dodeca', 'cube', 'tetra', 'octa'].map((id, i) => {
    const [x, y, z] = at(id);
    return solidPath(SOLIDS[id], x, y, z, 0.5 + a * (0.6 + i * 0.1), a * (0.8 - i * 0.07) + i);
  });
  const [kx, ky, kz] = at('klein');
  return (
    <svg className="geo" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <circle cx={dx} cy={dy} r={dr} className="geo__disk" />
      <path d={diskPath(dx, dy, dr, s * 0.3)} className="geo__disk" />
      <path d={solids.join('')} className="geo__solid" />
      <path d={kleinPath(kx, ky, kz, 0.35, a * 0.7)} className="geo__klein" />
    </svg>
  );
}

function Trainer({ s, k }) {
  const { W, H, land, F } = k;
  const [n, setN] = useState(0);
  const x = land ? 0.66 : 0.5;
  const rise = out(seg(s, 0.15, 0.6));
  const fig = POSES[n];
  const h = pick(POSE_H, land) * fig.k * H;
  const w = h * fig.a;
  const cx = x * W;
  const top = H - (F - pick(POSE_D, land)) * H - h;
  const next = e => {
    poke(e);
    setN(i => (i + 1) % POSES.length);
  };
  // the labels run down both sides of him, alternating, between the words above and the floor
  const labels = TRAINER.labels;
  const maxW = land ? 240 : 132;
  const bandTop = Math.max(top + 0.05 * h, H * (land ? 0.3 : 0.37));
  const bandBot = H * (1 - F) - (land ? 34 : 26);
  const step = (bandBot - bandTop) / Math.max(1, labels.length - 1);
  return (
    <>
      <Geometry s={s} k={k} />
      {POSES.map((p, i) => (
        <Cut
          key={p.src}
          src={A(p.src)}
          alt={i === n ? 'Vivek Advani, your trainer. Tap for another photo.' : ''}
          x={x}
          h={POSE_H.map(v => v * p.k)}
          d={POSE_D}
          dy={(1 - rise) * -H * 0.2}
          o={i === n ? rise : 0}
          z={i === n ? 3 : 2}
          className="pose"
          sfx="shutter"
          onClick={next}
          style={{ pointerEvents: i === n ? 'auto' : 'none' }}
        />
      ))}
      {labels.map((txt, j) => {
        const side = j % 2 ? 1 : -1;
        const edge = side < 0 ? Math.max(cx - w * 0.28, 16 + maxW) : Math.min(cx + w * 0.28, W - 16 - maxW);
        const a = 0.55 + j * 0.09;
        return (
          <span
            key={txt}
            className={`tape ${j % 4 === 0 || j % 4 === 3 ? 'tape--light' : ''}`}
            style={{
              top: bandTop + j * step,
              [side < 0 ? 'right' : 'left']: side < 0 ? W - edge : edge,
              maxWidth: maxW,
              background: TAPE[j % 4],
              opacity: seg(s, a, a + 0.05),
              transform: `translateY(-50%) scale(${back(seg(s, a, a + 0.18))}) rotate(${[-3, 2.5, -2, 3, -2.5, 2][j % 6]}deg)`,
            }}
          >
            {txt}
          </span>
        );
      })}
    </>
  );
}

/* ---------- the station board ---------- */
const coachTag = c => (c.status === 'past' ? '' : c.status === 'open' ? 'Open' : 'Soon');
const stationTag = c => (c.status === 'past' ? c.campus : c.status === 'open' ? 'Registrations open' : 'Boarding soon');
const MONTH = /^(\d{1,2})\s+([A-Za-z]{3})/;
// the board: the day above, the month below (or -- / TBA before a date is set)
function boardRows(c) {
  const m = MONTH.exec(c.date || '');
  if (m) return [m[1].padStart(2, '0'), m[2].toUpperCase()];
  return ['--', c.status === 'open' ? 'NOW' : 'TBA'];
}

function Flaps({ c, o }) {
  const rows = boardRows(c);
  const key = rows.join(' ');
  const first = useRef(true);
  useEffect(() => {
    if (first.current) first.current = false;
    else sound.play('flap');
  }, [key]);
  return (
    <div className="flaps" style={{ opacity: o }} aria-label={c.date ? `${c.status === 'past' ? 'Concluded' : 'Departs'} ${c.date}` : stationTag(c)} role="text">
      <small aria-hidden="true">{c.status === 'past' ? 'Concluded' : 'Departs'}</small>
      {rows.map((r, j) => (
        <div key={j} aria-hidden="true">
          {[...r].map((ch, i) => (
            <span key={`${i}${ch}`} className="flap" style={{ animationDelay: `${(j * 2 + i) * 50}ms` }}>
              {ch}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

// the room left of the station board, and the city's name as big as it can be in it
function stationRoom({ W, land }) {
  const wide = land && W >= 760;
  const gutter = wide ? Math.max(48, W * 0.04) : 28;
  const flap = wide ? Math.min(Math.max(W * 0.036, 28.8), 57.6) : Math.min(Math.max(W * 0.07, 24), 41.6);
  return W - 2 * gutter - (3 * (flap * 1.05 + 3) + 14) - 20;
}
function stationSize(city, k) {
  const base = k.land && k.W >= 760 ? Math.min(Math.max(k.W * 0.064, 48), 102) : Math.min(Math.max(k.W * 0.13, 41.6), 96);
  return Math.min(base, stationRoom(k) / (city.length * 0.74));
}

/* ---------- the goodbye: three of them, centred together ---------- */
// on phones they stand a little smaller, under the two buttons and the share link
const END = [
  { src: 'girl-phone', a: 280 / 866, h: [0.31, 0.5], d: 0.1, alt: 'The two friends and a robot, waving goodbye' },
  { src: 'boy-wave', a: 338 / 782, h: [0.31, 0.5], d: 0.09, alt: '' },
  { src: 'bot-wave', a: 410 / 802, h: [0.235, 0.36], d: 0.1, alt: '' },
];
// short phones (iPhone SE) have less room under the buttons
const endScale = ({ H, land }) => (!land && H < 620 ? 0.8 : 1);
function endRow({ W, H, land }) {
  const ws = END.map(p => p.a * pick(p.h, land) * endScale({ H, land }) * H);
  const gap = -0.04 * Math.min(ws[0], ws[1]);
  const total = ws.reduce((a, b) => a + b, 0) + gap * 2;
  let left = (land ? 0.68 : 0.5) * W - total / 2;
  return ws.map(w => {
    const c = left + w / 2;
    left += w + gap;
    return c / W;
  });
}

/* ---------- the scenes ---------- */
export const SCENES = [
  /* 0. the question */
  {
    id: 'title',
    len: 1.9,
    wall: BLUE,
    floor: CREAM,
    F: HERO.F,
    ink: CREAM,
    cam: s => ({ z: 1 + (HERO.cam.z - 1) * inout(seg(s, 0, 1.4)), x: HERO.cam.x, y: HERO.cam.y }),
    world: (s, { W, land }) => {
      const go = seg(s, 0.2, 1.2);
      return (
        <>
          <Cut src={A('girl-phone')} alt="A student in a mustard hoodie looks at her phone" x={HERO.girl.x} h={HERO.girl.h} d={HERO.girl.d} dx={-go * W * 0.03} priority="high" className="rise" style={{ '--d': '0.3s' }} />
          <Cut src={A('boy-laptop')} alt="Her friend types on a laptop" x={[0.58, 0.73]} h={[0.355, 0.56]} d={0.05} dx={go * W * 0.03} className="rise" style={{ '--d': '0.45s' }} />
          <Cut src={A('bot-stand')} alt="A tin robot peeks in" x={[0.85, 0.88]} h={[0.2, 0.3]} d={0.03} dx={(1 - out(seg(s, 0.05, 0.7))) * W * (land ? 0.08 : 0.18)} r={-8 + 8 * seg(s, 0.05, 0.7)} />
        </>
      );
    },
    ui: s => (
      <div className="title" style={{ transform: `translateY(${-seg(s, 0.2, 1.0) * 40}px)`, opacity: 1 - seg(s, 0.6, 1.0) }}>
        <h1 className="display">
          <span className="rise" style={{ '--d': '0.1s' }}>
            Are you ready
          </span>
          <span className="rise" style={{ '--d': '0.22s' }}>
            for the <em>future?</em>
          </span>
        </h1>
        <div className="notes rise" style={{ '--d': '0.5s' }}>
          <p>› A campus builder lab by H2S</p>
          <p>› Now touring India</p>
        </div>
      </div>
    ),
  },

  /* 1. 2031: opens out of her phone, on one robot's keyboard, then pulls back to a room of them */
  {
    id: 'y2031',
    rest: 1.45,
    wall: CREAM,
    floor: BLUE,
    F: 0.26,
    ink: INK,
    enter: { type: 'iris', T: 0.9, at: heroPhone },
    cues: [
      [0.45, 'boop'],
      [0.62, 'boop'],
    ],
    cam: (s, { F }) => ({ z: lerp(2.3, 1, inout(seg(s, 0.05, 1.0))), x: 0.5, y: 1 - F - 0.08 }),
    world: (s, { W, H, land, F }) => {
      const xs = land ? [0.38, 0.5, 0.62] : [0.2, 0.5, 0.8];
      const bh = (land ? 0.27 : 0.23) * H;
      const typing = seg(s, 0.15, 0.4);
      return (
        <>
          <div className="year" aria-hidden="true" style={{ opacity: 0.9 * seg(s, 0.3, 0.8) }}>
            2031
          </div>
          {xs.map((x, i) => {
            const enter = i === 1 ? 1 : out(seg(s, 0.4 + (i ? 0.12 : 0), 0.95 + (i ? 0.12 : 0)));
            return (
              <div key={i}>
                <Cut src={A('bot-type')} alt={i === 1 ? 'Tin robots typing on laptops' : ''} x={x} h={land ? 0.27 : 0.23} d={0.09} dx={(1 - enter) * (i ? W : -W) * 0.7} dy={-Math.abs(Math.sin(s * 40 + i)) * 2 * typing} />
                <Floaters items={['{ }', '</>', '01', '=>', 'fn()', '[ ]']} s={s + i * 0.21} on={typing * enter} x={x * W + bh * 0.12} y={(F - 0.09) * H + bh * 0.7} rise={H * 0.2} spread={22} className="code" />
              </div>
            );
          })}
        </>
      );
    },
    ui: s => (
      <Lines>
        <Typed text="It’s 2031." p={seg(s, 0.1, 0.45)} className="line" />
        <Typed text="AI writes" p={seg(s, 0.95, 1.12)} className="line" />
        <Typed text="all the code." p={seg(s, 1.12, 1.38)} className="line" />
      </Lines>
    ),
  },

  /* 2. the robot catches its own bug, in a cage. Comes in like torn paper. */
  {
    id: 'bugs',
    rest: 1.55,
    wall: '#f2b230',
    floor: INDIGO,
    F: 0.26,
    ink: INK,
    enter: { type: 'tear', T: 0.8 },
    cues: [
      [0.98, 'boing'],
      [1.22, 'clank'],
    ],
    cam: (s, k) => {
      const g = catchGeometry(k);
      return { z: 1 + 0.3 * inout(seg(s, 0.95, 1.35)), x: g.cageX / k.W, y: 1 - g.cageY / k.H };
    },
    world: (s, k) => {
      const { W, H, F } = k;
      const g = catchGeometry(k);
      const caught = s >= 1.22;
      const crawl = seg(s, 0.12, 0.9);
      const floorX = lerp(-0.08 * W, g.left - g.bugH * 0.2, crawl);
      const floorY = (F - 0.035) * H;
      const j = seg(s, 0.98, 1.22);
      const bx = lerp(floorX, g.cageX, out(j));
      const by = lerp(floorY, g.cageY - g.bugH * 0.3, j) + Math.sin(j * Math.PI) * H * 0.14;
      const pop = arc(s, 1.22, 1.42);
      return (
        <>
          <Cut
            src={A(caught ? 'bot-cage' : 'bot-cage-open')}
            alt={caught ? 'The robot holds up a brass cage with the ladybug caught inside' : 'A tin robot holds out an open brass cage'}
            x={g.rx}
            h={g.rh}
            d={g.d}
            flip={caught}
            sc={1 + 0.06 * pop}
            dx={(1 - out(seg(s, 0, 0.5))) * W * 0.6}
            r={caught ? 0 : Math.sin(s * 6) * 1.2}
          />
          {!caught ? (
            <Cut src={A('bug')} alt="A ladybug" x={bx / W} h={g.bugH / H} d={0} dy={F * H - by} z={4} sc={lerp(1, 0.5, j)} r={lerp(32 + Math.sin(s * 24) * 8 * (1 - j), 360, out(j))} shadow={j < 0.1} />
          ) : null}
          {pop > 0 ? <i className="burst" aria-hidden="true" style={{ left: g.closedCageX, bottom: g.closedCageY, opacity: pop, transform: `translate(-50%, 50%) scale(${0.6 + pop})` }} /> : null}
        </>
      );
    },
    ui: s => (
      <Lines>
        <Typed text="It finds bugs." p={seg(s, 0.1, 0.45)} className="line" />
        <Typed text="And locks them up before lunch." p={seg(s, 1.0, 1.5)} className="line" />
      </Lines>
    ),
  },

  /* 3. so what's left for you? The bug scene shrinks away like a photo; the "?" drops its dot. */
  {
    id: 'you',
    rest: 1.0,
    hold: 0.25, // a short pause: the "?" is the cue, and its dot should soon move
    after: 0.55,
    wall: '#a6d8ee',
    floor: CREAM,
    F: YOU_F,
    ink: INK,
    enter: { type: 'shrink', T: 0.9 },
    cues: [[0.55, 'pop']],
    // starts close on the two of them, pulls back to the word they are looking at
    cam: s => ({ z: lerp(1.7, 1, inout(seg(s, 0.1, 1.1))), x: 0.52, y: 0.82 }),
    push: false,
    world: () => (
      <>
        <Cut src={A('boy-sit')} alt="Her friend sits on the floor, looking up" x={[0.22, 0.38]} h={[0.25, 0.36]} d={0.1} />
        <Cut src={A('girl-sit')} alt="She sits beside him, looking up too" x={[0.79, 0.64]} h={[0.24, 0.35]} d={0.08} flip />
      </>
    ),
    ui: (s, k) => <You s={s} k={k} />,
  },

  /* 4. what Futuready is. Opens out of the dot; the passport drops in and opens. */
  {
    id: 'intro',
    rest: 1.5,
    wall: NIGHT,
    floor: NIGHT,
    F: 0,
    ink: CREAM,
    enter: { type: 'iris', T: 0.8, at: k => ({ ...dotEnd(k), r0: dotEnd(k).r, zoom: 0 }) },
    cues: [
      [0.62, 'boop'],
      [1.0, 'page'],
    ],
    ui: s => (
      <Lines fit>
        <Rows rows={['Futuready is an', 'interactive bootcamp', 'that teaches you', 'exactly that.']} p={seg(s, 0.1, 0.85)} />
        <Note o={seg(s, 0.88, 1.08)}>through five levels that spell R.E.A.D.Y.</Note>
      </Lines>
    ),
  },

  /* 5. R */
  {
    id: 'R',
    rest: 1.62,
    wall: '#f2a7b8',
    floor: INDIGO,
    F: 0.24,
    ink: INK,
    level: 0,
    enter: { type: 'slide', T: 0.7 },
    cues: [[0.4, 'boop']],
    cam: s => ({ z: lerp(1.14, 1, out(seg(s, 0, 1.2))), x: 0.3, y: 0.75 }),
    world: (s, { W }) => (
      <>
        <Letter k="R" s={s} color="#e98ca2" />
        <Cut src={A('girl-list')} alt="She holds up a handwritten list" x={[0.3, 0.42]} h={[0.4, 0.56]} d={0.08} dx={enterL(s, 0, 0.6, W)} />
        <Cut src={A('bot-paper')} alt="A robot holds the same list, confused" x={[0.76, 0.66]} h={[0.3, 0.38]} d={0.06} dx={enterR(s, 0.3, 0.9, W)} r={Math.sin(s * 9) * 7 * seg(s, 0.62, 0.9)} />
      </>
    ),
    ui: s => <LevelLines i={0} s={s} a={['AI does literally', 'what you say.']} b={['Learn the art', 'of spec writing.']} />,
  },

  /* 6. E: the camera leans in to the bug she finds. The last page turns over. */
  {
    id: 'E',
    rest: 1.62,
    wall: '#9ed6c0',
    floor: BLUE,
    F: 0.24,
    ink: INK,
    level: 1,
    enter: { type: 'page', T: 0.8 },
    cues: [[0.64, 'pop']],
    cam: (s, { land }) => ({ z: 1 + 0.24 * inout(seg(s, 0.62, 1.05)), x: land ? 0.66 : 0.76, y: 0.5 }),
    world: (s, { W, H, land }) => (
      <>
        <Letter k="E" s={s} color="#86c8ae" />
        <Cut src={A('girl-lens')} alt="She inspects the robot's work with a magnifying glass" x={[0.34, 0.46]} h={[0.37, 0.54]} d={0.08} dx={enterL(s, 0, 0.6, W)} />
        <Cut src={A('bot-type')} alt="A robot typing on a laptop" x={[0.76, 0.66]} h={[0.24, 0.3]} d={0.06} dx={enterR(s, 0.25, 0.85, W)} />
        <Cut src={A('bug')} alt="A bug, found" x={land ? 0.69 : 0.79} h={[0.06, 0.075]} d={0.06} dy={-(land ? 0.17 : 0.13) * H} z={4} sc={back(seg(s, 0.62, 0.86))} o={seg(s, 0.62, 0.66)} shadow={false} r={20} />
      </>
    ),
    ui: s => <LevelLines i={1} s={s} a={['If it looks right,', 'Is it really right?']} b={['Evaluate like', 'Anthropic engineers.']} />,
  },

  /* 7. A: he brings the plan, the blocks follow it */
  {
    id: 'A',
    rest: 1.62,
    wall: '#f2b230',
    floor: '#c9562e',
    F: 0.24,
    ink: INK,
    level: 2,
    enter: { type: 'page', T: 0.8 },
    cues: [[0.5, 'boop']],
    cam: s => ({ z: lerp(1.18, 1, out(seg(s, 0, 1.1))), x: 0.6, y: 0.8 }),
    world: (s, { W }) => {
      const build = inout(seg(s, 0.3, 1.2));
      const walking = 1 - seg(s, 0.55, 0.65);
      return (
        <>
          <Letter k="A" s={s} color="#e3a21c" />
          <Cut src={A('boy-plan')} alt="Her friend walks in carrying the blueprint" x={[0.26, 0.36]} h={[0.4, 0.56]} d={0.08} dx={enterL(s, 0, 0.6, W)} dy={-Math.abs(Math.sin(s * 14)) * 5 * walking} />
          <Cut src={A('blocks')} alt="A tower of wooden blocks being built" x={[0.62, 0.56]} h={[0.39, 0.56]} d={0.05} style={{ clipPath: `inset(${(1 - build) * 100}% -20% -10% -20%)` }} wiggle="" />
          <Cut src={A('bot-block')} alt="A robot carrying a block" x={[0.86, 0.72]} h={[0.27, 0.34]} d={0.1} dx={enterR(s, 0.2, 1.0, W) * 0.8} dy={-Math.abs(Math.sin(s * 16)) * 6 * (1 - seg(s, 0.9, 1.0))} />
        </>
      );
    },
    ui: s => <LevelLines i={2} s={s} a={['Anyone can', 'stack blocks.']} b={['Learn to architect', 'scalable AI systems.']} />,
  },

  /* 8. D: a band that never sleeps (tap them: trumpet, drum, hi-hat) */
  {
    id: 'D',
    rest: 1.62,
    wall: '#c3b5f2',
    floor: INDIGO,
    F: 0.24,
    ink: INK,
    level: 3,
    enter: { type: 'page', T: 0.8 },
    cues: [[0.64, 'jingle']],
    cam: s => ({ z: 1 + 0.014 * Math.abs(Math.sin(s * 11)) * seg(s, 0.62, 0.85), x: 0.5, y: 0.7 }),
    world: (s, { W, H, land, F }) => {
      const play = seg(s, 0.62, 0.85);
      const beat = i => -Math.abs(Math.sin(s * 11 + i * 0.9)) * 10 * play;
      const band = land ? [0.6, 0.72, 0.84] : [0.6, 0.78, 0.94];
      return (
        <>
          <Letter k="D" s={s} color="#ae9deb" />
          <Cut src={A('girl-baton')} alt="She conducts a band of robots with a baton" x={[0.24, 0.38]} h={[0.4, 0.56]} d={0.08} dx={enterL(s, 0, 0.6, W)} r={Math.sin(s * 11) * 2 * play} />
          <Cut src={A('bot-horn')} alt="A robot playing a trumpet" x={band[0]} h={[0.26, 0.33]} d={0.07} dx={enterR(s, 0.25, 0.8, W) * 1.2} dy={beat(0)} flip sfx="horn" />
          <Cut src={A('bot-stand')} alt="A robot keeping the beat" x={band[1]} h={[0.24, 0.31]} d={0.04} dx={enterR(s, 0.35, 0.9, W) * 1.2} dy={beat(1)} sfx="drum" />
          <Cut src={A('bot-type')} alt="" x={band[2]} h={[0.2, 0.25]} d={0.1} dx={enterR(s, 0.45, 1.0, W) * 1.2} dy={beat(2)} sfx="hat" />
          <Floaters items={['♪', '♫', '♪', '♬']} s={s} on={play} x={band[0] * W - (land ? 0.06 : 0.09) * H} y={(F - 0.07) * H + 0.2 * H} rise={H * 0.22} spread={26} speed={1.1} className="music" />
        </>
      );
    },
    ui: s => <LevelLines i={3} s={s} a={['Nobody codes', 'alone anymore.']} b={['Learn to direct', 'a team of AI Agents']} />,
  },

  /* 9. Y: lights up from above, then a slow push into the spotlight */
  {
    id: 'Y',
    rest: 1.62,
    wall: '#151a45',
    floor: '#0e1232',
    F: 0.24,
    ink: CREAM,
    level: 4,
    enter: { type: 'iris', T: 0.9, edge: 0.3, at: ({ W }) => ({ x: W / 2, y: 0, r0: 0, zoom: 0.25 }) },
    cam: s => ({ z: lerp(1, 1.12, inout(seg(s, 0.3, 1.6))), x: 0.5, y: 0.5 }),
    world: s => {
      const lit = out(seg(s, 0.45, 0.95));
      return (
        <>
          <Letter k="Y" s={s} color="#1f2660" />
          <div className="spot" style={{ opacity: lit }} aria-hidden="true" />
          <Cut src={A('girl-phone')} alt="She stands alone in a spotlight" x={0.5} h={[0.46, 0.56]} d={0.1} style={{ filter: `brightness(${0.25 + lit * 0.75})` }} />
        </>
      );
    },
    ui: s => (
      <Lines className="lines--level">
        <p className="level-label" style={{ opacity: seg(s, 0.04, 0.25) }}>
          <i style={{ background: LEVELS[4].color }} aria-hidden="true" />
          Level 5 • You
        </p>
        <Typed text="And the last level" p={seg(s, 0.15, 0.5)} className="line" />
        <Typed text="is you" p={seg(s, 0.6, 0.85)} className="line line--big" />
        <Note o={seg(s, 0.95, 1.15)}>the unique part that nobody can steal</Note>
      </Lines>
    ),
  },

  /* 10. the passport comes back, full of stamps. Torn open from the dark. */
  {
    id: 'pass',
    rest: 1.0,
    wall: CREAM,
    floor: CREAM,
    F: 0,
    ink: INK,
    enter: { type: 'tear', T: 0.8 },
    cues: [[0.62, 'chime']],
    world: s => (
      <svg className="guilloche" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" style={{ transform: `translate3d(${-s * 18}px, 0, 0)` }}>
        <path d={GUILLOCHE[0]} />
        <path d={GUILLOCHE[1]} />
      </svg>
    ),
    ui: (s, { jump }) => (
      <>
        <Lines fit>
          <Rows rows={['On completing Futuready,', 'you get an e-passport.']} p={seg(s, 0.1, 0.7)} />
        </Lines>
        <div className="pass-cta" style={{ opacity: seg(s, 0.72, 0.92), pointerEvents: s > 0.8 ? 'auto' : 'none' }}>
          <button className="pill pill--ink pill--big" onClick={() => jump('train', 2.1)}>
            Attend Futuready
          </button>
          <p className="pass-cta__row">
            <span className="note">› Free to attend</span>
            <ShareButton label="Share with friends" />
          </p>
        </div>
      </>
    ),
  },

  /* 11. the lab */
  {
    id: 'lab',
    rest: 1.45,
    wall: BLUE,
    floor: CREAM,
    F: 0.24,
    ink: CREAM,
    push: false,
    enter: { type: 'slide', T: 0.7 },
    cues: [[0.15, 'tv']],
    cam: (s, { land }) => ({ z: lerp(1.1, 1, out(seg(s, 0, 0.9))), x: land ? 0.4 : 0.34, y: 0.7 }),
    world: (s, { W }) => {
      const n = TV_SCREENS.length;
      const i = Math.min(n - 1, Math.floor(seg(s, 0.2, 1.6) * n));
      return (
        <>
          <Cut src={A('tv')} alt="A vintage TV showing the real Builders Lab screens" x={LAB_TV.x} h={LAB_TV.h} d={LAB_TV.d} dy={(1 - back(seg(s, 0.1, 0.55))) * -60} o={seg(s, 0.1, 0.25)}>
            <div className="tv-screen">
              {TV_SCREENS.map((f, j) => (
                <img key={f} src={pic(f)} alt="" style={{ opacity: j === i ? 1 : 0 }} />
              ))}
            </div>
          </Cut>
          <Cut src={A('squad')} alt="A squad of four students cheering at their phones" x={[0.74, 0.7]} h={[0.4, 0.52]} d={0.1} dx={enterR(s, 0.9, 1.4, W) * 1.2} />
        </>
      );
    },
    ui: s => (
      <Lines fit>
        <Rows rows={['Futuready is not a lecture.', 'It is an interactive lab.']} p={seg(s, 0.1, 0.65)} />
        <div className="learn">
          <Rows rows={['Students participate in', 'realtime via phones.']} p={seg(s, 0.8, 1.35)} />
        </div>
      </Lines>
    ),
  },

  /* 12. meet your trainer: comes out of the TV */
  {
    id: 'trainer',
    rest: 1.3,
    wall: '#1d1236',
    floor: '#2c2058',
    F: 0.18,
    ink: CREAM,
    enter: { type: 'tv', T: 1.0, at: tvScreen },
    cues: [[0.3, 'shutter']],
    cam: s => ({ z: lerp(1.12, 1, out(seg(s, 0, 0.9))), x: 0.5, y: 0.6 }),
    world: (s, k) => <Trainer s={s} k={k} />,
    ui: s => (
      <Lines className="lines--trainer">
        <Typed text="Meet your trainer" p={seg(s, 0.1, 0.4)} className="line" />
        <h2 className="trainer-name" style={{ opacity: seg(s, 0.38, 0.55), transform: `translateY(${(1 - out(seg(s, 0.38, 0.6))) * 16}px)` }}>
          {TRAINER.name}
        </h2>
        <p className="trainer-links" style={{ opacity: seg(s, 1.0, 1.15), pointerEvents: s > 1.0 ? 'auto' : 'none' }}>
          <a href={TRAINER.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn ↗
          </a>
          <a href={TRAINER.instagram} target="_blank" rel="noopener noreferrer">
            Instagram ↗
          </a>
        </p>
      </Lines>
    ),
  },

  /* 13. what attendees say. The trainer's photo is tossed aside like a print. */
  {
    id: 'voices',
    rest: 1.45,
    wall: CREAM,
    floor: CREAM,
    F: 0,
    ink: INK,
    enter: { type: 'shrink', T: 0.9 },
    ui: (s, { land }) => (
      <>
        <Lines>
          <Typed text="What Futuready attendees say" p={seg(s, 0.1, 0.5)} className="line" />
        </Lines>
        <div className={`notes-wall ${land ? 'is-land' : ''}`}>
          {VOICES_FULL.map((v, i) => {
            const a = 0.45 + i * 0.3;
            const drop = back(seg(s, a, a + 0.32));
            return (
              <figure key={v.name} className="paper" style={{ '--r': `${[-2.5, 2, -1.5][i]}deg`, opacity: seg(s, a, a + 0.08), transform: `translateY(${(1 - drop) * -50}px) rotate(var(--r))` }}>
                <blockquote>“{v.quote}”</blockquote>
                <figcaption>
                  {v.name}
                  <span>{v.role}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </>
    ),
  },

  /* 14. the train: one carriage per city, straight from the event list. Arrives from the right. */
  {
    id: 'train',
    // arrives and waits at the next city (the story holds there: tap to attend), then, as you scroll on,
    // rolls past the other cities and the concluded ones before the next scene
    rest: 2.55,
    hold: 1.1,
    after: 4.6,
    wall: '#a6d8ee',
    floor: '#2f7a4e',
    F: 0.22,
    ink: INK,
    enter: { type: 'wipe', T: 0.8 },
    cues: [[0.32, 'whistle'], ...Array.from({ length: 8 }, (_, i) => [0.5 + i * 0.19, 'chug']), [2.0, 'ding']],
    cam: s => ({ z: lerp(1.08, 1, out(seg(s, 0, 1.2))), x: 0.5, y: 0.75 }),
    world: (s, k) => {
      const { H, cities } = k;
      const t = trainGeometry(s, k);
      // the two friends walk onto the platform once the cities still to come have gone by
      const walk = seg(s, t.cs - 0.05, t.cs + 0.55);
      const run = seg(s, t.cs + 0.15, t.cs + 0.65);
      return (
        <>
          <div className="rails" style={{ bottom: t.railY - 6 }} aria-hidden="true" />
          <div className="train" style={{ bottom: t.railY, transform: `translateX(${t.X}px) translateY(${t.shake}px)` }}>
            <img className="train__engine" src={A('engine')} alt="A vintage tin toy train" style={{ height: t.eh, width: t.ew }} draggable={false} />
            <Floaters items={['', '', '', '']} s={s * 1.4} on={t.moving ? 1 : 0.4} x={t.ew * 0.13} y={t.eh * 0.95} rise={H * 0.16} spread={10} className="smoke" />
            {cities.map((c, i) => {
              const inside = (
                <>
                  <img src={A('coach')} alt="" draggable={false} />
                  <span className="coach__board">
                    <b>{c.city}</b>
                    <small>{coachTag(c)}</small>
                  </span>
                </>
              );
              // the concluded cities ride at the back, in black and white, after a little gap
              const style = { height: t.ch, width: t.cw, marginLeft: t.gap + (i === t.firstPast ? t.split : 0) };
              const cls = `coach${i === t.near ? ' is-near' : ''}${c.status === 'past' ? ' is-past' : ''}`;
              // a city with its own page opens it; one still boarding soon asks for Futuready there
              return c.url ? (
                <a key={c.city + i} className={cls} href={c.url} style={style} aria-label={`Attend in ${c.city}: ${stationTag(c)}${c.date ? `, ${c.date}` : ''}`}>
                  {inside}
                </a>
              ) : (
                <button key={c.city + i} type="button" className={cls} style={style} onClick={() => k.openBring(c.city)} aria-label={`${c.city}: boarding soon. Ask for Futuready at your campus in ${c.city}`}>
                  {inside}
                </button>
              );
            })}
          </div>
          <Cut src={A('girl-walk')} alt="She walks to the platform with her suitcase" x={lerp(-0.25, k.land ? 0.13 : 0.2, out(walk))} h={[0.36, 0.46]} d={0.1} z={5} o={walk > 0 ? 1 : 0} />
          <Cut src={A('boy-run')} alt="Her friend runs to catch the train" x={lerp(-0.3, k.land ? 0.27 : 0.64, out(run))} h={[0.33, 0.43]} d={0.13} z={6} o={run > 0 ? 1 : 0} />
        </>
      );
    },
    ui: (s, k) => {
      const t = trainGeometry(s, k);
      const c = k.cities[t.near] || k.cities[0];
      const hint = seg(s, 0.6, 0.8);
      // the wheel turns heavier while the cities still to come are at the station, normal again for the concluded ones
      const vs = typeof window !== 'undefined' && window.__lenis?.virtualScroll?.options;
      if (vs) vs.wheelMultiplier = t.calm ? 0.4 : 0.8;
      return (
        <>
          <Lines className="lines--train">
            <Typed text={c.status === 'past' ? 'Concluded in:' : 'Attend in:'} p={seg(s, 0.1, 0.3)} className="line" />
            <div className="station" style={{ opacity: seg(s, 0.3, 0.5), fontSize: stationSize(c.city, k) }} aria-live="polite">
              {c.city}
              <small style={{ maxWidth: stationRoom(k) }}>{stationTag(c)}</small>
            </div>
          </Lines>
          <Flaps c={c} o={seg(s, 0.35, 0.55)} />
          <p className="train-hint">
            <span style={{ opacity: hint }}>Tap a carriage to attend</span>
          </p>
        </>
      );
    },
  },

  /* 15. didn't find your city? */
  {
    id: 'end',
    len: 0.9,
    wall: BLUE,
    floor: CREAM,
    F: 0.26,
    ink: CREAM,
    enter: { type: 'slide', T: 0.7 },
    cues: [[0.2, 'pop']],
    cam: s => ({ z: lerp(1.14, 1, out(seg(s, 0, 0.9))), x: 0.5, y: 0.8 }),
    world: (s, k) => {
      const xs = endRow(k);
      return END.map((p, i) => <Cut key={p.src} src={A(p.src)} alt={p.alt} x={xs[i]} h={pick(p.h, k.land) * endScale(k)} d={p.d} dx={(1 - out(seg(s, i * 0.05, 0.5 + i * 0.05))) * [-80, 60, 80][i]} />);
    },
    ui: (s, { land, openBring }) => (
      <>
        <div className="title title--end" style={{ opacity: seg(s, 0, 0.35) }}>
          <h2 className="display">
            <span>Didn’t find</span>
            <span>your city?</span>
          </h2>
          <div className="end-cta">
            <a className="pill pill--yellow" href={VIRTUAL_URL}>
              Attend Virtual
            </a>
            <button type="button" className="pill" onClick={() => openBring()}>
              Bring to your campus
            </button>
          </div>
          <ShareButton label="Share with friends" className="share--end" />
        </div>
        <footer className="foot" style={{ opacity: seg(s, 0.3, 0.6) }}>
          <img src={pic('h2s-logo.webp')} alt="Hack2skill" width="48" height="18" />
          <a href={`mailto:${SUPPORT}`}>{SUPPORT}</a>
          <span>{land ? 'Futuready by Hack2skill · ' : ''}© 2026</span>
        </footer>
      </>
    ),
  },
];

/* the TV in the lab, and the rectangle of its screen (for the zoom into it) */
const LAB_TV = { x: [0.34, 0.42], h: [0.27, 0.42], d: 0.07, F: 0.24, a: 320 / 308 };
function tvScreen({ W, H, land }) {
  const h = pick(LAB_TV.h, land) * H;
  const w = h * LAB_TV.a;
  const left = pick(LAB_TV.x, land) * W - w / 2;
  const top = H - (LAB_TV.F - LAB_TV.d) * H - h;
  // the see-through glass in tv.webp: 11.6% in from the left, 11.7% down, 59.7% wide, 48.7% tall
  return { l: left + 0.116 * w, t: top + 0.117 * h, w: 0.597 * w, h: 0.487 * h, round: 0.09 * w };
}

/* where the robot, its cage and the bug sit in the catch scene */
function catchGeometry({ W, H, land, F }) {
  const rx = land ? 0.62 : 0.64;
  const rh = land ? 0.52 : 0.44;
  const d = 0.07;
  const base = (F - d) * H;
  const openW = rh * H * (455 / 810);
  const closedW = rh * H * (419 / 808);
  const left = rx * W - openW / 2;
  return {
    rx,
    rh,
    d,
    left,
    bugH: (land ? 0.075 : 0.065) * H,
    // the open cage, in the robot's hand on our right
    cageX: left + 0.8 * openW,
    cageY: base + (1 - 0.36) * rh * H,
    // the closed cage, held up high (the image is mirrored, so it is on our right too)
    closedCageX: rx * W - closedW / 2 + 0.85 * closedW,
    closedCageY: base + (1 - 0.2) * rh * H,
  };
}

/* the train's size and where it is along the line */
function trainGeometry(s, { W, H, land, F, cities }) {
  const n = Math.max(1, cities.length);
  const ch = (land ? 0.2 : 0.17) * H;
  const cw = ch * (678 / 364);
  const eh = ch * 1.13;
  const ew = eh * (732 / 410);
  const gap = ch * 0.03;
  const start = W + 20;
  // the concluded cities sit at the back after a gap; the train stops with the first city still to come in the middle
  const firstPast = cities.findIndex(c => c.status === 'past');
  const split = firstPast > 0 ? cw * 0.22 : 0;
  const at = i => ew + gap + i * (cw + gap) + (firstPast > 0 && i >= firstPast ? split : 0) + cw / 2;
  const xAt = i => W / 2 - at(i);
  // Arrive and wait at the first city to come (the story holds there). Then, scroll by scroll, stop at every other
  // city still to come (each gets a long, slow stretch, so it can be tapped). After the last one the train pulls up
  // to the gap before the concluded cities, the two friends walk onto the platform, and the concluded carriages
  // roll past quickly. The whole ride fits the scene, however many cities there are.
  const up = Math.max(1, cities.filter(c => c.status !== 'past').length);
  const hasPast = up < n;
  const R = 4.2;
  const pastPart = hasPast ? 0.7 : 0;
  const charsPart = 0.7;
  const U = R - pastPart - charsPart;
  const cs = 2.7 + U; // the friends come on here
  const legs = [];
  if (up > 1) {
    const slot = U / (up - 1);
    for (let i = 1; i < up; i++) legs.push([2.7 + (i - 1) * slot, 2.7 + (i - 1) * slot + slot * 0.3, xAt(i - 1), xAt(i)]);
  }
  if (hasPast) {
    const gapX = W / 2 - (at(up - 1) + at(up)) / 2;
    legs.push([cs, cs + charsPart * 0.5, xAt(up - 1), gapX]);
    legs.push([cs + charsPart, cs + charsPart + pastPart, gapX, xAt(n - 1)]);
  }
  const arrive = inout(seg(s, 0.3, 2.0));
  let X = lerp(start, xAt(0), arrive);
  let rolling = false;
  for (const [a, b, x0, x1] of legs) {
    if (s >= a) {
      const p = inout(seg(s, a, b));
      X = lerp(x0, x1, p);
      rolling = rolling || (p > 0 && p < 1);
    }
  }
  let near = 0;
  let best = Infinity;
  for (let i = 0; i < n; i++) {
    const c = X + at(i);
    if (Math.abs(c - W / 2) < best) {
      best = Math.abs(c - W / 2);
      near = i;
    }
  }
  const moving = (arrive > 0 && arrive < 1) || rolling;
  return { ch, cw, eh, ew, gap, X, near, moving, firstPast, split, cs, calm: s < cs, shake: moving ? Math.sin(s * 90) : 0, railY: (F - 0.07) * H };
}


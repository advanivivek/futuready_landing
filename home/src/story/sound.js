/*
  Every sound in the story, synthesised on the fly with the Web Audio API: no files to download.
  Off until the visitor turns it on (browsers only allow audio after a tap). The choice is remembered,
  and resumed on the next tap or key press.
*/
const KEY = 'futuready-sound';
let ctx = null;
let out = null;
let on = false;
let noiseBuf = null;
const last = {};
const listeners = new Set();

const wanted = () => {
  try {
    return localStorage.getItem(KEY) === 'on';
  } catch {
    return false;
  }
};

function boot() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  out = ctx.createDynamicsCompressor();
  out.threshold.value = -18;
  const vol = ctx.createGain();
  vol.gain.value = 0.42;
  out.connect(vol).connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

const env = (g, t, a, peak, dur) => {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
};

function noise(t, dur, { type = 'bandpass', f = 2000, f2, q = 1, peak = 0.3, a = 0.004 } = {}) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const fl = ctx.createBiquadFilter();
  fl.type = type;
  fl.frequency.setValueAtTime(f, t);
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
  fl.Q.value = q;
  const g = ctx.createGain();
  env(g, t, a, peak, dur);
  src.connect(fl).connect(g).connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

function tone(t, dur, { f = 440, f2, type = 'sine', peak = 0.3, a = 0.005, lp } = {}) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  const g = ctx.createGain();
  env(g, t, a, peak, dur);
  let node = o.connect(g);
  if (lp) {
    const fl = ctx.createBiquadFilter();
    fl.type = 'lowpass';
    fl.frequency.value = lp;
    node = node.connect(fl);
  }
  node.connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
}

const SFX = {
  // a typewriter key
  tick: t => noise(t, 0.035, { f: 2600 + Math.random() * 1600, q: 2.5, peak: 0.16, a: 0.001 }),
  // a sheet of paper sliding over another
  whoosh: t => noise(t, 0.55, { f: 500, f2: 2600, q: 0.7, peak: 0.14, a: 0.12 }),
  // a rubber stamp hitting paper
  thunk: t => {
    tone(t, 0.18, { f: 140, f2: 52, peak: 0.6 });
    noise(t, 0.06, { type: 'lowpass', f: 900, peak: 0.35, a: 0.001 });
  },
  // a tin robot arriving
  boop: t => {
    tone(t, 0.07, { f: 520, f2: 760, type: 'square', peak: 0.07, lp: 2400 });
    tone(t + 0.08, 0.08, { f: 760, f2: 980, type: 'square', peak: 0.06, lp: 2400 });
  },
  pop: t => tone(t, 0.12, { f: 880, f2: 330, peak: 0.25 }),
  // a little spring jump
  boing: t => tone(t, 0.32, { f: 260, f2: 900, type: 'triangle', peak: 0.16 }),
  // the brass cage door snapping shut
  clank: t => {
    [523, 1187, 1993, 2731].forEach((f, i) => tone(t, 0.5 - i * 0.08, { f, type: 'triangle', peak: 0.12 / (i + 1), a: 0.001 }));
    noise(t, 0.05, { f: 4000, q: 1, peak: 0.12, a: 0.001 });
  },
  // a tiny trumpet fanfare
  jingle: t => {
    [523, 659, 784, 1046].forEach((f, i) => tone(t + i * 0.13, i === 3 ? 0.45 : 0.14, { f, type: 'sawtooth', peak: 0.09, lp: 1800 }));
  },
  // the passport, complete
  chime: t => {
    [784, 988, 1175, 1568].forEach((f, i) => tone(t + i * 0.09, 0.9, { f, peak: 0.12, a: 0.003 }));
  },
  // a steam whistle
  whistle: t => {
    [784, 988].forEach(f => tone(t, 1.0, { f, f2: f * 0.98, type: 'triangle', peak: 0.08, a: 0.08, lp: 2200 }));
    noise(t, 1.0, { f: 3000, q: 0.6, peak: 0.05, a: 0.08 });
  },
  // one puff of the engine
  chug: t => noise(t, 0.16, { type: 'lowpass', f: 420, peak: 0.3, a: 0.004 }),
  // an old TV switching on
  tv: t => {
    tone(t, 0.25, { f: 15600, peak: 0.02 });
    noise(t, 0.18, { f: 1800, q: 0.5, peak: 0.12, a: 0.002 });
  },
};

const GAP = { tick: 0.028, whoosh: 0.3, chug: 0.1 };

export const sound = {
  get on() {
    return on;
  },
  get wanted() {
    return wanted();
  },
  async enable() {
    if (!boot()) return false;
    try {
      await ctx.resume();
    } catch {
      return false;
    }
    on = ctx.state === 'running';
    try {
      localStorage.setItem(KEY, 'on');
    } catch {
      /* private mode */
    }
    listeners.forEach(f => f(on));
    if (on) SFX.pop(ctx.currentTime + 0.01);
    return on;
  },
  disable() {
    on = false;
    try {
      localStorage.setItem(KEY, 'off');
    } catch {
      /* private mode */
    }
    ctx?.suspend();
    listeners.forEach(f => f(on));
  },
  play(name, delay = 0) {
    if (!on || !ctx || !SFX[name]) return;
    const t = ctx.currentTime + delay;
    if (last[name] && t - last[name] < (GAP[name] ?? 0.12)) return;
    last[name] = t;
    SFX[name](t + 0.005);
  },
  subscribe(f) {
    listeners.add(f);
    return () => listeners.delete(f);
  },
};

// If they chose sound last time, bring it back on their first tap or key press.
if (typeof window !== 'undefined' && wanted()) {
  const resume = () => {
    sound.enable();
    removeEventListener('pointerdown', resume);
    removeEventListener('keydown', resume);
  };
  addEventListener('pointerdown', resume, { once: true });
  addEventListener('keydown', resume, { once: true });
}

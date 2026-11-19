/*
  The story's sound, all synthesised with the Web Audio API: no audio files to download.

  Music: a quiet, slowly gliding pad with a soft bass and the odd glass bell, in D major. Its chord follows the
  story (each scene moves the harmony on), it opens up a little while you scroll, and it fades away when the
  tab is hidden.
  Effects: typewriter keys, paper, robots that chirp in key, a trumpet, a stamp, a train, and so on.

  On by default, but browsers only allow sound after a tap or a key press, so it starts on the visitor's
  first tap anywhere. The speaker in the header turns it off, and that choice is remembered.
*/
const KEY = 'futuready-sound';
const MUSIC_LEVEL = 0.26; // about -32 dB: there, never in the way
let ctx = null;
let sfxIn = null;
let musicOut = null;
let verb = null;
let noiseBuf = null;
let music = null;
let state = 'off'; // 'on' (playing) | 'armed' (waiting for the first tap) | 'off' (turned off)
let chord = 0;
let energy = 0;
const last = {};
const listeners = new Set();

const pref = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const remember = v => {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* private mode */
  }
};
const setState = s => {
  state = s;
  listeners.forEach(f => f(s));
};

/* ---------- harmony ---------- */
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
// four pad voices and a bass note per chord: Dmaj9, Bm9, Gmaj9(#11), A6sus, Em9
const PROG = [
  { v: [66, 69, 73, 76], b: 38 },
  { v: [62, 66, 69, 73], b: 35 },
  { v: [62, 66, 69, 73], b: 43 },
  { v: [64, 66, 69, 71], b: 45 },
  { v: [62, 66, 67, 71], b: 40 },
];
const tones = () => PROG[chord].v.map(m => m % 12);
// a note of the current chord, near the given MIDI octave
const inKey = (oct = 72) => {
  const t = tones();
  return mtof(oct - (oct % 12) + t[Math.floor(Math.random() * t.length)]);
};

/* ---------- building blocks ---------- */
function makeNoise(c) {
  const b = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

// a soft hall: decaying, slightly dark noise
function makeVerb(c, seconds = 3.2) {
  const n = Math.floor(c.sampleRate * seconds);
  const ir = c.createBuffer(2, n, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let y = 0;
    for (let i = 0; i < n; i++) {
      y += 0.3 * (Math.random() * 2 - 1 - y);
      d[i] = y * Math.pow(1 - i / n, 3) * (i < c.sampleRate * 0.012 ? 0 : 1);
    }
  }
  const v = c.createConvolver();
  v.buffer = ir;
  return v;
}

function boot() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC({ latencyHint: 'interactive' });
  build(ctx, ctx.destination);
  return ctx;
}

function build(c, dest) {
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -18;
  const sfxVol = c.createGain();
  sfxVol.gain.value = 0.6;
  comp.connect(sfxVol).connect(dest);
  sfxIn = comp;
  musicOut = c.createGain();
  musicOut.gain.value = 0;
  musicOut.connect(dest);
  verb = makeVerb(c);
  const wet = c.createGain();
  wet.gain.value = 0.8;
  verb.connect(wet).connect(musicOut);
  noiseBuf = makeNoise(c);
}

const env = (g, t, a, peak, dur) => {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
};

function noise(t, dur, { type = 'bandpass', f = 2000, f2, q = 1, peak = 0.3, a = 0.004, to = sfxIn } = {}) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const fl = ctx.createBiquadFilter();
  fl.type = type;
  fl.frequency.setValueAtTime(f, t);
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
  fl.Q.value = q;
  const g = ctx.createGain();
  env(g, t, a, peak, dur);
  src.connect(fl).connect(g).connect(to);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

function tone(t, dur, { f = 440, f2, type = 'sine', peak = 0.3, a = 0.005, lp, vib = 0, to = sfxIn } = {}) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  if (vib) {
    const l = ctx.createOscillator();
    const lg = ctx.createGain();
    l.frequency.value = 5.5;
    lg.gain.value = f * vib;
    l.connect(lg).connect(o.frequency);
    l.start(t);
    l.stop(t + dur + 0.05);
  }
  const g = ctx.createGain();
  env(g, t, a, peak, dur);
  let node = o.connect(g);
  if (lp) {
    const fl = ctx.createBiquadFilter();
    fl.type = 'lowpass';
    fl.frequency.value = lp;
    node = node.connect(fl);
  }
  node.connect(to);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/* ---------- the music ---------- */
function startMusic(c = ctx, at = c.currentTime) {
  if (music) return music;
  const m = { voices: [] };
  m.lp = c.createBiquadFilter();
  m.lp.type = 'lowpass';
  m.lp.frequency.value = 780;
  m.lp.Q.value = 0.5;
  const lfo = c.createOscillator();
  const lfoAmt = c.createGain();
  lfo.frequency.value = 0.045;
  lfoAmt.gain.value = 260;
  lfo.connect(lfoAmt).connect(m.lp.frequency);
  lfo.start(at);
  const dry = c.createGain();
  dry.gain.value = 0.55;
  const send = c.createGain();
  send.gain.value = 0.7;
  m.lp.connect(dry).connect(musicOut);
  m.lp.connect(send).connect(verb);
  PROG[chord].v.forEach((n, i) => {
    const g = c.createGain();
    g.gain.value = 0.045;
    // each voice breathes at its own slow rate, so the chord shimmers instead of droning
    const sw = c.createOscillator();
    const swAmt = c.createGain();
    sw.frequency.value = 0.07 + i * 0.023;
    swAmt.gain.value = 0.018;
    sw.connect(swAmt).connect(g.gain);
    sw.start(at);
    const os = [
      ['sawtooth', -7],
      ['triangle', 6],
    ].map(([type, det]) => {
      const o = c.createOscillator();
      o.type = type;
      o.detune.value = det;
      o.frequency.value = mtof(n);
      o.connect(g);
      o.start(at);
      return o;
    });
    g.connect(m.lp);
    m.voices.push(os);
  });
  m.bass = c.createOscillator();
  m.bass.frequency.value = mtof(PROG[chord].b);
  const bg = c.createGain();
  bg.gain.value = 0.11;
  m.bass.connect(bg).connect(musicOut);
  m.bass.start(at);
  // a slow echo for the bells
  m.echo = c.createDelay(1);
  m.echo.delayTime.value = 0.42;
  const fb = c.createGain();
  fb.gain.value = 0.36;
  const dark = c.createBiquadFilter();
  dark.type = 'lowpass';
  dark.frequency.value = 2600;
  m.echo.connect(dark).connect(fb).connect(m.echo);
  dark.connect(verb);
  dark.connect(musicOut);
  m.next = at + 2.5;
  music = m;
  return m;
}

function bell(t, f) {
  const g = ctx.createGain();
  env(g, t, 0.006, 0.05, 2.6);
  const o = ctx.createOscillator();
  o.frequency.value = f;
  const o2 = ctx.createOscillator();
  o2.frequency.value = f * 2.76;
  const g2 = ctx.createGain();
  g2.gain.value = 0.18;
  o.connect(g);
  o2.connect(g2).connect(g);
  g.connect(music.echo);
  g.connect(verb);
  g.connect(musicOut);
  o.start(t);
  o2.start(t);
  o.stop(t + 2.7);
  o2.stop(t + 2.7);
}

// a little clock that rings the bells and lets the filter follow the scrolling
let clock = 0;
function tickMusic() {
  if (!music || state !== 'on') return;
  const now = ctx.currentTime;
  energy *= 0.82;
  music.lp.frequency.setTargetAtTime(780 + Math.min(1, energy) * 900, now, 0.6);
  if (now >= music.next) {
    bell(now + 0.02, inKey(Math.random() < 0.6 ? 79 : 86));
    music.next = now + (2.2 + Math.random() * 3.4) / (1 + Math.min(1.5, energy * 2));
  }
}

function moveChord(i) {
  const next = ((i % PROG.length) + PROG.length) % PROG.length;
  if (next === chord) return;
  chord = next;
  if (!music) return;
  const now = ctx.currentTime;
  PROG[chord].v.forEach((n, j) => music.voices[j].forEach(o => o.frequency.setTargetAtTime(mtof(n), now, 0.45)));
  music.bass.frequency.setTargetAtTime(mtof(PROG[chord].b), now, 0.6);
}

/* ---------- effects ---------- */
const SFX = {
  // a typewriter key
  tick: t => noise(t, 0.035, { f: 2600 + Math.random() * 1600, q: 2.5, peak: 0.16, a: 0.001 }),
  // a sheet of paper sliding over another
  whoosh: t => noise(t, 0.55, { f: 500, f2: 2600, q: 0.7, peak: 0.14, a: 0.12 }),
  // a page of the passport turning
  page: t => {
    noise(t, 0.32, { f: 900, f2: 3400, q: 0.9, peak: 0.12, a: 0.08 });
    noise(t + 0.27, 0.06, { type: 'lowpass', f: 1200, peak: 0.12, a: 0.002 });
  },
  // paper tearing
  tear: t => {
    for (let i = 0; i < 16; i++) noise(t + i * 0.024 + Math.random() * 0.01, 0.03, { f: 1800 + i * 160, q: 2, peak: 0.05 + Math.random() * 0.05, a: 0.001 });
  },
  // air opening up (the iris transitions)
  swell: t => {
    noise(t, 0.9, { f: 300, f2: 4200, q: 0.6, peak: 0.07, a: 0.5 });
    tone(t + 0.2, 0.9, { f: inKey(74), peak: 0.04, a: 0.3 });
  },
  // a rubber stamp hitting paper
  thunk: t => {
    tone(t, 0.18, { f: 140, f2: 52, peak: 0.6 });
    noise(t, 0.06, { type: 'lowpass', f: 900, peak: 0.35, a: 0.001 });
  },
  // a scene has everything on it: two soft notes in key
  settle: t => {
    tone(t, 1.1, { f: inKey(76), peak: 0.05, a: 0.004 });
    tone(t + 0.11, 1.1, { f: inKey(83), peak: 0.04, a: 0.004 });
  },
  // a tin robot arriving
  boop: t => {
    tone(t, 0.07, { f: 520, f2: 760, type: 'square', peak: 0.07, lp: 2400 });
    tone(t + 0.08, 0.08, { f: 760, f2: 980, type: 'square', peak: 0.06, lp: 2400 });
  },
  // tapping a robot: it chirps back, always in key
  robot: t => {
    const n = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) tone(t + i * 0.075, 0.06, { f: inKey(84), type: 'square', peak: 0.05, lp: 2600 });
  },
  // tapping a person: a paper flick
  paper: t => {
    noise(t, 0.06, { f: 1700 + Math.random() * 900, q: 0.9, peak: 0.14, a: 0.002 });
    noise(t + 0.035, 0.05, { f: 3300, q: 1, peak: 0.06, a: 0.002 });
  },
  pop: t => tone(t, 0.12, { f: 880, f2: 330, peak: 0.25 }),
  click: t => tone(t, 0.025, { f: 1900, peak: 0.08, a: 0.001 }),
  // a little spring jump
  boing: t => tone(t, 0.32, { f: 260, f2: 900, type: 'triangle', peak: 0.16 }),
  // the bug, squeaking
  squeak: t => {
    tone(t, 0.08, { f: 1900, f2: 2700, type: 'triangle', peak: 0.08 });
    tone(t + 0.09, 0.08, { f: 2700, f2: 2000, type: 'triangle', peak: 0.07 });
  },
  // the brass cage door snapping shut
  clank: t => {
    [523, 1187, 1993, 2731].forEach((f, i) => tone(t, 0.5 - i * 0.08, { f, type: 'triangle', peak: 0.12 / (i + 1), a: 0.001 }));
    noise(t, 0.05, { f: 4000, q: 1, peak: 0.12, a: 0.001 });
  },
  // the robot band: a fanfare on the chord, a trumpet note, a drum, a hi-hat
  jingle: t => {
    const r = PROG[chord].v.map(mtof);
    [r[0], r[1], r[2], r[0] * 2].forEach((f, i) => tone(t + i * 0.13, i === 3 ? 0.45 : 0.14, { f, type: 'sawtooth', peak: 0.14, lp: 1800 }));
  },
  horn: t => {
    const f = inKey(67);
    tone(t, 0.6, { f, type: 'sawtooth', peak: 0.22, a: 0.03, lp: 1700, vib: 0.006 });
    tone(t, 0.6, { f: f * 2, type: 'triangle', peak: 0.06, a: 0.03, vib: 0.006 });
  },
  drum: t => {
    tone(t, 0.26, { f: 170, f2: 62, peak: 0.65 });
    noise(t, 0.07, { type: 'lowpass', f: 700, peak: 0.18, a: 0.001 });
  },
  hat: t => noise(t, 0.06, { type: 'highpass', f: 7000, peak: 0.22, a: 0.001 }),
  // the passport, complete
  chime: t => {
    const r = PROG[chord].v.map(mtof);
    [r[0], r[1], r[2], r[3], r[0] * 2].forEach((f, i) => tone(t + i * 0.09, 0.9, { f: f * 2, peak: 0.09, a: 0.003 }));
  },
  // the squad cheering: a scatter of claps
  cheer: t => {
    for (let i = 0; i < 26; i++) noise(t + Math.random() * 0.9, 0.03, { f: 1500 + Math.random() * 2500, q: 1.4, peak: 0.04 + Math.random() * 0.05, a: 0.001 });
  },
  // a camera shutter (the trainer changes pose)
  shutter: t => {
    noise(t, 0.022, { type: 'highpass', f: 2600, peak: 0.22, a: 0.001 });
    noise(t + 0.07, 0.03, { f: 1400, q: 1.2, peak: 0.16, a: 0.001 });
  },
  // a steam whistle
  whistle: t => {
    [784, 988].forEach(f => tone(t, 1.0, { f, f2: f * 0.98, type: 'triangle', peak: 0.08, a: 0.08, lp: 2200 }));
    noise(t, 1.0, { f: 3000, q: 0.6, peak: 0.05, a: 0.08 });
  },
  // one puff of the engine
  chug: t => noise(t, 0.16, { type: 'lowpass', f: 420, peak: 0.3, a: 0.004 }),
  // the station board flipping
  flap: t => {
    for (let i = 0; i < 6; i++) noise(t + i * 0.028, 0.014, { type: 'highpass', f: 1800, peak: 0.1, a: 0.001 });
  },
  // a platform bell
  ding: t => [1318, 1975, 2637].forEach((f, i) => tone(t, 1.3 - i * 0.3, { f, peak: 0.07 / (i + 1), a: 0.002 })),
  // an old TV switching on
  tv: t => {
    tone(t, 0.25, { f: 15600, peak: 0.02 });
    noise(t, 0.18, { f: 1800, q: 0.5, peak: 0.12, a: 0.002 });
  },
  // the future, peeping through
  shimmer: t => {
    const r = PROG[chord].v.map(mtof);
    [...r, r[0] * 2, r[2] * 2].forEach((f, i) => tone(t + i * 0.06, 1.4, { f: f * 2, peak: 0.035, a: 0.004 }));
    noise(t, 0.9, { type: 'highpass', f: 6000, peak: 0.03, a: 0.3 });
  },
};

const GAP = { tick: 0.028, whoosh: 0.3, chug: 0.1, flap: 0.2, robot: 0.12, paper: 0.08, settle: 0.6 };

/* ---------- switching on and off ---------- */
// The phone locks, another app plays, iOS "interrupts" the audio: the context stops running, sometimes for
// good. Whenever it is not running while sound is wanted, the speaker shows "waiting", and the next tap
// anywhere brings it back, with a brand new context if the old one will not wake up.
function watch(c) {
  c.onstatechange = () => {
    if (c !== ctx) return;
    if (c.state === 'running' && pref() !== 'off') setState('on');
    else if (c.state !== 'running' && state === 'on' && !document.hidden) setState('armed');
  };
}

function onVisibility() {
  if (!ctx) return;
  if (document.hidden) {
    ctx.suspend().catch(() => {});
  } else if (pref() !== 'off') {
    if (ctx.state !== 'running') {
      if (typeof navigator !== 'undefined' && navigator.userActivation?.isActive) {
        ctx.resume().catch(() => setState('armed'));
      } else {
        setState('armed');
      }
    }
  }
}

// forget a context that will not run, so the next enable() builds a fresh one inside the tap
function reset() {
  const old = ctx;
  ctx = null;
  music = null;
  if (clock) clearInterval(clock);
  clock = 0;
  try {
    old?.close();
  } catch {
    /* already closed */
  }
}

async function enable() {
  if (ctx && ctx.state === 'running' && state === 'on') return true;
  // a context that is not running may never run again (iOS after a lock): start from a fresh one
  if (ctx && ctx.state !== 'running') reset();
  if (!boot()) return false;
  watch(ctx);
  const c = ctx;
  // resume is called right here, inside the tap; a wake that never answers counts as a no
  const woke = await Promise.race([c.resume().then(() => true, () => false), new Promise(r => setTimeout(() => r(false), 700))]);
  if (c !== ctx) return false;
  if (!woke || c.state !== 'running') {
    reset();
    setState('armed');
    return false;
  }
  remember('on');
  startMusic();
  musicOut.gain.cancelScheduledValues(c.currentTime);
  musicOut.gain.setValueAtTime(0, c.currentTime);
  musicOut.gain.setTargetAtTime(MUSIC_LEVEL, c.currentTime, 1.4);
  if (!clock) clock = setInterval(tickMusic, 250);
  setState('on');
  return true;
}

function disable() {
  remember('off');
  setState('off');
  if (!ctx) return;
  musicOut.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
  const c = ctx;
  setTimeout(() => state !== 'on' && c.suspend().catch(() => {}), 600);
}

// every tap (except on the speaker itself, which has its own say) starts the sound, or brings it back
const GESTURES = ['pointerup', 'touchend', 'keydown', 'click'];
const gesture = e => {
  if (pref() === 'off') return;
  if (ctx && ctx.state === 'running' && state === 'on') return;
  if (e.target?.closest?.('[data-sound-toggle], [data-no-sound]')) return;
  if (e.type === 'keydown' && (e.key === 'Escape' || e.metaKey || e.ctrlKey)) return;
  if (typeof navigator !== 'undefined' && navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  enable();
};

export const sound = {
  get state() {
    return state;
  },
  get on() {
    return state === 'on';
  },
  enable,
  disable,
  toggle() {
    if (state === 'on' && ctx?.state === 'running') disable();
    else enable();
  },
  play(name, delay = 0) {
    if (state !== 'on' || !SFX[name]) return;
    const t = ctx.currentTime + delay;
    if (last[name] && t - last[name] < (GAP[name] ?? 0.12)) return;
    last[name] = t;
    SFX[name](t + 0.005);
  },
  // the scene the visitor is in: moves the harmony on
  mood: moveChord,
  // how fast they are scrolling (screens per frame): opens the filter, rings more bells
  energy(v) {
    energy = Math.min(2, energy + Math.abs(v) * 6);
  },
  subscribe(f) {
    listeners.add(f);
    return () => listeners.delete(f);
  },
};

if (typeof window !== 'undefined') {
  state = pref() === 'off' ? 'off' : 'armed';
  GESTURES.forEach(n => addEventListener(n, gesture, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', onVisibility);
  // coming back from the back-forward cache
  addEventListener('pageshow', e => e.persisted && onVisibility());
}

/* For checking levels without speakers: renders a few seconds of music (and an effect) offline and
   returns { rms, peak } in dBFS. Used by scripts only: await (await import('/src/story/sound.js')).measure(8) */
export async function measure(seconds = 8, effect) {
  const c = new OfflineAudioContext(2, Math.ceil(44100 * seconds), 44100);
  const keep = { ctx, sfxIn, musicOut, verb, noiseBuf, music };
  ctx = c;
  music = null;
  build(c, c.destination);
  if (effect) {
    SFX[effect](0.05);
  } else {
    startMusic(c, 0);
    musicOut.gain.value = MUSIC_LEVEL;
    for (let t = 1; t < seconds - 1; t += 2.5) bell(t, inKey(79));
  }
  const buf = await c.startRendering();
  ({ ctx, sfxIn, musicOut, verb, noiseBuf, music } = keep);
  let sum = 0;
  let peak = 0;
  const d = buf.getChannelData(0);
  const from = effect ? 0 : Math.floor(d.length * 0.3);
  for (let i = from; i < d.length; i++) {
    sum += d[i] * d[i];
    peak = Math.max(peak, Math.abs(d[i]));
  }
  const db = x => Math.round(20 * Math.log10(x) * 10) / 10;
  return { rms: db(Math.sqrt(sum / (d.length - from))), peak: db(peak) };
}

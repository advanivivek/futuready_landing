import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { back, buzz, clamp, inout, lerp, out, seg, Stage, useMedia } from './kit';
import { SCENES } from './scenes';
import { sound } from './sound';
import { Book, passportPose, STAMP_AT } from './Passport';
import { useCities } from '../events';
import { BringDialog, ShareButton } from './Extras';
import { TV_SCREENS } from '../data';

// how light a colour is (0 dark, 1 light), for the little line at the bottom
const light = hex => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};
const KEEP = 'futuready-at';


/*
  The timeline. Scrolling moves through the scenes, measured in screens (one screen = 100svh).
  When a scene has everything on it (its rest point), the next stretch of scrolling barely moves it: the
  story slows down smoothly, holds, and speeds up again, so the moment can be seen before it moves on.
*/
const HOLD = 0.5; // screens of scrolling the story spends nearly still at each rest point
const SLOW = 0.05; // how fast the story still moves while holding (a slight drift keeps it alive)
const RAMP = 0.3; // share of the hold spent slowing down and speeding up again
const EXTRA = 0.55; // screens of stretch past the last scene, where FUTUREADY peeps through

// story time passed after t screens of scrolling into a hold of length span
function slowed(t, span) {
  const L = RAMP * span;
  if (t <= 0) return t;
  if (t < L) return t - ((1 - SLOW) / 2) * (t - (L / Math.PI) * Math.sin((Math.PI * t) / L));
  const a = (L * (1 + SLOW)) / 2;
  if (t < span - L) return a + SLOW * (t - L);
  const b = a + SLOW * (span - 2 * L);
  if (t < span) {
    const v = t - (span - L);
    return b + SLOW * v + ((1 - SLOW) / 2) * (v - (L / Math.PI) * Math.sin((Math.PI * v) / L));
  }
  return b + a + (t - span);
}

const TL = [];
let TOTAL = 0;
SCENES.forEach((sc, i) => {
  const Tn = SCENES[i + 1]?.enter.T ?? 0;
  const t = { start: TOTAL, x0: null, hold: 0, span: 0, after0: 0 };
  if (sc.rest != null) {
    t.hold = sc.hold ?? HOLD;
    t.span = t.hold / ((1 - SLOW) * (1 - RAMP));
    t.x0 = sc.rest - 0.06;
    t.after0 = t.x0 + t.span - t.hold;
    t.len = t.after0 + (sc.after ?? 0.12) + Tn;
  } else t.len = sc.len;
  t.raw = t.len + t.hold;
  TL.push(t);
  TOTAL += t.raw;
});
const INDEX = Object.fromEntries(SCENES.map((sc, i) => [sc.id, i]));
const LEVEL_IDS = ['R', 'E', 'A', 'D', 'Y'];
const CREAM = '#efe6d2';

const contentAt = (i, x) => {
  const t = TL[i];
  return t.x0 == null || x <= t.x0 ? x : t.x0 + slowed(x - t.x0, t.span);
};
// the scroll offset (screens into scene i) at which its story time is s
const rawAt = (i, s) => {
  const t = TL[i];
  if (t.x0 == null || s <= t.x0) return s;
  if (s >= t.after0) return s + t.hold;
  let a = t.x0;
  let b = t.x0 + t.span;
  for (let n = 0; n < 40; n++) {
    const m = (a + b) / 2;
    if (contentAt(i, m) < s) a = m;
    else b = m;
  }
  return (a + b) / 2;
};


/* ---------- how one scene arrives over another ---------- */
const JAG = Array.from({ length: 40 }, (_, i) => Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1));
function tearEdge(p, { W, H }, lift = 0) {
  const e = inout(p);
  const n = 30;
  return Array.from({ length: n + 1 }, (_, j) => [(j / n) * W, H * (1.15 - 1.4 * e) + (j / n - 0.5) * 0.16 * H + (JAG[j] - 0.5) * 16 - lift * (0.55 + JAG[j + 3])]);
}
const clip = v => ({ clipPath: v, WebkitClipPath: v });
const poly = pts => `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
// the TV's screen and how far the camera flies toward it. The lab scene is only ever scaled up to 2.4x:
// scaling a whole screen up ten times (straight into the glass) made phones and laptops drop tiles and flicker.
const TV_ZOOM = 2.4;
const tvZoom = g => ({ ox: g.l + g.w / 2, oy: g.t + g.h / 2, Z: TV_ZOOM });
const FX = {
  // a sheet of paper slides up over the last
  slide: {
    edge: 0.93,
    in: p => ({ style: { transform: `translate3d(0, ${((1 - inout(p)) * 100).toFixed(3)}%, 0)`, boxShadow: '0 -24px 60px rgba(10, 12, 30, 0.22)' } }),
    out: p => ({ style: { transform: `translate3d(0, ${(-inout(p) * 12).toFixed(3)}%, 0)` } }),
  },
  // a circle opens from a point (her phone, the "?" dot, a spotlight), the last scene zooms into it
  iris: {
    edge: 0.75,
    in: (p, g) => {
      const R = Math.hypot(Math.max(g.x, g.W - g.x), Math.max(g.y, g.H - g.y));
      return { style: clip(`circle(${lerp(g.r0 || 0, R, inout(p)).toFixed(1)}px at ${g.x.toFixed(1)}px ${g.y.toFixed(1)}px)`) };
    },
    out: (p, g) => (g.zoom && !g.calm ? { style: { transform: `scale(${1 + g.zoom * inout(p) * inout(p)})`, transformOrigin: `${g.x}px ${g.y}px`, willChange: 'transform' } } : null),
  },
  // torn up from the bottom, leaving a white paper edge
  tear: {
    edge: 0.85,
    in: (p, g) => ({ style: clip(poly([[0, g.H + 80], [g.W, g.H + 80], ...tearEdge(p, g).reverse()])) }),
    out: (p, g) => ({ rim: poly([...tearEdge(p, g, 9), ...tearEdge(p, g, -1).reverse()]) }),
  },
  // the last scene shrinks into a photo print and drops away
  shrink: {
    over: true,
    edge: 0.35,
    in: p => ({ style: { transform: `scale(${1.14 - 0.14 * out(p)})` } }),
    out: p => {
      const e = inout(p);
      return {
        style: {
          transform: `translate3d(0, ${e * e * 80}%, 0) scale(${1 - 0.42 * e}) rotate(${-7 * e}deg)`,
          willChange: 'transform',
          borderRadius: `${18 * e}px`,
          boxShadow: `0 0 0 ${Math.round(12 * e)}px #fffcf5, 0 40px 80px rgba(10, 12, 30, ${0.4 * e})`,
        },
      };
    },
  },
  // the last scene turns over like a passport page
  page: {
    over: true,
    edge: 0.6,
    in: p => ({ shade: 0.32 * (1 - p) }),
    out: p => {
      const e = inout(p);
      // hidden once it is past edge-on, so a page never shows its mirrored back
      return { style: { transform: `perspective(1700px) rotateY(${(-108 * e).toFixed(2)}deg)`, transformOrigin: '0 50%', backfaceVisibility: 'hidden', visibility: e > 0.83 ? 'hidden' : undefined }, shade: 0.5 * e };
    },
  },
  // wiped in from the right, like a train pulling in
  wipe: {
    edge: 0.5,
    in: p => ({ style: clip(`inset(0 0 0 ${((1 - inout(p)) * 100).toFixed(2)}%)`) }),
    out: p => ({ style: { transform: `translate3d(${(-inout(p) * 16).toFixed(2)}%, 0, 0)` } }),
  },
  // into the TV: the next scene is on its screen, and the camera flies in
  tv: {
    edge: 0.8,
    in: (p, g) => {
      const { ox, oy, Z } = tvZoom(g);
      const zo = g.calm ? 1 : lerp(1, Z, inout(p));
      // the TV's glass, where the camera has moved it, opening out to the whole page in the second half
      const glass = [ox + (g.l - ox) * zo, oy + (g.t - oy) * zo, ox + (g.l + g.w - ox) * zo, oy + (g.t + g.h - oy) * zo];
      const w = inout(seg(p, 0.3, 1));
      const [L, T, R, B] = [lerp(glass[0], 0, w), lerp(glass[1], 0, w), lerp(glass[2], g.W, w), lerp(glass[3], g.H, w)];
      // the trainer's scene, fitted to that window
      const k = (B - T) / g.H;
      return {
        style: clip(`inset(${T.toFixed(1)}px ${(g.W - R).toFixed(1)}px ${(g.H - B).toFixed(1)}px ${L.toFixed(1)}px round ${(g.round * zo * (1 - w)).toFixed(1)}px)`),
        inner: { transform: `translate3d(${((L + R) / 2 - g.W / 2).toFixed(1)}px, ${((T + B) / 2 - g.H / 2).toFixed(1)}px, 0) scale(${k.toFixed(4)})`, transformOrigin: '50% 50%', willChange: 'transform' },
      };
    },
    out: (p, g) => {
      if (g.calm) return null;
      const { ox, oy, Z } = tvZoom(g);
      return { style: { transform: `scale(${lerp(1, Z, inout(p))})`, transformOrigin: `${ox}px ${oy}px`, willChange: 'transform' } };
    },
  },
};
const TSOUND = { slide: 'whoosh', iris: 'swell', tear: 'tear', shrink: 'whoosh', page: 'page', wipe: 'whoosh', tv: 'tv' };

/*
  Scroll position in screens. On phones it is eased toward the finger with a time-based
  exponential (the same feel at 60 Hz and 120 Hz); laptops get Lenis instead (see App).
*/
function useScreens(unit, smooth, paused) {
  const [u, setU] = useState(0);
  useEffect(() => {
    let target = scrollY / unit;
    let cur = target;
    let raf = 0;
    let t0 = 0;
    const tick = now => {
      const dt = t0 ? Math.min(64, now - t0) : 16;
      t0 = now;
      cur = smooth ? cur + (target - cur) * (1 - Math.exp(-dt / 70)) : target;
      if (Math.abs(target - cur) < 0.0004) cur = target;
      setU(cur);
      if (cur !== target) raf = requestAnimationFrame(tick);
      else {
        raf = 0;
        t0 = 0;
      }
    };
    const on = () => {
      // while a form is open the phone may scroll the page to show the keyboard: the story ignores it
      if (paused.current) return;
      target = scrollY / unit;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    on();
    addEventListener('scroll', on, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('scroll', on);
    };
  }, [unit, smooth, paused]);
  return u;
}

function useWidth() {
  const [W, setW] = useState(() => innerWidth);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setW(innerWidth));
    };
    addEventListener('resize', on);
    return () => removeEventListener('resize', on);
  }, []);
  return W;
}

function useSound() {
  const [s, setS] = useState(sound.state);
  useEffect(() => sound.subscribe(setS), []);
  return s;
}

const SpeakerIcon = ({ state }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" stroke="none" />
    {state === 'off' ? (
      <path d="m16 9 6 6m0-6-6 6" />
    ) : (
      <>
        <path className="w1" d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path className="w2" d="M18.5 5.5a9 9 0 0 1 0 13" />
      </>
    )}
  </svg>
);

/* Past the last scene: the page stretches up and FUTUREADY glows underneath, then springs back. */
function Beyond({ over, W }) {
  const ref = useRef(null);
  const [size, setSize] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let alive = true;
    const fit = () => {
      const prev = el.style.fontSize;
      el.style.fontSize = '100px';
      const w = el.scrollWidth;
      el.style.fontSize = prev;
      if (alive && w) setSize((100 * (W - 16)) / w);
    };
    fit();
    document.fonts?.ready.then(fit);
    return () => {
      alive = false;
    };
  }, [W]);
  const e = out(seg(over, 0, 0.75));
  const stretch = back(seg(over, 0, 0.6));
  return (
    <div className="beyond" style={{ '--o': e }} aria-hidden="true">
      <div className="beyond__stars" style={{ transform: `translate3d(0, ${(1 - e) * 40}px, 0)` }} />
      <div
        className="beyond__script"
        style={{
          fontSize: size * 0.72,
          bottom: `calc(env(safe-area-inset-bottom) + ${6 + size * 0.7}px)`,
          // written left to right; the margins leave room for the swashes, which reach past the letters
          clipPath: `inset(-45% ${(1 - seg(over, 0.2, 0.85)) * 120 - 20}% -45% -20%)`,
          transform: `translate3d(-50%, ${(1 - e) * 40}%, 0) rotate(-4deg)`,
        }}
      >
        experience
      </div>
      <div ref={ref} className="beyond__word" style={{ fontSize: size || undefined, transform: `translate3d(-50%, ${(1 - e) * 60}%, 0) scale(${lerp(1.12, 1, e)}, ${lerp(0.3, 1, stretch)})` }}>
        FUTUREADY
      </div>
    </div>
  );
}

export default function Story() {
  const touch = useMedia('(hover: none) and (pointer: coarse)');
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const W = useWidth();
  const probe = useRef(null);
  const [unit, setUnit] = useState(() => innerHeight);
  const [safe, setSafe] = useState(0);
  const soundState = useSound();
  const cities = useCities();
  const jumping = useRef(0);
  const [bring, setBring] = useState(null);
  // While the campus form is open, the story is paused: nothing reacts to scrolling (a phone scrolls the page
  // to lift a field above the keyboard), nothing springs back. When it closes, the page goes back exactly
  // where it was and the story picks up again.
  const paused = useRef(false);
  const savedY = useRef(0);
  const openBring = useCallback((city = '') => {
    savedY.current = scrollY;
    paused.current = true;
    window.__lenis?.stop();
    setBring({ city });
  }, []);
  const closeBring = useCallback(() => {
    setBring(null);
    const y = savedY.current;
    const back = () => {
      if (window.__lenis) {
        window.__lenis.start();
        window.__lenis.scrollTo(y, { immediate: true, force: true });
      } else scrollTo(0, y);
    };
    back();
    // the keyboard closing can scroll the page once more: put it back again, then let the story follow
    setTimeout(() => {
      if (Math.abs(scrollY - y) > 2) back();
      paused.current = false;
    }, 350);
  }, []);

  // One "screen" = the small viewport height (100svh), so iOS toolbars never move the floor or the story.
  useEffect(() => {
    const m = () => {
      setUnit(probe.current.getBoundingClientRect().height || innerHeight);
      setSafe(parseFloat(getComputedStyle(probe.current).paddingBottom) || 0);
    };
    m();
    addEventListener('resize', m);
    return () => removeEventListener('resize', m);
  }, []);
  const H = unit;
  const land = W > H * 1.05;
  const gutter = land && W >= 760 ? Math.max(48, W * 0.04) : 28;
  const u = useScreens(unit, touch && !reduced, paused);
  const uu = Math.min(u, TOTAL);
  // a hair past the end (a trackpad's last nudge) shows nothing; past that the page starts to lift
  const over = clamp((u - TOTAL - 0.015) / EXTRA);

  const sAt = id => {
    const i = INDEX[id];
    const x = uu - TL[i].start;
    return x < 0 ? x : contentAt(i, x);
  };
  const enterP = id => {
    const i = INDEX[id];
    return clamp(1 + (uu - TL[i].start) / (SCENES[i].enter?.T || 1));
  };

  // Where you were: kept for this tab only, so a phone that reloads the page after a lock (iOS does, to
  // save memory) puts you back in the same scene instead of at the top. A new visit starts at the top.
  const unitRef = useRef(unit);
  useEffect(() => {
    unitRef.current = unit;
  }, [unit]);
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    let saved = 0;
    try {
      saved = Number(sessionStorage.getItem(KEEP)) || 0;
    } catch {
      /* private mode */
    }
    // two frames in, once the page has its full height
    if (saved > 0) requestAnimationFrame(() => requestAnimationFrame(() => scrollTo(0, saved * unitRef.current)));
    const keep = () => {
      try {
        sessionStorage.setItem(KEEP, String(Math.min(scrollY / unitRef.current, TOTAL)));
      } catch {
        /* private mode */
      }
    };
    const onHide = () => document.visibilityState === 'hidden' && keep();
    addEventListener('pagehide', keep);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      removeEventListener('pagehide', keep);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);

  useEffect(() => {
    // for scripts/shots.mjs: where (in px) a scene is at story time s, and halfway through its arrival
    window.__story = {
      ids: SCENES.map(x => x.id),
      lens: TL.map(t => t.len),
      rests: SCENES.map(x => x.rest ?? null),
      unit,
      total: TOTAL,
      y: (id, s = 0) => (TL[INDEX[id]].start + rawAt(INDEX[id], s)) * unit,
      mid: id => (TL[INDEX[id]].start - (SCENES[INDEX[id]].enter?.T ?? 0) / 2) * unit,
    };
  }, [unit]);

  const jump = useCallback(
    (id, s = 0) => {
      const y = (TL[INDEX[id]].start + rawAt(INDEX[id], s)) * unit;
      jumping.current = performance.now() + 2600;
      if (window.__lenis) window.__lenis.scrollTo(y, { duration: 2.4 });
      else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    },
    [unit, reduced]
  );

  let idx = 0;
  TL.forEach((t, i) => {
    if (uu >= t.start) idx = i;
  });

  // sounds and haptics as you move forward through the story
  const stamps = LEVEL_IDS.filter(id => sAt(id) >= STAMP_AT).length;
  const lastStamps = useRef(stamps);
  useEffect(() => {
    if (stamps > lastStamps.current) {
      buzz(stamps === 5 ? [16, 50, 24, 50, 40] : 14);
      sound.play('thunk');
    }
    lastStamps.current = stamps;
  }, [stamps]);

  useEffect(() => sound.mood(idx), [idx]);

  const lastU = useRef(u);
  useEffect(() => {
    const a0 = lastU.current;
    lastU.current = u;
    sound.energy(u - a0);
    if (!sound.on || u <= a0 || u - a0 > 1 || performance.now() < jumping.current) return;
    if (a0 < TOTAL + EXTRA * 0.15 && u >= TOTAL + EXTRA * 0.15) sound.play('shimmer');
    const a = Math.min(a0, TOTAL);
    const b = Math.min(u, TOTAL);
    SCENES.forEach((sc, i) => {
      const t = TL[i];
      const xa = a - t.start;
      const xb = b - t.start;
      const T = sc.enter?.T ?? 0;
      if (xb < -T || xa > t.raw) return;
      if (T && 1 + xa / T < 0.06 && 1 + xb / T >= 0.06) sound.play(TSOUND[sc.enter.type]);
      const sa = xa < 0 ? xa : contentAt(i, xa);
      const sb = xb < 0 ? xb : contentAt(i, xb);
      sc.cues?.forEach(([at, name]) => sa < at && sb >= at && sound.play(name));
      if (t.x0 != null && (xa - t.x0) / t.span < 0.14 && (xb - t.x0) / t.span >= 0.14) {
        sound.play('settle');
        buzz(6);
      }
    });
  }, [u]);

  // When the scrolling stops halfway through a change of scene, finish it (or go back), so the page always
  // rests on a whole picture. Past the end, spring back.
  useEffect(() => {
    let timer = 0;
    let touching = false;
    let busyTill = 0;
    const go = (y, d) => {
      // while it glides there, a trackpad's leftover momentum cannot push it back (that made a loop)
      busyTill = performance.now() + d * 1000 + 300;
      if (window.__lenis) window.__lenis.scrollTo(y, { duration: d, easing: t => 1 - Math.pow(1 - t, 3), lock: true, force: true });
      else window.scrollTo({ top: y, behavior: 'smooth' });
    };
    const check = () => {
      if (touching || paused.current || window.__still) return;
      const now = performance.now();
      const wait = Math.max(busyTill, jumping.current) - now;
      if (wait > 0) return later(wait + 30);
      const r = scrollY / unit;
      if (r > TOTAL + 0.03) return go(TOTAL * unit, 0.8);
      for (let i = 1; i < SCENES.length; i++) {
        const T = SCENES[i].enter.T;
        const b = TL[i].start;
        const a = b - T;
        if (r > a + 0.03 && r < b - 0.03) return go(((r - a) / T < 0.5 ? a : b) * unit, 0.7);
      }
    };
    const later = ms => {
      clearTimeout(timer);
      timer = setTimeout(check, ms);
    };
    const onScroll = () => later(180);
    const down = () => {
      touching = true;
      clearTimeout(timer);
    };
    const up = () => {
      touching = false;
      later(240);
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('touchstart', down, { passive: true });
    addEventListener('touchend', up, { passive: true });
    addEventListener('touchcancel', up, { passive: true });
    return () => {
      clearTimeout(timer);
      removeEventListener('scroll', onScroll);
      removeEventListener('touchstart', down);
      removeEventListener('touchend', up);
      removeEventListener('touchcancel', up);
    };
  }, [unit]);

  // warm the cache with every picture once the first scene is up
  useEffect(() => {
    const t = setTimeout(() => {
      const base = import.meta.env.BASE_URL;
      const urls = [
        ...[
          'girl-sit', 'girl-list', 'girl-lens', 'girl-baton', 'girl-walk', 'girl-phone',
          'boy-sit', 'boy-plan', 'boy-run', 'boy-wave', 'boy-laptop', 'boy-thumb',
          'bot-type', 'bot-cage-open', 'bot-cage', 'bot-paper', 'bot-block', 'bot-horn', 'bot-wave', 'bot-stand',
          'bug', 'tv', 'blocks', 'desk', 'stamp', 'squad', 'engine', 'coach', 'crowd',
          'vivek-dance', 'vivek-kick', 'vivek-walk', 'vivek-step', 'vivek-chair', 'vivek-lean',
        ].map(n => `${base}story/${n}.webp`),
        ...TV_SCREENS.map(f => `${base}${f}`),
      ];
      urls.forEach((src, j) => {
        // fetch and decode ahead, a few at a time, so no picture decodes in the middle of a scroll
        setTimeout(() => {
          const i = new Image();
          i.src = src;
          i.decode?.().catch(() => {});
        }, j * 60);
      });
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const ctx = useMemo(() => ({ W, H, land, jump, cities, reduced, openBring }), [W, H, land, jump, cities, reduced, openBring]);
  // With "reduce motion" on, scenes still change the same way (you drive them with your own scroll), but
  // nothing zooms: no camera moves, no flying into the TV.
  const geo = enter => ({ W, H, land, calm: reduced, ...(enter.at ? enter.at({ W, H, land }) : {}) });
  const fx = (enter, dir, p) => FX[enter.type][dir](p, geo(enter));

  // the header takes the colours of whichever scene is behind it
  const nextUp = SCENES[idx + 1];
  const topScene = nextUp && enterP(nextUp.id) > (nextUp.enter.edge ?? FX[nextUp.enter.type].edge) ? nextUp : SCENES[idx];
  const headInk = topScene.ink;
  const topWall = topScene.wall;

  // The phone's own bars (the status bar by the notch, Android's address bar) take the colour of the scene
  // at the top, and so does the page behind them, so the page reads as one piece with the phone.
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', topWall);
    document.documentElement.style.backgroundColor = topWall;
  }, [topWall]);
  // past the end the page lifts; on phones by less, the word there is smaller
  const lift = over > 0 ? H * (land ? 0.46 : 0.24) * (1 - Math.pow(1 - over, 2.2)) : 0;

  // the little line at the bottom: "scroll" at the start, then it fills while a scene holds
  const tc = TL[idx];
  const hp = tc.x0 != null ? clamp((uu - tc.start - tc.x0) / tc.span) : 0;
  const cueO = idx === 0 ? 1 - seg(u, 0.05, 0.3) : seg(hp, 0.04, 0.16) * (1 - seg(hp, 0.86, 1));
  // it sits on the floor (or the wall, where there is no floor): grey on light colours, cream on dark
  const under = SCENES[idx].F ? SCENES[idx].floor : SCENES[idx].wall;
  const cueInk = light(under) > 0.6 ? 'rgba(22, 26, 58, 0.5)' : 'rgba(255, 252, 245, 0.75)';

  const pose = passportPose({ t: sAt, enter: enterP, W, H, land, gutter, safe });

  return (
    <>
      <div ref={probe} className="probe" aria-hidden="true" />
      <div className="track" style={{ height: (TOTAL + EXTRA) * unit + H }} />
      {/* behind the scenes, the colour of the one you are in: a frame not painted in time never flashes dark */}
      <div className="theatre" style={{ background: over > 0 ? '#0b0820' : SCENES[idx].wall }}>
        {over > 0 ? <Beyond over={over} W={W} /> : null}
        {SCENES.map((sc, i) => {
          const t = TL[i];
          const x = uu - t.start;
          const T = sc.enter?.T ?? 0;
          if (x < -T || x > t.raw + 0.02) return null;
          const s = x < 0 ? x : contentAt(i, x);
          const ss = Math.max(s, 0);
          const pin = x < 0 ? clamp(1 + x / T) : 1;
          const nxt = SCENES[i + 1];
          const nx = nxt ? uu - TL[i + 1].start : -99;
          const pout = nxt && nx > -nxt.enter.T ? clamp(1 + nx / nxt.enter.T) : 0;
          const k = { ...ctx, F: sc.F, after0: t.after0, len: t.len };
          const holdP = t.x0 != null ? clamp((x - t.x0) / t.span) : 0;
          const cam = !reduced && sc.cam ? sc.cam(ss, k) : null;
          const push = !reduced && sc.push !== false ? 1 + 0.035 * inout(holdP) : 1;
          const z = (cam ? cam.z : 1) * push;
          const fin = pin < 1 ? fx(sc.enter, 'in', pin) : null;
          const fout = pout > 0 ? fx(nxt.enter, 'out', pout) : null;
          const above = fout && FX[nxt.enter.type].over;
          const last = i === SCENES.length - 1 && lift > 0;
          return (
            <Stage.Provider key={sc.id} value={k}>
              <section
                className={`scene scene--${sc.id}`}
                aria-hidden={i !== idx}
                style={{
                  '--wall': sc.wall,
                  '--floor': sc.floor,
                  '--ink': sc.ink,
                  '--F': `${sc.F * 100}%`,
                  zIndex: above ? 2 * i + 4 : 2 * i + 1,
                  ...fin?.style,
                  ...fout?.style,
                  ...(last
                    ? {
                        transform: `translate3d(0, ${-lift}px, 0)`,
                        borderRadius: `0 0 ${28 * over}px ${28 * over}px`,
                        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.45)',
                      }
                    : null),
                }}
              >
                <div className="scene__in" style={fin?.inner || undefined}>
                  <div className="cam" style={z !== 1 ? { transformOrigin: `${(cam?.x ?? 0.5) * 100}% ${(cam?.y ?? 0.5) * 100}%`, transform: `scale(${z})` } : undefined}>
                    <div className="wall" />
                    {sc.F ? <div className="floor" /> : null}
                    {sc.world ? sc.world(ss, k) : null}
                  </div>
                  {sc.ui ? sc.ui(ss, k) : null}
                </div>
                {fin?.shade || fout?.shade ? <i className="fx-shade" style={{ opacity: (fin?.shade || 0) + (fout?.shade || 0) }} /> : null}
                {fout?.rim ? <i className="fx-rim" style={{ clipPath: fout.rim }} /> : null}
              </section>
            </Stage.Provider>
          );
        })}
        {pose ? <Book {...pose} /> : null}
        <header className={`head ${headInk === CREAM ? 'is-light' : ''}`} style={{ '--ink': headInk }}>
          <a href="#top" className="head__brand" aria-label="Futuready by Hack2skill, back to the start" onClick={e => (e.preventDefault(), jump('title'))}>
            <span>Futuready</span>
            <img src={`${import.meta.env.BASE_URL}h2s-logo.png`} alt="" width="48" height="18" />
          </a>
          <div className="head__actions">
            <ShareButton label="Share" iconOnly icon={20} className="share--head" />
            <button className="snd" data-sound-toggle="" data-state={soundState} aria-pressed={soundState === 'on'} aria-label="Sound" onClick={() => sound.toggle()}>
              <SpeakerIcon state={soundState} />
            </button>
            <button
              className="pill pill--small pill--head"
              onClick={() => {
                sound.play('click');
                jump('train', 1.0);
              }}
            >
              Attend
            </button>
          </div>
        </header>
        <div className={`cue ${idx === 0 ? 'cue--start' : ''}`} style={{ opacity: cueO, color: cueInk }} aria-hidden="true">
          {idx === 0 ? <span>Scroll</span> : null}
          <i>
            <b style={idx === 0 ? undefined : { transform: `scaleY(${hp})` }} />
          </i>
        </div>
        <div className="progress" style={{ transform: `scaleX(${clamp(u / TOTAL)})` }} aria-hidden="true" />
      </div>
      <BringDialog open={!!bring} city={bring?.city} onClose={closeBring} />
    </>
  );
}

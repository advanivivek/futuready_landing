import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { sound } from './sound';

/* ---------- timing ---------- */
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const seg = (s, a, b) => clamp((s - a) / (b - a));
export const lerp = (a, b, t) => a + (b - a) * t;
export const out = t => 1 - Math.pow(1 - t, 3);
export const inout = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const back = t => {
  const c = 1.6;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};
// rises 0 → 1 → 0 across [a, b]
export const arc = (s, a, b) => Math.sin(seg(s, a, b) * Math.PI);

/* ---------- media ---------- */
export function useMedia(query) {
  const [on, setOn] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const set = () => setOn(m.matches);
    m.addEventListener('change', set);
    return () => m.removeEventListener('change', set);
  }, [query]);
  return on;
}

/* ---------- stage ---------- */
// W, H: stage size in px. land: wider than tall. F: this scene's floor height (fraction of H).
export const Stage = createContext({ W: 390, H: 760, land: false, F: 0.24 });
export const useStage = () => useContext(Stage);
export const pick = (v, land) => (Array.isArray(v) ? v[land ? 1 : 0] : v);

export const poke = e => {
  const el = e.currentTarget;
  el.classList.remove('is-poked');
  void el.offsetWidth;
  el.classList.add('is-poked');
};

// what a cut-out says when you tap it
const sfxFor = src => (/bot-/.test(src) ? 'robot' : /bug/.test(src) ? 'squeak' : /\/tv\./.test(src) ? 'tv' : /squad/.test(src) ? 'cheer' : 'paper');

/*
  A paper cut-out standing on the floor.
  x: centre, as a fraction of the stage width.   h: height, as a fraction of the stage height.
  d: how far forward on the floor (0 = on the wall line).   dx/dy: offsets in px.
  Any of x, h, d can be [portrait, landscape].   sfx: the sound it makes when tapped (guessed from src).
*/
export function Cut({ src, alt = '', x, h, d = 0.06, z = 2, dx = 0, dy = 0, r = 0, sc = 1, o = 1, flip = false, shadow = true, wiggle = 'hop', sfx, priority, className = '', style, onClick, children }) {
  const { W, H, land, F } = useStage();
  const height = pick(h, land) * H;
  const left = pick(x, land) * W + dx;
  const bottom = (F - pick(d, land)) * H - dy;
  return (
    <div
      className={`cut ${className}`}
      data-wiggle={wiggle}
      style={{
        height,
        zIndex: z,
        opacity: o,
        // placed with transforms only, so moving it never re-lays-out the page
        transform: `translate3d(${left.toFixed(2)}px, ${(-bottom).toFixed(2)}px, 0) translateX(-50%) rotate(${r}deg) scale(${flip ? -sc : sc}, ${sc})`,
        ...style,
      }}
      onClick={
        onClick || wiggle
          ? e => {
              if (onClick) onClick(e);
              else poke(e);
              sound.play(sfx || sfxFor(src));
            }
          : undefined
      }
      onAnimationEnd={e => e.currentTarget.classList.remove('is-poked')}
    >
      {shadow ? <i className="cut__shadow" aria-hidden="true" /> : null}
      <img src={src} alt={alt} draggable={false} decoding="async" fetchPriority={priority} />
      {children}
    </div>
  );
}

/* Text that types itself as you scroll. p: 0 → 1. */
export function Typed({ text, p, className = '' }) {
  const n = Math.round(text.length * clamp(p));
  // a typewriter key for every new letter (when sound is on)
  const prev = useRef(n);
  useEffect(() => {
    if (n > prev.current && n < text.length + 1) sound.play('tick');
    prev.current = n;
  }, [n, text.length]);
  return (
    <span className={`typed ${className}`} aria-label={text} role="text">
      <span aria-hidden="true">{text.slice(0, n)}</span>
      {n > 0 && n < text.length ? <i className="caret" aria-hidden="true" /> : null}
      <span className="typed__ghost" aria-hidden="true">
        {text.slice(n)}
      </span>
    </span>
  );
}

/* Several lines, each kept on its own row exactly as written, typed one after another. */
export function Rows({ rows, p, className = 'line' }) {
  const total = rows.reduce((a, r) => a + r.length, 0);
  let at = 0;
  return rows.map((r, i) => {
    const a = at / total;
    at += r.length;
    return <Typed key={i} text={r} p={seg(p, a, at / total)} className={`${className} row`} />;
  });
}

/*
  The words of a scene. With fit, rows written on separate lines stay on one line each: the type shrinks
  (down to 70%) until the longest row fits the screen, and only below that do rows wrap (balanced).
*/
export function Lines({ children, className = '', fit = false, style }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!fit) return;
    const el = ref.current;
    let width = 0;
    const measure = force => {
      const w = el.clientWidth;
      if (!w || (w === width && !force)) return;
      width = w;
      el.style.setProperty('--fit', '1');
      delete el.dataset.wrap;
      let max = 0;
      el.querySelectorAll('.row').forEach(r => (max = Math.max(max, r.offsetWidth)));
      const k = max ? Math.min(1, w / max) : 1;
      el.style.setProperty('--fit', String(Math.max(0.7, k * 0.99)));
      if (k < 0.7) el.dataset.wrap = '';
    };
    measure(true);
    let alive = true;
    document.fonts?.ready.then(() => alive && measure(true));
    const ro = new ResizeObserver(() => measure(false));
    ro.observe(el);
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [fit]);
  return (
    <div ref={ref} className={`lines ${fit ? 'lines--fit' : ''} ${className}`} style={style}>
      {children}
    </div>
  );
}

export const Note = ({ o, children }) => (
  <p className="note" style={{ opacity: o, transform: `translateY(${(1 - o) * 8}px)` }}>
    <span aria-hidden="true">› </span>
    {children}
  </p>
);

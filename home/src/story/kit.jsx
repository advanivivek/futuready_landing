import { createContext, useContext, useEffect, useState } from 'react';

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

const poke = e => {
  const el = e.currentTarget;
  el.classList.remove('is-poked');
  void el.offsetWidth;
  el.classList.add('is-poked');
};

/*
  A paper cut-out standing on the floor.
  x: centre, as a fraction of the stage width.   h: height, as a fraction of the stage height.
  d: how far forward on the floor (0 = on the wall line).   dx/dy: offsets in px.
  Any of x, h, d can be [portrait, landscape].
*/
export function Cut({ src, alt = '', x, h, d = 0.06, z = 2, dx = 0, dy = 0, r = 0, sc = 1, o = 1, flip = false, shadow = true, wiggle = 'hop', className = '', style, onClick, children }) {
  const { W, H, land, F } = useStage();
  const height = pick(h, land) * H;
  const left = pick(x, land) * W + dx;
  const bottom = (F - pick(d, land)) * H - dy;
  return (
    <div
      className={`cut ${className}`}
      data-wiggle={wiggle}
      style={{
        left,
        bottom,
        height,
        zIndex: z,
        opacity: o,
        transform: `translateX(-50%) rotate(${r}deg) scale(${flip ? -sc : sc}, ${sc})`,
        ...style,
      }}
      onClick={onClick || (wiggle ? poke : undefined)}
      onAnimationEnd={e => e.currentTarget.classList.remove('is-poked')}
    >
      {shadow ? <i className="cut__shadow" aria-hidden="true" /> : null}
      <img src={src} alt={alt} draggable={false} decoding="async" />
      {children}
    </div>
  );
}

/* Text that types itself as you scroll. p: 0 → 1. */
export function Typed({ text, p, className = '' }) {
  const n = Math.round(text.length * clamp(p));
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

export const Note = ({ o, children }) => (
  <p className="note" style={{ opacity: o, transform: `translateY(${(1 - o) * 8}px)` }}>
    <span aria-hidden="true">› </span>
    {children}
  </p>
);

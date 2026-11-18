import { createElement, useEffect, useRef, useState } from 'react';

export function useMedia(query) {
  const [on, setOn] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const set = () => setOn(m.matches);
    set();
    m.addEventListener('change', set);
    return () => m.removeEventListener('change', set);
  }, [query]);
  return on;
}

export const useTouch = () => useMedia('(hover: none) and (pointer: coarse)');
export const useReduced = () => useMedia('(prefers-reduced-motion: reduce)');

// Width only: ignores the height jumps of the mobile address bar.
export function useWidth() {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 390));
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setW(window.innerWidth));
    };
    window.addEventListener('resize', on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', on);
    };
  }, []);
  return w;
}

// 0 → 1 as a tall section scrolls through its sticky stage.
export function useProgress(ref) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const v = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      setP(prev => (Math.abs(prev - v) < 0.0005 ? prev : v));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, [ref]);
  return p;
}

// Mounts WebGL only near the viewport and unmounts it far away, so phones never hold
// more than two or three GPU contexts at once.
export function Near({ children, className, style, margin = '120% 0px' }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: margin });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [margin]);
  return createElement('div', { ref, className, style }, on ? children : null);
}

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const span = (p, a, b) => clamp((p - a) / (b - a));
export const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const buzz = pattern => {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* not supported */
  }
};

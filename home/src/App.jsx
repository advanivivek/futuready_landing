import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import GradientASCII from './rb/GradientASCII/GradientASCII';
import { useReduced, useTouch, useWidth } from './hooks';
import { H2S } from './data';

// Start fetching the rest of the journey while the preloader plays.
const journey = import('./Journey.jsx');
const Journey = lazy(() => journey);
const WORD = 'FUTUREADY';

/* A short ritual: the letters assemble, a counter runs to 100, the curtain lifts. */
function Preloader({ onLift }) {
  const [n, setN] = useState(0);
  const [gone, setGone] = useState(false);
  const reduced = useReduced();
  useEffect(() => {
    if (reduced) {
      onLift();
      setGone(true);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const fonts = document.fonts?.ready ?? Promise.resolve();
    let fontsIn = false;
    fonts.then(() => (fontsIn = true));
    const tick = now => {
      const t = Math.min(1, (now - t0) / 1500);
      const v = Math.round((1 - Math.pow(1 - t, 3)) * (fontsIn ? 100 : 92));
      setN(v);
      if (v >= 100) {
        onLift();
        setTimeout(() => setGone(true), 1100);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onLift, reduced]);
  if (gone) return null;
  const shown = Math.floor((n / 100) * (WORD.length + 1));
  return (
    <div className={`loader ${n >= 100 ? 'is-lift' : ''}`} aria-hidden="true">
      <div className="loader__word">
        {[...WORD].map((c, i) => (
          <span key={i} className={i < shown ? 'on' : ''}>
            {c}
          </span>
        ))}
      </div>
      <div className="loader__n">{n}</div>
    </div>
  );
}

function Hero({ live }) {
  const w = useWidth();
  const touch = useTouch();
  const ref = useRef(null);
  // Scroll dives into the eclipse: written to a CSS variable, no re-renders.
  useEffect(() => {
    const el = ref.current;
    let raf = 0;
    const read = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, scrollY / (el.offsetHeight - innerHeight || 1)));
      el.style.setProperty('--hp', p.toFixed(4));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    addEventListener('scroll', on, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('scroll', on);
    };
  }, []);
  return (
    <section ref={ref} className={`hero ${live ? 'is-live' : ''}`} id="top">
      <div className="hero__stage">
      <div className="hero__bg" aria-hidden="true">
        <GradientASCII
            colors={[H2S.violet, '#f4f7ff', H2S.blue, H2S.cyan]}
            shape="eclipse"
            scale={w >= 900 ? 0.68 : 1}
            cellSize={w < 600 ? 12 : 15}
            density={0.85}
            glow={0.4}
            flow={0.55}
            speed={0.8}
            grain={0.05}
            scrambleRadius={touch ? 0.18 : 0.1}
            dpr={Math.min(2, window.devicePixelRatio || 1)}
          />
      </div>

      <div className="hero__top wrap">
        <span className="brand">Futuready</span>
        <img className="hero__logo" src="/h2s-logo.png" alt="Hack2skill" width="64" height="24" />
      </div>

      <div className="hero__foot wrap">
        <h1 className="hero__q">
          <span className="rise" style={{ '--d': '0.15s' }}>
            Are you ready
          </span>
          <span className="rise grad-text" style={{ '--d': '0.3s' }}>
            for the future?
          </span>
        </h1>
        <div className="cue" aria-hidden="true">
          <span>+</span>
          <span className="cue__t">Scroll</span>
          <span>+</span>
        </div>
      </div>
      </div>
    </section>
  );
}

/* Desktop only: a small ring that trails the pointer and swells over things you can touch. */
function Cursor() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    let x = innerWidth / 2,
      y = innerHeight / 2,
      tx = x,
      ty = y,
      raf = 0;
    const move = e => {
      tx = e.clientX;
      ty = e.clientY;
      const hot = e.target.closest?.('a, button, input, [data-hot]');
      el.classList.toggle('is-hot', !!hot);
      el.classList.add('is-on');
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const loop = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    const leave = () => el.classList.remove('is-on');
    addEventListener('pointermove', move);
    document.addEventListener('pointerleave', leave);
    return () => {
      removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div className="cursor" ref={ref} aria-hidden="true" />;
}

export default function App() {
  const [live, setLive] = useState(false);
  const touch = useTouch();
  const reduced = useReduced();
  const lift = useRef(() => setLive(true)).current;

  // Smooth wheel scrolling on desktop; phones keep their native scroll.
  useEffect(() => {
    if (touch || reduced) return;
    let lenis;
    let raf = 0;
    import('lenis').then(({ default: Lenis }) => {
      lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9 });
      window.__lenis = lenis;
      const loop = t => {
        lenis.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
      window.__lenis = undefined;
    };
  }, [touch, reduced]);

  return (
    <main>
      <Preloader onLift={lift} />
      <Hero live={live} />
      {live ? (
        <Suspense fallback={<div style={{ height: '100svh' }} />}>
          <Journey />
        </Suspense>
      ) : null}
      {!touch ? <Cursor /> : null}
    </main>
  );
}

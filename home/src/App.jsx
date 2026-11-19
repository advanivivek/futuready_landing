import { useEffect } from 'react';
import Story from './story/Story';

export default function App() {
  // Smooth wheel scrolling on laptops; phones keep their own native scroll.
  useEffect(() => {
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || calm) return;
    let lenis;
    let raf = 0;
    import('lenis').then(({ default: Lenis }) => {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.8, touchMultiplier: 1 });
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
  }, []);
  return <Story />;
}

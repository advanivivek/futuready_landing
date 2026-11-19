import { useEffect, useState } from 'react';
import Story from './story/Story';

/*
  Team preview. When the site is built with REVIEW_CODE set (see vite.config.js and START-HERE.md), it opens on
  a small screen that asks for the code first. It is a lock against casual sharing, not a safe: the page itself
  is still in the download. Without REVIEW_CODE there is no lock at all.
*/
const LOCK = import.meta.env.VITE_REVIEW_HASH || '';
const KEY = 'futuready-review';

const unlocked = () => {
  if (!LOCK) return true;
  try {
    return localStorage.getItem(KEY) === LOCK;
  } catch {
    return false;
  }
};

async function fingerprint(text) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text.trim()));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function Gate({ onOpen }) {
  const [wrong, setWrong] = useState(false);
  const submit = async e => {
    e.preventDefault();
    const input = e.currentTarget.elements.code;
    if ((await fingerprint(input.value)) === LOCK) {
      try {
        localStorage.setItem(KEY, LOCK);
      } catch {
        /* private mode: asks again next visit */
      }
      onOpen();
    } else {
      setWrong(true);
      input.select();
    }
  };
  return (
    <main className="gate" data-no-sound="">
      <form className="gate__card" onSubmit={submit}>
        <p className="gate__brand">Futuready</p>
        <h1>Team preview</h1>
        <p className="gate__note">This page is not public yet. Enter the review code you were given.</p>
        <label htmlFor="code" className="sr-only">
          Review code
        </label>
        <input
          id="code"
          name="code"
          type="password"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="Review code"
          autoFocus
          aria-invalid={wrong}
          aria-describedby={wrong ? 'code-err' : undefined}
          onInput={() => setWrong(false)}
        />
        {wrong ? (
          <p id="code-err" className="gate__err" role="alert">
            That code is not right. Please check it and try again.
          </p>
        ) : null}
        <button className="pill pill--ink pill--big">Open</button>
      </form>
    </main>
  );
}

function Experience() {
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

export default function App() {
  const [open, setOpen] = useState(unlocked);
  return open ? <Experience /> : <Gate onOpen={() => setOpen(true)} />;
}

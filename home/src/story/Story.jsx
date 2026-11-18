import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { back, clamp, inout, lerp, out, seg, Stage, useMedia } from './kit';
import { SCENES } from './scenes';
import { LEVELS } from '../data';
import { paintPass, sharePass } from '../pass';

const WIPE = 0.7; // screens over which the next scene slides up over the last
const STARTS = SCENES.reduce((a, sc, i) => (a.push(i ? a[i - 1] + SCENES[i - 1].len : 0), a), []);
const TOTAL = STARTS[STARTS.length - 1] + SCENES[SCENES.length - 1].len;
const INDEX = Object.fromEntries(SCENES.map((sc, i) => [sc.id, i]));
const LEVEL_IDS = ['R', 'E', 'A', 'D', 'Y'];
const STAMP_AT = 1.5; // when, inside a level scene, its stamp lands

const buzz = p => {
  try {
    navigator.vibrate?.(p);
  } catch {
    /* no haptics */
  }
};

/* scroll position in screens, smoothed on phones so every scrubbed motion glides */
function useScreens(unit, smooth) {
  const [u, setU] = useState(0);
  useEffect(() => {
    let target = scrollY / unit;
    let cur = target;
    let raf = 0;
    const tick = () => {
      cur += (target - cur) * (smooth ? 0.2 : 1);
      if (Math.abs(target - cur) < 0.0005) cur = target;
      setU(cur);
      raf = cur !== target ? requestAnimationFrame(tick) : 0;
    };
    const on = () => {
      target = scrollY / unit;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    on();
    addEventListener('scroll', on, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('scroll', on);
    };
  }, [unit, smooth]);
  return u;
}

function useStageSize() {
  const [size, setSize] = useState(() => ({ W: innerWidth, H: innerHeight }));
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setSize(p => (p.W === innerWidth && Math.abs(p.H - innerHeight) < 2 ? p : { W: innerWidth, H: innerHeight })));
    };
    addEventListener('resize', on);
    return () => removeEventListener('resize', on);
  }, []);
  return size;
}

function StampMark({ lv, on, tilt }) {
  const id = `ink-${lv.k}`;
  const ring = `Futuready · Episode 01 · ${lv.name} · `;
  return (
    <span className={`mark ${on ? 'is-on' : ''}`} style={{ '--r': `${tilt}deg` }}>
      <i aria-hidden="true">{lv.k}</i>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <path id={`${id}-p`} d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <g fill="none" stroke={lv.color}>
          <circle cx="60" cy="60" r="56" strokeWidth="4" />
          <circle cx="60" cy="60" r="37" strokeWidth="1.6" />
          <text fill={lv.color} stroke="none" fontSize="9.2" fontWeight="700" letterSpacing="1.4" fontFamily="Geist Mono Variable, monospace">
            <textPath href={`#${id}-p`}>{ring + ring.slice(0, 6)}</textPath>
          </text>
          <text x="60" y="73" textAnchor="middle" fill={lv.color} stroke="none" fontSize="38" fontWeight="800" fontFamily="Fraunces Variable, serif">
            {lv.k}
          </text>
        </g>
      </svg>
    </span>
  );
}

/* The passport: drops in, waits in the corner collecting stamps, then comes back to you. */
function Passport({ u, W, H }) {
  const at = id => u - STARTS[INDEX[id]];
  const sFive = at('five');
  const sPass = at('pass');
  if (sFive < 0.3 || at('lab') > 0.05) return null;

  const bw = Math.min(W * 0.62, H * 0.42 * 0.74, 300);
  const bh = bw / 0.74;
  const cw = W < 600 ? 56 : 72;
  const centre = { x: W / 2, y: H * (W > H ? 0.52 : 0.5) };
  const corner = { x: W - 16 - cw / 2, y: 74 + (cw / 0.74) / 2 };

  const drop = back(seg(sFive, 0.3, 0.8));
  const k = inout(seg(sFive, 1.2, 1.5)) * (1 - inout(seg(sPass, 0.15, 0.7)));
  const leave = seg(sPass, SCENES[INDEX.pass].len - WIPE, SCENES[INDEX.pass].len - 0.15);
  const x = lerp(centre.x, corner.x, k);
  const y = lerp(lerp(-bh, centre.y, drop), corner.y, k) - leave * H * 0.2;
  const scale = lerp(1, cw / bw, k);

  const got = LEVEL_IDS.map(id => at(id) >= STAMP_AT);
  // the rubber stamp coming down on the corner passport
  const active = LEVEL_IDS.find(id => at(id) > 1.2 && at(id) < 1.8);
  const q = active ? seg(at(active), 1.25, 1.75) : 0;
  const press = q < 0.5 ? out(q * 2) : 1 - out((q - 0.5) * 2);
  const thunk = active ? 1 + 0.18 * Math.max(0, 1 - Math.abs(at(active) - STAMP_AT) * 12) : 1;

  return (
    <>
      <div
        className="pp"
        role="img"
        aria-label={`Futuready passport, ${got.filter(Boolean).length} of 5 stamps`}
        style={{ width: bw, height: bh, opacity: 1 - leave, transform: `translate(${x - bw / 2}px, ${y - bh / 2}px) scale(${scale * thunk}) rotate(${lerp(-3, 4, k)}deg)` }}
      >
        <div className="pp__band">
          <b>Futuready passport</b>
          <span>Hack2skill</span>
        </div>
        <div className="pp__marks">
          {LEVELS.map((lv, i) => (
            <StampMark key={lv.k} lv={lv} on={got[i]} tilt={[-14, 9, -6, 12, -9][i]} />
          ))}
        </div>
        <div className="pp__mrz" aria-hidden="true">
          P&lt;FUTUREADY&lt;&lt;READY&lt;PLAYER&lt;YOU&lt;&lt;&lt;
          <br />
          {LEVELS.map((l, i) => (got[i] ? l.k : '<')).join('<')}&lt;&lt;HACK2SKILL&lt;&lt;2031
        </div>
      </div>
      {active ? (
        <img
          className="rubber"
          src="/story/stamp.webp"
          alt=""
          aria-hidden="true"
          style={{ left: corner.x, top: corner.y - cw * 1.9 + press * cw * 0.95, opacity: seg(q, 0, 0.1) * (1 - seg(q, 0.9, 1)) }}
        />
      ) : null}
    </>
  );
}

function PassDialog({ open, onClose }) {
  const ref = useRef(null);
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem('futuready-name') || '';
    } catch {
      return '';
    }
  });
  const [img, setImg] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    const t = setTimeout(async () => {
      const c = await paintPass(name);
      if (alive) setImg(c.toDataURL('image/jpeg', 0.9));
      try {
        localStorage.setItem('futuready-name', name);
      } catch {
        /* private mode */
      }
    }, 200);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [open, name]);
  const keep = async () => {
    setBusy(true);
    try {
      await sharePass(name);
    } catch {
      /* share sheet closed */
    }
    setBusy(false);
  };
  return (
    <dialog ref={ref} className="sheet" onClose={onClose} onClick={e => e.target === ref.current && onClose()} aria-labelledby="sheet-h">
      <div className="sheet__body">
        <h2 id="sheet-h">Your Futuready passport</h2>
        {img ? <img className="sheet__pass" src={img} alt={`Futuready passport for ${name.trim() || 'you'}`} /> : <div className="sheet__pass" />}
        <label className="sr-only" htmlFor="pp-name">
          Your name
        </label>
        <input id="pp-name" className="sheet__input" value={name} maxLength={26} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="given-name" autoCapitalize="words" enterKeyHint="done" />
        <div className="sheet__row">
          <button className="pill pill--ink" onClick={keep} disabled={busy}>
            {busy ? 'Saving…' : 'Keep it'}
          </button>
          <button className="pill pill--ghost-ink" onClick={onClose}>
            Back to the story
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default function Story() {
  const touch = useMedia('(hover: none) and (pointer: coarse)');
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const { W, H } = useStageSize();
  const land = W > H * 1.05;
  const probe = useRef(null);
  const [unit, setUnit] = useState(() => innerHeight);
  const [sheet, setSheet] = useState(false);

  // one "screen" of scroll = the small viewport height, so iOS toolbars never shift the story
  useEffect(() => {
    const m = () => setUnit(probe.current.getBoundingClientRect().height || innerHeight);
    m();
    addEventListener('orientationchange', m);
    addEventListener('resize', m);
    return () => {
      removeEventListener('orientationchange', m);
      removeEventListener('resize', m);
    };
  }, []);

  const u = useScreens(unit, touch && !reduced);

  // for scripts/shots.mjs: where each scene starts, in screens
  useEffect(() => {
    window.__story = { starts: STARTS, ids: SCENES.map(x => x.id), lens: SCENES.map(x => x.len), unit };
  }, [unit]);

  const jump = useCallback(
    (id, s = 0) => {
      const y = (STARTS[INDEX[id]] + s) * unit;
      if (window.__lenis) window.__lenis.scrollTo(y, { duration: 2.2 });
      else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    },
    [unit, reduced]
  );
  const onPass = useCallback(() => setSheet(true), []);

  // haptic tap as each stamp lands
  const stamps = LEVEL_IDS.filter(id => u - STARTS[INDEX[id]] >= STAMP_AT).length;
  const last = useRef(stamps);
  useEffect(() => {
    if (stamps > last.current) buzz(stamps === 5 ? [16, 50, 24, 50, 40] : 14);
    last.current = stamps;
  }, [stamps]);

  // warm the cache with every picture, after the first scene is up
  useEffect(() => {
    const t = setTimeout(() => {
      ['girl-sit', 'girl-list', 'girl-lens', 'girl-baton', 'girl-walk', 'bot-type', 'bot-lens', 'bot-paper', 'bot-block', 'bot-horn', 'bug', 'tv', 'blocks', 'stamp', 'squad', 'engine', 'coach', 'crowd', 'tv-04-tools-stage', 'tv-07-bug1-reveal-stage', 'tv-08-podium-stage', 'tv-words-feel'].forEach(n => {
        const i = new Image();
        i.src = `/story/${n}.webp`;
      });
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  let idx = 0;
  STARTS.forEach((st, i) => {
    if (u >= st) idx = i;
  });
  const nextS = idx + 1 < SCENES.length ? u - STARTS[idx + 1] : -9;
  const headInk = nextS > -0.12 ? SCENES[idx + 1].ink : SCENES[idx].ink;
  const ctx = useMemo(() => ({ W, H, land, jump, onPass }), [W, H, land, jump, onPass]);

  return (
    <>
      <div ref={probe} className="probe" aria-hidden="true" />
      <div className="track" style={{ height: TOTAL * unit + H }} />
      <div className="theatre" aria-live="off">
        {SCENES.map((sc, i) => {
          const s = u - STARTS[i];
          if (s < -WIPE || s > sc.len + 0.02) return null;
          const lift = s < 0 ? inout(clamp(-s / WIPE)) : 0;
          return (
            <Stage.Provider key={sc.id} value={{ ...ctx, F: sc.F }}>
              <section
                className={`scene scene--${sc.id}`}
                aria-hidden={i !== idx}
                style={{
                  '--wall': sc.wall,
                  '--floor': sc.floor,
                  '--ink': sc.ink,
                  '--F': `${sc.F * 100}%`,
                  zIndex: i,
                  transform: lift ? `translateY(${lift * 100}%)` : undefined,
                  boxShadow: lift ? '0 -24px 60px rgba(10, 12, 30, 0.22)' : undefined,
                }}
              >
                <div className="wall" />
                <div className="floor" />
                {sc.render(Math.max(s, 0), { ...ctx, F: sc.F })}
              </section>
            </Stage.Provider>
          );
        })}
        <Passport u={u} W={W} H={H} />
        <header className={`head ${headInk === '#efe6d2' ? 'is-light' : ''}`} style={{ '--ink': headInk }}>
          <a href="#top" className="head__brand" onClick={e => (e.preventDefault(), jump('title'))}>
            <img src="/h2s-logo.png" alt="Hack2skill" width="48" height="18" />
            <span>Futuready</span>
          </a>
          <button className="pill pill--small" onClick={() => jump('train', 1.6)}>
            Cities
          </button>
        </header>
        <div className="progress" style={{ transform: `scaleX(${clamp(u / TOTAL)})` }} aria-hidden="true" />
      </div>
      <PassDialog open={sheet} onClose={() => setSheet(false)} />
    </>
  );
}

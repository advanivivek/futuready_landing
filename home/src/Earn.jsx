import { useEffect, useMemo, useState } from 'react';
import Strands from './rb/Strands/Strands';
import HoloCard from './rb/HoloCard/HoloCard';
import { LEVELS } from './data';
import { buzz, Near, useWidth } from './hooks';
import { paintPass, sharePass } from './pass';

const ORB = ['#5fd4ff', '#32b7ec', '#c9d8f2', '#3463af', '#7a5cff', '#2f3a96', '#3c1b7e'];
const KEY = 'futuready-pass';

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
};

export default function Earn() {
  const saved = useMemo(load, []);
  const [got, setGot] = useState(() => (Array.isArray(saved.got) ? saved.got : LEVELS.map(() => false)));
  const [name, setName] = useState(saved.name || '');
  const [flash, setFlash] = useState(null);
  const [img, setImg] = useState('');
  const [busy, setBusy] = useState(false);
  const w = useWidth();
  const count = got.filter(Boolean).length;
  const done = count === LEVELS.length;

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ got, name }));
    } catch {
      /* private mode */
    }
  }, [got, name]);

  useEffect(() => {
    if (!done) return;
    let alive = true;
    const t = setTimeout(async () => {
      const c = await paintPass(name);
      if (alive) setImg(c.toDataURL('image/jpeg', 0.92));
    }, img ? 260 : 0);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, name]);

  const hit = i => {
    if (got[i]) {
      setFlash({ i, at: Date.now() });
      return;
    }
    const next = got.map((v, j) => v || j === i);
    setGot(next);
    setFlash({ i, at: Date.now() });
    buzz(next.every(Boolean) ? [18, 60, 28, 60, 60] : 16);
  };

  const save = async () => {
    setBusy(true);
    try {
      await sharePass(name);
    } catch {
      /* share sheet dismissed */
    }
    setBusy(false);
  };

  const cardW = Math.round(Math.min(w * 0.68, 330));

  return (
    <section className={`earn ${done ? 'is-done' : ''}`} id="earn" aria-labelledby="earn-h">
      <p className="t-label earn__label" id="earn-h">
        {done ? 'Pass unlocked' : 'Five levels. Tap to clear.'}
      </p>

      <div className="earn__orb">
        <Near className="earn__gl">
          <Strands
            colors={ORB}
            count={3}
            level={done ? 1 : 0.06 + count * 0.17}
            energy={0.3 + count * 0.14}
            intensity={0.85 + count * 0.08}
            scale={done ? 1.25 : 1}
            maxDevicePixelRatio={2}
          />
        </Near>
        {flash !== null && !done ? (
          <div className="earn__flash" key={flash.at} style={{ '--c': LEVELS[flash.i].color }}>
            {LEVELS[flash.i].name}
          </div>
        ) : null}
        {done && img ? (
          <div className="earn__pass">
            <HoloCard image={img} alt={`Futuready pass for ${name.trim() || 'you'}`} width={cardW} radius={18} preset="bursts" intensity={0.7} />
          </div>
        ) : null}
      </div>

      <div className="earn__keys" role="group" aria-label="Levels">
        {LEVELS.map((lv, i) => (
          <button
            key={lv.k}
            className="glyph"
            style={{ '--c': lv.color, '--i': i }}
            aria-pressed={got[i]}
            aria-label={`Level ${i + 1}: ${lv.name}`}
            onClick={() => hit(i)}
          >
            {lv.k}
          </button>
        ))}
      </div>

      <div className="earn__claim" aria-hidden={!done}>
        <label className="sr-only" htmlFor="pass-name">
          Your name on the pass
        </label>
        <input
          id="pass-name"
          className="line-input"
          value={name}
          maxLength={26}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          autoComplete="given-name"
          autoCapitalize="words"
          enterKeyHint="done"
          tabIndex={done ? 0 : -1}
        />
        <button className="text-link" onClick={save} disabled={busy} tabIndex={done ? 0 : -1}>
          {busy ? 'Saving' : 'Keep it'} <span aria-hidden="true">↓</span>
        </button>
      </div>
    </section>
  );
}

import { useId } from 'react';
import { LEVELS } from '../data';
import { back, clamp, inout, lerp, out, seg } from './kit';
import { storyPic } from './pics';

/*
  The Futuready passport, as in the Builders Lab deck: a navy book with a gold foil cover that swings open
  onto a page of five stamp slots. It drops in when the bootcamp is introduced, opens, then lies at the
  bottom corner while the levels stamp it, and comes back to the middle, full of stamps, at the end.
*/

export const STAMP_AT = 1.42; // when, inside a level scene, its stamp lands
const RATIO = 1.42; // an open passport, two pages wide

const EMBLEM = (
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <g fill="none" stroke="#E9C27A" strokeWidth="2.4" strokeLinecap="round">
      <path d="M14 66h72" />
      <path d="M26 66a24 24 0 0 1 48 0" />
      <path d="M50 30v-12M33 37l-7-8M67 37l7-8M22 52l-10-3M78 52l10-3" />
      <circle cx="50" cy="50" r="46" strokeWidth="1.6" />
      <path d="M30 76h40M38 84h24" strokeWidth="1.8" />
    </g>
  </svg>
);

export function StampSVG({ lv }) {
  const id = useId();
  const word = lv.name.toUpperCase();
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <path id={id} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
      </defs>
      <g fill="none" stroke={lv.ink} strokeWidth="5">
        <circle cx="100" cy="100" r="95" />
        <circle cx="100" cy="100" r="64" strokeWidth="2.5" />
      </g>
      <text fontFamily="Geist Variable, sans-serif" fontWeight="700" fontSize="12.5" letterSpacing="3.2" fill={lv.ink}>
        <textPath href={`#${id}`} textLength="482" lengthAdjust="spacing">
          FUTUREADY · BUILDERS LAB · HACK2SKILL ·{' '}
        </textPath>
      </text>
      <text x="100" y="116" textAnchor="middle" fontFamily="Unbounded Variable, sans-serif" fontWeight="800" fontSize="70" fill={lv.ink}>
        {lv.k}
      </text>
      <text x="100" y="148" textAnchor="middle" fontFamily="Geist Variable, sans-serif" fontWeight="700" fontSize={word.length > 9 ? 10 : 12.5} letterSpacing="2" fill={lv.ink}>
        {word}
      </text>
    </svg>
  );
}

// slot centres on the stamp page (fractions of the book's width and height), in grid order: title, R, E, A, D, Y
const COLS = [0.636, 0.864];
const ROWS = [0.202, 0.5, 0.798];
const slotAt = i => ({ x: COLS[(i + 1) % 2], y: ROWS[Math.floor((i + 1) / 2)] });

export function Book({ width, x, y, scale = 1, rot = 0, open = 1, opacity = 1, got = [], rubber = null, label }) {
  return (
    <div
      className="book"
      role="img"
      aria-label={label}
      style={{ width, opacity, transform: `translate3d(${x - width / 2}px, ${y - width / RATIO / 2}px, 0) scale(${scale}) rotate(${rot}deg)` }}
    >
      <div className="book__spread" style={{ transform: `translateX(${-25 * (1 - open)}%)` }}>
        <div className="book__page">
          <div className="slots">
            <div className="slot slot--title">
              <b>Stamps</b>
              One for every level you clear.
            </div>
            {LEVELS.map((lv, i) => (
              <div key={lv.k} className={`slot ${got[i] ? 'is-inked' : ''}`} style={{ '--rot': `${[-12, 8, -5, 11, -8][i]}deg` }}>
                <span>{lv.k}</span>
                <div className="slot__stamp">
                  <StampSVG lv={lv} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="book__cover" style={{ transform: `rotateY(${-180 * open}deg)` }}>
          {/* show whichever side faces us (not left to backface-visibility, which some Safaris ignore) */}
          <div className="face face--front" style={{ visibility: open < 0.5 ? 'visible' : 'hidden' }}>
            <div className="foil">
              <div className="foil__d" lang="hi">
                भविष्य
              </div>
              {EMBLEM}
              <div className="foil__t">FUTUREADY</div>
              <div className="foil__s">PASSPORT</div>
              <div className="foil__s foil__s--dim">HACK2SKILL</div>
            </div>
          </div>
          <div className="face face--back" style={{ visibility: open < 0.5 ? 'hidden' : 'visible' }}>
            <div className="inside__eyebrow">Futuready Passport</div>
            <div className="inside__h">Builders Lab</div>
            <p>
              Holder: You
              <br />
              Issued by: Vivek Advani
              <br />
              Embassy: Hack2skill
              <br />
              Valid: from today, till life
            </p>
            <div className="inside__mrz" aria-hidden="true">
              P&lt;FUTUREADY&lt;&lt;BUILDERS&lt;LAB&lt;&lt;&lt;&lt;&lt;&lt;
              <br />
              R&lt;E&lt;A&lt;D&lt;Y&lt;&lt;HACK2SKILL&lt;&lt;&lt;&lt;&lt;2031
            </div>
          </div>
        </div>
      </div>
      {rubber ? (
        <img
          className="rubber"
          src={storyPic('stamp')}
          alt=""
          aria-hidden="true"
          style={{ left: `${slotAt(rubber.i).x * 100}%`, top: `${slotAt(rubber.i).y * 100}%`, opacity: rubber.o, transform: `translate(-50%, ${-100 + rubber.lift * -60}%)` }}
        />
      ) : null}
    </div>
  );
}

/*
  Where the passport is at any moment. t(id) is how far into a scene the story is (negative while that
  scene is still sliding in); enter(id) is 0 → 1 while it slides in.
*/
export function passportPose({ t, enter, W, H, land, gutter, safe }) {
  if (t('intro') < 0.35 || t('lab') > 0.05) return null;
  const width = land ? Math.min(W * 0.4, 600) : Math.min(W - 2 * gutter, 440);
  const hudW = land ? Math.min(220, W * 0.16) : Math.min(140, W * 0.36);
  const bottom = safe + (land ? 28 : 22);
  // the words above it (the same sizes as --top and --fs in styles.css)
  const top = land ? 118 : 92;
  const fs = land ? clamp(W * 0.029, 30.4, 52.8) : clamp(W * 0.062, 23.2, 31.2);
  // the intro: under the four lines on phones, beside them on laptops
  const introTop = land ? 120 : top + 4 * 1.14 * fs + 64;
  const introRoom = H - introTop - bottom - 36;
  const introScale = Math.min(1, (introRoom * RATIO) / width);
  const centre = { x: land ? W * 0.7 : W / 2, y: introTop + introRoom / 2 };
  const corner = { x: W - gutter - hudW / 2, y: H - bottom - 4 - hudW / RATIO / 2 };
  // the end: between its two lines and the "Attend Futuready" button, never under the button
  const passTop = top + 2 * 1.14 * fs + 28;
  const ctaTop = H - bottom - 40 - 92;
  const passRoom = ctaTop - passTop;
  const endScale = Math.min(land ? 1.1 : 1, (passRoom * RATIO) / width);
  const end = { x: W / 2, y: passTop + passRoom / 2 };

  const drop = back(seg(t('intro'), 0.4, 0.8));
  const open = inout(seg(t('intro'), 0.95, 1.45));
  const toCorner = inout(enter('R'));
  const toEnd = inout(seg(t('pass'), 0.1, 0.6));
  // as the lab slides up, the passport drifts up with the page and fades quickly, so it never sits over the words
  const leave = inout(enter('lab'));
  const fade = seg(enter('lab'), 0, 0.35);

  let x = lerp(centre.x, corner.x, toCorner);
  let y = lerp(lerp(-width, centre.y, drop), corner.y, toCorner);
  x = lerp(x, end.x, toEnd);
  y = lerp(y, end.y, toEnd) - leave * H * 0.12;
  const scale = lerp(lerp(introScale, hudW / width, toCorner), endScale, toEnd);

  const ids = LEVELS.map(l => l.k);
  const got = ids.map(id => t(id) >= STAMP_AT);
  const live = ids.findIndex(id => t(id) > 1.2 && t(id) < 1.62);
  let rubber = null;
  if (live >= 0) {
    const s = t(ids[live]);
    const down = out(seg(s, 1.2, STAMP_AT));
    const up = seg(s, STAMP_AT + 0.04, 1.6);
    rubber = { i: live, lift: (1 - down) + up * up, o: clamp(seg(s, 1.2, 1.26) * (1 - seg(s, 1.54, 1.6))) };
  }
  // a little jolt as each stamp lands
  const jolt = live >= 0 ? Math.max(0, 1 - Math.abs(t(ids[live]) - STAMP_AT) * 14) : 0;

  return {
    width,
    x,
    y,
    scale: scale * (1 + 0.06 * jolt),
    rot: lerp(lerp(0, -4, toCorner), 0, toEnd),
    open,
    opacity: 1 - fade,
    got,
    rubber,
    label: `Futuready passport, ${got.filter(Boolean).length} of 5 stamps`,
  };
}

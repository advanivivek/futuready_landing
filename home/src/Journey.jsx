import { useMemo, useRef } from 'react';
import LightTunnel from './rb/LightTunnel/LightTunnel';
import Counter from './rb/Counter/Counter';
import MaskedHeading from './rb/MaskedHeading/MaskedHeading';
import CircularGallery from './rb/CircularGallery/CircularGallery';
import ScrollVelocity from './rb/ScrollVelocity/ScrollVelocity';
import DotGrid from './rb/DotGrid/DotGrid';
import SplitFlapText from './rb/SplitFlapText/SplitFlapText';
import FluidGlass from './rb/FluidGlass/FluidGlass';
import TechText from './rb/TechText/TechText';
import Earn from './Earn';
import { buzz, ease, Near, span, useProgress, useTouch, useWidth } from './hooks';
import { BRING_URL, CITIES, H2S, LAB, SUPPORT, VOICE_NAMES, VOICES } from './data';

const glide = top => (window.__lenis ? window.__lenis.scrollTo(top, { duration: 1.4 }) : window.scrollTo({ top, behavior: 'smooth' }));

/* 1. Scroll and you travel five years ahead. */
function Travel({ w }) {
  const ref = useRef(null);
  const p = useProgress(ref);
  const t = ease(span(p, 0.04, 0.66));
  const year = 2026 + Math.round(t * 5);
  const rush = Math.sin(span(p, 0, 0.74) * Math.PI);
  const arrive = ease(span(p, 0.7, 0.8));
  const second = ease(span(p, 0.8, 0.9));
  const fs = Math.round(Math.min(w * 0.3, 300));
  return (
    <section ref={ref} className="travel" aria-label="Five years from now">
      <div className="stage">
        <Near className="fill">
          <LightTunnel
            cableColor={H2S.blue}
            pulseColor={H2S.ice}
            tunnelColor={H2S.indigo}
            tunnelOpacity={0.12}
            speed={0.06 + rush * 1.6}
            pulseSpeed={2 + rush * 6}
            cableCount={w < 600 ? 40 : 60}
            brightness={0.55 + rush * 0.7 - arrive * 0.25}
            glow={1.1}
            mouseInteraction
          />
        </Near>
        <div className="travel__veil" style={{ opacity: 0.35 + arrive * 0.45 }} />
        <p className="t-label travel__hint" style={{ opacity: 1 - span(p, 0.02, 0.1) }}>
          Scroll to travel
        </p>
        <div className="travel__year" style={{ transform: `translateY(${-arrive * 22}svh) scale(${1 - arrive * 0.62})` }}>
          <Counter value={year} format={{ useGrouping: false }} fontSize={fs} fontWeight={760} textColor="#f3f5ff" tabular duration={0.55} intro={false} motionBlur />
        </div>
        <h2 className="travel__lines">
          <span style={{ opacity: arrive, transform: `translateY(${(1 - arrive) * 24}px)` }}>AI writes the code.</span>
          <span className="grad-text" style={{ opacity: second, transform: `translateY(${(1 - second) * 24}px)` }}>
            You decide what’s worth building.
          </span>
        </h2>
      </div>
    </section>
  );
}

/* 2. The real lab, as students held it in their hands. */
function Lab({ w }) {
  const mobile = w < 700;
  return (
    <section className="lab" aria-labelledby="lab-h">
      <div className="wrap lab__head">
        <p className="t-label">Builders Lab · Pune · 26 Oct 2026</p>
        <h2 className="sr-only" id="lab-h">
          Phones out. Squads up.
        </h2>
        <MaskedHeading text="Phones out." src="/mesh.svg" align="left" weight={760} tracking={-0.055} textScale={mobile ? 0.17 : 0.1} lineHeight={1} tag="div" />
        <MaskedHeading text="Squads up." src="/mesh.svg" align="left" weight={760} tracking={-0.055} textScale={mobile ? 0.17 : 0.1} lineHeight={1} tag="div" stagger={0.12} />
      </div>
      <Near className="lab__gallery" margin="60% 0px">
        <CircularGallery
          items={LAB}
          bend={mobile ? 2 : 2.6}
          itemSize={mobile ? 0.92 : 1}
          itemAspect={0.587}
          gap={mobile ? 0.18 : 0.22}
          textColor="#f3f5ff"
          font='600 30px "Geist Variable"'
          borderRadius={0.07}
          autoScroll={0.35}
          openOnClick={false}
          fadeEdges={0.18}
        />
      </Near>
      <p className="t-label lab__hint" aria-hidden="true">
        ← Drag →
      </p>
    </section>
  );
}

/* 4. Their words, moving. */
function Voices({ w }) {
  return (
    <section className="voices" aria-labelledby="voices-h">
      <p className="t-label wrap" id="voices-h">
        Heard in Pune
      </p>
      <div className="voices__rows">
        <ScrollVelocity
          texts={VOICES}
          velocity={w < 700 ? 40 : 60}
          separator="  ·  "
          outlineAlternate
          skewWithVelocity={8}
          numCopies={4}
          fontSize={w < 700 ? '15vw' : '9vw'}
          fontWeight={720}
          color="#0b0d1c"
        />
      </div>
      <p className="t-label wrap voices__who">{VOICE_NAMES}. Students, Futuready Pune.</p>
    </section>
  );
}

/* 5. The tour, drawn across India as you scroll. */
const MAP = { lon: [71.5, 78.5], lat: [30, 17.5] };
const toXY = c => [8 + ((c.lon - MAP.lon[0]) / (MAP.lon[1] - MAP.lon[0])) * 84, 8 + ((MAP.lat[0] - c.lat) / (MAP.lat[0] - MAP.lat[1])) * 114];

function Route({ w }) {
  const ref = useRef(null);
  const p = useProgress(ref);
  const touch = useTouch();
  const geo = useMemo(() => {
    const pts = CITIES.map(toXY);
    let d = `M${pts[0][0]},${pts[0][1]}`;
    const lens = [0];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const mx = (x0 + x1) / 2 + (y1 - y0) * 0.18;
      const my = (y0 + y1) / 2 - (x1 - x0) * 0.18;
      d += ` Q${mx},${my} ${x1},${y1}`;
      lens.push(lens[i - 1] + Math.hypot(x1 - x0, y1 - y0));
    }
    return { pts, d, at: lens.map(l => l / lens[lens.length - 1]) };
  }, []);
  const drawn = span(p, 0.06, 0.86);
  let active = 0;
  geo.at.forEach((a, i) => {
    if (drawn >= a - 0.002) active = i;
  });
  const c = CITIES[active];
  const past = c.status === 'past';
  const fs = Math.round(Math.min(84, Math.max(24, ((w >= 900 ? Math.min(w, 1320) * 0.5 : w) - 40) / 9 / 1.08)));

  const jump = i => {
    const el = ref.current;
    const total = el.offsetHeight - innerHeight;
    const target = 0.06 + geo.at[i] * 0.8 + 0.004;
    glide(el.getBoundingClientRect().top + scrollY + target * total);
    buzz(10);
  };

  return (
    <section ref={ref} className="route" id="cities" aria-labelledby="route-h">
      <div className="stage route__stage">
        <Near className="fill">
          <DotGrid dotSize={3} gap={22} baseColor="#171b38" activeColor={H2S.cyan} proximity={touch ? 90 : 140} glow={0.6} intro={false} />
        </Near>
        <div className="route__copy wrap">
          <p className="t-label" id="route-h">
            On tour
          </p>
          <div className="route__board" aria-live="polite" aria-label={`${c.city}, ${past ? `landed ${c.date}` : 'coming soon'}`}>
            <SplitFlapText text={c.city.toUpperCase()} padTo={9} fontSize={fs} gap={Math.max(3, Math.round(fs / 12))} tileRadius={Math.round(fs / 7)} tileColor="#0e1124" textColor="#f3f5ff" charset="alpha" loop={false} intro={false} glare={0.25} flipsPerChar={4} flipDuration={0.07} stagger={0.035} />
          </div>
          <p className="route__status">
            <i className={past ? 'is-past' : ''} aria-hidden="true" />
            {past ? `Landed · ${c.date} · ${c.campus}` : 'Landing soon'}
          </p>
          <a className="text-link" href={c.url}>
            {past ? `Relive ${c.city}` : `Join ${c.city}`} <span aria-hidden="true">→</span>
          </a>
        </div>
        <svg className="route__map" viewBox="0 0 100 130" role="list" aria-label="Tour route">
          <defs>
            <linearGradient id="route-g" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor={H2S.ice} />
              <stop offset="0.6" stopColor={H2S.blue} />
              <stop offset="1" stopColor="#7a5cff" />
            </linearGradient>
          </defs>
          <path d={geo.d} fill="none" stroke="rgba(243,245,255,0.12)" strokeWidth="0.35" strokeDasharray="0.8 1.2" />
          <path d={geo.d} fill="none" stroke="url(#route-g)" strokeWidth="0.7" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - drawn} />
          {geo.pts.map(([x, y], i) => {
            const on = drawn >= geo.at[i] - 0.002;
            const cc = CITIES[i];
            const left = x > 60;
            return (
              <g key={cc.city} role="listitem" className={`node ${on ? 'is-on' : ''} ${i === active ? 'is-active' : ''} ${cc.status === 'past' ? 'is-past' : ''}`} onClick={() => jump(i)} data-hot>
                <circle cx={x} cy={y} r="6" fill="transparent" />
                <circle className="node__halo" cx={x} cy={y} r="3.6" />
                <circle className="node__dot" cx={x} cy={y} r="1.6" />
                <text x={left ? x - 4.6 : x + 4.6} y={y + 1.5} textAnchor={left ? 'end' : 'start'}>
                  {cc.city}
                </text>
              </g>
            );
          })}
        </svg>
        <a className="route__bring t-label" href={BRING_URL}>
          Not on the map yet? Bring it to your campus →
        </a>
      </div>
    </section>
  );
}

/* 6. A lens to look at the future through, and goodbye. */
function Finale({ w }) {
  const touch = useTouch();
  const fs = Math.round(Math.min(260, Math.max(64, (Math.min(w, 1400) - 32) / 4.5)));
  return (
    <section className="finale" aria-labelledby="fin-h">
      <h2 className="sr-only" id="fin-h">
        See you in the future
      </h2>
      <Near className="finale__glass">
        <FluidGlass
          text={w < 700 ? 'See you in\nthe future.' : 'See you in the future.'}
          textColor="#f3f5ff"
          fontFamily="Geist Variable"
          fontWeight={740}
          shape="lens"
          shapes={['lens', 'blob', 'pill', 'diamond']}
          size={touch ? 150 : 230}
          interaction={touch ? 'drag' : 'follow'}
          background="#05060f"
          dispersion={0.5}
          maxDevicePixelRatio={2}
        />
      </Near>
      <div className="finale__mark" style={{ height: Math.round(fs * 1.25) }}>
        <TechText text="Futuready" fontFamily="Geist Variable" fontWeight={740} fontSize={fs} letterSpacing={-0.06} color="#f3f5ff" accentColor={H2S.cyan} labels={!touch} draggable={!touch} selection={false} reach={touch ? 110 : 220} />
      </div>
      <footer className="foot wrap">
        <img src="/h2s-logo.png" alt="Hack2skill" width="53" height="20" />
        <a href={`mailto:${SUPPORT}`}>{SUPPORT}</a>
        <span>© 2026</span>
      </footer>
    </section>
  );
}

export default function Journey() {
  const w = useWidth();
  return (
    <>
      <Travel w={w} />
      <Lab w={w} />
      <Earn />
      <Voices w={w} />
      <Route w={w} />
      <Finale w={w} />
    </>
  );
}

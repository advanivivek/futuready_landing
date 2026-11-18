import { arc, back, Cut, inout, lerp, Note, out, pick, seg, Typed } from './kit';
import { BRING_URL, CITIES, LEVELS, SUPPORT, VOICES_FULL } from '../data';

const A = n => `/story/${n}.webp`;
const CREAM = '#efe6d2';
const INK = '#161a3a';
const BLUE = '#3463af';
const INDIGO = '#2f3a96';

/* the giant level letter standing on the floor like a paper prop */
function Letter({ k, s, color }) {
  const rise = out(seg(s, 0, 0.55));
  return (
    <div className="letter-box" aria-hidden="true">
      <div className="letter" style={{ color, transform: `translateY(${(1 - rise) * 105}%)` }}>
        {k}
      </div>
    </div>
  );
}

function Lines({ children, top }) {
  return (
    <div className="lines" style={top ? { top } : undefined}>
      {children}
    </div>
  );
}

/* little things that float up and fade: code, music, smoke */
function Floaters({ items, s, on, x, y, spread = 30, rise, speed = 0.9, className }) {
  return items.map((g, j) => {
    const f = (((s * speed + j / items.length) % 1) + 1) % 1;
    return (
      <span
        key={j}
        className={`floater ${className || ''}`}
        aria-hidden="true"
        style={{
          left: x + Math.sin(j * 2.3) * spread,
          bottom: y + f * rise,
          opacity: on * Math.sin(f * Math.PI),
          transform: `translateX(-50%) rotate(${Math.sin(j) * 14}deg) scale(${0.8 + f * 0.4})`,
        }}
      >
        {g}
      </span>
    );
  });
}

function LevelLabel({ i, s }) {
  const lv = LEVELS[i];
  return (
    <p className="level-label" style={{ opacity: seg(s, 0.05, 0.3) }}>
      <b style={{ background: lv.color }}>{lv.k}</b> Level {i + 1} · {lv.name}
    </p>
  );
}

export const SCENES = [
  /* 0. the question */
  {
    id: 'title',
    len: 1.8,
    wall: BLUE,
    floor: CREAM,
    F: 0.24,
    ink: CREAM,
    render: (s, { W, H, land, F }) => {
      const go = seg(s, 0.2, 1.1);
      return (
        <>
          <div className="title" style={{ transform: `translateY(${-go * 40}px)`, opacity: 1 - seg(s, 0.7, 1.1) }}>
            <h1 className="display">
              <span className="rise" style={{ '--d': '0.1s' }}>
                Are you ready
              </span>
              <span className="rise" style={{ '--d': '0.25s' }}>
                for the <em>future?</em>
              </span>
            </h1>
            <div className="notes rise" style={{ '--d': '0.5s' }}>
              <p>› A Hack2skill campus series</p>
              <p>› Two hours. Phones out. Squads up.</p>
              <p>› Now touring India</p>
            </div>
          </div>
          <Cut src={A('girl-phone')} alt="A student in a mustard hoodie looking at her phone" x={[0.62, 0.66]} h={[0.44, 0.58]} d={0.08} dx={-go * W * 0.06} className="rise" style={{ '--d': '0.35s' }} />
          <Cut src={A('bot-stand')} alt="A vintage tin toy robot peeking in" x={[1.02, 0.86]} h={[0.24, 0.3]} d={0.03} dx={-out(seg(s, 0.25, 0.9)) * W * (land ? 0.04 : 0.16)} r={-6 + 6 * seg(s, 0.25, 0.9)} />
          <div className="scroll-hint" style={{ opacity: 1 - seg(s, 0, 0.25), bottom: F * H * 0.38 }} aria-hidden="true">
            Scroll <span>↓</span>
          </div>
        </>
      );
    },
  },

  /* 1. 2031 */
  {
    id: 'y2031',
    len: 2.6,
    wall: CREAM,
    floor: BLUE,
    F: 0.26,
    ink: INK,
    render: (s, { W, H, land, F }) => {
      const xs = land ? [0.42, 0.58, 0.74] : [0.2, 0.5, 0.8];
      const bh = (land ? 0.27 : 0.23) * H;
      const typing = seg(s, 0.9, 1.2);
      return (
        <>
          <div className="year" aria-hidden="true" style={{ transform: `translate(-50%, -50%) scale(${1.15 - 0.15 * out(seg(s, 0, 0.8))})`, opacity: 0.9 * seg(s, 0, 0.4) }}>
            2031
          </div>
          <Lines>
            <Typed text="It’s 2031." p={seg(s, 0.1, 0.45)} className="line" />
            <Typed text="AI writes the code." p={seg(s, 0.85, 1.3)} className="line" />
          </Lines>
          {xs.map((x, i) => {
            const enter = out(seg(s, 0.25 + i * 0.14, 0.75 + i * 0.14));
            return (
              <div key={i}>
                <Cut src={A('bot-type')} alt={i ? '' : 'Tin robots typing on laptops'} x={x} h={land ? 0.27 : 0.23} d={0.09} dx={(1 - enter) * W} dy={typing ? Math.abs(Math.sin(s * 40 + i)) * -2 : 0} />
                <Floaters items={['{ }', '</>', '01', '=>', 'fn()', '[ ]']} s={s + i * 0.21} on={typing * enter} x={x * W + bh * 0.12} y={(F - 0.09) * H + bh * 0.7} rise={H * 0.2} spread={22} className="code" />
              </div>
            );
          })}
        </>
      );
    },
  },

  /* 2. it finds its own bugs */
  {
    id: 'bugs',
    len: 2.6,
    wall: '#f2b230',
    floor: INDIGO,
    F: 0.26,
    ink: INK,
    render: (s, { W, H, land }) => {
      const crawl = seg(s, 0.15, 0.95);
      const fly = out(seg(s, 1.05, 1.6));
      return (
        <>
          <Lines>
            <Typed text="It finds its own bugs." p={seg(s, 0.1, 0.6)} className="line" />
            <Typed text="And fixes them before lunch." p={seg(s, 0.95, 1.45)} className="line" />
          </Lines>
          <Cut src={A('bot-lens')} alt="A tin robot peering through a magnifying glass" x={[0.66, 0.66]} h={[0.32, 0.4]} d={0.08} dx={(1 - out(seg(s, 0, 0.5))) * W * 0.6} r={Math.sin(s * 6) * 1.5} />
          <Cut
            src={A('bug')}
            alt="A ladybug"
            x={lerp(-0.1, land ? 0.48 : 0.36, crawl)}
            h={[0.08, 0.1]}
            d={0.04}
            z={3}
            dx={fly * W * 0.5}
            dy={-fly * H * 0.75}
            r={30 + Math.sin(s * 22) * 7 * (1 - fly) - fly * 80}
            sc={1 - fly * 0.4}
            shadow={!fly}
            wiggle="fly"
          />
        </>
      );
    },
  },

  /* 3. so what is left for you */
  {
    id: 'you',
    len: 2.8,
    wall: '#a6d8ee',
    floor: CREAM,
    F: 0.24,
    ink: INK,
    render: (s, { W, land }) => {
      const grow = out(seg(s, 0.55, 1.35));
      return (
        <>
          <Lines>
            <Typed text="So what’s left for" p={seg(s, 0.1, 0.55)} className="line" />
          </Lines>
          <div className="you" style={{ opacity: seg(s, 0.5, 0.8), transform: `translate(-50%, -50%) scale(${0.55 + grow * 0.45})` }}>
            you?
          </div>
          <Cut src={A('girl-sit')} alt="The student sits on the floor and looks up" x={[0.3, 0.32]} h={[0.27, 0.36]} d={0.1} dx={(1 - out(seg(s, 0.8, 1.4))) * -W * 0.5} />
          <div className="lines lines--low">
            <Note o={seg(s, 1.55, 1.85)}>Plenty. Let’s find it.</Note>
          </div>
        </>
      );
    },
  },

  /* 4. five things */
  {
    id: 'five',
    len: 2.2,
    wall: '#232c6e',
    floor: INDIGO,
    F: 0.22,
    ink: CREAM,
    render: s => (
      <Lines>
        <Typed text="Five things no machine" p={seg(s, 0.1, 0.5)} className="line" />
        <Typed text="can do for you." p={seg(s, 0.5, 0.85)} className="line" />
        <Note o={seg(s, 0.95, 1.2)}>Clear a level, earn a stamp.</Note>
      </Lines>
    ),
  },

  /* 5. R */
  {
    id: 'R',
    len: 2.5,
    wall: '#f2a7b8',
    floor: INDIGO,
    F: 0.24,
    ink: INK,
    level: 0,
    render: (s, { W }) => (
      <>
        <Letter k="R" s={s} color="#e98ca2" />
        <Lines>
          <LevelLabel i={0} s={s} />
          <Typed text="Machines do exactly what you say." p={seg(s, 0.2, 0.75)} className="line" />
          <Typed text="So say exactly what you mean." p={seg(s, 0.9, 1.4)} className="line" />
        </Lines>
        <Cut src={A('girl-list')} alt="The student holds up a handwritten list" x={[0.3, 0.42]} h={[0.44, 0.56]} d={0.08} dx={(1 - out(seg(s, 0, 0.6))) * -W * 0.6} />
        <Cut src={A('bot-paper')} alt="A robot holds the same list, confused" x={[0.76, 0.66]} h={[0.3, 0.38]} d={0.06} dx={(1 - out(seg(s, 0.3, 0.9))) * W * 0.6} r={Math.sin(s * 9) * 7 * seg(s, 0.95, 1.2)} />
      </>
    ),
  },

  /* 6. E */
  {
    id: 'E',
    len: 2.5,
    wall: '#9ed6c0',
    floor: BLUE,
    F: 0.24,
    ink: INK,
    level: 1,
    render: (s, { W, H, land }) => {
      const found = back(seg(s, 1.0, 1.25));
      const bx = land ? 0.69 : 0.79;
      return (
        <>
          <Letter k="E" s={s} color="#86c8ae" />
          <Lines>
            <LevelLabel i={1} s={s} />
            <Typed text="It looks right." p={seg(s, 0.2, 0.55)} className="line" />
            <Typed text="Is it right?" p={seg(s, 0.9, 1.15)} className="line" />
          </Lines>
          <Cut src={A('girl-lens')} alt="The student inspects the robot's work with a magnifying glass" x={[0.36, 0.46]} h={[0.42, 0.54]} d={0.08} dx={(1 - out(seg(s, 0, 0.6))) * -W * 0.6} />
          <Cut src={A('bot-type')} alt="A robot typing on a laptop" x={[0.76, 0.66]} h={[0.24, 0.3]} d={0.06} dx={(1 - out(seg(s, 0.25, 0.85))) * W * 0.6} />
          <Cut src={A('bug')} alt="A bug, found" x={bx} h={[0.06, 0.075]} d={0.06} dy={-(land ? 0.17 : 0.13) * H} z={4} sc={found} o={seg(s, 1.0, 1.05)} shadow={false} r={20} wiggle="fly" />
        </>
      );
    },
  },

  /* 7. A */
  {
    id: 'A',
    len: 2.5,
    wall: '#f2b230',
    floor: '#c9562e',
    F: 0.24,
    ink: INK,
    level: 2,
    render: (s, { W, H }) => {
      const build = inout(seg(s, 0.35, 1.45));
      return (
        <>
          <Letter k="A" s={s} color="#e3a21c" />
          <Lines>
            <LevelLabel i={2} s={s} />
            <Typed text="Anyone can stack blocks." p={seg(s, 0.2, 0.7)} className="line" />
            <Typed text="You decide where they go." p={seg(s, 0.9, 1.4)} className="line" />
          </Lines>
          <Cut src={A('girl-phone')} alt="The student plans on her phone" x={[0.24, 0.38]} h={[0.42, 0.54]} d={0.08} dx={(1 - out(seg(s, 0, 0.6))) * -W * 0.6} />
          <Cut src={A('blocks')} alt="A tower of wooden blocks being built" x={[0.6, 0.58]} h={[0.44, 0.56]} d={0.05} style={{ clipPath: `inset(${(1 - build) * 100}% -20% -10% -20%)` }} wiggle="" />
          <Cut src={A('bot-block')} alt="A robot carrying a block" x={[0.84, 0.74]} h={[0.27, 0.34]} d={0.1} dx={(1 - out(seg(s, 0.2, 1.0))) * W * 0.5} dy={-Math.abs(Math.sin(s * 16)) * 6 * (1 - seg(s, 0.9, 1.0))} />
        </>
      );
    },
  },

  /* 8. D */
  {
    id: 'D',
    len: 2.6,
    wall: '#c3b5f2',
    floor: INDIGO,
    F: 0.24,
    ink: INK,
    level: 3,
    render: (s, { W, H, land, F }) => {
      const play = seg(s, 0.95, 1.2);
      const beat = i => -Math.abs(Math.sin(s * 11 + i * 0.9)) * 10 * play;
      const band = land ? [0.6, 0.72, 0.84] : [0.6, 0.78, 0.94];
      return (
        <>
          <Letter k="D" s={s} color="#ae9deb" />
          <Lines>
            <LevelLabel i={3} s={s} />
            <Typed text="You don’t code alone anymore." p={seg(s, 0.2, 0.7)} className="line" />
            <Typed text="You lead a team that never sleeps." p={seg(s, 0.9, 1.45)} className="line" />
          </Lines>
          <Cut src={A('girl-baton')} alt="The student conducts a band of robots with a baton" x={[0.24, 0.38]} h={[0.44, 0.56]} d={0.08} dx={(1 - out(seg(s, 0, 0.6))) * -W * 0.6} r={Math.sin(s * 11) * 2 * play} />
          <Cut src={A('bot-horn')} alt="A robot playing a trumpet" x={band[0]} h={[0.26, 0.33]} d={0.07} dx={(1 - out(seg(s, 0.25, 0.8))) * W * 0.7} dy={beat(0)} flip />
          <Cut src={A('bot-stand')} alt="" x={band[1]} h={[0.24, 0.31]} d={0.04} dx={(1 - out(seg(s, 0.35, 0.9))) * W * 0.7} dy={beat(1)} />
          <Cut src={A('bot-type')} alt="" x={band[2]} h={[0.2, 0.25]} d={0.1} dx={(1 - out(seg(s, 0.45, 1.0))) * W * 0.7} dy={beat(2)} />
          <Floaters items={['♪', '♫', '♪', '♬']} s={s} on={play} x={band[0] * W - (land ? 0.06 : 0.09) * H} y={(F - 0.07) * H + 0.2 * H} rise={H * 0.22} spread={26} speed={1.1} className="music" />
        </>
      );
    },
  },

  /* 9. Y */
  {
    id: 'Y',
    len: 2.5,
    wall: '#151a45',
    floor: '#0e1232',
    F: 0.24,
    ink: CREAM,
    level: 4,
    render: s => {
      const lit = out(seg(s, 0.6, 1.1));
      return (
        <>
          <Letter k="Y" s={s} color="#1f2660" />
          <div className="spot" style={{ opacity: lit }} aria-hidden="true" />
          <Lines>
            <LevelLabel i={4} s={s} />
            <Typed text="And the last level" p={seg(s, 0.2, 0.6)} className="line" />
            <Typed text="is you." p={seg(s, 0.9, 1.15)} className="line line--big" />
            <Note o={seg(s, 1.25, 1.5)}>The part nobody can automate.</Note>
          </Lines>
          <Cut src={A('girl-phone')} alt="The student, alone in a spotlight" x={0.5} h={[0.46, 0.56]} d={0.1} style={{ filter: `brightness(${0.25 + lit * 0.75})` }} />
        </>
      );
    },
  },

  /* 10. the passport (it flies in from the corner; see Story) */
  {
    id: 'pass',
    len: 2.2,
    wall: CREAM,
    floor: BLUE,
    F: 0.2,
    ink: INK,
    render: (s, { onPass }) => (
      <>
        <Lines>
          <Typed text="Five stamps. One passport." p={seg(s, 0.1, 0.55)} className="line" />
        </Lines>
        <div className="pass-cta" style={{ opacity: seg(s, 0.75, 0.95), pointerEvents: s > 0.8 ? 'auto' : 'none' }}>
          <button className="pill pill--ink" onClick={onPass}>
            Make it yours
          </button>
          <p className="note">› Collect a new stamp every episode.</p>
        </div>
      </>
    ),
  },

  /* 11. the lab */
  {
    id: 'lab',
    len: 2.8,
    wall: BLUE,
    floor: CREAM,
    F: 0.24,
    ink: CREAM,
    render: (s, { W }) => {
      const screens = ['tv-04-tools-stage', 'tv-07-bug1-reveal-stage', 'tv-08-podium-stage', 'tv-words-feel'];
      const i = Math.min(3, Math.floor(seg(s, 0.2, 2.0) * 4));
      return (
        <>
          <Lines>
            <Typed text="So we turned it into a game." p={seg(s, 0.1, 0.6)} className="line" />
            <Typed text="Phones out. Squads up." p={seg(s, 0.9, 1.35)} className="line" />
            <Note o={seg(s, 1.45, 1.7)}>5 levels · 1 leaderboard · 0 lectures</Note>
          </Lines>
          <Cut src={A('tv')} alt="A vintage TV showing the real Builders Lab screens" x={[0.34, 0.42]} h={[0.27, 0.42]} d={0.07} dy={(1 - back(seg(s, 0.1, 0.55))) * -60} o={seg(s, 0.1, 0.25)} wiggle="">
            <div className="tv-screen">
              {screens.map((n, j) => (
                <img key={n} src={A(n)} alt="" style={{ opacity: j === i ? 1 : 0 }} />
              ))}
            </div>
          </Cut>
          <Cut src={A('squad')} alt="A squad of four students cheering at their phones" x={[0.74, 0.7]} h={[0.4, 0.52]} d={0.1} dx={(1 - out(seg(s, 0.6, 1.2))) * W * 0.7} />
        </>
      );
    },
  },

  /* 12. voices */
  {
    id: 'voices',
    len: 3.4,
    wall: CREAM,
    floor: '#f2b230',
    F: 0.2,
    ink: INK,
    render: (s, { land }) => (
      <>
        <Lines>
          <Typed text="Pune played first." p={seg(s, 0.1, 0.45)} className="line" />
          <Note o={seg(s, 0.45, 0.65)}>26 Oct 2026 · Trinity Academy of Engineering</Note>
        </Lines>
        <div className={`notes-wall ${land ? 'is-land' : ''}`}>
          {VOICES_FULL.map((v, i) => {
            const drop = back(seg(s, 0.55 + i * 0.45, 0.9 + i * 0.45));
            return (
              <figure key={v.name} className="paper" style={{ '--r': `${[-4, 3, -2][i]}deg`, '--i': i, opacity: seg(s, 0.55 + i * 0.45, 0.65 + i * 0.45), transform: `translateY(${(1 - drop) * -60}px) rotate(var(--r))` }}>
                <blockquote>“{v.quote}”</blockquote>
                <figcaption>
                  {v.name}
                  <span>{v.role}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </>
    ),
  },

  /* 13. the train */
  {
    id: 'train',
    len: 4.4,
    wall: '#a6d8ee',
    floor: '#2f7a4e',
    F: 0.22,
    ink: INK,
    render: (s, { W, H, land, F }) => {
      const ch = (land ? 0.2 : 0.17) * H;
      const cw = ch * (660 / 346);
      const eh = ch * 1.13;
      const ew = eh * (714 / 392);
      const gap = ch * 0.04;
      const start = W + 20;
      const end = W / 2 - (ew + gap + 4.5 * cw + 4 * gap);
      const move = inout(seg(s, 0.3, 3.0));
      const X = lerp(start, end, move);
      const centres = CITIES.map((_, i) => X + ew + gap + i * (cw + gap) + cw / 2);
      let near = 0;
      centres.forEach((c, i) => {
        if (Math.abs(c - W / 2) < Math.abs(centres[near] - W / 2)) near = i;
      });
      const city = CITIES[near];
      const shake = move > 0 && move < 1 ? Math.sin(s * 90) * 1 : 0;
      const railY = (F - 0.07) * H;
      const walk = seg(s, 2.7, 3.4);
      return (
        <>
          <Lines>
            <Typed text="Next stop:" p={seg(s, 0.1, 0.35)} className="line" />
            <div className="station" style={{ opacity: seg(s, 0.35, 0.55) }} aria-live="polite">
              {city.city}
              <small>{city.status === 'past' ? `Landed ${city.date}` : 'Boarding soon'}</small>
            </div>
            <Note o={seg(s, 0.6, 0.8)}>Tap a carriage to board.</Note>
          </Lines>
          <div className="rails" style={{ bottom: railY - 6 }} aria-hidden="true" />
          <div className="train" style={{ bottom: railY, transform: `translateX(${X}px) translateY(${shake}px)` }}>
            <img className="train__engine" src={A('engine')} alt="A vintage tin toy train engine" style={{ height: eh, width: ew }} draggable={false} />
            <Floaters items={['', '', '', '']} s={s * 1.4} on={move > 0 && move < 1 ? 1 : 0.4} x={ew * 0.13} y={eh * 0.95} rise={H * 0.16} spread={10} className="smoke" />
            {CITIES.map((c, i) => (
              <a key={c.city} className={`coach ${i === near ? 'is-near' : ''}`} href={c.url} style={{ height: ch, width: cw, marginLeft: gap }} aria-label={`${c.city}: ${c.status === 'past' ? `landed ${c.date}` : 'boarding soon'}`}>
                <img src={A('coach')} alt="" draggable={false} />
                <span className="coach__board">
                  <b>{c.city}</b>
                  <small>{c.status === 'past' ? `✓ ${c.date}` : 'soon'}</small>
                </span>
              </a>
            ))}
          </div>
          <Cut src={A('girl-walk')} alt="The student walks to the platform with her suitcase" x={lerp(-0.25, land ? 0.2 : 0.22, out(walk))} h={[0.38, 0.48]} d={0.1} z={5} o={walk > 0 ? 1 : 0} />
        </>
      );
    },
  },

  /* 14. see you on the platform */
  {
    id: 'end',
    len: 1.6,
    wall: BLUE,
    floor: CREAM,
    F: 0.26,
    ink: CREAM,
    render: (s, { jump, land }) => (
      <>
        <div className="title title--end" style={{ opacity: seg(s, 0, 0.35) }}>
          <h2 className="display">
            See you on
            <br />
            the <em>platform.</em>
          </h2>
          <div className="end-cta">
            <button className="pill" onClick={() => jump('train', 1.6)}>
              Find your city
            </button>
            <a className="pill pill--ghost" href={BRING_URL}>
              Bring it to your campus
            </a>
          </div>
        </div>
        <Cut src={A('girl-phone')} alt="The student and a robot, side by side" x={[0.4, 0.56]} h={[0.4, 0.5]} d={0.1} dx={(1 - out(seg(s, 0, 0.5))) * -80} />
        <Cut src={A('bot-stand')} alt="" x={[0.68, 0.7]} h={[0.24, 0.3]} d={0.1} flip dx={(1 - out(seg(s, 0.1, 0.6))) * 80} />
        <footer className="foot" style={{ opacity: seg(s, 0.3, 0.6) }}>
          <img src="/h2s-logo.png" alt="Hack2skill" width="48" height="18" />
          <a href={`mailto:${SUPPORT}`}>{SUPPORT}</a>
          <span>{land ? 'Futuready by Hack2skill · ' : ''}© 2026</span>
        </footer>
      </>
    ),
  },
];

export const LEVEL_SCENES = SCENES.filter(x => x.level !== undefined).map(x => x.id);
export { pick };

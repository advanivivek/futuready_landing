import { arc, back, Cut, inout, lerp, Note, out, seg, Typed } from './kit';
import { BRING_URL, LEVELS, SUPPORT, VOICES_FULL } from '../data';

/*
  Every scene:
    len    how many screens of scrolling it lasts
    wall, floor, F (floor height), ink (text colour)
    cam    (s, k) => { z, x, y }  zoom and where it zooms into (fractions of the stage)
    cues   [[s, sound], ...]      sounds as you scroll forward past s
    world  (s, k) => the set: people, robots, props (moves with the camera)
    ui     (s, k) => the words (stay sharp and still)
  s is how far into the scene you are, in screens.
*/

const A = n => `/story/${n}.webp`;
const CREAM = '#efe6d2';
const INK = '#161a3a';
const BLUE = '#3463af';
const INDIGO = '#2f3a96';

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

const Lines = ({ children, className = '' }) => <div className={`lines ${className}`}>{children}</div>;

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

const enterL = (s, a, b, W) => (1 - out(seg(s, a, b))) * -W * 0.6;
const enterR = (s, a, b, W) => (1 - out(seg(s, a, b))) * W * 0.6;

const coachTag = c => (c.status === 'past' ? `✓ ${c.date}` : c.status === 'open' ? 'Open' : 'Soon');
const stationTag = c =>
  c.status === 'past' ? `Landed ${c.date}${c.campus ? ` · ${c.campus}` : ''}` : c.status === 'open' ? `Registrations open${c.date ? ` till ${c.date}` : ''}` : 'Boarding soon';

export const SCENES = [
  /* 0. the question */
  {
    id: 'title',
    len: 2.0,
    wall: BLUE,
    floor: CREAM,
    F: 0.24,
    ink: CREAM,
    cam: s => ({ z: 1 + 0.07 * inout(seg(s, 0, 1.4)), x: 0.62, y: 0.72 }),
    world: (s, { W, land }) => {
      const go = seg(s, 0.2, 1.2);
      return (
        <>
          <Cut src={A('girl-phone')} alt="A student in a mustard hoodie looks at her phone" x={[0.54, 0.6]} h={[0.44, 0.58]} d={0.08} dx={-go * W * 0.04} priority="high" className="rise" style={{ '--d': '0.3s' }} />
          <Cut src={A('boy-laptop')} alt="Her friend types on a laptop" x={[0.85, 0.75]} h={[0.42, 0.56]} d={0.05} dx={go * W * 0.03} className="rise" style={{ '--d': '0.45s' }} />
          <Cut src={A('bot-stand')} alt="A tin robot peeks in" x={[1.06, 0.92]} h={[0.24, 0.3]} d={0.02} dx={-out(seg(s, 0.25, 0.9)) * W * (land ? 0.04 : 0.12)} r={-6 + 6 * seg(s, 0.25, 0.9)} />
        </>
      );
    },
    ui: (s, { F, H }) => {
      const go = seg(s, 0.2, 1.1);
      return (
        <>
          <div className="title" style={{ transform: `translateY(${-go * 40}px)`, opacity: 1 - seg(s, 0.7, 1.1) }}>
            <h1 className="display">
              <span className="rise" style={{ '--d': '0.1s' }}>
                Are you ready
              </span>
              <span className="rise" style={{ '--d': '0.22s' }}>
                for the <em>future?</em>
              </span>
            </h1>
            <div className="notes rise" style={{ '--d': '0.5s' }}>
              <p>› A Hack2skill campus series</p>
              <p>› Two hours. Phones out. Squads up.</p>
              <p>› Now touring India</p>
            </div>
          </div>
          <div className="scroll-hint" style={{ opacity: 1 - seg(s, 0, 0.25), bottom: F * H * 0.38 }} aria-hidden="true">
            Scroll <span>↓</span>
          </div>
        </>
      );
    },
  },

  /* 1. 2031: starts on one robot's keyboard, pulls back to a room of them */
  {
    id: 'y2031',
    len: 2.6,
    wall: CREAM,
    floor: BLUE,
    F: 0.26,
    ink: INK,
    cues: [
      [0.45, 'boop'],
      [0.62, 'boop'],
    ],
    cam: (s, { F }) => ({ z: lerp(2.3, 1, inout(seg(s, 0.05, 1.0))), x: 0.5, y: 1 - F - 0.08 }),
    world: (s, { W, H, land, F }) => {
      const xs = land ? [0.38, 0.5, 0.62] : [0.2, 0.5, 0.8];
      const bh = (land ? 0.27 : 0.23) * H;
      const typing = seg(s, 0.15, 0.4);
      return (
        <>
          <div className="year" aria-hidden="true" style={{ opacity: 0.9 * seg(s, 0.3, 0.8) }}>
            2031
          </div>
          {xs.map((x, i) => {
            const enter = i === 1 ? 1 : out(seg(s, 0.4 + (i ? 0.12 : 0), 0.95 + (i ? 0.12 : 0)));
            return (
              <div key={i}>
                <Cut src={A('bot-type')} alt={i === 1 ? 'Tin robots typing on laptops' : ''} x={x} h={land ? 0.27 : 0.23} d={0.09} dx={(1 - enter) * (i ? W : -W) * 0.7} dy={-Math.abs(Math.sin(s * 40 + i)) * 2 * typing} />
                <Floaters items={['{ }', '</>', '01', '=>', 'fn()', '[ ]']} s={s + i * 0.21} on={typing * enter} x={x * W + bh * 0.12} y={(F - 0.09) * H + bh * 0.7} rise={H * 0.2} spread={22} className="code" />
              </div>
            );
          })}
        </>
      );
    },
    ui: s => (
      <Lines>
        <Typed text="It’s 2031." p={seg(s, 0.1, 0.45)} className="line" />
        <Typed text="AI writes the code." p={seg(s, 0.95, 1.35)} className="line" />
      </Lines>
    ),
  },

  /* 2. the robot catches its own bug, in a cage */
  {
    id: 'bugs',
    len: 2.8,
    wall: '#f2b230',
    floor: INDIGO,
    F: 0.26,
    ink: INK,
    cues: [
      [0.98, 'boing'],
      [1.22, 'clank'],
    ],
    cam: (s, k) => {
      const g = catchGeometry(k);
      return { z: 1 + 0.3 * inout(seg(s, 0.95, 1.35)), x: g.cageX / k.W, y: 1 - g.cageY / k.H };
    },
    world: (s, k) => {
      const { W, H, F } = k;
      const g = catchGeometry(k);
      const caught = s >= 1.22;
      const crawl = seg(s, 0.12, 0.9);
      const floorX = lerp(-0.08 * W, g.left - g.bugH * 0.2, crawl);
      const floorY = (F - 0.035) * H;
      const j = seg(s, 0.98, 1.22);
      const bx = lerp(floorX, g.cageX, out(j));
      const by = lerp(floorY, g.cageY - g.bugH * 0.3, j) + Math.sin(j * Math.PI) * H * 0.14;
      const pop = arc(s, 1.22, 1.42);
      return (
        <>
          <Cut
            src={A(caught ? 'bot-cage' : 'bot-cage-open')}
            alt={caught ? 'The robot holds up a brass cage with the ladybug caught inside' : 'A tin robot holds out an open brass cage'}
            x={g.rx}
            h={g.rh}
            d={g.d}
            flip={caught}
            sc={1 + 0.06 * pop}
            dx={(1 - out(seg(s, 0, 0.5))) * W * 0.6}
            r={caught ? 0 : Math.sin(s * 6) * 1.2}
          />
          {!caught ? (
            <Cut src={A('bug')} alt="A ladybug" x={bx / W} h={g.bugH / H} d={0} dy={F * H - by} z={4} sc={lerp(1, 0.5, j)} r={lerp(32 + Math.sin(s * 24) * 8 * (1 - j), 360, out(j))} shadow={j < 0.1} wiggle="" />
          ) : null}
          {pop > 0 ? <i className="burst" aria-hidden="true" style={{ left: g.closedCageX, bottom: g.closedCageY, opacity: pop, transform: `translate(-50%, 50%) scale(${0.6 + pop})` }} /> : null}
        </>
      );
    },
    ui: s => (
      <Lines>
        <Typed text="It finds its own bugs." p={seg(s, 0.1, 0.55)} className="line" />
        <Typed text="And locks them up before lunch." p={seg(s, 1.0, 1.5)} className="line" />
      </Lines>
    ),
  },

  /* 3. so what's left for you */
  {
    id: 'you',
    len: 2.8,
    wall: '#a6d8ee',
    floor: CREAM,
    F: 0.24,
    ink: INK,
    cues: [[0.55, 'pop']],
    // starts close on the two of them, pulls back to the word they are looking at
    cam: s => ({ z: lerp(1.7, 1, inout(seg(s, 0.1, 1.1))), x: 0.52, y: 0.82 }),
    world: () => (
      <>
        <Cut src={A('boy-sit')} alt="Her friend sits on the floor, looking up" x={[0.3, 0.46]} h={[0.27, 0.36]} d={0.1} />
        <Cut src={A('girl-sit')} alt="She sits beside him, looking up too" x={[0.72, 0.66]} h={[0.26, 0.35]} d={0.08} flip />
      </>
    ),
    ui: s => (
      <Lines className="lines--you">
        <Typed text="So what’s left for" p={seg(s, 0.1, 0.5)} className="line" />
        <span className="you" aria-hidden="true" style={{ opacity: seg(s, 0.5, 0.7), transform: `scale(${lerp(0.6, 1, back(seg(s, 0.5, 1.0)))})` }}>
          you?
        </span>
        <Note o={seg(s, 1.4, 1.65)}>Plenty. Let’s find it.</Note>
      </Lines>
    ),
  },

  /* 4. five things */
  {
    id: 'five',
    len: 2.2,
    wall: '#232c6e',
    floor: INDIGO,
    F: 0.22,
    ink: CREAM,
    cues: [[0.32, 'whoosh']],
    ui: s => (
      <Lines>
        <Typed text="Five things no machine can do for you." p={seg(s, 0.1, 0.85)} className="line" />
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
    cues: [[0.35, 'boop']],
    cam: s => ({ z: lerp(1.14, 1, out(seg(s, 0, 1.2))), x: 0.3, y: 0.75 }),
    world: (s, { W }) => (
      <>
        <Letter k="R" s={s} color="#e98ca2" />
        <Cut src={A('girl-list')} alt="She holds up a handwritten list" x={[0.3, 0.42]} h={[0.44, 0.56]} d={0.08} dx={enterL(s, 0, 0.6, W)} />
        <Cut src={A('bot-paper')} alt="A robot holds the same list, confused" x={[0.76, 0.66]} h={[0.3, 0.38]} d={0.06} dx={enterR(s, 0.3, 0.9, W)} r={Math.sin(s * 9) * 7 * seg(s, 0.95, 1.2)} />
      </>
    ),
    ui: s => (
      <Lines>
        <LevelLabel i={0} s={s} />
        <Typed text="Machines do exactly what you say." p={seg(s, 0.2, 0.75)} className="line" />
        <Typed text="So say exactly what you mean." p={seg(s, 0.9, 1.4)} className="line" />
      </Lines>
    ),
  },

  /* 6. E: the camera leans in to the bug she finds */
  {
    id: 'E',
    len: 2.5,
    wall: '#9ed6c0',
    floor: BLUE,
    F: 0.24,
    ink: INK,
    level: 1,
    cues: [[1.02, 'pop']],
    cam: (s, { land, F }) => ({ z: 1 + 0.38 * inout(seg(s, 1.0, 1.4)), x: land ? 0.66 : 0.74, y: 1 - F - 0.12 }),
    world: (s, { W, H, land }) => (
      <>
        <Letter k="E" s={s} color="#86c8ae" />
        <Cut src={A('girl-lens')} alt="She inspects the robot's work with a magnifying glass" x={[0.36, 0.46]} h={[0.42, 0.54]} d={0.08} dx={enterL(s, 0, 0.6, W)} />
        <Cut src={A('bot-type')} alt="A robot typing on a laptop" x={[0.76, 0.66]} h={[0.24, 0.3]} d={0.06} dx={enterR(s, 0.25, 0.85, W)} />
        <Cut src={A('bug')} alt="A bug, found" x={land ? 0.69 : 0.79} h={[0.06, 0.075]} d={0.06} dy={-(land ? 0.17 : 0.13) * H} z={4} sc={back(seg(s, 1.0, 1.25))} o={seg(s, 1.0, 1.05)} shadow={false} r={20} />
      </>
    ),
    ui: s => (
      <Lines>
        <LevelLabel i={1} s={s} />
        <Typed text="It looks right." p={seg(s, 0.2, 0.55)} className="line" />
        <Typed text="Is it right?" p={seg(s, 0.9, 1.15)} className="line" />
      </Lines>
    ),
  },

  /* 7. A: he brings the plan, the blocks follow it */
  {
    id: 'A',
    len: 2.5,
    wall: '#f2b230',
    floor: '#c9562e',
    F: 0.24,
    ink: INK,
    level: 2,
    cues: [[0.5, 'boop']],
    cam: s => ({ z: lerp(1.18, 1, out(seg(s, 0, 1.1))), x: 0.6, y: 0.8 }),
    world: (s, { W }) => {
      const build = inout(seg(s, 0.35, 1.45));
      const walking = 1 - seg(s, 0.55, 0.65);
      return (
        <>
          <Letter k="A" s={s} color="#e3a21c" />
          <Cut src={A('boy-plan')} alt="Her friend walks in carrying the blueprint" x={[0.26, 0.36]} h={[0.44, 0.56]} d={0.08} dx={enterL(s, 0, 0.6, W)} dy={-Math.abs(Math.sin(s * 14)) * 5 * walking} />
          <Cut src={A('blocks')} alt="A tower of wooden blocks being built" x={[0.62, 0.56]} h={[0.44, 0.56]} d={0.05} style={{ clipPath: `inset(${(1 - build) * 100}% -20% -10% -20%)` }} wiggle="" />
          <Cut src={A('bot-block')} alt="A robot carrying a block" x={[0.86, 0.72]} h={[0.27, 0.34]} d={0.1} dx={enterR(s, 0.2, 1.0, W) * 0.8} dy={-Math.abs(Math.sin(s * 16)) * 6 * (1 - seg(s, 0.9, 1.0))} />
        </>
      );
    },
    ui: s => (
      <Lines>
        <LevelLabel i={2} s={s} />
        <Typed text="Anyone can stack blocks." p={seg(s, 0.2, 0.7)} className="line" />
        <Typed text="You decide where they go." p={seg(s, 0.9, 1.4)} className="line" />
      </Lines>
    ),
  },

  /* 8. D: a band that never sleeps */
  {
    id: 'D',
    len: 2.6,
    wall: '#c3b5f2',
    floor: INDIGO,
    F: 0.24,
    ink: INK,
    level: 3,
    cues: [[1.0, 'jingle']],
    cam: s => ({ z: 1 + 0.014 * Math.abs(Math.sin(s * 11)) * seg(s, 0.95, 1.2), x: 0.5, y: 0.7 }),
    world: (s, { W, H, land, F }) => {
      const play = seg(s, 0.95, 1.2);
      const beat = i => -Math.abs(Math.sin(s * 11 + i * 0.9)) * 10 * play;
      const band = land ? [0.6, 0.72, 0.84] : [0.6, 0.78, 0.94];
      return (
        <>
          <Letter k="D" s={s} color="#ae9deb" />
          <Cut src={A('girl-baton')} alt="She conducts a band of robots with a baton" x={[0.24, 0.38]} h={[0.44, 0.56]} d={0.08} dx={enterL(s, 0, 0.6, W)} r={Math.sin(s * 11) * 2 * play} />
          <Cut src={A('bot-horn')} alt="A robot playing a trumpet" x={band[0]} h={[0.26, 0.33]} d={0.07} dx={enterR(s, 0.25, 0.8, W) * 1.2} dy={beat(0)} flip />
          <Cut src={A('bot-stand')} alt="" x={band[1]} h={[0.24, 0.31]} d={0.04} dx={enterR(s, 0.35, 0.9, W) * 1.2} dy={beat(1)} />
          <Cut src={A('bot-type')} alt="" x={band[2]} h={[0.2, 0.25]} d={0.1} dx={enterR(s, 0.45, 1.0, W) * 1.2} dy={beat(2)} />
          <Floaters items={['♪', '♫', '♪', '♬']} s={s} on={play} x={band[0] * W - (land ? 0.06 : 0.09) * H} y={(F - 0.07) * H + 0.2 * H} rise={H * 0.22} spread={26} speed={1.1} className="music" />
        </>
      );
    },
    ui: s => (
      <Lines>
        <LevelLabel i={3} s={s} />
        <Typed text="You don’t code alone anymore." p={seg(s, 0.2, 0.7)} className="line" />
        <Typed text="You lead a team that never sleeps." p={seg(s, 0.9, 1.45)} className="line" />
      </Lines>
    ),
  },

  /* 9. Y: a slow push into the spotlight */
  {
    id: 'Y',
    len: 2.5,
    wall: '#151a45',
    floor: '#0e1232',
    F: 0.24,
    ink: CREAM,
    level: 4,
    cam: s => ({ z: lerp(1, 1.16, inout(seg(s, 0.4, 1.9))), x: 0.5, y: 0.5 }),
    world: s => {
      const lit = out(seg(s, 0.6, 1.1));
      return (
        <>
          <Letter k="Y" s={s} color="#1f2660" />
          <div className="spot" style={{ opacity: lit }} aria-hidden="true" />
          <Cut src={A('girl-phone')} alt="She stands alone in a spotlight" x={0.5} h={[0.46, 0.56]} d={0.1} style={{ filter: `brightness(${0.25 + lit * 0.75})` }} />
        </>
      );
    },
    ui: s => (
      <Lines>
        <LevelLabel i={4} s={s} />
        <Typed text="And the last level" p={seg(s, 0.2, 0.6)} className="line" />
        <Typed text="is you." p={seg(s, 0.9, 1.15)} className="line line--big" />
        <Note o={seg(s, 1.25, 1.5)}>The part nobody can automate.</Note>
      </Lines>
    ),
  },

  /* 10. the passport (it flies in from the corner; see Story) */
  {
    id: 'pass',
    len: 2.2,
    wall: CREAM,
    floor: BLUE,
    F: 0.2,
    ink: INK,
    cues: [[0.72, 'chime']],
    ui: (s, { onPass }) => (
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

  /* 11. the lab: ends by leaning into the TV */
  {
    id: 'lab',
    len: 2.8,
    wall: BLUE,
    floor: CREAM,
    F: 0.24,
    ink: CREAM,
    cues: [[0.15, 'tv']],
    cam: (s, { land }) => ({ z: 1 + 0.32 * inout(seg(s, 1.55, 2.1)), x: land ? 0.4 : 0.32, y: land ? 0.6 : 0.64 }),
    world: (s, { W }) => {
      const screens = ['tv-04-tools-stage', 'tv-07-bug1-reveal-stage', 'tv-08-podium-stage', 'tv-words-feel'];
      const i = Math.min(3, Math.floor(seg(s, 0.2, 2.0) * 4));
      return (
        <>
          <Cut src={A('tv')} alt="A vintage TV showing the real Builders Lab screens" x={[0.34, 0.42]} h={[0.27, 0.42]} d={0.07} dy={(1 - back(seg(s, 0.1, 0.55))) * -60} o={seg(s, 0.1, 0.25)} wiggle="">
            <div className="tv-screen">
              {screens.map((n, j) => (
                <img key={n} src={A(n)} alt="" style={{ opacity: j === i ? 1 : 0 }} />
              ))}
            </div>
          </Cut>
          <Cut src={A('squad')} alt="A squad of four students cheering at their phones" x={[0.74, 0.7]} h={[0.4, 0.52]} d={0.1} dx={enterR(s, 0.6, 1.2, W) * 1.2} />
        </>
      );
    },
    ui: s => (
      <Lines>
        <Typed text="So we turned it into a game." p={seg(s, 0.1, 0.6)} className="line" />
        <Typed text="Phones out. Squads up." p={seg(s, 0.9, 1.35)} className="line" />
        <Note o={seg(s, 1.45, 1.7)}>5 levels · 1 leaderboard · 0 lectures</Note>
      </Lines>
    ),
  },

  /* 12. voices */
  {
    id: 'voices',
    len: 3.4,
    wall: CREAM,
    floor: '#f2b230',
    F: 0.2,
    ink: INK,
    world: (s, { land, W }) =>
      land ? <Cut src={A('boy-thumb')} alt="Her friend gives a thumbs up" x={0.92} h={0.5} d={0.06} dx={enterR(s, 1.6, 2.1, W) * 0.5} /> : null,
    ui: (s, { land }) => (
      <>
        <Lines>
          <Typed text="Pune played first." p={seg(s, 0.1, 0.45)} className="line" />
          <Note o={seg(s, 0.45, 0.65)}>26 Oct 2026 · Trinity Academy of Engineering</Note>
        </Lines>
        <div className={`notes-wall ${land ? 'is-land' : ''}`}>
          {VOICES_FULL.map((v, i) => {
            const drop = back(seg(s, 0.55 + i * 0.45, 0.9 + i * 0.45));
            return (
              <figure key={v.name} className="paper" style={{ '--r': `${[-4, 3, -2][i]}deg`, opacity: seg(s, 0.55 + i * 0.45, 0.65 + i * 0.45), transform: `translateY(${(1 - drop) * -60}px) rotate(var(--r))` }}>
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

  /* 13. the train: one carriage per city, straight from the event list */
  {
    id: 'train',
    len: 4.4,
    wall: '#a6d8ee',
    floor: '#2f7a4e',
    F: 0.22,
    ink: INK,
    cues: [[0.32, 'whistle'], ...Array.from({ length: 14 }, (_, i) => [0.5 + i * 0.19, 'chug'])],
    cam: s => ({ z: lerp(1.08, 1, out(seg(s, 0, 1.2))), x: 0.5, y: 0.75 }),
    world: (s, k) => {
      const { H, cities } = k;
      const t = trainGeometry(s, k);
      const walk = seg(s, 2.75, 3.45);
      const run = seg(s, 3.05, 3.6);
      return (
        <>
          <div className="rails" style={{ bottom: t.railY - 6 }} aria-hidden="true" />
          <div className="train" style={{ bottom: t.railY, transform: `translateX(${t.X}px) translateY(${t.shake}px)` }}>
            <img className="train__engine" src={A('engine')} alt="A vintage tin toy train" style={{ height: t.eh, width: t.ew }} draggable={false} />
            <Floaters items={['', '', '', '']} s={s * 1.4} on={t.moving ? 1 : 0.4} x={t.ew * 0.13} y={t.eh * 0.95} rise={H * 0.16} spread={10} className="smoke" />
            {cities.map((c, i) => (
              <a key={c.city + i} className={`coach ${i === t.near ? 'is-near' : ''}`} href={c.url} style={{ height: t.ch, width: t.cw, marginLeft: t.gap }} aria-label={`${c.city}: ${stationTag(c)}`}>
                <img src={A('coach')} alt="" draggable={false} />
                <span className="coach__board">
                  <b>{c.city}</b>
                  <small>{coachTag(c)}</small>
                </span>
              </a>
            ))}
          </div>
          <Cut src={A('girl-walk')} alt="She walks to the platform with her suitcase" x={lerp(-0.25, k.land ? 0.18 : 0.2, out(walk))} h={[0.38, 0.48]} d={0.1} z={5} o={walk > 0 ? 1 : 0} />
          <Cut src={A('boy-run')} alt="Her friend runs to catch the train" x={lerp(-0.3, k.land ? 0.36 : 0.62, out(run))} h={[0.36, 0.46]} d={0.04} z={5} o={run > 0 ? 1 : 0} />
        </>
      );
    },
    ui: (s, k) => {
      const c = k.cities[trainGeometry(s, k).near] || k.cities[0];
      return (
        <Lines>
          <Typed text="Next stop:" p={seg(s, 0.1, 0.35)} className="line" />
          <div className="station" style={{ opacity: seg(s, 0.35, 0.55) }} aria-live="polite">
            {c.city}
            <small>{stationTag(c)}</small>
          </div>
          <Note o={seg(s, 0.6, 0.8)}>Tap a carriage to board.</Note>
        </Lines>
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
    cues: [[0.2, 'pop']],
    cam: s => ({ z: lerp(1.14, 1, out(seg(s, 0, 0.9))), x: 0.55, y: 0.8 }),
    world: s => (
      <>
        <Cut src={A('girl-phone')} alt="The two friends and a robot, side by side" x={[0.3, 0.5]} h={[0.4, 0.5]} d={0.1} dx={(1 - out(seg(s, 0, 0.5))) * -80} />
        <Cut src={A('boy-wave')} alt="" x={[0.56, 0.62]} h={[0.4, 0.5]} d={0.09} dx={(1 - out(seg(s, 0.05, 0.55))) * 60} />
        <Cut src={A('bot-wave')} alt="" x={[0.84, 0.76]} h={[0.3, 0.36]} d={0.1} dx={(1 - out(seg(s, 0.1, 0.6))) * 80} />
      </>
    ),
    ui: (s, { jump, land }) => (
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
        <footer className="foot" style={{ opacity: seg(s, 0.3, 0.6) }}>
          <img src="/h2s-logo.png" alt="Hack2skill" width="48" height="18" />
          <a href={`mailto:${SUPPORT}`}>{SUPPORT}</a>
          <span>{land ? 'Futuready by Hack2skill · ' : ''}© 2026</span>
        </footer>
      </>
    ),
  },
];

/* where the robot, its cage and the bug sit in the catch scene */
function catchGeometry({ W, H, land, F }) {
  const rx = land ? 0.62 : 0.64;
  const rh = land ? 0.52 : 0.44;
  const d = 0.07;
  const base = (F - d) * H;
  const openW = rh * H * (455 / 810);
  const closedW = rh * H * (419 / 808);
  const left = rx * W - openW / 2;
  return {
    rx,
    rh,
    d,
    left,
    bugH: (land ? 0.075 : 0.065) * H,
    // the open cage, in the robot's hand on our right
    cageX: left + 0.8 * openW,
    cageY: base + (1 - 0.36) * rh * H,
    // the closed cage, held up high (the image is mirrored, so it is on our right too)
    closedCageX: rx * W - closedW / 2 + 0.85 * closedW,
    closedCageY: base + (1 - 0.2) * rh * H,
  };
}

/* the train's size and where it is along the line */
function trainGeometry(s, { W, H, land, F, cities }) {
  const n = Math.max(1, cities.length);
  const ch = (land ? 0.2 : 0.17) * H;
  const cw = ch * (678 / 364);
  const eh = ch * 1.13;
  const ew = eh * (732 / 410);
  const gap = ch * 0.03;
  const start = W + 20;
  const end = W / 2 - (ew + gap + (n - 1) * (cw + gap) + cw / 2);
  const move = inout(seg(s, 0.3, 3.0));
  const X = lerp(start, end, move);
  let near = 0;
  let best = Infinity;
  for (let i = 0; i < n; i++) {
    const c = X + ew + gap + i * (cw + gap) + cw / 2;
    if (Math.abs(c - W / 2) < best) {
      best = Math.abs(c - W / 2);
      near = i;
    }
  }
  const moving = move > 0 && move < 1;
  return { ch, cw, eh, ew, gap, X, near, moving, shake: moving ? Math.sin(s * 90) : 0, railY: (F - 0.07) * H };
}

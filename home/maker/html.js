/*
  Futuready page maker: the page sections for Hack2skill's "Embed HTML" editor (the current way).
  Hack2skill puts this HTML straight into the page, so real layout, the brand fonts, hover and scroll motion all work.
  No scripts: everything is HTML and CSS. Every class starts with "fr" so nothing leaks into Hack2skill's own page.
  Paste each block with: Live Edit > the section > Select Editor: Embed HTML > paste > Save.
  (The older Lexical versions of the same sections are in sections.js, kept as the backup.)
*/
import { derive, HOSTED, TRAINER, QUOTES } from './sections.js';
// where the main site lives (its small "Other cities" page is shown on every event page)
const HOME = 'https://futuready.hack2skill.com/';

const esc = t => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const H2S = 'https://storage.googleapis.com/vision-hack2skill-production/innovator/USER02555644/';
export const ART = {
  girl: H2S + '1795396086747-girlphone.webp',
  boy: H2S + '1795396104806-boylaptop.webp',
  bot: H2S + '1795396143271-botwave.webp',
  stamp: H2S + '1795396178702-stamp.webp',
};

// each level says plainly what you get: that is what students sign up for
const LEVELS = [
  ['R', 'Requirements', 'Learn the art of spec writing.', '#f2a7b8', '#e98ca2'],
  ['E', 'Evaluate', 'Learn to evaluate like Anthropic engineers.', '#9ed6c0', '#86c8ae'],
  ['A', 'Architect', 'Learn to architect scalable AI systems.', '#f2b230', '#e3a21c'],
  ['D', 'Direct', 'Learn to direct a team of AI agents.', '#c3b5f2', '#ae9deb'],
];
const TAGS = ['DevRel · Hack2skill', 'Architect', 'Builds AI products', 'Loves math', 'Dances salsa', 'Plays music'];
const TINTS = ['#fdeef1', '#eaf6f0', '#fff4dc', '#efeafc'];

const FONTS = "@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400..700&family=Geist+Mono:wght@500..600&family=Unbounded:wght@600..900&display=swap');";
const BASE = `
.fr{--blue:#3463af;--gold:#f2b230;--cream:#efe6d2;--paper:#fffcf5;--ink:#161a3a;container-type:inline-size;
  font:400 16px/1.5 'Geist',system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;margin:0 0 56px;text-align:left;text-wrap:balance}
.fr *,.fr *::before,.fr *::after{box-sizing:border-box}
.fr p,.fr h3,.fr ul,.fr ol,.fr li,.fr figure,.fr blockquote{margin:0;padding:0}
.fr ul,.fr ol{list-style:none}
.fr img{display:block;max-width:100%;height:auto}
.fr a{color:inherit}
.fr .fr-d{font-family:'Unbounded',system-ui,sans-serif;font-weight:700;letter-spacing:-.045em;line-height:1.08}
.fr .fr-mono{font-family:'Geist Mono',ui-monospace,Menlo,monospace;font-weight:600;letter-spacing:.06em}
.fr .fr-btn{display:flex;align-items:center;justify-content:center;gap:10px;min-height:58px;padding:0 28px;border-radius:999px;background:var(--gold);color:var(--ink);
  font:700 18px/1 'Unbounded',system-ui,sans-serif;letter-spacing:-.03em;text-decoration:none;box-shadow:0 6px 0 #c98c12,0 14px 24px rgba(10,12,30,.14);
  transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s}
.fr .fr-btn span{transition:transform .25s}
.fr .fr-btn:hover{transform:translateY(-2px);box-shadow:0 8px 0 #c98c12,0 18px 28px rgba(10,12,30,.18)}
.fr .fr-btn:hover span{transform:translateX(4px)}
.fr .fr-btn:active{transform:translateY(4px);box-shadow:0 2px 0 #c98c12,0 6px 12px rgba(10,12,30,.14)}
.fr .fr-btn:focus-visible{outline:3px solid var(--blue);outline-offset:3px}
.fr .fr-note{font:500 13px/1.5 'Geist Mono',ui-monospace,monospace;opacity:.75}
/* things rise in as they scroll into view (only where the browser can, and never for people who prefer less motion) */
@supports (animation-timeline:view()){@media (prefers-reduced-motion:no-preference){
  .fr .fr-in{animation:fr-rise linear both;animation-timeline:view();animation-range:entry 0% entry 75%}
  @keyframes fr-rise{from{opacity:0;transform:translateY(26px)}}
}}`;

const block = (name, css, body) =>
  `<!-- Futuready by H2S: ${name}. Embed HTML (HTML and CSS only). Made with the Futuready page maker. -->\n<style>\n${FONTS}\n${BASE}\n${css.trim()}\n</style>\n${body.trim()}\n`;

const FLAPS = `
.fr .fr-flaps{display:grid;justify-items:end;gap:5px;font-family:'Geist Mono',ui-monospace,monospace;flex:none}
.fr .fr-flaps small{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--blue)}
.fr .fr-flaprow{display:flex;gap:3px;padding:4px;border-radius:7px;background:var(--ink);box-shadow:0 10px 20px rgba(10,12,30,.25)}
.fr .fr-flaprow b{position:relative;width:1.05em;height:1.45em;display:grid;place-items:center;border-radius:3px;
  background:linear-gradient(to bottom,#2a2f5c 50%,#242952 50%);color:var(--paper);font-size:24px;font-weight:700;line-height:1}
.fr .fr-flaprow b::after{content:'';position:absolute;left:0;right:0;top:50%;height:1px;background:rgba(0,0,0,.55)}
@media (prefers-reduced-motion:no-preference){.fr .fr-flaprow b{animation:fr-flip .7s cubic-bezier(.3,1.4,.6,1) both}.fr .fr-flaprow b:nth-child(2){animation-delay:.12s}.fr .fr-flaprow b:nth-child(3){animation-delay:.24s}}
@keyframes fr-flip{from{transform:rotateX(90deg)}}`;
const flaps = (label, rows, aria) =>
  `<div class="fr-flaps" role="img" aria-label="${esc(aria)}"><small>${esc(label)}</small>${rows.map(r => `<span class="fr-flaprow">${[...r].map(c => `<b>${esc(c)}</b>`).join('')}</span>`).join('')}</div>`;

export function htmlSections(e, hosted = HOSTED) {
  const x = derive(e);
  const reg = x.reg;
  // the register buttons never fade: they are always solid and ready
  const button = (label = 'Register free') => `<a class="fr-btn" href="${reg}">${esc(label)} <span aria-hidden="true">→</span></a>`;

  // ---- About: the question, the four facts, register, the partner
  const tiles = x.virtual
    ? [['When', 'Every few weeks', 'dates come by email'], ['Where', 'Online', 'join from anywhere'], ['Cost', 'Free', 'register just once'], ['Format', 'Hands-on', 'on your phone + AI']]
    : [['When', x.dateShort.replace(/ \d{4}$/, ''), `${e.start} – ${e.end}`], ['Where', e.campus, e.city], ['Cost', 'Free', 'for every student'], ['Format', 'Hands-on', 'on your phone + AI']];
  const board = x.virtual ? flaps('Virtual', ['LIVE'], 'Live online') : flaps(x.weekday || 'Date', [x.day, x.mon], x.dateLong);
  const strip = (e.stripUrl || '').trim();
  const partner = x.virtual || !e.partnerLabel ? '' : `
  <div class="fr-partner fr-in">
    <p class="fr-mono fr-label">${esc(e.partnerLabel)} · <b>${esc(e.campus)}</b></p>
    ${strip ? `<img src="${esc(strip)}" alt="${esc(e.campus)}" width="${e.stripW || 420}" height="${e.stripH || 52}" loading="lazy">` : ''}
  </div>`;
  const about = block('About', FLAPS + `
.fr-about .fr-top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
.fr-about .fr-hook{font-size:clamp(23px,4.6cqw,34px);max-width:22ch}
.fr-about .fr-sub{margin-top:12px;font-size:18px;opacity:.85;max-width:46ch}
.fr-about .fr-tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:24px}
.fr-about .fr-tiles li{padding:14px 16px 15px;border-radius:16px;background:var(--t);transition:transform .25s cubic-bezier(.34,1.56,.64,1)}
.fr-about .fr-tiles li:hover{transform:translateY(-3px) rotate(-.6deg)}
.fr-about .fr-tiles small{display:block;font:600 11px/1 'Geist Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--blue)}
.fr-about .fr-tiles b{display:block;margin-top:9px;font:700 18px/1.15 'Unbounded',sans-serif;letter-spacing:-.04em}
.fr-about .fr-tiles span{display:block;margin-top:5px;font-size:14px;opacity:.8}
.fr-about .fr-btn{margin-top:14px}
.fr-about .fr-quick{margin-top:10px;text-align:center}
.fr-about .fr-partner{margin-top:30px;padding-top:22px;border-top:1px dashed rgba(22,26,58,.18)}
.fr-about .fr-label{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--blue)}
.fr-about .fr-label b{color:var(--ink)}
.fr-about .fr-partner img{margin-top:16px;height:46px;width:auto}
.fr-about .fr-flaps{display:none}
@container (min-width:560px){.fr-about .fr-tiles{grid-template-columns:repeat(4,1fr)}.fr-about .fr-flaps{display:grid}}`, `
<section class="fr fr-about">
  <div class="fr-top">
    <div>
      <h3 class="fr-d fr-hook">${esc(e.hook)}</h3>
      <p class="fr-sub">${esc(e.sub)}</p>
    </div>
    ${board}
  </div>
  <ul class="fr-tiles">
    ${tiles.map(([k, v, d], i) => `<li style="--t:${TINTS[i]}"><small>${esc(k)}</small><b>${esc(v)}</b><span>${esc(d)}</span></li>`).join('\n    ')}
  </ul>
  ${button()}
  <p class="fr-note fr-quick">Takes a minute. Free for every student.</p>${partner}
</section>`);

  // ---- What you will learn: the five levels, then the passport
  const learn = block('What you will learn', `
.fr-learn .fr-intro{font:600 clamp(19px,3.6cqw,23px)/1.25 'Geist',sans-serif;letter-spacing:-.03em;max-width:32ch}
.fr-learn .fr-grid{display:grid;gap:12px;margin-top:18px}
.fr-learn .fr-lv{position:relative;overflow:hidden;min-height:124px;padding:18px 20px;border-radius:20px;background:var(--wall)}
.fr-learn .fr-letter{position:absolute;right:-4px;bottom:-30px;font:900 150px/1 'Unbounded',sans-serif;letter-spacing:-.06em;color:var(--tint);pointer-events:none;transition:transform .4s cubic-bezier(.34,1.56,.64,1)}
.fr-learn .fr-lv:hover .fr-letter{transform:translate(-6px,-8px) rotate(-6deg)}
.fr-learn .fr-tag{position:relative;display:flex;align-items:center;gap:8px;font-size:12px}
.fr-learn .fr-tag i{width:9px;height:9px;border-radius:50%;background:currentColor;opacity:.6}
.fr-learn .fr-say{position:relative;margin-top:10px;font:700 clamp(18px,3cqw,21px)/1.18 'Unbounded',sans-serif;letter-spacing:-.04em;max-width:17ch}
.fr-learn .fr-lv--y{--wall:#151a45;--tint:#20286a;color:var(--cream)}
.fr-learn .fr-you{position:relative;margin-top:8px;font:800 clamp(34px,6cqw,46px)/1 'Unbounded',sans-serif;letter-spacing:-.05em;color:var(--gold)}
.fr-learn .fr-lv--y .fr-say{max-width:30ch}
.fr-learn .fr-pass{display:flex;align-items:center;gap:18px;margin-top:12px;padding:16px 20px;border-radius:20px;background:var(--cream)}
.fr-learn .fr-pass img{width:150px;flex:none;transform:rotate(-4deg);filter:drop-shadow(0 8px 14px rgba(10,12,30,.2))}
.fr-learn .fr-pass b{display:block;font:700 clamp(17px,3cqw,21px)/1.2 'Unbounded',sans-serif;letter-spacing:-.04em}
.fr-learn .fr-pass b em{font-style:normal;color:var(--blue)}
.fr-learn .fr-pass span{display:block;margin-top:6px;opacity:.8}
@container (min-width:560px){.fr-learn .fr-grid{grid-template-columns:1fr 1fr}.fr-learn .fr-lv--y{grid-column:1 / -1}}
@container (max-width:420px){.fr-learn .fr-pass{flex-direction:column;align-items:flex-start}.fr-learn .fr-pass img{width:130px}}`, `
<section class="fr fr-learn">
  <p class="fr-intro">The five skills developers need now that AI writes the code. One level each, and a stamp for every level you clear.</p>
  <ol class="fr-grid">
    ${LEVELS.map(([k, name, gain, wall, tint], i) => `<li class="fr-lv fr-in" style="--wall:${wall};--tint:${tint}"><b class="fr-letter" aria-hidden="true">${k}</b><p class="fr-mono fr-tag"><i></i>Level ${i + 1} · ${name}</p><p class="fr-say">${esc(gain)}</p></li>`).join('\n    ')}
    <li class="fr-lv fr-lv--y fr-in"><b class="fr-letter" aria-hidden="true">Y</b><p class="fr-mono fr-tag"><i></i>Level 5 · You</p><p class="fr-you">Younique.</p><p class="fr-say">Discover your own strengths, the edge no AI can copy.</p></li>
  </ol>
  <div class="fr-pass fr-in">
    <img src="${hosted.passport}" alt="An open Futuready passport with all five stamps" width="150" height="116" loading="lazy">
    <p><b>Clear all five, and you take home your <em>e-passport.</em></b><span>Signed, stamped proof of your new skills, ready to share on LinkedIn.</span></p>
  </div>
</section>`);

  // ---- Schedule: a timeline
  const steps = (e.schedule || []).filter(r => r.time || r.title);
  const schedule = block(x.virtual ? 'How a session goes' : 'Schedule', `
.fr-day .fr-when{font:600 15px/1.3 'Geist Mono',monospace;letter-spacing:.02em;color:var(--blue)}
.fr-day .fr-steps{margin:18px 0 0 7px;border-left:2px dashed rgba(22,26,58,.2)}
.fr-day .fr-step{position:relative;padding:0 0 22px 26px}
.fr-day .fr-step::before{content:'';position:absolute;left:-9px;top:3px;width:16px;height:16px;border-radius:50%;background:var(--blue);box-shadow:0 0 0 4px #fff}
.fr-day .fr-step:last-child{padding-bottom:0}
.fr-day .fr-step:last-child::before{background:var(--gold)}
.fr-day .fr-step small{display:inline-block;padding:3px 10px;border-radius:999px;background:var(--gold);font:600 13px/1.3 'Geist Mono',monospace}
.fr-day .fr-step strong{display:block;margin-top:6px;font:700 19px/1.25 'Unbounded',sans-serif;letter-spacing:-.04em}
.fr-day .fr-step span{display:block;margin-top:3px;opacity:.8;max-width:52ch}
.fr-day .fr-foot{margin-top:18px}`, `
<section class="fr fr-day">
  ${x.virtual ? '' : `<p class="fr-when">${esc(x.dateLong)} · ${esc(e.campus)}, ${esc(e.city)}</p>`}
  <ol class="fr-steps">
    ${steps.map(r => `<li class="fr-step fr-in"><small>${esc(r.time)}</small><strong>${esc(r.title)}</strong>${r.detail ? `<span>${esc(r.detail)}</span>` : ''}</li>`).join('\n    ')}
  </ol>
  ${e.note ? `<p class="fr-note fr-foot">${esc(e.note)}</p>` : ''}
</section>`);

  // ---- Meet your trainer: square photo on the left, words on the right
  const trainer = block('Meet your trainer', `
.fr-trainer .fr-card{display:grid;grid-template-columns:auto 1fr;gap:22px;align-items:center;padding:20px;border-radius:22px;background:var(--cream)}
.fr-trainer .fr-photo{width:170px;aspect-ratio:1;object-fit:cover;border-radius:16px;box-shadow:0 12px 26px rgba(10,12,30,.18);transform:rotate(-2deg);transition:transform .35s cubic-bezier(.34,1.56,.64,1)}
.fr-trainer .fr-card:hover .fr-photo{transform:rotate(0) scale(1.02)}
.fr-trainer h3{font-size:clamp(24px,4.4cqw,32px)}
.fr-trainer .fr-bio{margin-top:6px;font-size:17px;max-width:44ch}
.fr-trainer .fr-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.fr-trainer .fr-tags li{padding:4px 10px;border-radius:999px;background:var(--paper);font:600 12px/1.3 'Geist Mono',monospace}
.fr-trainer .fr-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.fr-trainer .fr-links a{display:inline-flex;align-items:center;min-height:40px;padding:0 16px;border-radius:999px;font:700 14px/1 'Geist',sans-serif;text-decoration:none;transition:transform .2s}
.fr-trainer .fr-links a:hover{transform:translateY(-2px)}
.fr-trainer .fr-li{background:var(--blue);color:var(--paper)!important}
.fr-trainer .fr-ig{background:var(--gold);color:var(--ink)!important}
@container (max-width:480px){.fr-trainer .fr-card{grid-template-columns:1fr}.fr-trainer .fr-photo{width:140px}}`, `
<section class="fr fr-trainer">
  <div class="fr-card fr-in">
    <img class="fr-photo" src="${hosted.portrait}" alt="${esc(TRAINER.name)}, your trainer" width="170" height="170" loading="lazy">
    <div>
      <h3 class="fr-d">${esc(TRAINER.name)}</h3>
      <p class="fr-bio">${esc(TRAINER.bio)}</p>
      <ul class="fr-tags">${TAGS.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      <p class="fr-links"><a class="fr-li" href="${TRAINER.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a><a class="fr-ig" href="${TRAINER.instagram}" target="_blank" rel="noopener noreferrer">Instagram ↗</a></p>
    </div>
  </div>
</section>`);

  // ---- What students say: taped notes, the facts, register
  const facts = x.virtual ? ['Free', 'Online', 'Every few weeks'] : ['Free', x.dateShort, `${e.start} – ${e.end}`, `${e.campus}, ${e.city}`];
  const voices = block('What students say', `
.fr-voices .fr-wall{display:grid;gap:22px;padding:30px 18px 24px;border-radius:22px;background:var(--cream)}
.fr-voices .fr-paper{position:relative;display:flex;flex-direction:column;justify-content:space-between;padding:20px 20px 16px;border-radius:4px;background:var(--paper);box-shadow:0 1px 0 rgba(0,0,0,.05),0 12px 26px rgba(10,12,30,.14);transform:rotate(var(--r));transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
.fr-voices .fr-paper:hover{transform:rotate(0) translateY(-4px)}
.fr-voices .fr-paper::before{content:'';position:absolute;top:-9px;left:50%;width:64px;height:18px;transform:translateX(-50%) rotate(-3deg);background:rgba(242,178,48,.65)}
.fr-voices blockquote{font:600 19px/1.38 'Geist',sans-serif;letter-spacing:-.015em}
.fr-voices figcaption{margin-top:12px;font:700 14px/1.3 'Geist',sans-serif;color:var(--blue)}
.fr-voices figcaption span{display:block;margin-top:1px;font:500 12px/1.3 'Geist Mono',monospace;color:var(--ink);opacity:.7}
.fr-voices .fr-facts{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:20px}
.fr-voices .fr-facts li{padding:6px 14px;border-radius:999px;background:var(--t);font:600 14px/1.3 'Geist Mono',monospace}
.fr-voices .fr-btn{margin-top:16px}
@container (min-width:620px){.fr-voices .fr-wall{grid-template-columns:repeat(3,1fr);padding:34px 26px 28px}}`, `
<section class="fr fr-voices">
  <div class="fr-wall">
    ${QUOTES.map(([q, n, r], i) => `<figure class="fr-paper fr-in" style="--r:${[-2.2, 1.8, -1.4][i]}deg"><blockquote>“${esc(q)}”</blockquote><figcaption>${esc(n)}<span>${esc(r)}</span></figcaption></figure>`).join('\n    ')}
  </div>
  <ul class="fr-facts">${facts.map((f, i) => `<li style="--t:${[...TINTS.slice(2), ...TINTS][i % 4]}">${esc(f)}</li>`).join('')}</ul>
  ${button()}
</section>`);

  const out = [
    { key: 'about', title: 'About', where: 'Live Edit → About → Select Editor: Embed HTML', html: about },
    { key: 'learn', title: 'What you will learn', where: 'Custom section "What you will learn" → Select Editor: Embed HTML', html: learn },
    { key: 'schedule', title: x.virtual ? 'How a session goes' : 'Schedule', where: `Custom section "${x.virtual ? 'How a session goes' : 'Schedule'}" → Select Editor: Embed HTML`, html: schedule },
    { key: 'trainer', title: 'Meet your trainer', where: 'Custom section "Meet your trainer" → Select Editor: Embed HTML', html: trainer },
    { key: 'voices', title: 'What students say', where: 'Custom section "What students say" → Select Editor: Embed HTML', html: voices },
  ];
  // the other cities, live: a small page on the main site (public/cities/) that lists what Hack2skill has published
  {
    const src = `${HOME}cities/index.html?not=${x.slug}`;
    out.push({ key: 'cities', title: 'Other cities', where: 'New custom section "Other cities" → Select Editor: Embed HTML', html: block('Other cities', '.fr-cities iframe{display:block;width:100%;height:230px;border:0}', `<section class="fr fr-cities"><iframe src="${src}" title="Other Futuready cities" loading="lazy"></iframe></section>`) });
  }
  return out;
}

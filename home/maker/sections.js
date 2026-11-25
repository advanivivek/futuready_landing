/*
  Futuready page maker: the words of a Hack2skill initiative page, from one event's details.
  Pure functions (no browser needed), used by the maker page and by: node home/maker/print.mjs <preset>

  Hack2skill's section editor keeps only: text colour, size and weight, bold, links, pictures, line breaks,
  and the background colour of table cells and of text. It drops stylesheets, boxes, fonts and its own
  column layouts. So cards are table cells, capsules are coloured text, and buttons are coloured cells.
  Paste each block with: Live Edit > the section > Insert > Source Code > paste > Embed > Save.
*/

import { SITE_URL } from '../src/data.js';

export const INK = '#161a3a', BLUE = '#3463af', GOLD = '#f2b230', PAPER = '#fffcf5', CREAM = '#efe6d2';
export const TINTS = ['#fdeef1', '#eaf6f0', '#fff4dc', '#efeafc'];

// pictures already on Hack2skill's own storage (uploaded through Live Edit)
const H2S = 'https://storage.googleapis.com/vision-hack2skill-production/innovator/USER02555644/';
export const HOSTED = {
  portrait: H2S + '1795444779197-viveksquare.webp', // square: fills the trainer card's left box
  passport: H2S + '1795397394282-passport.webp',
  parulStrip: H2S + '1795438579788-vadodarapartnerlogos.webp', // Parul University + The PU AI Society, on one line
};

export const TRAINER = {
  name: 'Vivek Advani',
  bio: 'DevRel at Hack2skill. An architect who builds AI products, and loves math, salsa and music.',
  linkedin: 'https://www.linkedin.com/in/vivekadvani',
  instagram: 'https://instagram.com/vivekadvani',
};

export const LEVELS = [
  ['R', 'Learn the art of spec writing.', 'AI does literally what you say.', '#f2a7b8'],
  ['E', 'Learn to evaluate like Anthropic engineers.', 'If it looks right, is it really right?', '#9ed6c0'],
  ['A', 'Learn to architect scalable AI systems.', 'Anyone can stack blocks.', '#f2b230'],
  ['D', 'Learn to direct a team of AI agents.', 'Nobody codes alone anymore.', '#c3b5f2'],
];

export const QUOTES = [
  ['One of those rare sessions where you don’t feel bored even for a second!', 'Swapnaja Waghapure', 'MCA student'],
  ['One more step towards becoming a builder rather than just a thinker.', 'Durga Khadbade', 'Engineering student, TAE Pune'],
  ['Live interactive activities, multiple levels to progress through, and a team-based prompting challenge.', 'Aditi Guddeti', 'IT engineering, GDG TAE'],
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const esc = t => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = t => String(t || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Everything that follows from the few things you type.
export function derive(e) {
  const virtual = e.kind === 'virtual';
  const d = e.date ? new Date(e.date + 'T00:00:00') : null;
  const ok = d && !Number.isNaN(d.getTime());
  const dd = ok ? String(d.getDate()).padStart(2, '0') : '--';
  const mm = ok ? String(d.getMonth() + 1).padStart(2, '0') : '--';
  const slug = virtual ? 'futuready-virtual' : `futuready-${slugify(e.city) || 'city'}-${dd}${mm}${ok ? d.getFullYear() : '----'}`;
  return {
    virtual,
    slug,
    url: `https://hack2skill.com/event/${slug}`,
    reg: `https://hack2skill.com/event/${slug}/registration`,
    liveEdit: `https://hack2skill.com/admin/${slug}/live-edit`,
    preview: `https://hack2skill.com/event/preview/${slug}`,
    title: virtual ? 'Futuready by H2S · Virtual' : `Futuready by H2S · ${e.campus}, ${e.city}`,
    day: dd,
    mon: ok ? MONTHS[d.getMonth()].slice(0, 3).toUpperCase() : '---',
    weekday: ok ? DAYS[d.getDay()] : '',
    dateLong: ok ? `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : '',
    dateShort: ok ? `${DAYS[d.getDay()].slice(0, 3)}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}` : '',
    hello: (e.hello || (virtual ? 'Builders' : e.city || '')).trim(),
  };
}

const s = (text, size = 17, weight = 0, color = INK) =>
  `<span style="font-size:${size}px;${weight ? `font-weight:${weight};` : ''}color:${color}">${esc(text)}</span>`;
// a capsule: coloured text with a little room either side
const pill = (text, bg, color = INK, size = 15) =>
  `<span style="font-size:${size}px;font-weight:800;color:${color};background-color:${bg}">&nbsp;&nbsp;${esc(text)}&nbsp;&nbsp;</span>`;
const p = (inner, center) => `<p${center ? ' style="text-align:center"' : ''}>${inner}</p>`;
const cell = (bg, inner, span) => `<td${span ? ` colspan="${span}"` : ''} style="background-color:${bg}">${inner}</td>`;
const button = (href, label, span, bg = GOLD, fg = INK) => cell(bg, p(`<a href="${href}">${s(label, 20, 800, fg)}</a>`, true), span);
// a clear break between sections
const END = '<p><br></p><hr><p><br></p>';
const GAP = '<p><br></p>';

export function sections(e, hosted = HOSTED) {
  const x = derive(e);
  // the small lines are about as long as each other, so the four tiles come out even and the row is as wide as
  // the "What you will learn" table (Hack2skill sizes tables to their words; phones wrap them as usual)
  const tiles = x.virtual
    ? [['When', 'Every few weeks', 'dates come by email'], ['Where', 'Online', 'join from anywhere'], ['Cost', 'Free', 'register just once'], ['Format', 'Hands-on', 'on your phone + AI']]
    : [['When', x.dateShort.replace(/ \d{4}$/, ''), `${e.start} – ${e.end}`], ['Where', e.campus, e.city], ['Cost', 'Free', 'for every student'], ['Format', 'Hands-on', 'on your phone + AI']];
  const tile = ([k, v, d], i) => cell(TINTS[i], p(s(k.toUpperCase(), 12, 800, BLUE)) + p(s(v, 17, 800)) + p(s(d, 14)));
  const strip = (e.stripUrl || '').trim();
  const partner = x.virtual || !e.partnerLabel
    ? ''
    : GAP + p(s(`${e.partnerLabel}: `, 15, 800, BLUE) + s(e.campus, 15, 800)) +
      (strip ? GAP + `<p><img src="${esc(strip)}" alt="${esc(e.campus)}" width="${e.stripW || 420}" height="${e.stripH || 60}"></p>` : '');

  const about =
    p(s(e.hook, 24, 800)) +
    p(s(e.sub, 17)) +
    `<table><tbody><tr>${tiles.map(tile).join('')}</tr><tr>${button(x.reg, 'Register free  →', 4)}</tr></tbody></table>` +
    partner + END;

  const levels = LEVELS.map(([k, what, hook, wall]) =>
    `<tr>${cell(wall, p(s(k, 40, 800), true))}${cell(PAPER, p(s(what, 19, 800)) + p(s(hook, 16, 0, BLUE)))}</tr>`).join('');
  const learn =
    `<table><tbody><tr>${cell(CREAM, p(s('Five levels. Clear one, earn a stamp.', 17, 800)), 2)}</tr>${levels}` +
    `<tr>${cell(BLUE, p(s('Y', 40, 800, GOLD), true))}${cell(BLUE, p(s('Build your own edge: the part of you ', 19, 800, PAPER) + s('AI can’t copy.', 19, 800, GOLD)) + p(s('The last level is you.', 16, 0, CREAM)))}</tr>` +
    `<tr>${cell(CREAM, `<p><img src="${hosted.passport}" alt="An open Futuready passport with all five stamps" width="200" height="154"></p>`)}` +
    `${cell(CREAM, p(s('Clear all five, and you take home your ', 19, 800) + s('e-passport.', 19, 800, BLUE)) + p(s('Signed, stamped proof of your new skills, ready to share on LinkedIn.', 15)))}</tr>` +
    `</tbody></table>` + END;

  const rows = (e.schedule || []).filter(r => r.time || r.title).map(r =>
    `<tr>${cell(GOLD, p(s(r.time, 15, 800)))}${cell(PAPER, p(s(r.title, 18, 800)) + (r.detail ? p(s(r.detail, 15)) : ''))}</tr>`).join('');
  const schedule =
    (x.virtual ? '' : p(s(`${x.dateLong} · ${e.campus}, ${e.city}`, 17, 800, BLUE))) +
    `<table><tbody>${rows}</tbody></table>` + (e.note ? p(s(e.note, 15)) : '') + END;

  // Photo left, words right, the way the old Pune page had it. Only Hack2skill's own Column Layout does this (a
  // pasted layout is flattened, and a table rescales the photo on save), so the two parts are pasted into its columns.
  const photo = `<p><img src="${hosted.portrait}" alt="${TRAINER.name}" width="180" height="180"></p>`; // a bit wider than its column, so it fills the box edge to edge on any screen
  const words = p(s(TRAINER.name, 28, 800)) + p(s(TRAINER.bio, 18)) +
    p(`<a href="${TRAINER.linkedin}">${pill('LinkedIn ↗', BLUE, PAPER, 17)}</a>&nbsp;&nbsp;&nbsp;<a href="${TRAINER.instagram}">${pill('Instagram ↗', GOLD, INK, 17)}</a>`);
  const trainer = photo + words + END;

  const facts = x.virtual ? ['Free', 'Online', 'Register once, join any session'] : ['Free', x.dateShort, `${e.start} – ${e.end}`, `${e.campus}, ${e.city}`];
  const voices =
    `<table><tbody>` +
    QUOTES.map(([q, n, r], i) => `<tr>${cell(TINTS[i], p(s(`“${q}”`, 22, 700)) + p(s(n, 15, 800, BLUE) + s(`  ·  ${r}`, 15)))}</tr>`).join('') +
    `<tr>${cell(PAPER, p(facts.map((f, i) => pill(f, [CREAM, '#eaf6f0', '#fff4dc', '#efeafc'][i % 4])).join('&nbsp;&nbsp;'), true))}</tr>` +
    `<tr>${button(x.reg, 'Register free  →')}</tr></tbody></table>` + END;

  return [
    { key: 'about', title: 'About', where: 'Live Edit → About', html: about },
    { key: 'learn', title: 'What you will learn', where: 'Custom section "What you will learn"', html: learn },
    { key: 'schedule', title: x.virtual ? 'How a session goes' : 'Schedule', where: `Custom section "${x.virtual ? 'How a session goes' : 'Schedule'}"`, html: schedule },
    {
      key: 'trainer',
      title: 'Meet your trainer',
      where: 'A cloned page already has it: leave it. To build it again: empty the section, Insert → Column Layout → 2 columns (25% - 75%) → Insert, click in the left column and paste the Photo, click in the right column and paste the Words, Save',
      html: trainer,
      parts: [['Photo', photo], ['Words', words]],
    },
    { key: 'voices', title: 'What students say', where: 'Custom section "What students say"', html: voices },
    // the other cities, live: a little page on the main site (public/cities/) that lists what Hack2skill has published
    SITE_URL && {
      key: 'cities',
      title: 'Other cities',
      where: 'New custom section "Other cities" → Insert → Embed Iframe (not Source Code) → paste → Embed → Save',
      html: `<iframe src="${SITE_URL.replace(/\/?$/, '/')}cities/index.html?not=${x.slug}" width="100%" height="230" style="border:0" title="Other Futuready cities"></iframe>`,
    },
  ].filter(Boolean);
}

export function faqs(e) {
  const x = derive(e);
  return x.virtual
    ? [
        ['Who can attend?', 'College students from any year and any branch, anywhere in India. If you can join a video call, you can join Futuready.'],
        ['Is it free?', 'Yes. Futuready is free for students.'],
        ['How do I join a session?', 'Register once on this page. Before every session we email you the date, the time and the joining link, so you can come to the next one or any later one.'],
        ['Do I need a laptop?', 'A phone is enough to play along. A laptop helps for the build in the boss level, but it is not a must.'],
        ['Do I need to know AI already?', 'No. If you have used any AI chatbot even once, you are ready. If you have used none, you will leave having built something with one.'],
        ['What should I bring?', 'A charged phone with internet, a quiet corner, and your curiosity. A laptop if you have one.'],
        ['Why register?', 'Registering once keeps you on the list for every session: you get each date and joining link by email.'],
        ['How do I bring Futuready to my college?', 'Ask your Training and Placement cell or your tech club to write to support@hack2skill.com.'],
      ]
    : [
        ['Who can attend?', `College students from any year and any branch, in and around ${e.city}. Beginners are welcome, and seniors get harder challenges in the same room.`],
        ['Is it free?', 'Yes. Futuready is free for students.'],
        ['Where and when exactly?', `${x.dateLong}, ${e.start} to ${e.end}, at ${e.campus}, ${e.city}. ${e.note || ''}`.trim()],
        ['Do I need a laptop?', 'No. Your phone is enough for the whole session. For the build, one laptop per squad of four helps, but it is not a must.'],
        ['Do I need to know AI already?', 'No. If you have used any AI chatbot even once, you are ready. If you have used none, you will leave having built something with one.'],
        ['What should I bring?', 'A charged phone and your curiosity. A laptop if you have one.'],
        ['Why register?', 'It helps us plan seats and saves you time at the door. Registering is not a guarantee of a seat; entry is confirmed on the day.'],
        ['How do I bring Futuready to my college?', 'Ask your Training and Placement cell or your tech club to write to support@hack2skill.com.'],
      ];
}

// "12:45 PM" on a date -> "20261207T071500Z" (India time to UTC), for the add-to-calendar link
function utc(date, time) {
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(time || '');
  if (!date || !m) return '';
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  const t = new Date(`${date}T${String(h).padStart(2, '0')}:${m[2]}:00+05:30`);
  return Number.isNaN(t.getTime()) ? '' : t.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function email(e) {
  const x = derive(e);
  const rows = (x.virtual
    ? [['When', 'A new session every few weeks'], ['Time', 'About 2 hours. Each date and time comes by email.'], ['Where', 'Online, from anywhere']]
    : [['Date', x.dateLong], ['Time', `${e.start} to ${e.end}`], ['Venue', `${e.campus}, ${e.city}`]])
    .map(([k, v]) => `<tr><td style="padding:10px 14px;background:${CREAM};font:800 12px/1.3 Arial,sans-serif;letter-spacing:1px;color:${BLUE}">${k.toUpperCase()}</td><td style="padding:10px 14px;background:${PAPER};font:700 15px/1.4 Arial,sans-serif;color:${INK}">${esc(v)}</td></tr>`).join('');
  const a = utc(e.date, e.start), b = utc(e.date, e.end);
  const cal = !x.virtual && a && b
    ? `<p style="margin:18px 0 0"><a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Futuready%20by%20H2S&dates=${a}/${b}&location=${encodeURIComponent(`${e.campus}, ${e.city}`)}&details=Bring%20a%20charged%20phone." style="display:inline-block;padding:12px 20px;border-radius:999px;background:${GOLD};color:${INK};font:800 15px Arial,sans-serif;text-decoration:none">Add to Google Calendar</a></p>`
    : '';
  const note = x.virtual ? 'Before each session, we email you its date, time and joining link.' : e.note || '';
  const bring = x.virtual ? 'A charged phone with internet, a quiet corner, and your curiosity. A laptop if you have one.' : 'A charged phone and your curiosity. A laptop if you have one.';
  return {
    subject: x.virtual ? "You're in: Futuready by H2S, Virtual edition" : `You're in: Futuready by H2S, ${x.dateShort}`,
    html: `<div style="max-width:560px;margin:0 auto;font:400 15px/1.6 Arial,sans-serif;color:${INK}">
<p style="margin:0 0 6px;font:800 13px Arial,sans-serif;letter-spacing:3px;color:${BLUE}">FUTUREADY BY H2S</p>
<p style="margin:0 0 14px;font:800 24px/1.25 Arial,sans-serif;color:${INK}">You're in, @name.</p>
<p style="margin:0 0 16px">Your registration for Futuready is confirmed. Here is everything you need:</p>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">${rows}</table>
${cal}
<p style="margin:20px 0 6px;font-weight:800">Bring</p>
<p style="margin:0">${bring}</p>
<p style="margin:20px 0 0">${esc(note)} The page has the full schedule: <a href="@eventUrl" style="color:${BLUE};font-weight:700">@eventUrl</a></p>
<p style="margin:20px 0 0">See you there,<br>Vivek and Team Hack2skill</p>
</div>`,
  };
}

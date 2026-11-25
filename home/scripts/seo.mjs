/*
  Everything search engines and AI assistants read, made at build from the same data as the page (data.js and the
  cities saved by scripts/fetch-events.mjs), so it never drifts from what people see:
    - text()     the story in words, inside the page itself (most AI crawlers never run JavaScript, so without
                 this they would see an empty page). People who use a screen reader get it too: the whole story
                 and every link, in order. It carries the story's own words, nothing extra.
    - jsonLd()   structured data: the site, Hack2skill, the trainer and each upcoming city as an event.
    - robots(), sitemap(), llms()   the files at the site's root.
*/
import { fromLink } from '../src/events-core.js';
import { LEVELS, SITE_URL, SUPPORT, TRAINER, VIRTUAL_URL, VOICES_FULL } from '../src/data.js';

export const SITE = SITE_URL.replace(/\/?$/, '/');
export const NAME = 'Futuready by Hack2skill';
export const TITLE = 'Futuready by Hack2skill · Free AI bootcamp for students';
export const DESCRIPTION =
  'A free, hands-on AI bootcamp for college students across India. Learn spec writing, AI evaluation, system architecture and how to direct AI agents.';
const HACK2SKILL = {
  url: 'https://hack2skill.com/',
  // Hack2skill's own profiles, as linked from hack2skill.com
  sameAs: [
    'https://www.linkedin.com/company/hack2skill/',
    'https://www.instagram.com/hack2skill/',
    'https://twitter.com/hack2skill',
    'https://www.youtube.com/channel/UCw2br80x_dpvJoAsSCC-bGA',
    'https://www.facebook.com/hack2skill/',
  ],
};

// the story's own lines, level by level (scenes.jsx)
const STORY_LEVELS = [
  ['AI does literally what you say.', 'Learn the art of spec writing.'],
  ['If it looks right, is it really right?', 'Evaluate like Anthropic engineers.'],
  ['Anyone can stack blocks.', 'Learn to architect scalable AI systems.'],
  ['Nobody codes alone anymore.', 'Learn to direct a team of AI agents.'],
  ['And the last level', 'is you.'],
];

const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const label = c => (c.status === 'past' ? 'Concluded' : c.status === 'open' ? 'Registrations open' : 'Boarding soon');

// the day of a city's event (YYYY-MM-DD), when its page link carries it (futuready-<city>-<ddmmyyyy>)
function day(c) {
  const f = fromLink(c.url);
  if (!f) return '';
  return new Date(Date.parse(f.end) + 330 * 60000 - 60000).toISOString().slice(0, 10);
}

export function text(cities) {
  const upcoming = cities.filter(c => c.status !== 'past');
  const past = cities.filter(c => c.status === 'past');
  const city = c => {
    const what = [c.campus, c.date, label(c)].filter(Boolean).map(esc).join(', ');
    return `<li>${c.url ? `<a href="${esc(c.url)}">${esc(c.city)}</a>` : esc(c.city)}${what ? `: ${what}` : ''}</li>`;
  };
  return `<article class="about" id="about" aria-label="Futuready, the story in words">
      <h1>Futuready by Hack2skill</h1>
      <p>Are you ready for the future? A campus builder lab by Hack2skill (H2S). Now touring India. Free to attend.</p>
      <p>It’s 2031. AI writes all the code. It finds bugs, and locks them up before lunch. So what’s left for you?</p>
      <p>Futuready is an interactive bootcamp that teaches you exactly that.</p>
      <h2>Five levels: R.E.A.D.Y.</h2>
      <ol>
        ${LEVELS.map((l, i) => `<li><strong>Level ${i + 1} · ${esc(l.name)}.</strong> ${STORY_LEVELS[i].map(esc).join(' ')}</li>`).join('\n        ')}
      </ol>
      <p>On completing Futuready, you get an e-passport.</p>
      <p>Futuready is not a lecture. It is an interactive lab. Students participate in realtime via phones.</p>
      <h2>Meet your trainer</h2>
      <p>${esc(TRAINER.name)}: ${TRAINER.labels.map(esc).join(', ')}. <a href="${esc(TRAINER.linkedin)}">LinkedIn</a> · <a href="${esc(TRAINER.instagram)}">Instagram</a></p>
      <h2>What Futuready attendees say</h2>
      ${VOICES_FULL.map(v => `<blockquote><p>${esc(v.quote)}</p><footer>${esc(v.name)}, ${esc(v.role)}</footer></blockquote>`).join('\n      ')}
      <h2>Attend in</h2>
      <ul>
        ${upcoming.map(city).join('\n        ')}
      </ul>
      ${past.length ? `<h3>Concluded in</h3>\n      <ul>\n        ${past.map(city).join('\n        ')}\n      </ul>` : ''}
      <h2>Didn’t find your city?</h2>
      <p><a href="${esc(VIRTUAL_URL)}">Attend Futuready Virtual</a>, or bring Futuready to your campus: write to <a href="mailto:${esc(SUPPORT)}">${esc(SUPPORT)}</a>.</p>
    </article>`;
}

export function jsonLd(cities) {
  const org = `${SITE}#hack2skill`;
  const trainer = `${SITE}#trainer`;
  const events = cities
    .filter(c => c.status !== 'past' && c.url && day(c))
    .map(c => ({
      '@type': 'EducationEvent',
      name: `Futuready ${c.city}${c.campus ? ` at ${c.campus}` : ''}`,
      description: `Futuready comes to ${c.campus ? `${c.campus}, ` : ''}${c.city}. ${DESCRIPTION}`,
      url: c.url,
      startDate: day(c),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: c.campus || c.city,
        address: { '@type': 'PostalAddress', addressLocality: c.city, addressCountry: 'IN' },
      },
      image: `${SITE}og.jpg`,
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR', availability: 'https://schema.org/InStock', url: c.url },
      organizer: { '@id': org },
      performer: { '@id': trainer },
    }));
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${SITE}#website`,
      url: SITE,
      name: NAME,
      alternateName: ['Futuready', 'futuready.hack2skill.com'],
      description: DESCRIPTION,
      inLanguage: 'en-IN',
      publisher: { '@id': org },
    },
    {
      '@type': 'Organization',
      '@id': org,
      name: 'Hack2skill',
      url: HACK2SKILL.url,
      logo: { '@type': 'ImageObject', url: `${SITE}h2s-logo.png`, width: 319, height: 120 },
      email: SUPPORT,
      sameAs: HACK2SKILL.sameAs,
    },
    {
      '@type': 'Person',
      '@id': trainer,
      name: TRAINER.name,
      jobTitle: 'Developer Relations',
      worksFor: { '@id': org },
      sameAs: [TRAINER.linkedin, TRAINER.instagram],
    },
    ...events,
  ];
  // "<" escaped so nothing in the data can close the script tag
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`;
}

export const robots = () => `# Futuready: open to every search engine and AI assistant.
User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE}sitemap.xml
`;

// lastmod: the day the site's content last changed (its last commit), or none when that is unknown
export const sitemap = lastmod => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
  </url>
</urlset>
`;

export function llms(cities) {
  const upcoming = cities.filter(c => c.status !== 'past');
  const line = c => `- ${c.url ? `[${c.city}](${c.url})` : c.city}: ${[c.campus, c.date, label(c).toLowerCase()].filter(Boolean).join(', ')}`;
  return `# ${NAME}

> Futuready is a free, interactive AI bootcamp for college students in India, run on campuses by Hack2skill. Five levels spell R.E.A.D.Y.: Requirements (spec writing), Evaluate (checking AI work like Anthropic engineers), Architect (scalable AI systems), Direct (leading a team of AI agents) and You. Everyone who completes it gets an e-passport.

Futuready is not a lecture: it is an interactive lab where students take part in real time on their phones. The trainer is ${TRAINER.name} (developer relations, Hack2skill). Each city has its own free registration page on hack2skill.com.

## Attend

${upcoming.map(line).join('\n')}
- [Futuready Virtual](${VIRTUAL_URL}): online, from anywhere

## More

- [Futuready](${SITE}): the story, the five levels and every city
- [Hack2skill](${HACK2SKILL.url}): the organiser
- Bring Futuready to your campus: ${SUPPORT}
`;
}

// The other Futuready cities, as cards (see index.html). Freshest source first:
// 1. Hack2skill's event list, live (works when this page is served from hack2skill.com itself);
// 2. cities.json, saved when the site was built (scripts/fetch-events.mjs);
// 3. the CITIES list in src/data.js.
import { fromHack2skill, mergeCities, normalise } from '../src/events-core.js';
import { CITIES, CITIES_FEED, VIRTUAL_URL } from '../src/data.js';

const not = new URLSearchParams(location.search).get('not') || '';
const esc = t => String(t || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

async function cities() {
  try {
    const r = await fetch(CITIES_FEED, { cache: 'no-cache', signal: AbortSignal.timeout?.(5000) });
    if (r.ok) {
      const list = fromHack2skill(await r.json());
      if (list.length) return mergeCities(list, CITIES);
    }
  } catch {
    /* not on hack2skill.com: next source */
  }
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}cities.json`, { cache: 'no-cache' });
    if (r.ok) return (await r.json()).cities || [];
  } catch {
    /* next source */
  }
  return normalise(CITIES);
}

const card = (c, cls, label) =>
  `<a class="card ${cls}" href="${esc(c.url)}" target="_top"><span class="pill">${label}</span><span class="city">${esc(c.city)}</span><span class="campus">${esc(c.campus)}</span><span class="date">${esc(c.date)}</span><span class="go">${cls === 'past' || cls === 'soon' ? 'See the page →' : 'Register free →'}</span></a>`;

const list = (await cities()).filter(c => c.status !== 'past' && c.url && !(not && c.url.includes(not)));
let html = list.map(c => card(c, c.status, c.status === 'open' ? 'Registrations open' : 'Coming soon')).join('');
if (VIRTUAL_URL && !(not && VIRTUAL_URL.includes(not))) html += card({ url: VIRTUAL_URL, city: 'Virtual', campus: 'Online, from anywhere', date: 'Every few weeks' }, 'virtual', 'Live online');
document.getElementById('row').innerHTML = html;

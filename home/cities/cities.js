// The other Futuready cities, as cards (see index.html). Shown at once from the list saved at build, then
// refreshed from /api/cities (cached by Vercel, so every Hack2skill page showing this strip costs almost nothing).
import { fromFeed, normalise } from '../src/events-core.js';
import { CITIES, VIRTUAL_URL } from '../src/data.js';

const BAKED = Object.values(import.meta.glob('../src/cities.baked.json', { eager: true, import: 'default' }))[0];
const not = new URLSearchParams(location.search).get('not') || '';
const esc = t => String(t || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const card = (c, cls, label) =>
  `<a class="card ${cls}" href="${esc(c.url)}" target="_top"><span class="pill">${label}</span><span class="city">${esc(c.city)}</span><span class="campus">${esc(c.campus)}</span><span class="date">${esc(c.date)}</span><span class="go">${cls === 'past' || cls === 'soon' ? 'See the page →' : 'Register free →'}</span></a>`;

function draw(all) {
  const list = all.filter(c => c.status !== 'past' && c.url && !(not && c.url.includes(not)));
  let html = list.map(c => card(c, c.status, c.status === 'open' ? 'Registrations open' : 'Coming soon')).join('');
  if (VIRTUAL_URL && !(not && VIRTUAL_URL.includes(not))) html += card({ url: VIRTUAL_URL, city: 'Virtual', campus: 'Online, from anywhere', date: 'Every few weeks' }, 'virtual', 'Live online');
  document.getElementById('row').innerHTML = html;
}

draw(BAKED ? fromFeed(BAKED) : normalise(CITIES));
fetch(`${import.meta.env.BASE_URL}api/cities`)
  .then(r => (r.ok ? r.json() : null))
  .then(json => {
    const list = json && fromFeed(json);
    if (list?.length) draw(list);
  })
  .catch(() => {
    /* the saved list stays */
  });

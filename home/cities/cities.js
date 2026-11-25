// The other Futuready cities, as cards (see index.html). Shown at once from the list saved at build (written into
// the page as window.__CITIES), then refreshed from /api/cities (cached by Vercel, so every Hack2skill page showing
// this strip costs almost nothing). Self-contained on purpose: it shares no file with the main page.
const not = new URLSearchParams(location.search).get('not') || '';
const esc = t => String(t || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// a city whose day has passed is concluded, whenever the list was saved
const live = c => (c.end && Date.now() > Date.parse(c.end) ? 'past' : c.status);

const card = (c, cls, label) =>
  `<a class="card ${cls}" href="${esc(c.url)}" target="_top"><span class="pill">${label}</span><span class="city">${esc(c.city)}</span><span class="campus">${esc(c.campus)}</span><span class="date">${esc(c.date)}</span><span class="go">${cls === 'past' || cls === 'soon' ? 'See the page →' : 'Register free →'}</span></a>`;

function draw({ cities = [], virtual = '' } = {}) {
  const list = cities.map(c => ({ ...c, status: live(c) })).filter(c => c.status !== 'past' && c.url && !(not && c.url.includes(not)));
  let html = list.map(c => card(c, c.status, c.status === 'open' ? 'Registrations open' : 'Coming soon')).join('');
  if (virtual && !(not && virtual.includes(not))) html += card({ url: virtual, city: 'Virtual', campus: 'Online, from anywhere', date: 'Every few weeks' }, 'virtual', 'Live online');
  document.getElementById('row').innerHTML = html;
}

draw(window.__CITIES);
fetch(`${import.meta.env.BASE_URL}api/cities`)
  .then(r => (r.ok ? r.json() : null))
  .then(json => json?.cities?.length && draw(json))
  .catch(() => {
    /* the saved list stays */
  });

/*
  Turns a list of Futuready page links (or Hack2skill's event list) into the cities on the train.
  Plain functions, shared by the page (src/events.js) and the build script (scripts/fetch-events.mjs).

  Hack2skill's list:  GET https://hack2skill.com/api/v1/innovator/public/event/list?page=1&records=100
  -> { data: { flagshipEvents: [...], communityEvents: [...] } }, each event with
     title, eventUrl (slug), customEventUrl, registrationStart, registrationEnd, tags.mode.value.
*/

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const shortDate = iso => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // dates are shown in India time
  const ist = new Date(d.getTime() + 330 * 60000);
  return `${ist.getUTCDate()} ${MONTHS[ist.getUTCMonth()]} ${ist.getUTCFullYear()}`;
};

// "Futuready Builders Lab: Pune" / "Futuready · Pune" / "Futuready Pune 2026" -> "Pune"
export function cityFromTitle(title, match = 'futuready') {
  const parts = String(title).split(/\s*[:|·–—]\s*|\s+-\s+|\s+@\s+|\s+in\s+/i).filter(Boolean);
  let city = parts.length > 1 ? parts[parts.length - 1] : String(title);
  city = city
    .replace(new RegExp(match, 'ig'), '')
    .replace(/builders?\s*lab|bootcamp|episode\s*\d+|\b20\d\d\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return city || String(title).trim();
}

// past: it happened.  open: registrations are open now.  soon: announced, not open yet.
export function statusOf({ start, end, status }, now = Date.now()) {
  if (status) return status;
  const s = start ? Date.parse(start) : NaN;
  const e = end ? Date.parse(end) : NaN;
  if (!Number.isNaN(e) && now > e) return 'past';
  if (!Number.isNaN(s) && now < s) return 'soon';
  if (!Number.isNaN(e) || !Number.isNaN(s)) return 'open';
  return 'soon';
}

const ORDER = { past: 0, open: 1, soon: 2 };
const when = c => Date.parse(c.end || c.start || '') || Infinity;

export function sortCities(list) {
  return [...list].sort((a, b) => ORDER[a.status] - ORDER[b.status] || when(a) - when(b));
}

// A Futuready page link -> its city and date: hack2skill.com/futuready/pune26102026 -> Pune, 26 Oct 2026.
// Two-word cities use a hyphen: /futuready/navi-mumbai05012027.
export function fromLink(link) {
  const m = /\/futuready\/([a-z][a-z-]*?)-?(\d{2})(\d{2})(\d{4})\/?(?:[?#].*)?$/i.exec(String(link || ''));
  if (!m) return null;
  const [dd, mm, yyyy] = [m[2], m[3], m[4]].map(Number);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const city = m[1]
    .split('-')
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  // the day ends at midnight in India
  return { city, date: `${dd} ${MONTHS[mm - 1]} ${yyyy}`, end: new Date(Date.UTC(yyyy, mm - 1, dd, 18, 30)).toISOString() };
}

// Any list of links, or { link?, city?, campus?, date?, start?, end?, status? } -> clean, sorted cities.
export function normalise(list, now = Date.now()) {
  if (!Array.isArray(list)) return [];
  const out = list
    .map(c => (typeof c === 'string' ? { link: c } : c))
    .map(c => {
      if (!c) return null;
      const link = c.link || c.url || '';
      const fromUrl = fromLink(link) || {};
      const city = c.city || fromUrl.city;
      if (!city) return null;
      const end = c.end || fromUrl.end || '';
      // a city with its own page is open until its day has passed; a name alone is "boarding soon"
      const status = c.status || (end ? statusOf({ start: c.start, end }, now) : link ? 'open' : 'soon');
      return {
        city: String(city).trim(),
        campus: c.campus ? String(c.campus).trim() : '',
        date: c.date || fromUrl.date || shortDate(status === 'soon' ? c.start : end || c.start),
        start: c.start || '',
        end,
        status,
        url: link,
      };
    })
    .filter(Boolean);
  return sortCities(out);
}

// Hack2skill's event list -> cities. `match` picks the Futuready events (title or slug).
export function fromHack2skill(json, match = 'futuready', now = Date.now()) {
  const data = json?.data || {};
  const all = [...(data.flagshipEvents || []), ...(data.communityEvents || [])];
  const re = new RegExp(match, 'i');
  const picked = all.filter(ev => re.test(`${ev.title || ''} ${ev.eventUrl || ''}`));
  return normalise(
    picked.map(ev => ({
      city: cityFromTitle(ev.title, match),
      start: ev.registrationStart,
      end: ev.registrationEnd,
      // the same link rule as hack2skill.com's own event cards
      url: (ev.customEventUrl || '').trim() || (ev.eventUrl ? `https://hack2skill.com/event/${ev.eventUrl.trim()}` : '#'),
    })),
    now
  );
}

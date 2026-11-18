/*
  Turns Hack2skill's public event list into the cities on the train.
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

// Any list of { city, campus?, date?, start?, end?, status?, url } -> clean, sorted cities.
export function normalise(list, now = Date.now()) {
  if (!Array.isArray(list)) return [];
  const out = list
    .filter(c => c && c.city)
    .map(c => {
      const status = statusOf(c, now);
      return {
        city: String(c.city).trim(),
        campus: c.campus ? String(c.campus).trim() : '',
        date: c.date || shortDate(status === 'soon' ? c.start : c.end || c.start),
        start: c.start || '',
        end: c.end || '',
        status,
        url: c.url || '#',
      };
    });
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

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
  // "Parul University, Vadodara" -> "Vadodara"
  if (city.includes(',')) city = city.split(',').pop();
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

// the train: open cities first (soonest first), then the ones boarding soon, then the concluded ones (latest first)
const ORDER = { open: 0, soon: 1, past: 2 };
const when = c => Date.parse(c.end || c.start || '') || Infinity;

export function sortCities(list) {
  return [...list].sort((a, b) => ORDER[a.status] - ORDER[b.status] || (a.status === 'past' ? when(b) - when(a) : when(a) - when(b)));
}

// A Futuready page link -> its city and date. Both kinds of link work:
//   hack2skill.com/event/futuready-vadodara-07122026  (a Hack2skill initiative page) -> Vadodara, 7 Dec 2026
//   hack2skill.com/futuready/pune26102026                                            -> Pune, 26 Oct 2026
// Two-word cities use a hyphen: /event/futuready-navi-mumbai-05012027.
export function fromLink(link) {
  const m = /\/(?:event\/futuready-|futuready\/)([a-z][a-z-]*?)-?(\d{2})(\d{2})(\d{4})\/?(?:[?#].*)?$/i.exec(String(link || ''));
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

// '26 Oct 2026' or '2026-10-26' -> the end of that day in India (ISO), or '' if it is not a date like that
export function endOfDay(date) {
  const t = String(date || '').trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 18, 30)).toISOString();
  m = /^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?,?\s+(\d{4})$/.exec(t);
  const mon = m ? MONTHS.findIndex(x => x.toLowerCase() === m[2].toLowerCase()) : -1;
  return mon < 0 ? '' : new Date(Date.UTC(+m[3], mon, +m[1], 18, 30)).toISOString();
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
      const end = c.end || fromUrl.end || endOfDay(c.date) || '';
      // worked out now, in the visitor's browser, from the dates: a city turns "Concluded" by itself the day after
      // its event, even if the list was saved days ago. A city with a page and no dates is open; a name alone is soon.
      const status = end || c.start ? statusOf({ start: c.start, end }, now) : c.status || (link ? 'open' : 'soon');
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
// A page named futuready-<city>-<ddmmyyyy> gives its city and day from the link; the campus comes from the title
// ("Futuready by H2S · Parul University, Vadodara" -> "Parul University"). The Virtual edition is left out.
export function fromHack2skill(json, match = 'futuready', now = Date.now()) {
  const data = json?.data || {};
  const all = [...(data.flagshipEvents || []), ...(data.communityEvents || [])];
  const re = new RegExp(match, 'i');
  const picked = all.filter(ev => {
    const text = `${ev.title || ''} ${ev.eventUrl || ''}`;
    return re.test(text) && !/virtual/i.test(text);
  });
  return normalise(
    picked.map(ev => {
      // the same link rule as hack2skill.com's own event cards
      const url = (ev.customEventUrl || '').trim() || (ev.eventUrl ? `https://hack2skill.com/event/${ev.eventUrl.trim()}` : '#');
      const slug = fromLink(url);
      const place = String(ev.title || '').split(/\s*[·|:–—]\s*/).pop() || '';
      const campus = place.includes(',') ? place.slice(0, place.lastIndexOf(',')).trim() : '';
      return slug
        ? { city: slug.city, campus, url }
        : { city: cityFromTitle(ev.title, match), campus, start: ev.registrationStart, end: ev.registrationEnd, url };
    }),
    now
  );
}

// The feed's cities first, then any city only in the hand-made list (Pune, "boarding soon" names).
export function mergeCities(feed, manual, now = Date.now()) {
  // the same city twice (the list in data.js and the Google Sheet) shows once
  const once = new Set();
  const mine = normalise(manual, now).filter(c => {
    const k = (c.url || c.city).toLowerCase();
    return once.has(k) ? false : once.add(k);
  });
  // a name alone ("boarding soon") steps aside for the same city with a page
  const paged = new Set(mine.filter(c => c.url).map(c => c.city.toLowerCase()));
  const mineClean = mine.filter(c => c.url || !paged.has(c.city.toLowerCase()));
  const key = c => (c.url || c.city).toLowerCase();
  const seen = new Set(feed.map(key));
  const cities = new Set(feed.map(c => c.city.toLowerCase()));
  return sortCities([...feed, ...mineClean.filter(c => !seen.has(key(c)) && !(c.status === 'soon' && !c.url && cities.has(c.city.toLowerCase())))]);
}

// any feed -> cities: a plain list (links or { city, link, ... }), { cities: [...] } (our own /api/cities), or
// Hack2skill's event list. Statuses are worked out again here, so a saved list still turns "Concluded" on time.
export const fromFeed = (json, now = Date.now()) =>
  Array.isArray(json) ? normalise(json, now) : Array.isArray(json?.cities) ? normalise(json.cities, now) : fromHack2skill(json, 'futuready', now);

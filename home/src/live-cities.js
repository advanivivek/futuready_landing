/*
  Every Futuready city, from every source, gathered on the server (never in a visitor's browser):
    1. Hack2skill's public event list (CITIES_FEED): any published Futuready event;
    2. the Google Sheet's "Cities" tab: the ticked "boarding soon" cities, once the sheet is connected;
    3. the CITIES list in data.js.
  Used by api/cities.js (the live list, cached by Vercel for 10 minutes) and by scripts/fetch-events.mjs (the
  copy saved into every build). A source that is slow or down is skipped, so this always answers.

  The sheet's link: BRING_FORM_URL in Vercel's Environment Variables, or BRING_FORM_URL in data.js.
*/
import { BRING_FORM_URL, CITIES, CITIES_FEED, VIRTUAL_URL } from './data.js';
import { fromFeed, mergeCities } from './events-core.js';

// a row of the sheet's "Cities" tab: a name ("boarding soon"), or a name, campus and page link (a real stop)
const fromSheet = x =>
  typeof x === 'string'
    ? { city: x.trim() }
    : { city: String(x?.city || '').trim(), campus: String(x?.campus || '').trim(), link: /^https:\/\//.test(x?.link || '') ? x.link : '' };

export const sheetUrl = () => String(globalThis.process?.env?.BRING_FORM_URL || BRING_FORM_URL || '').trim();

async function getJSON(url, ms) {
  const res = await fetch(url, { headers: { accept: 'application/json' }, redirect: 'follow', signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  return res.json();
}

export async function allCities(now = Date.now()) {
  const notes = [];
  const feed = CITIES_FEED
    ? getJSON(CITIES_FEED, 8000)
        .then(j => fromFeed(j, now))
        .catch(e => (notes.push(`Hack2skill list: ${e.message}`), null))
    : null;
  const form = sheetUrl();
  const sheet = form
    ? getJSON(form, 8000)
        .then(j => (Array.isArray(j.cities) ? j.cities.map(fromSheet).filter(c => c.city || c.link) : null))
        .catch(e => (notes.push(`Google Sheet: ${e.message}`), null))
    : null;
  const [fromH2S, ticked] = await Promise.all([feed, sheet]);
  // with the sheet connected, its ticked cities replace the names-only entries in data.js (cities with links stay)
  const manual = ticked ? [...CITIES.filter(c => c.link), ...ticked] : CITIES;
  return {
    cities: mergeCities(fromH2S || [], manual, now),
    virtual: VIRTUAL_URL,
    from: { hack2skill: fromH2S ? fromH2S.length : null, sheet: ticked ? ticked.length : form ? null : 'not connected' },
    notes,
  };
}

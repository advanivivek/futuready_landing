import { useEffect, useState } from 'react';
import { fromHack2skill, mergeCities, normalise } from './events-core';
import { BRING_FORM_URL, CITIES, CITIES_FEED } from './data';

const getJSON = async url => {
  const res = await fetch(url, { cache: 'no-cache', signal: AbortSignal.timeout?.(6000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
};

// a feed may be a plain list (links or { city, link, ... }) or Hack2skill's event list
export const fromFeed = json => (Array.isArray(json) ? normalise(json) : Array.isArray(json?.cities) ? normalise(json.cities) : fromHack2skill(json));

/*
  The cities on the train, freshest first:
  1. CITIES_FEED itself, live, where that server allows it (on hack2skill.com itself);
  2. events.json, saved from CITIES_FEED when the site was built (works on any host);
  3. the list in data.js.
  The page draws straight away with (3) and swaps in fresher data when it arrives.
*/
export function useCities() {
  const [cities, setCities] = useState(() => normalise(CITIES));
  useEffect(() => {
    let alive = true;
    // the cities boarding soon: the ticked ones in the Google Sheet (its "Cities" tab), once it is connected;
    // until then, the names in CITIES
    const sheet = BRING_FORM_URL
      ? getJSON(BRING_FORM_URL).then(j => (Array.isArray(j.cities) ? j.cities.map(city => ({ city })) : null)).catch(() => null)
      : Promise.resolve(null);
    const manual = sheet.then(list => (list ? [...CITIES.filter(c => c.link), ...list] : CITIES));
    manual.then(m => alive && m !== CITIES && setCities(prev => mergeCities(prev.filter(c => c.url), m)));
    if (!CITIES_FEED) return () => (alive = false);
    // live first: on hack2skill.com the list is readable straight away (anywhere else it fails at once and the copy
    // saved at build is used)
    const sources = [() => getJSON(CITIES_FEED), () => getJSON(`${import.meta.env.BASE_URL}events.json`)];
    (async () => {
      for (const load of sources) {
        try {
          const list = fromFeed(await load());
          if (alive && list.length) {
            setCities(mergeCities(list, await manual));
            return;
          }
        } catch {
          /* try the next source */
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  return cities;
}

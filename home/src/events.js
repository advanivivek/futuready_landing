import { useEffect, useState } from 'react';
import { fromHack2skill, normalise } from './events-core';
import { CITIES, CITIES_FEED } from './data';

const getJSON = async url => {
  const res = await fetch(url, { cache: 'no-cache', signal: AbortSignal.timeout?.(6000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
};

// a feed may be a plain list (links or { city, link, ... }) or Hack2skill's event list
export const fromFeed = json => (Array.isArray(json) ? normalise(json) : Array.isArray(json?.cities) ? normalise(json.cities) : fromHack2skill(json));

/*
  The cities on the train, freshest first:
  1. events.json, saved from CITIES_FEED when the site was built (works on any host);
  2. CITIES_FEED itself, live, if that server allows it (CORS);
  3. the list in data.js.
  The page draws straight away with (3) and swaps in fresher data when it arrives.
*/
export function useCities() {
  const [cities, setCities] = useState(() => normalise(CITIES));
  useEffect(() => {
    if (!CITIES_FEED) return;
    let alive = true;
    const sources = [() => getJSON(`${import.meta.env.BASE_URL}events.json`), () => getJSON(CITIES_FEED)];
    (async () => {
      for (const load of sources) {
        try {
          const list = fromFeed(await load());
          if (alive && list.length) {
            setCities(list);
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

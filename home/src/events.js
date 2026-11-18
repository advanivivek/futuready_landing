import { useEffect, useState } from 'react';
import { fromHack2skill, normalise } from './events-core';
import { CITIES, EVENTS } from './data';

const getJSON = async url => {
  const res = await fetch(url, { cache: 'no-cache', signal: AbortSignal.timeout?.(6000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
};

/*
  The cities on the train, newest information first:
  1. live from Hack2skill's event list, when this page is served from hack2skill.com (same origin);
  2. events.json, written at build time by `npm run events` (works on any host);
  3. the list in data.js.
  The page draws straight away with (3) and swaps in fresher data when it arrives.
*/
export function useCities() {
  const [cities, setCities] = useState(() => normalise(CITIES));
  useEffect(() => {
    let alive = true;
    const sources = [];
    if (location.hostname === 'hack2skill.com' || location.hostname.endsWith('.hack2skill.com')) {
      sources.push(async () => fromHack2skill(await getJSON(EVENTS.hack2skillApi), EVENTS.match));
    }
    if (EVENTS.file) sources.push(async () => normalise(await getJSON(EVENTS.file)));
    (async () => {
      for (const load of sources) {
        try {
          const list = await load();
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

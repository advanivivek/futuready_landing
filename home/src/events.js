import { useEffect, useState } from 'react';
import { fromFeed, normalise } from './events-core';
import { CITIES } from './data';

// the list saved into this build (scripts/fetch-events.mjs); missing only in a fresh copy that never built
const BAKED = Object.values(import.meta.glob('./cities.baked.json', { eager: true, import: 'default' }))[0];

/*
  The cities on the train. The page draws straight away with the list saved at build, then, once the visitor
  heads for the train (want), asks /api/cities (one small, cached request) for the current one: new pages on
  Hack2skill and cities ticked in the Google Sheet appear within about 10 minutes, without a rebuild. Statuses are
  worked out in the visitor's browser from the dates, so a city turns "Concluded" by itself the day after its event.
*/
export function useCities(want = true) {
  const [cities, setCities] = useState(() => (BAKED ? fromFeed(BAKED) : normalise(CITIES)));
  useEffect(() => {
    if (!want) return;
    let alive = true;
    fetch(`${import.meta.env.BASE_URL}api/cities`, { signal: AbortSignal.timeout?.(8000) })
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        const list = json && fromFeed(json);
        if (alive && list?.length) setCities(list);
      })
      .catch(() => {
        /* offline or not deployed: the saved list stays */
      });
    return () => {
      alive = false;
    };
  }, [want]);
  return cities;
}

// Saves the Futuready cities from CITIES_FEED (src/data.js) into public/events.json, so the train is fresh
// on any host. Runs before every build (npm run build) and on its own with: npm run events
// With no feed set, it does nothing and the page uses the CITIES list in src/data.js.
import { rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { CITIES_FEED } from '../src/data.js';
import { fromHack2skill, normalise } from '../src/events-core.js';

const out = fileURLToPath(new URL('../public/events.json', import.meta.url));
if (!CITIES_FEED) {
  await rm(out, { force: true });
  console.log('events: no CITIES_FEED set, using the CITIES list in src/data.js');
} else {
  try {
    const res = await fetch(CITIES_FEED, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`the feed answered ${res.status}`);
    const json = await res.json();
    const cities = Array.isArray(json) ? normalise(json) : Array.isArray(json?.cities) ? normalise(json.cities) : fromHack2skill(json);
    if (!cities.length) console.log('events: the feed has no cities yet, using the CITIES list in src/data.js');
    else {
      await writeFile(out, JSON.stringify(cities, null, 2) + '\n');
      console.log(`events: ${cities.length} cities -> public/events.json`);
      cities.forEach(c => console.log(`  ${c.status.padEnd(4)} ${c.city.padEnd(14)} ${c.date}  ${c.url}`));
    }
  } catch (e) {
    console.log(`events: could not read the feed (${e.message}), using what we have`);
  }
}

// Saves the Futuready cities from Hack2skill's public event list into public/events.json.
// Runs before every build (npm run build) and on its own with: npm run events
// If Hack2skill lists no Futuready events yet, it leaves events.json alone and the page uses src/data.js.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fromHack2skill } from '../src/events-core.js';
import { EVENTS } from '../src/data.js';

const out = fileURLToPath(new URL('../public/events.json', import.meta.url));
try {
  const res = await fetch(EVENTS.hack2skillApi, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Hack2skill answered ${res.status}`);
  const cities = fromHack2skill(await res.json(), EVENTS.match);
  if (!cities.length) {
    console.log(`events: no "${EVENTS.match}" events on Hack2skill yet, keeping the list in src/data.js`);
  } else {
    await writeFile(out, JSON.stringify(cities, null, 2) + '\n');
    console.log(`events: ${cities.length} cities -> public/events.json`);
    cities.forEach(c => console.log(`  ${c.status.padEnd(4)} ${c.city.padEnd(14)} ${c.date}  ${c.url}`));
  }
} catch (e) {
  console.log(`events: could not reach Hack2skill (${e.message}), keeping what we have`);
}

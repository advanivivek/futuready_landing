// Saves every Futuready city (src/live-cities.js: Hack2skill's list, the Google Sheet, data.js) into
// src/cities.baked.json, so each build starts with a fresh list: the train draws it at once, and the text version
// of the page and its search-engine data (vite.config.js) list the same cities. The live list (/api/cities)
// then keeps the page current between builds. Runs before every build (npm run build), or alone: npm run events
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { allCities } from '../src/live-cities.js';

const out = fileURLToPath(new URL('../src/cities.baked.json', import.meta.url));
const { cities, virtual, from, notes } = await allCities();
await writeFile(out, JSON.stringify({ cities, virtual }, null, 2) + '\n');
console.log(`cities: ${cities.length} saved (Hack2skill list: ${from.hack2skill ?? 'unreachable'}, Google Sheet: ${from.sheet ?? 'unreachable'})`);
notes.forEach(n => console.log(`  skipped ${n}`));
cities.forEach(c => console.log(`  ${c.status.padEnd(4)} ${c.city.padEnd(14)} ${(c.date || '').padEnd(12)} ${c.url}`));

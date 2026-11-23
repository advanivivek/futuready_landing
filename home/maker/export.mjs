// Saves a preset's pictures from the page maker without clicking: node home/maker/export.mjs <preset> <folder> [logo files…]
// Needs the dev server (npm --prefix home run dev) and Playwright (PLAYWRIGHT = path to playwright-core's index.mjs).
import { writeFile, mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright-core');
const [, , preset = 'vadodara', out = '.', ...logos] = process.argv;
await mkdir(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
await p.addInitScript(k => localStorage.setItem('fr-maker-current', JSON.stringify(k)), preset);
await p.goto('http://localhost:5188/maker/');
await p.waitForTimeout(1500);
if (logos.length) { await p.setInputFiles('#logos', logos); await p.waitForTimeout(1200); }
for (const [id, name, type] of [['cWide', 'cover-wide', 'jpeg'], ['cSquare', 'cover-square', 'jpeg'], ['cThumb', 'thumbnail', 'png'], ['cStrip', 'partner-logos', 'png']]) {
  if (name === 'partner-logos' && !logos.length) continue;
  const url = await p.$eval('#' + id, (c, t) => c.toDataURL('image/' + t, 0.9), type);
  await writeFile(`${out}/${preset}-${name}.${type === 'png' ? 'png' : 'jpg'}`, Buffer.from(url.split(',')[1], 'base64'));
  console.log('saved', `${out}/${preset}-${name}`);
}
await b.close();

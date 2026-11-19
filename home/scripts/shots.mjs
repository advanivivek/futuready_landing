// Walks the story and screenshots chosen moments of every scene.
//   node scripts/shots.mjs [--webkit] [--desktop] [--only=id,id] [--mid] [--over]     (dev server on :5188)
//   --mid: also halfway through each scene's arrival (the transitions). --over: past the end (FUTUREADY).
import { mkdirSync } from 'node:fs';
const PW = process.env.PW || '/Users/wewake/AI/TEACHING/UDAIPUR AI (POWERPACK)/stoa/node_modules/playwright-core/index.mjs';
const { chromium, webkit, devices } = await import(PW);
const OUT = process.env.OUT || 'shots';
mkdirSync(OUT, { recursive: true });
const desk = process.argv.includes('--desktop');
const engine = process.argv.includes('--webkit') ? webkit : chromium;
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const opts = desk ? { viewport: { width: 1440, height: 900 } } : { ...devices['iPhone 13'] };
delete opts.defaultBrowserType;
const browser = await engine.launch();
const page = await (await browser.newContext({ ...opts, reducedMotion: 'no-preference' })).newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => m.type() === 'error' && errs.push(m.text()));
await page.goto(process.env.URL || 'http://localhost:5188/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
// hold still where we scroll to (the page normally finishes half-done changes of scene)
await page.evaluate(() => (window.__still = true));
const story = await page.evaluate(() => window.__story);
const tag = (desk ? 'd' : 'm') + (engine === webkit ? 'w' : '');
const mid = process.argv.includes('--mid');
const go = async y => {
  await page.evaluate(y => (window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y)), Math.round(y));
  await page.waitForTimeout(700);
};
const at = (id, s) => page.evaluate(([id, s]) => window.__story.y(id, s), [id, s]);
let n = 0;
const shot = async name => page.screenshot({ path: `${OUT}/${tag}-${String(n++).padStart(2, '0')}-${name}.png` });
for (let i = 0; i < story.ids.length; i++) {
  const id = story.ids[i];
  if (only.length && !only.includes(id)) continue;
  if (mid && i > 0) {
    await go(await page.evaluate(id => window.__story.mid(id), id));
    await shot(`${id}-arriving`);
  }
  const rest = story.rests[i] ?? Math.min(1.2, story.lens[i] - 0.2);
  for (const s of [0.5, rest + 0.1]) {
    await go(await at(id, s));
    await shot(`${id}-${s.toFixed(2)}`);
  }
}
if (process.argv.includes('--over')) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(120);
  await shot('beyond');
}
console.log(JSON.stringify({ tag, shots: n, errs: errs.slice(0, 8) }));
await browser.close();

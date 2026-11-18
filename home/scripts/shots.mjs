// Walks the story and screenshots chosen moments of every scene.
//   node scripts/shots.mjs [--webkit] [--desktop] [--only=id,id]      (dev server on :5188)
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
const story = await page.evaluate(() => window.__story);
const tag = (desk ? 'd' : 'm') + (engine === webkit ? 'w' : '');
const go = async u => {
  await page.evaluate(y => (window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y)), Math.round(u * story.unit));
  await page.waitForTimeout(700);
};
let n = 0;
for (let i = 0; i < story.ids.length; i++) {
  const id = story.ids[i];
  if (only.length && !only.includes(id)) continue;
  const len = story.lens[i];
  for (const s of [0.45, 1.05, Math.min(1.6, len - 0.75), len - 0.35]) {
    await go(story.starts[i] + s);
    await page.screenshot({ path: `${OUT}/${tag}-${String(n++).padStart(2, '0')}-${id}-${s.toFixed(2)}.png` });
  }
}
console.log(JSON.stringify({ tag, shots: n, errs: errs.slice(0, 8) }));
await browser.close();

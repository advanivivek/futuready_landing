// Walks the whole experience on a phone (or desktop) and screenshots each moment.
//   node scripts/shots.mjs [--webkit] [--desktop]      (dev server on :5188)
import { mkdirSync } from 'node:fs';
const PW = process.env.PW || '/Users/wewake/AI/TEACHING/UDAIPUR AI (POWERPACK)/stoa/node_modules/playwright-core/index.mjs';
const { chromium, webkit, devices } = await import(PW);
const OUT = process.env.OUT || 'shots';
mkdirSync(OUT, { recursive: true });
const desk = process.argv.includes('--desktop');
const engine = process.argv.includes('--webkit') ? webkit : chromium;
const opts = desk ? { viewport: { width: 1440, height: 900 } } : { ...devices['iPhone 13'] };
delete opts.defaultBrowserType;
const browser = await engine.launch({ args: engine === chromium ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : [] });
const page = await (await browser.newContext(opts)).newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => m.type() === 'error' && errs.push(m.text()));
await page.goto(process.env.URL || 'http://localhost:5188/', { waitUntil: 'domcontentloaded' });
const tag = (desk ? 'd' : 'm') + (engine === webkit ? 'w' : '');
const shot = async (name, wait = 900) => { await page.waitForTimeout(wait); await page.screenshot({ path: `${OUT}/${tag}-${name}.png` }); };
// scroll to a fraction of a pinned chapter, or an offset in viewports from a section top
const to = async (sel, f = 0, pinned = false) => {
  await page.evaluate(([s, f, pinned]) => {
    const el = document.querySelector(s);
    const top = el.getBoundingClientRect().top + scrollY;
    const y = pinned ? top + f * (el.offsetHeight - innerHeight) : top + f * innerHeight;
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
  }, [sel, f, pinned]);
};
await shot('00-loader', 700);
await shot('01-hero', 2600);
for (const [f, n] of [[0.4, 'b'], [0.8, 'c']]) { await to('.hero', f, true); await shot('01-hero-' + n, 700); }
for (const [f, n] of [[0.02, 'a'], [0.35, 'b'], [0.62, 'c'], [0.86, 'd'], [0.99, 'e']]) { await to('.travel', f, true); await shot('02-travel-' + n, 1100); }
await to('.lab', 0); await shot('03-lab', 1500);
await to('.lab', 0.5); await shot('03-lab-b', 1200);
await to('.earn', 0.05); await shot('04-earn', 1200);
for (const i of [0, 1, 2]) await page.locator('.glyph').nth(i).click();
await shot('04-earn-b', 900);
for (const i of [3, 4]) await page.locator('.glyph').nth(i).click();
await page.fill('#pass-name', 'Riya Sharma');
await to('.earn', 0.25); await shot('04-earn-c', 2200);
await to('.voices', 0); await shot('05-voices', 1200);
for (const [f, n] of [[0.0, 'a'], [0.3, 'b'], [0.6, 'c'], [1, 'd']]) { await to('.route', f, true); await shot('06-route-' + n, 1300); }
await to('.finale', 0); await shot('07-finale', 1800);
await page.evaluate(() => (window.__lenis ? window.__lenis.scrollTo(document.body.scrollHeight, { immediate: true }) : scrollTo(0, document.body.scrollHeight)));
await shot('08-end', 1200);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
console.log(JSON.stringify({ tag, overflow, errs: errs.slice(0, 8) }, null, 1));
await browser.close();

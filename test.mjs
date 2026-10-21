// Checks the landing page on desktop and phone, and runs one pre-registration
// against a stand-in server.   node landing/test.mjs
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'shots');
mkdirSync(OUT, { recursive: true });
const PW = process.env.PW || '/Users/wewake/AI/TEACHING/UDAIPUR AI (POWERPACK)/stoa/node_modules/playwright-core/index.mjs';
const { chromium, devices } = await import(PW);
const got = [];
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://x').pathname;
  if (path === '/api') {
    if (req.method === 'POST') { let b = ''; req.on('data', (c) => { b += c; }); req.on('end', () => { got.push(JSON.parse(b)); res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); res.end(JSON.stringify({ ok: true, total: 128 + got.length })); }); return; }
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); res.end(JSON.stringify({ total: 128 + got.length, bySession: { 'ahmedabad-2026-10-27': 128 + got.length } })); return;
  }
  const f = join(HERE, path === '/' ? 'index.html' : path);
  if (!existsSync(f)) { res.writeHead(404); res.end(); return; }
  let body = readFileSync(f);
  if (f.endsWith('index.html') && !process.env.RAW) body = String(body).replace("registerUrl: ''", "registerUrl: '/api'").replace("countUrl: ''", "countUrl: '/api'");
  res.writeHead(200, { 'content-type': { '.html': 'text/html', '.png': 'image/png' }[extname(f)] || 'application/octet-stream' });
  res.end(body);
}).listen(0);
const url = `http://localhost:${server.address().port}/`;
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const errors = [];
const watch = (p, tag) => { p.on('pageerror', (e) => errors.push(`${tag}: ${e.message}`)); p.on('console', (m) => { if (m.type() === 'error') errors.push(`${tag}: ${m.text()}`); }); };

const d = await browser.newPage({ viewport: { width: 1440, height: 900 } }); watch(d, 'desktop');
await d.goto(url, { waitUntil: 'networkidle' }); await d.waitForTimeout(1200);
await d.screenshot({ path: join(OUT, 'desktop-top.jpg'), type: 'jpeg', quality: 70 });
await d.screenshot({ path: join(OUT, 'desktop-full.jpg'), type: 'jpeg', quality: 60, fullPage: true });
const banner = await d.$('.banner');
await banner.screenshot({ path: join(OUT, 'banner.png') });
await (await d.$('#cities')).screenshot({ path: join(OUT, 'cities.png') });
await (await d.$('#learn')).screenshot({ path: join(OUT, 'learn.png') });
await (await d.$('#perks')).screenshot({ path: join(OUT, 'perks.png') });
const cityCards = await d.$$eval('.city', (e) => e.map((c) => c.querySelector('.pill').textContent));
await d.click('.city:nth-child(3) [data-open]'); await d.waitForTimeout(300);
const picked = await d.$eval('#f-session', (e) => e.value);
await d.click('[data-close]'); await d.waitForTimeout(200);
await d.click('.regcard [data-open]'); await d.waitForTimeout(400);
await d.screenshot({ path: join(OUT, 'desktop-form.jpg'), type: 'jpeg', quality: 70 });
await d.fill('#f-name', 'Riya Sharma'); await d.fill('#f-email', 'riya@example.com'); await d.fill('#f-phone', '98765 43210');
await d.fill('#f-college', 'MIT Pune'); await d.selectOption('#f-year', '3rd year'); await d.selectOption('#f-branch', 'CSE'); await d.fill('#f-city', 'Pune');
await d.click('form [type=submit]'); await d.waitForTimeout(300);
const firstTry = await d.textContent('.msg');
await d.check('input[name=consent]'); await d.click('form [type=submit]'); await d.waitForTimeout(1200);
await d.screenshot({ path: join(OUT, 'desktop-done.jpg'), type: 'jpeg', quality: 70 });

const m = await browser.newPage({ ...devices['iPhone 13'] }); watch(m, 'phone');
await m.goto(url, { waitUntil: 'networkidle' }); await m.waitForTimeout(1200);
await m.screenshot({ path: join(OUT, 'phone-top.jpg'), type: 'jpeg', quality: 70 });
await m.screenshot({ path: join(OUT, 'phone-full.jpg'), type: 'jpeg', quality: 55, fullPage: true });
await m.click('.mbar [data-open]'); await m.waitForTimeout(400);
await m.screenshot({ path: join(OUT, 'phone-form.jpg'), type: 'jpeg', quality: 70 });
const overflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

console.log('city cards:', cityCards.join(', '), '| third card picks:', picked);
console.log('without consent the form says:', JSON.stringify(firstTry));
console.log('server received:', JSON.stringify(got));
console.log('phone page wider than screen:', overflow);
console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'No console errors.');
await browser.close(); server.close();

// Draws the site's own pictures with the page maker's renderer (maker/art.js), so they always match the covers:
//   public/og.jpg        the link preview (1200 x 630)
//   public/icon-192.png  public/icon-512.png   app and search icons, from public/favicon.svg
// Run after changing the look:  node scripts/brand.mjs   (uses Playwright, like scripts/shots.mjs)
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const PW = process.env.PW || '/Users/wewake/AI/TEACHING/UDAIPUR AI (POWERPACK)/stoa/node_modules/playwright-core/index.mjs';
const { chromium } = await import(PW);
const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({ root, logLevel: 'error', server: { port: 5199, strictPort: false, host: '127.0.0.1', open: false } });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('page:', e.message));
  await page.goto(`${url}maker/`, { waitUntil: 'load' });
  const out = await page.evaluate(async () => {
    const art = await import('/maker/art.js');
    await art.ready();
    const og = document.createElement('canvas');
    await art.share(og);
    const icon = await new Promise((ok, no) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = no;
      i.src = '/favicon.svg';
    });
    const square = n => {
      const c = document.createElement('canvas');
      c.width = c.height = n;
      c.getContext('2d').drawImage(icon, 0, 0, n, n);
      return c.toDataURL('image/png');
    };
    return { og: og.toDataURL('image/jpeg', 0.88), i192: square(192), i512: square(512) };
  });
  const save = (name, data) => writeFile(new URL(`../public/${name}`, import.meta.url), Buffer.from(data.split(',')[1], 'base64'));
  await save('og.jpg', out.og);
  await save('icon-192.png', out.i192);
  await save('icon-512.png', out.i512);
  console.log('brand: public/og.jpg, public/icon-192.png, public/icon-512.png');
} finally {
  await browser.close();
  await server.close();
}

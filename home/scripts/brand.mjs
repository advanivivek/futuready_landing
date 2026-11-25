// Draws the site's own pictures with the page maker's renderer (maker/art.js), so they always match the covers:
//   public/og.jpg        the link preview (1200 x 630)
//   public/favicon.ico (16, 32, 48)  public/icon-180.png  public/icon-192.png  public/icon-512.png
//                        the tab, phone and search icons, from the Futuready mark in brand/futuready-icon.jpg
// Run after changing the look:  node scripts/brand.mjs   (uses Playwright, like scripts/shots.mjs)
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

// an .ico holding PNG images (every browser and search engine reads these)
function ico(pngs) {
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(pngs.length, 4);
  let at = head.length;
  pngs.forEach((png, i) => {
    const n = png.readUInt32BE(16); // width, from the PNG header
    const o = 6 + 16 * i;
    head.writeUInt8(n >= 256 ? 0 : n, o);
    head.writeUInt8(n >= 256 ? 0 : n, o + 1);
    head.writeUInt16LE(1, o + 4);
    head.writeUInt16LE(32, o + 6);
    head.writeUInt32LE(png.length, o + 8);
    head.writeUInt32LE(at, o + 12);
    at += png.length;
  });
  return Buffer.concat([head, ...pngs]);
}

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
    // the Futuready mark (brand/futuready-icon.jpg): found by its ink, then centred on white. Tab icons are
    // cropped tight so it reads at 16 px; app icons keep room around it.
    const icon = await new Promise((ok, no) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = no;
      i.src = '/brand/futuready-icon.jpg';
    });
    const probe = document.createElement('canvas');
    probe.width = icon.width;
    probe.height = icon.height;
    const pg = probe.getContext('2d');
    pg.drawImage(icon, 0, 0);
    const px = pg.getImageData(0, 0, icon.width, icon.height).data;
    let x0 = icon.width, y0 = icon.height, x1 = 0, y1 = 0;
    for (let y = 0; y < icon.height; y++)
      for (let x = 0; x < icon.width; x++) {
        const p = (y * icon.width + x) * 4;
        if (px[p] + px[p + 1] + px[p + 2] < 384) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    // fill: how much of the square the mark's height takes
    const square = (n, fill) => {
      const c = document.createElement('canvas');
      c.width = c.height = n;
      const g = c.getContext('2d');
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, n, n);
      g.imageSmoothingQuality = 'high';
      const h = n * fill, w = (bw / bh) * h;
      g.drawImage(icon, x0, y0, bw, bh, (n - w) / 2, (n - h) / 2, w, h);
      return c.toDataURL('image/png');
    };
    return {
      og: og.toDataURL('image/jpeg', 0.88),
      ico: [16, 32, 48].map(n => square(n, 0.9)),
      i180: square(180, 0.66),
      i192: square(192, 0.62),
      i512: square(512, 0.62),
    };
  });
  const save = (name, data) => writeFile(new URL(`../public/${name}`, import.meta.url), Buffer.from(data.split(',')[1], 'base64'));
  await save('og.jpg', out.og);
  await save('icon-180.png', out.i180);
  await save('icon-192.png', out.i192);
  await save('icon-512.png', out.i512);
  await writeFile(new URL('../public/favicon.ico', import.meta.url), ico(out.ico.map(d => Buffer.from(d.split(',')[1], 'base64'))));
  console.log('brand: public/og.jpg, favicon.ico, icon-180.png, icon-192.png, icon-512.png');
} finally {
  await browser.close();
  await server.close();
}

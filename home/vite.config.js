import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { SITE_URL, VIRTUAL_URL } from './src/data.js';
import { DESCRIPTION, jsonLd, llms, robots, sitemap, text, TITLE } from './scripts/seo.mjs';

// The site lives at the root of its own domain (SITE_URL in src/data.js: https://futuready.hack2skill.com/).
const here = p => fileURLToPath(new URL(p, import.meta.url));
const SITE = SITE_URL.replace(/\/?$/, '/');

// the cities saved by scripts/fetch-events.mjs just before the build (an empty list if it never ran)
const baked = () => {
  try {
    return JSON.parse(readFileSync(here('./src/cities.baked.json'), 'utf8')).cities || [];
  } catch {
    return [];
  }
};

// the day the site last changed: its last commit (unknown on hosts that build without git history)
const lastChange = () => {
  try {
    return execSync('git log -1 --format=%cs', { cwd: here('.'), stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
};

/*
  The pictures, in as few requests as possible (src/story/pics.js reads them):
    - inline: the first scene's three cut-outs and the H2S logo, inside the page's script (ready at once);
    - packs[0]: the next scenes' pictures (scenes 1 to 3, and the crowd photo), fetched a moment after the page opens;
    - packs[1]: every other story picture and the TV screens, fetched once the visitor starts scrolling.
  A new picture in public/story or public/tv joins packs[1] by itself.
  Each pack comes twice: as AVIF (the twins scripts/avif.mjs makes, about 40% lighter), for every browser that shows
  AVIF, and as WebP for the few that cannot (iPhones on iOS 15 and older). A picture without a twin goes as WebP in both.
*/
const INLINE = ['story/girl-phone.webp', 'story/boy-laptop.webp', 'story/bot-stand.webp', 'h2s-logo.webp'];
const EARLY = ['bot-type', 'bot-cage', 'bot-cage-open', 'bug', 'boy-sit', 'girl-sit', 'crowd'].map(n => `story/${n}.webp`);
const TYPES = { webp: 'image/webp', avif: 'image/avif', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
function pictures(base) {
  const all = [
    ...readdirSync(here('./public/story')).filter(f => f.endsWith('.webp')).map(f => `story/${f}`),
    ...readdirSync(here('./public/tv')).filter(f => /\.(webp|jpe?g|png)$/.test(f)).map(f => `tv/${f}`),
  ].filter(p => !INLINE.includes(p));
  const twin = p => {
    const a = p.replace(/\.webp$/, '.avif');
    return a !== p && existsSync(here(`./public/${a}`)) ? a : p;
  };
  // one file holding the pictures back to back; files: path -> [start, length, type]
  const pack = (name, paths, avif) => {
    const files = {};
    const parts = [];
    let at = 0;
    for (const p of [...paths].sort()) {
      const file = avif ? twin(p) : p;
      const buf = readFileSync(here(`./public/${file}`));
      files[p] = [at, buf.length, TYPES[file.split('.').pop()]];
      parts.push(buf);
      at += buf.length;
    }
    const source = Buffer.concat(parts);
    const fileName = `assets/${name}-${createHash('sha256').update(source).digest('hex').slice(0, 10)}.bin`;
    return { fileName, source, url: base + fileName, files };
  };
  const early = all.filter(p => EARLY.includes(p));
  const rest = all.filter(p => !EARLY.includes(p));
  const packs = [pack('pictures-early', early), pack('pictures', rest)];
  const avif = [pack('pictures-early-avif', early, true), pack('pictures-avif', rest, true)];
  const list = ps => ps.map(({ url, files }) => ({ url, files }));
  const inline = Object.fromEntries(INLINE.map(p => [p, `data:image/webp;base64,${readFileSync(here(`./public/${p}`)).toString('base64')}`]));
  return { emit: [...packs, ...avif], module: `export default ${JSON.stringify({ inline, packs: list(packs), avif: list(avif) })};` };
}

// the fonts the first screen needs go inside the stylesheet: one request instead of five (Great Vibes, used further
// down the story, still loads on its own when it is needed)
const INLINE_FONTS = ['unbounded', 'geist', 'geist-mono', 'syncopate-700'];
const fontsInCss = css =>
  css.replace(/url\((['"]?)\/fonts\/([a-z0-9-]+)\.woff2\1\)/g, (m, q, name) =>
    INLINE_FONTS.includes(name) ? `url(data:font/woff2;base64,${readFileSync(here(`./public/fonts/${name}.woff2`)).toString('base64')})` : m
  );

// https://vite.dev/config/
// host: true serves the dev server on your Wi-Fi too, so you can open it on a phone (see START-HERE.md).
export default defineConfig(({ command }) => {
  const build = command === 'build';
  const base = process.env.BASE_PATH || '/';
  const pics = build ? pictures(base) : null;
  return {
    base,
    // the main page, and the small "Other cities" page that each Hack2skill page shows
    build: {
      rollupOptions: { input: { main: 'index.html', cities: 'cities/index.html' } },
      // every browser the page supports preloads modules itself; without the polyfill the two pages share no file
      modulePreload: { polyfill: false },
    },
    // the Google Sheet's link, when it is set in Vercel (Settings, Environment Variables: BRING_FORM_URL)
    define: { 'import.meta.env.BRING_FORM_URL': JSON.stringify((process.env.BRING_FORM_URL || '').trim()) },
    plugins: [
      react(),
      {
        name: 'pictures',
        resolveId: id => (id === 'virtual:pictures' ? '\0virtual:pictures' : null),
        load: id => (id === '\0virtual:pictures' ? (pics ? pics.module : 'export default null;') : null),
        generateBundle(_, bundle) {
          if (!pics) return;
          for (const p of pics.emit) this.emitFile({ type: 'asset', fileName: p.fileName, source: p.source });
          for (const file of Object.values(bundle)) {
            if (file.type === 'asset' && file.fileName.endsWith('.css')) file.source = fontsInCss(String(file.source));
          }
        },
      },
      {
        // the address, the search-engine data and the story in words, written into the page itself
        name: 'site',
        transformIndexHtml: {
          order: 'pre',
          handler(html, ctx) {
            if (ctx.path === '/cities/index.html') {
              const list = JSON.stringify({ cities: baked(), virtual: VIRTUAL_URL }).replace(/</g, '\\u003c');
              return html.replace('<!--cities-->', `<script>window.__CITIES = ${list};</script>`);
            }
            if (ctx.path !== '/index.html') return html;
            const cities = baked();
            if (build) html = html.replace(/^\s*<link rel="preload" as="(font|image)"[^>]*>\n/gm, '');
            return html
              .replaceAll('%SITE%', SITE)
              .replaceAll('%TITLE%', TITLE)
              .replaceAll('%DESCRIPTION%', DESCRIPTION)
              .replace('<!--jsonld-->', jsonLd(cities))
              .replace('<!--about-->', text(cities));
          },
        },
      },
      {
        // robots.txt, sitemap.xml and llms.txt at the root, from the same data
        name: 'root-files',
        generateBundle() {
          this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots() });
          this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap(lastChange()) });
          this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llms(baked()) });
        },
      },
      {
        // the dev server answers /api/cities like Vercel does (api/cities.js), so the train is live here too
        name: 'dev-api',
        configureServer(server) {
          server.middlewares.use('/api/cities', async (req, res) => {
            const { default: handler } = await server.ssrLoadModule('/api/cities.js');
            await handler(req, res);
          });
        },
      },
    ],
    server: { host: true, port: 5188 },
    preview: { host: true, port: 5189 },
  };
});

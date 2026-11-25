import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { SITE_URL } from './src/data.js';
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
  The picture pack: every story picture (and the TV screens) in one file, so a visit makes one request for them
  instead of about forty (src/story/pics.js reads it). The three pictures of the first scene are left out (the page
  asks for them at once, see index.html), and so is the crowd (a CSS background).
*/
const FIRST = ['girl-phone', 'boy-laptop', 'bot-stand', 'crowd'].map(n => `story/${n}.webp`);
function picturePack(base) {
  const paths = [
    ...readdirSync(here('./public/story')).filter(f => f.endsWith('.webp')).map(f => `story/${f}`),
    ...readdirSync(here('./public/tv')).filter(f => /\.(webp|jpe?g|png)$/.test(f)).map(f => `tv/${f}`),
  ].filter(p => !FIRST.includes(p));
  const files = {};
  const parts = [];
  let at = 0;
  for (const p of paths.sort()) {
    const buf = readFileSync(here(`./public/${p}`));
    files[p] = [at, buf.length];
    parts.push(buf);
    at += buf.length;
  }
  const source = Buffer.concat(parts);
  const fileName = `assets/pictures-${createHash('sha256').update(source).digest('hex').slice(0, 10)}.bin`;
  return { fileName, source, module: `export default ${JSON.stringify({ url: base + fileName, files })};` };
}

// https://vite.dev/config/
// host: true serves the dev server on your Wi-Fi too, so you can open it on a phone (see START-HERE.md).
export default defineConfig(({ command }) => {
  const build = command === 'build';
  const base = process.env.BASE_PATH || '/';
  const pack = build ? picturePack(base) : null;
  return {
    base,
    // the main page, and the small "Other cities" page that each Hack2skill page shows
    build: { rollupOptions: { input: { main: 'index.html', cities: 'cities/index.html' } } },
    // the Google Sheet's link, when it is set in Vercel (Settings, Environment Variables: BRING_FORM_URL)
    define: { 'import.meta.env.BRING_FORM_URL': JSON.stringify((process.env.BRING_FORM_URL || '').trim()) },
    plugins: [
      react(),
      {
        name: 'pictures',
        resolveId: id => (id === 'virtual:pictures' ? '\0virtual:pictures' : null),
        load: id => (id === '\0virtual:pictures' ? (pack ? pack.module : 'export default null;') : null),
        generateBundle() {
          if (pack) this.emitFile({ type: 'asset', fileName: pack.fileName, source: pack.source });
        },
      },
      {
        // the address, the search-engine data and the story in words, written into the page itself
        name: 'site',
        transformIndexHtml: {
          order: 'pre',
          handler(html, ctx) {
            if (ctx.path !== '/index.html') return html;
            const cities = baked();
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

import { createHash } from 'node:crypto'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { SITE_URL } from './src/data.js'

// Where the site lives. Its own domain (futuready.dev): nothing to set.
// Under a folder of another site (hack2skill.com/futuready/): build with BASE_PATH=/futuready/
// (A full SITE_URL such as https://hack2skill.com/futuready/ sets the folder by itself when building.)
const fromSite = SITE_URL ? new URL(SITE_URL).pathname.replace(/\/?$/, '/') : '/'

// The full address, for link previews (WhatsApp, LinkedIn, X need it). From src/data.js, or SITE_URL in the
// environment, or the production domain Vercel gives every build.
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL

// Team preview: while REVIEW_CODE is set (in Vercel: Settings, Environment Variables), the page first asks for
// that code, and tells search engines not to list it. Delete it and redeploy to go public. Only a fingerprint
// of the code goes into the site, never the code itself.
const review = (process.env.REVIEW_CODE || '').trim()
const reviewHash = review ? createHash('sha256').update(review).digest('hex') : ''

// https://vite.dev/config/
// host: true serves the dev server on your Wi-Fi too, so you can open it on a phone (see START-HERE.md).
export default defineConfig(({ command }) => {
  // the dev server (and the page maker) always run at the root
  const base = process.env.BASE_PATH || (command === 'build' ? fromSite : '/')
  const site = (SITE_URL || process.env.SITE_URL || (vercel ? `https://${vercel}${base}` : '')).replace(/\/?$/, '/')
  return {
  base,
  // the main page, and the small "Other cities" page that each Hack2skill page shows
  build: { rollupOptions: { input: { main: 'index.html', cities: 'cities/index.html' } } },
  define: { 'import.meta.env.VITE_REVIEW_HASH': JSON.stringify(reviewHash) },
  plugins: [
    react(),
    {
      name: 'site-url',
      transformIndexHtml: html =>
        html
          .replaceAll('%SITE%', site === '/' ? base : site)
          // the one true address of the page, once it is known
          .replace('<!--canonical-->', site.startsWith('http') ? `<link rel="canonical" href="${site}" />` : '')
          .replace('<!--robots-->', review ? '<meta name="robots" content="noindex, nofollow" />' : ''),
    },
    {
      // robots.txt: closed while in team preview, open once public
      name: 'robots',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: review ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\n' })
      },
    },
  ],
  server: { host: true, port: 5188 },
  preview: { host: true, port: 5189 },
  }
})

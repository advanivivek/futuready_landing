import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { SITE_URL } from './src/data.js'

// Where the site lives. Its own domain (futuready.dev): nothing to set.
// Under a folder of another site (hack2skill.com/futuready/): build with BASE_PATH=/futuready/
const base = process.env.BASE_PATH || '/'

// The full address, for link previews (WhatsApp, LinkedIn, X need it). From src/data.js, or SITE_URL in the
// environment, or the production domain Vercel gives every build.
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
const site = (SITE_URL || process.env.SITE_URL || (vercel ? `https://${vercel}${base}` : '')).replace(/\/?$/, '/')

// https://vite.dev/config/
// host: true serves the dev server on your Wi-Fi too, so you can open it on a phone (see START-HERE.md).
export default defineConfig({
  base,
  plugins: [
    react(),
    {
      name: 'site-url',
      transformIndexHtml: html =>
        html
          .replaceAll('%SITE%', site === '/' ? base : site)
          // the one true address of the page, once it is known
          .replace('<!--canonical-->', site.startsWith('http') ? `<link rel="canonical" href="${site}" />` : ''),
    },
  ],
  server: { host: true, port: 5188 },
  preview: { host: true, port: 5189 },
})

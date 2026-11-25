// The page maker, built on its own into dist/maker/ (served at /maker/, behind the password in middleware.js).
// A separate build, so the public page and the maker never share a file: every maker file sits under /maker/.
// It uses the site's own fonts and cut-outs from the main build (/fonts, /story). On your Mac: npm run maker.
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'maker',
  base: '/maker/',
  publicDir: false,
  build: { outDir: '../dist/maker', emptyOutDir: false, modulePreload: { polyfill: false } },
});

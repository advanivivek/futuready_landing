# Futuready: the main page

The front door to Futuready Builders Lab. Not a page you read: a short journey you scroll, drag and tap through.
Registration happens on each city's own page. This page makes people want to get there.

```bash
npm install
npm run dev        # http://localhost:5188 (or: npm run dev -- --port 5188 --host to try it on your phone)
npm run build      # static files in dist/, host anywhere
```

## The journey

| # | Chapter | What you do | Built with |
| --- | --- | --- | --- |
| 0 | Intro | Watch FUTUREADY assemble while a counter runs to 100 | custom |
| 1 | Are you ready for the future? | Touch the ASCII eclipse; scroll to dive into it | GradientASCII (H2S shades) |
| 2 | 2026 → 2031 | Scroll to travel five years through a light tunnel | LightTunnel, Counter |
| 3 | Phones out. Squads up. | Drag through the real Builders Lab screens | MaskedHeading, CircularGallery |
| 4 | R E A D Y | Tap each letter to clear its level and charge the orb; get a holographic pass with your name; keep it | Strands, HoloCard |
| 5 | Heard in Pune | Students' own words, moving with your scroll | ScrollVelocity |
| 6 | On tour | Scroll to draw the route across India; tap any city | DotGrid, SplitFlapText |
| 7 | See you in the future | Drag a glass lens over the line; play with the wordmark | FluidGlass, TechText |

## Change things here

Everything editable is in [`src/data.js`](src/data.js):

- `CITIES`: the tour in route order. `status` is `past`, `next` or `soon`. `url` is the city page. `lon`/`lat` place it on the map.
- `LAB`: the real phone screens in the gallery (`public/lab/`).
- `VOICES`, `VOICE_NAMES`: quotes, word for word, from students' LinkedIn posts.
- `LEVELS`: the five levels and their stamp colours.

## Mobile notes

- Mobile first. Safe areas, `svh` units, 16px inputs (no iOS zoom), 44px tap targets, native scroll on phones (smooth scroll only on desktop).
- WebGL only mounts near the screen and unmounts far from it, so a phone holds two or three GPU contexts at a time.
- Haptic taps on Android. The pass is shared through the share sheet (Save Image on iPhone) or downloaded.
- `prefers-reduced-motion` skips the intro and stills the animation.
- The pass and stamps are remembered on the device (local storage).

## Tools

- `node scripts/pull-reactbits.mjs Name ...` pulls React Bits components (JS + CSS) into `src/rb/`.
  `CircularGallery` has one local change: vertical wheel scrolls the page, not the gallery.
- `node scripts/shots.mjs [--webkit] [--desktop]` walks the whole journey and screenshots each moment (needs the dev server).

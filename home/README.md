# Futuready: the main page

The front door to Futuready Builders Lab, told as a short paper-cut story you scroll through.
Two friends, a few tin robots, fifteen little stages. Registration happens on each city's own page;
this page makes people want to get there.

```bash
npm install
npm run dev        # http://localhost:5188   (add -- --host to open it on your phone)
npm run build      # fetches the latest cities from Hack2skill, then builds static files into dist/
npm run events     # only fetch the cities (writes public/events.json)
```

## The story

| # | Scene | What happens |
| --- | --- | --- |
| 0 | Are you ready for the future? | She looks at her phone, her friend types on a laptop, a robot peeks in. |
| 1 | It's 2031. AI writes the code. | Starts on one robot's keyboard, pulls back to a room of them typing. |
| 2 | It finds its own bugs. And locks them up before lunch. | A ladybug crawls in, springs into the robot's open cage, and the cage snaps shut. |
| 3 | So what's left for you? | Starts close on the two friends on the floor, pulls back to a giant "you?" made of a crowd. |
| 4 | Five things no machine can do for you. | A passport drops in, then waits in the corner. |
| 5–9 | R · E · A · D · Y | One scene per level, a giant paper letter on the floor, a rubber stamp on the passport at the end. He brings the blueprint in A; she conducts a robot band in D; a spotlight finds her in Y. |
| 10 | Five stamps. One passport. | "Make it yours" puts your name on it; "Keep it" shares or saves it. |
| 11 | So we turned it into a game. | A vintage TV plays the real Builders Lab screens; a squad cheers; the camera leans into the TV. |
| 12 | Pune played first. | Students' own words, pinned up as paper notes. |
| 13 | Next stop: | A tin train, one carriage per city from the live event list. She walks to the platform, he runs for it. |
| 14 | See you on the platform. | The two friends and a robot wave. |

Every scene is scroll-driven: words type themselves, people and robots slide in, the camera zooms in and out,
and each new scene slides up over the last like a sheet of paper. Tap people and robots; they react.

## The cities come from Hack2skill

Nothing about the tour is hard-coded once the events exist on Hack2skill.

1. **Create each city as an event on Hack2skill** and put the word *Futuready* in its title, with the city last,
   for example `Futuready Builders Lab: Ahmedabad`. (`: · | – —`, ` - ` and ` in ` all work as separators.)
2. **That's it.** The train reads Hack2skill's public event list
   (`https://hack2skill.com/api/v1/innovator/public/event/list`), keeps the events whose title or link
   contains `futuready`, and for each one:
   - the city is the last part of the title,
   - **past / open / soon** comes from the registration dates (past once registration has closed,
     open while it is open, soon before it opens),
   - the carriage links to the event's own link, or `hack2skill.com/event/<slug>`, exactly like hack2skill.com's cards.

Where the list is read from:

| Hosted on | How the train gets its cities |
| --- | --- |
| hack2skill.com (any subdomain) | Live from the API in the visitor's browser, on every visit. |
| Anywhere else (Vercel, Netlify, GitHub Pages…) | `npm run build` saves the list as `public/events.json`. Rebuild on a schedule (a daily cron or deploy hook) to stay fresh. The API does not allow other sites to read it from the browser (no CORS), which is why this step exists. |
| Offline, or no Futuready events listed yet | The list in `src/data.js` (`CITIES`), which is what you see today. |

To use a different keyword, change `EVENTS.match` in [`src/data.js`](src/data.js).
To add a campus name or a fixed date to a city, add it in `CITIES` (it is only used when the live list is empty).

## Sound

Off until the visitor taps the speaker in the header (browsers only allow sound after a tap). Every effect is
synthesised with the Web Audio API in [`src/story/sound.js`](src/story/sound.js), so there are no audio files:
typewriter keys as words type, a paper whoosh between scenes, robot boops, a spring and a brass clank for the
bug, a rubber-stamp thunk, a trumpet fanfare for the robot band, a chime for the passport, a steam whistle and
chugs for the train. Which sound plays where is the `cues` list of each scene.

## Change things here

- [`src/data.js`](src/data.js): the event source, fallback cities, levels, the quotes.
- [`src/story/scenes.jsx`](src/story/scenes.jsx): every scene's words, colours, camera, sounds, length (in screens) and choreography.
- `public/story/`: the cut-outs (WebP with transparency).

## Where the pictures come from

Generated with Figma AI (file: "Futuready story assets"), cut out on a Mac with Apple's subject lifting
(`scripts/art/lift.swift`, the same as "Remove background" in Photos), then given smooth edges and a cream
paper border by `scripts/art/refine.py`. Originals are kept in `art/` (not in git). The TV shows real screens
from the Builders Lab deck. The people are not real people.

```bash
swiftc -O scripts/art/lift.swift -o /tmp/lift && /tmp/lift art/boy-a.png /tmp/cut boy-a
python3 scripts/art/refine.py /tmp/cut public/story
```

## Mobile notes

- One "screen" of scroll is the small viewport height (`100svh`), so iOS toolbars never move the floor or the story.
- Phones keep their native scroll, eased with a time-based curve (the same feel at 60 Hz and 120 Hz); laptops get Lenis.
- Only transforms and opacity move on scroll. Scenes off screen are not rendered.
- Lines are balanced (`text-wrap: balance`) and quotes avoid lonely last words (`text-wrap: pretty`).
- 16px inputs (no iOS zoom), 44px targets, Android haptics as each stamp lands, the share sheet for the passport.
- Reduced motion: no camera moves, scenes cross-fade instead of sliding, no looping animations.

## Tools

- `node scripts/shots.mjs [--webkit] [--desktop] [--only=id,id]` screenshots chosen moments of every scene
  (needs the dev server). WebKit is the closest to iPhone Safari.

# Futuready: the main page

The front door to Futuready Builders Lab, told as a short paper-cut story you scroll through.
One student, a few tin robots, fifteen little stages. Registration happens on each city's own page;
this page makes people want to get there.

```bash
npm install
npm run dev        # http://localhost:5188   (add -- --host to open it on your phone)
npm run build      # static files in dist/, host anywhere
```

## The story

| # | Scene | What happens |
| --- | --- | --- |
| 0 | Are you ready for the future? | The student, phone in hand. A robot peeks in. |
| 1 | It's 2031. AI writes the code. | Three tin robots roll in and type; code floats up. |
| 2 | It finds its own bugs. | A robot with a magnifying glass; a ladybug crawls in and flies off (tap it). |
| 3 | So what's left for you? | A giant "you?" made of a crowd of students. She looks up at it. |
| 4 | Five things no machine can do for you. | A passport drops in, then waits in the corner. |
| 5–9 | R · E · A · D · Y | One scene per level, a giant paper letter on the floor. Each ends with a rubber stamp on the passport. |
| 10 | Five stamps. One passport. | The passport comes back. "Make it yours" puts your name on it; "Keep it" shares or saves it. |
| 11 | So we turned it into a game. | A vintage TV plays the real Builders Lab screens; a squad cheers. |
| 12 | Pune played first. | Students' own words, pinned up as paper notes. |
| 13 | Next stop: | A tin train rolls through, one carriage per city. Tap a carriage to go to that city's page. |
| 14 | See you on the platform. | The student and a robot, side by side. |

Every scene is driven by scroll: words type themselves out, people and robots slide in, and each new scene
slides up over the last like a sheet of paper. Tap people, robots and bugs; they react.

## Change things here

- [`src/data.js`](src/data.js): cities (in route order, with each city page's `url`), levels, the quotes.
- [`src/story/scenes.jsx`](src/story/scenes.jsx): every scene's words, colours, length (in screens) and choreography.
- `public/story/`: the cut-outs (WebP with transparency).

## Where the pictures come from

Generated with Figma AI (file: "Futuready story assets" in Vivek Advani's team), then cut out on the Mac with
Apple's subject lifting (the same as "Remove background" in Photos). Originals are kept in `art/` (not in git).
The TV shows real screens from the Builders Lab deck. The people are not real people.

## Mobile notes

- Mobile first: safe areas, a stage that follows the real visible viewport, scroll measured in small-viewport
  units so iOS toolbars never jump the story, smoothing on phones, Lenis smooth wheel on laptops only.
- 16px inputs (no iOS zoom), 44px targets, Android haptics as each stamp lands, the share sheet for the passport.
- All words are real text for screen readers; scenes off screen are hidden from them.

## Tools

- `node scripts/shots.mjs [--webkit] [--desktop] [--only=id,id]` screenshots chosen moments of every scene
  (needs the dev server). WebKit is the closest to iPhone Safari.

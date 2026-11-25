# Futuready landing: notes for every agent

The Futuready site (`home/`, React + Vite, on Vercel at https://futuready.hack2skill.com), plus the tools around it.

## Two repositories, one push

| | Repository | Gets |
| --- | --- | --- |
| `origin` | github.com/advanivivek/futuready_landing | everything: every commit, full detailed messages, design tools, history |
| live | github.com/vivek-h2s/futuready | only the site, as one clean commit per send with a short message; Vercel deploys it |

- A plain `git push` of `main` does both. `.githooks/pre-push` runs `ship-h2s.sh`, which copies the site into the
  live repository as one commit. A push that changes nothing in the site sends nothing.
- **Pushing `main` publishes the live site.** Push only when the user asked for it and the work is ready.
- Commit messages: write the full, detailed message as usual. End it with a blank line and a `Live:` line in a few
  plain words. That line is all the live repository ever sees:

  ```text
  Story pictures as AVIF with a WebP fallback, the kick pose dropped, ...

  (details)

  Live: Lighter pictures
  ```

  With no `Live:` line the live commit says "Update site".
- Push without going live: `SHIP=0 git push`. Send the last commit again (after a failed send): `./ship-h2s.sh "Words"`.
- Never push to the live repository any other way, and never put notes, history or detailed messages there.
- Setup, once per copy of this repository: `git config core.hooksPath .githooks`.

## GitHub logins on this Mac

- gh holds both accounts and **advanivivek stays active**. git signs in through gh for github.com (`gh auth setup-git`),
  so plain git in any personal repository uses advanivivek.
- `ship-h2s.sh` asks gh for the vivek-h2s login by itself. Never run `gh auth switch` for this.
- Leave the macOS keychain's github.com entries alone.

## Keep out of every public place

- The root `index.html` is the user's own scratch file: never stage it.
- `home/Initiative-Templates/`, `home/initiative/assets/partners/` (partner logos) and `home/public/vivek/` (personal
  photos) never go to any public repository. They are gitignored; keep it that way.
- Hack2skill event pages: never click Publish or Unpublish, and never touch the old builderslab page.

## Where things go

- `START-HERE.md` (local, gitignored) is the user's one guide for every step only they can do. Add their steps there,
  nowhere else, short and in order.
- Story pictures: `home/public/story/*.webp` and `home/public/tv/*.webp`. After adding or changing one, run
  `node home/scripts/avif.mjs` (needs `brew install libavif webp`) and commit the `.avif` twins it makes. The build
  packs the AVIF twins for nearly every browser and the WebP files for old iPhones (iOS 15 and older).
- Copy on the site: plain student benefits, balanced line breaks.

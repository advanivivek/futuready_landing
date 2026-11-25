#!/bin/bash
# Sends the Futuready site to its live repository, github.com/vivek-h2s/futuready (Vercel builds it for
# https://futuready.hack2skill.com), as ONE new commit with a short message on its main branch: only the site
# (home/ without the page maker, the Hack2skill page files or the design tools) and its daily-refresh workflow.
# None of this repository's history or detailed messages go there. Vercel is live about a minute later.
#   ./ship-h2s.sh                         -> "Update site"
#   ./ship-h2s.sh "Add Pune to the train"
# Needs: everything committed here, and gh signed in as vivek-h2s (the command in START-HERE.md switches for you).
set -euo pipefail
REPO="${LIVE_REPO:-https://github.com/vivek-h2s/futuready.git}"
MSG="${1:-Update site}"
HERE="$(cd "$(dirname "$0")" && pwd)"
[ -z "$(git -C "$HERE" status --porcelain home .github)" ] || { echo "Commit your changes in home/ first."; exit 1; }
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
# sign in to GitHub as whichever account gh has active (not the Mac's saved personal login)
GH=(-c credential.helper= -c 'credential.helper=!gh auth git-credential')
git "${GH[@]}" clone --quiet --depth 1 "$REPO" "$TMP/out" 2>/dev/null || { echo "Could not open $REPO (is gh signed in as vivek-h2s?)"; exit 1; }
cd "$TMP/out"
git checkout --quiet -B main
# the repository holds exactly the site: clear it, then copy the site in
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
git -C "$HERE" archive HEAD home | tar -x -C . --strip-components=1 \
  --exclude=home/maker --exclude=home/initiative --exclude=home/scripts/art \
  --exclude=home/scripts/shots.mjs --exclude=home/scripts/brand.mjs --exclude=home/scripts/bring-campus.gs
git -C "$HERE" archive HEAD .github | tar -x -C .
cat > README.md <<'MD'
# Futuready

The Futuready landing page: https://futuready.hack2skill.com

```bash
npm ci
npm run dev     # http://localhost:5188
npm run build   # into dist/
```

Node 20 or newer. Hosted on Vercel (Vite). `api/cities.js` serves the list of cities, cached at the edge.
Optional environment variable: `BRING_FORM_URL`, the Google Sheet web app that receives campus requests.
MD
git add -A
if git diff --cached --quiet; then echo "Nothing new to send."; exit 0; fi
git -c user.name="Vivek Advani" -c user.email="vivek.advani@hack2skill.com" commit --quiet -m "$MSG"
git "${GH[@]}" push --quiet origin HEAD:main
echo "Sent: $(echo "$REPO" | sed -E 's#\.git$##')/commit/$(git rev-parse HEAD)"

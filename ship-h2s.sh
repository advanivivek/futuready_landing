#!/bin/bash
# Sends the Futuready main page to Hack2skill's repository as ONE clean pull request (one commit on top of their
# main): only the site (home/, without the page maker or the Hack2skill page files), no history, a short message.
# Running it again replaces that pull request's commit (or opens a new pull request once the last one is merged).
#   ./ship-h2s.sh                      -> "Update Futuready landing page"
#   ./ship-h2s.sh "Add Pune to the train"
# Needs: everything committed here, and `gh auth switch --user vivek-h2s` (the account with access).
set -euo pipefail
REPO="${H2S_REPO:-https://github.com/h2sVision/futuready.git}"
MSG="${1:-Update Futuready landing page}"
BRANCH="${H2S_BRANCH:-futuready-site}"
SLUG="$(echo "$REPO" | sed -E 's#.*github.com[/:]##; s#\.git$##')"
HERE="$(cd "$(dirname "$0")" && pwd)"
[ -z "$(git -C "$HERE" status --porcelain home)" ] || { echo "Commit your changes in home/ first."; exit 1; }
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
# sign in to GitHub as whichever account `gh` has active (not the Mac's saved personal login)
GH=(-c credential.helper= -c 'credential.helper=!gh auth git-credential')
git "${GH[@]}" clone --quiet --depth 1 "$REPO" "$TMP/out" 2>/dev/null || { mkdir -p "$TMP/out"; git -C "$TMP/out" init --quiet -b main; git -C "$TMP/out" remote add origin "$REPO"; }
# the repository holds exactly the site: clear it, then copy the site in
find "$TMP/out" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
git -C "$HERE" archive HEAD home | tar -x -C "$TMP/out" --strip-components=1 \
  --exclude=home/maker --exclude=home/initiative --exclude=home/scripts/art --exclude=home/scripts/shots.mjs --exclude=home/scripts/bring-campus.gs
# this copy lives at hack2skill.com/futuready
sed -i '' "s#^export const SITE_URL = .*#export const SITE_URL = 'https://hack2skill.com/futuready/';#" "$TMP/out/src/data.js"
cat > "$TMP/out/README.md" <<'MD'
# Futuready

The Futuready landing page, served at https://hack2skill.com/futuready/

```bash
npm ci
npm run dev     # http://localhost:5188
npm run build   # into dist/: serve that folder at /futuready/
```

Node 20 or newer. Every path in the build already starts with `/futuready/` (from `SITE_URL` in `src/data.js`).
Two pages: `/futuready/` and `/futuready/cities/` (the "Other cities" strip shown on each Futuready event page).
On hack2skill.com the page reads Hack2skill's public event list live, so new cities appear by themselves.
MD
cd "$TMP/out"
git checkout --quiet -B "$BRANCH"
git add -A
if git diff --cached --quiet; then echo "Nothing new to send."; exit 0; fi
git -c user.name="Vivek Advani" -c user.email="vivek.advani@hack2skill.com" commit --quiet -m "$MSG"
git "${GH[@]}" push --quiet --force origin "HEAD:refs/heads/$BRANCH"
if gh pr view "$BRANCH" -R "$SLUG" --json state -q .state 2>/dev/null | grep -q OPEN; then
  echo "Updated the open pull request: $(gh pr view "$BRANCH" -R "$SLUG" --json url -q .url)"
else
  gh pr create -R "$SLUG" --base main --head "$BRANCH" --title "$MSG" --body "The Futuready landing page, served at https://hack2skill.com/futuready/. Build: npm ci && npm run build, then serve dist/ at /futuready/ (see README)."
fi

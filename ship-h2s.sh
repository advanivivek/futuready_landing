#!/bin/bash
# Sends the Futuready site to its live repository, github.com/vivek-h2s/futuready (Vercel builds it for
# https://futuready.hack2skill.com), as ONE new commit with a short message on its main branch: only the site and
# its password-locked page maker (home/ without the Hack2skill page files or the design tools), and the daily refresh.
# None of this repository's history or detailed messages go there. Vercel is live about a minute later.
#
# You rarely run it yourself: every `git push` of main runs it (.githooks/pre-push), with the "Live:" line of the
# commit message as the short message. By hand, to send the last commit again or after a failed send:
#   ./ship-h2s.sh                         -> "Update site"
#   ./ship-h2s.sh "Add Pune to the train"
# Needs: gh signed in to both accounts (gh auth status lists advanivivek and vivek-h2s). It signs in as vivek-h2s by
# itself, whichever account gh has active, so nothing needs switching.
set -euo pipefail
REPO="${LIVE_REPO:-https://github.com/vivek-h2s/futuready.git}"
MSG="${1:-Update site}"
REV="${SHIP_REV:-HEAD}" # the commit to send (the pre-push hook passes the one being pushed)
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ -z "${SHIP_REV:-}" ] && [ -n "$(git -C "$HERE" status --porcelain home .github)" ]; then
  echo "Commit your changes in home/ first (only committed work is sent)."
  exit 1
fi
# the vivek-h2s login that gh keeps, handed to git for this script only (never written anywhere)
SHIP_TOKEN="$(gh auth token -u vivek-h2s 2>/dev/null)" || { echo "gh has no vivek-h2s login. Run: gh auth login (and sign in as vivek-h2s)"; exit 1; }
export SHIP_TOKEN
GH=(-c credential.helper= -c 'credential.helper=!f() { [ "$1" = get ] && printf "username=vivek-h2s\npassword=%s\n" "$SHIP_TOKEN"; }; f')
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
git "${GH[@]}" clone --quiet --depth 1 "$REPO" "$TMP/out" 2>/dev/null || { echo "Could not open $REPO as vivek-h2s."; exit 1; }
cd "$TMP/out"
git checkout --quiet -B main
# the repository holds exactly the site: clear it, then copy the site in
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
git -C "$HERE" archive "$REV" home | tar -x -C . --strip-components=1 \
  --exclude=home/maker/print.mjs --exclude=home/maker/export.mjs --exclude=home/initiative --exclude=home/brand \
  --exclude=home/scripts/art --exclude=home/scripts/shots.mjs --exclude=home/scripts/brand.mjs --exclude=home/scripts/bring-campus.gs \
  --exclude=home/scripts/avif.mjs
# the daily-refresh workflow, if the vivek-h2s login may add workflows (once: gh auth refresh -h github.com -s workflow)
if GH_TOKEN="$SHIP_TOKEN" gh api -i user 2>/dev/null | grep -i '^x-oauth-scopes:' | grep -q workflow; then
  git -C "$HERE" archive "$REV" .github | tar -x -C .
else
  git ls-files --error-unmatch .github >/dev/null 2>&1 && git checkout --quiet HEAD -- .github 2>/dev/null || true
  echo "(Leaving out the daily-refresh workflow: the vivek-h2s login needs the workflow permission, see START-HERE.md.)"
fi
cat > README.md <<'MD'
# Futuready

The Futuready landing page: https://futuready.hack2skill.com

```bash
npm ci
npm run dev     # http://localhost:5188
npm run build   # into dist/
```

Node 20 or newer. Hosted on Vercel (Vite). `api/cities.js` serves the list of cities, cached at the edge.
The page maker is built to `/maker/`, behind a password (`middleware.js`).
Environment variables: `BRING_FORM_URL` (the Google Sheet web app for campus requests), `MAKER_PASSWORD`.
MD
git add -A
if git diff --cached --quiet; then echo "Live site: nothing new to send."; exit 0; fi
git -c user.name="Vivek Advani" -c user.email="vivek.advani@hack2skill.com" commit --quiet -m "$MSG"
git "${GH[@]}" push --quiet origin HEAD:main
echo "Live site: sent \"$MSG\": $(echo "$REPO" | sed -E 's#\.git$##')/commit/$(git rev-parse HEAD)"

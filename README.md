# Futuready Builders Lab: landing page

A pre-registration page for Futuready Builders Lab, the Hack2skill campus bootcamp series.
Built on Hack2skill's own event page template, so it can sit on hack2skill.com.

## What is in this folder

| File | What it is |
| --- | --- |
| `index.html` | The whole page in one file. No build step, no libraries. |
| `assets/futuready-banner.png` | The banner, 2160 x 720 (the 1080 x 360 banner slot at 2x). |
| `assets/futuready-thumb.png` | The square display picture: the Hack2skill logo, 600 x 600. |
| `assets/vivek.jpg` | Teacher Profile Picture |
| `apps-script.gs` | Optional: a Google Sheet that collects pre-registrations and counts them. |
| `test.mjs` | Checks the page on desktop and phone, and submits one test registration. |

## How it follows the Hack2skill template

Same structure as Hack2skill event pages (for example MongoDB Essentials, Datathon 2026):

- Top bar with the Hack2skill logo and Login/Register, then the support email line
- A 1080 x 360 banner on the Hack2skill gradient: the logo on top in the centre, the title, the tagline
- Title card: the Hack2skill logo, event name, grey chips (In-person, 2 hours, Campus series, At zero cost), copy-link button
- Section tabs: About, Upcoming cities, What you will learn, What's in it for you, Episodes, Meet your speaker, Event timeline, FAQs
- A sticky card on the right: next sessions, countdown, headcount, at zero cost, the register button
- The standard Hack2skill footer: tagline, social links, contacts, addresses, policies

Fonts are the template's own: Open Sans, Plus Jakarta Sans, Source Code Pro, Mulish.
The primary colour is Hack2skill blue `#3463AF`, with the Hack2skill gradient (`--grad`) for the banner and highlights.

Hack2skill marketing's rules, followed everywhere:

- Sentence case. No all caps, no title case.
- One colour per sentence. Bold the important words instead.
- "At zero cost", never "free". "In-person", not "In Person".
- No question marks in headings or tabs.
- First-party event, so no "Powered by".

## Two ways to publish

**A. As a standalone page** (for example `hack2skill.com/futuready`)

1. Upload `index.html` and the `assets` folder together.
2. Open `index.html` and find the block called `SETTINGS FOR THE HACK2SKILL WEB TEAM` near the top.
3. Set `registerUrl` (where registrations go) and `countUrl` (where the headcount comes from).
4. Done. Until `registerUrl` is set, the form politely says registrations open soon.

**B. Inside Hack2skill's event platform**

Create a new event with `assets/futuready-banner.png` as the banner and
`assets/futuready-thumb.png` as the display picture. Copy the section text from `index.html`.
Registrations then use Hack2skill's own login and register flow.
To send the standalone page's button there instead, set `eventUrl` to that event's link.

## What the form sends

A `POST` to `registerUrl` with a JSON body (sent as `text/plain` so no extra CORS setup is needed):

```json
{
  "session": "mitpune-2026-10-27",
  "name": "Riya Sharma",
  "email": "riya@example.com",
  "phone": "9876543210",
  "college": "MIT Pune",
  "year": "3rd year",
  "branch": "CSE",
  "city": "Pune",
  "laptop": false,
  "consent": true,
  "source": "https://hack2skill.com/futuready",
  "at": "2026-10-16T10:04:15.180Z"
}
```

Reply with `{ "ok": true }`, or `{ "ok": false, "error": "..." }`.
`countUrl` should answer a `GET` with `{ "total": 123, "bySession": { "mitpune-2026-10-27": 80 } }`.
The page refreshes the headcount every minute.

Students can also pick a city that is coming soon (session `soon-ahmedabad`, `soon-mumbai` and so on),
or "Bring Futuready to my college" (session `bring-to-my-college`).
That is demand from cities and campuses not yet on the list.

## A headcount today, before any of that (2 minutes)

1. Make a new Google Sheet. Extensions, Apps Script. Paste `apps-script.gs`. Save.
2. Deploy, New deployment, type Web app. Execute as: Me. Who has access: Anyone. Deploy.
3. Copy the web app URL (it ends in `/exec`).
4. Paste it into `index.html` as both `registerUrl` and `countUrl`.

Every pre-registration becomes a row. The same email for the same session counts once.

## Adding the next college

In the settings block, add another entry to `sessions`:

```js
{ id: 'coep-2026-11-05', city: 'Pune', college: 'COEP Pune', date: 'Thursday, 5 November 2026',
  shortDate: 'Thu, 5 Nov 2026', time: '10:30 AM to 12:30 PM',
  start: '2026-11-05T10:30:00+05:30', closes: '2026-11-04T23:59:00+05:30' },
```

`college` is the venue. Leave it empty (`college: ''`) and the page says "Venue to be announced".
When the venue is confirmed, put it there.

Sessions disappear by themselves after `closes`. The first open one is shown as "Next session".

## Upcoming cities

Every open session gets a card with its date and venue.
Cities with no date yet go in `comingSoon`, for example `['Ahmedabad', 'Mumbai', 'Jaipur', 'Delhi']`.
Each gets a "Coming soon" card, and students can pre-register for it to hear first.
When a city gets a date, move it from `comingSoon` into `sessions`.

Pune, Ahmedabad, Mumbai, Jaipur and Delhi have their own line drawing. Other cities get a campus drawing.

## Before going live, please confirm

- That the series is at zero cost for students (the page says so).
- The speaker photo: set `speakerPhoto` to a square image URL, or keep the initials.
- That the session timings match what the college confirmed.

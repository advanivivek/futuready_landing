/* ============================================================
   SETTINGS: everything a non-developer may need to change.
   ============================================================ */

// ---- The cities on the train ----
// Paste each city's Futuready page link. The city and the date are read from the link itself:
//   https://hack2skill.com/event/futuready-vadodara-07122026  ->  Vadodara, 7 Dec 2026
// (so name each Hack2skill page futuready-<city>-<ddmmyyyy>; two-word cities: futuready-navi-mumbai-05012027).
// Until its day has passed a city shows "Departs" and its carriage opens its page; afterwards "Landed".
// A city with no page yet: just { city: 'Name' } (boarding soon).
export const CITIES = [
  { link: 'https://hack2skill.com/futuready/pune26102026', campus: 'Trinity Academy of Engineering' },
  { link: 'https://hack2skill.com/event/futuready-vadodara-07122026', campus: 'Parul University' },
  { city: 'Mumbai' },
  { city: 'Ahmedabad' },
  { city: 'Jaipur' },
  { city: 'Delhi' },
];

// Optional, later: one link that lists every Futuready city (see START-HERE.md, "Ask the Hack2skill team").
// When it is set, the train updates itself and the list above is only a fallback.
export const CITIES_FEED = '';

// ---- The last scene: "Didn't find your city? Attend Virtual, or bring it to your campus." ----
export const VIRTUAL_URL = 'https://hack2skill.com/event/futuready-virtual';
export const SUPPORT = 'support@hack2skill.com';
// Where "Bring it to your campus" requests go: the web app link of the Google Sheet script
// (scripts/bring-campus.gs, see START-HERE.md). Until it is set, a request opens an email instead.
export const BRING_FORM_URL = '';

// ---- Sharing ----
// The site's own address, for share links and previews. Leave '' to use the address it is opened at.
export const SITE_URL = '';
export const SHARE_TEXT = 'Found something before everyone else: Futuready, a free campus builder lab by Hack2skill. Are you ready for the future?';

// ---- The TV in the lab ----
// Its screen plays these pictures in turn. Replace any file in public/tv/ with your own (same name),
// or change the list. Landscape pictures (16:9 or 4:3) look best.
export const TV_SCREENS = ['tv/1.jpg', 'tv/2.jpg', 'tv/3.jpg', 'tv/4.jpg'];

// Meet your trainer. The photos are cut-outs in public/story (vivek-*.webp); tap him to change the pose.
// The labels stick to the photo like label-maker tape, in this order.
export const TRAINER = {
  name: 'Vivek Advani',
  linkedin: 'https://www.linkedin.com/in/vivekadvani',
  instagram: 'https://instagram.com/vivekadvani',
  labels: ['DevRel · Hack2skill', 'Architect', 'Builds AI products', 'Loves Math', 'Dances Salsa', 'Plays music', 'Cares about Humanity', 'Makes sites like these'],
};

// The five levels of Episode 01. Clear a level, earn a stamp. ink: the stamp's colour on paper.
export const LEVELS = [
  { k: 'R', name: 'Requirements', color: '#EF5F7B', ink: '#C83A5B' },
  { k: 'E', name: 'Evaluate', color: '#2FBF8A', ink: '#0F8F6A' },
  { k: 'A', name: 'Architect', color: '#4C9DF0', ink: '#1A6FC0' },
  { k: 'D', name: 'Direct', color: '#F28C38', ink: '#D2600F' },
  { k: 'Y', name: 'You', color: '#E7B21C', ink: '#B86E00' },
];

// Real words from students at Futuready Builders Lab, Pune (their LinkedIn posts, word for word).
export const VOICES_FULL = [
  {
    quote: 'One of those rare sessions where you don’t feel bored even for a second!',
    name: 'Swapnaja Waghapure',
    role: 'MCA student',
  },
  {
    quote: 'One more step towards becoming a builder rather than just a thinker.',
    name: 'Durga Khadbade',
    role: 'Engineering student, TAE Pune',
  },
  {
    quote: 'Live interactive activities, multiple levels to progress through, and a team-based prompting challenge.',
    name: 'Aditi Guddeti',
    role: 'IT engineering, GDG TAE',
  },
];

// Hack2skill brand shades.
export const H2S = {
  blue: '#3463AF',
  indigo: '#2F3A96',
  violet: '#3C1B7E',
  deep: '#1D1236',
  cyan: '#32B7EC',
  ice: '#5FD4FF',
};

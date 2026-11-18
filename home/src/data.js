/* ============================================================
   SETTINGS: everything a non-developer may need to change.
   ============================================================ */

// Where the cities on the train come from. Nothing here needs code changes when a city is added.
//   On hack2skill.com the page reads Hack2skill's live event list directly.
//   Anywhere else, `npm run events` (also run before every build) saves that list as public/events.json.
//   Name each event on Hack2skill like "Futuready Builders Lab: Pune" so it is picked up.
export const EVENTS = {
  hack2skillApi: 'https://hack2skill.com/api/v1/innovator/public/event/list?page=1&records=100',
  match: 'futuready', // events whose title or link contains this word go on the train
  file: '/events.json',
};

// Used until (or unless) the live list arrives. status is worked out from the dates when left out:
// 'past' (it happened), 'open' (registrations open), 'soon' (announced, not open yet).
export const CITIES = [
  { city: 'Pune', campus: 'Trinity Academy of Engineering', date: '26 Oct 2026', status: 'past', url: './pune/' },
  { city: 'Mumbai', status: 'soon', url: './mumbai/' },
  { city: 'Ahmedabad', status: 'soon', url: './ahmedabad/' },
  { city: 'Jaipur', status: 'soon', url: './jaipur/' },
  { city: 'Delhi', status: 'soon', url: './delhi/' },
];

export const SUPPORT = 'support@hack2skill.com';
export const BRING_URL = 'mailto:support@hack2skill.com?subject=' + encodeURIComponent('Bring Futuready to my college');

// The five levels of Episode 01. Clear a level, earn a stamp.
export const LEVELS = [
  { k: 'R', name: 'Requirements', color: '#EF5F7B' },
  { k: 'E', name: 'Evaluate', color: '#2FBF8A' },
  { k: 'A', name: 'Architect', color: '#4C9DF0' },
  { k: 'D', name: 'Direct', color: '#F28C38' },
  { k: 'Y', name: 'You', color: '#E7B21C' },
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

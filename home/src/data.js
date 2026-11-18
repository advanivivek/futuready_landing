/* ============================================================
   SETTINGS: everything a non-developer may need to change.
   ============================================================ */

// The tour, in route order. status: 'past' (it happened), 'next' (dated), 'soon' (no date yet).
// url is that city's own page, where registration happens.
// lon/lat place the city on the route map.
export const CITIES = [
  { city: 'Pune', campus: 'Trinity Academy of Engineering', date: '26 Oct 2026', status: 'past', url: './pune/', lon: 73.86, lat: 18.52 },
  { city: 'Mumbai', status: 'soon', url: './mumbai/', lon: 72.88, lat: 19.08 },
  { city: 'Ahmedabad', status: 'soon', url: './ahmedabad/', lon: 72.57, lat: 23.02 },
  { city: 'Jaipur', status: 'soon', url: './jaipur/', lon: 75.79, lat: 26.91 },
  { city: 'Delhi', status: 'soon', url: './delhi/', lon: 77.21, lat: 28.61 },
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

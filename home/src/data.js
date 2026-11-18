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

// Real screens from the Builders Lab, as students saw them on their phones.
export const LAB = [
  { image: '/lab/01-join-phone.jpg', text: 'Join' },
  { image: '/lab/04-tools-phone.jpg', text: 'Confess' },
  { image: '/lab/06-bug1-phone.jpg', text: 'Hunt' },
  { image: '/lab/08-podium-phone.jpg', text: 'Climb' },
  { image: '/lab/boss-build.jpg', text: 'Build' },
  { image: '/lab/boss-card.jpg', text: 'Get scored' },
  { image: '/lab/passport-phone.jpg', text: 'Sign' },
];

// Real words from students at Futuready Builders Lab, Pune (LinkedIn posts, word for word).
export const VOICES = [
  'you don’t feel bored even for a second',
  'a builder rather than just a thinker',
  'informative and inspiring',
];
export const VOICE_NAMES = 'Swapnaja Waghapure, Durga Khadbade, Sneha Koul';

// Hack2skill brand shades.
export const H2S = {
  blue: '#3463AF',
  indigo: '#2F3A96',
  violet: '#3C1B7E',
  deep: '#1D1236',
  cyan: '#32B7EC',
  ice: '#5FD4FF',
};

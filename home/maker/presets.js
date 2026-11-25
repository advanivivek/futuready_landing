// The events the page maker starts with. New cities are added in the maker itself (they live in its browser storage).
import { HOSTED } from './sections.js';

const HOOK = 'AI writes most of the code today, so how will developers stay relevant in the future?';
const SUB = 'A free, interactive AI bootcamp to prepare developers for the future.';
export const PRESETS = {
  vadodara: { name: 'Parul University · Vadodara · 7 Dec', kind: 'campus', city: 'Vadodara', campus: 'Parul University', date: '2026-12-07', start: '12:45 PM', end: '3:30 PM', hello: '',
    hook: HOOK, sub: SUB, partnerLabel: 'Campus Organising Partner', stripUrl: HOSTED.parulStrip, stripW: 420, stripH: 52,
    // the two logos for the covers (a local file, kept out of the public repo; upload the logos in the maker otherwise)
    coverStrip: '/initiative/assets/made/vadodara-partner-logos.png', note: 'We will email you the hall before the day.',
    schedule: [
      { time: '12:45 – 1:00 PM', title: 'Arrival and registration', detail: 'Scan the QR code. Your name lights up the big screen.' },
      { time: '1:00 – 3:00 PM', title: 'Futuready hands-on bootcamp', detail: 'Five levels, live on your phone. Then the boss level: your squad builds with AI.' },
      { time: '3:00 – 3:15 PM', title: 'Q&A and group photograph', detail: '' },
      { time: '3:15 – 3:30 PM', title: 'Goodies and wrap-up', detail: '' }] },
  virtual: { name: 'Virtual (all sessions)', kind: 'virtual', city: '', campus: '', date: '', start: '', end: '', hello: 'Builders', hook: HOOK, sub: SUB, partnerLabel: '', stripUrl: '',
    note: 'Every session runs this way. The date, time and joining link reach you by email.',
    schedule: [
      { time: 'First 5 min', title: 'Join and say hi', detail: 'Open the link and scan the QR code. Your name lights up the shared screen.' },
      { time: 'Next 1 hr 45 min', title: 'Futuready hands-on bootcamp', detail: 'Five levels, live on your phone. Then the boss level: you build with AI.' },
      { time: 'Last 10 min', title: 'Q&A and your e-passport', detail: '' }] },
};

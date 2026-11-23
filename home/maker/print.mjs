// Prints a preset's paste-ready page sections, FAQs and email as JSON: node home/maker/print.mjs <preset> [strip-url]
import { sections, faqs, email } from './sections.js';
import { PRESETS } from './presets.js';
const [, , key = 'vadodara', strip] = process.argv;
const e = { ...PRESETS[key], ...(strip ? { stripUrl: strip } : {}) };
console.log(JSON.stringify({ sections: Object.fromEntries(sections(e).map(s => [s.key, s.html])), faqs: faqs(e), email: email(e) }));

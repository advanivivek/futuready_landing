// Prints a preset's paste-ready page sections, FAQs and email as JSON: node home/maker/print.mjs <preset> [html|lexical]
// html (the default) is for Hack2skill's Embed HTML editor; lexical is the older backup version.
import { sections, faqs, email } from './sections.js';
import { htmlSections } from './html.js';
import { PRESETS } from './presets.js';
const [, , key = 'vadodara', mode = 'html'] = process.argv;
const e = PRESETS[key];
const secs = mode === 'lexical' ? sections(e) : htmlSections(e);
console.log(JSON.stringify({ sections: Object.fromEntries(secs.map(s => [s.key, s.html])), faqs: faqs(e), email: email(e) }));

// Renders one designed block of a section into a transparent PNG for the Hack2skill page.
//   node home/initiative/shoot.mjs <section.html> <css selector> <out.png> <width> [selectors to hide, comma separated]
// Extra CSS for the shot (to re-lay a block for a picture) can be passed in the EXTRA_CSS environment variable.
// Needs Playwright: set PLAYWRIGHT to the path of playwright-core's index.mjs if it is not installed here.
const pw = process.env.PLAYWRIGHT || 'playwright-core';
const { chromium } = await import(pw);
const [, , file, sel, out, width, hide = ''] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +width, height: 1200 }, deviceScaleFactor: 2 });
await p.goto('file://' + file, { waitUntil: 'networkidle' });
await p.addStyleTag({ content: `html,body{margin:0;background:transparent!important}${hide ? hide + '{display:none!important}' : ''}${process.env.EXTRA_CSS || ''}` });
await p.evaluate(() => document.fonts.ready);
await p.evaluate(() => Promise.all([...document.images].map(i => { i.loading = 'eager'; return i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }); })));
await p.waitForTimeout(400);
await p.locator(sel).first().screenshot({ path: out, omitBackground: true });
await b.close();
console.log('saved', out);

/**
 * "Bring Futuready to your campus" requests, and the cities shown as "boarding soon" on the train:
 * one Google Sheet for both.
 *
 * Set up (about 5 minutes; the same steps are in START-HERE.md):
 *  1. Make a new Google Sheet. Extensions, Apps Script. Delete what is there, paste this file, Save.
 *  2. Deploy, New deployment, type "Web app". Execute as: Me. Who has access: Anyone. Deploy, allow access.
 *  3. Copy the web app link (it ends in /exec) into Vercel: Settings, Environment Variables, BRING_FORM_URL; redeploy.
 *
 * What you get:
 *  - "Requests": one row per request, newest at the bottom, with a filter on every column
 *    (click the small icon in a header to filter by college, city, role and so on).
 *  - "By campus": how many requests each college and city has, most first. It updates by itself.
 *  - "Cities": the cities on the main page's train. Tick "Show on the train" to show one, untick to hide it, or
 *    type a new city in a new row. With no page link it is "boarding soon"; paste its Hack2skill page link (and
 *    the campus) and it becomes a real stop with its date (read from the link). On the site within ~10 minutes.
 *    A city someone asks for is added by itself (unticked), with how many requests it has.
 * The same email asking for the same college twice is saved once.
 */
const SHEET = 'Requests';
const SUMMARY = 'By campus';
const HEAD = ['Time', 'College', 'City', 'Name', 'Role', 'Email', 'Phone', 'From page'];
const WIDTHS = [150, 280, 130, 180, 110, 230, 130, 220];
const ROLES = ['Student', 'Faculty', 'Management', 'Club lead', 'Other'];
const CITIES = 'Cities';
const START_CITIES = ['Mumbai', 'Ahmedabad', 'Jaipur', 'Delhi'];

// the "Cities" tab, made once
function cities_(ss) {
  let sh = ss.getSheetByName(CITIES);
  if (sh) return sh;
  sh = ss.insertSheet(CITIES);
  sh.getRange(1, 1, 1, 5).setValues([['City', 'Show on the train', 'Requests', 'Campus', 'Hack2skill page link (when it has one)']])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#161a3a');
  sh.setFrozenRows(1);
  [200, 150, 100, 240, 420].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.getRange('B2:B500').insertCheckboxes();
  if (START_CITIES.length) sh.getRange(2, 1, START_CITIES.length, 2).setValues(START_CITIES.map((c) => [c, true]));
  sh.getRange('C2').setFormula(`=ARRAYFORMULA(IF(A2:A="",,COUNTIF('${SHEET}'!C:C, A2:A)))`);
  return sh;
}

// the ticked cities, for the train: { city, campus?, link? }
function shown_(ss) {
  const sh = cities_(ss);
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues()
    .filter((r) => (String(r[0]).trim() || String(r[4]).trim()) && r[1] === true)
    .map((r) => {
      const c = { city: String(r[0]).trim() };
      if (String(r[3]).trim()) c.campus = String(r[3]).trim();
      if (/^https:\/\//.test(String(r[4]).trim())) c.link = String(r[4]).trim();
      return c;
    });
}

// a city someone asked for, added (unticked) if it is not there yet
function remember_(ss, city) {
  const sh = cities_(ss);
  const have = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map((r) => key_(r[0])) : [];
  if (have.indexOf(key_(city)) < 0) {
    const row = sh.getLastRow() + 1;
    sh.getRange(row, 1).setValue(city);
    sh.getRange(row, 2).setValue(false);
  }
}

function setup_(ss) {
  let sh = ss.getSheetByName(SHEET);
  if (sh) return sh;
  sh = ss.insertSheet(SHEET, 0);
  sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#161a3a').setVerticalAlignment('middle');
  sh.setRowHeight(1, 34);
  sh.setFrozenRows(1);
  WIDTHS.forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.getRange('A2:A').setNumberFormat('dd mmm yyyy, hh:mm');
  sh.getRange('B2:H').setWrap(false);
  sh.getRange('E2:E').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(ROLES, true).setAllowInvalid(true).build());
  sh.getRange(1, 1, sh.getMaxRows(), HEAD.length).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
  sh.getRange(1, 1, sh.getMaxRows(), HEAD.length).createFilter();
  // remove the empty first tab a new spreadsheet comes with
  const blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0) ss.deleteSheet(blank);

  const sum = ss.getSheetByName(SUMMARY) || ss.insertSheet(SUMMARY);
  sum.getRange('A1').setFormula(
    `=QUERY('${SHEET}'!B:D, "select B, C, count(D) where B is not null group by B, C order by count(D) desc label B 'College', C 'City', count(D) 'Requests'", 1)`
  );
  sum.getRange(1, 1, 1, 3).setFontWeight('bold').setFontColor('#ffffff').setBackground('#161a3a');
  sum.setFrozenRows(1);
  sum.setColumnWidth(1, 300);
  sum.setColumnWidth(2, 140);
  sum.setColumnWidth(3, 100);
  return sh;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

const key_ = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// The site's server asks this for the cities to show (a few times an hour); opening the link shows the same.
function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setup_(ss);
  return json_({ ok: true, cities: shown_(ss) });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse((e.postData && e.postData.contents) || '{}');
    const clean = (v, n) => String(v || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, n);
    const email = clean(d.email, 120).toLowerCase();
    const college = clean(d.college, 140);
    const city = clean(d.city, 60);
    const name = clean(d.name, 80);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !name || !college || !city) {
      return json_({ ok: false, error: 'Please fill your college, city, name and email.' });
    }
    const sh = setup_(SpreadsheetApp.getActiveSpreadsheet());
    const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, HEAD.length).getValues() : [];
    const seen = rows.some((r) => key_(r[1]) === key_(college) && String(r[5]).toLowerCase() === email);
    if (!seen) {
      const role = ROLES.indexOf(clean(d.role, 30)) >= 0 ? clean(d.role, 30) : 'Other';
      // a leading apostrophe stops a spreadsheet from treating text as a formula
      const safe = (v) => (/^[=+\-@]/.test(v) ? "'" + v : v);
      sh.appendRow([new Date(), safe(college), safe(city), safe(name), role, email,
        safe(clean(d.phone, 20)), clean(d.page, 200)]);
      remember_(SpreadsheetApp.getActiveSpreadsheet(), safe(city));
    }
    return json_({ ok: true, already: seen });
  } catch (err) {
    return json_({ ok: false, error: 'Something went wrong. Please try again.' });
  } finally {
    lock.releaseLock();
  }
}

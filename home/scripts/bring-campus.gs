/**
 * "Bring Futuready to your campus" requests, into a tidy Google Sheet.
 *
 * Set up (about 5 minutes; the same steps are in START-HERE.md):
 *  1. Make a new Google Sheet. Extensions, Apps Script. Delete what is there, paste this file, Save.
 *  2. Deploy, New deployment, type "Web app". Execute as: Me. Who has access: Anyone. Deploy, allow access.
 *  3. Copy the web app link (it ends in /exec) into BRING_FORM_URL in home/src/data.js.
 *
 * What you get:
 *  - "Requests": one row per request, newest at the bottom, with a filter on every column
 *    (click the small icon in a header to filter by college, city, role and so on).
 *  - "By campus": how many requests each college and city has, most first. It updates by itself.
 * The same email asking for the same college twice is saved once.
 */
const SHEET = 'Requests';
const SUMMARY = 'By campus';
const HEAD = ['Time', 'College', 'City', 'Name', 'Role', 'Email', 'Phone', 'LinkedIn', 'From page'];
const WIDTHS = [150, 280, 130, 180, 110, 230, 130, 230, 220];
const ROLES = ['Student', 'Faculty', 'Management', 'Club lead', 'Other'];

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
  sh.getRange('B2:I').setWrap(false);
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

// Opening the web app link in a browser shows how many requests there are.
function doGet() {
  const sh = setup_(SpreadsheetApp.getActiveSpreadsheet());
  return json_({ ok: true, requests: Math.max(0, sh.getLastRow() - 1) });
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
        safe(clean(d.phone, 20)), safe(clean(d.linkedin, 160)), clean(d.page, 200)]);
    }
    return json_({ ok: true, already: seen });
  } catch (err) {
    return json_({ ok: false, error: 'Something went wrong. Please try again.' });
  } finally {
    lock.releaseLock();
  }
}

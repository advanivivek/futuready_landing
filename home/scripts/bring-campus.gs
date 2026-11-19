/**
 * "Bring Futuready to your campus" requests, into a Google Sheet.
 * The main page posts each request here and shows how many people asked for the same campus.
 *
 * Set up (about 3 minutes; the same steps are in START-HERE.md):
 *  1. Make a new Google Sheet. Extensions, Apps Script. Delete what is there, paste this file, Save.
 *  2. Deploy, New deployment, type "Web app". Execute as: Me. Who has access: Anyone. Deploy, allow access.
 *  3. Copy the web app link (it ends in /exec) into BRING_FORM_URL in home/src/data.js.
 *
 * Each request is one row. The same email asking for the same campus twice counts once.
 */
const SHEET = 'Campus requests';
const HEAD = ['Time', 'Campus', 'City', 'Name', 'Role', 'Email', 'Phone', 'LinkedIn', 'Page'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.insertSheet(SHEET); sh.appendRow(HEAD); sh.setFrozenRows(1); }
  return sh;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

const key_ = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function doGet() {
  return json_({ total: Math.max(0, sheet_().getLastRow() - 1) });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse((e.postData && e.postData.contents) || '{}');
    const clean = (v, n) => String(v || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, n);
    const email = clean(d.email, 120).toLowerCase();
    const campus = clean(d.campus, 140);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !clean(d.name, 80) || !campus) {
      return json_({ ok: false, error: 'Please fill your campus, name and email.' });
    }
    const sh = sheet_();
    const rows = sh.getDataRange().getValues().slice(1);
    const same = rows.filter((r) => key_(r[1]) === key_(campus));
    const seen = same.some((r) => String(r[5]).toLowerCase() === email);
    if (!seen) {
      // a leading apostrophe stops a spreadsheet from treating text as a formula
      const safe = (v) => (/^[=+\-@]/.test(v) ? "'" + v : v);
      sh.appendRow([new Date(), safe(campus), safe(clean(d.city, 60)), safe(clean(d.name, 80)), clean(d.role, 30), email,
        safe(clean(d.phone, 20)), safe(clean(d.linkedin, 160)), clean(d.page, 200)]);
    }
    return json_({ ok: true, already: seen, count: same.length + (seen ? 0 : 1) });
  } catch (err) {
    return json_({ ok: false, error: 'Something went wrong. Please try again.' });
  } finally {
    lock.releaseLock();
  }
}

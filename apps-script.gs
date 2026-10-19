/**
 * Futuready pre-registrations into a Google Sheet, with a live headcount.
 * A stop-gap until Hack2skill wires the form to its own system.
 *
 * Set up (2 minutes):
 *  1. Make a new Google Sheet. Extensions, Apps Script. Paste this file. Save.
 *  2. Deploy, New deployment, type "Web app".
 *     Execute as: Me. Who has access: Anyone. Deploy, allow access.
 *  3. Copy the web app URL (it ends in /exec).
 *  4. In index.html, set both registerUrl and countUrl to that URL.
 *
 * Each pre-registration is one row. The same email for the same session
 * counts once. Opening the URL in a browser shows the headcount.
 */
const SHEET = 'Pre-registrations';
const HEAD = ['Time', 'Session', 'Name', 'Email', 'Phone', 'College', 'Year', 'Branch', 'City', 'Laptop', 'Consent', 'Page'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.insertSheet(SHEET); sh.appendRow(HEAD); sh.setFrozenRows(1); }
  return sh;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function counts_() {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const bySession = {};
  rows.forEach((r) => { bySession[r[1]] = (bySession[r[1]] || 0) + 1; });
  return { total: rows.length, bySession };
}

function doGet() {
  return json_(counts_());
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse((e.postData && e.postData.contents) || '{}');
    const clean = (v, n) => String(v || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, n);
    const email = clean(d.email, 120).toLowerCase();
    const session = clean(d.session, 60);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !clean(d.name, 80) || !session || d.consent !== true) {
      return json_({ ok: false, error: 'Please fill every field.' });
    }
    const sh = sheet_();
    const rows = sh.getDataRange().getValues().slice(1);
    const seen = rows.some((r) => String(r[3]).toLowerCase() === email && r[1] === session);
    if (!seen) {
      // a leading apostrophe stops a spreadsheet from treating text as a formula
      const safe = (v) => (/^[=+\-@]/.test(v) ? "'" + v : v);
      sh.appendRow([new Date(), session, safe(clean(d.name, 80)), email, safe(clean(d.phone, 15)), safe(clean(d.college, 120)),
        clean(d.year, 20), clean(d.branch, 30), safe(clean(d.city, 60)), d.laptop ? 'Yes' : 'No', 'Yes', clean(d.source, 200)]);
    }
    return json_({ ok: true, already: seen, ...counts_() });
  } catch (err) {
    return json_({ ok: false, error: 'Something went wrong.' });
  } finally {
    lock.releaseLock();
  }
}

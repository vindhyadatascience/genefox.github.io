/**
 * GeneFox signup collector — Google Apps Script Web App.
 * Appends voluntary email signups to a Google Sheet. No server/database to run.
 * Setup: see backend/SETUP.md.
 *
 * The website banner posts JSON as text/plain (a "simple" CORS request, no preflight)
 * and never reads the response (mode:"no-cors"), so this endpoint needs no CORS headers.
 */

var SHEET_ID   = "PASTE_YOUR_SHEET_ID";   // from the Sheet URL: /spreadsheets/d/<SHEET_ID>/edit
var SHEET_NAME = "signups";
var EMAIL_RE   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function doPost(e) {
  try {
    var data = {};
    try { data = JSON.parse((e && e.postData && e.postData.contents) || "{}"); } catch (err) {}

    var email = String(data.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return _json({ ok: false, error: "invalid_email" });
    }
    var source = String(data.source || "website").slice(0, 40);

    // One writer at a time so concurrent submits can't collide on the dedup scan.
    var lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
      if (sh.getLastRow() === 0) sh.appendRow(["timestamp", "email", "source"]);

      var last = sh.getLastRow();
      var existing = last > 1
        ? sh.getRange(2, 2, last - 1, 1).getValues().map(function (r) { return String(r[0]).toLowerCase(); })
        : [];
      if (existing.indexOf(email) === -1) {
        // Neutralize CSV/formula injection: a cell starting with = + - @ etc. is
        // prefixed with ' so Sheets stores it as literal text, never a formula.
        sh.appendRow([new Date(), _cell(email), _cell(source)]);
      }
    } finally {
      lock.releaseLock();
    }
    return _json({ ok: true });
  } catch (err) {
    console.error(err);                 // detail stays server-side (Apps Script logs)
    return _json({ ok: false, error: "server_error" });
  }
}

// Health check: open the /exec URL in a browser to confirm the deployment is live.
function doGet() {
  return _json({ ok: true, service: "genefox-signup" });
}

// Prefix formula/CSV-injection triggers with an apostrophe so the Sheet keeps them as text.
function _cell(v) {
  v = String(v);
  // Strip leading whitespace before testing so " =FORMULA" can't slip past when the
  // Sheet is exported and re-opened elsewhere; keep the raw value, only prefix it.
  return /^[=+\-@]/.test(v.replace(/^\s+/, "")) ? "'" + v : v;
}

function _json(o) {
  return ContentService
    .createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Myynd waitlist → Google Sheet.
 *
 * Paste this into the sheet's Extensions › Apps Script, then
 * Deploy › New deployment › Web app (Execute as: Me, Who has access: Anyone).
 * The page posts { email, source } here; each sign-up becomes one row.
 */

const SHEET_NAME = "Waitlist";

function doPost(e) {
  const email = String((e.parameter && e.parameter.email) || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) {
    return reply({ ok: false, error: "invalid_email" });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet();
    const emails = sheet.getLastRow() > 1
      ? sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues().flat()
      : [];
    if (emails.indexOf(email) !== -1) return reply({ ok: true, duplicate: true });

    const source = String((e.parameter && e.parameter.source) || "").slice(0, 120);
    sheet.appendRow([new Date(), email, source]);
    return reply({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
    sheet.appendRow(["Signed up", "Email", "Source"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

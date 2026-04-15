/**
 * EasyRide Support Tracker — Google Apps Script
 * Handles both "Support" sheet and "Tracker of Acknowledgement rider of Trips" sheet
 */

var DEFAULT_SHEET = "Support";

function getSheetByName(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name || DEFAULT_SHEET);
  if (!sheet) throw new Error("Sheet not found: " + (name || DEFAULT_SHEET));
  return sheet;
}

/**
 * Sanitize header: replace newlines with spaces and trim
 * This handles multi-line headers in Google Sheets
 */
function cleanHeader(h) {
  return String(h).replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
}

function doGet(e) {
  var sheetName = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : DEFAULT_SHEET;
  var sheet = getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
  }
  var headers = data[0].map(cleanHeader);
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return ContentService.createTextOutput(JSON.stringify(rows)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var sheetName = body.sheet || DEFAULT_SHEET;
  var sheet = getSheetByName(sheetName);
  var rawHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var headers = rawHeaders.map(cleanHeader);

  // DELETE
  if (body.action === "delete") {
    var delRow = body.row + 2; // +2 because row index is 0-based and row 1 is header
    if (delRow > 1 && delRow <= sheet.getLastRow()) {
      sheet.deleteRow(delRow);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "deleted" })).setMimeType(ContentService.MimeType.JSON);
  }

  // UPDATE
  if (body.action === "update") {
    var updateRow = body.row + 2;
    if (updateRow > 1 && updateRow <= sheet.getLastRow()) {
      var vals = [];
      for (var i = 0; i < headers.length; i++) {
        vals.push(body[headers[i]] !== undefined ? body[headers[i]] : "");
      }
      sheet.getRange(updateRow, 1, 1, headers.length).setValues([vals]);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "updated" })).setMimeType(ContentService.MimeType.JSON);
  }

  // CREATE (append new row)
  var newRow = [];
  for (var i = 0; i < headers.length; i++) {
    newRow.push(body[headers[i]] !== undefined ? body[headers[i]] : "");
  }
  sheet.appendRow(newRow);
  return ContentService.createTextOutput(JSON.stringify({ status: "created" })).setMimeType(ContentService.MimeType.JSON);
}

const STATUS_ORDER = ["Open", "In Progress", "Escalated", "Resolved"];

const STATUS_STYLES = {
  Open: "bg-slate-100 text-slate-600 border-slate-200",
  "In Progress": "bg-blue-50 text-blue-600 border-blue-200",
  Escalated: "bg-amber-50 text-amber-700 border-amber-200",
  Resolved: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

const STAFF_LIST = ["Nora", "Amy", "Aqilah", "Dominic", "Zaid", "Hanif", "Alex", "Mike"];

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxthGdptwZIe_CpfdRtmjqEM-qZHNyhWK9Ogw7zFVONgKwl6Jv7SmU0QNODXITTFIrVkw/exec";

function ticketToSheetData(ticket) {
  return {
    riderNo: ticket.riderNo,
    riderName: ticket.riderName,
    issue: ticket.issue,
    timestampReceived: ticket.timestampReceived || "",
    acknowledged: ticket.acknowledged ? "Done" : "",
    responsiblePerson: ticket.responsiblePerson || "",
    escalatedTo: ticket.escalatedTo || "",
    solution: ticket.solution || "",
    status: ticket.status,
    timestampSolved: ticket.timestampSolved || "",
    duration: ticket.duration || ticket.importedDurationLabel || "",
  };
}

function sheetFetch(url, options) {
  var attempts = 0;
  function attempt() {
    attempts++;
    return fetch(url, options).catch(function (err) {
      if (attempts < 3) {
        return new Promise(function (r) { setTimeout(r, attempts * 1000); }).then(attempt);
      }
      throw err;
    });
  }
  return attempt();
}

function sendTicketToSheet(ticket) {
  return sheetFetch(SHEET_URL, { method: "POST", body: JSON.stringify(ticketToSheetData(ticket)) });
}

function updateTicketInSheet(ticket) {
  var data = ticketToSheetData(ticket);
  data.action = "update";
  data.row = ticket.sheetRow;
  return sheetFetch(SHEET_URL, { method: "POST", body: JSON.stringify(data) });
}

function deleteTicketFromSheet(sheetRow) {
  return sheetFetch(SHEET_URL, { method: "POST", body: JSON.stringify({ action: "delete", row: sheetRow }) });
}

function fetchSheetData() {
  return sheetFetch(SHEET_URL)
    .then(function (res) { return res.json(); })
    .then(function (tickets) {
      return tickets.map(function (row, index) {
        var acknowledged = String(row.acknowledged || "").toLowerCase() === "done";
        var status = row.status || "Open";
        if (STATUS_ORDER.indexOf(status) === -1) status = "Open";
        return {
          sheetRow: index,
          id: "TKT-" + String(index + 1).padStart(4, "0"),
          riderNo: row.riderNo || "",
          riderName: row.riderName || "",
          issue: row.issue || "",
          timestampReceived: row.timestampReceived || "",
          acknowledged: acknowledged,
          acknowledgedAt: acknowledged ? row.timestampReceived : "",
          responsiblePerson: row.responsiblePerson || "",
          escalatedTo: (row.escalatedTo || "").trim(),
          solution: row.solution || "",
          status: status,
          timestampSolved: row.timestampSolved || "",
          comments: [],
          importedDurationLabel: row.duration || undefined,
          importedDurationDays: parseDurationLabelToDays(row.duration),
        };
      });
    });
}

/* ── Acknowledgement Tracker (sheet: "Tracker of Acknowledgement rider of Trips") ── */
var ACK_SHEET_URL = "https://script.google.com/macros/s/AKfycbyPTtRzdjWFVAW-vji09SdBiwke6tUadvWSJsrjSYcp7ov_tRlReapty04k_jEXl4zY/exec";
var ACK_SHEET_NAME = "Tracker of Acknowledgement rider of Trips";

/* Maps clean JS keys ↔ actual spreadsheet header names */
var ACK_H = {
  riderNo:        "Easyride Rider No.",
  shortName:      "Short Name",
  fullName:       "Full Name",
  confirmation:   "Confirmation",
  proofReminder1: "Proof Reminder 1 (During First Imterview)",
  proofReminder2: "Proof Reminder 2 (During Grab Account Setup)",
  proofReminder3: "Proof Reminder 3 (During Co-Pilot Training and in informed in Group chat)",
  reminderDate:   "Wed Apr 01 2026 11:59:00 GMT+0700 (Waktu Indochina)",
  evaCheck:       "Eva - 8 April 2044",
  trainerSignOff: "Trainer and Checker Sign Off (Name - Day and Time)",
};

function ackToSheetData(entry) {
  var d = { sheet: ACK_SHEET_NAME };
  d[ACK_H.riderNo]        = entry.riderNo;
  d[ACK_H.shortName]      = entry.shortName;
  d[ACK_H.fullName]       = entry.fullName;
  d[ACK_H.confirmation]   = entry.confirmation || "";
  d[ACK_H.proofReminder1] = entry.proofReminder1 || "";
  d[ACK_H.proofReminder2] = entry.proofReminder2 || "";
  d[ACK_H.proofReminder3] = entry.proofReminder3 || "";
  d[ACK_H.reminderDate]   = entry.reminderDate || "";
  d[ACK_H.evaCheck]       = entry.evaCheck || "";
  d[ACK_H.trainerSignOff] = entry.trainerSignOff || "";
  return d;
}

function sendAckToSheet(entry) {
  return sheetFetch(ACK_SHEET_URL, { method: "POST", body: JSON.stringify(ackToSheetData(entry)) });
}

function updateAckInSheet(entry) {
  var data = ackToSheetData(entry);
  data.action = "update";
  data.row = entry.sheetRow;
  return sheetFetch(ACK_SHEET_URL, { method: "POST", body: JSON.stringify(data) });
}

function deleteAckFromSheet(sheetRow) {
  return sheetFetch(ACK_SHEET_URL, { method: "POST", body: JSON.stringify({ action: "delete", row: sheetRow, sheet: ACK_SHEET_NAME }) });
}

function fetchAckData() {
  return sheetFetch(ACK_SHEET_URL + "?sheet=" + encodeURIComponent(ACK_SHEET_NAME))
    .then(function (res) { return res.json(); })
    .then(function (rows) {
      return rows.map(function (row, index) {
        var conf = String(row[ACK_H.confirmation] || "").trim().toLowerCase();
        return {
          sheetRow: index,
          id: "ACK-" + String(index + 1).padStart(4, "0"),
          riderNo:        row[ACK_H.riderNo] || "",
          shortName:      row[ACK_H.shortName] || "",
          fullName:       row[ACK_H.fullName] || "",
          confirmation:   row[ACK_H.confirmation] || "",
          confirmed:      conf === "yes" || conf === "done" || conf === "confirmed",
          proofReminder1: row[ACK_H.proofReminder1] || "",
          proofReminder2: row[ACK_H.proofReminder2] || "",
          proofReminder3: row[ACK_H.proofReminder3] || "",
          reminderDate:   row[ACK_H.reminderDate] || "",
          evaCheck:       row[ACK_H.evaCheck] || "",
          trainerSignOff: row[ACK_H.trainerSignOff] || "",
        };
      });
    });
}

const STATUS_ORDER = ["Open", "In Progress", "Escalated", "Resolved"];

const STATUS_STYLES = {
  Open: "bg-slate-50 text-slate-600 border-slate-200",
  "In Progress": "bg-blue-50 text-blue-600 border-blue-200",
  Escalated: "bg-amber-50 text-amber-600 border-amber-200",
  Resolved: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxthGdptwZIe_CpfdRtmjqEM-qZHNyhWK9Ogw7zFVONgKwl6Jv7SmU0QNODXITTFIrVkw/exec";

function ticketToSheetData(ticket) {
  return {
    riderNo: ticket.riderNo,
    riderName: ticket.riderName,
    issue: ticket.issue,
    timestampReceived: ticket.timestampReceived || "",
    acknowledged: ticket.acknowledged || "",
    responsiblePerson: ticket.responsiblePerson || "",
    escalatedTo: ticket.escalatedTo || "",
    solution: ticket.solution || "",
    status: ticket.status,
    timestampSolved: ticket.timestampSolved || "",
    duration: ticket.duration || ""
  };
}

function sendTicketToSheet(ticket) {
  return fetch(SHEET_URL, {
    method: "POST",
    body: JSON.stringify(ticketToSheetData(ticket)),
  }).catch(function (err) { console.error("Failed to write to sheet:", err); });
}

function updateTicketInSheet(ticket) {
  var data = ticketToSheetData(ticket);
  data.action = "update";
  data.row = ticket.sheetRow;
  return fetch(SHEET_URL, {
    method: "POST",
    body: JSON.stringify(data),
  }).catch(function (err) { console.error("Failed to update sheet:", err); });
}

function deleteTicketFromSheet(sheetRow) {
  return fetch(SHEET_URL, {
    method: "POST",
    body: JSON.stringify({ action: "delete", row: sheetRow }),
  }).catch(function (err) { console.error("Failed to delete from sheet:", err); });
}

function fetchSheetData() {
  return fetch(SHEET_URL)
    .then(function (res) { return res.json(); })
    .then(function (tickets) {
      return tickets.map(function (row, index) {
        var acknowledged = String(row.acknowledged || "").toLowerCase() === "done";
        var status = row.status || "Open";
        if (["Open", "In Progress", "Escalated", "Resolved"].indexOf(status) === -1) status = "Open";
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

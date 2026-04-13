const STATUS_ORDER = ["Open", "In Progress", "Escalated", "Resolved"];
const CATEGORIES = ["Account", "Payment", "App Issue", "Vehicle", "Others"];

const STATUS_STYLES = {
  Open: "bg-slate-100 text-slate-700 border-slate-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  Escalated: "bg-orange-100 text-orange-700 border-orange-200",
  Resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS05MePtZD30llXOsxZLoJKFXDMd1hhWILUffi2HFRGR07ayEOQZbugrJK6Bud9-ADu0xiipgnsEwh6/pub?output=csv";
const SHEET_WRITE_URL = "https://script.google.com/macros/s/AKfycbxthGdptwZIe_CpfdRtmjqEM-qZHNyhWK9Ogw7zFVONgKwl6Jv7SmU0QNODXITTFIrVkw/exec";

function parseCSV(text) {
  var rows = [];
  var row = [];
  var field = "";
  var inQuotes = false;
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(field.trim()); field = ""; }
      else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        if (ch === '\r') i++;
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = "";
      } else { field += ch; }
    }
  }
  if (field || row.length) { row.push(field.trim()); rows.push(row); }
  return rows;
}

function sheetRowToTicket(row, index) {
  var riderNo = row[0] || "";
  var riderName = row[1] || "";
  var issue = row[2] || "";
  var timestampReceived = row[3] || "";
  var acknowledged = (row[4] || "").toLowerCase() === "done";
  var responsiblePerson = row[5] || "";
  var escalatedTo = (row[6] || "").trim();
  var solution = row[7] || "";
  var status = row[8] || "Open";
  var timestampSolved = row[9] || "";
  var durationLabel = row[10] || "";

  if (["Open", "In Progress", "Escalated", "Resolved"].indexOf(status) === -1) status = "Open";

  return {
    id: "TKT-" + String(index + 1).padStart(4, "0"),
    riderNo: riderNo,
    riderName: riderName,
    issue: issue,
    category: "Others",
    timestampReceived: timestampReceived,
    acknowledged: acknowledged,
    acknowledgedAt: acknowledged ? timestampReceived : "",
    responsiblePerson: responsiblePerson,
    escalatedTo: escalatedTo,
    solution: solution,
    status: status,
    timestampSolved: timestampSolved,
    description: issue,
    comments: [],
    lastUpdated: timestampSolved || timestampReceived,
    importedDurationLabel: durationLabel || undefined,
    importedDurationDays: parseDurationLabelToDays(durationLabel),
  };
}

function sendTicketToSheet(ticket) {
  return fetch(SHEET_WRITE_URL, {
    method: "POST",
    body: JSON.stringify({
      riderNo: ticket.riderNo,
      riderName: ticket.riderName,
      issue: ticket.issue,
      timestampReceived: ticket.timestampReceived || "",
      acknowledged: ticket.acknowledged || "",
      responsiblePerson: ticket.responsiblePerson,
      escalatedTo: ticket.escalatedTo,
      solution: ticket.solution || "",
      status: ticket.status,
      timestampSolved: ticket.timestampSolved || "",
      duration: ticket.duration || ""
    }),
  }).catch(function (err) { console.error("Failed to write to sheet:", err); });
}

function fetchSheetData() {
  return fetch(SHEET_WRITE_URL)
    .then(function (res) { return res.json(); })
    .then(function (tickets) {
      return tickets.map(function (row, index) {
        var acknowledged = String(row.acknowledged || "").toLowerCase() === "done";
        var status = row.status || "Open";
        if (["Open", "In Progress", "Escalated", "Resolved"].indexOf(status) === -1) status = "Open";
        return {
          id: "TKT-" + String(index + 1).padStart(4, "0"),
          riderNo: row.riderNo || "",
          riderName: row.riderName || "",
          issue: row.issue || "",
          category: "Others",
          timestampReceived: row.timestampReceived || "",
          acknowledged: acknowledged,
          acknowledgedAt: acknowledged ? row.timestampReceived : "",
          responsiblePerson: row.responsiblePerson || "",
          escalatedTo: (row.escalatedTo || "").trim(),
          solution: row.solution || "",
          status: status,
          timestampSolved: row.timestampSolved || "",
          description: row.issue || "",
          comments: [],
          lastUpdated: row.timestampSolved || row.timestampReceived || "",
          importedDurationLabel: row.duration || undefined,
          importedDurationDays: parseDurationLabelToDays(row.duration),
        };
      });
    });
}

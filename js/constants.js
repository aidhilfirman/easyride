const STATUS_ORDER = ["Open", "In Progress", "Escalated", "Resolved"];

const STATUS_STYLES = {
  Open: "bg-slate-100 text-slate-700 border-slate-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  Escalated: "bg-orange-100 text-orange-700 border-orange-200",
  Resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxthGdptwZIe_CpfdRtmjqEM-qZHNyhWK9Ogw7zFVONgKwl6Jv7SmU0QNODXITTFIrVkw/exec";

function sendTicketToSheet(ticket) {
  return fetch(SHEET_URL, {
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
  return fetch(SHEET_URL)
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

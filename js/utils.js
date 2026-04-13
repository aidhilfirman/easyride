function parseDurationLabelToDays(label) {
  if (!label) return null;
  const raw = String(label).trim().toLowerCase();
  if (!raw) return null;
  if (raw === "same day") return 0.5;
  const cleaned = raw.split("").filter((ch) => (ch >= "0" && ch <= "9") || ch === ".").join("");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (Number.isNaN(value)) return null;
  if (raw.includes("week")) return value * 7;
  if (raw.includes("day")) return value;
  return value;
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return "\u2014";
  return date.toLocaleString([], { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function getDurationDays(ticket, nowMs) {
  if (ticket.status === "Resolved") {
    if (typeof ticket.importedDurationDays === "number") return ticket.importedDurationDays;
    const start = toDate(ticket.timestampReceived);
    const end = toDate(ticket.timestampSolved);
    if (!start || !end) return 0;
    return Math.max(0, (end.getTime() - start.getTime()) / 86400000);
  }
  const start = toDate(ticket.timestampReceived);
  if (!start) return 0;
  return Math.max(0, (nowMs - start.getTime()) / 86400000);
}

function formatDuration(ticket, nowMs) {
  if (ticket.status === "Resolved" && ticket.importedDurationLabel) return ticket.importedDurationLabel;
  const days = getDurationDays(ticket, nowMs);
  const label = days.toFixed(1) + "d";
  return ticket.status === "Resolved" ? label : "Ongoing \u2022 " + label;
}

function getWarningLevel(ticket, nowMs) {
  if (ticket.status === "Resolved") return "none";
  const days = getDurationDays(ticket, nowMs);
  if (days > 3) return "critical";
  if (days > 2) return "warning";
  return "none";
}

function makeId() {
  return "TKT-" + Math.floor(1000 + Math.random() * 9000);
}


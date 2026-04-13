const STATUS_ORDER = ["Open", "In Progress", "Escalated", "Resolved"];
const CATEGORIES = ["Account", "Payment", "App Issue", "Vehicle", "Others"];

const STATUS_STYLES = {
  Open: "bg-slate-100 text-slate-700 border-slate-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  Escalated: "bg-orange-100 text-orange-700 border-orange-200",
  Resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const IMPORTED_ROWS = [
  ["TKT-1001", "Rider 094", "Khairul", "Incomplete onboarding documents (missing SG Class 2B, log card, insurance)", "Account", "2025-01-09T00:00:00", true, "Ally", "", "Follow-up checklist, partial documents submitted, continued onboarding", "Resolved", "2025-01-09T12:00:00", "Same day"],
  ["TKT-1002", "Rider 094", "Khairul", "Grab account setup issue (login / loading error)", "Account", "2025-01-09T00:00:00", true, "Ally / Dominic", "Grab", "Reinstall app, switch email, resubmit documents", "Resolved", "2025-01-09T16:00:00", "~1 day"],
  ["TKT-1003", "Rider 102", "Samsul", "App error and unable to proceed onboarding", "App Issue", "2025-01-10T00:00:00", true, "Dominic", "Grab", "Resubmission + backend refresh + follow-up", "Resolved", "2025-01-10T18:00:00", "Same day"],
  ["TKT-1004", "Rider 081", "Chan Sikeen", "Appeal for incentive exception after cancellation penalty", "Payment", "2025-01-11T00:00:00", true, "Team", "Grab Finance", "Escalated to Grab for review; outcome aligned with policy", "Resolved", "2025-04-11T00:00:00", "72 days"],
  ["TKT-1005", "Rider 066", "Izzatul", "Bank account issue causing payout risk", "Payment", "2025-01-11T00:00:00", true, "Dominic / Ally", "", "Requested bank account correction and update verification", "Resolved", "2025-01-11T08:00:00", "1 day"],
  ["TKT-1006", "Rider 040", "Fauzan", "Insurance does not cover food delivery", "Vehicle", "2025-01-12T00:00:00", false, "Dominic", "Insurance / Grab", "Pending clarification and policy confirmation", "Escalated", "", ""],
  ["TKT-1007", "Rider 069", "Azrul", "HR admin friction with repeated requests", "Account", "2025-08-24T00:00:00", false, "Admin", "", "Follow-up still ongoing on document handling", "In Progress", "", ""],
  ["TKT-1008", "Rider 048", "Razif", "Did not submit required HR documents", "Account", "2025-08-24T00:00:00", false, "Admin", "", "Awaiting rider submission", "Open", "", ""],
];

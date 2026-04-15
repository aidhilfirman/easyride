const { useState, useEffect, useMemo } = React;

/* ── Error Boundary ── */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-500 flex items-center justify-center text-2xl font-bold mx-auto mb-4">!</div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-500 mb-4">{(this.state.error && this.state.error.message) || "Unexpected error"}</p>
            <button onClick={() => this.setState({ hasError: false, error: null })} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition">Try Again</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Stat Card ── */
function StatCard({ title, value, hint, accent }) {
  return (
    <div className={"rounded-2xl border p-4 md:p-5 shadow-sm transition hover:shadow-md " + (accent || "border-slate-200/60 bg-white")}>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</div>
      <div className="mt-1.5 text-2xl md:text-3xl font-bold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

/* ── Badge ── */
function Badge({ children, tone }) {
  return <span className={"inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap " + tone}>{children}</span>;
}

/* ── Toasts ── */
function Toasts({ items }) {
  if (!items.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {items.map(function (t) {
        return (
          <div key={t.id} className={"rounded-xl px-4 py-3 text-sm text-white shadow-lg " + (t.type === "error" ? "bg-red-500" : "bg-emerald-500")}>
            {t.message}
          </div>
        );
      })}
    </div>
  );
}

/* ── Ticket Drawer (slide-out detail panel) ── */
function TicketDrawer({ ticket, onClose, onChange, onSave, onDelete, onAddComment, staffOptions, currentUser, nowMs }) {
  const [commentText, setCommentText] = useState("");
  const [editing, setEditing] = useState(false);
  useEffect(function () { setCommentText(""); setEditing(false); }, [ticket ? ticket.id : ""]);
  if (!ticket) return null;

  var fc = "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition ";
  var fieldClass = fc + (editing ? "border-slate-200 bg-slate-50/50 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" : "border-slate-100 bg-slate-50/30 text-slate-900 cursor-default");
  var warn = getWarningLevel(ticket, nowMs);
  var ro = !editing;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone="bg-indigo-50 text-indigo-600 border-indigo-200">{ticket.id}</Badge>
              <Badge tone={STATUS_STYLES[ticket.status]}>{ticket.status}</Badge>
              {warn === "critical" && <Badge tone="bg-rose-50 text-rose-600 border-rose-200">SLA Breach</Badge>}
              {warn === "warning" && <Badge tone="bg-amber-50 text-amber-600 border-amber-200">SLA Warning</Badge>}
            </div>
            <h2 className="mt-3 text-lg font-semibold text-slate-900 leading-snug">{ticket.issue || "Untitled ticket"}</h2>
            <div className="mt-1 text-xs text-slate-400">{formatDuration(ticket, nowMs)}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={function () { setEditing(!editing); }} className={"rounded-xl border px-3.5 py-2 text-sm font-medium transition " + (editing ? "border-indigo-300 bg-indigo-50 text-indigo-600" : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600")}>
              <svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>{editing ? "Editing" : "Edit"}
            </button>
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Rider No.</div><input readOnly={ro} value={ticket.riderNo || ""} onChange={(e) => onChange(ticket.id, { riderNo: e.target.value })} className={fieldClass} /></label>
            <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Rider Name</div><input readOnly={ro} value={ticket.riderName || ""} onChange={(e) => onChange(ticket.id, { riderName: e.target.value })} className={fieldClass} /></label>
            <label className="text-sm sm:col-span-2"><div className="mb-1.5 font-medium text-slate-600">Issue</div><input readOnly={ro} value={ticket.issue || ""} onChange={(e) => onChange(ticket.id, { issue: e.target.value })} className={fieldClass} /></label>
            <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Received</div><input readOnly={ro} value={ticket.timestampReceived || ""} onChange={(e) => onChange(ticket.id, { timestampReceived: e.target.value })} className={fieldClass} /></label>
            <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Acknowledged</div><select disabled={ro} value={ticket.acknowledged ? "Done" : ""} onChange={(e) => onChange(ticket.id, { acknowledged: e.target.value === "Done" })} className={fieldClass}><option value="">Not yet</option><option value="Done">Done</option></select></label>
            <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Responsible Person</div><input readOnly={ro} list={editing ? "staff-opts" : undefined} value={ticket.responsiblePerson || ""} onChange={(e) => onChange(ticket.id, { responsiblePerson: e.target.value })} className={fieldClass} /></label>
            <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Escalated to</div><input readOnly={ro} list={editing ? "staff-opts" : undefined} value={ticket.escalatedTo || ""} onChange={(e) => onChange(ticket.id, { escalatedTo: e.target.value })} className={fieldClass} /></label>
            <label className="text-sm sm:col-span-2"><div className="mb-1.5 font-medium text-slate-600">Solution</div><input readOnly={ro} value={ticket.solution || ""} onChange={(e) => onChange(ticket.id, { solution: e.target.value })} className={fieldClass} /></label>
            <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Status</div><select disabled={ro} value={ticket.status} onChange={(e) => onChange(ticket.id, { status: e.target.value })} className={fieldClass}>{STATUS_ORDER.map(function (s) { return <option key={s} value={s}>{s}</option>; })}</select></label>
            <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Solved At</div><input readOnly={ro} value={ticket.timestampSolved || ""} onChange={(e) => onChange(ticket.id, { timestampSolved: e.target.value })} className={fieldClass} /></label>
            <label className="text-sm sm:col-span-2"><div className="mb-1.5 font-medium text-slate-600">Duration</div><input readOnly={ro} value={ticket.importedDurationLabel || ""} onChange={(e) => onChange(ticket.id, { importedDurationLabel: e.target.value, duration: e.target.value })} placeholder={editing ? "e.g. 3 days, Same day" : ""} className={fieldClass} /></label>
          </div>

          {/* Internal Notes */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Internal Notes</h4>
            <div className="space-y-3">
              {ticket.comments.length ? ticket.comments.map(function (c) {
                return (
                  <div key={c.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-slate-700">{c.author}</div>
                      <div className="text-xs text-slate-400">{formatDateTime(c.createdAt)}</div>
                    </div>
                    <div className="mt-1.5 text-sm text-slate-600">{c.text}</div>
                  </div>
                );
              }) : <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">No notes yet.</div>}
              <div className="rounded-xl border border-slate-200 p-3">
                <textarea rows={2} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a note..." className={"mb-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"} />
                <div className="flex justify-end">
                  <button type="button" onClick={function () {
                    if (!commentText.trim()) return;
                    onAddComment(ticket.id, { id: "C-" + Date.now(), author: currentUser || "Staff", text: commentText.trim(), createdAt: new Date().toISOString() });
                    setCommentText("");
                  }} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition">Add Note</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <button type="button" onClick={function () { if (confirm("Delete this ticket? This will also remove it from the spreadsheet.")) onDelete(ticket.id); }} className="rounded-xl px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition">Delete</button>
          {editing ? (
            <button type="button" onClick={function () { onSave(ticket.id); setEditing(false); onClose(); }} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all">Save to Spreadsheet</button>
          ) : (
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Close</button>
          )}</div>

        <datalist id="staff-opts">{staffOptions.map(function (n) { return <option key={n} value={n} />; })}</datalist>
      </div>
    </div>
  );
}

/* ── Ack Drawer (slide-out detail panel for acknowledgement tracker) ── */
function AckDrawer({ entry, onClose, onChange, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  useEffect(function () { setEditing(false); }, [entry ? entry.id : ""]);
  if (!entry) return null;

  var fc = "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition ";
  var fieldClass = fc + (editing ? "border-slate-200 bg-slate-50/50 focus:border-teal-400 focus:ring-1 focus:ring-teal-400" : "border-slate-100 bg-slate-50/30 text-slate-900 cursor-default");
  var ro = !editing;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone="bg-teal-50 text-teal-600 border-teal-200">{entry.id}</Badge>
              {entry.confirmed ? <Badge tone="bg-emerald-50 text-emerald-600 border-emerald-200">Confirmed</Badge> : <Badge tone="bg-amber-50 text-amber-600 border-amber-200">Pending</Badge>}
            </div>
            <h2 className="mt-3 text-lg font-semibold text-slate-900 leading-snug">{entry.fullName || entry.shortName || "Unnamed Rider"}</h2>
            <div className="mt-1 text-xs text-slate-400">Rider {entry.riderNo}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={function () { setEditing(!editing); }} className={"rounded-xl border px-3.5 py-2 text-sm font-medium transition " + (editing ? "border-teal-300 bg-teal-50 text-teal-600" : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-teal-300 hover:text-teal-600")}>
              <svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>{editing ? "Editing" : "Edit"}
            </button>
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Rider Info */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Rider Info</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Rider No.</div><input readOnly={ro} value={entry.riderNo || ""} onChange={(e) => onChange(entry.id, { riderNo: e.target.value })} className={fieldClass} /></label>
              <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Short Name</div><input readOnly={ro} value={entry.shortName || ""} onChange={(e) => onChange(entry.id, { shortName: e.target.value })} className={fieldClass} /></label>
              <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Full Name</div><input readOnly={ro} value={entry.fullName || ""} onChange={(e) => onChange(entry.id, { fullName: e.target.value })} className={fieldClass} /></label>
            </div>
          </div>
          {/* Confirmation */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Confirmation</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Confirmation</div><input readOnly={ro} value={entry.confirmation || ""} onChange={(e) => onChange(entry.id, { confirmation: e.target.value, confirmed: e.target.value.toLowerCase() === "yes" || e.target.value.toLowerCase() === "confirmed" || e.target.value.toLowerCase() === "done" })} placeholder={editing ? "e.g. Yes, No, Pending" : ""} className={fieldClass} /></label>
              <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Reminder (1 Apr 2026)</div><input readOnly={ro} value={entry.reminderDate || ""} onChange={(e) => onChange(entry.id, { reminderDate: e.target.value })} className={fieldClass} /></label>
            </div>
          </div>
          {/* Proof Reminders */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Proof of Reminders</h4>
            <div className="grid grid-cols-1 gap-4">
              {[
                { key: "proofReminder1", label: "Reminder 1 — First Interview" },
                { key: "proofReminder2", label: "Reminder 2 — Grab Account Setup" },
                { key: "proofReminder3", label: "Reminder 3 — Co-Pilot Training / Group Chat" },
              ].map(function (f) {
                var val = entry[f.key] || "";
                var isImage = val && typeof val === "string" && (val.startsWith("http") && (val.includes("googleusercontent.com") || val.match(/\.(png|jpg|jpeg|gif|webp)/i)));
                return (
                  <div key={f.key} className="text-sm">
                    <div className="mb-1.5 font-medium text-slate-600">{f.label}</div>
                    {isImage ? (
                      <a href={val} target="_blank" rel="noopener noreferrer">
                        <img src={val} alt={f.label} className="max-w-full max-h-48 rounded-xl border border-slate-200 object-contain cursor-pointer hover:shadow-lg transition" />
                      </a>
                    ) : (
                      <input readOnly={ro} value={val} onChange={(e) => onChange(entry.id, { [f.key]: e.target.value })} className={fieldClass} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Sign Off */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Sign Off</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Eva Check</div><input readOnly={ro} value={entry.evaCheck || ""} onChange={(e) => onChange(entry.id, { evaCheck: e.target.value })} className={fieldClass} /></label>
              <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Trainer & Checker Sign Off</div><input readOnly={ro} value={entry.trainerSignOff || ""} onChange={(e) => onChange(entry.id, { trainerSignOff: e.target.value })} className={fieldClass} /></label>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <button type="button" onClick={function () { if (confirm("Delete this entry? This will also remove it from the spreadsheet.")) onDelete(entry.id); }} className="rounded-xl px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition">Delete</button>
          {editing ? (
            <button type="button" onClick={function () { onSave(entry.id); setEditing(false); onClose(); }} className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all">Save to Spreadsheet</button>
          ) : (
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Close</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Create Ack Modal ── */
function CreateAckModal({ open, onClose, onCreate }) {
  const emptyForm = { riderNo: "", shortName: "", fullName: "", confirmation: "", proofReminder1: "", proofReminder2: "", proofReminder3: "", reminderDate: "", evaCheck: "", trainerSignOff: "" };
  const [form, setForm] = useState(emptyForm);
  useEffect(function () { if (!open) setForm(emptyForm); }, [open]);
  if (!open) return null;

  const fieldClass = "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition";
  function set(key) { return function (e) { setForm(function (s) { var next = Object.assign({}, s); next[key] = e.target.value; return next; }); }; }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">New Acknowledgement Entry</h3>
            <p className="mt-1 text-sm text-slate-400">Track rider acknowledgement of critical time reminder</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Rider No. *</div><input value={form.riderNo} onChange={set("riderNo")} className={fieldClass} /></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Short Name *</div><input value={form.shortName} onChange={set("shortName")} className={fieldClass} /></label>
          <label className="text-sm sm:col-span-2"><div className="mb-1.5 font-medium text-slate-600">Full Name</div><input value={form.fullName} onChange={set("fullName")} className={fieldClass} /></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Confirmation</div><input value={form.confirmation} onChange={set("confirmation")} placeholder="e.g. Yes, No, Pending" className={fieldClass} /></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Reminder (1 Apr 2026)</div><input value={form.reminderDate} onChange={set("reminderDate")} className={fieldClass} /></label>
          <label className="text-sm sm:col-span-2"><div className="mb-1.5 font-medium text-slate-600">Proof Reminder 1 — First Interview</div><input value={form.proofReminder1} onChange={set("proofReminder1")} className={fieldClass} /></label>
          <label className="text-sm sm:col-span-2"><div className="mb-1.5 font-medium text-slate-600">Proof Reminder 2 — Grab Account Setup</div><input value={form.proofReminder2} onChange={set("proofReminder2")} className={fieldClass} /></label>
          <label className="text-sm sm:col-span-2"><div className="mb-1.5 font-medium text-slate-600">Proof Reminder 3 — Co-Pilot Training / Group Chat</div><input value={form.proofReminder3} onChange={set("proofReminder3")} className={fieldClass} /></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Eva Check</div><input value={form.evaCheck} onChange={set("evaCheck")} className={fieldClass} /></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Trainer & Checker Sign Off</div><input value={form.trainerSignOff} onChange={set("trainerSignOff")} className={fieldClass} /></label>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition">Cancel</button>
          <button type="button" onClick={function () { if (!form.riderNo.trim() || !form.shortName.trim()) return; onCreate(form); onClose(); }} className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all">Create Entry</button>
        </div>
      </div>
    </div>
  );
}

/* ── Create Ticket Modal ── */
function CreateTicketModal({ open, onClose, onCreate, staffOptions }) {
  const emptyForm = { riderNo: "", riderName: "", issue: "", timestampReceived: "", acknowledged: "", responsiblePerson: "", escalatedTo: "", solution: "", status: "Open", timestampSolved: "", duration: "" };
  const [form, setForm] = useState(emptyForm);
  useEffect(function () { if (!open) setForm(emptyForm); }, [open]);
  if (!open) return null;

  const fieldClass = "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition";
  function set(key) { return function (e) { setForm(function (s) { var next = Object.assign({}, s); next[key] = e.target.value; return next; }); }; }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">New Ticket</h3>
            <p className="mt-1 text-sm text-slate-400">Create a new rider support ticket</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Rider No. *</div><input value={form.riderNo} onChange={set("riderNo")} className={fieldClass} /></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Rider Name *</div><input value={form.riderName} onChange={set("riderName")} className={fieldClass} /></label>
          <label className="text-sm sm:col-span-2"><div className="mb-1.5 font-medium text-slate-600">Issue *</div><input value={form.issue} onChange={set("issue")} className={fieldClass} /></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Received</div><input type="datetime-local" value={form.timestampReceived} onChange={set("timestampReceived")} className={fieldClass} /></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Acknowledged</div><select value={form.acknowledged} onChange={set("acknowledged")} className={fieldClass}><option value="">Not yet</option><option value="Done">Done</option></select></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Responsible Person</div><input list="staff-opts-create" value={form.responsiblePerson} onChange={set("responsiblePerson")} placeholder="Optional" className={fieldClass} /></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Escalated to</div><input list="staff-opts-create" value={form.escalatedTo} onChange={set("escalatedTo")} placeholder="Optional" className={fieldClass} /></label>
          <label className="text-sm sm:col-span-2"><div className="mb-1.5 font-medium text-slate-600">Solution</div><input value={form.solution} onChange={set("solution")} placeholder="Optional" className={fieldClass} /></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Status</div><select value={form.status} onChange={set("status")} className={fieldClass}>{STATUS_ORDER.map(function (s) { return <option key={s} value={s}>{s}</option>; })}</select></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Solved At</div><input type="datetime-local" value={form.timestampSolved} onChange={set("timestampSolved")} className={fieldClass} /></label>
          <label className="text-sm sm:col-span-2"><div className="mb-1.5 font-medium text-slate-600">Duration</div><input value={form.duration} onChange={set("duration")} placeholder="e.g. 3 days, Same day" className={fieldClass} /></label>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition">Cancel</button>
          <button type="button" onClick={function () { if (!form.riderNo.trim() || !form.riderName.trim() || !form.issue.trim()) return; onCreate(form); onClose(); }} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all">Create Ticket</button>
        </div>
        <datalist id="staff-opts-create">{staffOptions.map(function (n) { return <option key={n} value={n} />; })}</datalist>
      </div>
    </div>
  );
}

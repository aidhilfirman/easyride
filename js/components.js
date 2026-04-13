const { useState, useEffect, useMemo } = React;

function StatCard({ title, value, hint, accent }) {
  return (
    <div className={"rounded-2xl border p-5 shadow-sm transition hover:shadow-md " + (accent || "border-slate-200/60 bg-white")}>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</div>
      <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{hint}</div>
    </div>
  );
}

function Badge({ children, tone }) {
  return <span className={"inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold " + tone}>{children}</span>;
}

function TicketDrawer({ ticket, onClose, onChange, onSave, onDelete, onAddComment, staffOptions, currentUser, nowMs }) {
  const [commentText, setCommentText] = useState("");
  useEffect(() => { setCommentText(""); }, [ticket ? ticket.id : ""]);
  if (!ticket) return null;

  const fieldClass = "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition";

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <Badge tone="bg-indigo-50 text-indigo-600 border-indigo-200">{ticket.id}</Badge>
              <Badge tone={STATUS_STYLES[ticket.status]}>{ticket.status}</Badge>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-slate-900 leading-snug">{ticket.issue || "Untitled ticket"}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Rider No.</div><input value={ticket.riderNo || ""} onChange={(e) => onChange(ticket.id, { riderNo: e.target.value })} className={fieldClass} /></label>
            <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Rider Name</div><input value={ticket.riderName || ""} onChange={(e) => onChange(ticket.id, { riderName: e.target.value })} className={fieldClass} /></label>
            <label className="text-sm md:col-span-2"><div className="mb-1.5 font-medium text-slate-600">Issue</div><input value={ticket.issue || ""} onChange={(e) => onChange(ticket.id, { issue: e.target.value })} className={fieldClass} /></label>
            <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Timestamp Issue Received</div><input value={ticket.timestampReceived || ""} onChange={(e) => onChange(ticket.id, { timestampReceived: e.target.value })} className={fieldClass} /></label>
            <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Acknowledged</div><select value={ticket.acknowledged ? "Done" : ""} onChange={(e) => onChange(ticket.id, { acknowledged: e.target.value === "Done" })} className={fieldClass}><option value="">Not yet</option><option value="Done">Done</option></select></label>
            <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Responsible Person</div><input list="staff-options" value={ticket.responsiblePerson || ""} onChange={(e) => onChange(ticket.id, { responsiblePerson: e.target.value })} className={fieldClass} /></label>
            <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Escalated to</div><input list="staff-options" value={ticket.escalatedTo || ""} onChange={(e) => onChange(ticket.id, { escalatedTo: e.target.value })} className={fieldClass} /></label>
            <label className="text-sm md:col-span-2"><div className="mb-1.5 font-medium text-slate-600">Solution</div><input value={ticket.solution || ""} onChange={(e) => onChange(ticket.id, { solution: e.target.value })} className={fieldClass} /></label>
            <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Status</div><select value={ticket.status} onChange={(e) => onChange(ticket.id, { status: e.target.value })} className={fieldClass}>{STATUS_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
            <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Timestamp Issue Solved</div><input value={ticket.timestampSolved || ""} onChange={(e) => onChange(ticket.id, { timestampSolved: e.target.value })} className={fieldClass} /></label>
            <label className="text-sm md:col-span-2"><div className="mb-1.5 font-medium text-slate-600">Duration until resolve (Days)</div><input value={ticket.importedDurationLabel || ""} onChange={(e) => onChange(ticket.id, { importedDurationLabel: e.target.value, duration: e.target.value })} placeholder="e.g. 3 days, Same day" className={fieldClass} /></label>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Internal Notes</h4>
            <div className="space-y-3">
              {ticket.comments.length ? ticket.comments.map((comment) => (
                <div key={comment.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-slate-700">{comment.author}</div>
                    <div className="text-xs text-slate-400">{formatDateTime(comment.createdAt)}</div>
                  </div>
                  <div className="mt-1.5 text-sm text-slate-600">{comment.text}</div>
                </div>
              )) : <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">No notes yet.</div>}
              <div className="rounded-xl border border-slate-200 p-3">
                <textarea rows={2} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a note..." className={"mb-2 " + fieldClass} />
                <div className="flex justify-end">
                  <button type="button" onClick={() => { if (!commentText.trim()) return; onAddComment(ticket.id, { id: "C-" + Date.now(), author: currentUser || "Ops Staff", text: commentText.trim(), createdAt: new Date().toISOString() }); setCommentText(""); }} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition">Add Note</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3">
          <button type="button" onClick={() => { if (confirm("Delete this ticket? This will also remove it from the spreadsheet.")) onDelete(ticket.id); }} className="rounded-xl px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition">Delete</button>
          <button type="button" onClick={() => { onSave(ticket.id); onClose(); }} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all">Save to Spreadsheet</button>
        </div>
        <datalist id="staff-options">{staffOptions.map((name) => <option key={name} value={name} />)}</datalist>
      </div>
    </div>
  );
}

function CreateTicketModal({ open, onClose, onCreate, staffOptions }) {
  const [form, setForm] = useState({ riderNo: "", riderName: "", issue: "", timestampReceived: "", acknowledged: "", responsiblePerson: "", escalatedTo: "", solution: "", status: "Open", timestampSolved: "", duration: "" });
  useEffect(() => { if (!open) setForm({ riderNo: "", riderName: "", issue: "", timestampReceived: "", acknowledged: "", responsiblePerson: "", escalatedTo: "", solution: "", status: "Open", timestampSolved: "", duration: "" }); }, [open]);
  if (!open) return null;

  const fieldClass = "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition";

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Rider No.</div><input value={form.riderNo} onChange={(e) => setForm((s) => ({ ...s, riderNo: e.target.value }))} className={fieldClass} /></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Rider Name</div><input value={form.riderName} onChange={(e) => setForm((s) => ({ ...s, riderName: e.target.value }))} className={fieldClass} /></label>
          <label className="text-sm md:col-span-2"><div className="mb-1.5 font-medium text-slate-600">Issue</div><input value={form.issue} onChange={(e) => setForm((s) => ({ ...s, issue: e.target.value }))} className={fieldClass} /></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Timestamp Issue Received</div><input type="datetime-local" value={form.timestampReceived} onChange={(e) => setForm((s) => ({ ...s, timestampReceived: e.target.value }))} className={fieldClass} /></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Acknowledged</div><select value={form.acknowledged} onChange={(e) => setForm((s) => ({ ...s, acknowledged: e.target.value }))} className={fieldClass}><option value="">Not yet</option><option value="Done">Done</option></select></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Responsible Person</div><input list="staff-options-create" value={form.responsiblePerson} onChange={(e) => setForm((s) => ({ ...s, responsiblePerson: e.target.value }))} placeholder="Optional" className={fieldClass} /></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Escalated to</div><input list="staff-options-create" value={form.escalatedTo} onChange={(e) => setForm((s) => ({ ...s, escalatedTo: e.target.value }))} placeholder="Optional" className={fieldClass} /></label>
          <label className="text-sm md:col-span-2"><div className="mb-1.5 font-medium text-slate-600">Solution</div><input value={form.solution} onChange={(e) => setForm((s) => ({ ...s, solution: e.target.value }))} placeholder="Optional" className={fieldClass} /></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Status</div><select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} className={fieldClass}>{STATUS_ORDER.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-600">Timestamp Issue Solved</div><input type="datetime-local" value={form.timestampSolved} onChange={(e) => setForm((s) => ({ ...s, timestampSolved: e.target.value }))} className={fieldClass} /></label>
          <label className="text-sm md:col-span-2"><div className="mb-1.5 font-medium text-slate-600">Duration until resolve (Days)</div><input value={form.duration} onChange={(e) => setForm((s) => ({ ...s, duration: e.target.value }))} placeholder="e.g. 3 days, Same day" className={fieldClass} /></label>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition">Cancel</button>
          <button type="button" onClick={() => { if (!form.riderNo.trim() || !form.riderName.trim() || !form.issue.trim()) return; onCreate(form); onClose(); }} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all">Create Ticket</button>
        </div>
        <datalist id="staff-options-create">{staffOptions.map((name) => <option key={name} value={name} />)}</datalist>
      </div>
    </div>
  );
}

const { useState, useEffect, useMemo } = React;

function StatCard({ title, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}

function Badge({ children, tone }) {
  return <span className={"inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium " + tone}>{children}</span>;
}

function TicketDrawer({ ticket, onClose, onChange, onAddComment, staffOptions, currentUser, nowMs }) {
  const [commentText, setCommentText] = useState("");
  useEffect(() => { setCommentText(""); }, [ticket ? ticket.id : ""]);
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative ml-auto flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Ticket Details</div>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{ticket.issue}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={STATUS_STYLES[ticket.status]}>{ticket.status}</Badge>
              <Badge tone="bg-slate-100 text-slate-700 border-slate-200">{ticket.id}</Badge>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Close</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Rider No.</div>
              <div className="mt-1 text-sm font-medium text-slate-900">{ticket.riderNo}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Rider Name</div>
              <div className="mt-1 text-sm font-medium text-slate-900">{ticket.riderName}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Timestamp Issue Received</div>
              <div className="mt-1 text-sm font-medium text-slate-900">{formatDateTime(ticket.timestampReceived)}</div>
            </div>
            <div className={"rounded-2xl border p-4 " + (ticket.status !== "Resolved" && getDurationDays(ticket, nowMs) > 2 ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white")}>
              <div className="text-xs uppercase tracking-wide text-slate-500">Duration until resolve</div>
              <div className="mt-1 text-sm font-medium text-slate-900">{formatDuration(ticket, nowMs)}</div>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Issue Details</h4>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">{ticket.description || "No additional description provided."}</div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Operations Update</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm">
                <div className="mb-1.5 font-medium text-slate-700">Status</div>
                <select value={ticket.status} onChange={(e) => onChange(ticket.id, { status: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-slate-500">
                  {STATUS_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <div className="mb-1.5 font-medium text-slate-700">Responsible Person</div>
                <input list="staff-options" value={ticket.responsiblePerson || ""} onChange={(e) => onChange(ticket.id, { responsiblePerson: e.target.value })} placeholder="Leave blank or type a new name" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-slate-500" />
              </label>
              <label className="text-sm">
                <div className="mb-1.5 font-medium text-slate-700">Escalated to</div>
                <input list="staff-options" value={ticket.escalatedTo || ""} onChange={(e) => onChange(ticket.id, { escalatedTo: e.target.value })} placeholder="Leave blank or type a team or person" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-slate-500" />
              </label>
              <div className="text-sm">
                <div className="mb-1.5 font-medium text-slate-700">Acknowledged to Rider's Enquiry</div>
                <div className="rounded-2xl border border-slate-300 p-3">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={ticket.acknowledged} onChange={(e) => onChange(ticket.id, { acknowledged: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
                    <span className="text-slate-700">Mark as acknowledged</span>
                  </label>
                  <div className="mt-2 text-xs text-slate-500">Timestamp: {formatDateTime(ticket.acknowledgedAt)}</div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Resolution</h4>
            <label className="text-sm">
              <div className="mb-1.5 font-medium text-slate-700">Solution</div>
              <textarea rows={4} value={ticket.solution || ""} onChange={(e) => onChange(ticket.id, { solution: e.target.value })} placeholder="Document what was done, what is pending, or what follow-up is needed" className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-slate-500" />
            </label>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Internal Notes / Comments</h4>
            <div className="space-y-3">
              {ticket.comments.length ? ticket.comments.map((comment) => (
                <div key={comment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-slate-800">{comment.author}</div>
                    <div className="text-xs text-slate-500">{formatDateTime(comment.createdAt)}</div>
                  </div>
                  <div className="mt-2 text-sm text-slate-700">{comment.text}</div>
                </div>
              )) : <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No comments yet.</div>}
              <div className="rounded-2xl border border-slate-200 p-3">
                <div className="mb-2 text-sm font-medium text-slate-700">Add Comment</div>
                <textarea rows={3} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add an internal note for the ops team" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500" />
                <div className="mt-3 flex justify-end">
                  <button type="button" onClick={() => { if (!commentText.trim()) return; onAddComment(ticket.id, { id: "C-" + Date.now(), author: currentUser || "Ops Staff", text: commentText.trim(), createdAt: new Date().toISOString() }); setCommentText(""); }} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Save Comment</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <datalist id="staff-options">{staffOptions.map((name) => <option key={name} value={name} />)}</datalist>
      </div>
    </div>
  );
}

function CreateTicketModal({ open, onClose, onCreate, staffOptions }) {
  const [form, setForm] = useState({ riderNo: "", riderName: "", issue: "", category: "Account", description: "", responsiblePerson: "", escalatedTo: "", status: "Open" });
  useEffect(() => { if (!open) setForm({ riderNo: "", riderName: "", issue: "", category: "Account", description: "", responsiblePerson: "", escalatedTo: "", status: "Open" }); }, [open]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Create Ticket</div>
            <h3 className="mt-1 text-xl font-semibold text-slate-900">New rider support issue</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">Close</button>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-700">Rider No.</div><input value={form.riderNo} onChange={(e) => setForm((s) => ({ ...s, riderNo: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500" /></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-700">Rider Name</div><input value={form.riderName} onChange={(e) => setForm((s) => ({ ...s, riderName: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500" /></label>
          <label className="text-sm md:col-span-2"><div className="mb-1.5 font-medium text-slate-700">Issue</div><input value={form.issue} onChange={(e) => setForm((s) => ({ ...s, issue: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500" /></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-700">Issue Category</div><select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500">{CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-700">Initial Status</div><select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500">{STATUS_ORDER.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-700">Responsible Person</div><input list="staff-options-create" value={form.responsiblePerson} onChange={(e) => setForm((s) => ({ ...s, responsiblePerson: e.target.value }))} placeholder="Optional" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500" /></label>
          <label className="text-sm"><div className="mb-1.5 font-medium text-slate-700">Escalated to</div><input list="staff-options-create" value={form.escalatedTo} onChange={(e) => setForm((s) => ({ ...s, escalatedTo: e.target.value }))} placeholder="Optional" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500" /></label>
          <label className="text-sm md:col-span-2"><div className="mb-1.5 font-medium text-slate-700">Description</div><textarea rows={4} value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} placeholder="Capture the rider's issue in enough detail for follow-up" className="w-full rounded-2xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-500" /></label>
        </div>
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500">Timestamp auto-filled on creation.</div>
          <button type="button" onClick={() => { if (!form.riderNo.trim() || !form.riderName.trim() || !form.issue.trim()) return; onCreate(form); onClose(); }} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">Create Ticket</button>
        </div>
        <datalist id="staff-options-create">{staffOptions.map((name) => <option key={name} value={name} />)}</datalist>
      </div>
    </div>
  );
}

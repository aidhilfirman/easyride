function App() {
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState(INITIAL_TICKETS[0] ? INITIAL_TICKETS[0].id : "");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [quickFilter, setQuickFilter] = useState("all");
  const [sortBy, setSortBy] = useState("timestamp");
  const [createOpen, setCreateOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState("You");
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => { const timer = window.setInterval(() => setNowMs(Date.now()), 60000); return () => window.clearInterval(timer); }, []);

  const staffOptions = useMemo(() => {
    const names = new Set([currentUser, "Ally", "Dominic", "Admin", "Ops Team", "Workshop", "Grab", "Grab Finance", "Finance"]);
    tickets.forEach((t) => { if (t.responsiblePerson) names.add(t.responsiblePerson); if (t.escalatedTo) names.add(t.escalatedTo); t.comments.forEach((c) => { if (c.author) names.add(c.author); }); });
    return Array.from(names).filter(Boolean).sort();
  }, [tickets, currentUser]);

  const summary = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === "Open").length;
    const escalated = tickets.filter((t) => t.status === "Escalated").length;
    const resolved = tickets.filter((t) => t.status === "Resolved").length;
    const resolvedTickets = tickets.filter((t) => t.status === "Resolved");
    const avgResolutionDays = resolvedTickets.length ? resolvedTickets.reduce((sum, t) => sum + getDurationDays(t, nowMs), 0) / resolvedTickets.length : 0;
    return { total, open, escalated, resolved, avgResolutionDays };
  }, [tickets, nowMs]);

  const filteredTickets = useMemo(() => {
    let list = tickets.slice();
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter((t) => [t.id, t.riderNo, t.riderName, t.issue, t.responsiblePerson, t.escalatedTo, t.solution, t.description].filter(Boolean).some((f) => String(f).toLowerCase().includes(q))); }
    if (statusFilter !== "All") list = list.filter((t) => t.status === statusFilter);
    if (quickFilter === "unresolved") list = list.filter((t) => t.status !== "Resolved");
    if (quickFilter === "escalated") list = list.filter((t) => t.status === "Escalated");
    if (quickFilter === "my") list = list.filter((t) => String(t.responsiblePerson || "").toLowerCase().includes(currentUser.toLowerCase()));
    list.sort((a, b) => {
      if (sortBy === "status") return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      if (sortBy === "duration") return getDurationDays(b, nowMs) - getDurationDays(a, nowMs);
      const aTime = toDate(a.timestampReceived) ? toDate(a.timestampReceived).getTime() : 0;
      const bTime = toDate(b.timestampReceived) ? toDate(b.timestampReceived).getTime() : 0;
      return bTime - aTime;
    });
    return list;
  }, [tickets, search, statusFilter, quickFilter, sortBy, nowMs, currentUser]);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  function updateTicket(ticketId, changes) {
    setTickets((prev) => prev.map((t) => {
      if (t.id !== ticketId) return t;
      const next = { ...t, ...changes, lastUpdated: new Date().toISOString() };
      if (Object.prototype.hasOwnProperty.call(changes, "acknowledged")) { next.acknowledgedAt = changes.acknowledged ? t.acknowledgedAt || new Date().toISOString() : ""; }
      if (Object.prototype.hasOwnProperty.call(changes, "status")) { next.importedDurationLabel = undefined; next.importedDurationDays = null; if (changes.status === "Resolved") { next.timestampSolved = t.timestampSolved || new Date().toISOString(); } else if (t.status === "Resolved" && changes.status !== "Resolved") { next.timestampSolved = ""; } }
      return next;
    }));
  }

  function addComment(ticketId, comment) {
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, comments: t.comments.concat(comment), lastUpdated: new Date().toISOString() } : t));
  }

  function createTicket(form) {
    const now = new Date().toISOString();
    const newTicket = { id: makeId(), riderNo: form.riderNo, riderName: form.riderName, issue: form.issue, category: form.category, timestampReceived: now, acknowledged: false, acknowledgedAt: "", responsiblePerson: form.responsiblePerson, escalatedTo: form.escalatedTo, solution: "", status: form.status, timestampSolved: form.status === "Resolved" ? now : "", description: form.description, comments: [], lastUpdated: now, importedDurationLabel: undefined, importedDurationDays: null };
    setTickets((prev) => [newTicket].concat(prev));
    setSelectedTicketId(newTicket.id);
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 lg:block">
          <div className="rounded-2xl bg-slate-900 p-4 text-white">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-300">EasyRider</div>
            <div className="mt-2 text-xl font-semibold">Rider Support Tracker</div>
            <div className="mt-1 text-sm text-slate-300">Internal ops dashboard</div>
          </div>
          <div className="mt-6 space-y-2">
            <button type="button" className="w-full rounded-xl bg-slate-900 px-3 py-2 text-left text-sm text-white">Support Tickets</button>
            <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100">Analytics</button>
            <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100">Escalations</button>
            <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100">Team Queue</button>
          </div>
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Current staff filter</div>
            <input value={currentUser} onChange={(e) => setCurrentUser(e.target.value)} placeholder="Type your name" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500" />
            <div className="mt-2 text-xs text-slate-500">Used for the My tickets quick filter.</div>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-[1600px]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">Operations / Rider Support</div>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Ticket dashboard</h1>
                <p className="mt-1 text-sm text-slate-500">Track rider issues, ownership, escalation, acknowledgement, and resolution timing.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setQuickFilter("unresolved")} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Unresolved only</button>
                <button type="button" onClick={() => setCreateOpen(true)} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">Create Ticket</button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard title="Total Tickets" value={summary.total} hint="All tickets in tracker" />
              <StatCard title="Open" value={summary.open} hint="Awaiting action" />
              <StatCard title="Escalated" value={summary.escalated} hint="Needs escalation" />
              <StatCard title="Resolved" value={summary.resolved} hint="Closed with solution recorded" />
              <StatCard title="Avg Resolution" value={summary.avgResolutionDays.toFixed(1) + "d"} hint="Based on resolved tickets" />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Status Distribution</div>
                <div className="flex items-end justify-around gap-3" style={{ height: "140px" }}>
                  {(() => {
                    const counts = { Open: 0, "In Progress": 0, Escalated: 0, Resolved: 0 };
                    tickets.forEach((t) => { if (counts[t.status] !== undefined) counts[t.status]++; });
                    const max = Math.max(...Object.values(counts), 1);
                    const colors = { Open: "bg-slate-400", "In Progress": "bg-blue-400", Escalated: "bg-orange-400", Resolved: "bg-emerald-400" };
                    return STATUS_ORDER.map((s) => (
                      <div key={s} className="flex flex-col items-center gap-1 flex-1">
                        <div className="text-sm font-bold text-slate-800">{counts[s]}</div>
                        <div className="w-full max-w-[48px] rounded-t-lg transition-all" style={{ height: Math.max(counts[s] / max * 100, 4) + "px" }}>
                          <div className={colors[s] + " w-full h-full rounded-t-lg"}></div>
                        </div>
                        <div className="text-[10px] text-slate-500 text-center mt-1 leading-tight">{s}</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">By Category</div>
                <div className="flex items-end justify-around gap-3" style={{ height: "140px" }}>
                  {(() => {
                    const counts = {};
                    tickets.forEach((t) => { counts[t.category] = (counts[t.category] || 0) + 1; });
                    const max = Math.max(...Object.values(counts), 1);
                    const catColors = { Account: "bg-blue-500", Payment: "bg-emerald-500", "App Issue": "bg-purple-500", Vehicle: "bg-amber-500", Others: "bg-slate-400" };
                    return CATEGORIES.filter((c) => counts[c]).map((c) => (
                      <div key={c} className="flex flex-col items-center gap-1 flex-1">
                        <div className="text-sm font-bold text-slate-800">{counts[c]}</div>
                        <div className="w-full max-w-[48px] rounded-t-lg transition-all" style={{ height: Math.max(counts[c] / max * 100, 4) + "px" }}>
                          <div className={(catColors[c] || "bg-slate-400") + " w-full h-full rounded-t-lg"}></div>
                        </div>
                        <div className="text-[10px] text-slate-500 text-center mt-1 leading-tight">{c}</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by rider, ticket ID, issue, assignee..." className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 xl:col-span-2" />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500">
                    <option value="All">All Statuses</option>
                    {STATUS_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500">
                    <option value="timestamp">Sort by Timestamp</option>
                    <option value="status">Sort by Status</option>
                    <option value="duration">Sort by Duration</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[{ key: "all", label: "All" }, { key: "unresolved", label: "Unresolved" }, { key: "escalated", label: "Escalated" }, { key: "my", label: "My tickets" }].map((item) => (
                    <button key={item.key} type="button" onClick={() => setQuickFilter(item.key)} className={"rounded-xl px-3 py-2 text-sm font-medium " + (quickFilter === item.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>{item.label}</button>
                  ))}
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-[1400px] w-full text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                      <tr>
                        {["Rider No.", "Rider Name", "Issue", "Timestamp Issue Received", "Acknowledged", "Responsible Person", "Escalated to", "Solution", "Status", "Timestamp Issue Solved", "Duration until resolve"].map((col) => <th key={col} className="whitespace-nowrap border-b border-slate-200 px-4 py-3 font-medium">{col}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.length ? filteredTickets.map((ticket) => {
                        const warningLevel = getWarningLevel(ticket, nowMs);
                        const rowTone = warningLevel === "critical" ? "bg-rose-50/80" : warningLevel === "warning" ? "bg-amber-50/70" : selectedTicketId === ticket.id ? "bg-slate-50" : "bg-white";
                        return (
                          <tr key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)} className={"cursor-pointer border-b border-slate-200 transition hover:bg-slate-50 " + rowTone}>
                            <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{ticket.riderNo}</td>
                            <td className="whitespace-nowrap px-4 py-3">{ticket.riderName}</td>
                            <td className="max-w-[280px] px-4 py-3"><div className="font-medium text-slate-900">{ticket.issue}</div><div className="mt-1 text-xs text-slate-500">{ticket.id + " \u2022 " + ticket.category}</div></td>
                            <td className="whitespace-nowrap px-4 py-3">{formatDateTime(ticket.timestampReceived)}</td>
                            <td className="px-4 py-3"><div className="font-medium text-slate-900">{ticket.acknowledged ? "Yes" : "No"}</div><div className="mt-1 whitespace-nowrap text-xs text-slate-500">{formatDateTime(ticket.acknowledgedAt)}</div></td>
                            <td className="whitespace-nowrap px-4 py-3">{ticket.responsiblePerson || "\u2014"}</td>
                            <td className="whitespace-nowrap px-4 py-3">{ticket.escalatedTo || "\u2014"}</td>
                            <td className="max-w-[280px] px-4 py-3 text-slate-600">{ticket.solution || "\u2014"}</td>
                            <td className="whitespace-nowrap px-4 py-3"><Badge tone={STATUS_STYLES[ticket.status]}>{ticket.status}</Badge></td>
                            <td className="whitespace-nowrap px-4 py-3">{formatDateTime(ticket.timestampSolved)}</td>
                            <td className="whitespace-nowrap px-4 py-3">{formatDuration(ticket, nowMs)}</td>
                          </tr>
                        );
                      }) : <tr><td colSpan={11} className="px-4 py-12 text-center text-sm text-slate-500">No tickets match the current filters.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <TicketDrawer ticket={selectedTicket} onClose={() => setSelectedTicketId("")} onChange={updateTicket} onAddComment={addComment} staffOptions={staffOptions} currentUser={currentUser} nowMs={nowMs} />
      <CreateTicketModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={createTicket} staffOptions={staffOptions} />
    </div>
  );
}

function Root() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    return auth.onAuthStateChanged((u) => { setUser(u); setChecking(false); });
  }, []);

  if (checking) return <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500">Loading...</div>;
  if (!user) return <LoginPage onLogin={(u) => setUser(u)} />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);

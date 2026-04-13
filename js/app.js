function App({ onLogout }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [sheetLoading, setSheetLoading] = useState(true);

  useEffect(() => {
    fetchSheetData()
      .then((data) => { setTickets(data); if (data[0]) setSelectedTicketId(data[0].id); })
      .catch((err) => console.error("Failed to load sheet:", err))
      .finally(() => setSheetLoading(false));
  }, []);
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
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter((t) => [t.id, t.riderNo, t.riderName, t.issue, t.responsiblePerson, t.escalatedTo, t.solution].filter(Boolean).some((f) => String(f).toLowerCase().includes(q))); }
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
      const next = { ...t, ...changes };
      if (Object.prototype.hasOwnProperty.call(changes, "acknowledged")) { next.acknowledgedAt = changes.acknowledged ? t.acknowledgedAt || new Date().toISOString() : ""; }
      if (Object.prototype.hasOwnProperty.call(changes, "status")) { next.importedDurationLabel = undefined; next.importedDurationDays = null; if (changes.status === "Resolved") { next.timestampSolved = t.timestampSolved || new Date().toISOString(); } else if (t.status === "Resolved" && changes.status !== "Resolved") { next.timestampSolved = ""; } }
      return next;
    }));
  }

  function addComment(ticketId, comment) {
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, comments: t.comments.concat(comment) } : t));
  }

  function createTicket(form) {
    const now = new Date().toISOString();
    const newTicket = { id: makeId(), riderNo: form.riderNo, riderName: form.riderName, issue: form.issue, timestampReceived: form.timestampReceived || now, acknowledged: form.acknowledged || "", acknowledgedAt: form.acknowledged === "Done" ? now : "", responsiblePerson: form.responsiblePerson, escalatedTo: form.escalatedTo, solution: form.solution || "", status: form.status, timestampSolved: form.timestampSolved || "", comments: [], importedDurationLabel: form.duration || undefined, importedDurationDays: parseDurationLabelToDays(form.duration), duration: form.duration || "" };
    setTickets((prev) => [newTicket].concat(prev));
    setSelectedTicketId(newTicket.id);
    sendTicketToSheet(newTicket);
  }

  function saveTicketToSheet(ticketId) {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket && ticket.sheetRow !== undefined) updateTicketInSheet(ticket);
  }

  function deleteTicket(ticketId) {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    if (ticket.sheetRow !== undefined) deleteTicketFromSheet(ticket.sheetRow);
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    setSelectedTicketId("");
  }

  if (sheetLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-lg font-bold mb-4 animate-pulse">ER</div>
        <div className="text-sm text-slate-400">Loading tickets...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200/60 bg-white p-6 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold shadow-sm">ER</div>
            <div>
              <div className="text-sm font-bold text-slate-900">EasyRide</div>
              <div className="text-xs text-slate-400">Support Tracker</div>
            </div>
          </div>
          <nav className="space-y-1">
            <button type="button" className="w-full flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-2.5 text-left text-sm font-medium text-indigo-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Tickets
            </button>
          </nav>
          <div className="mt-8 rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">Staff Filter</div>
            <input value={currentUser} onChange={(e) => setCurrentUser(e.target.value)} placeholder="Your name" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 transition" />
            <div className="mt-2 text-xs text-slate-400">For "My tickets" filter</div>
          </div>
          <div className="mt-auto pt-6">
            <button type="button" onClick={onLogout} className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1 p-5 md:p-8">
          <div className="mx-auto max-w-[1600px]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ticket Dashboard</h1>
                <p className="mt-1 text-sm text-slate-400">Track rider issues, escalation, and resolution.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setQuickFilter("unresolved")} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:border-slate-300 hover:shadow-sm transition">Unresolved</button>
                <button type="button" onClick={() => setCreateOpen(true)} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all">+ New Ticket</button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-5">
              <StatCard title="Total" value={summary.total} hint="All tickets" />
              <StatCard title="Open" value={summary.open} hint="Awaiting action" accent="border-slate-200/60 bg-white" />
              <StatCard title="Escalated" value={summary.escalated} hint="Needs attention" accent="border-amber-200/60 bg-amber-50/30" />
              <StatCard title="Resolved" value={summary.resolved} hint="Completed" accent="border-emerald-200/60 bg-emerald-50/30" />
              <StatCard title="Avg Resolution" value={summary.avgResolutionDays.toFixed(1) + "d"} hint="Resolution time" accent="border-indigo-200/60 bg-indigo-50/30" />
            </div>

            <div className="mt-6">
              <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">Status Overview</div>
                <div className="flex items-end justify-around gap-4" style={{ height: "120px" }}>
                  {(() => {
                    const counts = { Open: 0, "In Progress": 0, Escalated: 0, Resolved: 0 };
                    tickets.forEach((t) => { if (counts[t.status] !== undefined) counts[t.status]++; });
                    const max = Math.max(...Object.values(counts), 1);
                    const colors = { Open: "from-slate-300 to-slate-400", "In Progress": "from-blue-400 to-blue-500", Escalated: "from-amber-400 to-orange-500", Resolved: "from-emerald-400 to-emerald-500" };
                    return STATUS_ORDER.map((s) => (
                      <div key={s} className="flex flex-col items-center gap-1.5 flex-1">
                        <div className="text-sm font-bold text-slate-700">{counts[s]}</div>
                        <div className="w-full max-w-[40px] rounded-lg overflow-hidden" style={{ height: Math.max(counts[s] / max * 80, 4) + "px" }}>
                          <div className={"w-full h-full rounded-lg bg-gradient-to-t " + colors[s]}></div>
                        </div>
                        <div className="text-[10px] font-medium text-slate-400 text-center leading-tight">{s}</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200/60 bg-white shadow-sm">
              <div className="p-4 border-b border-slate-100">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-1 gap-3 flex-wrap">
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets..." className="flex-1 min-w-[200px] rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition" />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 transition">
                      <option value="All">All Statuses</option>
                      {STATUS_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 transition">
                      <option value="timestamp">Newest first</option>
                      <option value="status">By Status</option>
                      <option value="duration">By Duration</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[{ key: "all", label: "All" }, { key: "unresolved", label: "Unresolved" }, { key: "escalated", label: "Escalated" }, { key: "my", label: "My tickets" }].map((item) => (
                      <button key={item.key} type="button" onClick={() => setQuickFilter(item.key)} className={"rounded-lg px-3 py-1.5 text-xs font-semibold transition " + (quickFilter === item.key ? "bg-indigo-500 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>{item.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1400px] w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Rider No.", "Rider Name", "Issue", "Timestamp Issue Received", "Acknowledged", "Responsible Person", "Escalated to", "Solution", "Status", "Timestamp Issue Solved", "Duration until resolve"].map((col) => <th key={col} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.length ? filteredTickets.map((ticket) => {
                      const warningLevel = getWarningLevel(ticket, nowMs);
                      const rowTone = warningLevel === "critical" ? "bg-rose-50/50" : warningLevel === "warning" ? "bg-amber-50/30" : "";
                      return (
                        <tr key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)} className={"cursor-pointer border-b border-slate-50 transition hover:bg-indigo-50/30 " + rowTone}>
                          <td className="whitespace-nowrap px-4 py-3.5 font-medium text-slate-900">{ticket.riderNo}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{ticket.riderName}</td>
                          <td className="max-w-[280px] px-4 py-3.5"><div className="font-medium text-slate-800 truncate">{ticket.issue}</div><div className="mt-0.5 text-xs text-slate-400">{ticket.id}</div></td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">{formatDateTime(ticket.timestampReceived)}</td>
                          <td className="px-4 py-3.5"><Badge tone={ticket.acknowledged ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}>{ticket.acknowledged ? "Done" : "No"}</Badge></td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{ticket.responsiblePerson || "\u2014"}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{ticket.escalatedTo || "\u2014"}</td>
                          <td className="max-w-[280px] px-4 py-3.5 text-slate-500 truncate">{ticket.solution || "\u2014"}</td>
                          <td className="whitespace-nowrap px-4 py-3.5"><Badge tone={STATUS_STYLES[ticket.status]}>{ticket.status}</Badge></td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">{formatDateTime(ticket.timestampSolved)}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">{formatDuration(ticket, nowMs)}</td>
                        </tr>
                      );
                    }) : <tr><td colSpan={11} className="px-4 py-16 text-center text-sm text-slate-400">No tickets match the current filters.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      <TicketDrawer ticket={selectedTicket} onClose={() => setSelectedTicketId("")} onChange={updateTicket} onSave={saveTicketToSheet} onDelete={deleteTicket} onAddComment={addComment} staffOptions={staffOptions} currentUser={currentUser} nowMs={nowMs} />
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

  if (checking) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Loading...</div>;
  if (!user) return <LoginPage onLogin={(u) => setUser(u)} />;
  return <App onLogout={() => auth.signOut()} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);

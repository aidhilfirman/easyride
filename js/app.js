function App({ onLogout }) {
  const [page, setPage] = useState("home");
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [sheetLoading, setSheetLoading] = useState(true);
  const [sheetError, setSheetError] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [quickFilter, setQuickFilter] = useState("all");
  const [sortBy, setSortBy] = useState("timestamp");
  const [createOpen, setCreateOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState("You");
  const [nowMs, setNowMs] = useState(Date.now());
  const [toasts, setToasts] = useState([]);

  useEffect(function () {
    var t = setTimeout(function () { setDebouncedSearch(search); }, 300);
    return function () { clearTimeout(t); };
  }, [search]);

  useEffect(function () {
    var t = setInterval(function () { setNowMs(Date.now()); }, 60000);
    return function () { clearInterval(t); };
  }, []);

  useEffect(function () {
    fetchSheetData()
      .then(function (data) { setTickets(data); })
      .catch(function (err) { setSheetError(err.message || "Failed to load tickets"); })
      .finally(function () { setSheetLoading(false); });
  }, []);

  function showToast(message, type) {
    var id = Date.now() + Math.random();
    setToasts(function (prev) { return prev.concat({ id: id, message: message, type: type }); });
    setTimeout(function () { setToasts(function (prev) { return prev.filter(function (t) { return t.id !== id; }); }); }, 3000);
  }

  function goHome() {
    setPage("home");
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("All");
    setQuickFilter("all");
    setSortBy("timestamp");
    setSelectedTicketId("");
  }

  function openDashboard(options) {
    if (options && options.quickFilter) setQuickFilter(options.quickFilter);
    if (options && options.createOpen) setCreateOpen(true);
    setPage("dashboard");
  }

  var staffOptions = useMemo(function () {
    var names = new Set(STAFF_LIST);
    tickets.forEach(function (t) {
      if (t.responsiblePerson) names.add(t.responsiblePerson);
      if (t.escalatedTo) names.add(t.escalatedTo);
    });
    return Array.from(names).sort();
  }, [tickets]);

  var summary = useMemo(function () {
    var total = tickets.length;
    var open = tickets.filter(function (t) { return t.status === "Open"; }).length;
    var inProgress = tickets.filter(function (t) { return t.status === "In Progress"; }).length;
    var escalated = tickets.filter(function (t) { return t.status === "Escalated"; }).length;
    var resolved = tickets.filter(function (t) { return t.status === "Resolved"; }).length;
    var resolvedList = tickets.filter(function (t) { return t.status === "Resolved"; });
    var avgDays = resolvedList.length ? resolvedList.reduce(function (sum, t) { return sum + getDurationDays(t, nowMs); }, 0) / resolvedList.length : 0;
    var unresolved = total - resolved;
    return { total: total, open: open, inProgress: inProgress, escalated: escalated, resolved: resolved, avgDays: avgDays, unresolved: unresolved };
  }, [tickets, nowMs]);

  var filteredTickets = useMemo(function () {
    var list = tickets.slice();
    if (debouncedSearch.trim()) {
      var q = debouncedSearch.toLowerCase();
      list = list.filter(function (t) {
        return [t.id, t.riderNo, t.riderName, t.issue, t.responsiblePerson, t.escalatedTo, t.solution]
          .filter(Boolean).some(function (f) { return String(f).toLowerCase().indexOf(q) !== -1; });
      });
    }
    if (quickFilter === "none") return [];
    if (statusFilter !== "All") list = list.filter(function (t) { return t.status === statusFilter; });
    if (quickFilter === "unresolved") list = list.filter(function (t) { return t.status !== "Resolved"; });
    if (quickFilter === "escalated") list = list.filter(function (t) { return t.status === "Escalated"; });
    if (quickFilter === "my") list = list.filter(function (t) { return String(t.responsiblePerson || "").toLowerCase().indexOf(currentUser.toLowerCase()) !== -1; });
    list.sort(function (a, b) {
      if (sortBy === "status") return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      if (sortBy === "duration") return getDurationDays(b, nowMs) - getDurationDays(a, nowMs);
      var aT = toDate(a.timestampReceived) ? toDate(a.timestampReceived).getTime() : 0;
      var bT = toDate(b.timestampReceived) ? toDate(b.timestampReceived).getTime() : 0;
      return bT - aT;
    });
    return list;
  }, [tickets, debouncedSearch, statusFilter, quickFilter, sortBy, nowMs, currentUser]);

  var selectedTicket = tickets.find(function (t) { return t.id === selectedTicketId; }) || null;

  function updateTicket(ticketId, changes) {
    setTickets(function (prev) { return prev.map(function (t) {
      if (t.id !== ticketId) return t;
      var next = Object.assign({}, t, changes);
      if ("acknowledged" in changes) next.acknowledgedAt = changes.acknowledged ? (t.acknowledgedAt || new Date().toISOString()) : "";
      if ("status" in changes) {
        next.importedDurationLabel = undefined;
        next.importedDurationDays = null;
        if (changes.status === "Resolved") next.timestampSolved = t.timestampSolved || new Date().toISOString();
        else if (t.status === "Resolved") next.timestampSolved = "";
      }
      return next;
    }); });
  }

  function addComment(ticketId, comment) {
    setTickets(function (prev) { return prev.map(function (t) { return t.id === ticketId ? Object.assign({}, t, { comments: t.comments.concat(comment) }) : t; }); });
  }

  function createTicket(form) {
    var now = new Date().toISOString();
    var newTicket = {
      id: makeId(), riderNo: form.riderNo, riderName: form.riderName, issue: form.issue,
      timestampReceived: form.timestampReceived || now, acknowledged: form.acknowledged === "Done",
      acknowledgedAt: form.acknowledged === "Done" ? now : "", responsiblePerson: form.responsiblePerson,
      escalatedTo: form.escalatedTo, solution: form.solution || "", status: form.status,
      timestampSolved: form.timestampSolved || "", comments: [],
      importedDurationLabel: form.duration || undefined, importedDurationDays: parseDurationLabelToDays(form.duration),
      duration: form.duration || "",
    };
    setTickets(function (prev) { return [newTicket].concat(prev); });
    setSelectedTicketId(newTicket.id);
    sendTicketToSheet(newTicket)
      .then(function () { showToast("Ticket created & synced", "success"); })
      .catch(function () { showToast("Created locally, sync failed", "error"); });
  }

  function saveTicketToSheet(ticketId) {
    var ticket = tickets.find(function (t) { return t.id === ticketId; });
    if (!ticket) return;
    if (ticket.sheetRow === undefined) { showToast("New ticket — already synced on creation", "success"); return; }
    updateTicketInSheet(ticket)
      .then(function () { showToast("Saved to spreadsheet", "success"); })
      .catch(function () { showToast("Failed to save", "error"); });
  }

  function deleteTicket(ticketId) {
    var ticket = tickets.find(function (t) { return t.id === ticketId; });
    if (!ticket) return;
    setTickets(function (prev) { return prev.filter(function (t) { return t.id !== ticketId; }); });
    setSelectedTicketId("");
    if (ticket.sheetRow !== undefined) {
      deleteTicketFromSheet(ticket.sheetRow)
        .then(function () { showToast("Ticket deleted", "success"); })
        .catch(function () { showToast("Deleted locally, sync failed", "error"); });
    }
  }

  function retryLoad() {
    setSheetError(null);
    setSheetLoading(true);
    fetchSheetData()
      .then(function (data) { setTickets(data); })
      .catch(function (err) { setSheetError(err.message || "Failed"); })
      .finally(function () { setSheetLoading(false); });
  }

  /* ── Loading Screen ── */
  if (sheetLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xl font-bold mb-4 animate-pulse shadow-lg shadow-indigo-500/20">ER</div>
        <div className="text-sm text-slate-400">Loading tickets...</div>
      </div>
    </div>
  );

  /* ── Error Screen ── */
  if (sheetError) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-500 flex items-center justify-center text-2xl font-bold mx-auto mb-4">!</div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Failed to load tickets</h2>
        <p className="text-sm text-slate-500 mb-4">{sheetError}</p>
        <button onClick={retryLoad} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition">Retry</button>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════
     HOME SCREEN — centered menu tiles
     ════════════════════════════════════════════════ */
  if (page === "home") {
    var hour = new Date().getHours();
    var greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    var tiles = [
      { action: function () { openDashboard(); }, title: "All Tickets", desc: "View & manage tickets", count: summary.total, label: "total",
        blob: "bg-indigo-50", iconBox: "bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100", countCls: "text-indigo-600",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
      { action: function () { openDashboard({ createOpen: true }); }, title: "New Ticket", desc: "Create support ticket", count: summary.unresolved, label: "active",
        blob: "bg-violet-50", iconBox: "bg-violet-50 text-violet-500 group-hover:bg-violet-100", countCls: "text-violet-600",
        icon: "M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" },
      { action: function () { openDashboard({ quickFilter: "escalated" }); }, title: "Escalated", desc: "Needs attention", count: summary.escalated, label: "tickets",
        blob: "bg-amber-50", iconBox: "bg-amber-50 text-amber-500 group-hover:bg-amber-100", countCls: summary.escalated > 0 ? "text-amber-600" : "text-slate-300",
        icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" },
      { action: function () { openDashboard(); }, title: "Analytics", desc: "Resolution performance", count: summary.avgDays > 0 ? summary.avgDays.toFixed(1) + "d" : "\u2014", label: "avg resolve",
        blob: "bg-emerald-50", iconBox: "bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100", countCls: "text-emerald-600",
        icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo + Greeting */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-3xl font-bold flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-6">ER</div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{greeting}</h1>
        <p className="mt-2 text-slate-400 text-sm">What would you like to do?</p>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-4 mt-10 w-full max-w-lg">
          {tiles.map(function (t) {
            return (
              <button key={t.title} onClick={t.action} className="group relative p-6 rounded-2xl border border-slate-200/80 bg-white text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                <div className={"absolute top-0 right-0 w-24 h-24 rounded-full -translate-x-4 -translate-y-8 group-hover:scale-150 transition-transform duration-500 " + t.blob} />
                <div className="relative">
                  <div className={"w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 " + t.iconBox}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={t.icon} /></svg>
                  </div>
                  <div className="text-base font-semibold text-slate-900">{t.title}</div>
                  <div className="mt-1 text-xs text-slate-400">{t.desc}</div>
                  <div className="mt-3"><span className={"text-2xl font-bold " + t.countCls}>{t.count}</span><span className="ml-1.5 text-xs text-slate-400">{t.label}</span></div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick stats */}
        <div className="mt-8 flex items-center gap-6 text-xs text-slate-400">
          <span><span className="font-semibold text-slate-600">{summary.open}</span> open</span>
          <span className="w-1 h-1 rounded-full bg-slate-200" />
          <span><span className="font-semibold text-slate-600">{summary.inProgress}</span> in progress</span>
          <span className="w-1 h-1 rounded-full bg-slate-200" />
          <span><span className="font-semibold text-slate-600">{summary.resolved}</span> resolved</span>
        </div>

        {/* Sign Out */}
        <button onClick={onLogout} className="mt-10 flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Sign Out
        </button>

        <Toasts items={toasts} />
      </div>
    );
  }

  /* ════════════════════════════════════════════════
     DASHBOARD — full ticket management view
     ════════════════════════════════════════════════ */
  var chartColors = { Open: "from-slate-300 to-slate-400", "In Progress": "from-blue-400 to-blue-500", Escalated: "from-amber-400 to-orange-500", Resolved: "from-emerald-400 to-emerald-500" };
  var chartCounts = { Open: summary.open, "In Progress": summary.inProgress, Escalated: summary.escalated, Resolved: summary.resolved };
  var chartMax = Math.max(summary.open, summary.inProgress, summary.escalated, summary.resolved, 1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ── Mobile Header ── */}
      <div className="lg:hidden sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white/95 backdrop-blur">
        <button onClick={goHome} className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[10px] font-bold flex items-center justify-center">ER</div>
          <span className="font-bold text-slate-900 text-sm">EasyRide</span>
        </button>
        <button onClick={onLogout} className="text-xs text-slate-400 hover:text-slate-600 transition">Sign Out</button>
      </div>

      <div className="flex min-h-screen">
        {/* ── Desktop Sidebar ── */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-200/60 bg-white p-5 lg:flex lg:flex-col sticky top-0 h-screen">
          <button onClick={goHome} className="flex items-center gap-3 mb-8 hover:opacity-70 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold flex items-center justify-center shadow-sm">ER</div>
            <div className="text-left">
              <div className="text-sm font-bold text-slate-900">EasyRide</div>
              <div className="text-xs text-slate-400">Back to Home</div>
            </div>
          </button>
          <nav className="space-y-1">
            <div className="flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Tickets
            </div>
          </nav>
          <div className="mt-8 rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">Your Name</div>
            <input list="staff-sidebar" value={currentUser} onChange={function (e) { setCurrentUser(e.target.value); }} placeholder="Your name" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 transition" />
            <datalist id="staff-sidebar">{STAFF_LIST.map(function (n) { return <option key={n} value={n} />; })}</datalist>
            <div className="mt-2 text-xs text-slate-400">For "My Tickets" filter</div>
          </div>
          <div className="mt-auto pt-6">
            <button type="button" onClick={onLogout} className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Ticket Dashboard</h1>
                <p className="mt-1 text-sm text-slate-400">{filteredTickets.length} of {tickets.length} tickets</p>
              </div>
              <button type="button" onClick={function () { setCreateOpen(true); }} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all self-start sm:self-auto">+ New Ticket</button>
            </div>

            {/* Stat Cards */}
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
              <StatCard title="Total" value={summary.total} hint="All tickets" />
              <StatCard title="Open" value={summary.open} hint="Awaiting action" />
              <StatCard title="In Progress" value={summary.inProgress} hint="Being handled" accent="border-blue-200/60 bg-blue-50/30" />
              <StatCard title="Escalated" value={summary.escalated} hint="Needs attention" accent="border-amber-200/60 bg-amber-50/30" />
              <StatCard title="Resolved" value={summary.resolved} hint={summary.avgDays > 0 ? "Avg " + summary.avgDays.toFixed(1) + "d" : "Completed"} accent="border-emerald-200/60 bg-emerald-50/30" />
            </div>

            {/* Status Chart */}
            <div className="mt-5">
              <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">Status Overview</div>
                <div className="flex items-end justify-around gap-4" style={{ height: "100px" }}>
                  {STATUS_ORDER.map(function (s) {
                    return (
                      <div key={s} className="flex flex-col items-center gap-1.5 flex-1">
                        <div className="text-sm font-bold text-slate-700">{chartCounts[s]}</div>
                        <div className="w-full max-w-[36px] rounded-lg overflow-hidden" style={{ height: Math.max(chartCounts[s] / chartMax * 60, 4) + "px" }}>
                          <div className={"w-full h-full rounded-lg bg-gradient-to-t " + chartColors[s]} />
                        </div>
                        <div className="text-[10px] font-medium text-slate-400 text-center leading-tight">{s}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ticket List Panel */}
            <div className="mt-5 rounded-2xl border border-slate-200/60 bg-white shadow-sm">

              {/* Filters */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input value={search} onChange={function (e) { setSearch(e.target.value); }} placeholder="Search riders, issues, IDs..." className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <select value={statusFilter} onChange={function (e) { setStatusFilter(e.target.value); }} className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 transition">
                      <option value="All">All Statuses</option>
                      {STATUS_ORDER.map(function (s) { return <option key={s} value={s}>{s}</option>; })}
                    </select>
                    <select value={sortBy} onChange={function (e) { setSortBy(e.target.value); }} className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 transition">
                      <option value="timestamp">Newest first</option>
                      <option value="status">By Status</option>
                      <option value="duration">By Duration</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {[{ key: "all", label: "All" }, { key: "unresolved", label: "Unresolved" }, { key: "escalated", label: "Escalated" }, { key: "my", label: "My Tickets" }].map(function (item) {
                    return <button key={item.key} type="button" onClick={function () { setQuickFilter(quickFilter === item.key ? "none" : item.key); }} className={"rounded-lg px-3 py-1.5 text-xs font-semibold transition " + (quickFilter === item.key ? "bg-indigo-500 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>{item.label}</button>;
                  })}
                </div>
              </div>

              {/* ── Desktop Table ── */}
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Rider</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Issue</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 hidden lg:table-cell">Assigned</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.length ? filteredTickets.map(function (ticket) {
                      var warn = getWarningLevel(ticket, nowMs);
                      var border = warn === "critical" ? "border-l-rose-500" : warn === "warning" ? "border-l-amber-400" : "border-l-transparent";
                      return (
                        <tr key={ticket.id} onClick={function () { setSelectedTicketId(ticket.id); }} className={"cursor-pointer border-b border-slate-50 border-l-4 transition hover:bg-indigo-50/40 " + border}>
                          <td className="px-5 py-3.5">
                            <div className="font-medium text-slate-900">{ticket.riderName || "\u2014"}</div>
                            <div className="text-xs text-slate-400">{ticket.riderNo}</div>
                          </td>
                          <td className="px-5 py-3.5 max-w-[400px]">
                            <div className="font-medium text-slate-800 truncate">{ticket.issue || "\u2014"}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{ticket.id} &middot; {formatDateTime(ticket.timestampReceived)}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge tone={STATUS_STYLES[ticket.status]}>{ticket.status}</Badge>
                          </td>
                          <td className="px-5 py-3.5 hidden lg:table-cell">
                            <div className="text-sm text-slate-600">{ticket.responsiblePerson || "\u2014"}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={"text-xs font-semibold " + (warn === "critical" ? "text-rose-600" : warn === "warning" ? "text-amber-600" : "text-slate-500")}>{formatDuration(ticket, nowMs)}</span>
                          </td>
                        </tr>
                      );
                    }) : <tr><td colSpan={5} className="px-5 py-16 text-center text-sm text-slate-400">{quickFilter === "none" ? "Select a filter above to view tickets." : "No tickets match your filters."}</td></tr>}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile Cards ── */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredTickets.length ? filteredTickets.map(function (ticket) {
                  var warn = getWarningLevel(ticket, nowMs);
                  var border = warn === "critical" ? "border-l-rose-500" : warn === "warning" ? "border-l-amber-400" : "border-l-transparent";
                  return (
                    <div key={ticket.id} onClick={function () { setSelectedTicketId(ticket.id); }} className={"p-4 cursor-pointer hover:bg-slate-50 transition border-l-4 " + border}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-slate-900">{ticket.riderName || "\u2014"}</div>
                          <div className="text-xs text-slate-400">{ticket.riderNo} &middot; {ticket.id}</div>
                        </div>
                        <Badge tone={STATUS_STYLES[ticket.status]}>{ticket.status}</Badge>
                      </div>
                      <div className="mt-2 text-sm text-slate-600 truncate">{ticket.issue}</div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-slate-400">{ticket.responsiblePerson || "Unassigned"}</span>
                        <span className={"font-semibold " + (warn === "critical" ? "text-rose-600" : warn === "warning" ? "text-amber-600" : "text-slate-400")}>{formatDuration(ticket, nowMs)}</span>
                      </div>
                    </div>
                  );
                }) : <div className="p-8 text-center text-sm text-slate-400">{quickFilter === "none" ? "Select a filter above to view tickets." : "No tickets match your filters."}</div>}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
                Showing {filteredTickets.length} of {tickets.length} tickets &middot; Click a row to view details
              </div>
            </div>
          </div>
        </main>
      </div>

      <TicketDrawer ticket={selectedTicket} onClose={function () { setSelectedTicketId(""); }} onChange={updateTicket} onSave={saveTicketToSheet} onDelete={deleteTicket} onAddComment={addComment} staffOptions={staffOptions} currentUser={currentUser} nowMs={nowMs} />
      <CreateTicketModal open={createOpen} onClose={function () { setCreateOpen(false); }} onCreate={createTicket} staffOptions={staffOptions} />
      <Toasts items={toasts} />
    </div>
  );
}

function Root() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(function () {
    return auth.onAuthStateChanged(function (u) { setUser(u); setChecking(false); });
  }, []);

  if (checking) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">Loading...</div>;
  if (!user) return <LoginPage onLogin={function (u) { setUser(u); }} />;
  return <ErrorBoundary><App onLogout={function () { auth.signOut(); }} /></ErrorBoundary>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);

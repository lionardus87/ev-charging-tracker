"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSessions } from "@/src/client/hooks/useSessions";
import { exportSessionsCsv, importSessionsCsv, getSessions } from "@/src/lib/api";
import { ChargingSession, ChargingSpeed } from "@/src/types";

// ── constants ─────────────────────────────────────────────

const SPEED_COLORS: Record<string, string> = {
  slow:    "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  regular: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  fast:    "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
};
const SPEED_LABEL: Record<string, string> = {
  slow: "🐢 Slow",
  regular: "⚡ Regular",
  fast: "🚀 Fast",
};

type SortKey = "date" | "cost" | "kwh" | "rate";
type SortDir = "asc" | "desc";

// ── sort/filter helpers ───────────────────────────────────

function sortSessions(sessions: ChargingSession[], key: SortKey, dir: SortDir) {
  return [...sessions].sort((a, b) => {
    let av: number | string = 0;
    let bv: number | string = 0;
    if (key === "date") { av = a.date; bv = b.date; }
    if (key === "cost") { av = a.cost ?? 0; bv = b.cost ?? 0; }
    if (key === "kwh")  { av = a.kwh_added; bv = b.kwh_added; }
    if (key === "rate") { av = a.rate_per_kwh ?? 0; bv = b.rate_per_kwh ?? 0; }
    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

// ── SortButton ────────────────────────────────────────────

function SortBtn({
  label,
  field,
  current,
  dir,
  onClick,
}: {
  label: string;
  field: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (f: SortKey) => void;
}) {
  const active = current === field;
  return (
    <button
      onClick={() => onClick(field)}
      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 ${
        active
          ? "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 font-semibold"
          : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      {label}
      {active && <span className="ml-0.5">{dir === "desc" ? "↓" : "↑"}</span>}
    </button>
  );
}

// ── main ──────────────────────────────────────────────────

export default function HistoryClient() {
  const { sessions, setSessions, loading, handleDelete } = useSessions();

  const [exporting, setExporting]   = useState(false);
  const [importing, setImporting]   = useState(false);
  const [sortKey, setSortKey]       = useState<SortKey>("date");
  const [sortDir, setSortDir]       = useState<SortDir>("desc");
  const [filterSpeed, setFilterSpeed] = useState<ChargingSpeed | "all">("all");
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");

  // derive filter options
  const providers = useMemo(() => {
    const set = new Set(sessions.map((s) => s.provider).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [sessions]);

  const years = useMemo(() => {
    const set = new Set(sessions.map((s) => new Date(s.date).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [sessions]);

  // apply filters + sort
  const filtered = useMemo(() => {
    let list = [...sessions];
    if (filterSpeed    !== "all") list = list.filter((s) => s.charging_speed === filterSpeed);
    if (filterProvider !== "all") list = list.filter((s) => s.provider === filterProvider);
    if (filterYear     !== "all") list = list.filter((s) => new Date(s.date).getFullYear() === parseInt(filterYear));
    if (filterMonth    !== "all") list = list.filter((s) => new Date(s.date).getMonth() === parseInt(filterMonth));
    return sortSessions(list, sortKey, sortDir);
  }, [sessions, filterSpeed, filterProvider, filterYear, filterMonth, sortKey, sortDir]);

  function toggleSort(field: SortKey) {
    if (sortKey === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(field);
      setSortDir("desc");
    }
  }

  function clearFilters() {
    setFilterSpeed("all");
    setFilterProvider("all");
    setFilterYear("all");
    setFilterMonth("all");
    setSortKey("date");
    setSortDir("desc");
  }

  const hasActiveFilter =
    filterSpeed !== "all" || filterProvider !== "all" ||
    filterYear  !== "all" || filterMonth    !== "all";

  async function handleExport() {
    setExporting(true);
    try { await exportSessionsCsv(); }
    catch { alert("Export failed"); }
    finally { setExporting(false); }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const { data, error } = await importSessionsCsv(file);
    if (error) { alert("Import failed: " + error); }
    else {
      alert(data);
      const { data: refreshed } = await getSessions();
      if (refreshed) setSessions(refreshed);
    }
    setImporting(false);
    e.target.value = "";
  }

  const selectClass =
    "text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-5 animate-fade-in">

      {/* header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sessions</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {filtered.length} of {sessions.length} sessions
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium px-3 py-1.5 rounded-lg transition cursor-pointer">
            {importing ? "Importing…" : "⬆ Import CSV"}
            <input type="file" accept=".csv" onChange={handleImport} disabled={importing} className="hidden" />
          </label>
          <button
            onClick={handleExport}
            disabled={exporting || !sessions.length}
            className="border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-40"
          >
            {exporting ? "Exporting…" : "⬇ Export CSV"}
          </button>
          <Link
            href="/dashboard/log"
            className="bg-green-600 hover:bg-green-700 active:scale-95 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
          >
            + Log session
          </Link>
        </div>
      </div>

      {/* filter + sort bar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400 font-medium mr-1">Filter</span>

          {/* speed */}
          <select value={filterSpeed} onChange={(e) => setFilterSpeed(e.target.value as ChargingSpeed | "all")} className={selectClass}>
            <option value="all">All speeds</option>
            <option value="slow">🐢 Slow</option>
            <option value="regular">⚡ Regular</option>
            <option value="fast">🚀 Fast</option>
          </select>

          {/* provider */}
          {providers.length > 0 && (
            <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)} className={selectClass}>
              <option value="all">All providers</option>
              {providers.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          )}

          {/* year */}
          {years.length > 0 && (
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className={selectClass}>
              <option value="all">All years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}

          {/* month */}
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className={selectClass}>
            <option value="all">All months</option>
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>

          {hasActiveFilter && (
            <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-600 transition ml-1">
              ✕ Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center pt-1 border-t border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-400 font-medium mr-1">Sort</span>
          <SortBtn label="Date"    field="date" current={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortBtn label="Cost"    field="cost" current={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortBtn label="kWh"     field="kwh"  current={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortBtn label="$/kWh"   field="rate" current={sortKey} dir={sortDir} onClick={toggleSort} />
        </div>
      </div>

      {/* session list */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-6 py-16 text-center">
          <p className="text-3xl mb-3">🔍</p>
          <p className="font-medium text-gray-600 dark:text-gray-300">No sessions match</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          <button onClick={clearFilters} className="mt-4 text-sm text-green-600 hover:underline">Clear filters</button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {filtered.map((session, i) => (
            <div
              key={session.id}
              style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
              className="px-5 py-4 flex justify-between items-start gap-4 animate-fade-in group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{session.date}</p>
                  {session.provider && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                      {session.provider}
                    </span>
                  )}
                  {session.charging_speed && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${SPEED_COLORS[session.charging_speed]}`}>
                      {SPEED_LABEL[session.charging_speed]}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{session.kwh_added.toFixed(2)} kWh</span>
                  {session.start_percent != null && session.end_percent != null && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {session.start_percent}% → {session.end_percent}%
                    </span>
                  )}
                  {session.duration_minutes && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">{session.duration_minutes} min</span>
                  )}
                  {session.odometer && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">{session.odometer.toLocaleString()} km</span>
                  )}
                  {session.notes && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">{session.notes}</span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 flex items-start gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {session.cost ? "$" + session.cost.toFixed(2) : "Free"}
                  </p>
                  {session.rate_per_kwh && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">${session.rate_per_kwh.toFixed(3)}/kWh</p>
                  )}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/dashboard/history/${session.id}/edit`}
                    className="text-gray-400 hover:text-blue-500 transition text-sm"
                    title="Edit"
                  >
                    ✏️
                  </Link>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="text-gray-400 hover:text-red-500 transition text-sm"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useSessions } from "@/src/client/hooks/useSessions";
import { ChargingSession } from "@/src/types";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

// ── constants ─────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const SPEED_COLORS: Record<string, string> = {
  slow:    "#3b82f6",
  regular: "#f59e0b",
  fast:    "#ef4444",
};

const PALETTE = ["#10b981","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];

// ── helpers ───────────────────────────────────────────────

function buildMonthly(sessions: ChargingSession[], year: number) {
  const map: Record<number, { kwh: number; cost: number; count: number }> = {};
  for (let i = 0; i < 12; i++) map[i] = { kwh: 0, cost: 0, count: 0 };
  sessions
    .filter((s) => new Date(s.date).getFullYear() === year)
    .forEach((s) => {
      const m = new Date(s.date).getMonth();
      map[m].kwh   += s.kwh_added;
      map[m].cost  += s.cost || 0;
      map[m].count += 1;
    });
  return MONTHS.map((name, i) => ({
    name,
    kwh:   parseFloat(map[i].kwh.toFixed(2)),
    cost:  parseFloat(map[i].cost.toFixed(2)),
    count: map[i].count,
  }));
}

function buildSpeedBreakdown(sessions: ChargingSession[]) {
  const map: Record<string, number> = { slow: 0, regular: 0, fast: 0, unknown: 0 };
  sessions.forEach((s) => {
    const k = s.charging_speed ?? "unknown";
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
}

function buildProviderBreakdown(sessions: ChargingSession[]) {
  const map: Record<string, { kwh: number; cost: number; count: number }> = {};
  sessions.forEach((s) => {
    const key = s.provider || "Unknown";
    if (!map[key]) map[key] = { kwh: 0, cost: 0, count: 0 };
    map[key].kwh   += s.kwh_added;
    map[key].cost  += s.cost || 0;
    map[key].count += 1;
  });
  return Object.entries(map)
    .map(([name, v]) => ({ name, ...v, kwh: parseFloat(v.kwh.toFixed(2)), cost: parseFloat(v.cost.toFixed(2)) }))
    .sort((a, b) => b.count - a.count);
}

function buildYearly(sessions: ChargingSession[]) {
  const map: Record<number, { kwh: number; cost: number; count: number }> = {};
  sessions.forEach((s) => {
    const y = new Date(s.date).getFullYear();
    if (!map[y]) map[y] = { kwh: 0, cost: 0, count: 0 };
    map[y].kwh   += s.kwh_added;
    map[y].cost  += s.cost || 0;
    map[y].count += 1;
  });
  return Object.entries(map)
    .map(([year, v]) => ({ name: year, year, ...v, kwh: parseFloat(v.kwh.toFixed(2)), cost: parseFloat(v.cost.toFixed(2)) }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));
}

// ── custom tooltip ────────────────────────────────────────

function CustomTooltip({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2 text-xs min-w-[100px]">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-gray-500 dark:text-gray-400">
          {p.name}:{" "}
          <span className="font-semibold" style={{ color: p.color }}>
            {p.name === "cost" || p.name === "Cost"  ? "$" : ""}
            {p.value}
            {p.name === "kwh"  || p.name === "Energy" ? " kWh" : ""}
          </span>
        </p>
      ))}
    </div>
  );
}

// ── chart card wrapper ────────────────────────────────────

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 animate-fade-in hover:shadow-md transition-shadow duration-200">
      <div className="mb-5">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ── main ──────────────────────────────────────────────────

export default function ChartsClient() {
  const { sessions, loading } = useSessions();
  const [view, setView]   = useState<"monthly" | "yearly">("monthly");
  const [metric, setMetric] = useState<"kwh" | "cost" | "count">("kwh");

  const years = useMemo(() => {
    const set = new Set(sessions.map((s) => new Date(s.date).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [sessions]);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const activeYear = selectedYear ?? years[0] ?? new Date().getFullYear();

  const monthlyData   = useMemo(() => buildMonthly(sessions, activeYear), [sessions, activeYear]);
  const yearlyData    = useMemo(() => buildYearly(sessions), [sessions]);
  const speedData     = useMemo(() => buildSpeedBreakdown(sessions), [sessions]);
  const providerData  = useMemo(() => buildProviderBreakdown(sessions), [sessions]);

  const metricLabel: Record<typeof metric, string> = {
    kwh:   "Energy (kWh)",
    cost:  "Spend ($)",
    count: "Sessions",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center animate-fade-in">
        <p className="text-5xl mb-4">📊</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">No data yet</h2>
        <p className="text-gray-400 mt-2">Log some charging sessions and charts will appear here.</p>
      </main>
    );
  }

  const barColor   = metric === "kwh" ? "#10b981" : metric === "cost" ? "#3b82f6" : "#f59e0b";
  const chartData  = view === "monthly" ? monthlyData : yearlyData;
  const xKey       = view === "monthly" ? "name" : "year";

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* header */}
      <div className="animate-fade-in">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Charts</h2>
        <p className="text-xs text-gray-400 mt-0.5">Visualise your charging history</p>
      </div>

      {/* controls */}
      <div className="flex flex-wrap gap-3 items-center animate-fade-in">
        {/* view toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
          {(["monthly","yearly"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all duration-150 ${
                view === v
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* metric toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
          {(["kwh","cost","count"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all duration-150 ${
                metric === m
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {m === "kwh" ? "Energy" : m === "cost" ? "Spend" : "Sessions"}
            </button>
          ))}
        </div>

        {/* year selector (only for monthly) */}
        {view === "monthly" && years.length > 1 && (
          <select
            value={activeYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>

      {/* main bar / line chart */}
      <ChartCard
        title={`${metricLabel[metric]} · ${view === "monthly" ? activeYear : "All years"}`}
        subtitle={view === "monthly" ? "Monthly breakdown" : "Year-over-year comparison"}
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:[&>line]:stroke-gray-800" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(16,185,129,0.06)" }} />
            <Bar dataKey={metric} name={metric} fill={barColor} radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* spend line chart */}
      {view === "monthly" && (
        <ChartCard
          title={`Cost trend · ${activeYear}`}
          subtitle="Monthly spend as a line"
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:[&>line]:stroke-gray-800" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="cost"
                name="Cost"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#3b82f6" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* bottom row: speed + provider */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* speed pie */}
        <ChartCard title="Charging speed" subtitle="Session count by speed type">
          {speedData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No speed data logged</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={speedData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {speedData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={SPEED_COLORS[entry.name.toLowerCase()] ?? "#9ca3af"}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} sessions`]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* provider bar */}
        <ChartCard title="By provider" subtitle="Sessions per charging network">
          {providerData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No provider data logged</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={providerData} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" className="dark:[&>line]:stroke-gray-800" />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Sessions" radius={[0, 4, 4, 0]}>
                  {providerData.map((_, index) => (
                    <Cell key={index} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* summary table */}
      <ChartCard title="Provider summary" subtitle="Energy and spend breakdown by network">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                <th className="pb-3 font-medium">Provider</th>
                <th className="pb-3 font-medium text-right">Sessions</th>
                <th className="pb-3 font-medium text-right">Total kWh</th>
                <th className="pb-3 font-medium text-right">Total cost</th>
                <th className="pb-3 font-medium text-right">Avg $/kWh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {providerData.map((p, i) => (
                <tr key={p.name} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <td className="py-2.5 font-medium text-gray-900 dark:text-white">{p.name}</td>
                  <td className="py-2.5 text-right text-gray-600 dark:text-gray-300">{p.count}</td>
                  <td className="py-2.5 text-right text-gray-600 dark:text-gray-300">{p.kwh} kWh</td>
                  <td className="py-2.5 text-right text-gray-600 dark:text-gray-300">${p.cost.toFixed(2)}</td>
                  <td className="py-2.5 text-right text-gray-600 dark:text-gray-300">
                    {p.kwh > 0 && p.cost > 0 ? "$" + (p.cost / p.kwh).toFixed(3) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

    </main>
  );
}

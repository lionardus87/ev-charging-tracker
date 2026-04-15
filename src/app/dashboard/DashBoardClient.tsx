"use client";

import Link from "next/link";
import { useAuth } from "@/src/client/context/AuthContext";
import { useSessions } from "@/src/client/hooks/useSessions";
import { ChargingSession } from "@/src/types";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
} from "recharts";

// ── helpers ───────────────────────────────────────────────

const MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

const speedLabel: Record<string, string> = {
	slow: "🐢 Slow",
	regular: "⚡ Regular",
	fast: "🚀 Fast",
};

const speedColor: Record<string, string> = {
	slow: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
	regular:
		"bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
	fast: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
};

function getYearSessions(sessions: ChargingSession[], year: number) {
	return sessions.filter((s) => new Date(s.date).getFullYear() === year);
}

function buildMonthlyData(sessions: ChargingSession[]) {
	const map: Record<number, { kwh: number; cost: number; count: number }> = {};
	for (let i = 0; i < 12; i++) map[i] = { kwh: 0, cost: 0, count: 0 };
	sessions.forEach((s) => {
		const m = new Date(s.date).getMonth();
		map[m].kwh += s.kwh_added;
		map[m].cost += s.cost || 0;
		map[m].count += 1;
	});
	return MONTHS.map((name, i) => ({
		name,
		kwh: parseFloat(map[i].kwh.toFixed(2)),
		cost: parseFloat(map[i].cost.toFixed(2)),
		count: map[i].count,
	}));
}

// ── stat card ─────────────────────────────────────────────

function StatCard({
	label,
	value,
	sub,
	accent = false,
}: {
	label: string;
	value: string | number;
	sub?: string;
	accent?: boolean;
}) {
	return (
		<div
			className={`rounded-2xl border p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in ${
				accent
					? "bg-green-600 border-green-600 text-white"
					: "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
			}`}
		>
			<p
				className={`text-xs uppercase tracking-wide font-medium ${accent ? "text-green-100" : "text-gray-500 dark:text-gray-400"}`}
			>
				{label}
			</p>
			<p
				className={`text-3xl font-bold mt-1 ${accent ? "text-white" : "text-gray-900 dark:text-white"}`}
			>
				{value}
			</p>
			{sub && (
				<p
					className={`text-xs mt-1 ${accent ? "text-green-200" : "text-gray-400 dark:text-gray-500"}`}
				>
					{sub}
				</p>
			)}
		</div>
	);
}

// ── custom tooltip ────────────────────────────────────────

function ChartTooltip({
	active,
	payload,
	label,
}: {
	active?: boolean;
	payload?: { value: number; name: string }[];
	label?: string;
}) {
	if (!active || !payload?.length) return null;
	return (
		<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2 text-xs">
			<p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
				{label}
			</p>
			{payload.map((p) => (
				<p key={p.name} className="text-gray-500 dark:text-gray-400">
					{p.name === "kwh" ? "Energy" : "Spend"}:{" "}
					<span className="font-medium text-gray-800 dark:text-gray-100">
						{p.name === "kwh" ? `${p.value} kWh` : `$${p.value}`}
					</span>
				</p>
			))}
		</div>
	);
}

// ── main component ────────────────────────────────────────

export default function DashboardClient() {
	const { user } = useAuth();
	const { sessions, stats, loading } = useSessions();

	const currentYear = new Date().getFullYear();
	const yearSessions = getYearSessions(sessions, currentYear);
	const monthlyData = buildMonthlyData(yearSessions);

	const yearKwh = yearSessions.reduce((a, s) => a + s.kwh_added, 0);
	const yearCost = yearSessions.reduce((a, s) => a + (s.cost || 0), 0);
	const lastThree = [...sessions]
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.slice(0, 3);

	// current month stats
	const now = new Date();
	const monthSessions = sessions.filter((s) => {
		const d = new Date(s.date);
		return (
			d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
		);
	});
	const monthKwh = monthSessions.reduce((a, s) => a + s.kwh_added, 0);
	const monthCost = monthSessions.reduce((a, s) => a + (s.cost || 0), 0);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="flex flex-col items-center gap-3">
					<div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
					<p className="text-sm text-gray-400">Loading your data…</p>
				</div>
			</div>
		);
	}

	return (
		<main className="max-w-5xl mx-auto px-4 py-8 space-y-5">
			{/* ── greeting ──────────────────────────────────────── */}
			<div className="animate-fade-in">
				<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
					Hey{user?.email ? ", " + user.email.split("@")[0] : ""} 👋
				</h2>
				<p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
					Here&apos;s your charging overview for {currentYear}
				</p>
			</div>

			{/* ── year overview hero card ────────────────────────── */}
			<div className="rounded-2xl bg-linear-to-br from-green-600 to-emerald-700 p-5 text-white shadow-lg animate-scale-in">
				<div className="flex justify-between items-start mb-6">
					<div>
						<p className="text-green-100 text-sm font-medium">
							{currentYear} Overview
						</p>
						<p className="text-4xl font-bold mt-1">{yearSessions.length} sessions</p>
					</div>
					<span className="text-4xl">⚡</span>
				</div>
				<div className="grid grid-cols-3 gap-4">
					<div>
						<p className="text-green-200 text-xs uppercase tracking-wide">
							Total energy
						</p>
						<p className="text-xl font-bold mt-0.5">{yearKwh.toFixed(1)} kWh</p>
					</div>
					<div>
						<p className="text-green-200 text-xs uppercase tracking-wide">
							Total spent
						</p>
						<p className="text-xl font-bold mt-0.5">${yearCost.toFixed(2)}</p>
					</div>
					<div>
						<p className="text-green-200 text-xs uppercase tracking-wide">
							This month
						</p>
						<p className="text-xl font-bold mt-0.5">
							{monthSessions.length > 0
								? `${monthSessions.length} · $${monthCost.toFixed(2)}`
								: "No sessions"}
						</p>
					</div>
				</div>
			</div>

			{/* ── stat cards ────────────────────────────────────── */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard label="All-time sessions" value={stats?.totalSessions ?? 0} />
				<StatCard
					label="Total energy"
					value={stats ? stats.totalKwh.toFixed(1) + " kWh" : "—"}
				/>
				<StatCard
					label="Total spent"
					value={stats ? "$" + stats.totalCost.toFixed(2) : "—"}
				/>
				<StatCard
					label="Avg rate"
					value={stats?.avgRate ? "$" + stats.avgRate.toFixed(3) : "—"}
					sub="per kWh"
				/>
			</div>

			{/* ── efficiency cards ──────────────────────────────── */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard
					label="Avg efficiency"
					value={stats?.avgEfficiency ? stats.avgEfficiency.toFixed(2) : "—"}
					sub="km per kWh"
				/>
				<StatCard
					label="Range per % battery"
					value={stats?.kmPerPercent ? stats.kmPerPercent.toFixed(2) : "—"}
					sub="km per 1% · log odometer to calculate"
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* ── monthly chart ─────────────────────────────────── */}
				<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 animate-fade-in">
					<div className="flex justify-between items-center mb-5">
						<div>
							<h3 className="font-semibold text-gray-900 dark:text-white">
								Monthly energy · {currentYear}
							</h3>
							<p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
								kWh added per month
							</p>
						</div>
						<Link
							href="/dashboard/charts"
							className="text-xs text-green-600 hover:underline"
						>
							Full charts →
						</Link>
					</div>
					{yearSessions.length === 0 ? (
						<div className="h-40 flex items-center justify-center text-gray-400 text-sm">
							No data yet for {currentYear}
						</div>
					) : (
						<ResponsiveContainer width="100%" height={180}>
							<BarChart data={monthlyData} barSize={18}>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="#f0f0f0"
									className="dark:[&>line]:stroke-gray-800"
								/>
								<XAxis
									dataKey="name"
									tick={{ fontSize: 11 }}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
								<Tooltip
									content={<ChartTooltip />}
									cursor={{ fill: "rgba(16,185,129,0.08)" }}
								/>
								<Bar dataKey="kwh" fill="#10b981" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					)}
				</div>

				{/* ── recent sessions ───────────────────────────────── */}
				<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 animate-fade-in">
					<div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
						<h3 className="font-semibold text-gray-900 dark:text-white">
							Recent sessions
						</h3>
						<Link
							href="/dashboard/history"
							className="text-xs text-green-600 hover:underline"
						>
							View all →
						</Link>
					</div>

					{lastThree.length === 0 ? (
						<div className="px-6 py-14 text-center">
							<p className="text-4xl mb-3">⚡</p>
							<p className="font-medium text-gray-600 dark:text-gray-300">
								No sessions yet
							</p>
							<p className="text-sm mt-1 text-gray-400">
								Log your first charging session to get started
							</p>
							<Link
								href="/dashboard/log"
								className="inline-block mt-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
							>
								Log first session
							</Link>
						</div>
					) : (
						<div className="divide-y divide-gray-100 dark:divide-gray-800">
							{lastThree.map((session, i) => (
								<div
									key={session.id}
									style={{ animationDelay: `${i * 60}ms` }}
									className="px-6 py-4 flex justify-between items-center animate-fade-in group"
								>
									<div>
										<div className="flex items-center gap-2 flex-wrap">
											<p className="text-sm font-medium text-gray-900 dark:text-white">
												{session.date}
											</p>
											{session.provider && (
												<span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
													{session.provider}
												</span>
											)}
											{session.charging_speed && (
												<span
													className={`text-xs px-2 py-0.5 rounded-full ${speedColor[session.charging_speed]}`}
												>
													{speedLabel[session.charging_speed]}
												</span>
											)}
										</div>
										<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
											{session.kwh_added.toFixed(2)} kWh
											{session.start_percent != null &&
												session.end_percent != null &&
												` · ${session.start_percent}% → ${session.end_percent}%`}
										</p>
									</div>
									<div className="text-right">
										<p className="text-sm font-semibold text-gray-900 dark:text-white">
											{session.cost ? "$" + session.cost.toFixed(2) : "Free"}
										</p>
										{session.rate_per_kwh && (
											<p className="text-xs text-gray-400 dark:text-gray-500">
												${session.rate_per_kwh.toFixed(3)}/kWh
											</p>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* ── quick month stats ─────────────────────────────── */}
			{monthSessions.length > 0 && (
				<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 animate-fade-in">
					<h3 className="font-semibold text-gray-900 dark:text-white mb-4">
						{MONTHS[now.getMonth()]} {currentYear}
					</h3>
					<div className="grid grid-cols-3 gap-4">
						<div>
							<p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
								Sessions
							</p>
							<p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
								{monthSessions.length}
							</p>
						</div>
						<div>
							<p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
								Energy
							</p>
							<p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
								{monthKwh.toFixed(1)}{" "}
								<span className="text-sm font-normal text-gray-400">kWh</span>
							</p>
						</div>
						<div>
							<p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
								Spent
							</p>
							<p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
								${monthCost.toFixed(2)}
							</p>
						</div>
					</div>
				</div>
			)}
		</main>
	);
}

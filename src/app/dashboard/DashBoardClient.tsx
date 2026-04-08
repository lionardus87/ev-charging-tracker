"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";
import { getSessions, calculateStats } from "@/src/lib/api";
import { ChargingSession, SessionStats } from "@/src/types";
import ThemeToggle from "@/src/components/ThemeToggle";

const locationLabel: Record<string, string> = {
	home: "🏠 Home",
	public: "🔌 Public AC",
	fast: "⚡ DC Fast",
};

export default function DashboardClient() {
	const { user, signOut } = useAuth();
	const [sessions, setSessions] = useState<ChargingSession[]>([]);
	const [stats, setStats] = useState<SessionStats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			const { data, error } = await getSessions();
			if (error || !data) return;
			setSessions(data);
			setStats(calculateStats(data));
			setLoading(false);
		}
		load();
	}, []);

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
				<p className="text-gray-400 text-sm">Loading...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
			<nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
				<h1 className="text-xl font-bold text-gray-900 dark:text-white">
					⚡ EV Tracker
				</h1>
				<div className="flex items-center gap-4">
					<ThemeToggle />
					<span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
						{user?.email}
					</span>
					<Link
						href="/dashboard/log"
						className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
					>
						+ Log session
					</Link>
					<button
						onClick={signOut}
						className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
					>
						Sign out
					</button>
				</div>
			</nav>

			<main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
				<div>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
						Dashboard
					</h2>
					<p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
						Your charging overview
					</p>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
					{[
						{ label: "Total sessions", value: stats?.totalSessions ?? 0, sub: null },
						{
							label: "Total energy",
							value: stats?.totalKwh.toFixed(1) ?? 0,
							sub: "kWh",
						},
						{
							label: "Total spent",
							value: "$" + (stats?.totalCost.toFixed(2) ?? "0.00"),
							sub: null,
						},
						{
							label: "Avg rate",
							value: stats?.avgRate ? "$" + stats.avgRate.toFixed(3) : "—",
							sub: "per kWh",
						},
					].map(({ label, value, sub }) => (
						<div
							key={label}
							className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
						>
							<p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
								{label}
							</p>
							<p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
								{value}
							</p>
							{sub && (
								<p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
							)}
						</div>
					))}
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
						<p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
							Avg efficiency
						</p>
						<p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
							{stats?.avgEfficiency ? stats.avgEfficiency.toFixed(2) : "—"}
						</p>
						<p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
							km per kWh
						</p>
					</div>
					<div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
						<p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
							km per 1% battery
						</p>
						<p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
							{stats?.kmPerPercent ? stats.kmPerPercent.toFixed(2) : "—"}
						</p>
						<p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
							log odometer to calculate
						</p>
					</div>
				</div>

				<div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
					<div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
						<h3 className="font-semibold text-gray-900 dark:text-white">
							Recent sessions
						</h3>
						<Link
							href="/dashboard/history"
							className="text-sm text-green-600 hover:underline"
						>
							View all
						</Link>
					</div>
					{!sessions.length ? (
						<div className="px-6 py-12 text-center">
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
							{sessions.slice(0, 5).map((session) => (
								<div
									key={session.id}
									className="px-6 py-4 flex justify-between items-center"
								>
									<div>
										<p className="text-sm font-medium text-gray-900 dark:text-white">
											{session.date}
										</p>
										<p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
											{locationLabel[session.location_type]} ·{" "}
											{session.kwh_added.toFixed(1)} kWh
										</p>
									</div>
									<div className="text-right">
										<p className="text-sm font-medium text-gray-900 dark:text-white">
											{session.cost ? "$" + session.cost.toFixed(2) : "Free"}
										</p>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											{session.rate_per_kwh
												? "$" + session.rate_per_kwh.toFixed(3) + "/kWh"
												: ""}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</main>
		</div>
	);
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";
import { getSessions, calculateStats } from "@/src/lib/api";
import { ChargingSession, SessionStats } from "@/src/types";

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
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<p className="text-gray-400 text-sm">Loading...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
				<h1 className="text-xl font-bold text-gray-900">⚡ EV Tracker</h1>
				<div className="flex items-center gap-4">
					<span className="text-sm text-gray-500 hidden sm:block">
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
						className="text-sm text-gray-500 hover:text-gray-700"
					>
						Sign out
					</button>
				</div>
			</nav>

			<main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
					<p className="text-gray-500 text-sm mt-1">Your charging overview</p>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
					<div className="bg-white rounded-xl border border-gray-200 p-5">
						<p className="text-xs text-gray-500 uppercase tracking-wide">
							Total sessions
						</p>
						<p className="text-3xl font-bold text-gray-900 mt-1">
							{stats?.totalSessions ?? 0}
						</p>
					</div>
					<div className="bg-white rounded-xl border border-gray-200 p-5">
						<p className="text-xs text-gray-500 uppercase tracking-wide">
							Total energy
						</p>
						<p className="text-3xl font-bold text-gray-900 mt-1">
							{stats?.totalKwh.toFixed(1) ?? 0}
						</p>
						<p className="text-xs text-gray-400 mt-1">kWh</p>
					</div>
					<div className="bg-white rounded-xl border border-gray-200 p-5">
						<p className="text-xs text-gray-500 uppercase tracking-wide">
							Total spent
						</p>
						<p className="text-3xl font-bold text-gray-900 mt-1">
							${stats?.totalCost.toFixed(2) ?? "0.00"}
						</p>
					</div>
					<div className="bg-white rounded-xl border border-gray-200 p-5">
						<p className="text-xs text-gray-500 uppercase tracking-wide">Avg rate</p>
						<p className="text-3xl font-bold text-gray-900 mt-1">
							{stats?.avgRate ? "$" + stats.avgRate.toFixed(3) : "—"}
						</p>
						<p className="text-xs text-gray-400 mt-1">per kWh</p>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="bg-white rounded-xl border border-gray-200 p-5">
						<p className="text-xs text-gray-500 uppercase tracking-wide">
							Avg efficiency
						</p>
						<p className="text-3xl font-bold text-gray-900 mt-1">
							{stats?.avgEfficiency ? stats.avgEfficiency.toFixed(2) : "—"}
						</p>
						<p className="text-xs text-gray-400 mt-1">km per kWh</p>
					</div>
					<div className="bg-white rounded-xl border border-gray-200 p-5">
						<p className="text-xs text-gray-500 uppercase tracking-wide">
							km per 1% battery
						</p>
						<p className="text-3xl font-bold text-gray-900 mt-1">
							{stats?.kmPerPercent ? stats.kmPerPercent.toFixed(2) : "—"}
						</p>
						<p className="text-xs text-gray-400 mt-1">log odometer to calculate</p>
					</div>
				</div>

				<div className="bg-white rounded-xl border border-gray-200">
					<div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
						<h3 className="font-semibold text-gray-900">Recent sessions</h3>
						<Link
							href="/dashboard/history"
							className="text-sm text-green-600 hover:underline"
						>
							View all
						</Link>
					</div>
					{!sessions.length ? (
						<div className="px-6 py-12 text-center text-gray-400">
							<p className="text-4xl mb-3">⚡</p>
							<p className="font-medium text-gray-600">No sessions yet</p>
							<p className="text-sm mt-1">
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
						<div className="divide-y divide-gray-100">
							{sessions.slice(0, 5).map((session) => (
								<div
									key={session.id}
									className="px-6 py-4 flex justify-between items-center"
								>
									<div>
										<p className="text-sm font-medium text-gray-900">{session.date}</p>
										<p className="text-xs text-gray-500 mt-0.5">
											{locationLabel[session.location_type]} ·{" "}
											{session.kwh_added.toFixed(1)} kWh
										</p>
									</div>
									<div className="text-right">
										<p className="text-sm font-medium text-gray-900">
											{session.cost ? "$" + session.cost.toFixed(2) : "Free"}
										</p>
										<p className="text-xs text-gray-500">
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

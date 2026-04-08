"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSessions, deleteSession } from "@/src/lib/api";
import { ChargingSession } from "@/src/types";

const locationLabel: Record<string, string> = {
	home: "🏠 Home",
	public: "🔌 Public AC",
	fast: "⚡ DC Fast",
};

export default function HistoryClient() {
	const [sessions, setSessions] = useState<ChargingSession[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			const { data, error } = await getSessions();
			if (error || !data) return;
			setSessions(data);
			setLoading(false);
		}
		load();
	}, []);

	async function handleDelete(id: string) {
		if (!confirm("Delete this session?")) return;
		const { error } = await deleteSession(id);
		if (!error) setSessions((prev) => prev.filter((s) => s.id !== id));
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
				<p className="text-gray-400 text-sm">Loading...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
			<nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
				<Link
					href="/dashboard"
					className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm"
				>
					← Back
				</Link>
				<h1 className="text-xl font-bold text-gray-900 dark:text-white">
					Session history
				</h1>
			</nav>

			<main className="max-w-4xl mx-auto px-4 py-8">
				<div className="flex justify-between items-center mb-6">
					<p className="text-sm text-gray-500 dark:text-gray-400">
						{sessions.length} sessions recorded
					</p>
					<Link
						href="/dashboard/log"
						className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
					>
						+ Log session
					</Link>
				</div>

				{!sessions.length ? (
					<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-6 py-16 text-center">
						<p className="text-4xl mb-3">⚡</p>
						<p className="font-medium text-gray-600 dark:text-gray-300">
							No sessions yet
						</p>
						<p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
							Log your first charging session to get started
						</p>
					</div>
				) : (
					<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
						{sessions.map((session) => {
							const kmDriven =
								session.odometer_start && session.odometer_end
									? session.odometer_end - session.odometer_start
									: null;
							const efficiency =
								kmDriven && session.kwh_added
									? (kmDriven / session.kwh_added).toFixed(2)
									: null;
							const kmPerPct =
								kmDriven && session.start_percent != null && session.end_percent != null
									? (kmDriven / (session.end_percent - session.start_percent)).toFixed(2)
									: null;

							return (
								<div
									key={session.id}
									className="px-6 py-4 flex justify-between items-start gap-4"
								>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<p className="text-sm font-medium text-gray-900 dark:text-white">
												{session.date}
											</p>
											<span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
												{locationLabel[session.location_type]}
											</span>
										</div>
										<div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
											<p className="text-xs text-gray-500 dark:text-gray-400">
												{session.kwh_added.toFixed(1)} kWh
											</p>
											{session.start_percent != null && session.end_percent != null && (
												<p className="text-xs text-gray-500 dark:text-gray-400">
													{session.start_percent}% → {session.end_percent}%
												</p>
											)}
											{kmDriven && (
												<p className="text-xs text-gray-500 dark:text-gray-400">
													{kmDriven} km driven
												</p>
											)}
											{efficiency && (
												<p className="text-xs text-green-600">{efficiency} km/kWh</p>
											)}
											{kmPerPct && (
												<p className="text-xs text-blue-500">{kmPerPct} km/1%</p>
											)}
											{session.notes && (
												<p className="text-xs text-gray-400 dark:text-gray-500 italic">
													{session.notes}
												</p>
											)}
										</div>
									</div>
									<div className="text-right flex-shrink-0 flex items-start gap-3">
										<div>
											<p className="text-sm font-medium text-gray-900 dark:text-white">
												{session.cost ? "$" + session.cost.toFixed(2) : "Free"}
											</p>
											{session.rate_per_kwh && (
												<p className="text-xs text-gray-500 dark:text-gray-400">
													${session.rate_per_kwh.toFixed(3)}/kWh
												</p>
											)}
										</div>
										<button
											onClick={() => handleDelete(session.id)}
											className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition text-lg leading-none mt-0.5"
										>
											✕
										</button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</main>
		</div>
	);
}

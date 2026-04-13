"use client";

import { useState } from "react";
import Link from "next/link";
import { useSessions } from "@/src/client/hooks/useSessions";
import {
	exportSessionsCsv,
	importSessionsCsv,
	getSessions,
} from "@/src/lib/api";

const speedColors: Record<string, string> = {
	slow: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
	regular:
		"bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
	fast: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
};

const speedLabel: Record<string, string> = {
	slow: "🐢 Slow",
	regular: "⚡ Regular",
	fast: "🚀 Fast",
};

export default function HistoryClient() {
	const { sessions, setSessions, loading, handleDelete } = useSessions();
	const [exporting, setExporting] = useState(false);
	const [importing, setImporting] = useState(false);

	async function handleExport() {
		setExporting(true);
		try {
			await exportSessionsCsv();
		} catch {
			alert("Export failed");
		} finally {
			setExporting(false);
		}
	}

	async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setImporting(true);

		const { data, error } = await importSessionsCsv(file);

		if (error) {
			alert("Import failed: " + error);
		} else {
			alert(data);
			const { data: refreshed } = await getSessions();
			if (refreshed) setSessions(refreshed);
		}

		setImporting(false);
		e.target.value = "";
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
					<div className="flex items-center gap-3">
						<label className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium px-4 py-2 rounded-lg transition cursor-pointer">
							{importing ? "Importing..." : "Import CSV"}
							<input
								type="file"
								accept=".csv"
								onChange={handleImport}
								disabled={importing}
								className="hidden"
							/>
						</label>
						<button
							onClick={handleExport}
							disabled={exporting || !sessions.length}
							className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
						>
							{exporting ? "Exporting..." : "Export CSV"}
						</button>
						<Link
							href="/dashboard/log"
							className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
						>
							+ Log session
						</Link>
					</div>
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
						{sessions.map((session) => (
							<div
								key={session.id}
								className="px-6 py-4 flex justify-between items-start gap-4"
							>
								<div className="flex-1 min-w-0">
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
												className={`text-xs px-2 py-0.5 rounded-full ${speedColors[session.charging_speed]}`}
											>
												{speedLabel[session.charging_speed]}
											</span>
										)}
									</div>
									<div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
										<p className="text-xs text-gray-500 dark:text-gray-400">
											{session.kwh_added.toFixed(2)} kWh
										</p>
										{session.start_percent != null && session.end_percent != null && (
											<p className="text-xs text-gray-500 dark:text-gray-400">
												{session.start_percent}% → {session.end_percent}%
											</p>
										)}
										{session.duration_minutes && (
											<p className="text-xs text-gray-500 dark:text-gray-400">
												{session.duration_minutes} mins
											</p>
										)}
										{session.odometer && (
											<p className="text-xs text-gray-500 dark:text-gray-400">
												{session.odometer.toLocaleString()} km
											</p>
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
						))}
					</div>
				)}
			</main>
		</div>
	);
}

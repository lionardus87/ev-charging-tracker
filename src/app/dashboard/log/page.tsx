"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";
import { createSession } from "@/src/lib/api";
import { CreateSessionPayload, LocationType } from "@/src/types";

export default function LogSessionPage() {
	const router = useRouter();
	const { user } = useAuth();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const [form, setForm] = useState({
		date: new Date().toISOString().split("T")[0],
		location_type: "home" as LocationType,
		start_percent: "",
		end_percent: "",
		kwh_added: "",
		odometer_start: "",
		odometer_end: "",
		cost: "",
		rate_per_kwh: "",
		notes: "",
	});

	function handleChange(
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!user) {
			router.push("/login");
			return;
		}
		setLoading(true);
		setError("");

		const payload: CreateSessionPayload = {
			date: form.date,
			location_type: form.location_type,
			start_percent: form.start_percent ? parseFloat(form.start_percent) : null,
			end_percent: form.end_percent ? parseFloat(form.end_percent) : null,
			kwh_added: parseFloat(form.kwh_added),
			odometer_start: form.odometer_start ? parseFloat(form.odometer_start) : null,
			odometer_end: form.odometer_end ? parseFloat(form.odometer_end) : null,
			cost: form.cost ? parseFloat(form.cost) : null,
			rate_per_kwh: form.rate_per_kwh ? parseFloat(form.rate_per_kwh) : null,
			notes: form.notes || null,
		};

		const { error } = await createSession(payload);

		if (error) {
			setError(error);
			setLoading(false);
		} else {
			router.push("/dashboard");
			router.refresh();
		}
	}

	const inputClass =
		"w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500";

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
					Log charging session
				</h1>
			</nav>

			<main className="max-w-2xl mx-auto px-4 py-8">
				<form
					onSubmit={handleSubmit}
					className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6"
				>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Date
							</label>
							<input
								type="date"
								name="date"
								value={form.date}
								onChange={handleChange}
								required
								className={inputClass}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Location type
							</label>
							<select
								name="location_type"
								value={form.location_type}
								onChange={handleChange}
								className={inputClass}
							>
								<option value="home">Home</option>
								<option value="public">Public AC</option>
								<option value="fast">DC fast charge</option>
							</select>
						</div>
					</div>

					<div>
						<p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
							Battery
						</p>
						<div className="grid grid-cols-3 gap-4">
							<div>
								<label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
									Start %
								</label>
								<input
									type="number"
									name="start_percent"
									value={form.start_percent}
									onChange={handleChange}
									min="0"
									max="100"
									placeholder="e.g. 20"
									className={inputClass}
								/>
							</div>
							<div>
								<label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
									End %
								</label>
								<input
									type="number"
									name="end_percent"
									value={form.end_percent}
									onChange={handleChange}
									min="0"
									max="100"
									placeholder="e.g. 80"
									className={inputClass}
								/>
							</div>
							<div>
								<label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
									kWh added *
								</label>
								<input
									type="number"
									name="kwh_added"
									value={form.kwh_added}
									onChange={handleChange}
									required
									min="0"
									step="0.1"
									placeholder="e.g. 40"
									className={inputClass}
								/>
							</div>
						</div>
					</div>

					<div>
						<p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
							Odometer{" "}
							<span className="text-gray-400 font-normal">
								(optional — for efficiency tracking)
							</span>
						</p>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
									Start (km)
								</label>
								<input
									type="number"
									name="odometer_start"
									value={form.odometer_start}
									onChange={handleChange}
									placeholder="e.g. 12000"
									className={inputClass}
								/>
							</div>
							<div>
								<label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
									End (km)
								</label>
								<input
									type="number"
									name="odometer_end"
									value={form.odometer_end}
									onChange={handleChange}
									placeholder="e.g. 12350"
									className={inputClass}
								/>
							</div>
						</div>
					</div>

					<div>
						<p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
							Cost{" "}
							<span className="text-gray-400 font-normal">
								(fill one, the other auto-calculates)
							</span>
						</p>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
									Total cost ($)
								</label>
								<input
									type="number"
									name="cost"
									value={form.cost}
									onChange={handleChange}
									min="0"
									step="0.01"
									placeholder="e.g. 12.50"
									className={inputClass}
								/>
							</div>
							<div>
								<label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
									Rate ($/kWh)
								</label>
								<input
									type="number"
									name="rate_per_kwh"
									value={form.rate_per_kwh}
									onChange={handleChange}
									min="0"
									step="0.001"
									placeholder="e.g. 0.30"
									className={inputClass}
								/>
							</div>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Notes
						</label>
						<textarea
							name="notes"
							value={form.notes}
							onChange={handleChange}
							placeholder="e.g. Cold weather, busy station..."
							rows={2}
							className={inputClass + " resize-none"}
						/>
					</div>

					{error && <p className="text-red-500 text-sm">{error}</p>}

					<div className="flex justify-end gap-3">
						<Link
							href="/dashboard"
							className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
						>
							Cancel
						</Link>
						<button
							type="submit"
							disabled={loading}
							className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition disabled:opacity-50"
						>
							{loading ? "Saving..." : "Save session"}
						</button>
					</div>
				</form>
			</main>
		</div>
	);
}

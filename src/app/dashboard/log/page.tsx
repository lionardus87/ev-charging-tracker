"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useAuth } from "@/src/client/context/AuthContext";
import { useProviders } from "@/src/client/hooks/useProviders";
import { createSession } from "@/src/lib/api";
import { CreateSessionPayload } from "@/src/types";

type FormValues = {
	date: string;
	provider: string;
	charging_speed: string;
	start_percent: string;
	end_percent: string;
	kwh_added: string;
	duration_minutes: string;
	odometer: string;
	cost: string;
	rate_per_kwh: string;
	notes: string;
};

export default function LogSessionPage() {
	const router = useRouter();
	const { user } = useAuth();
	const { providers, loading: providersLoading, addProvider } = useProviders();
	const [submitting, setSubmitting] = useState(false);
	const [serverError, setServerError] = useState("");
	const [showAddProvider, setShowAddProvider] = useState(false);
	const [newProviderName, setNewProviderName] = useState("");
	const [addingProvider, setAddingProvider] = useState(false);

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<FormValues>({
		defaultValues: {
			date: new Date().toISOString().split("T")[0],
			provider: "",
		},
	});

	async function handleAddProvider() {
		if (!newProviderName.trim()) return;
		setAddingProvider(true);
		const provider = await addProvider(newProviderName);
		if (provider) {
			setValue("provider", provider.name);
			setNewProviderName("");
			setShowAddProvider(false);
		}
		setAddingProvider(false);
	}

	async function onSubmit(values: FormValues) {
		if (!user) {
			router.push("/login");
			return;
		}
		setSubmitting(true);
		setServerError("");

		const payload: CreateSessionPayload = {
			date: values.date,
			provider: values.provider || null,
			charging_speed: (values.charging_speed as import("@/src/types").ChargingSpeed) || null,
			start_percent: values.start_percent
				? parseFloat(values.start_percent)
				: null,
			end_percent: values.end_percent ? parseFloat(values.end_percent) : null,
			kwh_added: parseFloat(values.kwh_added),
			duration_minutes: values.duration_minutes
				? parseFloat(values.duration_minutes)
				: null,
			odometer: values.odometer ? parseFloat(values.odometer) : null,
			cost: values.cost ? parseFloat(values.cost) : null,
			rate_per_kwh: values.rate_per_kwh ? parseFloat(values.rate_per_kwh) : null,
			notes: values.notes || null,
		};

		const { error } = await createSession(payload);

		if (error) {
			setServerError(error);
			setSubmitting(false);
		} else {
			router.push("/dashboard");
			router.refresh();
		}
	}

	const inputClass =
		"w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500";
	const errorClass = "text-red-500 text-xs mt-1";

	return (
		<div>
			<main className="max-w-2xl mx-auto px-4 py-8">
				<div className="mb-6 animate-fade-in">
					<Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
						← Back to dashboard
					</Link>
					<h2 className="text-xl font-bold text-gray-900 dark:text-white mt-2">Log session</h2>
				</div>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6"
				>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Date *
							</label>
							<input
								type="date"
								{...register("date", { required: "Date is required" })}
								className={inputClass}
							/>
							{errors.date && <p className={errorClass}>{errors.date.message}</p>}
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Provider
							</label>
							{providersLoading ? (
								<div className={inputClass + " text-gray-400"}>Loading...</div>
							) : (
								<select {...register("provider")} className={inputClass}>
									<option value="">Select provider</option>
									{providers.map((p) => (
										<option key={p.id} value={p.name}>
											{p.name}
										</option>
									))}
								</select>
							)}
							<button
								type="button"
								onClick={() => setShowAddProvider(!showAddProvider)}
								className="text-xs text-green-600 hover:underline mt-1 block"
							>
								+ Add new provider
							</button>
							{showAddProvider && (
								<div className="flex gap-2 mt-2">
									<input
										type="text"
										value={newProviderName}
										onChange={(e) => setNewProviderName(e.target.value)}
										placeholder="e.g. Evie, Chargefox"
										className={inputClass}
										onKeyDown={(e) =>
											e.key === "Enter" && (e.preventDefault(), handleAddProvider())
										}
									/>
									<button
										type="button"
										onClick={handleAddProvider}
										disabled={addingProvider}
										className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 rounded-lg transition disabled:opacity-50 whitespace-nowrap"
									>
										{addingProvider ? "..." : "Add"}
									</button>
								</div>
							)}
						</div>
					</div>

					{/* charging speed */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Charging speed
						</label>
						<div className="grid grid-cols-3 gap-3">
							{[
								{ value: "slow",    label: "🐢 Slow",    sub: "AC / Level 1-2" },
								{ value: "regular", label: "⚡ Regular", sub: "AC / Level 2" },
								{ value: "fast",    label: "🚀 Fast",    sub: "DC fast charge" },
							].map(({ value, label, sub }) => {
								const reg = register("charging_speed");
								return (
									<label
										key={value}
										className="relative cursor-pointer"
									>
										<input type="radio" value={value} {...reg} className="sr-only peer" />
										<div className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 peer-checked:border-green-500 peer-checked:bg-green-50 dark:peer-checked:bg-green-950/30 transition-all text-center hover:border-gray-300 dark:hover:border-gray-600">
											<span className="text-lg">{label.split(" ")[0]}</span>
											<span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label.split(" ").slice(1).join(" ")}</span>
											<span className="text-xs text-gray-400">{sub}</span>
										</div>
									</label>
								);
							})}
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
									{...register("start_percent", {
										min: { value: 0, message: "Min 0" },
										max: { value: 100, message: "Max 100" },
									})}
									placeholder="e.g. 20"
									className={inputClass}
								/>
								{errors.start_percent && (
									<p className={errorClass}>{errors.start_percent.message}</p>
								)}
							</div>
							<div>
								<label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
									End %
								</label>
								<input
									type="number"
									{...register("end_percent", {
										min: { value: 0, message: "Min 0" },
										max: { value: 100, message: "Max 100" },
									})}
									placeholder="e.g. 80"
									className={inputClass}
								/>
								{errors.end_percent && (
									<p className={errorClass}>{errors.end_percent.message}</p>
								)}
							</div>
							<div>
								<label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
									Total Energy (kWh) *
								</label>
								<input
									type="number"
									step="0.01"
									{...register("kwh_added", {
										required: "kWh is required",
										min: { value: 0.1, message: "Must be greater than 0" },
									})}
									placeholder="e.g. 40.23"
									className={inputClass}
								/>
								{errors.kwh_added && (
									<p className={errorClass}>{errors.kwh_added.message}</p>
								)}
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Odometer (km)
							</label>
							<input
								type="number"
								{...register("odometer")}
								placeholder="e.g. 12350"
								className={inputClass}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Duration (mins)
							</label>
							<input
								type="number"
								{...register("duration_minutes")}
								placeholder="e.g. 45"
								className={inputClass}
							/>
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
									step="0.01"
									{...register("cost", {
										min: { value: 0, message: "Must be positive" },
									})}
									placeholder="e.g. 12.50"
									className={inputClass}
								/>
								{errors.cost && <p className={errorClass}>{errors.cost.message}</p>}
							</div>
							<div>
								<label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
									Rate ($/kWh)
								</label>
								<input
									type="number"
									step="0.001"
									{...register("rate_per_kwh", {
										min: { value: 0, message: "Must be positive" },
									})}
									placeholder="e.g. 0.30"
									className={inputClass}
								/>
								{errors.rate_per_kwh && (
									<p className={errorClass}>{errors.rate_per_kwh.message}</p>
								)}
							</div>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Notes
						</label>
						<textarea
							{...register("notes")}
							placeholder="e.g. Cold weather, busy station..."
							rows={2}
							className={inputClass + " resize-none"}
						/>
					</div>

					{serverError && <p className="text-red-500 text-sm">{serverError}</p>}

					<div className="flex justify-end gap-3">
						<Link
							href="/dashboard"
							className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
						>
							Cancel
						</Link>
						<button
							type="submit"
							disabled={submitting}
							className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition disabled:opacity-50"
						>
							{submitting ? "Saving..." : "Save session"}
						</button>
					</div>
				</form>
			</main>
		</div>
	);
}

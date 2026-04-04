import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");

	const { data: sessions } = await supabase
		.from("charging_sessions")
		.select("*")
		.order("date", { ascending: false });

	const totalKwh = sessions?.reduce((a, s) => a + (s.kwh_added || 0), 0) ?? 0;
	const totalCost = sessions?.reduce((a, s) => a + (s.cost || 0), 0) ?? 0;
	const sessionsWithRate = sessions?.filter((s) => s.rate_per_kwh) ?? [];
	const avgRate = sessionsWithRate.length
		? sessionsWithRate.reduce((a, s) => a + s.rate_per_kwh, 0) /
			sessionsWithRate.length
		: null;
	const sessionsWithKm =
		sessions?.filter((s) => s.odometer_start && s.odometer_end && s.kwh_added) ??
		[];
	const avgEfficiency = sessionsWithKm.length
		? sessionsWithKm.reduce(
				(a, s) => a + (s.odometer_end - s.odometer_start) / s.kwh_added,
				0,
			) / sessionsWithKm.length
		: null;

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
				<h1 className="text-xl font-bold text-gray-900">⚡ EV Tracker</h1>
				<div className="flex items-center gap-4">
					<span className="text-sm text-gray-500 hidden sm:block">{user.email}</span>
					<Link
						href="/dashboard/log"
						className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
					>
						+ Log session
					</Link>
					<form action="/auth/signout" method="POST">
						<button className="text-sm text-gray-500 hover:text-gray-700">
							Sign out
						</button>
					</form>
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
							{sessions?.length ?? 0}
						</p>
					</div>
					<div className="bg-white rounded-xl border border-gray-200 p-5">
						<p className="text-xs text-gray-500 uppercase tracking-wide">
							Total energy
						</p>
						<p className="text-3xl font-bold text-gray-900 mt-1">
							{totalKwh.toFixed(1)}
						</p>
						<p className="text-xs text-gray-400 mt-1">kWh</p>
					</div>
					<div className="bg-white rounded-xl border border-gray-200 p-5">
						<p className="text-xs text-gray-500 uppercase tracking-wide">
							Total spent
						</p>
						<p className="text-3xl font-bold text-gray-900 mt-1">
							${totalCost.toFixed(2)}
						</p>
					</div>
					<div className="bg-white rounded-xl border border-gray-200 p-5">
						<p className="text-xs text-gray-500 uppercase tracking-wide">Avg rate</p>
						<p className="text-3xl font-bold text-gray-900 mt-1">
							{avgRate ? "$" + avgRate.toFixed(3) : "—"}
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
							{avgEfficiency ? avgEfficiency.toFixed(2) : "—"}
						</p>
						<p className="text-xs text-gray-400 mt-1">km per kWh</p>
					</div>
					<div className="bg-white rounded-xl border border-gray-200 p-5">
						<p className="text-xs text-gray-500 uppercase tracking-wide">
							km per 1% battery
						</p>
						<p className="text-3xl font-bold text-gray-900 mt-1">
							{sessionsWithKm.length
								? (
										sessionsWithKm.reduce(
											(a, s) =>
												a +
												(s.odometer_end - s.odometer_start) /
													(s.end_percent - s.start_percent),
											0,
										) / sessionsWithKm.length
									).toFixed(2)
								: "—"}
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
					{!sessions?.length ? (
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
										<p className="text-xs text-gray-500 mt-0.5 capitalize">
											{session.location_type} · {session.kwh_added.toFixed(1)} kWh
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

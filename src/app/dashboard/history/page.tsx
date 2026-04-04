import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DeleteButton from "./DeleteButton";

export default async function HistoryPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");

	const { data: sessions } = await supabase
		.from("charging_sessions")
		.select("*")
		.order("date", { ascending: false });

	const locationLabel: Record<string, string> = {
		home: "🏠 Home",
		public: "🔌 Public AC",
		fast: "⚡ DC Fast",
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
				<Link
					href="/dashboard"
					className="text-gray-400 hover:text-gray-600 text-sm"
				>
					← Back
				</Link>
				<h1 className="text-xl font-bold text-gray-900">Session history</h1>
			</nav>

			<main className="max-w-4xl mx-auto px-4 py-8">
				<div className="flex justify-between items-center mb-6">
					<p className="text-sm text-gray-500">
						{sessions?.length ?? 0} sessions recorded
					</p>
					<Link
						href="/dashboard/log"
						className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
					>
						+ Log session
					</Link>
				</div>

				{!sessions?.length ? (
					<div className="bg-white rounded-2xl border border-gray-200 px-6 py-16 text-center">
						<p className="text-4xl mb-3">⚡</p>
						<p className="font-medium text-gray-600">No sessions yet</p>
						<p className="text-sm text-gray-400 mt-1">
							Log your first charging session to get started
						</p>
					</div>
				) : (
					<div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
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
											<p className="text-sm font-medium text-gray-900">{session.date}</p>
											<span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
												{locationLabel[session.location_type]}
											</span>
										</div>
										<div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
											<p className="text-xs text-gray-500">
												{session.kwh_added.toFixed(1)} kWh
											</p>
											{session.start_percent != null && session.end_percent != null && (
												<p className="text-xs text-gray-500">
													{session.start_percent}% → {session.end_percent}%
												</p>
											)}
											{kmDriven && (
												<p className="text-xs text-gray-500">{kmDriven} km driven</p>
											)}
											{efficiency && (
												<p className="text-xs text-green-600">{efficiency} km/kWh</p>
											)}
											{kmPerPct && (
												<p className="text-xs text-blue-600">{kmPerPct} km/1%</p>
											)}
											{session.notes && (
												<p className="text-xs text-gray-400 italic">{session.notes}</p>
											)}
										</div>
									</div>
									<div className="text-right flex-shrink-0 flex items-start gap-3">
										<div>
											<p className="text-sm font-medium text-gray-900">
												{session.cost ? "$" + session.cost.toFixed(2) : "Free"}
											</p>
											{session.rate_per_kwh && (
												<p className="text-xs text-gray-500">
													${session.rate_per_kwh.toFixed(3)}/kWh
												</p>
											)}
										</div>
										<DeleteButton id={session.id} />
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

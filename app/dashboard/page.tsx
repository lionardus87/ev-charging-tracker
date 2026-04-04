import { createClient } from "@/lib/supbase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/login");

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
				<h1 className="text-xl font-bold text-gray-900">⚡ EV Tracker</h1>
				<span className="text-sm text-gray-500">{user.email}</span>
			</nav>

			<main className="max-w-5xl mx-auto px-4 py-8">
				<p className="text-gray-600">Dashboard coming soon...</p>
			</main>
		</div>
	);
}

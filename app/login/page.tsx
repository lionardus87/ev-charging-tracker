"use client";

import { useState } from "react";
import { createClient } from "@/lib/supbase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const supabase = createClient();

	async function handleLogin(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError("");

		const { error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			setError(error.message);
			setLoading(false);
		} else {
			router.push("/dashboard");
			router.refresh();
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center px-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900">⚡ EV Tracker</h1>
					<p className="text-gray-500 mt-2">Sign in to your account</p>
				</div>

				<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
					<form onSubmit={handleLogin} className="space-y-5">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Email
							</label>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
								placeholder="you@example.com"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Password
							</label>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
								placeholder="••••••••"
							/>
						</div>

						{error && <p className="text-red-500 text-sm">{error}</p>}

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 text-sm"
						>
							{loading ? "Signing in..." : "Sign in"}
						</button>
					</form>

					<p className="text-center text-sm text-gray-500 mt-6">
						Don&apos;t have an account?{" "}
						<Link
							href="/signup"
							className="text-green-600 font-medium hover:underline"
						>
							Sign up
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}

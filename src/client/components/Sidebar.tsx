"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/src/client/components/ThemeToggle";

interface NavItem {
	href: string;
	label: string;
	icon: string;
}

const navItems: NavItem[] = [
	{ href: "/dashboard", label: "Dashboard", icon: "⚡" },
	{ href: "/dashboard/history", label: "Sessions", icon: "🗂️" },
	{ href: "/dashboard/charts", label: "Charts", icon: "📊" },
	{ href: "/dashboard/profile", label: "Profile", icon: "👤" },
];

export default function Sidebar() {
	const pathname = usePathname();

	function isActive(href: string) {
		if (href === "/dashboard") return pathname === "/dashboard";
		return pathname.startsWith(href);
	}

	return (
		<>
			{/* ── Desktop sidebar ───────────────────────────────── */}
			<aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 animate-slide-left">
				{/* Logo */}
				<div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800">
					<Link href="/dashboard" className="flex items-center gap-2">
						<svg width="28" height="28" viewBox="0 0 24 24" fill="none">
							<rect width="24" height="24" rx="6" fill="#16a34a" />
							<path d="M13 3L6 13h6l-1 8 7-10h-6l1-8z" fill="white" />
						</svg>
						<span className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
							EV Zone
						</span>
					</Link>
				</div>

				{/* Nav links */}
				<nav className="flex-1 px-3 py-4 space-y-1">
					{navItems.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
								isActive(item.href)
									? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400"
									: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
							}`}
						>
							<span className="text-base">{item.icon}</span>
							{item.label}
							{isActive(item.href) && (
								<span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />
							)}
						</Link>
					))}
				</nav>

				{/* Log session button */}
				<div className="px-3 pb-3">
					<Link
						href="/dashboard/log"
						className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 active:scale-95 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-150"
					>
						<span className="text-base">＋</span> Log session
					</Link>
				</div>

				{/* Footer: theme toggle */}
				<div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
					<span className="text-xs text-gray-400 dark:text-gray-600">Theme</span>
					<ThemeToggle />
				</div>
			</aside>

			{/* ── Mobile top bar ────────────────────────────────── */}
			<header className="md:hidden fixed top-0 inset-x-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
				<Link href="/dashboard" className="flex items-center gap-2">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
						<rect width="24" height="24" rx="6" fill="#16a34a" />
						<path d="M13 3L6 13h6l-1 8 7-10h-6l1-8z" fill="white" />
					</svg>
					<span className="font-bold text-gray-900 dark:text-white text-sm">
						EV Zone
					</span>
				</Link>
				<div className="flex items-center gap-3">
					<ThemeToggle />
					<Link
						href="/dashboard/log"
						className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
					>
						+ Log
					</Link>
				</div>
			</header>

			{/* ── Mobile bottom tab bar ─────────────────────────── */}
			<nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex">
				{navItems.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
							isActive(item.href)
								? "text-green-600 dark:text-green-400"
								: "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
						}`}
					>
						<span className="text-lg leading-none">{item.icon}</span>
						<span>{item.label}</span>
					</Link>
				))}
			</nav>
		</>
	);
}

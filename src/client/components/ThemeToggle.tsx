"use client";

import { useTheme } from "@/src/client/context/ThemeContext";

export default function ThemeToggle() {
	const { isDark, toggleTheme } = useTheme();

	return (
		<button
			onClick={toggleTheme}
			className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition text-xl"
			title="Toggle dark mode"
		>
			{isDark ? "☀️" : "🌙"}
		</button>
	);
}

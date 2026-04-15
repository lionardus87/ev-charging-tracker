"use client";

import { useTheme } from "@/src/client/context/ThemeContext";

export default function ThemeToggle() {
	const { isDark, toggleTheme } = useTheme();

	return (
		<button
			onClick={toggleTheme}
			title="Toggle theme"
			className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
				isDark ? "bg-green-600" : "bg-gray-300"
			}`}
		>
			<span
				className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${
					isDark ? "translate-x-5" : "translate-x-0"
				}`}
			/>
		</button>
	);
}

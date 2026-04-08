"use client";

import {
	createContext,
	useContext,
	useCallback,
	useSyncExternalStore,
	ReactNode,
} from "react";

interface ThemeContextType {
	isDark: boolean;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
	isDark: false,
	toggleTheme: () => {},
});

function subscribe(callback: () => void) {
	const observer = new MutationObserver(callback);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});
	return () => observer.disconnect();
}

function getSnapshot() {
	return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
	return false;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

	const toggleTheme = useCallback(() => {
		const next = !document.documentElement.classList.contains("dark");
		document.documentElement.classList.toggle("dark", next);
		localStorage.setItem("theme", next ? "dark" : "light");
	}, []);

	return (
		<ThemeContext.Provider value={{ isDark, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	return useContext(ThemeContext);
}

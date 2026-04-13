import {
	ApiResponse,
	ChargingSession,
	CreateSessionPayload,
	SessionStats,
	User,
} from "@/src/types";
import { Provider } from "@/src/server/db/providers.db";

export async function getUser(): Promise<ApiResponse<User>> {
	const res = await fetch("/api/auth");
	return res.json();
}

export async function getSessions(): Promise<ApiResponse<ChargingSession[]>> {
	const res = await fetch("/api/sessions");
	return res.json();
}

export async function createSession(
	payload: CreateSessionPayload,
): Promise<ApiResponse<ChargingSession>> {
	const res = await fetch("/api/sessions", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	return res.json();
}

export async function deleteSession(id: string): Promise<ApiResponse<string>> {
	const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
	return res.json();
}

export async function exportSessionsCsv(): Promise<void> {
	const res = await fetch("/api/sessions/export");
	if (!res.ok) throw new Error("Export failed");

	const blob = await res.blob();
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `ev-charging-${new Date().toISOString().split("T")[0]}.csv`;
	a.click();
	URL.revokeObjectURL(url);
}

export async function importSessionsCsv(
	file: File,
): Promise<ApiResponse<string>> {
	const formData = new FormData();
	formData.append("file", file);

	const res = await fetch("/api/sessions/import", {
		method: "POST",
		body: formData,
	});
	return res.json();
}

export async function getProviders(): Promise<ApiResponse<Provider[]>> {
	const res = await fetch("/api/providers");
	return res.json();
}

export async function createProvider(
	name: string,
): Promise<ApiResponse<Provider>> {
	const res = await fetch("/api/providers", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name }),
	});
	return res.json();
}

export async function deleteProvider(id: string): Promise<ApiResponse<string>> {
	const res = await fetch(`/api/providers/${id}`, { method: "DELETE" });
	return res.json();
}

export function calculateStats(sessions: ChargingSession[]): SessionStats {
	const totalSessions = sessions.length;
	const totalKwh = sessions.reduce((a, s) => a + s.kwh_added, 0);
	const totalCost = sessions.reduce((a, s) => a + (s.cost || 0), 0);

	const sessionsWithRate = sessions.filter((s) => s.rate_per_kwh);
	const avgRate = sessionsWithRate.length
		? sessionsWithRate.reduce((a, s) => a + s.rate_per_kwh!, 0) /
			sessionsWithRate.length
		: null;

	const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
	const kmReadings = sorted.filter((s) => s.odometer != null);

	let totalKm = 0;
	let totalKwhForEff = 0;
	let totalPctForEff = 0;
	let effSessions = 0;

	for (let i = 1; i < kmReadings.length; i++) {
		const prev = kmReadings[i - 1];
		const curr = kmReadings[i];
		const km = curr.odometer! - prev.odometer!;
		if (km > 0 && curr.kwh_added > 0) {
			totalKm += km;
			totalKwhForEff += curr.kwh_added;
			if (curr.start_percent != null && curr.end_percent != null) {
				totalPctForEff += curr.end_percent - curr.start_percent;
			}
			effSessions++;
		}
	}

	const avgEfficiency = effSessions > 0 ? totalKm / totalKwhForEff : null;
	const kmPerPercent = totalPctForEff > 0 ? totalKm / totalPctForEff : null;

	return {
		totalSessions,
		totalKwh,
		totalCost,
		avgRate,
		avgEfficiency,
		kmPerPercent,
	};
}

import {
	ApiResponse,
	ChargingSession,
	CreateSessionPayload,
	SessionStats,
	User,
} from "@/src/types";

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

export function calculateStats(sessions: ChargingSession[]): SessionStats {
	const totalSessions = sessions.length;
	const totalKwh = sessions.reduce((a, s) => a + s.kwh_added, 0);
	const totalCost = sessions.reduce((a, s) => a + (s.cost || 0), 0);

	const sessionsWithRate = sessions.filter((s) => s.rate_per_kwh);
	const avgRate = sessionsWithRate.length
		? sessionsWithRate.reduce((a, s) => a + s.rate_per_kwh!, 0) /
			sessionsWithRate.length
		: null;

	const sessionsWithKm = sessions.filter(
		(s) => s.odometer_start && s.odometer_end && s.kwh_added,
	);
	const avgEfficiency = sessionsWithKm.length
		? sessionsWithKm.reduce(
				(a, s) => a + (s.odometer_end! - s.odometer_start!) / s.kwh_added,
				0,
			) / sessionsWithKm.length
		: null;

	const sessionsWithPct = sessions.filter(
		(s) =>
			s.odometer_start &&
			s.odometer_end &&
			s.start_percent != null &&
			s.end_percent != null &&
			s.end_percent - s.start_percent > 0,
	);
	const kmPerPercent = sessionsWithPct.length
		? sessionsWithPct.reduce(
				(a, s) =>
					a +
					(s.odometer_end! - s.odometer_start!) /
						(s.end_percent! - s.start_percent!),
				0,
			) / sessionsWithPct.length
		: null;

	return {
		totalSessions,
		totalKwh,
		totalCost,
		avgRate,
		avgEfficiency,
		kmPerPercent,
	};
}

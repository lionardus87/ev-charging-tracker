import {
	dbGetSessions,
	dbCreateSession,
	dbDeleteSession,
} from "@/src/server/db/sessions.db";
import {
	CreateSessionPayload,
	ChargingSession,
	SessionStats,
} from "@/src/types";

export async function getSessions(userId: string): Promise<ChargingSession[]> {
	return dbGetSessions(userId);
}

export async function createSession(
	userId: string,
	payload: CreateSessionPayload,
): Promise<ChargingSession> {
	let finalRate = payload.rate_per_kwh;
	let finalCost = payload.cost;

	if (finalCost && payload.kwh_added && !finalRate)
		finalRate = finalCost / payload.kwh_added;
	if (finalRate && payload.kwh_added && !finalCost)
		finalCost = finalRate * payload.kwh_added;

	return dbCreateSession(userId, {
		...payload,
		rate_per_kwh: finalRate,
		cost: finalCost,
	});
}

export async function deleteSession(userId: string, id: string): Promise<void> {
	return dbDeleteSession(userId, id);
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

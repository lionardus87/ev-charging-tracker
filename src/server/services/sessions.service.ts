import {
	dbGetSessions,
	dbCreateSession,
	dbDeleteSession,
} from "@/src/server/db/sessions.db";
import {
	CreateSessionPayload,
	ChargingSession,
	SessionStats,
	ChargingSpeed,
} from "@/src/types";

export function calculateChargingSpeed(
	kwhAdded: number,
	durationMinutes: number | null,
): ChargingSpeed | null {
	if (!durationMinutes || durationMinutes <= 0) return null;
	const kw = (kwhAdded / durationMinutes) * 60;
	if (kw < 7) return "slow";
	if (kw <= 50) return "regular";
	return "fast";
}

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

	const charging_speed = calculateChargingSpeed(
		payload.kwh_added,
		payload.duration_minutes,
	);

	return dbCreateSession(userId, {
		...payload,
		rate_per_kwh: finalRate,
		cost: finalCost,
		charging_speed,
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

export function generateCsv(sessions: ChargingSession[]): string {
	const headers = [
		"Date",
		"Provider",
		"Charging Speed",
		"Start %",
		"End %",
		"kWh Added",
		"Duration (mins)",
		"Odometer (km)",
		"Cost ($)",
		"Rate ($/kWh)",
		"Notes",
	].join(",");

	const rows = sessions.map((s) =>
		[
			s.date,
			s.provider ?? "",
			s.charging_speed ?? "",
			s.start_percent ?? "",
			s.end_percent ?? "",
			s.kwh_added.toFixed(2),
			s.duration_minutes ?? "",
			s.odometer ?? "",
			s.cost ?? "",
			s.rate_per_kwh ?? "",
			s.notes ? `"${s.notes.replace(/"/g, '""')}"` : "",
		].join(","),
	);

	return [headers, ...rows].join("\n");
}

export function parseCsv(csvText: string): CreateSessionPayload[] {
	const lines = csvText.trim().split("\n");

	const rawHeaders = lines[0]
		.split(",")
		.map((h) =>
			h
				.replace(/^"|"$/g, "")
				.replace(/\r/g, "")
				.replace(/\n/g, " ")
				.trim()
				.toLowerCase(),
		);

	const get = (values: string[], header: string) => {
		const index = rawHeaders.indexOf(header);
		return index !== -1
			? values[index]?.replace(/^"|"$/g, "").replace(/\r/g, "").trim()
			: "";
	};

	const toNum = (val: string) => {
		const cleaned = val.replace(/[$%,\s]/g, "");
		return cleaned && !isNaN(parseFloat(cleaned)) ? parseFloat(cleaned) : null;
	};

	const formatDate = (val: string) => {
		const parts = val.split("/");
		if (parts.length === 3) {
			const [day, month, year] = parts;
			return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
		}
		return val;
	};

	const isCustomFormat = rawHeaders.includes("total energy distributed (kwh)");

	return lines
		.slice(1)
		.map((line) => {
			const values = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) ?? [];

			if (isCustomFormat) {
				const duration = toNum(get(values, "duration\n  (mins)"));
				const kwh = toNum(get(values, "total energy distributed (kwh)")) ?? 0;
				return {
					date: formatDate(get(values, "date")),
					provider: get(values, "charger") || null,
					start_percent: toNum(get(values, "initial\n  %")),
					end_percent: toNum(get(values, "finish\n  %")),
					kwh_added: kwh,
					duration_minutes: duration,
					odometer: toNum(get(values, "odometer\n (km)")),
					cost: toNum(get(values, "ammount\n (aud$)")),
					rate_per_kwh: null,
					notes: null,
				};
			}

			return {
				date: get(values, "date"),
				provider: get(values, "provider") || null,
				start_percent: toNum(get(values, "start %")),
				end_percent: toNum(get(values, "end %")),
				kwh_added: toNum(get(values, "kwh added")) ?? 0,
				duration_minutes: toNum(get(values, "duration (mins)")),
				odometer: toNum(get(values, "odometer (km)")),
				cost: toNum(get(values, "cost ($)")),
				rate_per_kwh: toNum(get(values, "rate ($/kwh)")),
				notes: get(values, "notes") || null,
			};
		})
		.filter((s) => s.date && s.kwh_added > 0);
}

import {
	dbGetSessions,
	dbCreateSession,
	dbDeleteSession,
	dbUpdateSession,
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

	// prefer manual selection; fall back to auto-calculation
	const charging_speed =
		payload.charging_speed ??
		calculateChargingSpeed(payload.kwh_added, payload.duration_minutes);

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
	// properly parse CSV respecting quoted fields with newlines inside
	const rows: string[][] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < csvText.length; i++) {
		const ch = csvText[i];
		if (ch === '"') {
			inQuotes = !inQuotes;
		} else if (
			(ch === "\n" || (ch === "\r" && csvText[i + 1] === "\n")) &&
			!inQuotes
		) {
			if (ch === "\r") i++;
			if (current.trim()) {
				rows.push(
					current
						.split(",")
						.map((v) => v.replace(/^"|"$/g, "").replace(/\n/g, " ").trim()),
				);
			}
			current = "";
		} else {
			current += ch;
		}
	}
	if (current.trim()) {
		rows.push(
			current
				.split(",")
				.map((v) => v.replace(/^"|"$/g, "").replace(/\n/g, " ").trim()),
		);
	}

	if (rows.length < 2) return [];

	const rawHeaders = rows[0].map((h) =>
		h.toLowerCase().replace(/\s+/g, " ").trim(),
	);

	const get = (values: string[], header: string) => {
		const index = rawHeaders.findIndex((h) => h.includes(header));
		if (index === -1 || values[index] == null) return "";
		return values[index].replace(/^"|"$/g, "").replace(/\r/g, "").trim();
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

	const isCustomFormat = rawHeaders.some((h) =>
		h.includes("total energy distributed"),
	);

	return rows
		.slice(1)
		.map((values) => {
			if (isCustomFormat) {
				const duration = toNum(get(values, "duration"));
				const kwh = toNum(get(values, "total energy")) ?? 0;
				return {
					date: formatDate(get(values, "date")),
					provider: get(values, "charger") || null,
					charging_speed: null,
					start_percent: toNum(get(values, "initial")),
					end_percent: toNum(get(values, "finish")),
					kwh_added: kwh,
					duration_minutes: duration,
					odometer: toNum(get(values, "odometer")),
					cost: toNum(get(values, "ammount")),
					rate_per_kwh: null,
					notes: null,
				};
			}

			const rawSpeed = get(values, "charging speed") || get(values, "speed");
			const speed = (["slow","regular","fast"].includes(rawSpeed) ? rawSpeed : null) as ChargingSpeed | null;
			return {
				date: formatDate(get(values, "date")),
				provider: get(values, "provider") || null,
				charging_speed: speed,
				start_percent: toNum(get(values, "start")),
				end_percent: toNum(get(values, "end")),
				kwh_added: toNum(get(values, "kwh")) ?? 0,
				duration_minutes: toNum(get(values, "duration")),
				odometer: toNum(get(values, "odometer")),
				cost: toNum(get(values, "cost")),
				rate_per_kwh: toNum(get(values, "rate")),
				notes: get(values, "notes") || null,
			};
		})
		.filter((s) => s.date && s.kwh_added > 0);
}

export async function updateSession(
	userId: string,
	id: string,
	payload: CreateSessionPayload,
): Promise<ChargingSession> {
	let finalRate = payload.rate_per_kwh;
	let finalCost = payload.cost;

	if (finalCost && payload.kwh_added && !finalRate)
		finalRate = finalCost / payload.kwh_added;
	if (finalRate && payload.kwh_added && !finalCost)
		finalCost = finalRate * payload.kwh_added;

	const charging_speed =
		payload.charging_speed ??
		calculateChargingSpeed(payload.kwh_added, payload.duration_minutes);

	return dbUpdateSession(userId, id, {
		...payload,
		rate_per_kwh: finalRate,
		cost: finalCost,
		charging_speed,
	});
}

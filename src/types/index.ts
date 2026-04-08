export type LocationType = "home" | "public" | "fast";

export interface User {
	id: string;
	email: string;
}

export interface ChargingSession {
	id: string;
	user_id: string;
	date: string;
	location_type: LocationType;
	start_percent: number | null;
	end_percent: number | null;
	kwh_added: number;
	odometer_start: number | null;
	odometer_end: number | null;
	cost: number | null;
	rate_per_kwh: number | null;
	notes: string | null;
	created_at: string;
}

export interface CreateSessionPayload {
	date: string;
	location_type: LocationType;
	start_percent: number | null;
	end_percent: number | null;
	kwh_added: number;
	odometer_start: number | null;
	odometer_end: number | null;
	cost: number | null;
	rate_per_kwh: number | null;
	notes: string | null;
}

export interface SessionStats {
	totalSessions: number;
	totalKwh: number;
	totalCost: number;
	avgRate: number | null;
	avgEfficiency: number | null;
	kmPerPercent: number | null;
}

export interface ApiResponse<T> {
	data: T | null;
	error: string | null;
}

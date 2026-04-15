export type ChargingSpeed = "slow" | "regular" | "fast";

export interface User {
	id: string;
	email: string;
}

export interface ChargingSession {
	id: string;
	user_id: string;
	vehicle_id: string | null;
	date: string;
	provider: string | null;
	start_percent: number | null;
	end_percent: number | null;
	kwh_added: number;
	duration_minutes: number | null;
	odometer: number | null;
	cost: number | null;
	rate_per_kwh: number | null;
	charging_speed: ChargingSpeed | null;
	notes: string | null;
	created_at: string;
}

export interface CreateSessionPayload {
	date: string;
	provider: string | null;
	start_percent: number | null;
	end_percent: number | null;
	kwh_added: number;
	duration_minutes: number | null;
	odometer: number | null;
	cost: number | null;
	rate_per_kwh: number | null;
	charging_speed: ChargingSpeed | null;
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

import { createClient } from "@/src/lib/supabase/server";
import { CreateSessionPayload, ChargingSession } from "@/src/types";

export async function dbGetSessions(
	userId: string,
): Promise<ChargingSession[]> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("charging_sessions")
		.select("*")
		.eq("user_id", userId)
		.order("date", { ascending: false });

	if (error) throw new Error(error.message);
	return data ?? [];
}

export async function dbCreateSession(
	userId: string,
	payload: CreateSessionPayload & { charging_speed: string | null },
): Promise<ChargingSession> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("charging_sessions")
		.insert({ ...payload, user_id: userId })
		.select()
		.single();

	if (error) throw new Error(error.message);
	return data;
}

export async function dbDeleteSession(
	userId: string,
	id: string,
): Promise<void> {
	const supabase = await createClient();
	const { error } = await supabase
		.from("charging_sessions")
		.delete()
		.eq("id", id)
		.eq("user_id", userId);

	if (error) throw new Error(error.message);
}

export async function dbUpdateSession(
	userId: string,
	id: string,
	payload: Partial<CreateSessionPayload> & { charging_speed?: string | null },
): Promise<ChargingSession> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("charging_sessions")
		.update(payload)
		.eq("id", id)
		.eq("user_id", userId)
		.select()
		.single();

	if (error) throw new Error(error.message);
	return data;
}

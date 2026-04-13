import { createClient } from "@/src/lib/supabase/server";

export interface Provider {
	id: string;
	user_id: string;
	name: string;
	created_at: string;
}

export async function dbGetProviders(userId: string): Promise<Provider[]> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("providers")
		.select("*")
		.eq("user_id", userId)
		.order("name", { ascending: true });

	if (error) throw new Error(error.message);
	return data ?? [];
}

export async function dbCreateProvider(
	userId: string,
	name: string,
): Promise<Provider> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("providers")
		.insert({ user_id: userId, name })
		.select()
		.single();

	if (error) throw new Error(error.message);
	return data;
}

export async function dbDeleteProvider(
	userId: string,
	id: string,
): Promise<void> {
	const supabase = await createClient();
	const { error } = await supabase
		.from("providers")
		.delete()
		.eq("id", id)
		.eq("user_id", userId);

	if (error) throw new Error(error.message);
}

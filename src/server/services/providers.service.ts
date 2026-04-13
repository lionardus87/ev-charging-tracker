import {
	dbGetProviders,
	dbCreateProvider,
	dbDeleteProvider,
	Provider,
} from "@/src/server/db/providers.db";

export async function getProviders(userId: string): Promise<Provider[]> {
	return dbGetProviders(userId);
}

export async function createProvider(
	userId: string,
	name: string,
): Promise<Provider> {
	const trimmed = name.trim();
	if (!trimmed) throw new Error("Provider name cannot be empty");
	return dbCreateProvider(userId, trimmed);
}

export async function deleteProvider(
	userId: string,
	id: string,
): Promise<void> {
	return dbDeleteProvider(userId, id);
}

import { useState, useEffect } from "react";
import { getProviders, createProvider, deleteProvider } from "@/src/lib/api";
import { Provider } from "@/src/server/db/providers.db";

export function useProviders() {
	const [providers, setProviders] = useState<Provider[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			const { data } = await getProviders();
			if (data) setProviders(data);
			setLoading(false);
		}
		load();
	}, []);

	async function addProvider(name: string): Promise<Provider | null> {
		const { data, error } = await createProvider(name);
		if (error || !data) return null;
		setProviders((prev) =>
			[...prev, data].sort((a, b) => a.name.localeCompare(b.name)),
		);
		return data;
	}

	async function removeProvider(id: string) {
		const { error } = await deleteProvider(id);
		if (!error) setProviders((prev) => prev.filter((p) => p.id !== id));
	}

	return { providers, loading, addProvider, removeProvider };
}

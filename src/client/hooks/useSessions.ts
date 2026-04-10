import { useState, useEffect } from "react";
import { getSessions, deleteSession } from "@/src/lib/api";
import { calculateStats } from "@/src/lib/api";
import { ChargingSession, SessionStats } from "@/src/types";

export function useSessions() {
	const [sessions, setSessions] = useState<ChargingSession[]>([]);
	const [stats, setStats] = useState<SessionStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function load() {
			const { data, error } = await getSessions();
			if (error || !data) {
				setError(error);
				setLoading(false);
				return;
			}
			setSessions(data);
			setStats(calculateStats(data));
			setLoading(false);
		}
		load();
	}, []);

	async function handleDelete(id: string) {
		if (!confirm("Delete this session?")) return;
		const { error } = await deleteSession(id);
		if (!error) setSessions((prev) => prev.filter((s) => s.id !== id));
	}

	return { sessions, stats, loading, error, handleDelete };
}

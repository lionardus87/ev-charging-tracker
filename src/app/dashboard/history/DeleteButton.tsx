"use client";

import { createClient } from "@/lib/supbase/client";
import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: string }) {
	const router = useRouter();
	const supabase = createClient();

	async function handleDelete() {
		if (!confirm("Delete this session?")) return;
		await supabase.from("charging_sessions").delete().eq("id", id);
		router.refresh();
	}

	return (
		<button
			onClick={handleDelete}
			className="text-gray-300 hover:text-red-500 transition text-lg leading-none mt-0.5"
		>
			✕
		</button>
	);
}

import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import EditSessionClient from "./EditSessionClient";

export default async function EditSessionPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");

	const { id } = await params;
	const { data: session } = await supabase
		.from("charging_sessions")
		.select("*")
		.eq("id", id)
		.eq("user_id", user.id)
		.single();

	if (!session) redirect("/dashboard/history");

	return <EditSessionClient session={session} />;
}

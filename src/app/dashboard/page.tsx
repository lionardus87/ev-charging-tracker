import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashBoardClient";

export default async function DashboardPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");

	return <DashboardClient />;
}

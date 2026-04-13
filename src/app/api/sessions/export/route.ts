import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import {
	getSessions,
	generateCsv,
} from "@/src/server/services/sessions.service";

export async function GET() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const sessions = await getSessions(user.id);
		const csv = generateCsv(sessions);

		return new NextResponse(csv, {
			status: 200,
			headers: {
				"Content-Type": "text/csv",
				"Content-Disposition": `attachment; filename="ev-charging-${new Date().toISOString().split("T")[0]}.csv"`,
			},
		});
	} catch (error) {
		return NextResponse.json(
			{ error: (error as Error).message },
			{ status: 500 },
		);
	}
}

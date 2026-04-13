import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import {
	parseCsv,
	createSession,
} from "@/src/server/services/sessions.service";
import { ApiResponse } from "@/src/types";

export async function POST(request: Request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user)
			return NextResponse.json(
				{ data: null, error: "Unauthorized" },
				{ status: 401 },
			);

		const formData = await request.formData();
		const file = formData.get("file") as File;
		if (!file)
			return NextResponse.json(
				{ data: null, error: "No file provided" },
				{ status: 400 },
			);

		const text = await file.text();
		const sessions = parseCsv(text);

		if (!sessions.length) {
			return NextResponse.json(
				{ data: null, error: "No valid sessions found in CSV" },
				{ status: 400 },
			);
		}

		const results = await Promise.all(
			sessions.map((session) => createSession(user.id, session)),
		);

		return NextResponse.json(
			{
				data: `Successfully imported ${results.length} sessions`,
				error: null,
			} as ApiResponse<string>,
			{ status: 201 },
		);
	} catch (error) {
		return NextResponse.json(
			{ data: null, error: (error as Error).message },
			{ status: 500 },
		);
	}
}

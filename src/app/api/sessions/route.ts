import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import {
	getSessions,
	createSession,
} from "@/src/server/services/sessions.service";
import {
	CreateSessionPayload,
	ApiResponse,
	ChargingSession,
} from "@/src/types";

export async function GET() {
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

		const data = await getSessions(user.id);
		return NextResponse.json({ data, error: null } as ApiResponse<
			ChargingSession[]
		>);
	} catch (error) {
		return NextResponse.json(
			{ data: null, error: (error as Error).message },
			{ status: 500 },
		);
	}
}

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

		const body: CreateSessionPayload = await request.json();
		const data = await createSession(user.id, body);
		return NextResponse.json(
			{ data, error: null } as ApiResponse<ChargingSession>,
			{ status: 201 },
		);
	} catch (error) {
		return NextResponse.json(
			{ data: null, error: (error as Error).message },
			{ status: 500 },
		);
	}
}

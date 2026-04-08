import { createClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";
import {
	CreateSessionPayload,
	ApiResponse,
	ChargingSession,
} from "@/src/types";

export async function GET() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json(
			{ data: null, error: "Unauthorized" },
			{ status: 401 },
		);
	}

	const { data, error } = await supabase
		.from("charging_sessions")
		.select("*")
		.eq("user_id", user.id)
		.order("date", { ascending: false });

	if (error) {
		return NextResponse.json(
			{ data: null, error: error.message },
			{ status: 500 },
		);
	}

	return NextResponse.json({ data, error: null } as ApiResponse<
		ChargingSession[]
	>);
}

export async function POST(request: Request) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json(
			{ data: null, error: "Unauthorized" },
			{ status: 401 },
		);
	}

	const body: CreateSessionPayload = await request.json();

	let finalRate = body.rate_per_kwh;
	let finalCost = body.cost;

	if (finalCost && body.kwh_added && !finalRate)
		finalRate = finalCost / body.kwh_added;
	if (finalRate && body.kwh_added && !finalCost)
		finalCost = finalRate * body.kwh_added;

	const { data, error } = await supabase
		.from("charging_sessions")
		.insert({
			...body,
			user_id: user.id,
			rate_per_kwh: finalRate,
			cost: finalCost,
		})
		.select()
		.single();

	if (error) {
		return NextResponse.json(
			{ data: null, error: error.message },
			{ status: 500 },
		);
	}

	return NextResponse.json(
		{ data, error: null } as ApiResponse<ChargingSession>,
		{ status: 201 },
	);
}

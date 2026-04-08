import { createClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";
import { ApiResponse, User } from "@/src/types";

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

	return NextResponse.json({
		data: { id: user.id, email: user.email },
		error: null,
	} as ApiResponse<User>);
}

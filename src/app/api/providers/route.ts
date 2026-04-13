import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import {
	getProviders,
	createProvider,
} from "@/src/server/services/providers.service";
import { ApiResponse } from "@/src/types";
import { Provider } from "@/src/server/db/providers.db";

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

		const data = await getProviders(user.id);
		return NextResponse.json({ data, error: null } as ApiResponse<Provider[]>);
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

		const { name } = await request.json();
		const data = await createProvider(user.id, name);
		return NextResponse.json({ data, error: null } as ApiResponse<Provider>, {
			status: 201,
		});
	} catch (error) {
		return NextResponse.json(
			{ data: null, error: (error as Error).message },
			{ status: 500 },
		);
	}
}

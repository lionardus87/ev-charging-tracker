import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { deleteProvider } from "@/src/server/services/providers.service";

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
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

		const { id } = await params;
		await deleteProvider(user.id, id);
		return NextResponse.json({ data: "Provider deleted", error: null });
	} catch (error) {
		return NextResponse.json(
			{ data: null, error: (error as Error).message },
			{ status: 500 },
		);
	}
}

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = await createClient();

    // Check if a user's logged in
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        await supabase.auth.signOut();
    }

    revalidatePath("/", "layout");

    // In a Docker/proxy environment (like EasyPanel), request.url might be the internal IP.
    // We should respect the x-forwarded-host header if it exists.
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const baseUrl = host ? `${protocol}://${host}` : request.url;

    return NextResponse.redirect(new URL("/login", baseUrl), {
        status: 302,
    });
}

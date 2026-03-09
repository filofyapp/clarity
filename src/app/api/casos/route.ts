import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || 50;
    const estado = searchParams.get("estado");

    let query = supabase
        .from("casos")
        .select("id, numero_siniestro, estado, fecha_derivacion")
        .order("fecha_derivacion", { ascending: false })
        .limit(Number(limit));

    if (estado) {
        query = query.eq("estado", estado);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
    const supabase = await createClient();

    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "Falta el ID del caso" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("casos")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error updating caso in API PATCH:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error("Error parsing request body:", error);
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
}

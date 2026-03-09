import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query || query.length < 3) {
            return NextResponse.json([]);
        }

        const supabase = await createClient();

        // Search by numero_siniestro or dominio
        const { data, error } = await supabase
            .from("casos")
            .select("id, numero_siniestro, dominio")
            .or(`numero_siniestro.ilike.%${query}%,dominio.ilike.%${query}%`)
            .limit(5);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

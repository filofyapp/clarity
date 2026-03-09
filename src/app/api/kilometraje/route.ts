import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — Historial de KM por perito y rango de fechas
export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const peritoId = searchParams.get("perito_id") || user.id;
    const mes = searchParams.get("mes"); // formato: YYYY-MM

    let query = supabase
        .from("kilometraje_diario")
        .select("*")
        .eq("perito_id", peritoId)
        .order("fecha", { ascending: false });

    if (mes) {
        const inicio = `${mes}-01`;
        const fin = `${mes}-31`;
        query = query.gte("fecha", inicio).lte("fecha", fin);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST — Guardar registro de KM diario
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    const {
        perito_id, fecha, casos_ids, direcciones_ordenadas,
        km_total, duracion_estimada_min, ruta_polyline,
        ruta_google_maps_url, ruta_waze_url,
        precio_km_estudio, precio_km_perito, punto_partida
    } = body;

    const monto_total_estudio = (km_total || 0) * (precio_km_estudio || 0);
    const monto_total_perito = (km_total || 0) * (precio_km_perito || 0);

    const { data, error } = await supabase
        .from("kilometraje_diario")
        .upsert({
            perito_id: perito_id || user.id,
            fecha,
            casos_ids,
            direcciones_ordenadas,
            km_total,
            duracion_estimada_min,
            ruta_polyline,
            ruta_google_maps_url,
            ruta_waze_url,
            precio_km_estudio,
            precio_km_perito,
            monto_total_estudio,
            monto_total_perito,
            punto_partida
        }, { onConflict: "perito_id,fecha" })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

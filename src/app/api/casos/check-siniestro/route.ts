import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const numero = req.nextUrl.searchParams.get("numero");
    if (!numero) return NextResponse.json({ exists: false });

    const supabase = await createClient();
    const { data } = await supabase
        .from("casos")
        .select("id, numero_siniestro, tipo_inspeccion, estado, fecha_derivacion, dominio, marca, taller_id, direccion_inspeccion, localidad, perito_calle_id, perito_carga_id, gestor_id")
        .eq("numero_siniestro", numero.trim())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (data) {
        return NextResponse.json({ exists: true, caso: data });
    }
    return NextResponse.json({ exists: false });
}

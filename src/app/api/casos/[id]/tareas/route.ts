import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const casoId = resolvedParams.id;
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("tareas")
            .select(`
                *,
                creador:usuarios!tareas_creador_id_fkey(nombre, apellido),
                asignado:usuarios!tareas_asignado_id_fkey(nombre, apellido),
                caso:casos(numero_siniestro)
            `)
            .eq("caso_id", casoId)
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

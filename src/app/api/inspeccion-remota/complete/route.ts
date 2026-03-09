import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient();
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: "Token requerido" }, { status: 400 });
        }

        // Validate token
        const { data: link, error } = await supabase
            .from("links_inspeccion")
            .select("id, caso_id, estado, fotos_subidas")
            .eq("token", token)
            .single();

        if (error || !link) {
            return NextResponse.json({ error: "Link inválido" }, { status: 404 });
        }

        if (link.estado !== "activo") {
            return NextResponse.json({ error: `Link ya ${link.estado}` }, { status: 403 });
        }

        // Mark link as completed
        await supabase
            .from("links_inspeccion")
            .update({ estado: "completado", completed_at: new Date().toISOString() })
            .eq("id", link.id);

        // Get current caso state
        const { data: caso } = await supabase
            .from("casos")
            .select("estado, fecha_inspeccion_real, perito_calle_id, perito_carga_id")
            .eq("id", link.caso_id)
            .single();

        const estadoAnterior = caso?.estado || "ip_coordinada";

        // Update caso: estado → pendiente_carga + fecha_inspeccion_real
        await supabase
            .from("casos")
            .update({
                estado: "pendiente_carga",
                fecha_inspeccion_real: caso?.fecha_inspeccion_real || new Date().toISOString(),
            })
            .eq("id", link.caso_id);

        // Create historial entry with proper state transition
        await supabase.from("historial_estados").insert({
            caso_id: link.caso_id,
            estado_anterior: estadoAnterior,
            estado_nuevo: "pendiente_carga",
            motivo: `📸 Inspección remota completada: ${link.fotos_subidas} fotos cargadas vía link`,
        });

        // Create nota for the activity feed
        await supabase.from("notas_caso").insert({
            caso_id: link.caso_id,
            usuario_id: null,
            contenido: `📸 Se completó la inspección remota con ${link.fotos_subidas} fotos. Estado actualizado a Pendiente de Carga.`,
            tipo: "sistema",
        });

        // Create notification for perito_carga if assigned
        if (caso?.perito_carga_id) {
            await supabase.from("notificaciones").insert({
                usuario_destino_id: caso.perito_carga_id,
                tipo: "inspeccion_realizada",
                caso_id: link.caso_id,
                mensaje: `Inspección remota completada con ${link.fotos_subidas} fotos — Pendiente de Carga`,
                leida: false,
            });
        }

        return NextResponse.json({ ok: true, fotos_total: link.fotos_subidas });
    } catch (err) {
        console.error("Complete endpoint error:", err);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

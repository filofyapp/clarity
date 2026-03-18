import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { encolarNotificacion } from "@/lib/email/queue";

// ═══ Retry helper for transient Supabase 502/503/504 errors ═══
function isTransientError(error: any): boolean {
    if (!error) return false;
    const msg = typeof error === "string" ? error : error?.message || "";
    return msg.includes("<!DOCTYPE") || msg.includes("Bad gateway") || msg.includes("502") || msg.includes("503") || msg.includes("504");
}

async function withRetry<T extends { data: any; error: any }>(
    fn: () => PromiseLike<T>,
    maxRetries = 3,
): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const result = await fn();
        if (!result.error || !isTransientError(result.error)) {
            return result;
        }
        console.warn(`[Retry ${attempt + 1}/${maxRetries}] Transient Supabase error, retrying in ${(attempt + 1)}s...`);
        await new Promise(r => setTimeout(r, (attempt + 1) * 1000));
    }
    return fn();
}

export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient();
        const { token, observaciones_pericia, audio_pericia_url } = await req.json();

        if (!token) {
            return NextResponse.json({ error: "Token requerido" }, { status: 400 });
        }

        // Validate token (with retry)
        const { data: link, error } = await withRetry(() =>
            supabase
                .from("links_inspeccion")
                .select("id, caso_id, estado, fotos_subidas")
                .eq("token", token)
                .single()
        );

        if (error || !link) {
            return NextResponse.json({ error: "Link inválido" }, { status: 404 });
        }

        if (link.estado !== "activo") {
            return NextResponse.json({ error: `Link ya ${link.estado}` }, { status: 403 });
        }

        // Mark link as completed (with retry)
        await withRetry(() =>
            supabase
                .from("links_inspeccion")
                .update({ estado: "completado", completed_at: new Date().toISOString() })
                .eq("id", link.id)
        );

        // Get current caso state (with retry)
        const { data: caso } = await withRetry(() =>
            supabase
                .from("casos")
                .select("estado, fecha_inspeccion_real, fecha_carga_sistema, perito_calle_id, perito_carga_id")
                .eq("id", link.caso_id)
                .single()
        );

        const estadoAnterior = caso?.estado || "ip_coordinada";

        // Update caso: estado → pendiente_carga + fecha_inspeccion_real + observaciones (with retry)
        const updateData: Record<string, any> = {
            estado: "pendiente_carga",
            fecha_inspeccion_real: caso?.fecha_inspeccion_real || new Date().toISOString(),
            fecha_carga_sistema: caso?.fecha_carga_sistema || new Date().toISOString(),
        };
        if (observaciones_pericia && observaciones_pericia.trim()) {
            updateData.observaciones_pericia = observaciones_pericia.trim();
        }
        if (audio_pericia_url) {
            updateData.audio_pericia_url = audio_pericia_url;
        }

        await withRetry(() =>
            supabase
                .from("casos")
                .update(updateData)
                .eq("id", link.caso_id)
        );

        // Create historial entry (with retry)
        await withRetry(() =>
            supabase.from("historial_estados").insert({
                caso_id: link.caso_id,
                estado_anterior: estadoAnterior,
                estado_nuevo: "pendiente_carga",
                motivo: `📸 Inspección remota completada: ${link.fotos_subidas} fotos cargadas vía link`,
            })
        );

        // Enqueue email notification if applicable
        await encolarNotificacion(link.caso_id, estadoAnterior, "pendiente_carga").catch(err => {
            console.error("Error al intentar encolar notificación en inspeccion-remota/complete:", err);
        });

        // Create nota for the activity feed (with retry)
        await withRetry(() =>
            supabase.from("notas_caso").insert({
                caso_id: link.caso_id,
                usuario_id: null,
                contenido: `📸 Se completó la inspección remota con ${link.fotos_subidas} fotos. Estado actualizado a Pendiente de Carga.`,
                tipo: "sistema",
            })
        );

        // Create notification for perito_carga if assigned (with retry)
        if (caso?.perito_carga_id) {
            await withRetry(() =>
                supabase.from("notificaciones").insert({
                    usuario_destino_id: caso.perito_carga_id,
                    tipo: "inspeccion_realizada",
                    caso_id: link.caso_id,
                    mensaje: `Inspección remota completada con ${link.fotos_subidas} fotos — Pendiente de Carga`,
                    leida: false,
                })
            );
        }

        return NextResponse.json({ ok: true, fotos_total: link.fotos_subidas });
    } catch (err) {
        console.error("Complete endpoint error:", err);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}


import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/gmail";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient();

        // Auth: require logged-in user (admin or carga)
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { casoId } = await req.json();
        if (!casoId) {
            return NextResponse.json({ error: "casoId requerido" }, { status: 400 });
        }

        // 1. Fetch caso data
        const { data: caso, error: casoErr } = await supabase
            .from("casos")
            .select("id, numero_siniestro, marca, dominio, estado, perito_carga_id")
            .eq("id", casoId)
            .single();

        if (casoErr || !caso) {
            return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
        }

        // 2. Fetch config values
        const { data: configs } = await supabase
            .from("configuracion")
            .select("clave, valor")
            .in("clave", ["migracion_email_to", "migracion_email_cc", "migracion_usuario_destino"]);

        const configMap: Record<string, any> = {};
        for (const c of configs || []) {
            configMap[c.clave] = c.valor;
        }

        const toEmail = (configMap.migracion_email_to || "rcardozo@sancorseguros.com").replace(/"/g, "");
        const ccRaw = configMap.migracion_email_cc;
        const ccEmails: string[] = Array.isArray(ccRaw)
            ? ccRaw
            : typeof ccRaw === "string"
                ? [ccRaw.replace(/"/g, "")]
                : [];
        const usuarioDestino = (configMap.migracion_usuario_destino || "ALFREDO MIÑO").replace(/"/g, "");

        // 3. Build email
        const vehiculo = [caso.marca].filter(Boolean).join(" ");
        const subject = `PEDIDO DE MIGRACION STRO ${caso.numero_siniestro}`;
        const body = `Buenos días estimados, los molesto para migrar el siguiente siniestro al usuario de ${usuarioDestino}:<br><br>` +
            `Siniestro: ${caso.numero_siniestro}<br>` +
            `Vehículo: ${vehiculo || "—"}<br>` +
            `Dominio: ${caso.dominio || "—"}<br><br>` +
            `¡Muchas gracias!<br><br>` +
            `--<br>` +
            `Estudio AOM Siniestros<br>` +
            `CLARITY · Tecnología de Inspección Inteligente`;

        // 4. Send immediately (not via queue)
        const result = await sendEmail({
            toEmail,
            ccEmails,
            subject,
            htmlBody: body,
        });

        if (!result.success) {
            console.error("[Migración] Error enviando email:", result.error);
            return NextResponse.json({ error: "Error al enviar email: " + result.error }, { status: 500 });
        }

        // 5. Update caso: estado + thread tracking
        const estadoAnterior = caso.estado;
        console.log(`[Migración] Guardando threadId=${result.threadId}, messageId=${result.messageId} para caso ${caso.id}`);
        const { error: updateErr } = await supabase
            .from("casos")
            .update({
                estado: "en_consulta_cia",
                gmail_migracion_thread_id: result.threadId,
                gmail_migracion_message_id: result.messageId,
            })
            .eq("id", caso.id);

        if (updateErr) {
            console.error(`[Migración] Error guardando threadId:`, updateErr);
        }

        // Verify it was saved
        const { data: check } = await supabase
            .from("casos")
            .select("gmail_migracion_thread_id")
            .eq("id", caso.id)
            .single();
        console.log(`[Migración] Verificación: threadId guardado = ${check?.gmail_migracion_thread_id}`);

        // 6. Historial
        await supabase.from("historial_estados").insert({
            caso_id: caso.id,
            estado_anterior: estadoAnterior,
            estado_nuevo: "en_consulta_cia",
            motivo: `📨 Pedido de migración enviado a ${toEmail} (usuario destino: ${usuarioDestino})`,
        });

        // 7. Nota de sistema
        await supabase.from("notas_caso").insert({
            caso_id: caso.id,
            usuario_id: null,
            contenido: `📨 Se envió solicitud de migración al usuario de ${usuarioDestino}.\nDestinatarios: ${toEmail} (CC: ${ccEmails.join(", ")})\nEl caso pasará automáticamente a Pendiente de Carga cuando respondan.`,
            tipo: "sistema",
        });

        // 8. Notification to admins
        const { data: admins } = await supabase
            .from("usuarios")
            .select("id")
            .eq("rol", "admin")
            .eq("activo", true);

        if (admins) {
            const notifs = admins.map(admin => ({
                usuario_destino_id: admin.id,
                tipo: "migracion_enviada",
                caso_id: caso.id,
                mensaje: `Solicitud de migración enviada para siniestro ${caso.numero_siniestro}`,
                leida: false,
            }));
            await supabase.from("notificaciones").insert(notifs);
        }

        return NextResponse.json({ ok: true, threadId: result.threadId, messageId: result.messageId });
    } catch (err: any) {
        console.error("[Migración] Error:", err);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

import { createAdminClient } from "@/lib/supabase/admin";
import { getGmailAccessToken } from "@/lib/email/gmail";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let gestorResult: Record<string, any> = {};
    let migracionesDetectadas = 0;

    // DESACTIVADO TEMPORALMENTE — Detección de respuestas de gestores
    // Reactivar cuando se decida implementar la UI completa
    // El código original de Block 1 revisaba gmail_thread_id en los casos,
    // detectaba respuestas de gestores, las insertaba en respuestas_gestor,
    // seteaba tiene_respuesta_gestor = true, y creaba notificaciones.
    gestorResult = { gestores: "desactivado_temporalmente" };
    console.log("[Cron] Block 1 (respuestas gestores) DESACTIVADO temporalmente");

    // ═══ BLOCK 2: Migration thread replies (independent try/catch) ═══
    try {
        const supabase = createAdminClient();
        const token = await getGmailAccessToken();
        const fromEmail = process.env.GMAIL_USER_EMAIL || "gestionsancoraomsiniestros@gmail.com";

        if (!token) {
            console.error("[Cron] No Gmail token for migration block");
        } else {
            const { data: casosMigracion } = await supabase
                .from("casos")
                .select("id, numero_siniestro, gmail_migracion_thread_id, perito_carga_id")
                .not("gmail_migracion_thread_id", "is", null)
                .eq("estado", "en_consulta_cia");
            console.log(`[Cron/Migración] Encontrados ${casosMigracion?.length || 0} casos con gmail_migracion_thread_id en estado en_consulta_cia`);

            if (casosMigracion && casosMigracion.length > 0) {
                for (const caso of casosMigracion) {
                    console.log(`[Cron/Migración] Revisando caso ${caso.numero_siniestro} — threadId: ${caso.gmail_migracion_thread_id}`);
                    try {
                        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${fromEmail}/threads/${caso.gmail_migracion_thread_id}`, {
                            headers: { "Authorization": `Bearer ${token}` }
                        });

                        if (!res.ok) {
                            const errText = await res.text();
                            console.warn(`[Cron/Migración] Error fetching thread ${caso.gmail_migracion_thread_id}: status=${res.status} body=${errText}`);
                            continue;
                        }

                        const threadData = await res.json();
                        const messages = threadData.messages || [];
                        console.log(`[Cron/Migración] Thread ${caso.gmail_migracion_thread_id} tiene ${messages.length} mensaje(s)`);

                        let hasExternalReply = false;
                        let replyBody = "";

                        for (const msg of messages) {
                            const headers = msg.payload?.headers || [];
                            const fromHeader = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "";

                            console.log(`[Cron/Migración] Mensaje ${msg.id}: from="${fromHeader}", esNuestro=${fromHeader.toLowerCase().includes(fromEmail.toLowerCase())}`);

                            if (fromHeader.toLowerCase().includes(fromEmail.toLowerCase())) continue;

                            hasExternalReply = true;
                            if (msg.payload?.parts) {
                                const textPart = msg.payload.parts.find((p: any) => p.mimeType === "text/plain");
                                if (textPart?.body?.data) {
                                    replyBody = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
                                }
                            } else if (msg.payload?.body?.data) {
                                replyBody = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8');
                            }
                            break;
                        }

                        if (!hasExternalReply) {
                            console.log(`[Cron/Migración] No se encontró respuesta externa en thread ${caso.gmail_migracion_thread_id}`);
                            continue;
                        }

                        migracionesDetectadas++;
                        console.log(`[Cron] Migración confirmada para siniestro ${caso.numero_siniestro}`);

                        await supabase
                            .from("casos")
                            .update({ estado: "pendiente_carga" })
                            .eq("id", caso.id);

                        await supabase.from("historial_estados").insert({
                            caso_id: caso.id,
                            estado_anterior: "en_consulta_cia",
                            estado_nuevo: "pendiente_carga",
                            motivo: "✅ Migración confirmada — se recibió respuesta al email de solicitud",
                        });

                        await supabase.from("notas_caso").insert({
                            caso_id: caso.id,
                            usuario_id: null,
                            contenido: `✅ Migración confirmada. Respuesta recibida:\n\n${replyBody.substring(0, 1000)}`,
                            tipo: "sistema",
                        });

                        const { data: admins } = await supabase
                            .from("usuarios")
                            .select("id")
                            .eq("rol", "admin")
                            .eq("activo", true);

                        const destinatarios = new Set((admins || []).map(a => a.id));
                        if (caso.perito_carga_id) destinatarios.add(caso.perito_carga_id);

                        const notifs = Array.from(destinatarios).map(uid => ({
                            usuario_destino_id: uid,
                            tipo: "migracion_confirmada",
                            caso_id: caso.id,
                            mensaje: `Migración confirmada para siniestro ${caso.numero_siniestro}`,
                            leida: false,
                        }));
                        if (notifs.length > 0) {
                            await supabase.from("notificaciones").insert(notifs);
                        }

                    } catch (innerErr: any) {
                        console.error(`[Cron] Error processing migration thread for caso ${caso.id}:`, innerErr);
                    }
                }
            }
        }

        console.log(`[Cron] Migration block finished. Detected: ${migracionesDetectadas}`);
    } catch (migErr: any) {
        console.error("[Cron] Error in migration replies block:", migErr);
    }

    return NextResponse.json({
        message: "Lectura completa",
        ...gestorResult,
        migraciones_detectadas: migracionesDetectadas,
    });
}

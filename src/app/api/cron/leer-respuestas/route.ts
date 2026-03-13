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

    // ═══ BLOCK 1: Gestor reply detection (existing logic) ═══
    try {
        const supabase = createAdminClient();
        console.log("[Cron] Iniciando lectura de respuestas...");

        const token = await getGmailAccessToken();
        const fromEmail = process.env.GMAIL_USER_EMAIL || "gestionsancoraomsiniestros@gmail.com";

        if (!token) {
            gestorResult = { error_gestores: "No Gmail Token" };
        } else {
            const { data: casos, error: casosError } = await supabase
                .from("casos")
                .select("id, numero_siniestro, gmail_thread_id, tiene_respuesta_gestor, gestor_id")
                .not("gmail_thread_id", "is", null);

            if (casosError || !casos || casos.length === 0) {
                gestorResult = { message_gestores: "No hay casos con hilos activos." };
            } else {
                let totalRespuestasNuevas = 0;

                for (const caso of casos) {
                    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${fromEmail}/threads/${caso.gmail_thread_id}`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });

                    if (!res.ok) {
                        console.warn(`[Cron] Error fetching thread ${caso.gmail_thread_id}:`, await res.text());
                        continue;
                    }

                    const threadData = await res.json();
                    const messages = threadData.messages || [];

                    for (const msg of messages) {
                        const headers = msg.payload?.headers || [];
                        const fromHeader = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "";

                        if (fromHeader.toLowerCase().includes(fromEmail.toLowerCase())) continue;

                        const { data: exists } = await supabase
                            .from("respuestas_gestor")
                            .select("id")
                            .eq("gmail_message_id", msg.id)
                            .maybeSingle();

                        if (exists) continue;

                        totalRespuestasNuevas++;
                        console.log(`[Cron] Nueva respuesta detectada en siniestro ${caso.numero_siniestro}`);

                        let bodyText = "Contenido no disponible";
                        if (msg.payload?.parts) {
                            const textPart = msg.payload.parts.find((p: any) => p.mimeType === "text/plain");
                            if (textPart && textPart.body && textPart.body.data) {
                                bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
                            }
                        } else if (msg.payload?.body?.data) {
                            bodyText = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8');
                        }

                        let remitenteNombre = fromHeader;
                        let remitenteEmail = fromHeader;
                        const match = fromHeader.match(/(.*)<(.*)>/);
                        if (match) {
                            remitenteNombre = match[1].trim() || match[2].trim();
                            remitenteEmail = match[2].trim();
                        }

                        await supabase.from("respuestas_gestor").insert({
                            caso_id: caso.id,
                            gmail_message_id: msg.id,
                            remitente_nombre: remitenteNombre.replace(/["']/g, ''),
                            remitente_email: remitenteEmail,
                            contenido: bodyText
                        });

                        if (!caso.tiene_respuesta_gestor) {
                            await supabase.from("casos")
                                .update({ tiene_respuesta_gestor: true })
                                .eq("id", caso.id);
                        }

                        const { data: admins } = await supabase
                            .from("usuarios")
                            .select("id")
                            .eq("rol", "admin")
                            .eq("activo", true);

                        if (admins) {
                            const notifs = admins.map(admin => ({
                                usuario_destino_id: admin.id,
                                tipo: "mensaje_gestor",
                                caso_id: caso.id,
                                mensaje: `Nueva respuesta del gestor en Siniestro ${caso.numero_siniestro}`,
                                leida: false
                            }));
                            await supabase.from("notificaciones").insert(notifs);
                        }
                    }
                }

                gestorResult = {
                    hilos_revisados: casos.length,
                    nuevas_respuestas: totalRespuestasNuevas,
                };
            }
        }
    } catch (e: any) {
        console.error("[Cron] Error in gestor replies block:", e);
        gestorResult = { error_gestores: e.message };
    }

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

            if (casosMigracion && casosMigracion.length > 0) {
                for (const caso of casosMigracion) {
                    try {
                        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${fromEmail}/threads/${caso.gmail_migracion_thread_id}`, {
                            headers: { "Authorization": `Bearer ${token}` }
                        });

                        if (!res.ok) {
                            console.warn(`[Cron] Error fetching migration thread ${caso.gmail_migracion_thread_id}:`, await res.text());
                            continue;
                        }

                        const threadData = await res.json();
                        const messages = threadData.messages || [];

                        let hasExternalReply = false;
                        let replyBody = "";

                        for (const msg of messages) {
                            const headers = msg.payload?.headers || [];
                            const fromHeader = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "";

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

                        if (!hasExternalReply) continue;

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

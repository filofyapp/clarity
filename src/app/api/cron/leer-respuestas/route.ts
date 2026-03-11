import { createAdminClient } from "@/lib/supabase/admin";
import { getGmailAccessToken } from "@/lib/email/gmail";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createAdminClient();
        console.log("[Cron] Iniciando lectura de respuestas...");

        // 1. Get token
        const token = await getGmailAccessToken();
        const fromEmail = process.env.GMAIL_USER_EMAIL || "gestionsancoraomsiniestros@gmail.com";

        if (!token) {
            return NextResponse.json({ error: "No Gmail Token" }, { status: 500 });
        }

        // 2. Fetch all cases that have a gmail_thread_id
        const { data: casos, error: casosError } = await supabase
            .from("casos")
            .select("id, numero_siniestro, gmail_thread_id, tiene_respuesta_gestor, gestor_id")
            .not("gmail_thread_id", "is", null);

        if (casosError || !casos || casos.length === 0) {
            return NextResponse.json({ message: "No hay casos con hilos activos." });
        }

        let totalRespuestasNuevas = 0;

        for (const caso of casos) {
            // Fetch thread from Gmail
            const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${fromEmail}/threads/${caso.gmail_thread_id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) {
                console.warn(`[Cron] Error fetching thread ${caso.gmail_thread_id}:`, await res.text());
                continue;
            }

            const threadData = await res.json();
            const messages = threadData.messages || [];

            // 3. Find messages NOT sent by us and NOT already in respuestas_gestor
            for (const msg of messages) {
                const headers = msg.payload?.headers || [];
                const fromHeader = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "";

                // If the message is from us, ignore
                if (fromHeader.toLowerCase().includes(fromEmail.toLowerCase())) continue;

                // Check if we already have it
                const { data: exists } = await supabase
                    .from("respuestas_gestor")
                    .select("id")
                    .eq("gmail_message_id", msg.id)
                    .maybeSingle();

                if (exists) continue; // Already processed

                // It's a NEW reply!
                totalRespuestasNuevas++;
                console.log(`[Cron] Nueva respuesta detectada en siniestro ${caso.numero_siniestro}`);

                // Extract text body
                let bodyText = "Contenido no disponible";
                if (msg.payload?.parts) {
                    const textPart = msg.payload.parts.find((p: any) => p.mimeType === "text/plain");
                    if (textPart && textPart.body && textPart.body.data) {
                        bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
                    }
                } else if (msg.payload?.body?.data) {
                    bodyText = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8');
                }

                // Extract remitente email and name ("Juan <juan@mail.com>" -> "Juan", "juan@mail.com")
                let remitenteNombre = fromHeader;
                let remitenteEmail = fromHeader;
                const match = fromHeader.match(/(.*)<(.*)>/);
                if (match) {
                    remitenteNombre = match[1].trim() || match[2].trim();
                    remitenteEmail = match[2].trim();
                }

                // Insert into db
                await supabase.from("respuestas_gestor").insert({
                    caso_id: caso.id,
                    gmail_message_id: msg.id,
                    remitente_nombre: remitenteNombre.replace(/["']/g, ''),
                    remitente_email: remitenteEmail,
                    contenido: bodyText
                });

                // Update case flag
                if (!caso.tiene_respuesta_gestor) {
                    await supabase.from("casos")
                        .update({ tiene_respuesta_gestor: true })
                        .eq("id", caso.id);
                }

                // Fire internal notification to Coordinator (Admin)
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

        return NextResponse.json({
            message: "Lectura finalizada",
            hilos_revisados: casos.length,
            nuevas_respuestas: totalRespuestasNuevas
        });

    } catch (e: any) {
        console.error("[Cron] Uncaught exception:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

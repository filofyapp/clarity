import { createAdminClient } from "@/lib/supabase/admin";
import { getGmailAccessToken, sendEmail } from "@/lib/email/gmail";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const supabase = createAdminClient();
        console.log("[Cron] Iniciando procesamiento de correos...");

        // 1. Fetch pending emails whose "enviar_despues_de" is in the past
        const { data: pendientes, error } = await supabase
            .from("mail_queue")
            .select(`
                id, 
                caso_id, 
                estado_destino,
                destinatario_email,
                destinatario_nombre,
                asunto,
                cuerpo_html,
                caso:casos(estado, gmail_thread_id, gmail_message_id)
            `)
            .eq("enviado", false)
            .eq("cancelado", false)
            .lte("enviar_despues_de", new Date().toISOString())
            .order("created_at", { ascending: true });

        if (error) {
            console.error("[Cron] Error leyendo mail_queue:", error);
            return NextResponse.json({ error: "DB Error" }, { status: 500 });
        }

        if (!pendientes || pendientes.length === 0) {
            return NextResponse.json({ message: "No hay correos pendientes", procesados: 0 });
        }

        console.log(`[Cron] Se encontraron ${pendientes.length} correos encolados para enviar.`);

        const token = await getGmailAccessToken();
        if (!token) {
            // We can't send them, abort block
            return NextResponse.json({ error: "Falla obteniendo token Gmail API. Verifica credenciales." }, { status: 500 });
        }

        let sentCount = 0;
        let cancelCount = 0;
        let errCount = 0;

        // 2. Process each email sequentially (or via Promise.all with concurrency limit if volume is high)
        for (const mail of pendientes) {
            const casoInfo = mail.caso as any;

            // a. Check if the case state is STILL the "estado_destino" it was supposed to be when queued
            if (!casoInfo || casoInfo.estado !== mail.estado_destino) {
                // The state changed within the 3 min window or the case was deleted. Cancel email.
                await supabase.from("mail_queue").update({
                    cancelado: true,
                    error: `Estado actual '${casoInfo?.estado}' no coincide con el destino esperado '${mail.estado_destino}'`
                }).eq("id", mail.id);
                console.log(`[Cron] Correo cancelado (ID: ${mail.id}) por cambio de estado.`);
                cancelCount++;
                continue;
            }

            // b. Format subjects and thread references
            let subject = mail.asunto;
            let finalThreadId = undefined;
            let finalInReplyTo = undefined;

            if (casoInfo.gmail_thread_id) {
                subject = subject.startsWith("Re:") ? subject : `Re: ${subject}`;
                finalThreadId = casoInfo.gmail_thread_id;
                finalInReplyTo = casoInfo.gmail_message_id || undefined;
            }

            // c. Send via Gmail API
            const result = await sendEmail({
                toEmail: mail.destinatario_email,
                toName: mail.destinatario_nombre,
                subject: subject,
                htmlBody: mail.cuerpo_html,
                threadId: finalThreadId,
                inReplyToRef: finalInReplyTo
            });

            if (result.success) {
                // Return payload from Gmail API yields the newly assigned threadId and messageId  (their internal id)
                // d. Mark as sent
                await supabase.from("mail_queue").update({
                    enviado: true,
                    enviado_at: new Date().toISOString(),
                    gmail_message_id: result.messageId
                }).eq("id", mail.id);

                // e. Save thread/message into caso if it's new
                await supabase.from("casos").update({
                    gmail_thread_id: finalThreadId || result.threadId,
                    gmail_message_id: result.messageId
                }).eq("id", mail.caso_id);

                console.log(`[Cron] Envio exitoso del correo ${mail.id}. Thread: ${finalThreadId || result.threadId}`);
                sentCount++;
            } else {
                // Logic for max retries is skipped for now, but we'll mark the error
                await supabase.from("mail_queue").update({
                    error: result.error?.substring(0, 500) || "Error desconocido al enviar"
                }).eq("id", mail.id);
                errCount++;
            }
        }

        return NextResponse.json({
            message: "Cola procesada",
            procesados: pendientes.length,
            enviados: sentCount,
            cancelados: cancelCount,
            errores: errCount
        });

    } catch (e: any) {
        console.error("[Cron] Uncaught exception:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

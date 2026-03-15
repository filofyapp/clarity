import { createAdminClient } from "@/lib/supabase/admin";
import { renderTemplate } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/gmail";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient();

        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { casoId } = await req.json();
        if (!casoId) {
            return NextResponse.json({ error: "casoId requerido" }, { status: 400 });
        }

        // Fetch caso with perito_calle
        const { data: caso, error: casoErr } = await supabase
            .from("casos")
            .select(`
                id, numero_siniestro, derivacion_enviada_at,
                perito_calle_id,
                perito_calle:usuarios!casos_perito_calle_id_fkey(nombre, apellido, email)
            `)
            .eq("id", casoId)
            .single();

        if (casoErr || !caso) {
            return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
        }

        const perito = caso.perito_calle as any;
        if (!perito || !perito.email) {
            return NextResponse.json({
                error: "El perito de calle no tiene email configurado"
            }, { status: 400 });
        }

        // Render template using the existing system
        const render = await renderTemplate(casoId, "derivacion_perito");
        if (!render) {
            return NextResponse.json({
                error: "Error al renderizar el template de derivación"
            }, { status: 500 });
        }

        // Fetch archivos adjuntos del caso
        const attachments: { filename: string; mimeType: string; content: Buffer }[] = [];
        const { data: files } = await supabase.storage
            .from("caso-archivos")
            .list(casoId, { limit: 20 });

        if (files && files.length > 0) {
            let totalSize = 0;
            const MAX_TOTAL = 10 * 1024 * 1024; // 10MB limit

            for (const file of files) {
                if (file.metadata && (file.metadata as any).size) {
                    totalSize += (file.metadata as any).size;
                }
                if (totalSize > MAX_TOTAL) {
                    console.warn(`[Derivación] Adjuntos exceden 10MB, se adjuntan ${attachments.length} de ${files.length}`);
                    break;
                }
                const { data: blob, error: dlErr } = await supabase.storage
                    .from("caso-archivos")
                    .download(`${casoId}/${file.name}`);

                if (dlErr || !blob) {
                    console.warn(`[Derivación] No se pudo descargar ${file.name}:`, dlErr);
                    continue;
                }

                const arrayBuffer = await blob.arrayBuffer();
                const ext = file.name.split('.').pop()?.toLowerCase() || '';
                const mimeMap: Record<string, string> = {
                    pdf: 'application/pdf',
                    jpg: 'image/jpeg', jpeg: 'image/jpeg',
                    png: 'image/png',
                    doc: 'application/msword',
                    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    xls: 'application/vnd.ms-excel',
                    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                };
                // Strip timestamp prefix from filename (e.g. 1710467890123_caratula.pdf → caratula.pdf)
                const cleanName = file.name.replace(/^\d+_/, '');

                attachments.push({
                    filename: cleanName,
                    mimeType: mimeMap[ext] || 'application/octet-stream',
                    content: Buffer.from(arrayBuffer),
                });
            }
            console.log(`[Derivación] ${attachments.length} archivo(s) adjuntados`);
        }

        // Send immediately via Gmail API (with attachments if any)
        const result = await sendEmail({
            toEmail: perito.email,
            toName: `${perito.nombre} ${perito.apellido}`,
            subject: render.asunto,
            htmlBody: render.cuerpo_html,
            attachments: attachments.length > 0 ? attachments : undefined,
        });

        if (!result.success) {
            return NextResponse.json({ error: "Error al enviar email: " + result.error }, { status: 500 });
        }

        // Update derivacion_enviada_at
        await supabase
            .from("casos")
            .update({ derivacion_enviada_at: new Date().toISOString() })
            .eq("id", casoId);

        // Audit: record in mail_queue as already sent
        await supabase.from("mail_queue").insert({
            caso_id: casoId,
            estado_origen: "derivacion",
            estado_destino: "derivacion",
            destinatario_email: perito.email,
            destinatario_nombre: `${perito.nombre} ${perito.apellido}`,
            asunto: render.asunto,
            cuerpo_html: render.cuerpo_html,
            enviado: true,
            enviado_at: new Date().toISOString(),
        });

        // Historial
        await supabase.from("historial_estados").insert({
            caso_id: casoId,
            estado_anterior: null,
            estado_nuevo: null,
            motivo: `📧 Derivación enviada a ${perito.nombre} ${perito.apellido} (${perito.email})`,
        });

        return NextResponse.json({
            ok: true,
            enviadoA: `${perito.nombre} ${perito.apellido}`,
        });
    } catch (err: any) {
        console.error("[Derivación] Error:", err);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

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

        // Send immediately via Gmail API
        const result = await sendEmail({
            toEmail: perito.email,
            toName: `${perito.nombre} ${perito.apellido}`,
            subject: render.asunto,
            htmlBody: render.cuerpo_html,
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

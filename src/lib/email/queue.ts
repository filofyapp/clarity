import { createClient } from "@/lib/supabase/server";
import { renderTemplate } from "./templates";

export async function encolarNotificacion(casoId: string, estadoAnterior: string | null, estadoNuevo: string) {
    const supabase = await createClient();

    // 1. Check if the transition is one of the 5 allowed triggers.
    // The transitions are identified by the 'codigo' from the defaults.
    const TRANSICIONES_VALIDAS: Record<string, string> = {
        'pendiente_coordinacion->contactado': 'contactado',
        'contactado->ip_coordinada': 'ip_coordinada',
        'ip_coordinada->pendiente_carga': 'inspeccion_realizada',
        'ip_coordinada->pendiente_presupuesto': 'esperando_presupuesto',
        'pendiente_carga->licitando_repuestos': 'licitando'
    };

    const key = `${estadoAnterior}->${estadoNuevo}`;
    const codigoTemplate = TRANSICIONES_VALIDAS[key];

    if (!codigoTemplate) {
        // Not a valid transition to send email, skip silently
        return { encolado: false, rason: 'transicion_no_aplica' };
    }

    // 2. Fetch the template configuration first specifically to check if active mapping exists
    const { data: template } = await supabase
        .from('mail_templates')
        .select('activo')
        .eq('codigo', codigoTemplate)
        .single();

    if (!template || !template.activo) {
        return { encolado: false, rason: 'template_inactivo_o_no_existe' };
    }

    // 3. Obtain case and gestor info (Recipients)
    const { data: caso } = await supabase
        .from('casos')
        .select(`
            id, 
            gestor_id, 
            gestor:gestores(nombre, email)
        `)
        .eq('id', casoId)
        .single();

    if (!caso || !caso.gestor) {
        console.warn(`[MailQueue] No hay gestor asignado al caso ${casoId}. Cancelando encolado.`);
        return { encolado: false, rason: 'sin_gestor' };
    }

    const gestor = caso.gestor as any;

    if (!gestor.email) {
        console.warn(`[MailQueue] El gestor ${gestor.nombre} no tiene email configurado.`);
        return { encolado: false, rason: 'gestor_sin_email' };
    }

    // 4. Cancel any previous pending identical (or older) mail for this case.
    // Because if the user rapidly switches states back and forth, 
    // we only want to process the latest one.
    await supabase
        .from('mail_queue')
        .update({ cancelado: true })
        .eq('caso_id', casoId)
        .eq('enviado', false)
        .eq('cancelado', false);

    // 5. Render the HTML using the Template Parser
    const render = await renderTemplate(casoId, codigoTemplate);
    if (!render) {
        return { encolado: false, rason: 'error_renderizado' };
    }

    // 6. Enqueue! 
    // We add 3 minutes to now()
    const now = new Date();
    // Default 3 mins. We can read from a config table later, but prompt specified "hardcode/default 3" for now.
    now.setMinutes(now.getMinutes() + 3);

    const { error: insertError } = await supabase
        .from('mail_queue')
        .insert({
            caso_id: casoId,
            estado_origen: estadoAnterior || 'none',
            estado_destino: estadoNuevo,
            destinatario_email: gestor.email,
            destinatario_nombre: gestor.nombre,
            asunto: render.asunto,
            cuerpo_html: render.cuerpo_html,
            enviar_despues_de: now.toISOString()
        });

    if (insertError) {
        console.error("[MailQueue] Error al insertar en cola:", insertError);
        return { encolado: false, rason: 'db_error' };
    }

    return { encolado: true };
}

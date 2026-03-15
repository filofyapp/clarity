import { createClient } from "@/lib/supabase/server";

export async function renderTemplate(casoId: string, templateCodigo: string): Promise<{ asunto: string, cuerpo_html: string } | null> {
    const supabase = await createClient();

    // 1. Get the template and wrapper
    const [templateReq, wrapperReq] = await Promise.all([
        supabase.from('mail_templates').select('*').eq('codigo', templateCodigo).single(),
        supabase.from('mail_templates').select('cuerpo').eq('codigo', 'wrapper_html').single()
    ]);

    if (templateReq.error || !templateReq.data) {
        console.error(`Error fetching template ${templateCodigo}:`, templateReq.error);
        return null;
    }

    if (wrapperReq.error || !wrapperReq.data) {
        console.error(`Error fetching HTML wrapper:`, wrapperReq.error);
        return null;
    }

    const template = templateReq.data;
    const wrapperHTML = wrapperReq.data.cuerpo;

    if (!template.activo) {
        console.log(`Template ${templateCodigo} is inactive. Skipping.`);
        return null; // Don't send if inactive
    }

    // 2. Get case data
    const { data: caso, error: casoError } = await supabase
        .from('casos')
        .select(`
            id,
            numero_siniestro,
            numero_servicio,
            dominio,
            marca,
            modelo,
            nombre_asegurado,
            direccion_inspeccion,
            localidad,
            fecha_inspeccion_programada,
            tipo_inspeccion,
            gestor_id,
            gestor:gestores(nombre),
            perito_calle_id,
            perito_calle:usuarios!casos_perito_calle_id_fkey(nombre, apellido, email),
            taller_id,
            taller:talleres(nombre),
            fecha_inspeccion_real,
            datos_crudos_sancor
        `)
        .eq('id', casoId)
        .single();

    if (casoError || !caso) {
        console.error(`Error fetching case ${casoId} for tempating:`, casoError);
        return null;
    }

    // 3. Get or Create Tracking Token
    let trackingLink = "";
    const { data: existingToken } = await supabase
        .from('seguimiento_tokens')
        .select('token')
        .eq('caso_id', casoId)
        .eq('activo', true)
        .maybeSingle();

    if (existingToken) {
        // Assume app runs on localhost:3000 in dev, or real domain. For now relative or env based
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://panel.aomsiniestros.com";
        trackingLink = `${baseUrl}/seguimiento/${existingToken.token}`;
    } else {
        // Create token
        const { data: newToken, error: tokenError } = await supabase
            .from('seguimiento_tokens')
            .insert({ caso_id: casoId })
            .select('token')
            .single();

        if (newToken) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://panel.aomsiniestros.com";
            trackingLink = `${baseUrl}/seguimiento/${newToken.token}`;
        }
    }

    // 4. Compile variables map
    // Format dates safely
    const formatSafeDate = (d: string | null) => {
        if (!d) return "A confirmar";
        try {
            const dt = new Date(d);
            // check if just YYYY-MM-DD
            if (d.length === 10) return d.split('-').reverse().join('/');
            return dt.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
        } catch (e) { return d; }
    };

    // Si parseamos timestamp
    const formatSafeTime = (d: string | null) => {
        if (!d) return "-";
        try {
            const dt = new Date(d);
            if (d.length === 10) return "-"; // Date only
            return dt.toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit' });
        } catch (e) { return "-"; }
    };

    const vehiculoFullName = [caso.marca, caso.modelo].filter(Boolean).join(" ");
    const today = new Date();

    // Perito de calle info
    const peritoCalle = caso.perito_calle as any;
    const peritoNombre = peritoCalle ? `${peritoCalle.nombre} ${peritoCalle.apellido}` : "";

    let tipoInspeccionLegible = "Inspección";
    switch (caso.tipo_inspeccion) {
        case 'domicilio': tipoInspeccionLegible = "Inspección a Domicilio"; break;
        case 'taller': tipoInspeccionLegible = "Inspección en Taller"; break;
        case 'remota': tipoInspeccionLegible = "Inspección Remota"; break;
        case 'cleas': tipoInspeccionLegible = "Inspección CLEAS"; break;
    }

    const vars: Record<string, string> = {
        siniestro: caso.numero_siniestro || "",
        servicio: caso.numero_servicio || "N/A",
        vehiculo: vehiculoFullName || "Vehículo sin cargar",
        dominio: caso.dominio || "S/D",
        asegurado: caso.nombre_asegurado || "-",
        gestor_nombre: caso.gestor ? (caso.gestor as any).nombre : "Gestor",
        fecha_inspeccion: formatSafeDate(caso.fecha_inspeccion_programada),
        hora_inspeccion: formatSafeTime(caso.fecha_inspeccion_programada),
        direccion_inspeccion: caso.direccion_inspeccion || "A coordinar",
        localidad_inspeccion: caso.localidad || "",
        taller_nombre: caso.taller ? (caso.taller as any).nombre : "",
        tipo_inspeccion: tipoInspeccionLegible,
        fecha_hoy: formatSafeDate(today.toISOString()),
        hora_hoy: formatSafeTime(today.toISOString()),
        link_seguimiento: trackingLink,
        estudio_nombre: "Estudio AOM Siniestros",
        perito_nombre: peritoNombre,
        descripcion: caso.datos_crudos_sancor || "",
        gestor_email: caso.gestor ? (caso.gestor as any).email || "" : "",
    };

    // 5. Replace text in template Asunto and Cuerpo
    let finalAsunto = template.asunto;
    let finalCuerpo = template.cuerpo;

    for (const [key, value] of Object.entries(vars)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        finalAsunto = finalAsunto.replace(regex, value);
        finalCuerpo = finalCuerpo.replace(regex, value);
    }

    // Convert newlines to <br> for HTML rendering of text body
    finalCuerpo = finalCuerpo.replace(/\n/g, '<br>');

    // 6. Inject into wrapper
    let finalHtml = wrapperHTML;

    // The wrapper requires {{estado_titulo}}, {{siniestro}}, {{cuerpo_mail}}, and {{boton_seguimiento}}
    finalHtml = finalHtml.replace(/{{estado_titulo}}/g, template.nombre);
    finalHtml = finalHtml.replace(/{{siniestro}}/g, caso.numero_siniestro || "");
    finalHtml = finalHtml.replace(/{{cuerpo_mail}}/g, finalCuerpo);

    // Build button if tracking link exists
    const btnHtml = trackingLink
        ? `<a href="${trackingLink}" style="display:inline-block;padding:14px 28px;background-color:#D6006E;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:600;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,Helvetica,Arial,sans-serif;">🔵 Ver estado del caso &rarr;</a>`
        : '';
    finalHtml = finalHtml.replace(/{{boton_seguimiento}}/g, btnHtml);

    return { asunto: finalAsunto, cuerpo_html: finalHtml };
}

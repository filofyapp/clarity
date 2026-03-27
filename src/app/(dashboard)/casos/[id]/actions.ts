"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { encolarNotificacion } from "@/lib/email/queue";

/**
 * Botón "Inspección realizada" — Perito de calle marca que fue al lugar.
 * Pasa directo a pendiente_carga (sin validar fotos ni informe).
 * DOC_TECNICA §4: No hay estado intermedio "inspeccionada".
 */
export async function marcarInspeccionRealizada(casoId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado." };

    // Verificar que el caso está en ip_coordinada y el usuario es el perito asignado o admin
    const { data: caso } = await supabase
        .from("casos")
        .select("estado, perito_calle_id, fecha_carga_sistema, compania_id, tipo_inspeccion, monto_pagado_perito_calle")
        .eq("id", casoId)
        .single();

    if (!caso) return { error: "Caso no encontrado." };
    if (caso.estado !== "ip_coordinada") return { error: "El caso no está en estado IP Coordinada." };

    const { data: usuario } = await supabase.from("usuarios").select("rol").eq("id", user.id).single();
    if (!usuario) return { error: "Usuario no encontrado." };
    if (usuario.rol !== "admin" && caso.perito_calle_id !== user.id) {
        return { error: "Solo el perito de calle asignado puede marcar la inspección." };
    }

    // ═══ HONORARIO P.CALLE: se asigna al COMPLETAR la inspección ═══
    const updateData: any = {
        estado: "pendiente_carga",
        fecha_inspeccion_real: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const yaTieneMontoCalle = caso.monto_pagado_perito_calle != null;
    if (!yaTieneMontoCalle && caso.tipo_inspeccion && caso.tipo_inspeccion !== 'sin_honorarios') {
        const { data: precio } = await supabase.from('precios')
            .select('valor_perito_calle')
            .eq('compania_id', caso.compania_id)
            .eq('concepto', caso.tipo_inspeccion)
            .eq('tipo', 'honorario')
            .maybeSingle();
        if (precio) {
            updateData.monto_pagado_perito_calle = precio.valor_perito_calle;
        }
    }

    const { error: updateError } = await supabase
        .from("casos")
        .update(updateData)
        .eq("id", casoId);

    if (updateError) return { error: updateError.message };

    // Registrar en historial
    await supabase.from("historial_estados").insert({
        caso_id: casoId,
        usuario_id: user.id,
        estado_anterior: "ip_coordinada",
        estado_nuevo: "pendiente_carga",
        motivo: "Inspección realizada por perito de calle",
    });

    // Validar encolamiento de notificación para gestores
    await encolarNotificacion(casoId, "ip_coordinada", "pendiente_carga").catch(err => {
        console.error("Error al intentar encolar notificación en marcarInspeccionRealizada:", err);
    });

    revalidatePath("/mi-agenda");
    revalidatePath(`/casos/${casoId}`);
    revalidatePath("/carga");
    revalidatePath("/dashboard");
    return { success: true };
}

/**
 * Marcar inspección como AUSENTE — Perito de calle confirma que el asegurado no se presentó.
 * Sube la foto de ausencia, cambia tipo_inspeccion a "ausente" y estado directo a "ip_cerrada".
 * No pasa por pendiente_carga (no hay nada que cargar).
 */
export async function marcarInspeccionAusente(casoId: string, formData: FormData) {
    try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado." };

    const { data: caso } = await supabase
        .from("casos")
        .select("estado, perito_calle_id, compania_id")
        .eq("id", casoId)
        .single();

    if (!caso) return { error: "Caso no encontrado." };
    if (caso.estado !== "ip_coordinada") return { error: "El caso no está en estado IP Coordinada." };

    const { data: usuario } = await supabase.from("usuarios").select("rol").eq("id", user.id).single();
    if (!usuario) return { error: "Usuario no encontrado." };
    if (usuario.rol !== "admin" && caso.perito_calle_id !== user.id) {
        return { error: "Solo el perito de calle asignado puede marcar ausente." };
    }

    // Upload photo
    const fotoFile = formData.get("foto") as File | null;
    if (!fotoFile) return { error: "Debés subir la foto de ausencia." };

    const ext = fotoFile.name.split(".").pop() || "jpg";
    const filePath = `${casoId}/ausente_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from("fotos-inspecciones")
        .upload(filePath, fotoFile, { contentType: fotoFile.type, upsert: false });

    if (uploadError) return { error: `Error subiendo foto: ${uploadError.message}` };

    const { data: urlData } = supabase.storage.from("fotos-inspecciones").getPublicUrl(filePath);

    // Insert photo record
    const { error: fotoInsertError } = await supabase.from("fotos_inspeccion").insert({
        caso_id: casoId,
        usuario_id: user.id,
        url: urlData.publicUrl,
        tipo: "otro",
        descripcion: "Foto de ausencia",
        orden: 0,
    });

    if (fotoInsertError) return { error: `Error registrando foto: ${fotoInsertError.message}` };

    // ═══ AUSENTE cierra DIRECTO → asignar estudio + calle + carga de una ═══
    const updateData: any = {
        estado: "ip_cerrada",
        tipo_inspeccion: "ausente",
        fecha_inspeccion_real: new Date().toISOString(),
        fecha_cierre: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    if (caso.compania_id) {
        const { data: precioAusente } = await supabase.from('precios')
            .select('valor_estudio, valor_perito_calle, valor_perito_carga')
            .eq('compania_id', caso.compania_id)
            .eq('concepto', 'ausente')
            .eq('tipo', 'honorario')
            .maybeSingle();

        if (precioAusente) {
            updateData.monto_facturado_estudio = precioAusente.valor_estudio;
            updateData.monto_pagado_perito_calle = precioAusente.valor_perito_calle;
            updateData.monto_pagado_perito_carga = precioAusente.valor_perito_carga;
        }
    }

    const { error: updateError } = await supabase
        .from("casos")
        .update(updateData)
        .eq("id", casoId);

    if (updateError) return { error: updateError.message };

    // Historial
    await supabase.from("historial_estados").insert({
        caso_id: casoId,
        usuario_id: user.id,
        estado_anterior: "ip_coordinada",
        estado_nuevo: "ip_cerrada",
        motivo: "Inspección marcada como AUSENTE por perito de calle",
    });

    revalidatePath("/mi-agenda");
    revalidatePath(`/casos/${casoId}`);
    revalidatePath("/carga");
    revalidatePath("/dashboard");
    return { success: true };
    } catch (err: any) {
        console.error("marcarInspeccionAusente error:", err);
        return { error: `Error interno: ${err?.message || "Error desconocido. Intentá de nuevo."}` };
    }
}

/**
 * Cambio de estado manual — Usado por admin y peritos según permisos.
 * DOC_TECNICA §5: Cada rol tiene estados permitidos.
 */
export async function cambiarEstadoCaso(casoId: string, nuevoEstado: string, motivo?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado." };

    const { data: usuario } = await supabase.from("usuarios").select("rol, roles").eq("id", user.id).single();
    if (!usuario) return { error: "Usuario no encontrado." };

    // Obtener estado actual
    const { data: caso } = await supabase.from("casos").select("estado, fecha_carga_sistema, fecha_cierre").eq("id", casoId).single();
    if (!caso) return { error: "Caso no encontrado." };

    // Validar permisos por rol
    const estadosAdmin = [
        "ip_coordinada", "pendiente_coordinacion", "contactado", "en_consulta_cia",
        "pendiente_carga", "pendiente_presupuesto", "licitando_repuestos",
        "ip_reclamada_perito", "esperando_respuesta_tercero", "inspeccion_anulada",
        "ip_cerrada", "facturada"
    ];

    const estadosCarga = [
        "licitando_repuestos", "ip_cerrada", "ip_reclamada_perito",
        "esperando_respuesta_tercero", "pendiente_presupuesto"
    ];

    const estadosCalle = ["contactado"]; // Muy limitado

    let permitido = false;
    const roles = usuario.roles || [usuario.rol];
    const esCalle = roles.includes("calle");
    const esCarga = roles.includes("carga");
    const esAdmin = roles.includes("admin");

    if (esAdmin) permitido = true;
    else if (esCarga) permitido = true;  // Carga puede modificar como quiera
    else if (esCalle) permitido = estadosCalle.includes(nuevoEstado);

    if (!permitido) return { error: `No tiene permiso para cambiar al estado '${nuevoEstado}'.` };

    const updateData: any = { estado: nuevoEstado, updated_at: new Date().toISOString() };
    
    // Auto-dates according to state
    // fecha_carga_sistema = cuándo el perito de carga procesó el caso (SALIDA de pendiente_carga)
    if (!caso.fecha_carga_sistema && caso.estado === "pendiente_carga" && nuevoEstado !== "pendiente_carga") {
        updateData.fecha_carga_sistema = new Date().toISOString();
    }
    if (!caso.fecha_cierre && (nuevoEstado === "ip_cerrada" || nuevoEstado === "inspeccion_anulada")) {
        updateData.fecha_cierre = new Date().toISOString();
    }

    // ═══ HONORARIO P.CALLE: se asigna al SALIR de ip_coordinada (inspección completada) ═══
    if (caso.estado === "ip_coordinada" && ["pendiente_carga", "pendiente_presupuesto"].includes(nuevoEstado)) {
        const { data: casoCalleCheck } = await supabase.from('casos')
            .select('compania_id, tipo_inspeccion, monto_pagado_perito_calle')
            .eq('id', casoId).single();

        const yaTieneMontoCalle = casoCalleCheck?.monto_pagado_perito_calle != null;

        if (casoCalleCheck && !yaTieneMontoCalle && casoCalleCheck.tipo_inspeccion && casoCalleCheck.tipo_inspeccion !== 'sin_honorarios') {
            const { data: precioCalle } = await supabase.from('precios')
                .select('valor_perito_calle')
                .eq('compania_id', casoCalleCheck.compania_id)
                .eq('concepto', casoCalleCheck.tipo_inspeccion)
                .eq('tipo', 'honorario')
                .maybeSingle();

            if (precioCalle) {
                updateData.monto_pagado_perito_calle = precioCalle.valor_perito_calle;
            }
        }

        // Also set fecha_inspeccion_real if not already set
        if (!updateData.fecha_inspeccion_real) {
            const { data: casoFIR } = await supabase.from('casos')
                .select('fecha_inspeccion_real').eq('id', casoId).single();
            if (casoFIR && !casoFIR.fecha_inspeccion_real) {
                updateData.fecha_inspeccion_real = new Date().toISOString();
            }
        }
    }

    // ═══ HONORARIO P.CARGA + ESTUDIO: se asigna al llegar a ip_cerrada ═══
    if (nuevoEstado === "ip_cerrada") {
        const { data: casoReal } = await supabase.from('casos')
            .select('compania_id, tipo_inspeccion, monto_facturado_estudio, monto_pagado_perito_calle, monto_pagado_perito_carga')
            .eq('id', casoId).single();

        if (casoReal && casoReal.tipo_inspeccion && casoReal.tipo_inspeccion !== 'sin_honorarios') {
            const { data: precio } = await supabase.from('precios')
                .select('valor_estudio, valor_perito_calle, valor_perito_carga')
                .eq('compania_id', casoReal.compania_id)
                .eq('concepto', casoReal.tipo_inspeccion)
                .eq('tipo', 'honorario')
                .maybeSingle();

            if (precio) {
                // Estudio: solo si no fue asignado antes
                if (casoReal.monto_facturado_estudio == null) {
                    updateData.monto_facturado_estudio = precio.valor_estudio;
                }
                // P.Calle: solo si no fue asignado antes (debió asignarse al completar IP)
                if (casoReal.monto_pagado_perito_calle == null) {
                    updateData.monto_pagado_perito_calle = precio.valor_perito_calle;
                }
                // P.Carga: solo si no fue asignado antes
                if (casoReal.monto_pagado_perito_carga == null) {
                    updateData.monto_pagado_perito_carga = precio.valor_perito_carga;
                }
            }
        }
    }

    // ═══ ANULADA: nadie cobra ═══
    if (nuevoEstado === "inspeccion_anulada") {
        updateData.monto_pagado_perito_calle = 0;
        updateData.monto_pagado_perito_carga = 0;
        updateData.monto_facturado_estudio = 0;
    }

    if (nuevoEstado === "facturada") updateData.facturado = true;

    const { error: updateError } = await supabase.from("casos").update(updateData).eq("id", casoId);
    if (updateError) return { error: updateError.message };

    // Historial
    await supabase.from("historial_estados").insert({
        caso_id: casoId,
        usuario_id: user.id,
        estado_anterior: caso.estado,
        estado_nuevo: nuevoEstado,
        motivo: motivo || `Cambio manual de estado`,
    });

    // Validar encolamiento de notificación para gestores
    // Usamos await (opcional) o fire-and-forget, pero await asegura consistencia
    await encolarNotificacion(casoId, caso.estado, nuevoEstado).catch(err => {
        console.error("Error al intentar encolar notificación en cambiarEstadoCaso:", err);
    });

    revalidatePath(`/casos/${casoId}`);
    revalidatePath("/casos");
    revalidatePath("/dashboard");
    revalidatePath("/carga");
    return { success: true };
}

/**
 * Actualiza los datos de coordinación de un caso (ubicación, fecha y hora).
 */
export async function actualizarDatosCoordinacion(
    casoId: string,
    datos: { direccion_inspeccion: string, localidad: string, fecha_inspeccion_programada: string | null }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado." };

    const { data: usuario } = await supabase.from("usuarios").select("rol, roles").eq("id", user.id).single();
    if (!usuario) return { error: "Usuario no encontrado." };

    const roles = usuario.roles || [usuario.rol];
    // Verificar permisos: admin y carga pueden editar 
    if (!roles.includes("admin") && !roles.includes("carga")) {
        return { error: "No tiene permisos para modificar la coordinación." };
    }

    // Actualizar datos
    const { error: updateError } = await supabase
        .from("casos")
        .update({
            direccion_inspeccion: datos.direccion_inspeccion,
            localidad: datos.localidad,
            fecha_inspeccion_programada: datos.fecha_inspeccion_programada,
            updated_at: new Date().toISOString()
        })
        .eq("id", casoId);

    if (updateError) return { error: updateError.message };

    // Registrar en el historial
    await supabase.from("historial_estados").insert({
        caso_id: casoId,
        usuario_id: user.id,
        estado_anterior: "Mismo Estado",
        estado_nuevo: "Mismo Estado",
        motivo: "Se actualizaron la fecha/hora y lugar de inspección pactados con el asegurado.",
    });

    revalidatePath(`/casos/${casoId}`);
    revalidatePath("/casos");
    revalidatePath("/dashboard");
    return { success: true };
}

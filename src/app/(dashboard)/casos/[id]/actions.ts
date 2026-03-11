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
        .select("estado, perito_calle_id")
        .eq("id", casoId)
        .single();

    if (!caso) return { error: "Caso no encontrado." };
    if (caso.estado !== "ip_coordinada") return { error: "El caso no está en estado IP Coordinada." };

    const { data: usuario } = await supabase.from("usuarios").select("rol").eq("id", user.id).single();
    if (!usuario) return { error: "Usuario no encontrado." };
    if (usuario.rol !== "admin" && caso.perito_calle_id !== user.id) {
        return { error: "Solo el perito de calle asignado puede marcar la inspección." };
    }

    // Transicionar directamente a pendiente_carga
    const { error: updateError } = await supabase
        .from("casos")
        .update({
            estado: "pendiente_carga",
            fecha_inspeccion_real: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
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
    const { data: caso } = await supabase.from("casos").select("estado").eq("id", casoId).single();
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
    else if (esCarga) permitido = estadosCarga.includes(nuevoEstado);
    else if (esCalle) permitido = estadosCalle.includes(nuevoEstado);

    if (!permitido) return { error: `No tiene permiso para cambiar al estado '${nuevoEstado}'.` };

    // Actualizar
    const updateData: any = { estado: nuevoEstado, updated_at: new Date().toISOString() };
    if (nuevoEstado === "ip_cerrada") {
        updateData.fecha_cierre = new Date().toISOString();

        // ANTI-DUPLICACIÓN: Solo asignar montos de facturación si es la PRIMERA vez que se cierra.
        // Si ya tiene monto_facturado_estudio > 0, significa que ya fue cerrado antes y se reabrió.
        // En ese caso NO se re-asignan los montos para evitar doble conteo.
        const { data: casoReal } = await supabase.from('casos')
            .select('compania_id, tipo_inspeccion, monto_facturado_estudio')
            .eq('id', casoId).single();

        const yaCerradoAntes = casoReal?.monto_facturado_estudio && Number(casoReal.monto_facturado_estudio) > 0;

        if (casoReal && !yaCerradoAntes) {
            const { data: precio } = await supabase.from('precios')
                .select('valor_estudio, valor_perito_calle, valor_perito_carga')
                .eq('compania_id', casoReal.compania_id)
                .eq('concepto', casoReal.tipo_inspeccion)
                .maybeSingle();

            if (precio) {
                updateData.monto_facturado_estudio = precio.valor_estudio;
                updateData.monto_pagado_perito_calle = precio.valor_perito_calle;
                updateData.monto_pagado_perito_carga = precio.valor_perito_carga;
            }
        }
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

    const { data: usuario } = await supabase.from("usuarios").select("rol").eq("id", user.id).single();
    if (!usuario) return { error: "Usuario no encontrado." };

    // Verificar permisos: admin y carga pueden editar 
    if (usuario.rol !== "admin" && usuario.rol !== "carga") {
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

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface InspeccionCampoData {
    casoId: string;
    peritoId: string;
    manoDeObra: { concepto: string; valor: number; cantidad: number; unidad: string }[];
    totalManoDeObra: number;
    piezasCambiar: string;
    piezasReparar: string;
    piezasPintar: string;
    observaciones: string;
    audioUrl: string | null;
    resumenFirmadoUrl: string | null;
    firmaUrl: string | null;
    firmaTimestamp: string | null;
    firmaLatitud: number | null;
    firmaLongitud: number | null;
}

export async function guardarInspeccionCampo(data: InspeccionCampoData) {
    const supabase = await createClient();

    try {
        // 1. Insert informe_inspeccion_campo
        const { error: insertError } = await supabase
            .from("informe_inspeccion_campo")
            .insert({
                caso_id: data.casoId,
                perito_id: data.peritoId,
                mano_de_obra: data.manoDeObra,
                total_mano_de_obra: data.totalManoDeObra,
                piezas_cambiar: data.piezasCambiar || null,
                piezas_reparar: data.piezasReparar || null,
                piezas_pintar: data.piezasPintar || null,
                observaciones: data.observaciones || null,
                audio_url: data.audioUrl,
                resumen_firmado_url: data.resumenFirmadoUrl,
                firma_url: data.firmaUrl,
                firma_timestamp: data.firmaTimestamp,
                firma_latitud: data.firmaLatitud,
                firma_longitud: data.firmaLongitud,
            });

        if (insertError) {
            console.error("[InspeccionCampo] Insert error:", insertError);
            return { error: "Error al guardar el informe: " + insertError.message };
        }

        // 2. Update caso estado to pendiente_carga + set fecha_inspeccion_real
        const { error: updateError } = await supabase
            .from("casos")
            .update({
                estado: "pendiente_carga",
                fecha_inspeccion_real: data.firmaTimestamp || new Date().toISOString(),
            })
            .eq("id", data.casoId);

        if (updateError) {
            console.error("[InspeccionCampo] Update caso error:", updateError);
            return { error: "Error al actualizar estado: " + updateError.message };
        }

        // 2b. ═══ HONORARIO P.CALLE: se asigna al COMPLETAR la inspección ═══
        const { data: casoData } = await supabase
            .from("casos")
            .select("compania_id, tipo_inspeccion, monto_pagado_perito_calle")
            .eq("id", data.casoId)
            .single();

        if (casoData && casoData.monto_pagado_perito_calle == null
            && casoData.tipo_inspeccion && casoData.tipo_inspeccion !== 'sin_honorarios') {
            const { data: precio } = await supabase.from('precios')
                .select('valor_perito_calle')
                .eq('compania_id', casoData.compania_id)
                .eq('concepto', casoData.tipo_inspeccion)
                .eq('tipo', 'honorario')
                .maybeSingle();

            if (precio) {
                await supabase.from("casos")
                    .update({ monto_pagado_perito_calle: precio.valor_perito_calle })
                    .eq("id", data.casoId);
            }
        }

        // 3. Historial de estados
        await supabase.from("historial_estados").insert({
            caso_id: data.casoId,
            estado_anterior: "ip_coordinada",
            estado_nuevo: "pendiente_carga",
            motivo: "📋 Inspección presencial completada y firmada por taller",
        });

        revalidatePath(`/casos/${data.casoId}`);
        revalidatePath("/mi-agenda");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (err: any) {
        console.error("[InspeccionCampo] Catch error:", err);
        return { error: "Error interno: " + err.message };
    }
}

/**
 * PASO 4: Edición post-envío del informe presencial.
 * STRICT PATCH — Solo actualiza campos de texto/MO.
 * NUNCA toca firma, GPS, resumen_firmado, fotos, ni cambia el estado del caso.
 * Guardrail 3: Prevención de Data Wiping.
 * Guardrail 4: Validación server-side de permisos.
 * Guardrail 5: Purga de caché obligatoria.
 */
interface ActualizarInspeccionCampoData {
    casoId: string;
    manoDeObra: { concepto: string; valor: number; cantidad: number; unidad: string }[];
    totalManoDeObra: number;
    piezasCambiar: string;
    piezasReparar: string;
    piezasPintar: string;
    observaciones: string;
    audioUrl: string | null;
}

export async function actualizarInspeccionCampo(data: ActualizarInspeccionCampoData) {
    const supabase = await createClient();

    try {
        // ═══ GUARDRAIL 4: Server-side auth validation ═══
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: "No autorizado." };

        const { data: usuario } = await supabase.from("usuarios").select("rol, roles").eq("id", user.id).single();
        if (!usuario) return { error: "Usuario no encontrado." };

        const { data: caso } = await supabase
            .from("casos")
            .select("perito_calle_id")
            .eq("id", data.casoId)
            .single();

        if (!caso) return { error: "Caso no encontrado." };

        const roles = usuario.roles || [usuario.rol];
        const esAdmin = roles.includes("admin");
        const esPeritoAsignado = caso.perito_calle_id === user.id;

        if (!esAdmin && !esPeritoAsignado) {
            return { error: "Solo el perito de calle asignado o un admin puede editar el informe." };
        }

        // ═══ GUARDRAIL 3: STRICT PATCH — only text/MO fields, NEVER firma/GPS/photos ═══
        const { error: updateError } = await supabase
            .from("informe_inspeccion_campo")
            .update({
                mano_de_obra: data.manoDeObra,
                total_mano_de_obra: data.totalManoDeObra,
                piezas_cambiar: data.piezasCambiar || null,
                piezas_reparar: data.piezasReparar || null,
                piezas_pintar: data.piezasPintar || null,
                observaciones: data.observaciones || null,
                audio_url: data.audioUrl,
                editado_el: new Date().toISOString(),
            })
            .eq("caso_id", data.casoId);

        if (updateError) {
            console.error("[InspeccionCampo] Update informe error:", updateError);
            return { error: "Error al actualizar el informe: " + updateError.message };
        }

        // Historial — traceability
        await supabase.from("historial_estados").insert({
            caso_id: data.casoId,
            usuario_id: user.id,
            estado_anterior: "Mismo Estado",
            estado_nuevo: "Mismo Estado",
            motivo: "✏️ Informe de inspección presencial editado post-envío",
        });

        // ═══ GUARDRAIL 5: Cache purge ═══
        revalidatePath(`/casos/${data.casoId}`);
        revalidatePath("/mi-agenda");
        revalidatePath("/casos");
        revalidatePath("/dashboard");
        revalidatePath("/carga");

        return { success: true };
    } catch (err: any) {
        console.error("[InspeccionCampo] ActualizarInforme error:", err);
        return { error: "Error interno: " + err.message };
    }
}

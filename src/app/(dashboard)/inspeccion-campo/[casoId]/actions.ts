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

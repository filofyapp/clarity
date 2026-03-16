"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Retorna exclusivamente los casos asignados al perito logueado (RLS enforced)
 * que se encuentran en estado "ip_coordinada" listos para ser visitados.
 */
export async function getMiAgenda() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: "Usuario no autenticado" };
    }

    // Fetch today and tomorrow for grouping
    const now = new Date();
    const hoy = now.toISOString().slice(0, 10);
    const manana = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);

    const { data, error } = await supabase
        .from("casos")
        .select(`
            id,
            numero_siniestro,
            dominio,
            marca,
            modelo,
            tipo_inspeccion,
            direccion_inspeccion,
            localidad,
            telefono_asegurado,
            nombre_asegurado,
            fecha_inspeccion_programada,
            estado,
            link_enviado
        `)
        .eq("perito_calle_id", user.id)
        .eq("estado", "ip_coordinada")
        .order("fecha_inspeccion_programada", { ascending: true });

    return { data, error, hoy, manana };
}

export async function toggleLinkEnviado(casoId: string, enviado: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { error } = await supabase
        .from("casos")
        .update({ link_enviado: enviado })
        .eq("id", casoId)
        .eq("perito_calle_id", user.id); // Seguridad: solo el perito asignado puede cambiarlo

    if (error) return { error: error.message };

    revalidatePath("/mi-agenda");
    return { success: true };
}

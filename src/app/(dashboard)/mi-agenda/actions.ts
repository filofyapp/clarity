"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Retorna exclusivamente los casos asignados al perito logueado (RLS enforced)
 * que se encuentran en estado "ip_coordinada" listos para ser visitados.
 */
export async function getMiAgenda() {
    const supabase = await createClient();

    // El RLS de la tabla 'casos' debería filtrar automáticamente si el rol es 'calle'
    // De todas formas forzamos la busqueda por seguridad operativa para la vista.
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: "Usuario no autenticado" };
    }

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

    return { data, error };
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

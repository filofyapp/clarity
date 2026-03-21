"use server";

import { createClient } from "@/lib/supabase/server";

export async function getCasosParaCarga() {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
        return { error: "No autorizado" };
    }

    const { data: usuario } = await supabase
        .from('usuarios')
        .select('rol, roles')
        .eq('id', userData.user.id)
        .single();

    const roles = usuario?.roles || [usuario?.rol];
    if (!usuario || (!roles.includes('admin') && !roles.includes('carga'))) {
        return { error: "Acceso denegado: Se requiere rol de Carga o Administrador." };
    }

    // Traemos de DB cruzando usuario en sesion (filtro por RLS perito_carga_id).
    const { data, error } = await supabase
        .from("casos")
        .select(`
            id,
            numero_siniestro,
            numero_servicio,
            tipo_inspeccion,
            estado,
            dominio,
            marca,
            modelo,
            nombre_asegurado,
            fecha_derivacion,
            fecha_inspeccion_programada,
            fecha_carga_sistema,
            fecha_inspeccion_real,
            fecha_cierre,
            updated_at,
            created_at,
            gmail_migracion_thread_id,
            compania:companias!casos_compania_id_fkey(nombre),
            perito_calle:usuarios!casos_perito_calle_id_fkey(nombre, apellido),
            perito_carga:usuarios!casos_perito_carga_id_fkey(nombre, apellido),
            gestor:gestores(id, nombre, email),
            informe_pericial:informes_periciales(id, completo, updated_at)
        `)
        .eq("estado", "pendiente_carga")
        .order("fecha_carga_sistema", { ascending: true, nullsFirst: false });

    if (error) {
        console.error("Error fetching casos para carga:", error);
        return { error: error.message };
    }

    return { data };
}

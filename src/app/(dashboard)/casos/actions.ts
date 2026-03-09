"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface CasoInput {
    numero_siniestro: string;
    numero_servicio?: string;
    tipo_inspeccion: string;
    gestor_id?: string;
    taller_id?: string;
    perito_calle_id?: string;
    perito_carga_id?: string;
    dominio?: string;
    marca?: string;
    modelo?: string;
    anio?: number;
    direccion_inspeccion?: string;
    localidad?: string;
    fecha_inspeccion?: string; // YYYY-MM-DD o null
    datos_crudos_sancor?: string;
    link_orion?: string;
    caso_origen_id?: string; // Para ampliaciones / re-inspecciones
}

export async function crearCaso(input: CasoInput) {
    const supabase = await createClient();

    // 1. Verificar auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado." };

    // 2. Verificar rol (solo admin puede crear casos)
    const { data: usuario } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();

    if (!usuario || usuario.rol !== "admin") {
        return { error: "Solo el coordinador puede crear casos." };
    }

    // 3. Obtener compañía Sancor (siempre es la misma)
    const { data: sancor } = await supabase
        .from("companias")
        .select("id")
        .eq("codigo", "SANCOR")
        .single();

    if (!sancor) return { error: "No se encontró la compañía Sancor en la base de datos." };

    // 4. Determinar estado automáticamente
    //    - Con fecha de IP → ip_coordinada
    //    - Sin fecha → pendiente_coordinacion
    const estado = input.fecha_inspeccion ? "ip_coordinada" : "pendiente_coordinacion";

    // 5. Insertar caso
    const { data: caso, error } = await supabase.from("casos").insert({
        compania_id: sancor.id,
        numero_siniestro: input.numero_siniestro.trim(),
        numero_servicio: input.numero_servicio?.trim() || null,
        tipo: "asegurado", // default, se puede cambiar después
        tipo_inspeccion: input.tipo_inspeccion,
        gestor_id: input.gestor_id || null,
        taller_id: input.taller_id || null,
        perito_calle_id: input.perito_calle_id || null,
        perito_carga_id: input.perito_carga_id || null,
        dominio: input.dominio?.trim().toUpperCase() || null,
        marca: input.marca?.trim() || null,
        modelo: input.modelo?.trim() || null,
        anio: input.anio || null,
        direccion_inspeccion: input.direccion_inspeccion?.trim() || null,
        localidad: input.localidad?.trim() || null,
        fecha_derivacion: new Date().toISOString().split("T")[0], // Hoy
        fecha_inspeccion_programada: input.fecha_inspeccion || null,
        estado,
        prioridad: "normal",
        datos_crudos_sancor: input.datos_crudos_sancor?.trim() || null,
        link_orion: input.link_orion?.trim() || null,
        caso_origen_id: input.caso_origen_id || null,
    }).select("id").single();

    if (error) return { error: error.message };

    // 6. Registrar en historial
    const motivo = input.caso_origen_id
        ? `Ampliación/Re-inspección del siniestro ${input.numero_siniestro.trim()}`
        : "Caso creado";

    await supabase.from("historial_estados").insert({
        caso_id: caso.id,
        usuario_id: user.id,
        estado_anterior: null,
        estado_nuevo: estado,
        motivo
    });

    revalidatePath("/casos");
    revalidatePath("/dashboard");
    return { success: true, casoId: caso.id };
}

export async function getCasos() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("casos")
        .select(`
            id,
            numero_siniestro,
            numero_servicio,
            tipo_inspeccion,
            dominio,
            marca,
            modelo,
            estado,
            prioridad,
            fecha_derivacion,
            fecha_inspeccion_programada,
            fecha_carga_sistema,
            fecha_cierre,
            nombre_asegurado,
            updated_at,
            notas_admin,
            link_orion,
            gestor_id,
            gestor:gestores(id, nombre, email),
            perito_calle:usuarios!casos_perito_calle_id_fkey(nombre, apellido),
            perito_carga:usuarios!casos_perito_carga_id_fkey(nombre, apellido)
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching casos:", error);
        return [];
    }

    return data;
}

export async function getPeritos() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("usuarios")
        .select("id, nombre, apellido, rol")
        .eq("activo", true)
        .in("rol", ["calle", "carga", "admin"])
        .order("nombre");

    if (error) {
        console.error("Error fetching peritos:", error);
        return [];
    }

    return data;
}

export async function cambiarTipoIPCaso(id: string, nuevoTipo: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado." };

    const { error } = await supabase
        .from("casos")
        .update({ tipo_inspeccion: nuevoTipo })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/casos");
    revalidatePath(`/casos/${id}`);
    return { success: true };
}

export async function getGestores() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("gestores")
        .select("id, nombre, sector")
        .eq("activo", true)
        .order("nombre");

    if (error) {
        console.error("Error fetching gestores:", error);
        return [];
    }

    return data;
}

export async function updateNotasAdmin(id: string, notas_admin: string | null) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado." };

    const { data: usuario } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();

    if (!usuario || (usuario.rol !== "admin" && usuario.rol !== "carga")) {
        return { error: "No tiene permisos para editar observaciones." };
    }

    const { error } = await supabase
        .from("casos")
        .update({ notas_admin })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/casos");
    return { success: true };
}

export async function updateCasoRapido(id: string, campo: string, valor: string | null) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado." };

    const { data: usuario } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();

    if (!usuario || (usuario.rol !== "admin" && usuario.rol !== "carga")) {
        return { error: "No tiene permisos para editar." };
    }

    const { error } = await supabase
        .from("casos")
        .update({ [campo]: valor })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/casos");
    return { success: true };
}

// ==========================================
// ELIMINACION DE CASO
// ==========================================
export async function eliminarCaso(id: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado." };

    const { data: usuario } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();

    // Sólo Admin o Carga puede eliminar casos
    if (usuario?.rol !== "admin" && usuario?.rol !== "carga") {
        return { error: "No tienes permisos para eliminar este siniestro." };
    }

    const { error } = await supabase.from("casos").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/casos");
    return { success: true };
}


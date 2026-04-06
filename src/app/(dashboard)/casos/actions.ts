"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { encolarNotificacion } from "@/lib/email/queue";

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

    // Validar encolamiento de notificación para gestores. 
    // Aunque la regla actual evalúa transiciones (origen->destino), si queremos q `null->ip_coordinada` también envíe algun mail
    // Hay q definirlo. Pero según el plan `contactado->ip_coordinada` es lo que manda. 
    // Por las dudas, lo pasamos y el queue resolverá si aplica.
    await encolarNotificacion(caso.id, null, estado).catch(err => {
        console.error("Error al intentar encolar notificación en crearCaso:", err);
    });

    revalidatePath("/casos");
    revalidatePath("/dashboard");
    return { success: true, casoId: caso.id };
}

export interface CasosFilters {
    estados?: string[];
    tipos_ip?: string[];
    peritos_calle?: string[];
    peritos_carga?: string[];
    gestores?: string[];
    // Independent date range filters — all combine with AND
    ingreso_desde?: string;
    ingreso_hasta?: string;
    ip_desde?: string;
    ip_hasta?: string;
    carga_desde?: string;
    carga_hasta?: string;
    cierre_desde?: string;
    cierre_hasta?: string;
    search?: string;
}

export async function getCasos(filters?: CasosFilters) {
    const supabase = await createClient();

    // Aislamiento: perito calle puro solo ve sus propios casos
    const { data: { user } } = await supabase.auth.getUser();
    let esPeritoCallePuro = false;
    if (user) {
        const { data: u } = await supabase.from("usuarios").select("roles, rol").eq("id", user.id).single();
        const roles = u?.roles || [u?.rol];
        esPeritoCallePuro = roles.includes("calle") && !roles.includes("admin") && !roles.includes("carga");
    }

    let query = supabase
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
            perito_calle_id,
            perito_carga_id,
            gestor:gestores(id, nombre, email),
            perito_calle:usuarios!casos_perito_calle_id_fkey(nombre, apellido),
            perito_carga:usuarios!casos_perito_carga_id_fkey(nombre, apellido)
        `);

    // Inyectar filtro de seguridad para perito calle puro
    if (esPeritoCallePuro && user) {
        query = query.eq("perito_calle_id", user.id);
    }

    // Apply server-side filters
    if (filters) {
        if (filters.estados && filters.estados.length > 0) {
            query = query.in("estado", filters.estados);
        }
        if (filters.tipos_ip && filters.tipos_ip.length > 0) {
            query = query.in("tipo_inspeccion", filters.tipos_ip);
        }
        if (filters.peritos_calle && filters.peritos_calle.length > 0) {
            query = query.in("perito_calle_id", filters.peritos_calle);
        }
        if (filters.peritos_carga && filters.peritos_carga.length > 0) {
            query = query.in("perito_carga_id", filters.peritos_carga);
        }
        if (filters.gestores && filters.gestores.length > 0) {
            query = query.in("gestor_id", filters.gestores);
        }

        // Fecha de Ingreso (fecha_derivacion)
        if (filters.ingreso_desde) query = query.gte("fecha_derivacion", filters.ingreso_desde);
        if (filters.ingreso_hasta) query = query.lte("fecha_derivacion", filters.ingreso_hasta + "T23:59:59");

        // Fecha de IP (fecha_inspeccion_programada)
        if (filters.ip_desde) query = query.gte("fecha_inspeccion_programada", filters.ip_desde);
        if (filters.ip_hasta) query = query.lte("fecha_inspeccion_programada", filters.ip_hasta + "T23:59:59");

        // Fecha de Carga (fecha_carga_sistema) — exclude nulls
        if (filters.carga_desde || filters.carga_hasta) {
            query = query.not("fecha_carga_sistema", "is", null);
            if (filters.carga_desde) query = query.gte("fecha_carga_sistema", filters.carga_desde);
            if (filters.carga_hasta) query = query.lte("fecha_carga_sistema", filters.carga_hasta + "T23:59:59");
        }

        // Fecha de Cierre (fecha_cierre) — exclude nulls
        if (filters.cierre_desde || filters.cierre_hasta) {
            query = query.not("fecha_cierre", "is", null);
            if (filters.cierre_desde) query = query.gte("fecha_cierre", filters.cierre_desde);
            if (filters.cierre_hasta) query = query.lte("fecha_cierre", filters.cierre_hasta + "T23:59:59");
        }
        if (filters.search && filters.search.trim() !== "") {
            const q = filters.search.trim();
            query = query.or(`numero_siniestro.ilike.%${q}%,dominio.ilike.%${q}%,marca.ilike.%${q}%,modelo.ilike.%${q}%,nombre_asegurado.ilike.%${q}%`);
        }
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

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
        .select("id, nombre, apellido, rol, roles")
        .eq("activo", true)
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

    const { data: usuario } = await supabase
        .from("usuarios")
        .select("rol, roles")
        .eq("id", user.id)
        .single();

    const roles = usuario?.roles || [usuario?.rol];
    if (!usuario || (!roles.includes("admin") && !roles.includes("carga"))) {
        return { error: "No autorizado." };
    }

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
        .select("rol, roles")
        .eq("id", user.id)
        .single();

    const roles = usuario?.roles || [usuario?.rol];
    if (!usuario || (!roles.includes("admin") && !roles.includes("carga"))) {
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
        .select("rol, roles")
        .eq("id", user.id)
        .single();

    const roles = usuario?.roles || [usuario?.rol];
    let isAuthorized = false;

    if (usuario && (roles.includes("admin") || roles.includes("carga"))) {
        isAuthorized = true;
    } else if (usuario && roles.includes("calle")) {
        if (campo === "notas_admin" || campo === "datos_crudos_sancor") {
            // Verificar que sea el perito asignado
            const { data: caso } = await supabase.from("casos").select("perito_calle_id").eq("id", id).single();
            if (caso && caso.perito_calle_id === user.id) {
                // El perito asignado puede editar notas internas y crudas en cualquier tipo de caso
                isAuthorized = true;
            }
        }
    }

    if (!isAuthorized) {
        return { error: "No tiene permisos para editar." };
    }

    // Save the field
    const { error } = await supabase
        .from("casos")
        .update({ [campo]: valor, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) return { error: error.message };

    // ═══ POST-UPDATE: Asignar honorarios si se editó un campo relevante ═══
    const BILLING_FIELDS = ["estado", "fecha_cierre", "fecha_inspeccion_real", "fecha_carga_sistema"];
    if (BILLING_FIELDS.includes(campo)) {
        const { data: caso } = await supabase.from("casos")
            .select("estado, compania_id, tipo_inspeccion, monto_facturado_estudio, monto_pagado_perito_calle, monto_pagado_perito_carga, fecha_cierre, fecha_inspeccion_real")
            .eq("id", id).single();

        if (caso && caso.tipo_inspeccion && caso.tipo_inspeccion !== "sin_honorarios") {
            // ═══ ANULADA: nadie cobra ═══
            if (caso.estado === "inspeccion_anulada") {
                await supabase.from("casos").update({
                    monto_pagado_perito_calle: 0,
                    monto_pagado_perito_carga: 0,
                    monto_facturado_estudio: 0,
                }).eq("id", id);
            } else {
                const { data: precio } = await supabase.from("precios")
                    .select("valor_estudio, valor_perito_calle, valor_perito_carga")
                    .eq("compania_id", caso.compania_id)
                    .eq("concepto", caso.tipo_inspeccion)
                    .eq("tipo", "honorario")
                    .maybeSingle();

                if (precio) {
                    const montoUpdate: any = {};

                    // P.CALLE: se asigna si hay fecha_inspeccion_real y no fue asignado (null)
                    if (caso.fecha_inspeccion_real && caso.monto_pagado_perito_calle == null) {
                        montoUpdate.monto_pagado_perito_calle = precio.valor_perito_calle;
                    }

                    // P.CARGA + ESTUDIO: se asigna si está en ip_cerrada/facturada y no fue asignado (null)
                    if (caso.estado === "ip_cerrada" || caso.estado === "facturada") {
                        if (caso.monto_pagado_perito_carga == null) {
                            montoUpdate.monto_pagado_perito_carga = precio.valor_perito_carga;
                        }
                        if (caso.monto_facturado_estudio == null) {
                            montoUpdate.monto_facturado_estudio = precio.valor_estudio;
                        }
                    }

                    if (Object.keys(montoUpdate).length > 0) {
                        await supabase.from("casos").update(montoUpdate).eq("id", id);
                    }
                }
            }
        }
    }

    revalidatePath("/casos");
    revalidatePath(`/casos/${id}`);
    revalidatePath("/dashboard");
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
        .select("rol, roles")
        .eq("id", user.id)
        .single();

    const roles = usuario?.roles || [usuario?.rol];
    // Sólo Admin o Carga puede eliminar casos
    if (!roles.includes("admin") && !roles.includes("carga")) {
        return { error: "No tienes permisos para eliminar este siniestro." };
    }

    const { error } = await supabase.from("casos").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/casos");
    return { success: true };
}


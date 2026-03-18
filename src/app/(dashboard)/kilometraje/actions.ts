"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════
export interface CasoInspeccion {
    caso_id: string;
    numero_siniestro: string;
    direccion: string;
    localidad: string | null;
    tipo_inspeccion: string;
    perito_calle_id: string;
    perito_nombre: string;
    perito_apellido: string;
    fecha_completada: string; // date only YYYY-MM-DD
}

export interface DiaKilometraje {
    fecha: string;
    perito_id: string;
    perito_nombre: string;
    perito_apellido: string;
    perito_direccion_base: string | null;
    casos: CasoInspeccion[];
    // From DB if already calculated
    registro?: RegistroKm | null;
}

export interface RegistroKm {
    id: string;
    perito_id: string;
    fecha: string;
    casos_ids: string[];
    direcciones_ordenadas: any;
    km_total: number;
    duracion_estimada_min: number;
    ruta_polyline: string | null;
    ruta_google_maps_url: string | null;
    precio_km_estudio: number;
    precio_km_perito: number;
    monto_total_estudio: number;
    monto_total_perito: number;
    punto_partida: string | null;
    siniestro_asociado: string | null;
    casos_incluidos: string[];
    casos_excluidos: string[];
    ruta_orden: number[] | null;
    legs: any[] | null;
}

// ═══════════════════════════════════════════
// getDiasKilometraje
// ═══════════════════════════════════════════
export async function getDiasKilometraje(mes: string, peritoId?: string) {
    const supabase = await createClient();

    // 1. Build date range from mes (YYYY-MM)
    const [year, month] = mes.split("-").map(Number);
    const inicioMes = `${mes}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const finMes = `${mes}-${String(lastDay).padStart(2, "0")}`;

    // 2. Find all cases that transitioned to pendiente_carga during this month
    //    via historial_estados. This tells us when the inspection was completed.
    let query = supabase
        .from("historial_estados")
        .select(`
            caso_id,
            created_at,
            casos!inner(
                id,
                numero_siniestro,
                direccion_inspeccion,
                localidad,
                tipo_inspeccion,
                perito_calle_id,
                perito_calle:usuarios!casos_perito_calle_id_fkey(nombre, apellido, direccion_base)
            )
        `)
        .eq("estado_nuevo", "pendiente_carga")
        .gte("created_at", `${inicioMes}T00:00:00`)
        .lte("created_at", `${finMes}T23:59:59`);

    if (peritoId) {
        query = query.eq("casos.perito_calle_id", peritoId);
    }

    const { data: historial, error } = await query;
    if (error) {
        console.error("Error fetching historial:", error);
        return { error: error.message };
    }

    // 3. Build CasoInspeccion list
    const casosMap = new Map<string, CasoInspeccion>();

    for (const h of (historial || [])) {
        const caso = h.casos as any;
        if (!caso || !caso.perito_calle_id || !caso.perito_calle) continue;
        // Use date portion of created_at as fecha_completada
        const fechaCompletada = new Date(h.created_at).toISOString().split("T")[0];
        const key = `${caso.id}_${fechaCompletada}`;
        if (casosMap.has(key)) continue; // avoid duplicates

        casosMap.set(key, {
            caso_id: caso.id,
            numero_siniestro: caso.numero_siniestro,
            direccion: caso.direccion_inspeccion || "",
            localidad: caso.localidad,
            tipo_inspeccion: caso.tipo_inspeccion,
            perito_calle_id: caso.perito_calle_id,
            perito_nombre: caso.perito_calle.nombre,
            perito_apellido: caso.perito_calle.apellido,
            fecha_completada: fechaCompletada,
        });
    }

    const casos = Array.from(casosMap.values());

    // 4. Group by fecha + perito_calle_id
    const diasMap = new Map<string, CasoInspeccion[]>();
    for (const c of casos) {
        const key = `${c.fecha_completada}_${c.perito_calle_id}`;
        if (!diasMap.has(key)) diasMap.set(key, []);
        diasMap.get(key)!.push(c);
    }

    // 5. Fetch existing kilometraje_diario records for the month
    let regQuery = supabase
        .from("kilometraje_diario")
        .select("*")
        .gte("fecha", inicioMes)
        .lte("fecha", finMes);

    if (peritoId) {
        regQuery = regQuery.eq("perito_id", peritoId);
    }

    const { data: registros } = await regQuery;
    const registrosMap = new Map<string, RegistroKm>();
    for (const r of (registros || [])) {
        registrosMap.set(`${r.fecha}_${r.perito_id}`, r as RegistroKm);
    }

    // 6. Fetch perito direccion_base for each unique perito
    const peritoIds = [...new Set(casos.map(c => c.perito_calle_id))];
    const { data: peritos } = await supabase
        .from("usuarios")
        .select("id, nombre, apellido, direccion_base")
        .in("id", peritoIds.length > 0 ? peritoIds : ["00000000-0000-0000-0000-000000000000"]);

    const peritosMap = new Map<string, any>();
    for (const p of (peritos || [])) {
        peritosMap.set(p.id, p);
    }

    // 7. Build DiaKilometraje[]
    const dias: DiaKilometraje[] = [];
    for (const [key, casosList] of diasMap.entries()) {
        const [fecha, peritoCId] = key.split("_");
        const perito = peritosMap.get(peritoCId);

        dias.push({
            fecha,
            perito_id: peritoCId,
            perito_nombre: perito?.nombre || casosList[0].perito_nombre,
            perito_apellido: perito?.apellido || casosList[0].perito_apellido,
            perito_direccion_base: perito?.direccion_base || null,
            casos: casosList.sort((a, b) =>
                a.numero_siniestro.localeCompare(b.numero_siniestro)
            ),
            registro: registrosMap.get(`${fecha}_${peritoCId}`) || null,
        });
    }

    // Sort by date descending
    dias.sort((a, b) => b.fecha.localeCompare(a.fecha));

    return { data: dias };
}

// ═══════════════════════════════════════════
// getPeritos — active calle peritos
// ═══════════════════════════════════════════
export async function getPeritos() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("usuarios")
        .select("id, nombre, apellido, direccion_base")
        .eq("rol", "calle")
        .eq("activo", true)
        .order("nombre");
    return data || [];
}

// ═══════════════════════════════════════════
// getPrecioKm — from precios table
// ═══════════════════════════════════════════
export async function getPrecioKm() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("precios")
        .select("valor_estudio, valor_perito")
        .eq("concepto", "kilometraje")
        .eq("activo", true)
        .single();
    return {
        estudio: data?.valor_estudio || 0,
        perito: data?.valor_perito || 0,
    };
}

// ═══════════════════════════════════════════
// guardarKilometraje — upsert daily record
// ═══════════════════════════════════════════
export async function guardarKilometraje(data: {
    perito_id: string;
    fecha: string;
    casos_ids: string[];
    direcciones_ordenadas: string[];
    km_total: number;
    duracion_estimada_min: number;
    ruta_polyline: string | null;
    ruta_google_maps_url: string | null;
    precio_km_estudio: number;
    precio_km_perito: number;
    punto_partida: string;
    siniestro_asociado: string;
    casos_incluidos: string[];
    casos_excluidos: string[];
    ruta_orden: number[] | null;
    legs: any[] | null;
}) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("kilometraje_diario")
        .upsert({
            perito_id: data.perito_id,
            fecha: data.fecha,
            casos_ids: data.casos_ids,
            direcciones_ordenadas: data.direcciones_ordenadas,
            km_total: data.km_total,
            duracion_estimada_min: data.duracion_estimada_min,
            ruta_polyline: data.ruta_polyline,
            ruta_google_maps_url: data.ruta_google_maps_url,
            precio_km_estudio: data.precio_km_estudio,
            precio_km_perito: data.precio_km_perito,
            monto_total_estudio: data.km_total * data.precio_km_estudio,
            monto_total_perito: data.km_total * data.precio_km_perito,
            punto_partida: data.punto_partida,
            siniestro_asociado: data.siniestro_asociado,
            casos_incluidos: data.casos_incluidos,
            casos_excluidos: data.casos_excluidos,
            ruta_orden: data.ruta_orden,
            legs: data.legs,
        }, { onConflict: "perito_id,fecha" });

    if (error) return { error: error.message };

    revalidatePath("/kilometraje");
    return { success: true };
}

// ═══════════════════════════════════════════
// actualizarInclusiones — save checkbox state
// ═══════════════════════════════════════════
export async function actualizarInclusiones(
    peritoId: string,
    fecha: string,
    casosIncluidos: string[],
    casosExcluidos: string[]
) {
    const supabase = await createClient();

    // Check if record exists
    const { data: existing } = await supabase
        .from("kilometraje_diario")
        .select("id")
        .eq("perito_id", peritoId)
        .eq("fecha", fecha)
        .single();

    if (existing) {
        // Update existing
        const { error } = await supabase
            .from("kilometraje_diario")
            .update({
                casos_incluidos: casosIncluidos,
                casos_excluidos: casosExcluidos,
            })
            .eq("id", existing.id);
        if (error) return { error: error.message };
    } else {
        // Create a minimal record with just inclusions
        const { error } = await supabase
            .from("kilometraje_diario")
            .insert({
                perito_id: peritoId,
                fecha,
                casos_ids: casosIncluidos,
                casos_incluidos: casosIncluidos,
                casos_excluidos: casosExcluidos,
                km_total: 0,
            });
        if (error) return { error: error.message };
    }

    return { success: true };
}

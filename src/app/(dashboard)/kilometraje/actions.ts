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
    perito_calle_id: string | null;
    perito_nombre: string | null;
}

export interface DiaKilometraje {
    fecha: string;
    casos: CasoInspeccion[];
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

// NOTE: PUNTO_PARTIDA_DEFAULT = "9 de Julio 62, Bernal" is defined in KilometrajeBoard.tsx
// because "use server" files can only export async functions.

// ═══════════════════════════════════════════
// getDiasKilometraje
// Query: ALL cases with fecha_inspeccion_programada in the month
// Group: by fecha_inspeccion_programada (one day = one card)
// ═══════════════════════════════════════════
export async function getDiasKilometraje(mes: string) {
    const supabase = await createClient();

    const [year, month] = mes.split("-").map(Number);
    const inicioMes = `${mes}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const finMes = `${mes}-${String(lastDay).padStart(2, "0")}`;

    // Query all cases that have fecha_inspeccion_programada in the selected month
    const { data: casosData, error } = await supabase
        .from("casos")
        .select(`
            id,
            numero_siniestro,
            direccion_inspeccion,
            localidad,
            tipo_inspeccion,
            fecha_inspeccion_programada,
            perito_calle_id,
            perito_calle:usuarios!casos_perito_calle_id_fkey(nombre, apellido)
        `)
        .not("fecha_inspeccion_programada", "is", null)
        .gte("fecha_inspeccion_programada", inicioMes)
        .lte("fecha_inspeccion_programada", finMes)
        .order("fecha_inspeccion_programada", { ascending: true })
        .order("numero_siniestro", { ascending: true });

    if (error) {
        console.error("Error fetching casos:", error);
        return { error: error.message };
    }

    // Group by fecha_inspeccion_programada
    const diasMap = new Map<string, CasoInspeccion[]>();

    for (const c of (casosData || [])) {
        const fecha = c.fecha_inspeccion_programada as string;
        if (!fecha) continue;

        const peritoCalle = c.perito_calle as any;
        const caso: CasoInspeccion = {
            caso_id: c.id,
            numero_siniestro: c.numero_siniestro,
            direccion: c.localidad
                ? `${c.direccion_inspeccion || ""}, ${c.localidad}`
                : (c.direccion_inspeccion || ""),
            localidad: c.localidad,
            tipo_inspeccion: c.tipo_inspeccion,
            perito_calle_id: c.perito_calle_id,
            perito_nombre: peritoCalle
                ? `${peritoCalle.nombre} ${peritoCalle.apellido}`
                : null,
        };

        if (!diasMap.has(fecha)) diasMap.set(fecha, []);
        diasMap.get(fecha)!.push(caso);
    }

    // Fetch existing kilometraje_diario records for the month
    const { data: registros } = await supabase
        .from("kilometraje_diario")
        .select("*")
        .gte("fecha", inicioMes)
        .lte("fecha", finMes);

    // Map by fecha (take the first record for each date)
    const registrosMap = new Map<string, RegistroKm>();
    for (const r of (registros || [])) {
        if (!registrosMap.has(r.fecha)) {
            registrosMap.set(r.fecha, r as RegistroKm);
        }
    }

    // Build DiaKilometraje[]
    const dias: DiaKilometraje[] = [];
    for (const [fecha, casosList] of diasMap.entries()) {
        dias.push({
            fecha,
            casos: casosList,
            registro: registrosMap.get(fecha) || null,
        });
    }

    // Sort by date descending
    dias.sort((a, b) => b.fecha.localeCompare(a.fecha));

    return { data: dias };
}

// ═══════════════════════════════════════════
// getPeritos — active calle peritos (for filter dropdown)
// ═══════════════════════════════════════════
export async function getPeritos() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("usuarios")
        .select("id, nombre, apellido")
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
// Uses the admin's user ID as perito_id (constraint: perito_id+fecha)
// ═══════════════════════════════════════════
export async function guardarKilometraje(data: {
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { error } = await supabase
        .from("kilometraje_diario")
        .upsert({
            perito_id: user.id, // admin's ID for the unique constraint
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
    fecha: string,
    casosIncluidos: string[],
    casosExcluidos: string[]
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { data: existing } = await supabase
        .from("kilometraje_diario")
        .select("id")
        .eq("perito_id", user.id)
        .eq("fecha", fecha)
        .single();

    if (existing) {
        const { error } = await supabase
            .from("kilometraje_diario")
            .update({
                casos_incluidos: casosIncluidos,
                casos_excluidos: casosExcluidos,
            })
            .eq("id", existing.id);
        if (error) return { error: error.message };
    } else {
        const { error } = await supabase
            .from("kilometraje_diario")
            .insert({
                perito_id: user.id,
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

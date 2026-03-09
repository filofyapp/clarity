"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function registrarKilometraje(formData: {
    peritoId: string;
    fecha: string;
    casosIds: string[];
    direcciones: string[];
    puntoPartida: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    // 1. Buscar precios vigentes de KM
    const { data: precioKm } = await supabase
        .from("precios")
        .select("valor_estudio, valor_perito")
        .eq("concepto", "kilometraje")
        .eq("activo", true)
        .single();

    const precioEstudio = precioKm?.valor_estudio || 0;
    const precioPerito = precioKm?.valor_perito || 0;

    // 2. Calcular ruta
    const rutaRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : 'http://localhost:3000'}/api/kilometraje/calcular-ruta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            origin: formData.puntoPartida,
            waypoints: formData.direcciones
        })
    });

    const rutaData = await rutaRes.json();

    // 3. Guardar registro
    const { error } = await supabase
        .from("kilometraje_diario")
        .upsert({
            perito_id: formData.peritoId,
            fecha: formData.fecha,
            casos_ids: formData.casosIds,
            direcciones_ordenadas: formData.direcciones,
            km_total: rutaData.km_total || 0,
            duracion_estimada_min: rutaData.duracion_min || 0,
            ruta_polyline: rutaData.polyline,
            ruta_google_maps_url: rutaData.google_maps_url,
            ruta_waze_url: rutaData.waze_url,
            precio_km_estudio: precioEstudio,
            precio_km_perito: precioPerito,
            monto_total_estudio: (rutaData.km_total || 0) * precioEstudio,
            monto_total_perito: (rutaData.km_total || 0) * precioPerito,
            punto_partida: formData.puntoPartida
        }, { onConflict: "perito_id,fecha" });

    if (error) return { error: error.message };

    revalidatePath("/kilometraje");
    return { success: true, km_total: rutaData.km_total, duracion_min: rutaData.duracion_min };
}

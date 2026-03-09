"use server";

import { createClient } from "@/lib/supabase/server";

export async function getTalleres() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("talleres")
        .select("*")
        .order("nombre", { ascending: true });

    if (error) {
        console.error("Error fetching talleres:", error);
        return [];
    }

    return data;
}

export async function getGestores() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("gestores")
        .select("*, compania:companias(nombre)")
        .order("nombre", { ascending: true });

    if (error) {
        console.error("Error fetching gestores:", error);
        return [];
    }

    return data;
}

export async function getRepuesteros() {
    const supabase = await createClient();

    // Traer repuesteros y sus marcas unidas por la join table
    const { data, error } = await supabase
        .from("repuesteros")
        .select(`
      *,
      marcas:repuestero_marcas(marca)
    `)
        .order("nombre", { ascending: true });

    if (error) {
        console.error("Error fetching repuesteros:", error);
        return [];
    }

    // Transformar las marcas a un array simplificado
    return data.map(r => ({
        ...r,
        marcas: r.marcas.map((m: any) => m.marca)
    }));
}

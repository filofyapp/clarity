"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function crearTaller(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { error } = await supabase.from("talleres").insert({
        nombre: formData.get("nombre") as string,
        direccion: formData.get("direccion") as string || "Sin dirección",
        telefono: formData.get("telefono") as string || null,
        email: formData.get("email") as string || null,
        localidad: formData.get("localidad") as string || null,
        tipo: formData.get("tipo") as string || "general",
        contacto_nombre: formData.get("contacto_nombre") as string || null,
        notas: formData.get("notas") as string || null,
        cuit: formData.get("cuit") as string || null,
        hace_remotas: formData.get("hace_remotas") === "true",
    });

    if (error) return { error: error.message };
    revalidatePath("/directorio/talleres");
    return { success: true };
}

export async function editarTaller(id: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { error } = await supabase.from("talleres").update({
        nombre: formData.get("nombre") as string,
        direccion: formData.get("direccion") as string || "Sin dirección",
        telefono: formData.get("telefono") as string || null,
        email: formData.get("email") as string || null,
        localidad: formData.get("localidad") as string || null,
        tipo: formData.get("tipo") as string || "general",
        contacto_nombre: formData.get("contacto_nombre") as string || null,
        notas: formData.get("notas") as string || null,
        cuit: formData.get("cuit") as string || null,
        hace_remotas: formData.get("hace_remotas") === "true",
    }).eq("id", id);

    if (error) return { error: error.message };
    revalidatePath("/directorio/talleres");
    return { success: true };
}

export async function crearGestor(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    // Buscar la compañía Sancor (siempre es la misma)
    const { data: sancor } = await supabase
        .from("companias")
        .select("id")
        .eq("nombre", "Sancor Seguros")
        .single();

    const { error } = await supabase.from("gestores").insert({
        nombre: formData.get("nombre") as string,
        email: formData.get("email") as string || null,
        telefono: formData.get("telefono") as string || null,
        sector: formData.get("sector") as string || null,
        notas: formData.get("notas") as string || null,
        compania_id: sancor?.id || null,
    });

    if (error) return { error: error.message };
    revalidatePath("/directorio/gestores");
    return { success: true };
}

export async function editarGestor(id: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { error } = await supabase.from("gestores").update({
        nombre: formData.get("nombre") as string,
        email: formData.get("email") as string || null,
        telefono: formData.get("telefono") as string || null,
        sector: formData.get("sector") as string || null,
        notas: formData.get("notas") as string || null,
    }).eq("id", id);

    if (error) return { error: error.message };
    revalidatePath("/directorio/gestores");
    return { success: true };
}

export async function crearRepuestero(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { data: rep, error } = await supabase.from("repuesteros").insert({
        nombre: formData.get("nombre") as string,
        telefono: formData.get("telefono") as string || null,
        email: formData.get("email") as string || null,
        whatsapp: formData.get("whatsapp") as string || null,
        direccion: formData.get("direccion") as string || null,
        localidad: formData.get("localidad") as string || null,
        contacto_nombre: formData.get("contacto_nombre") as string || null,
        notas: formData.get("notas") as string || null,
    }).select("id").single();

    if (error) return { error: error.message };

    // Insertar marcas
    const marcas = (formData.get("marcas") as string || "").split(",").map(m => m.trim()).filter(Boolean);
    if (marcas.length > 0 && rep) {
        await supabase.from("repuestero_marcas").insert(
            marcas.map(marca => ({ repuestero_id: rep.id, marca }))
        );
    }

    revalidatePath("/directorio/repuesteros");
    return { success: true };
}

export async function editarRepuestero(id: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { error } = await supabase.from("repuesteros").update({
        nombre: formData.get("nombre") as string,
        telefono: formData.get("telefono") as string || null,
        email: formData.get("email") as string || null,
        whatsapp: formData.get("whatsapp") as string || null,
        direccion: formData.get("direccion") as string || null,
        localidad: formData.get("localidad") as string || null,
        contacto_nombre: formData.get("contacto_nombre") as string || null,
        notas: formData.get("notas") as string || null,
    }).eq("id", id);

    if (error) return { error: error.message };

    const marcas = (formData.get("marcas") as string || "").split(",").map(m => m.trim()).filter(Boolean);

    // Al ser un update masivo de marcas, podemos borrar las vinculaciones viejas e insertar nuevas
    await supabase.from("repuestero_marcas").delete().eq("repuestero_id", id);
    if (marcas.length > 0) {
        await supabase.from("repuestero_marcas").insert(
            marcas.map(marca => ({ repuestero_id: id, marca }))
        );
    }

    revalidatePath("/directorio/repuesteros");
    return { success: true };
}

export async function crearCredencial(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { error } = await supabase.from("herramientas_usuarios").insert({
        plataforma: formData.get("plataforma") as string,
        credencial_usuario: formData.get("credencial_usuario") as string,
        credencial_pass: formData.get("credencial_pass") as string,
        notas: formData.get("notas") as string || null,
    });

    if (error) return { error: error.message };
    revalidatePath("/directorio/credenciales");
    return { success: true };
}

export async function crearValor(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { error } = await supabase.from("valores_chapa_pintura").insert({
        marca: formData.get("marca") as string,
        descripcion: formData.get("descripcion") as string || null,
        valor_pieza: parseFloat(formData.get("valor_pieza") as string) || null,
        valor_hora: parseFloat(formData.get("valor_hora") as string) || null,
        notas: formData.get("notas") as string || null,
    });

    if (error) return { error: error.message };
    revalidatePath("/directorio/valores");
    return { success: true };
}

// ==========================================
// ELIMINACIONES
// ==========================================

export async function eliminarGestor(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { error } = await supabase.from("gestores").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/directorio/gestores");
    return { success: true };
}

export async function eliminarTaller(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { error } = await supabase.from("talleres").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/directorio/talleres");
    return { success: true };
}

export async function eliminarRepuestero(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { error } = await supabase.from("repuesteros").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/directorio/repuesteros");
    return { success: true };
}

export async function eliminarCredencial(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { error } = await supabase.from("herramientas_usuarios").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/directorio/credenciales");
    return { success: true };
}

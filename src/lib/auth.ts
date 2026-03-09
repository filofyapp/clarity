"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface UsuarioSession {
    id: string;
    email: string;
    rol: string;
    roles: string[];
    nombre: string;
    apellido: string;
}

/**
 * Obtiene el usuario actual autenticado y su información de la tabla usuarios.
 * Si el usuario está autenticado pero no existe en usuarios, lo crea como admin
 * (asumiendo que es el primer usuario del sistema).
 * Redirige a /login SOLO si no hay sesión de auth.
 */
export async function getUsuarioActual(): Promise<UsuarioSession> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Buscar en tabla usuarios
    const { data: usuario } = await supabase
        .from("usuarios")
        .select("id, nombre, apellido, rol, roles")
        .eq("id", user.id)
        .single();

    if (usuario) {
        return {
            id: usuario.id,
            email: user.email || "",
            rol: usuario.rol,
            roles: usuario.roles || [usuario.rol],
            nombre: usuario.nombre,
            apellido: usuario.apellido,
        };
    }

    // Auto-crear entrada en usuarios si no existe
    // El primer usuario se crea como admin, los siguientes como calle (por seguridad)
    const { count } = await supabase.from("usuarios").select("id", { count: "exact", head: true });
    const rolDefault = (count === 0) ? "admin" : "calle";

    const emailParts = (user.email || "usuario@clarity.com").split("@");
    const nombreDefault = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);

    const { data: nuevoUsuario, error } = await supabase
        .from("usuarios")
        .insert({
            id: user.id,
            email: user.email,
            nombre: nombreDefault,
            apellido: "",
            rol: rolDefault,
            roles: [rolDefault],
            activo: true,
        })
        .select("id, nombre, apellido, rol, roles")
        .single();

    if (error || !nuevoUsuario) {
        // Ultimo recurso: devolver datos mínimos para no romper nada
        return {
            id: user.id,
            email: user.email || "",
            rol: rolDefault,
            roles: [rolDefault],
            nombre: nombreDefault,
            apellido: "",
        };
    }

    return {
        id: nuevoUsuario.id,
        email: user.email || "",
        rol: nuevoUsuario.rol,
        roles: nuevoUsuario.roles || [nuevoUsuario.rol],
        nombre: nuevoUsuario.nombre,
        apellido: nuevoUsuario.apellido,
    };
}

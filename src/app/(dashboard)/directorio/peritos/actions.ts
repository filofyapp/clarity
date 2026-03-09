"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getPeritosData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .or('rol.eq.calle,rol.eq.carga,rol.eq.admin,roles.cs.{"calle"},roles.cs.{"carga"}')
        .order("nombre");

    if (error) {
        console.error("Error fetching peritos:", error);
        return [];
    }
    return data;
}

export async function upsertPerito(formData: FormData, userId?: string) {
    const supabaseAuthAdmin = createAdminClient();
    const supabaseData = await createClient();

    const nombre = formData.get("nombre") as string;
    const apellido = formData.get("apellido") as string;
    const email = formData.get("email") as string;
    const telefono = formData.get("telefono") as string;
    const password = formData.get("password") as string;
    // Roles can be a JSON array string or a comma-separated string depending on form submission
    let roles: string[] = ["calle"];
    const rolesStr = formData.get("roles") as string;
    if (rolesStr) {
        try {
            roles = JSON.parse(rolesStr);
            if (!Array.isArray(roles)) roles = [rolesStr];
        } catch (e) {
            // If it's not JSON, it might be a plain string like 'calle' or 'calle,carga'
            roles = rolesStr.split(',').map(r => r.trim()).filter(Boolean);
        }
    }

    // Fallback: We'll take the first role in the array to persist to the old "rol" column temporarily,
    // until we fully drop `rol`.
    const primaryRol = roles[0] || "calle";

    // Check acting user permissions
    const { data: { user: currentUser } } = await supabaseData.auth.getUser();
    if (!currentUser) return { error: "No autorizado." };
    const { data: currentUserData } = await supabaseData.from("usuarios").select("rol, roles").eq("id", currentUser.id).single();
    if (currentUserData?.rol !== "admin" && !(currentUserData?.roles || []).includes("admin")) return { error: "Solo los administradores pueden gestionar peritos." };

    try {
        let authUserId = userId;

        if (userId) {
            // Edit existing
            const { data: existingAuthUser, error: existingAuthError } = await supabaseAuthAdmin.auth.admin.getUserById(userId);

            if (existingAuthError && (existingAuthError.message.includes("User not found") || existingAuthError.message.includes("Database error loading user"))) {
                // FALLBACK FOR MIGRATED USERS: The user exists in 'usuarios' but NOT in 'auth.users'
                if (!password || password.trim().length < 6) return { error: "Este perito fue migrado. Para enlazarlo al sistema, debe asignarle una contraseña de al menos 6 caracteres." };

                // We create them in Auth with the exact SAME UUID so they link up correctly
                const { data: newAuthUser, error: newAuthError } = await supabaseAuthAdmin.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: { nombre, apellido, rol: primaryRol, roles }
                });

                if (newAuthError) return { error: `Error creando usuario migrado en Auth: ${newAuthError.message}` };

                // Force update their ID in the local table just to be absolutely sure, though it should be identical if we could pass ID, 
                // but Supabase createUser doesn't let us force an ID. So we must update the local table to point to the New Auth ID.
                authUserId = newAuthUser.user.id;

                const { error: linkError } = await supabaseData.from("usuarios").update({
                    id: authUserId,
                    nombre,
                    apellido,
                    email,
                    telefono,
                    rol: primaryRol,
                    roles,
                }).eq("id", userId);

                if (linkError) return { error: `Error enlazando perfil migrado: ${linkError.message}` };

                revalidatePath("/directorio/peritos");
                return { success: true };
            }

            if (existingAuthError && !existingAuthError.message.includes("User not found") && !existingAuthError.message.includes("Database error loading user")) {
                return { error: `Error interno al verificar usuario en Auth: ${existingAuthError.message}` };
            }

            const updatePayload: any = {
                user_metadata: { nombre, apellido, rol: primaryRol, roles },
            };

            // Only update email if it actually changed, to avoid "Database error loading user"
            if (email && existingAuthUser?.user && email !== existingAuthUser.user.email) {
                updatePayload.email = email;
                updatePayload.email_confirm = true;
            }

            if (password && password.trim().length >= 6) {
                updatePayload.password = password;
            }

            const { error: authError } = await supabaseAuthAdmin.auth.admin.updateUserById(userId, updatePayload);
            if (authError) return { error: authError.message };

            // Update custom local users table
            const { error: dbError } = await supabaseData.from("usuarios").update({
                nombre,
                apellido,
                email,
                telefono,
                rol: primaryRol,
                roles,
            }).eq("id", userId);

            if (dbError) return { error: dbError.message };

        } else {
            // Create new
            if (!password || password.trim().length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };

            const { data: newAuthUser, error: authError } = await supabaseAuthAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { nombre, apellido, rol: primaryRol, roles }
            });

            if (authError) return { error: authError.message };
            authUserId = newAuthUser.user.id;

            // Notice that creating a user usually triggers a trigger to insert into "usuarios".
            // Since we need to assign specific fields, we will execute an upsert just in case the trigger 
            // already fired. Or we update if it exists.
            const { error: dbError } = await supabaseData.from("usuarios").upsert({
                id: authUserId,
                email,
                nombre,
                apellido,
                telefono,
                rol: primaryRol,
                roles,
                activo: true
            }, { onConflict: "id" });

            if (dbError) return { error: dbError.message };
        }

        revalidatePath("/directorio/peritos");
        return { success: true };

    } catch (e: any) {
        return { error: e.message || "Error desconocido al procesar el usuario." };
    }
}

export async function deletePerito(userId: string) {
    const supabaseAuthAdmin = createAdminClient();
    const supabaseData = await createClient();

    // Check acting user permissions
    const { data: { user: currentUser } } = await supabaseData.auth.getUser();
    if (!currentUser) return { error: "No autorizado." };
    const { data: currentUserData } = await supabaseData.from("usuarios").select("rol").eq("id", currentUser.id).single();
    if (currentUserData?.rol !== "admin") return { error: "Solo los administradores pueden eliminar peritos." };

    // Note: Eliminating the auth user cascades to public.usuarios via Supabase FK if set, 
    // but just to be safe we use Admin API to delete the auth account entirely.
    const { error: authError } = await supabaseAuthAdmin.auth.admin.deleteUser(userId);

    // Si el usuario fue migrado vía SQL, no existirá en auth.users
    if (authError && !authError.message.includes("User not found") && !authError.message.includes("Database error loading user")) {
        return { error: `Error interno al eliminar auth: ${authError.message}` };
    }

    // Borramos explícitamente de la tabla pública por si falló el cascade o era un usuario migrado
    const { error: dbError } = await supabaseData.from("usuarios").delete().eq("id", userId);

    if (dbError) {
        return { error: `Error al eliminar perfil de base de datos: ${dbError.message}` };
    }

    revalidatePath("/directorio/peritos");
    return { success: true };
}

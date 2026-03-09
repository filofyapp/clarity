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
    // Roles are passed via JSON stringified array from the custom react-select
    const rolesStr = formData.get("roles") as string;
    let roles: string[] = ["calle"];
    try {
        if (rolesStr) roles = JSON.parse(rolesStr);
    } catch (e) { console.error("Error parsing roles", e); }

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
            if (existingAuthError) return { error: `Error interno al verificar usuario en Auth: ${existingAuthError.message}` };

            const updatePayload: any = {
                user_metadata: { nombre, apellido, rol: primaryRol, roles },
            };

            // Only update email if it actually changed, to avoid "Database error loading user"
            if (email && email !== existingAuthUser.user.email) {
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
    if (authError) return { error: authError.message };

    revalidatePath("/directorio/peritos");
    return { success: true };
}

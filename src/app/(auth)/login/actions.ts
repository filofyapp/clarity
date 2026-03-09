"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        // Retornamos el error para manejarlo en el Frontend con UseActionState o toasts
        return { error: error.message };
    }

    // Si fue exitoso, vamos al dashboard
    redirect("/dashboard");
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateTareaEstado(tareaId: string, nuevoEstado: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { error: "No autorizado." };

    const updatePayload: any = {
        estado: nuevoEstado,
        updated_at: new Date().toISOString(),
    };

    if (nuevoEstado === "resuelta") {
        updatePayload.fecha_completado = new Date().toISOString();
    } else {
        updatePayload.fecha_completado = null;
    }

    const { error: errorTarea } = await supabase
        .from("tareas")
        .update(updatePayload)
        .eq("id", tareaId);

    if (errorTarea) {
        return { error: `Error moviendo la tarjeta: ${errorTarea.message}` };
    }

    revalidatePath("/tareas");
    return { success: true };
}

export async function updateTareaAsignado(tareaId: string, nuevoAsignadoId: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { error: "No autorizado." };

    const { error: errorTarea } = await supabase
        .from("tareas")
        .update({ asignado_id: nuevoAsignadoId, updated_at: new Date().toISOString() })
        .eq("id", tareaId);

    if (errorTarea) return { error: `Error asignando la tarea: ${errorTarea.message}` };

    revalidatePath("/tareas");
    return { success: true };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveInformePericial(formData: FormData) {
    const supabase = await createClient();

    const caso_id = formData.get("caso_id") as string;
    const monto_presupuesto = parseFloat(formData.get("monto_presupuesto") as string || "0");
    const observaciones = formData.get("observaciones") as string;
    const acuerda_reparacion = formData.get("acuerda_reparacion") === "on";
    const taller_id = formData.get("taller_id") as string || null;

    try {
        const payload: any = {
            monto_presupuesto,
            observaciones_inspector: observaciones,
            acuerda_reparacion,
            fecha_inspeccion: new Date().toISOString()
        };

        if (taller_id) {
            payload.taller_id = taller_id;
        }

        // Submits core update 
        const { error: updateError } = await supabase
            .from("casos")
            .update(payload)
            .eq("id", caso_id);

        if (updateError) throw updateError;

        // Force triggering the state advancement to pending backend ops via explicit transition
        // Though we had a trigger for this, sometimes direct UI triggers are more reliable for UX feedback.
        const { error: stateError } = await supabase
            .from("casos")
            .update({ estado: 'pendiente_carga' })
            .eq("id", caso_id);

        if (stateError) throw stateError;

        revalidatePath(`/casos/${caso_id}`);
        return { success: true };

    } catch (error: any) {
        console.error("Error saving informe:", error);
        return { error: error.message };
    }
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function marcarComoFacturada(
    casoId: string,
    numeroFactura: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    // Solo admin puede facturar
    const { data: userData } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();

    if (!userData || userData.rol !== "admin") {
        return { error: "Solo el administrador puede facturar." };
    }

    // Note: The actual margin amounts are now handled automatically by the DB trigger `003_precio_historial_trigger.sql` 
    // when the state changes to ip_cerrada. If we just mark it facturada, we don't need to manually insert them here,
    // assuming the fields monto_facturado_estudio, etc. were either populated by the trigger or not strictly required 
    // to be overriden at billing time according to F5.6 (Simplify billing queue).
    const { error } = await supabase
        .from("casos")
        .update({
            estado: "facturada",
            facturado: true,
            fecha_facturacion: new Date().toISOString().split("T")[0],
            numero_factura: numeroFactura || null,
            updated_at: new Date().toISOString()
        })
        .eq("id", casoId)
        .eq("estado", "ip_cerrada"); // Safety: solo desde ip_cerrada

    if (error) return { error: error.message };

    // Registrar en historial
    await supabase.from("historial_estados").insert({
        caso_id: casoId,
        usuario_id: user.id,
        estado_anterior: "ip_cerrada",
        estado_nuevo: "facturada",
        motivo: `Facturada — Nro: ${numeroFactura || "s/n"}`
    });

    revalidatePath("/facturacion");
    revalidatePath(`/casos/${casoId}`);
    return { success: true };
}

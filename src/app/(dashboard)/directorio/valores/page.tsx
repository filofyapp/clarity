import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ValoresTable } from "@/components/directorio/ValoresTable";
import { ValorFormDialog } from "@/components/directorio/ValorFormDialog";

export const metadata = {
    title: "Valores Chapa y Pintura - CLARITY",
};

export default async function ValoresPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: userData } = await supabase
        .from("usuarios")
        .select("rol, roles")
        .eq("id", user.id)
        .single();

    const userRoles: string[] = userData?.roles || [userData?.rol].filter(Boolean);
    const canEdit = userRoles.includes("admin") || userRoles.includes("carga");

    const { data: valores, error } = await supabase
        .from("valores_chapa_pintura")
        .select("*")
        .eq("activo", true)
        .order("marca", { ascending: true });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-1">Valores de Referencia</h1>
                    <p className="text-sm text-text-muted">
                        Convenios y precios de mano de obra (Chapa y Pintura) por concesionaria/marca.
                    </p>
                </div>
                <ValorFormDialog canEdit={canEdit} />
            </div>

            <ValoresTable valores={valores || []} />

            {(error) && (
                <div className="p-4 bg-danger/10 border border-danger/30 rounded-md text-sm text-danger mt-4">
                    Error cargando los valores. Vuelva a intentarlo o verifique los permisos de Supabase.
                </div>
            )}
        </div>
    );
}

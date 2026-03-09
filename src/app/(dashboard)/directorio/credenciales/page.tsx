import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CredencialesTable } from "@/components/directorio/CredencialesTable";
import { CredencialFormDialog } from "@/components/directorio/CredencialFormDialog";
import { Shield } from "lucide-react";

export const metadata = {
    title: "Credenciales de Sistemas - CLARITY",
};

export default async function CredencialesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Role verification (Admin/Carga)
    const { data: userData } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();

    if (userData?.rol !== "admin" && userData?.rol !== "carga") {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center p-8 bg-card rounded-md border border-border mt-12 text-center">
                <Shield className="h-16 w-16 text-danger mb-4 opacity-80" />
                <h2 className="text-xl font-bold text-text-primary mb-2">Acceso Denegado</h2>
                <p className="text-text-muted">No tienes permisos suficientes para acceder a las credenciales del sistema.</p>
            </div>
        );
    }

    const { data: credenciales, error } = await supabase
        .from("herramientas_usuarios")
        .select("*")
        .eq("activo", true)
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-1">Credenciales de Sistemas Externos</h1>
                    <p className="text-sm text-text-muted">
                        Directorio de acceso para herramientas de compañías y liquidadoras externas.
                    </p>
                </div>
                <CredencialFormDialog />
            </div>

            <CredencialesTable credenciales={credenciales || []} />

            {(error) && (
                <div className="p-4 bg-danger/10 border border-danger/30 rounded-md text-sm text-danger mt-4">
                    Error cargando las credenciales. Vuelva a intentarlo o verifique los permisos de Supabase.
                </div>
            )}
        </div>
    );
}

import { getPeritosData } from "./actions";
import { PeritosTable } from "@/components/directorio/PeritosTable";
import { Search, UserSquare2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PeritoFormDialog } from "@/components/directorio/PeritoFormDialog";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
    title: "Gestión de Peritos - CLARITY",
};

export default async function PeritosPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Validar Admin / Carga
    if (!user) redirect("/login");
    const { data: usuarioData } = await supabase.from("usuarios").select("rol").eq("id", user.id).single();
    if (usuarioData?.rol !== "admin" && usuarioData?.rol !== "carga") {
        redirect("/dashboard");
    }

    const peritos = await getPeritosData();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
                        <UserSquare2 className="w-6 h-6 text-brand-secondary" />
                        Gestión de Peritos
                    </h1>
                    <p className="text-sm text-text-muted mt-1">
                        Control de credenciales, roles y acceso al sistema para peritos de calle y carga.
                    </p>
                </div>
                {usuarioData.rol === "admin" && (
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
                            <Input
                                type="search"
                                placeholder="Buscar perito..."
                                className="pl-9 bg-bg-tertiary border-border focus-visible:ring-brand-primary h-9"
                            />
                        </div>
                        <PeritoFormDialog />
                    </div>
                )}
            </div>

            <div className="rounded-md border border-border bg-card shadow-sm">
                <PeritosTable peritos={peritos} isReadOnly={usuarioData.rol !== "admin"} />
            </div>
        </div>
    );
}

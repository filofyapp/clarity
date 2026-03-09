import { getGestores } from "../actions";
import { GestoresTable } from "@/components/directorio/GestoresTable";
import { GestorFormDialog } from "@/components/directorio/GestorFormDialog";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const metadata = {
    title: "Directorio de Gestores - CLARITY",
};

export default async function GestoresPage() {
    const gestores = await getGestores();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary">Gestores de Sancor</h1>
                    <p className="text-sm text-text-muted">
                        Directorio de gestores de la compañía. Contacto disponible con un click.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
                        <Input
                            type="search"
                            placeholder="Buscar gestor..."
                            className="pl-9 bg-bg-tertiary border-border focus-visible:ring-brand-primary h-9"
                        />
                    </div>
                    <GestorFormDialog />
                </div>
            </div>

            <div className="rounded-md border border-border bg-card shadow-sm">
                <GestoresTable gestores={gestores} />
            </div>
        </div>
    );
}

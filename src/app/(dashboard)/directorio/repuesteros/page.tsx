import { Suspense } from "react";
import { getRepuesteros } from "../actions";
import { RepuesterosTable } from "@/components/directorio/RepuesterosTable";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RepuesteroFormDialog } from "@/components/directorio/RepuesteroFormDialog";

export const metadata = {
    title: "Directorio de Repuesteros - CLARITY",
};

export default async function RepuesterosPage() {
    const repuesteros = await getRepuesteros();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary">Casas de Repuestos</h1>
                    <p className="text-sm text-text-muted">
                        Directorio activo de repuesteros para la fase de Licitación y Cotización.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
                        <Input
                            type="search"
                            placeholder="Buscar por repuestero o marcas (ej. Toyota)..."
                            className="pl-9 bg-bg-tertiary border-border focus-visible:ring-brand-primary h-9"
                        />
                    </div>
                    <RepuesteroFormDialog />
                </div>
            </div>

            <div className="rounded-md border border-border bg-card shadow-sm">
                <Suspense fallback={<div className="p-8 text-center text-text-muted">Cargando base de proveedores...</div>}>
                    <RepuesterosTable repuesteros={repuesteros} />
                </Suspense>
            </div>
        </div>
    );
}

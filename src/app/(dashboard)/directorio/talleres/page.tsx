import { getTalleres } from "../actions";
import { TalleresTable } from "@/components/directorio/TalleresTable";
import { TallerFormDialog } from "@/components/directorio/TallerFormDialog";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const metadata = {
    title: "Directorio de Talleres - CLARITY",
};

export default async function TalleresPage() {
    const talleres = await getTalleres();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary">Talleres y Concesionarios</h1>
                    <p className="text-sm text-text-muted">
                        Directorio de talleres vinculables a los siniestros.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
                        <Input
                            type="search"
                            placeholder="Buscar por nombre o localidad..."
                            className="pl-9 bg-bg-tertiary border-border focus-visible:ring-brand-primary h-9"
                        />
                    </div>
                    <TallerFormDialog />
                </div>
            </div>

            <div className="rounded-md border border-border bg-card shadow-sm">
                <TalleresTable talleres={talleres} />
            </div>
        </div>
    );
}

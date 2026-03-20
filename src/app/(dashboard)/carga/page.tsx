import { Suspense } from "react";
import { getCasosParaCarga } from "./actions";
import { AlertCircle, FileSearch } from "lucide-react";
import { ColaDeCargaBoard } from "@/components/carga/ColaDeCargaBoard";

export const metadata = {
    title: "Cola de Oficina y Carga - CLARITY"
};

async function ColaCarga() {
    const { data: casos, error } = await getCasosParaCarga();

    if (error) {
        return (
            <div className="p-6 bg-danger/10 text-danger border border-danger/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">Error cargando la cola de Casos Listos: {error}</p>
            </div>
        );
    }

    return <ColaDeCargaBoard casos={(casos || []) as any} />;
}

export default function CargaPage() {
    return (
        <div className="flex flex-col h-full max-w-[1400px] mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
                        <FileSearch className="w-6 h-6 text-estado-pendiente-carga" />
                        Cola de Carga & Oficina
                    </h1>
                    <p className="text-text-muted text-sm mt-1">
                        Panel de vista rápida de siniestros a cargar.
                    </p>
                </div>
            </div>

            <Suspense fallback={
                <div className="w-full h-64 bg-bg-tertiary animate-pulse rounded-xl border border-border"></div>
            }>
                <ColaCarga />
            </Suspense>
        </div>
    );
}

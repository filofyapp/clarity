import { Suspense } from "react";
import { getCasosParaCarga } from "./actions";
import { getPeritos, getGestores } from "../casos/actions";
import { AlertCircle, FileSearch, ShieldCheck } from "lucide-react";
import { CasosTable } from "@/components/casos/CasosTable";

export const metadata = {
    title: "Cola de Oficina y Carga - CLARITY"
};

async function ColaCarga() {
    const [{ data: casos, error }, peritos, gestores] = await Promise.all([
        getCasosParaCarga(),
        getPeritos(),
        getGestores()
    ]);

    if (error) {
        return (
            <div className="p-6 bg-danger/10 text-danger border border-danger/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">Error cargando la cola de Casos Listos: {error}</p>
            </div>
        );
    }

    if (!casos || casos.length === 0) {
        return (
            <div className="flex flex-col flex-1 h-[60vh] items-center justify-center p-8 text-center bg-bg-secondary/50 rounded-xl border border-dashed border-border">
                <ShieldCheck className="w-16 h-16 text-color-success mb-4" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">Oficina al día</h3>
                <p className="text-text-muted max-w-sm">
                    No tienes informes técnicos listos para cerrar o cotizar a Sancor por el momento.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-bg-secondary border border-border rounded-xl mt-6 overflow-hidden hidden md:block animate-in fade-in duration-500">
            <CasosTable casos={casos} peritos={peritos} gestores={gestores} />
        </div>
    );
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
                        Revisiones fotográficas y pedidos de repuestaje listos para ser procesados frente a las compañías.
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

import { Suspense } from "react";
import { getMiAgenda } from "./actions";
import { AgendaCard } from "@/components/mi-agenda/AgendaCard";
import { CalendarDays, AlertCircle, Clock, Sun } from "lucide-react";

export const metadata = {
    title: "Mi Agenda - CLARITY"
};

async function AgendaList() {
    const { data: casos, error, hoy, manana } = await getMiAgenda();

    if (error) {
        return (
            <div className="p-6 bg-danger/10 text-danger border border-danger/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">Error cargando tu agenda. Comunícate con soporte.</p>
            </div>
        );
    }

    if (!casos || casos.length === 0) {
        return (
            <div className="flex flex-col flex-1 min-h-[50vh] items-center justify-center p-8 text-center bg-bg-secondary/50 rounded-xl border border-dashed border-border">
                <CalendarDays className="w-12 h-12 text-text-muted mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">Día Libre</h3>
                <p className="text-text-muted text-sm max-w-sm">
                    No tienes inspecciones coordinadas agendadas para el día de hoy. Disfrutá tu jornada.
                </p>
            </div>
        );
    }

    // Group by Hoy / Mañana / Other
    const casosHoy = casos.filter((c: any) => c.fecha_inspeccion_programada === hoy);
    const casosManana = casos.filter((c: any) => c.fecha_inspeccion_programada === manana);
    const casosOtros = casos.filter((c: any) =>
        c.fecha_inspeccion_programada !== hoy && c.fecha_inspeccion_programada !== manana
    );

    // Mañana only visible if Hoy has no pending cases left
    const mostrarManana = casosHoy.length === 0;

    return (
        <div className="space-y-8">
            {/* HOY */}
            {casosHoy.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Sun className="w-5 h-5 text-brand-secondary" />
                        <h2 className="text-lg font-bold text-text-primary">Hoy</h2>
                        <span className="text-xs font-bold bg-brand-primary text-white px-2 py-0.5 rounded-full">
                            {casosHoy.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {casosHoy.map((caso: any) => (
                            <AgendaCard key={caso.id} caso={caso} />
                        ))}
                    </div>
                </div>
            )}

            {/* MAÑANA — only if Hoy is empty */}
            {casosManana.length > 0 && mostrarManana && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-color-info" />
                        <h2 className="text-lg font-bold text-text-primary">Mañana</h2>
                        <span className="text-xs font-bold bg-color-info text-white px-2 py-0.5 rounded-full">
                            {casosManana.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {casosManana.map((caso: any) => (
                            <AgendaCard key={caso.id} caso={caso} />
                        ))}
                    </div>
                </div>
            )}

            {/* Mañana hidden notice */}
            {casosManana.length > 0 && !mostrarManana && (
                <div className="bg-bg-secondary/50 border border-border rounded-xl p-4 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-text-muted shrink-0" />
                    <p className="text-sm text-text-muted">
                        Tenés <span className="font-bold text-text-primary">{casosManana.length}</span> inspección{casosManana.length > 1 ? "es" : ""} para mañana.
                        Terminá las de hoy para verlas.
                    </p>
                </div>
            )}

            {/* Otras fechas (edge case) */}
            {casosOtros.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-text-muted" />
                        <h2 className="text-lg font-bold text-text-primary">Próximas</h2>
                        <span className="text-xs font-bold bg-bg-tertiary text-text-muted px-2 py-0.5 rounded-full border border-border">
                            {casosOtros.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {casosOtros.map((caso: any) => (
                            <AgendaCard key={caso.id} caso={caso} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MiAgendaPage() {
    return (
        <div className="flex flex-col h-full max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">Mi Agenda Diaria</h1>
                <p className="text-text-muted text-sm">
                    Revisa las inspecciones pautadas, llama al asegurado y reportá la evaluación física del vehículo in-situ.
                </p>
            </div>

            <Suspense fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-bg-tertiary animate-pulse rounded-xl border border-border"></div>
                    ))}
                </div>
            }>
                <AgendaList />
            </Suspense>
        </div>
    );
}

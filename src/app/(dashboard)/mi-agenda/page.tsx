import { Suspense } from "react";
import { getMiAgenda } from "./actions";
import { AgendaCard } from "@/components/mi-agenda/AgendaCard";
import { CalendarDays, AlertCircle } from "lucide-react";

export const metadata = {
    title: "Mi Agenda - CLARITY"
};

async function AgendaList() {
    const { data: casos, error } = await getMiAgenda();

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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {casos.map((caso) => (
                <AgendaCard key={caso.id} caso={caso} />
            ))}
        </div>
    );
}

export default function MiAgendaPage() {
    return (
        <div className="flex flex-col h-full max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">Mi Agenda Diaria</h1>
                <p className="text-text-muted text-sm">
                    Revisa las inspecciones pautadas, llama al asegurado y reportatá la evaluación física del vehículo in-situ.
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

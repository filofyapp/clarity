import { Suspense } from "react";
import { getMiAgenda } from "./actions";
import { AgendaCard } from "@/components/mi-agenda/AgendaCard";
import { CalendarDays, AlertCircle, Clock, Sun, CalendarCheck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

    // Group by Hoy / Mañana / Próximas
    const casosHoy = casos.filter((c: any) => c.fecha_inspeccion_programada === hoy);
    const casosManana = casos.filter((c: any) => c.fecha_inspeccion_programada === manana);
    const casosOtros = casos.filter((c: any) =>
        c.fecha_inspeccion_programada !== hoy && c.fecha_inspeccion_programada !== manana
    );

    // Group "Otros" by specific date for clarity
    const otrosPorFecha: Record<string, any[]> = {};
    casosOtros.forEach((c: any) => {
        const fecha = c.fecha_inspeccion_programada || "sin_fecha";
        if (!otrosPorFecha[fecha]) otrosPorFecha[fecha] = [];
        otrosPorFecha[fecha].push(c);
    });
    const fechasOrdenadas = Object.keys(otrosPorFecha).sort();

    const formatDayLabel = (dateStr: string) => {
        if (dateStr === "sin_fecha") return "Sin fecha definida";
        const safeDateStr = dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`;
        return format(new Date(safeDateStr), "EEEE d 'de' MMMM", { locale: es });
    };

    return (
        <div className="space-y-2">
            {/* ═══ HOY ═══ */}
            <DaySeparator
                icon={<Sun className="w-5 h-5" />}
                label="Hoy"
                count={casosHoy.length}
                colorScheme="primary"
            />
            {casosHoy.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
                    {casosHoy.map((caso: any) => (
                        <AgendaCard key={caso.id} caso={caso} />
                    ))}
                </div>
            ) : (
                <div className="bg-color-success/5 border border-color-success/20 rounded-xl px-4 py-6 text-center mb-4">
                    <p className="text-sm text-color-success font-medium">✅ Sin inspecciones para hoy</p>
                </div>
            )}

            {/* ═══ MAÑANA ═══ — Siempre visible */}
            {casosManana.length > 0 && (
                <>
                    <DaySeparator
                        icon={<Clock className="w-5 h-5" />}
                        label="Mañana"
                        count={casosManana.length}
                        colorScheme="info"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
                        {casosManana.map((caso: any) => (
                            <AgendaCard key={caso.id} caso={caso} />
                        ))}
                    </div>
                </>
            )}

            {/* ═══ PRÓXIMAS (agrupadas por fecha) ═══ */}
            {fechasOrdenadas.map(fecha => (
                <div key={fecha}>
                    <DaySeparator
                        icon={<CalendarCheck className="w-5 h-5" />}
                        label={formatDayLabel(fecha)}
                        count={otrosPorFecha[fecha].length}
                        colorScheme="muted"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
                        {otrosPorFecha[fecha].map((caso: any) => (
                            <AgendaCard key={caso.id} caso={caso} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ═══ Separador visual de día — Full-width, solid, premium ═══ */
function DaySeparator({ icon, label, count, colorScheme }: {
    icon: React.ReactNode;
    label: string;
    count: number;
    colorScheme: "primary" | "info" | "muted";
}) {
    const schemes = {
        primary: {
            container: "bg-brand-primary/15 border border-brand-primary/30",
            accent: "bg-brand-primary",
            text: "text-brand-primary",
            badge: "bg-brand-primary text-white shadow-lg shadow-brand-primary/20",
            icon: "text-brand-primary",
        },
        info: {
            container: "bg-color-info/10 border border-color-info/25",
            accent: "bg-color-info",
            text: "text-color-info",
            badge: "bg-color-info text-white shadow-lg shadow-color-info/20",
            icon: "text-color-info",
        },
        muted: {
            container: "bg-bg-secondary border border-border",
            accent: "bg-text-muted",
            text: "text-text-secondary",
            badge: "bg-bg-tertiary text-text-muted border border-border",
            icon: "text-text-muted",
        },
    };
    const s = schemes[colorScheme];

    return (
        <div className={`${s.container} rounded-xl px-4 py-3.5 flex items-center gap-3 relative overflow-hidden`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${s.accent} rounded-l-xl`} />
            <div className={`${s.icon} ml-1`}>{icon}</div>
            <h2 className={`text-lg font-extrabold ${s.text} capitalize flex-1`}>{label}</h2>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${s.badge}`}>
                {count}
            </span>
        </div>
    );
}

export default function MiAgendaPage() {
    return (
        <div className="flex flex-col h-full max-w-7xl mx-auto space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-1">Mi Agenda</h1>
                <p className="text-text-muted text-sm">
                    Todas tus inspecciones, organizadas por día.
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

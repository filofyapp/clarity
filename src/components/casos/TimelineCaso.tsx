import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TimelineEvent {
    id: string;
    estado_nuevo: string;
    fecha_cambio: string;
    usuario?: {
        nombre: string;
        apellido: string;
    };
}

export function TimelineCaso({ eventos }: { eventos: TimelineEvent[] }) {
    if (!eventos || eventos.length === 0) {
        return (
            <div className="text-sm text-text-muted py-4">
                No hay registros históricos para este caso.
            </div>
        );
    }

    // Ordenar de más reciente a más antiguo
    const sorted = [...eventos].sort((a, b) => new Date(b.fecha_cambio).getTime() - new Date(a.fecha_cambio).getTime());

    return (
        <div className="space-y-6 pt-4 pl-2">
            {sorted.map((evento, index) => {
                const isLatest = index === 0;

                return (
                    <div key={evento.id} className="relative flex gap-4">
                        {/* Línea vertical */}
                        {index !== sorted.length - 1 && (
                            <div
                                className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-border"
                                aria-hidden="true"
                            />
                        )}

                        {/* Ícono de estado */}
                        <div className="relative mt-1">
                            {isLatest ? (
                                <CheckCircle2 className="h-6 w-6 text-brand-primary bg-bg-primary rounded-full" />
                            ) : (
                                <Circle className="h-6 w-6 text-text-muted bg-bg-primary rounded-full fill-bg-tertiary" />
                            )}
                        </div>

                        {/* Contenido del evento */}
                        <div className="flex flex-col flex-1 pb-2">
                            <div className="flex justify-between items-start">
                                <p className={`text-sm font-medium ${isLatest ? 'text-text-primary' : 'text-text-primary capitalize'}`}>
                                    {evento.estado_nuevo.replace(/_/g, " ")}
                                </p>
                                <div className="flex items-center text-xs text-text-muted">
                                    <Clock className="mr-1 h-3 w-3" />
                                    {format(new Date(evento.fecha_cambio), "dd MMM, HH:mm", { locale: es })}
                                </div>
                            </div>

                            {evento.usuario && (
                                <p className="text-xs text-text-muted mt-1">
                                    Por: {evento.usuario.nombre} {evento.usuario.apellido}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

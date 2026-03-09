"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Circle, Clock, Loader2, CheckSquare } from "lucide-react";
import { TareaCard } from "@/components/tareas/TareaCard";
import { TareaForm } from "@/components/tareas/TareaForm";

export function TimelineExpediente({ casoId, historialEstados, usuariosAll, currentUserId, currentUserNombre, currentUserRol }: any) {
    const [tareas, setTareas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTareas = async () => {
            try {
                const res = await fetch(`/api/casos/${casoId}/tareas`);
                if (res.ok) {
                    const data = await res.json();
                    setTareas(data);
                }
            } catch (error) {
                console.error("Error fetching case tasks", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTareas();
    }, [casoId]);

    // Unificar eventos históricos y tareas en un solo arreglo temporal
    const timelineItems = [
        ...(historialEstados || []).map((e: any) => ({
            type: "estado",
            date: new Date(e.created_at),
            data: e
        })),
        ...tareas.map((t: any) => ({
            type: "tarea",
            date: new Date(t.created_at),
            data: t
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()); // Descendente (más nuevos arriba)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="font-semibold text-text-primary text-lg">
                    Actividad del Expediente
                </h3>
                {/* Botón flotante para incrustar nueva tarea al caso */}
                {usuariosAll && usuariosAll.length > 0 && (
                    <TareaForm usuarios={usuariosAll} casoVinculadoId={casoId} />
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-brand-primary" /></div>
            ) : timelineItems.length === 0 ? (
                <div className="text-sm text-text-muted py-4 text-center border border-dashed border-border rounded-lg bg-bg-secondary/30">
                    No hay registro de actividad aún.
                </div>
            ) : (
                <div className="space-y-6 pt-2 pl-2">
                    {timelineItems.map((item, index) => {
                        const isLatest = index === 0;

                        if (item.type === "estado") {
                            const evento = item.data;
                            return (
                                <div key={`est-${evento.id}`} className="relative flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {index !== timelineItems.length - 1 && (
                                        <div className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-border/50" aria-hidden="true" />
                                    )}
                                    <div className="relative mt-1">
                                        {isLatest ? (
                                            <CheckCircle2 className="h-6 w-6 text-brand-primary bg-bg-primary rounded-full" />
                                        ) : (
                                            <Circle className="h-6 w-6 text-text-muted bg-bg-primary rounded-full fill-bg-tertiary" />
                                        )}
                                    </div>
                                    <div className="flex flex-col flex-1 pb-2">
                                        <div className="flex justify-between items-start">
                                            <p className={`text-sm font-medium ${isLatest ? 'text-text-primary' : 'text-text-primary capitalize'}`}>
                                                Estado a: {evento.estado_nuevo.replace(/_/g, " ")}
                                            </p>
                                            <div className="flex items-center text-xs text-text-muted">
                                                <Clock className="mr-1 h-3 w-3" />
                                                {format(item.date, "dd MMM, HH:mm", { locale: es })}
                                            </div>
                                        </div>
                                        {evento.usuario && (
                                            <p className="text-xs text-text-muted mt-1">
                                                Por {evento.usuario.nombre} {evento.usuario.apellido}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        } else {
                            // Rendering una Tarea Incrustada (Notion Like)
                            const t = item.data;
                            return (
                                <div key={`tar-${t.id}`} className="relative flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    {index !== timelineItems.length - 1 && (
                                        <div className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-border/50" aria-hidden="true" />
                                    )}
                                    <div className="relative mt-1">
                                        <CheckSquare className="h-6 w-6 text-brand-secondary bg-bg-primary rounded-full p-1 border border-brand-secondary/30" />
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <div className="flex justify-between items-start mb-2 pl-1">
                                            <p className="text-xs font-medium text-brand-secondary">
                                                Nueva Tarea Creada
                                            </p>
                                            <div className="flex items-center text-xs text-text-muted">
                                                <Clock className="mr-1 h-3 w-3" />
                                                {format(item.date, "dd MMM, HH:mm", { locale: es })}
                                            </div>
                                        </div>
                                        <div className="bg-bg-primary border border-border rounded-lg shadow-sm">
                                            <TareaCard
                                                tarea={t}
                                                isAsignee={t.asignado_id === currentUserId || currentUserRol === "admin"}
                                                currentUserId={currentUserId}
                                                currentUserNombre={currentUserNombre}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                    })}
                </div>
            )}
        </div>
    );
}

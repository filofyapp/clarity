"use client";

import { useEffect, useState } from "react";
import { Loader2, PlusCircle, CheckSquare } from "lucide-react";
import { TareaCard } from "@/components/tareas/TareaCard";
import { TareaForm } from "@/components/tareas/TareaForm";

export function ListaTareasCaso({ casoId, usuariosAll, currentUserId, currentUserNombre, currentUserRol }: any) {
    const [tareas, setTareas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTareas = async () => {
            try {
                // Quick fetch API just for this case
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

    if (loading) return <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-brand-primary" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-semibold text-text-primary text-lg flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-brand-secondary" />
                    Tareas del Caso
                </h3>
                <TareaForm usuarios={usuariosAll} casoVinculadoId={casoId} />
            </div>

            {tareas.length === 0 ? (
                <div className="text-center p-6 border border-dashed border-border rounded-lg bg-bg-secondary/30 text-text-muted text-sm">
                    No hay tareas vinculadas a este caso aún.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tareas.map(t => (
                        <TareaCard
                            key={t.id}
                            tarea={t}
                            isAsignee={t.asignado_id === currentUserId || currentUserRol === "admin"}
                            currentUserId={currentUserId}
                            currentUserNombre={currentUserNombre}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { TareaCard, EstadoTarea } from "./TareaCard";
import { Circle, Clock, CheckCircle2, Filter } from "lucide-react";
import { updateTareaEstado } from "@/app/(dashboard)/tareas/actions";
import { toast } from "sonner";

interface KanbanBoardProps {
    tareas: any[];
    usuarios: { id: string; nombre: string; apellido: string; rol: string }[];
    currentUserId: string;
    currentUserRol: string;
    currentUserNombre: string;
}

const COLUMNS: { id: EstadoTarea; label: string; icon: any; borderColor: string; badgeColor: string }[] = [
    { id: "pendiente", label: "Pendiente", icon: Circle, borderColor: "border-transparent", badgeColor: "bg-danger/10 text-danger" },
    { id: "en_proceso", label: "En Proceso", icon: Clock, borderColor: "border-transparent", badgeColor: "bg-info/10 text-color-info" },
    { id: "resuelta", label: "Resuelta", icon: CheckCircle2, borderColor: "border-transparent", badgeColor: "bg-success/10 text-color-success" },
];

export function KanbanBoard({ tareas, usuarios, currentUserId, currentUserRol, currentUserNombre }: KanbanBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<"todas" | "mias" | "creadas">("todas");
    const [showAllResueltas, setShowAllResueltas] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    // Filtrado
    const tareasFiltradas = tareas.filter(t => {
        if (filtro === "mias") return t.asignado_id === currentUserId;
        if (filtro === "creadas") return t.creador_id === currentUserId;
        return true;
    });

    const getTareasByEstado = (estado: EstadoTarea) =>
        tareasFiltradas.filter(t => t.estado === estado);

    const activeTarea = tareas.find(t => t.id === activeId);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over) return;

        const tareaId = active.id as string;
        const tarea = tareas.find(t => t.id === tareaId);
        if (!tarea) return;

        // over.id is the column id (estado)
        const nuevoEstado = over.id as string;
        if (nuevoEstado === tarea.estado) return;

        // Validate: only admin or assignee can move
        if (tarea.asignado_id !== currentUserId && currentUserRol !== "admin") {
            toast.error("Solo el asignado o un admin puede mover tareas.");
            return;
        }

        const result = await updateTareaEstado(tareaId, nuevoEstado);
        if (result.error) {
            toast.error(result.error);
        } else {
            const labels: Record<string, string> = { pendiente: "Pendiente", en_proceso: "En Proceso", resuelta: "Resuelta" };
            toast.success(`Tarea movida a ${labels[nuevoEstado] || nuevoEstado}`);
        }
    };

    return (
        <div className="space-y-4">
            {/* Filtro */}
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-text-muted" />
                {[
                    { key: "todas", label: "Todas" },
                    { key: "mias", label: "Asignadas a mí" },
                    { key: "creadas", label: "Creadas por mí" },
                ].map(f => (
                    <button key={f.key}
                        onClick={() => setFiltro(f.key as any)}
                        className={`text-xs px-3 py-1.5 rounded-full transition-colors ${filtro === f.key
                            ? "bg-brand-primary/20 text-brand-primary font-medium"
                            : "text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
                            }`}
                    >{f.label}</button>
                ))}
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    {COLUMNS.map(col => {
                        const columnTareas = getTareasByEstado(col.id);

                        let visibleTareas = columnTareas;
                        if (col.id === "resuelta" && !showAllResueltas) {
                            visibleTareas = columnTareas.slice(0, 3);
                        }

                        const Icon = col.icon;
                        return (
                            <DroppableColumn key={col.id} id={col.id} borderColor={col.borderColor}>
                                <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-4">
                                    <h3 className="font-semibold text-text-primary flex items-center gap-2">
                                        <Icon className={`w-4 h-4 ${col.id === "pendiente" ? "text-danger fill-danger/20" : col.id === "en_proceso" ? "text-color-info" : "text-color-success"}`} />
                                        {col.label}
                                    </h3>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${col.badgeColor}`}>{columnTareas.length}</span>
                                </div>
                                {visibleTareas.map(t => (
                                    <DraggableCard key={t.id} id={t.id}>
                                        <TareaCard
                                            tarea={t}
                                            usuarios={usuarios}
                                            isAsignee={t.asignado_id === currentUserId || currentUserRol === "admin"}
                                            currentUserId={currentUserId}
                                            currentUserNombre={currentUserNombre}
                                            currentUserRol={currentUserRol}
                                        />
                                    </DraggableCard>
                                ))}
                                {col.id === "resuelta" && columnTareas.length > 3 && (
                                    <button
                                        onClick={() => setShowAllResueltas(!showAllResueltas)}
                                        className="w-full mt-2 py-2 text-xs font-semibold text-brand-primary border border-brand-primary/20 rounded-lg hover:bg-brand-primary/10 transition-colors"
                                    >
                                        {showAllResueltas ? "Ocultar Anteriores" : `Mostrar todas (${columnTareas.length})`}
                                    </button>
                                )}
                                {columnTareas.length === 0 && (
                                    <p className="text-xs text-text-muted text-center py-8">
                                        {col.id === "pendiente" ? "Sin tareas pendientes" : col.id === "en_proceso" ? "Sin tareas en proceso" : "Sin tareas resueltas"}
                                    </p>
                                )}
                            </DroppableColumn>
                        );
                    })}
                </div>

                <DragOverlay>
                    {activeTarea && (
                        <div className="opacity-80 rotate-2 scale-105">
                            <TareaCard tarea={activeTarea} usuarios={usuarios} isAsignee={false} />
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

// Droppable Column
import { useDroppable } from "@dnd-kit/core";

function DroppableColumn({ id, children, borderColor }: { id: string; children: React.ReactNode; borderColor: string }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    let bgColor = "bg-bg-tertiary/20";
    if (id === "pendiente") bgColor = "bg-danger/5";
    else if (id === "en_proceso") bgColor = "bg-info/5";
    else if (id === "resuelta") bgColor = "bg-success/5";

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col gap-2 p-3 sm:p-4 rounded-xl min-h-[500px] border ${borderColor} transition-colors ${bgColor} ${isOver ? "ring-2 ring-brand-primary" : ""}`}
        >
            {children}
        </div>
    );
}

// Draggable Card Wrapper
import { useDraggable } from "@dnd-kit/core";

function DraggableCard({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
    const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`touch-none ${isDragging ? "opacity-30" : ""}`}
        >
            {children}
        </div>
    );
}

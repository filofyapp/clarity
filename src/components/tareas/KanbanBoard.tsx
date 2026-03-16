"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { TareaCard, EstadoTarea } from "./TareaCard";
import { Circle, Clock, CheckCircle2, Filter, Flame, Search } from "lucide-react";
import { updateTareaEstado } from "@/app/(dashboard)/tareas/actions";
import { toast } from "sonner";

interface KanbanBoardProps {
    tareas: any[];
    usuarios: { id: string; nombre: string; apellido: string; rol: string }[];
    currentUserId: string;
    currentUserRol: string;
    currentUserNombre: string;
}

const COLUMNS: { id: EstadoTarea; label: string; icon: any; dotColor: string }[] = [
    { id: "pendiente", label: "Pendiente", icon: Circle, dotColor: "bg-amber-500" },
    { id: "en_proceso", label: "En Proceso", icon: Clock, dotColor: "bg-indigo-500" },
    { id: "resuelta", label: "Resuelta", icon: CheckCircle2, dotColor: "bg-emerald-500" },
];

export function KanbanBoard({ tareas, usuarios, currentUserId, currentUserRol, currentUserNombre }: KanbanBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<"todas" | "mias" | "creadas" | "urgentes">("todas");
    const [showAllResueltas, setShowAllResueltas] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    // Filtrado
    const tareasFiltradas = tareas.filter(t => {
        if (filtro === "mias") return t.asignado_id === currentUserId;
        if (filtro === "creadas") return t.creador_id === currentUserId;
        if (filtro === "urgentes") return t.prioridad === "urgente" || t.prioridad === "alfredo";
        return true;
    }).filter(t => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        const matchTitulo = t.titulo?.toLowerCase().includes(q);
        const matchSiniestro = t.caso?.numero_siniestro?.toLowerCase().includes(q);
        return matchTitulo || matchSiniestro;
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

        const nuevoEstado = over.id as string;
        if (nuevoEstado === tarea.estado) return;

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

    const FILTROS = [
        { key: "todas", label: "Todas" },
        { key: "mias", label: "Asignadas a mí" },
        { key: "creadas", label: "Creadas por mí" },
        { key: "urgentes", label: "Urgentes", icon: Flame },
    ];

    return (
        <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
                {FILTROS.map(f => {
                    const isActive = filtro === f.key;
                    const Icon = (f as any).icon;
                    return (
                        <button key={f.key}
                            onClick={() => setFiltro(f.key as any)}
                            className={`text-xs px-3.5 py-1.5 rounded-full transition-all border font-medium flex items-center gap-1.5 ${isActive
                                ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary"
                                : "border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default hover:bg-bg-tertiary"
                                }`}
                        >
                            {Icon && <Icon className="w-3 h-3" />}
                            {f.label}
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input
                    type="text"
                    placeholder="Buscar por título o siniestro..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg-secondary border border-border-subtle rounded-full text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary/40 transition-colors"
                />
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                    {COLUMNS.map((col, colIdx) => {
                        const columnTareas = getTareasByEstado(col.id);

                        let visibleTareas = columnTareas;
                        if (col.id === "resuelta" && !showAllResueltas) {
                            visibleTareas = columnTareas.slice(0, 5);
                        }

                        const Icon = col.icon;
                        return (
                            <DroppableColumn key={col.id} id={col.id} colIdx={colIdx}>
                                <div className="flex items-center justify-between pb-3 mb-2">
                                    <h3 className="font-semibold text-text-primary flex items-center gap-2 text-sm">
                                        <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                                        {col.label}
                                    </h3>
                                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-bg-tertiary text-text-secondary border border-border-subtle">{columnTareas.length}</span>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {visibleTareas.map((t, idx) => (
                                        <DraggableCard key={t.id} id={t.id}>
                                            <div className="animate-card-enter" style={{ animationDelay: `${idx * 50}ms`, opacity: 0 }}>
                                                <TareaCard
                                                    tarea={t}
                                                    usuarios={usuarios}
                                                    isAsignee={t.asignado_id === currentUserId || currentUserRol === "admin"}
                                                    currentUserId={currentUserId}
                                                    currentUserNombre={currentUserNombre}
                                                    currentUserRol={currentUserRol}
                                                />
                                            </div>
                                        </DraggableCard>
                                    ))}
                                </div>
                                {col.id === "resuelta" && columnTareas.length > 5 && (
                                    <button
                                        onClick={() => setShowAllResueltas(!showAllResueltas)}
                                        className="w-full mt-3 py-2 text-xs font-semibold text-brand-primary border border-brand-primary/20 rounded-lg hover:bg-brand-primary/10 transition-colors"
                                    >
                                        {showAllResueltas ? "Ocultar Anteriores" : `Mostrar todas (${columnTareas.length})`}
                                    </button>
                                )}
                                {columnTareas.length === 0 && (
                                    <p className="text-xs text-text-muted text-center py-10">
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

function DroppableColumn({ id, children, colIdx }: { id: string; children: React.ReactNode; colIdx: number }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col p-3 sm:p-4 rounded-[14px] min-h-[400px] bg-bg-secondary border border-border-subtle transition-all animate-card-enter ${isOver ? "ring-2 ring-brand-primary/50 border-brand-primary/30" : ""}`}
            style={{ animationDelay: `${colIdx * 80}ms`, opacity: 0 }}
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

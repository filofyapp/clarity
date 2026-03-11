"use client";

import { AlertCircle, Clock, ChevronRight, CheckCircle2, Link as LinkIcon, MessageSquare, Paperclip, FileIcon, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useState, useTransition, useEffect } from "react";
import { updateTareaEstado, updateTareaAsignado } from "@/app/(dashboard)/tareas/actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ComentariosTarea } from "./ComentariosTarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EstadoBadge } from "@/components/casos/EstadoBadge";
import { TimelineExpediente } from "@/components/casos/TimelineExpediente";
import { Trash2 } from "lucide-react";

import { TareaForm } from "./TareaForm";

export type EstadoTarea = "pendiente" | "en_proceso" | "resuelta";
export type PrioridadTarea = "baja" | "normal" | "alta" | "urgente" | "alfredo";

interface TareaData {
    id: string;
    titulo: string;
    descripcion: string | null;
    estado: EstadoTarea;
    prioridad: PrioridadTarea;
    fecha_vencimiento: string | null;
    created_at: string;
    caso_id: string | null;
    creador: { nombre: string; apellido: string } | null;
    asignado: { nombre: string; apellido: string } | null;
    caso?: {
        id: string;
        numero_siniestro: string;
        marca: string | null;
        compania: { nombre: string } | null;
        nombre_asegurado: string | null;
        telefono_asegurado: string | null;
        dominio: string | null;
        estado: string;
    } | null;
    comentarios_tarea?: { usuario_id: string }[];
    adjuntos?: any[];
    asignado_id?: string | null;
    creador_id?: string;
    tarea_asignaciones?: {
        usuario_id: string;
        usuario: { nombre: string; apellido: string; avatar_url: string | null };
    }[];
}

interface TareaCardProps {
    tarea: TareaData;
    usuarios?: { id: string; nombre: string; apellido: string; rol: string }[];
    isAsignee: boolean;
    currentUserId?: string;
    currentUserNombre?: string;
    currentUserRol?: string;
}

const getPrioridadColor = (prioridad: PrioridadTarea) => {
    switch (prioridad) {
        case "alfredo": return "bg-bg-tertiary text-danger border-danger font-bold uppercase tracking-wider animate-pulse-border";
        case "urgente": return "bg-danger text-white border-danger";
        case "alta": return "bg-color-warning text-bg-primary border-color-warning";
        case "normal": return "bg-color-info text-white border-color-info";
        case "baja": return "bg-color-success text-white border-color-success";
        default: return "bg-bg-tertiary text-text-primary";
    }
};

const getStatusColors = (estado: EstadoTarea) => {
    switch (estado) {
        case "pendiente": return { bg: "bg-danger/5 hover:bg-danger/10", border: "border-danger/20", line: "border-l-danger" };
        case "en_proceso": return { bg: "bg-info/5 hover:bg-info/10", border: "border-info/20", line: "border-l-color-info" };
        case "resuelta": return { bg: "bg-success/5 hover:bg-success/10", border: "border-success/20", line: "border-l-color-success" };
    }
};

export function TareaCard({ tarea, usuarios, isAsignee, currentUserId, currentUserNombre, currentUserRol }: TareaCardProps) {
    const [isPending, startTransition] = useTransition();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);
    const [panelWidth, setPanelWidth] = useState(600);
    const [isChangingAsignado, setIsChangingAsignado] = useState(false);

    const hasOtrasRespuestas = tarea.comentarios_tarea?.some(
        (c: { usuario_id: string }) => c.usuario_id !== tarea.creador_id && c.usuario_id !== currentUserId
    );

    const handleAssigneeChange = (newId: string) => {
        setIsChangingAsignado(false);
        if (newId === tarea.asignado_id) return;
        startTransition(async () => {
            const result = await updateTareaAsignado(tarea.id, newId);
            if (result.error) toast.error(result.error);
            else toast.success("Responsable actualizado");
        });
    };

    useEffect(() => {
        const saved = localStorage.getItem("clarity_task_panel_width");
        if (saved) setPanelWidth(Number(saved));
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = panelWidth;
        const onMouseMove = (moveEvent: MouseEvent) => {
            const delta = startX - moveEvent.clientX; // Dragging left increases width since sidebar is on the right
            const newWidth = Math.max(500, Math.min(window.innerWidth * 0.9, startWidth + delta));
            setPanelWidth(newWidth);
        };
        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    useEffect(() => {
        if (panelWidth !== 600) localStorage.setItem("clarity_task_panel_width", String(panelWidth));
    }, [panelWidth]);

    const handleAvanzarEstado = () => {
        let nextEstado: EstadoTarea | null = null;
        if (tarea.estado === "pendiente") nextEstado = "en_proceso";
        else if (tarea.estado === "en_proceso") nextEstado = "resuelta";

        if (!nextEstado) return;

        startTransition(async () => {
            const result = await updateTareaEstado(tarea.id, nextEstado!);
            if (result.error) {
                toast.error(result.error);
            } else {
                const labels: Record<string, string> = { en_proceso: "En Proceso", resuelta: "Resuelta" };
                toast.success(`Tarea movida a ${labels[nextEstado!] || nextEstado}`);
            }
        });
    };

    const handleDelete = () => {
        if (!confirm("¿Seguro que querés eliminar esta tarea? Se borrarán sus comentarios y adjuntos.")) return;
        startTransition(async () => {
            const { deleteTarea } = await import("@/app/(dashboard)/tareas/actions");
            const result = await deleteTarea(tarea.id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Tarea eliminada");
            }
        });
    };

    return (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <div
                onClick={() => setSheetOpen(true)}
                className={`group relative border-l-4 ${tarea.prioridad === "alfredo" ? "border-l-red-500 bg-bg-primary border-y border-r border-red-500/50 shadow-sm animate-pulse-border" : `${getStatusColors(tarea.estado).line} border-y border-r ${getStatusColors(tarea.estado).border} ${getStatusColors(tarea.estado).bg}`} rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col p-3 gap-2 ${isChangingAsignado ? "z-50" : ""}`}
            >
                {/* 1. Siniestro & Acciones Rápidas Ocultas */}
                <div className="flex justify-between items-start w-full">
                    {tarea.caso_id ? (
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="z-10"
                        >
                            <Link href={`/casos/${tarea.caso_id}`} className="flex items-center gap-1 text-[10px] text-brand-secondary hover:underline w-fit">
                                <LinkIcon className="w-3 h-3" />
                                <span className="font-semibold uppercase font-mono tracking-wider">{tarea.caso?.numero_siniestro || "..."}</span>
                            </Link>
                        </div>
                    ) : (
                        <span className="text-[10px] text-text-muted italic">Sin siniestro vinculado</span>
                    )}

                    {/* Acciones Hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => e.stopPropagation()}>
                        {usuarios && currentUserId && (
                            <TareaForm
                                usuarios={usuarios}
                                tareaEdit={{ ...tarea }}
                                triggerNode={
                                    <button className="text-text-muted hover:text-brand-primary p-1 bg-bg-secondary hover:bg-brand-primary/10 rounded-md transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"></path></svg>
                                    </button>
                                }
                            />
                        )}
                        {isAsignee && tarea.estado !== "resuelta" && (
                            <button
                                onClick={handleAvanzarEstado}
                                disabled={isPending}
                                className="text-text-muted hover:text-color-success p-1.5 bg-bg-secondary hover:bg-color-success/10 rounded-md transition-colors"
                                title={tarea.estado === "pendiente" ? "Tomar Tarea" : "Resolver Tarea"}
                            >
                                <CheckCircle2 className="w-4 h-4" />
                            </button>
                        )}
                        {(currentUserRol === "admin" || currentUserId === tarea.creador_id) && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                                disabled={isPending}
                                className="text-text-muted hover:text-danger p-1.5 bg-bg-secondary hover:bg-danger/10 rounded-md transition-colors ml-1"
                                title="Eliminar tarea"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
                {/* 2. Título & Urgencia */}
                <div className="flex items-start gap-2 pr-2 mt-1">
                    <h4 className="font-bold text-text-primary text-[14px] leading-snug flex-1">{tarea.titulo}</h4>
                    <Badge variant="outline" className={`capitalize text-[10px] px-2 py-0 border-none h-5 flex items-center shrink-0 shadow-sm ${getPrioridadColor(tarea.prioridad)}`}>
                        {tarea.prioridad === "alfredo" && "🔥 "}{tarea.prioridad}
                    </Badge>
                </div>

                {/* 3. Extracto Descripción */}
                {tarea.descripcion && (
                    <p className="text-[12px] text-text-muted line-clamp-2 leading-relaxed mt-1">
                        {tarea.descripcion}
                    </p>
                )}

                {/* 4. Fecha, Creador (Texto sutil) y Avatar de Asignado */}
                <div className="flex justify-between items-end pt-3 mt-auto">
                    <div className="flex items-center gap-2 text-[11px] text-text-muted/80">
                        <span className="flex items-center gap-0.5" title="Fecha de creación">
                            <Clock className="w-3 h-3" /> {format(new Date(tarea.created_at), "dd/MM HH:mm")}
                        </span>
                    </div>

                    <div className="flex gap-2 items-center" title={tarea.asignado ? `Asignado a: ${tarea.asignado.nombre}` : 'Sin asignar'}>
                        {hasOtrasRespuestas && (
                            <div className="flex items-center justify-center bg-brand-primary/10 text-brand-primary rounded-full w-5 h-5 mx-1" title="Nuevas respuestas">
                                <MessageSquare className="w-3 h-3" />
                            </div>
                        )}
                        {tarea.adjuntos && tarea.adjuntos.length > 0 && (
                            <div className="flex items-center gap-0.5 text-text-muted text-[10px]" title={`${tarea.adjuntos.length} adjuntos`}>
                                <Paperclip className="w-3 h-3" /> {tarea.adjuntos.length}
                            </div>
                        )}

                        <div className="relative" onClick={(e) => { e.stopPropagation(); setIsChangingAsignado(!isChangingAsignado); }}>
                            {tarea.tarea_asignaciones && tarea.tarea_asignaciones.length > 0 ? (
                                <div className="flex -space-x-2">
                                    {tarea.tarea_asignaciones.map((asig, i) => (
                                        <div key={asig.usuario_id} className={`h-6 w-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-medium text-[9px] uppercase border border-bg-primary shadow-sm z-[${10 - i}] cursor-pointer hover:scale-110 transition-transform`} title={`${asig.usuario.nombre} ${asig.usuario.apellido}`}>
                                            {asig.usuario.nombre?.charAt(0)}{asig.usuario.apellido?.charAt(0)}
                                        </div>
                                    ))}
                                </div>
                            ) : tarea.asignado ? (
                                <div className="h-6 px-2 rounded-full bg-brand-primary/10 flex items-center gap-1.5 text-brand-primary font-medium text-[10px] border border-brand-primary/20 shadow-sm cursor-pointer hover:bg-brand-primary/20 transition-all">
                                    <div className="w-4 h-4 rounded-full bg-brand-primary/20 flex items-center justify-center text-[8px] font-bold uppercase shrink-0">
                                        {tarea.asignado.nombre?.charAt(0)}{tarea.asignado.apellido?.charAt(0)}
                                    </div>
                                    <span className="truncate max-w-[80px]">{tarea.asignado.nombre}</span>
                                </div>
                            ) : (
                                <div className="h-6 px-2 rounded-full bg-bg-secondary flex items-center gap-1.5 text-text-muted text-[10px] border border-border border-dashed cursor-pointer hover:bg-bg-tertiary transition-all">
                                    <div className="w-4 h-4 rounded-full bg-bg-tertiary flex items-center justify-center text-[8px] font-bold shrink-0">?</div>
                                    <span>Sin asignar</span>
                                </div>
                            )}

                            {isChangingAsignado && usuarios && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-bg-primary border border-border rounded-lg shadow-xl z-50 py-1 overflow-hidden" onClick={e => e.stopPropagation()}>
                                    <div className="px-3 py-2 text-[10px] font-semibold text-text-muted border-b border-border bg-bg-secondary uppercase tracking-wider">
                                        Reasignar Tarea
                                    </div>
                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                        {usuarios.map(u => (
                                            <button
                                                key={u.id}
                                                onClick={() => handleAssigneeChange(u.id)}
                                                className={`w-full text-left px-3 py-2 text-xs hover:bg-bg-tertiary transition-colors flex items-center gap-2 ${u.id === tarea.asignado_id ? 'text-brand-primary bg-brand-primary/5 font-medium' : 'text-text-primary'}`}
                                            >
                                                <div className="w-5 h-5 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-[9px] uppercase shrink-0">
                                                    {u.nombre.charAt(0)}{u.apellido.charAt(0)}
                                                </div>
                                                <span className="truncate">{u.nombre} {u.apellido}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Detalle (Sheet) */}
            <SheetContent
                className="w-full sm:max-w-none p-0 flex flex-col bg-bg-primary border-l border-border"
                side="right"
                onClick={e => e.stopPropagation()}
                onPointerDown={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                style={{ maxWidth: panelWidth > 0 ? `${panelWidth}px` : '600px' }}
            >
                {/* Agarrador para resize */}
                <div
                    onMouseDown={handleMouseDown}
                    className="absolute left-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-brand-primary/20 transition-colors z-50 group/resizer flex items-center justify-center"
                >
                    <div className="h-12 w-0.5 bg-border group-hover/resizer:bg-text-muted rounded-full transition-colors" />
                </div>

                <SheetHeader className="px-6 py-4 border-b border-border bg-bg-secondary space-y-1 shrink-0">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-bold text-text-primary pr-4">{tarea.titulo}</SheetTitle>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {format(new Date(tarea.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                        </span>
                        {tarea.asignado && (
                            <span className="border-l border-border pl-2">
                                Responsable: <strong className="text-text-primary font-medium">{tarea.asignado.nombre}</strong>
                            </span>
                        )}
                    </div>
                </SheetHeader>

                <div className="flex-1 flex flex-col min-h-0 relative">
                    {/* Descripción completa en Modal */}
                    {tarea.descripcion && (
                        <div className="bg-bg-tertiary p-4 rounded-lg border border-border mx-6 mt-4 mb-2 text-sm text-text-muted whitespace-pre-line leading-relaxed shrink-0 max-h-[30vh] overflow-y-auto">
                            {tarea.descripcion}
                        </div>
                    )}

                    {/* Adjuntos en el modal */}
                    {tarea.adjuntos && tarea.adjuntos.length > 0 && (
                        <div className="mx-6 mb-4 mt-2 shrink-0">
                            <h4 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1">
                                <Paperclip className="w-3 h-3" /> Archivos Adjuntos ({tarea.adjuntos.length})
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {tarea.adjuntos.map((adj: any, idx: number) => (
                                    <a
                                        key={idx}
                                        href={adj.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 rounded-md bg-bg-secondary border border-border hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-colors group"
                                    >
                                        {adj.type?.startsWith('image/') ? (
                                            <div className="w-8 h-8 rounded shrink-0 bg-bg-tertiary overflow-hidden flex items-center justify-center border border-border">
                                                <img src={adj.url} alt={adj.name} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded shrink-0 bg-bg-tertiary flex items-center justify-center border border-border text-brand-secondary">
                                                <FileIcon className="w-4 h-4" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-medium text-text-primary truncate group-hover:text-brand-primary transition-colors">{adj.name}</p>
                                            <p className="text-[9px] text-text-muted">{(adj.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div className="px-6 border-b border-border bg-bg-secondary shrink-0">
                            <TabsList className="bg-transparent border-none h-12 w-full justify-start gap-4 space-x-0 p-0">
                                <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 font-medium">
                                    Conversación
                                </TabsTrigger>
                                {tarea.caso && (
                                    <TabsTrigger value="siniestro" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 font-medium">
                                        Siniestro
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </div>

                        <TabsContent value="chat" className="flex-1 m-0 data-[state=active]:flex flex-col min-h-0 overflow-hidden">
                            <ComentariosTarea
                                tareaId={tarea.id}
                                currentUserId={currentUserId!}
                                currentUserNombre={currentUserNombre!}
                            />
                        </TabsContent>

                        {tarea.caso && (
                            <TabsContent value="siniestro" className="flex-1 m-0 data-[state=active]:flex flex-col p-6 min-h-0 overflow-hidden">
                                <ScrollArea className="flex-1 py-1">
                                    <div className="space-y-6">
                                        <div className="bg-bg-tertiary p-4 rounded-lg border border-border">
                                            <h3 className="font-semibold text-text-primary text-sm mb-4">Datos del Vehículo</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-text-muted mb-1">Vehículo / Modelo</p>
                                                    <p className="text-sm font-medium text-text-primary">{tarea.caso.marca || "-"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-text-muted mb-1">Patente / Dominio</p>
                                                    <p className="text-sm font-medium text-text-primary uppercase tracking-wider">{tarea.caso.dominio || "-"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-text-muted mb-1">Compañía</p>
                                                    <p className="text-sm font-medium text-text-primary">{tarea.caso.compania?.nombre || "No especificada"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-text-muted mb-1">Número de Siniestro</p>
                                                    <p className="text-sm font-mono text-brand-primary font-medium">{tarea.caso.numero_siniestro}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-bg-tertiary p-4 rounded-lg border border-border">
                                            <h3 className="font-semibold text-text-primary text-sm mb-4">Línea de Tiempo del Historial</h3>
                                            <TimelineExpediente casoId={tarea.caso.id} />
                                        </div>

                                        <div className="pt-4 flex justify-between items-center border-t border-border">
                                            <div>
                                                <p className="text-xs text-text-muted mb-1">Estado de Expediente</p>
                                                <EstadoBadge estado={tarea.caso.estado} />
                                            </div>
                                            <Link href={`/casos/${tarea.caso.id}`}>
                                                <button className="text-brand-primary hover:bg-brand-primary/10 px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1">
                                                    Ir al Expediente Completo <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        )}
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}

"use client";

import { AlertCircle, Clock, ChevronRight, CheckCircle2, Link as LinkIcon, MessageSquare, Paperclip, FileIcon, ImageIcon, SmilePlus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateTareaEstado, updateTareaAsignado } from "@/app/(dashboard)/tareas/actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ComentariosTarea } from "./ComentariosTarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EstadoBadge } from "@/components/casos/EstadoBadge";
import { TimelineExpediente } from "@/components/casos/TimelineExpediente";
import { ImageLightbox, type LightboxImage } from "@/components/ui/ImageLightbox";
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

// Priority border color for left stripe
const getPrioridadBorderColor = (prioridad: PrioridadTarea) => {
    switch (prioridad) {
        case "alfredo": return "border-l-red-500";
        case "urgente": return "border-l-red-500";
        case "alta": return "border-l-amber-500";
        default: return "border-l-transparent";
    }
};

// Priority badge styles
const getPrioridadBadge = (prioridad: PrioridadTarea) => {
    switch (prioridad) {
        case "alfredo": return "bg-red-500/10 text-red-400 border-red-500/20";
        case "urgente": return "bg-red-500/10 text-red-400 border-red-500/20";
        case "alta": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
        case "normal": return "bg-brand-primary/10 text-brand-primary border-brand-primary/20";
        case "baja": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        default: return "bg-bg-tertiary text-text-muted border-border-subtle";
    }
};

// Avatar color pool (deterministic by name)
const AVATAR_COLORS = [
    "bg-amber-600", "bg-indigo-600", "bg-emerald-600", "bg-rose-600",
    "bg-cyan-600", "bg-violet-600", "bg-orange-600", "bg-teal-600",
];
const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// Age helper
const getAge = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 1) return "Ahora";
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
};

const isOverdue = (tarea: TareaData) => {
    const diffMs = Date.now() - new Date(tarea.created_at).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (tarea.estado === "pendiente" && days > 3) return true;
    if (tarea.estado === "en_proceso" && days > 5) return true;
    return false;
};

export function TareaCard({ tarea, usuarios, isAsignee, currentUserId, currentUserNombre, currentUserRol }: TareaCardProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [panelWidth, setPanelWidth] = useState(600);
    const [isChangingAsignado, setIsChangingAsignado] = useState(false);

    // Lightbox state for task attachments
    const [lightboxImages, setLightboxImages] = useState<LightboxImage[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    // Emoji reactions on task description
    const EMOJI_SET = ["👍", "✅", "👀", "🙏", "❤️", "😂", "⚠️", "🔥"];
    const [descReacciones, setDescReacciones] = useState<{ id: string; tarea_id: string; usuario_id: string; emoji: string; usuario?: { nombre: string; apellido: string } | null }[]>([]);
    const [showDescEmojiPicker, setShowDescEmojiPicker] = useState(false);
    const [isDescHovered, setIsDescHovered] = useState(false);

    // Auto-open if URL param matches this task ID
    useEffect(() => {
        const urlTareaId = searchParams.get("tareaId");
        if (urlTareaId === tarea.id && !sheetOpen) {
            setSheetOpen(true);
            // Clean up the URL to prevent reopening on subsequent navigations
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete("tareaId");
            router.replace(newUrl.pathname + newUrl.search, { scroll: false });
        }
    }, [searchParams, tarea.id, sheetOpen, router]);

    const [lastReadAt, setLastReadAt] = useState<number>(() => {
        if (typeof window !== "undefined" && currentUserId) {
            const stored = localStorage.getItem(`clarity_read_tarea_${tarea.id}_${currentUserId}`);
            if (stored) return parseInt(stored, 10);
        }
        return 0; // Se asume no leída si no hay registro
    });

    useEffect(() => {
        if (sheetOpen && currentUserId) {
            const now = Date.now();
            localStorage.setItem(`clarity_read_tarea_${tarea.id}_${currentUserId}`, now.toString());
            setLastReadAt(now);
        }
    }, [sheetOpen, tarea.id, currentUserId]);

    const hasUnread = tarea.comentarios_tarea?.some(
        (c: { usuario_id: string; created_at?: string }) => 
            c.usuario_id !== currentUserId && 
            c.created_at && 
            new Date(c.created_at).getTime() > lastReadAt
    );

    const supabase = createClient();

    // Fetch description reactions when sheet opens
    useEffect(() => {
        if (!sheetOpen) return;
        async function fetchDescReacciones() {
            const { data } = await supabase
                .from("reacciones_tarea")
                .select("id, tarea_id, usuario_id, emoji, usuario:usuarios(nombre, apellido)")
                .eq("tarea_id", tarea.id);
            if (data) setDescReacciones(data as any);
        }
        fetchDescReacciones();
    }, [sheetOpen, tarea.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Toggle emoji reaction on description
    const toggleDescReaccion = async (emoji: string) => {
        const existing = descReacciones.find(
            r => r.emoji === emoji && r.usuario_id === currentUserId
        );
        if (existing) {
            await supabase.from("reacciones_tarea").delete().eq("id", existing.id);
            setDescReacciones(prev => prev.filter(r => r.id !== existing.id));
        } else {
            const { data } = await supabase.from("reacciones_tarea").insert({
                tarea_id: tarea.id,
                usuario_id: currentUserId,
                emoji
            }).select("id, tarea_id, usuario_id, emoji").single();
            if (data) {
                setDescReacciones(prev => [...prev, { ...data, usuario: { nombre: currentUserNombre?.split(" ")[0] || "Yo", apellido: currentUserNombre?.split(" ").slice(1).join(" ") || "" } } as any]);
            }
        }
        setShowDescEmojiPicker(false);
    };

    // Group description reactions for display
    const descReaccionGroups = (() => {
        const groups: Record<string, { emoji: string; count: number; users: string[]; hasOwn: boolean }> = {};
        for (const r of descReacciones) {
            if (!groups[r.emoji]) groups[r.emoji] = { emoji: r.emoji, count: 0, users: [], hasOwn: false };
            groups[r.emoji].count++;
            const nombre = r.usuario ? `${r.usuario.nombre} ${r.usuario.apellido}` : "Usuario";
            groups[r.emoji].users.push(nombre);
            if (r.usuario_id === currentUserId) groups[r.emoji].hasOwn = true;
        }
        return Object.values(groups);
    })();

    // Open lightbox for task attachments
    const openAttachmentLightbox = (adjuntos: any[], index: number) => {
        const images = adjuntos
            .filter((a: any) => a.type?.startsWith("image/"))
            .map((a: any) => ({ url: a.url, nombre: a.name }));
        setLightboxImages(images);
        setLightboxIndex(index);
        setLightboxOpen(true);
    };
    const totalComments = tarea.comentarios_tarea?.length || 0;

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
            const delta = startX - moveEvent.clientX;
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
            if (result.error) toast.error(result.error);
            else toast.success("Tarea eliminada");
        });
    };

    const isResuelta = tarea.estado === "resuelta";
    const assigneeName = tarea.asignado ? `${tarea.asignado.nombre} ${tarea.asignado.apellido}` : "";
    const assigneeInitials = tarea.asignado
        ? `${tarea.asignado.nombre?.charAt(0) || ""}${tarea.asignado.apellido?.charAt(0) || ""}`.toUpperCase()
        : "?";

    return (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            {/* ═══════ CARD (Compact, redesigned) ═══════ */}
            <div
                onClick={() => setSheetOpen(true)}
                className={`group relative rounded-lg border border-border-subtle transition-all duration-200 cursor-pointer flex flex-col p-3 gap-2
                    ${isResuelta
                        ? "opacity-60 hover:opacity-85 bg-bg-secondary border-l-[3px] border-l-transparent"
                        : `bg-bg-secondary hover:bg-bg-surface hover:border-border-hover hover:-translate-y-[1px] hover:shadow-md border-l-[3px] ${tarea.prioridad === "alfredo" ? "border-l-red-500 animate-pulse-border" : getPrioridadBorderColor(tarea.prioridad)}`
                    }
                    ${isChangingAsignado ? "z-50" : ""}`}
            >
                {/* Row 1: Siniestro prominente + Quick Actions */}
                <div className="flex justify-between items-start w-full">
                    {tarea.caso_id ? (
                        <div onClick={(e) => e.stopPropagation()} className="z-10 flex flex-col">
                            <Link href={`/casos/${tarea.caso_id}`} className="flex items-center gap-1.5 text-accent-text hover:underline w-fit">
                                <LinkIcon className="w-4 h-4" />
                                <span className="font-bold font-mono text-base tracking-wide">{tarea.caso?.numero_siniestro || "..."}</span>
                            </Link>
                        </div>
                    ) : (
                        <span className="text-[11px] text-text-muted italic">Sin siniestro vinculado</span>
                    )}

                    {/* Quick Actions (hover only) */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => e.stopPropagation()}>
                        {usuarios && currentUserId && (
                            <TareaForm
                                usuarios={usuarios}
                                tareaEdit={{ ...tarea }}
                                triggerNode={
                                    <button className="text-text-muted hover:text-brand-primary p-1.5 hover:bg-brand-primary/10 rounded-md transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"></path></svg>
                                    </button>
                                }
                            />
                        )}
                        {isAsignee && tarea.estado !== "resuelta" && (
                            <button onClick={handleAvanzarEstado} disabled={isPending}
                                className="text-text-muted hover:text-emerald-500 p-1.5 hover:bg-emerald-500/10 rounded-md transition-colors"
                                title={tarea.estado === "pendiente" ? "Tomar Tarea" : "Resolver Tarea"}>
                                <CheckCircle2 className="w-4 h-4" />
                            </button>
                        )}
                        {(currentUserRol === "admin" || currentUserId === tarea.creador_id) && (
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} disabled={isPending}
                                className="text-text-muted hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-md transition-colors"
                                title="Eliminar tarea">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Row 2: Title */}
                <h4 className={`font-semibold text-[13px] leading-snug line-clamp-2 ${isResuelta ? "line-through text-text-muted" : "text-text-primary"}`}>
                    {tarea.titulo}
                </h4>

                {/* Row 3: Description (1 line, hidden for resuelta) */}
                {tarea.descripcion && !isResuelta && (
                    <p className="text-[12px] text-text-muted line-clamp-1 leading-relaxed">{tarea.descripcion}</p>
                )}

                {/* Row 4: Footer */}
                <div className="flex justify-between items-center pt-2 mt-auto border-t border-border-subtle/50">
                    {/* Left: metadata */}
                    <div className="flex items-center gap-3 text-[11px] text-text-muted">
                        {isResuelta ? (
                            <span className="flex items-center gap-1 text-emerald-500">
                                <CheckCircle2 className="w-3 h-3" />
                                Resuelta {format(new Date(tarea.created_at), "dd/MM")}
                            </span>
                        ) : (
                            <span className={`flex items-center gap-1 ${isOverdue(tarea) ? "text-red-400 font-semibold" : ""}`}>
                                <Clock className="w-3 h-3" />
                                {getAge(tarea.created_at)}
                            </span>
                        )}

                        {totalComments > 0 && (
                            <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {totalComments}
                                {hasUnread && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse-dot inline-block" />
                                )}
                            </span>
                        )}

                        {tarea.adjuntos && tarea.adjuntos.length > 0 && (
                            <span className="flex items-center gap-1">
                                <Paperclip className="w-3 h-3" />
                                {tarea.adjuntos.length}
                            </span>
                        )}
                    </div>

                    {/* Right: priority badge + avatar */}
                    <div className="flex items-center gap-2">
                        {!isResuelta && (
                            <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${getPrioridadBadge(tarea.prioridad)}`}>
                                {tarea.prioridad === "alfredo" && "🔥 "}{tarea.prioridad}
                            </span>
                        )}

                        <div className="relative" onClick={(e) => { e.stopPropagation(); setIsChangingAsignado(!isChangingAsignado); }}>
                            <div className="flex flex-col items-center gap-1 cursor-pointer hover:scale-105 transition-transform" title={tarea.asignado ? assigneeName : "Sin asignar"}>
                                <div
                                    className={`px-2.5 py-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white max-w-[80px] ${tarea.asignado ? getAvatarColor(assigneeName) : "bg-bg-tertiary text-text-muted border border-dashed border-border-default"}`}
                                >
                                    <span className="truncate">{tarea.asignado ? tarea.asignado.nombre : "Asignar"}</span>
                                </div>
                            </div>

                            {isChangingAsignado && usuarios && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 py-1 overflow-hidden" onClick={e => e.stopPropagation()}>
                                    <div className="px-3 py-2 text-[10px] font-semibold text-text-muted border-b border-border-subtle bg-bg-tertiary uppercase tracking-wider">
                                        Reasignar Tarea
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {usuarios.map(u => (
                                            <button key={u.id} onClick={() => handleAssigneeChange(u.id)}
                                                className={`w-full text-left px-3 py-2 text-xs hover:bg-bg-tertiary transition-colors flex items-center gap-2 ${u.id === tarea.asignado_id ? 'text-brand-primary bg-brand-primary/5 font-medium' : 'text-text-primary'}`}>
                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-white uppercase shrink-0 ${getAvatarColor(`${u.nombre} ${u.apellido}`)}`}>
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

            {/* ═══════ SHEET (Detail Panel — unchanged) ═══════ */}
            <SheetContent
                className="w-full sm:max-w-none p-0 flex flex-col bg-bg-primary border-l border-border h-[100dvh] overflow-hidden"
                side="right"
                onClick={e => e.stopPropagation()}
                onPointerDown={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                style={{ maxWidth: panelWidth > 0 ? `${panelWidth}px` : '600px' }}
            >
                {/* Resize handle */}
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

                <div className="flex-1 overflow-y-auto flex flex-col w-full relative">
                    {/* Full description */}
                    {tarea.descripcion && (
                        <div
                            className="relative mx-6 mt-4 mb-2 group/desc"
                            onMouseEnter={() => setIsDescHovered(true)}
                            onMouseLeave={() => { setIsDescHovered(false); setShowDescEmojiPicker(false); }}
                        >
                            <div className="bg-bg-tertiary p-4 rounded-lg border border-border text-sm text-text-primary whitespace-pre-line leading-relaxed shrink-0 max-h-[40vh] overflow-y-auto">
                                {tarea.descripcion}
                            </div>

                            {/* Emoji reaction pills below description */}
                            {descReaccionGroups.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {descReaccionGroups.map(g => (
                                        <button
                                            key={g.emoji}
                                            onClick={() => toggleDescReaccion(g.emoji)}
                                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors cursor-pointer
                                                ${g.hasOwn
                                                    ? "bg-brand-primary/15 border-brand-primary/40 text-brand-primary"
                                                    : "bg-bg-tertiary border-border-subtle text-text-muted hover:border-border"
                                                }`}
                                            title={g.users.join(", ")}
                                        >
                                            <span>{g.emoji}</span>
                                            <span className="text-[10px] font-medium">{g.count}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Hover emoji button */}
                            {isDescHovered && (
                                <div className="absolute -top-3 right-2 z-20">
                                    <button
                                        onClick={() => setShowDescEmojiPicker(!showDescEmojiPicker)}
                                        className="p-1 rounded-full bg-bg-secondary border border-border shadow-md hover:bg-bg-tertiary transition-colors"
                                        title="Reaccionar"
                                    >
                                        <SmilePlus className="w-3.5 h-3.5 text-text-muted" />
                                    </button>
                                </div>
                            )}

                            {/* Emoji picker popover */}
                            {showDescEmojiPicker && (
                                <div className="absolute right-2 -top-10 z-30 bg-bg-elevated border border-border rounded-lg shadow-xl p-1.5 flex gap-0.5 animate-in fade-in zoom-in-95 duration-150">
                                    {EMOJI_SET.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => toggleDescReaccion(emoji)}
                                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-tertiary transition-colors text-base hover:scale-125"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Attachments */}
                    {tarea.adjuntos && tarea.adjuntos.length > 0 && (
                        <div className="mx-6 mb-4 mt-2 shrink-0">
                            <h4 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1">
                                <Paperclip className="w-3 h-3" /> Archivos Adjuntos ({tarea.adjuntos.length})
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {tarea.adjuntos.map((adj: any, idx: number) => {
                                    const isImage = adj.type?.startsWith('image/');
                                    const imageAdjuntos = tarea.adjuntos!.filter((a: any) => a.type?.startsWith('image/'));
                                    const imageIdx = isImage ? imageAdjuntos.indexOf(adj) : -1;
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => isImage ? openAttachmentLightbox(tarea.adjuntos!, imageIdx >= 0 ? imageIdx : 0) : window.open(adj.url, '_blank')}
                                            className="flex items-center gap-2 p-2 rounded-md bg-bg-secondary border border-border hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-colors group cursor-pointer"
                                        >
                                            {isImage ? (
                                                <div className="w-8 h-8 rounded shrink-0 bg-bg-tertiary overflow-hidden flex items-center justify-center border border-border">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
                        <div className="px-6 border-b border-border bg-bg-secondary shrink-0 pt-2 sticky top-0 z-10">
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

                        <TabsContent value="chat" className="flex-1 m-0 data-[state=active]:flex flex-col min-h-0">
                            <div className="flex-1 flex flex-col">
                                <ComentariosTarea
                                    tareaId={tarea.id}
                                    currentUserId={currentUserId!}
                                    currentUserNombre={currentUserNombre!}
                                />
                            </div>
                        </TabsContent>

                        {tarea.caso && (
                            <TabsContent value="siniestro" className="flex-1 m-0 data-[state=active]:flex flex-col p-6 min-h-0">
                                <div className="flex-1">
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

                                        <div className="pt-4 flex justify-between items-center border-t border-border mt-4 pb-2">
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
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>
                </div>
            </SheetContent>

            {/* Unified Lightbox for task attachments */}
            <ImageLightbox
                images={lightboxImages}
                initialIndex={lightboxIndex}
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />
        </Sheet>
    );
}

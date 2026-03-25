"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Loader2, Paperclip, X, FileIcon, Image as ImageIcon, Download, SmilePlus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ImageLightbox, type LightboxImage } from "@/components/ui/ImageLightbox";

// === Emoji Reactions ===
const EMOJI_SET = ["👍", "✅", "👀", "🙏", "❤️", "😂", "⚠️", "🔥"];

interface Reaccion {
    id: string;
    comentario_id: string;
    usuario_id: string;
    emoji: string;
    usuario?: { nombre: string; apellido: string } | null;
}

interface ReaccionGroup {
    emoji: string;
    count: number;
    users: string[];
    hasOwn: boolean;
}

interface ComentariosTareaProps {
    tareaId: string;
    currentUserId: string;
    currentUserNombre: string;
}

interface Comentario {
    id: string;
    contenido: string;
    created_at: string;
    adjuntos?: any[] | null;
    usuario: { nombre: string; apellido: string } | null;
    usuario_id: string;
    reacciones?: Reaccion[];
}

interface UsuarioMencion {
    id: string;
    nombre: string;
    apellido: string;
    rol: string;
}

export function ComentariosTarea({ tareaId, currentUserId, currentUserNombre }: ComentariosTareaProps) {
    const supabase = createClient();
    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [loading, setLoading] = useState(true);
    const [nuevoComentario, setNuevoComentario] = useState("");
    const [enviando, setEnviando] = useState(false);

    // Adjuntos state
    const [archivosPendientes, setArchivosPendientes] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const endRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Mentions state
    const [usuarios, setUsuarios] = useState<UsuarioMencion[]>([]);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState("");
    const [mentionIndex, setMentionIndex] = useState(0);

    // Lightbox / Image Viewer state
    const [lightboxImages, setLightboxImages] = useState<LightboxImage[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    // Emoji reactions state
    const [reaccionesMap, setReaccionesMap] = useState<Record<string, Reaccion[]>>({});
    const [hoveredComment, setHoveredComment] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

    // Fetch users for mentions (once)
    useEffect(() => {
        async function fetchUsuarios() {
            const { data } = await supabase
                .from("usuarios")
                .select("id, nombre, apellido, rol")
                .eq("activo", true)
                .order("nombre");
            if (data) setUsuarios(data);
        }
        fetchUsuarios();
    }, []);

    // Fetch comentarios
    const fetchComentarios = useCallback(async (isInitial = true) => {
        if (isInitial) setLoading(true);
        const { data, error } = await supabase
            .from("comentarios_tarea")
            .select("id, contenido, created_at, adjuntos, usuario_id, usuario:usuarios(nombre, apellido)")
            .eq("tarea_id", tareaId)
            .order("created_at", { ascending: true });

        if (!error && data) {
            setComentarios(data as any);
            await marcarLeidos(data.map((c: any) => c.id));
            // Fetch reactions for all comments
            await fetchReacciones(data.map((c: any) => c.id));
        }
        if (isInitial) setLoading(false);
    }, [tareaId, currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch reactions for a set of comment IDs
    const fetchReacciones = useCallback(async (comentarioIds: string[]) => {
        if (comentarioIds.length === 0) return;
        const { data } = await supabase
            .from("reacciones_comentario")
            .select("id, comentario_id, usuario_id, emoji, usuario:usuarios(nombre, apellido)")
            .in("comentario_id", comentarioIds);
        if (data) {
            const map: Record<string, Reaccion[]> = {};
            for (const r of data as any[]) {
                if (!map[r.comentario_id]) map[r.comentario_id] = [];
                map[r.comentario_id].push(r);
            }
            setReaccionesMap(map);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Toggle emoji reaction
    const toggleReaccion = async (comentarioId: string, emoji: string) => {
        const existing = reaccionesMap[comentarioId]?.find(
            r => r.emoji === emoji && r.usuario_id === currentUserId
        );
        if (existing) {
            // Remove
            await supabase.from("reacciones_comentario").delete().eq("id", existing.id);
            setReaccionesMap(prev => ({
                ...prev,
                [comentarioId]: (prev[comentarioId] || []).filter(r => r.id !== existing.id)
            }));
        } else {
            // Add
            const { data } = await supabase.from("reacciones_comentario").insert({
                comentario_id: comentarioId,
                usuario_id: currentUserId,
                emoji
            }).select("id, comentario_id, usuario_id, emoji").single();
            if (data) {
                setReaccionesMap(prev => ({
                    ...prev,
                    [comentarioId]: [...(prev[comentarioId] || []), { ...data, usuario: { nombre: currentUserNombre.split(" ")[0], apellido: currentUserNombre.split(" ").slice(1).join(" ") } } as any]
                }));
            }
        }
        setShowEmojiPicker(null);
    };

    // Group reactions for display
    const getReaccionGroups = (comentarioId: string): ReaccionGroup[] => {
        const reacciones = reaccionesMap[comentarioId] || [];
        const groups: Record<string, ReaccionGroup> = {};
        for (const r of reacciones) {
            if (!groups[r.emoji]) {
                groups[r.emoji] = { emoji: r.emoji, count: 0, users: [], hasOwn: false };
            }
            groups[r.emoji].count++;
            const nombre = r.usuario ? `${r.usuario.nombre} ${r.usuario.apellido}` : "Usuario";
            groups[r.emoji].users.push(nombre);
            if (r.usuario_id === currentUserId) groups[r.emoji].hasOwn = true;
        }
        return Object.values(groups);
    };

    useEffect(() => {
        fetchComentarios();

        // Suscribirse a realtime para nuevos comentarios
        const channel = supabase
            .channel(`chat_tarea_${tareaId}`)
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "comentarios_tarea",
                filter: `tarea_id=eq.${tareaId}`
            }, (payload) => {
                // Ignore our own optimistic updates (handled locally via handleEnviar)
                if (payload.new.usuario_id !== currentUserId) {
                    fetchComentarios(false);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [tareaId, fetchComentarios]); // eslint-disable-line react-hooks/exhaustive-deps

    // Scroll al final
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comentarios]);

    const marcarLeidos = async (comentarioIds: string[]) => {
        for (const cId of comentarioIds) {
            await supabase.from("comentario_lectura").upsert({
                comentario_id: cId,
                usuario_id: currentUserId,
                leido: true,
                fecha_lectura: new Date().toISOString(),
            }, { onConflict: "comentario_id,usuario_id" });
        }
    };

    const handleEnviar = async () => {
        const textoOriginal = nuevoComentario;
        const adjuntosOriginales = [...archivosPendientes];

        if (!textoOriginal.trim() && adjuntosOriginales.length === 0) return;

        setEnviando(true);
        setNuevoComentario("");
        setArchivosPendientes([]);

        // --- Optimistic UI Update ---
        const tempId = `temp-${Date.now()}`;

        // Prepare local previews for the optimistic UI so the user sees the images immediately
        const localPreviews = adjuntosOriginales.map(file => ({
            nombre: file.name,
            url: URL.createObjectURL(file), // create local preview
            tipo: file.type,
            uploading: true // visual flag for spinning loader
        }));

        const nuevoC = {
            id: tempId,
            contenido: textoOriginal.trim(),
            created_at: new Date().toISOString(),
            adjuntos: localPreviews.length > 0 ? localPreviews : null,
            usuario_id: currentUserId,
            usuario: { nombre: currentUserNombre.split(" ")[0] || "Yo", apellido: currentUserNombre.split(" ").slice(1).join(" ") || "" }
        };

        setComentarios(prev => [...prev, nuevoC as any]);

        // Subir archivos si existen
        const adjuntosSubidos = [];
        let huboErrorSubida = false;

        if (adjuntosOriginales.length > 0) {
            for (const archivo of adjuntosOriginales) {
                const fileExt = archivo.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                const filePath = `tareas/adjuntos/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('fotos-inspecciones')
                    .upload(filePath, archivo);

                if (!uploadError) {
                    const { data: publicUrlData } = supabase.storage
                        .from('fotos-inspecciones')
                        .getPublicUrl(filePath);

                    adjuntosSubidos.push({
                        nombre: archivo.name,
                        url: publicUrlData.publicUrl,
                        tipo: archivo.type,
                        path: filePath
                    });
                } else {
                    console.error("Error upload:", uploadError);
                    toast.error(`No se pudo subir ${archivo.name}. Verificá el tamaño o reintentá.`);
                    huboErrorSubida = true;
                }
            }
        }

        if (huboErrorSubida && adjuntosSubidos.length === 0 && !textoOriginal.trim()) {
            // Revertir update optimista
            setComentarios(prev => prev.filter(c => c.id !== tempId));
            setEnviando(false);
            return;
        }

        // Extract @mentions for notifications
        const mentionRegex = /@(\w+\s\w+)/g;
        const mentions: string[] = [];
        let match;
        while ((match = mentionRegex.exec(textoOriginal)) !== null) {
            mentions.push(match[1]);
        }

        try {
            const { data, error } = await supabase.from("comentarios_tarea").insert({
                tarea_id: tareaId,
                usuario_id: currentUserId,
                contenido: textoOriginal.trim(),
                adjuntos: adjuntosSubidos.length > 0 ? adjuntosSubidos : null
            }).select("id, contenido, created_at, adjuntos, usuario_id").single();

            if (error) throw error;

            if (data) {
                setComentarios(prev => prev.map(c => c.id === tempId ? {
                    ...data,
                    usuario: { nombre: currentUserNombre.split(" ")[0], apellido: currentUserNombre.split(" ").slice(1).join(" ") },
                } : c));

                // Fetch the task participants for notifications
                const { data: tareaInfo } = await supabase.from("tareas").select("asignado_id, creador_id").eq("id", tareaId).single();

                // Create explicit notifications for mentioned users
                const mentionedUserIds = new Set<string>();
                for (const mentionName of mentions) {
                    const mentionedUser = usuarios.find(u =>
                        `${u.nombre} ${u.apellido}`.toLowerCase() === mentionName.toLowerCase()
                    );
                    if (mentionedUser && mentionedUser.id !== currentUserId) {
                        mentionedUserIds.add(mentionedUser.id);
                        await supabase.from("notificaciones").insert({
                            usuario_destino_id: mentionedUser.id,
                            tipo: "mencion",
                            tarea_id: tareaId,
                            mensaje: `${currentUserNombre} te mencionó en un comentario`,
                        });
                    }
                }

                // Also notify the assignee and creator if they weren't explicitly mentioned
                if (tareaInfo) {
                    const autoNotify = new Set([tareaInfo.asignado_id, tareaInfo.creador_id]);
                    autoNotify.delete(currentUserId); // don't notify myself
                    mentionedUserIds.forEach(id => autoNotify.delete(id)); // already notified

                    for (const u_id of Array.from(autoNotify)) {
                        if (u_id) {
                            await supabase.from("notificaciones").insert({
                                usuario_destino_id: u_id,
                                tipo: "tarea_comentario",
                                tarea_id: tareaId,
                                mensaje: `${currentUserNombre} comentó en una tarea asignada a vos`,
                            });
                        }
                    }
                }

                // Background fetch to sync perfectly
                fetchComentarios(false);
            }
        } catch (err: any) {
            // CRITICAL: Show explicit error to the user, NEVER lose their text
            const errorMsg = err?.message || "Error desconocido al enviar el comentario";
            toast.error(`Error al enviar comentario: ${errorMsg}`);
            console.error("[ComentariosTarea] Insert failed:", err);

            // Revert optimistic update
            setComentarios(prev => prev.filter(c => c.id !== tempId));

            // Restore the text so the user can retry
            setNuevoComentario(textoOriginal);
            setArchivosPendientes(adjuntosOriginales);
        }
        setEnviando(false);
    };

    const handleSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            setArchivosPendientes(prev => [...prev, ...filesArray]);
        }
        if (fileRef.current) fileRef.current.value = "";
    };

    const handleRemoverArchivo = (index: number) => {
        setArchivosPendientes(prev => prev.filter((_, i) => i !== index));
    };

    // Paste image from clipboard
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        const imageFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith("image/")) {
                const file = items[i].getAsFile();
                if (file) imageFiles.push(file);
            }
        }
        if (imageFiles.length > 0) {
            e.preventDefault();
            setArchivosPendientes(prev => [...prev, ...imageFiles]);
            toast.info(`${imageFiles.length} imagen(es) pegada(s)`);
        }
    };

    // Drag and drop
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
        if (files.length > 0) {
            setArchivosPendientes(prev => [...prev, ...files]);
            toast.info(`${files.length} imagen(es) agregada(s)`);
        }
    };

    // Auto-resize textarea
    const autoResize = () => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 120) + "px";
        }
    };

    // Input handler with @ detection
    const handleInputChange = (value: string) => {
        setNuevoComentario(value);

        // Detect @mention trigger
        const lastAt = value.lastIndexOf("@");
        if (lastAt !== -1) {
            const afterAt = value.slice(lastAt + 1);
            // Only show if no space after the word (still typing the mention)
            if (!afterAt.includes(" ") || afterAt.split(" ").length <= 2) {
                setMentionFilter(afterAt.toLowerCase());
                setShowMentions(true);
                setMentionIndex(0);
                return;
            }
        }
        setShowMentions(false);
    };

    const filteredMentions = usuarios.filter(u =>
        u.id !== currentUserId &&
        (`${u.nombre} ${u.apellido}`).toLowerCase().includes(mentionFilter)
    ).slice(0, 5);

    const insertMention = (user: UsuarioMencion) => {
        const lastAt = nuevoComentario.lastIndexOf("@");
        const before = nuevoComentario.slice(0, lastAt);
        setNuevoComentario(`${before}@${user.nombre} ${user.apellido} `);
        setShowMentions(false);
        textareaRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showMentions && filteredMentions.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setMentionIndex(prev => Math.min(prev + 1, filteredMentions.length - 1));
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setMentionIndex(prev => Math.max(prev - 1, 0));
                return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                insertMention(filteredMentions[mentionIndex]);
                return;
            }
            if (e.key === "Escape") {
                setShowMentions(false);
                return;
            }
        }

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleEnviar();
        }
    };

    // Render content with highlighted mentions
    const renderContenido = (texto: string) => {
        if (!texto) return null;
        const parts = texto.split(/(@\w+\s\w+)/g);
        return parts.map((part, i) => {
            if (part.startsWith("@")) {
                return <span key={i} className="text-brand-primary font-medium">{part}</span>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    const handleDownloadAll = async (adjuntos: any[]) => {
        toast.info("Descargando imágenes...");
        try {
            for (const adj of adjuntos) {
                if (adj.tipo?.startsWith("image/")) {
                    const response = await fetch(adj.url);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.style.display = "none";
                    a.href = url;
                    a.download = adj.nombre;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                }
            }
            toast.success("Descarga completada");
        } catch (error) {
            toast.error("Error descargando imágenes");
        }
    };

    const openPreview = (images: any[], index: number) => {
        setLightboxImages(images.map((img: any) => ({ url: img.url, nombre: img.nombre })));
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Hilo de comentarios */}
            <div className="flex-1 overflow-y-auto space-y-3 p-4 min-h-0 custom-scrollbar">
                {comentarios.length === 0 && (
                    <p className="text-sm text-text-muted text-center py-8">Sin comentarios aún. Usá @ para mencionar.</p>
                )}
                {comentarios.map(c => {
                    const esMio = c.usuario_id === currentUserId;
                    const reaccionGroups = getReaccionGroups(c.id);
                    const isHovered = hoveredComment === c.id;
                    return (
                        <div
                            key={c.id}
                            className={`flex ${esMio ? "justify-end" : "justify-start"} group/comment relative`}
                            onMouseEnter={() => setHoveredComment(c.id)}
                            onMouseLeave={() => { setHoveredComment(null); if (showEmojiPicker === c.id) setShowEmojiPicker(null); }}
                        >
                            <div className="relative max-w-[80%]">
                                <div className={`rounded-lg px-3 py-2 text-sm ${esMio
                                    ? "bg-brand-primary/20 text-white"
                                    : "bg-bg-tertiary text-text-primary border border-border"
                                    }`}>
                                    {!esMio && (
                                        <p className="text-xs font-medium text-brand-secondary mb-1">
                                            {c.usuario?.nombre} {c.usuario?.apellido}
                                        </p>
                                    )}
                                    {c.contenido && <p className="whitespace-pre-wrap">{renderContenido(c.contenido)}</p>}
                                    {c.adjuntos && c.adjuntos.length > 0 && (
                                        <div className="mt-2 space-y-1.5 flex flex-col">
                                            {(() => {
                                                const images = c.adjuntos.filter((a: any) => a.tipo?.startsWith("image/"));
                                                const others = c.adjuntos.filter((a: any) => !a.tipo?.startsWith("image/"));
                                                return (
                                                    <>
                                                        {images.length > 0 && (
                                                            <div className="bg-bg-primary/50 rounded-lg p-2 border border-border/50">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className={`text-[11px] font-medium ${esMio ? "text-white/80" : "text-text-muted"}`}>
                                                                        {images.length} {images.length === 1 ? 'imagen' : 'imágenes'}
                                                                    </span>
                                                                    {images.length > 1 && (
                                                                        <Button variant="ghost" size="sm"
                                                                            className={`h-6 text-[10px] px-2 ${esMio ? "text-white/90 hover:bg-white/20" : "text-brand-primary hover:bg-brand-primary/10"}`}
                                                                            onClick={() => handleDownloadAll(images)} title="Descargar todas las imágenes">
                                                                            <Download className="w-3 h-3 mr-1" /> Descargar Todo
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                                <div className={`grid gap-1 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'}`}>
                                                                    {images.map((img: any, idx: number) => (
                                                                        <div key={idx}
                                                                            className={`relative aspect-square cursor-pointer overflow-hidden rounded border border-border/30 hover:opacity-90 transition-opacity bg-bg-secondary ${images.length === 3 && idx === 0 ? 'col-span-2 row-span-2 aspect-auto' : ''}`}
                                                                            onClick={() => openPreview(images, idx)}>
                                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                            <img src={img.url} alt={img.nombre} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {others.length > 0 && others.map((adj: any, i: number) => (
                                                            <a key={i} href={adj.url} target="_blank" rel="noreferrer" className={`flex items-center w-max max-w-full gap-1.5 p-1.5 pr-3 rounded-md text-xs border border-border/50 shadow-sm ${esMio ? "bg-white/10 hover:bg-white/20" : "bg-bg-primary hover:bg-bg-secondary"}`}>
                                                                <FileIcon className="w-3.5 h-3.5 shrink-0" />
                                                                <span className="truncate">{adj.nombre}</span>
                                                            </a>
                                                        ))}
                                                    </>
                                                )
                                            })()}
                                        </div>
                                    )}
                                    <p className={`text-[10px] mt-1 ${esMio ? "text-brand-primary/60" : "text-text-muted"}`}>
                                        {format(new Date(c.created_at), "dd/MM HH:mm", { locale: es })}
                                    </p>
                                </div>

                                {/* Emoji Reaction Pills */}
                                {reaccionGroups.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {reaccionGroups.map(g => (
                                            <button
                                                key={g.emoji}
                                                onClick={() => toggleReaccion(c.id, g.emoji)}
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

                                {/* Hover Emoji Add Button */}
                                {isHovered && !c.id.startsWith("temp-") && (
                                    <div className={`absolute -top-3 ${esMio ? "left-0" : "right-0"} z-20`}>
                                        <button
                                            onClick={() => setShowEmojiPicker(showEmojiPicker === c.id ? null : c.id)}
                                            className="p-1 rounded-full bg-bg-secondary border border-border shadow-md hover:bg-bg-tertiary transition-colors"
                                            title="Reaccionar"
                                        >
                                            <SmilePlus className="w-3.5 h-3.5 text-text-muted" />
                                        </button>
                                    </div>
                                )}

                                {/* Emoji Picker Popover */}
                                {showEmojiPicker === c.id && (
                                    <div className={`absolute ${esMio ? "left-0" : "right-0"} -top-10 z-30 bg-bg-elevated border border-border rounded-lg shadow-xl p-1.5 flex gap-0.5 animate-in fade-in zoom-in-95 duration-150`}>
                                        {EMOJI_SET.map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => toggleReaccion(c.id, emoji)}
                                                className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-tertiary transition-colors text-base hover:scale-125"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={endRef} />
            </div>

            {/* Input with mention dropdown */}
            <div className="border-t border-border p-3 flex flex-col gap-2 relative bg-bg-primary rounded-b-md">

                {/* Archivos pendientes de enviar */}
                {archivosPendientes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-1 px-1">
                        {archivosPendientes.map((file, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-bg-tertiary border border-border px-2 py-1 rounded-md text-xs text-text-secondary animate-in zoom-in duration-200">
                                {file.type.startsWith("image/") ? <ImageIcon className="w-3 h-3 text-brand-secondary" /> : <FileIcon className="w-3 h-3 text-brand-secondary" />}
                                <span className="truncate max-w-[120px]">{file.name}</span>
                                <button onClick={() => handleRemoverArchivo(i)} className="text-text-muted hover:text-danger ml-1 p-0.5 rounded-full hover:bg-bg-primary">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Mention dropdown */}
                {showMentions && filteredMentions.length > 0 && (
                    <div className="absolute bottom-full left-3 right-3 mb-1 bg-bg-secondary border border-border rounded-lg shadow-xl overflow-hidden z-50">
                        {filteredMentions.map((u, i) => (
                            <button
                                key={u.id}
                                onClick={() => insertMention(u)}
                                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${i === mentionIndex ? "bg-brand-primary/10 text-white" : "text-text-secondary hover:bg-bg-tertiary"
                                    }`}
                            >
                                <span className="w-6 h-6 bg-brand-primary/20 text-brand-primary rounded-full flex items-center justify-center text-xs font-bold">
                                    {u.nombre[0]}
                                </span>
                                <span>{u.nombre} {u.apellido}</span>
                                <span className="text-[10px] text-text-muted capitalize ml-auto">{u.rol}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div
                    className={`flex gap-2 items-end ${isDragging ? "ring-2 ring-brand-primary ring-offset-2 ring-offset-bg-primary rounded-lg" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        multiple
                        ref={fileRef}
                        onChange={handleSeleccionarArchivo}
                        className="hidden"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => fileRef.current?.click()}
                        disabled={enviando}
                        className="text-text-muted hover:text-text-primary hover:bg-bg-tertiary shrink-0 self-end"
                        title="Adjuntar archivo"
                    >
                        <Paperclip className="w-4 h-4" />
                    </Button>
                    <textarea
                        ref={textareaRef}
                        value={nuevoComentario}
                        onChange={e => { handleInputChange(e.target.value); autoResize(); }}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder="Comentario... (@ para mencionar, Shift+Enter para nueva línea)"
                        rows={1}
                        className="flex-1 min-w-0 bg-bg-secondary border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-primary resize-none overflow-y-auto"
                        style={{ maxHeight: 120 }}
                    />
                    <Button
                        onClick={handleEnviar}
                        disabled={enviando || (!nuevoComentario.trim() && archivosPendientes.length === 0)}
                        size="icon"
                        className="bg-brand-primary hover:bg-brand-primary-hover text-white flex-shrink-0 self-end"
                    >
                        {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                    </Button>
                </div>
            </div>

            <ImageLightbox
                images={lightboxImages}
                initialIndex={lightboxIndex}
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />
        </div>
    );
}

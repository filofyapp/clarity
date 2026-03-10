"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Loader2, Paperclip, X, FileIcon, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";

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

    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Mentions state
    const [usuarios, setUsuarios] = useState<UsuarioMencion[]>([]);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState("");
    const [mentionIndex, setMentionIndex] = useState(0);

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
            .select("id, contenido, created_at, usuario_id, usuario:usuarios(nombre, apellido)")
            .eq("tarea_id", tareaId)
            .order("created_at", { ascending: true });

        if (!error && data) {
            setComentarios(data as any);
            await marcarLeidos(data.map((c: any) => c.id));
        }
        if (isInitial) setLoading(false);
    }, [tareaId, currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

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
        const nuevoC = {
            id: tempId,
            contenido: textoOriginal.trim(),
            created_at: new Date().toISOString(),
            adjuntos: null,
            usuario_id: currentUserId,
            usuario: { nombre: currentUserNombre.split(" ")[0] || "Yo", apellido: currentUserNombre.split(" ").slice(1).join(" ") || "" }
        };

        setComentarios(prev => [...prev, nuevoC as any]);

        // Subir archivos si existen
        const adjuntosSubidos = [];
        if (adjuntosOriginales.length > 0) {
            for (const archivo of adjuntosOriginales) {
                const fileExt = archivo.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
                const filePath = `tareas/${tareaId}/${fileName}`;

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
                }
            }
        }

        // Extract @mentions for notifications
        const mentionRegex = /@(\w+\s\w+)/g;
        const mentions: string[] = [];
        let match;
        while ((match = mentionRegex.exec(textoOriginal)) !== null) {
            mentions.push(match[1]);
        }

        const { data, error } = await supabase.from("comentarios_tarea").insert({
            tarea_id: tareaId,
            usuario_id: currentUserId,
            contenido: nuevoComentario.trim(),
            adjuntos: adjuntosSubidos.length > 0 ? adjuntosSubidos : null
        }).select("id, contenido, created_at, adjuntos, usuario_id").single();

        if (!error && data) {
            setComentarios(prev => prev.map(c => c.id === tempId ? {
                ...data,
                usuario: { nombre: currentUserNombre.split(" ")[0], apellido: currentUserNombre.split(" ").slice(1).join(" ") },
            } : c));
            setNuevoComentario("");
            setArchivosPendientes([]);

            // Create notifications for mentioned users
            for (const mentionName of mentions) {
                const mentionedUser = usuarios.find(u =>
                    `${u.nombre} ${u.apellido}`.toLowerCase() === mentionName.toLowerCase()
                );
                if (mentionedUser && mentionedUser.id !== currentUserId) {
                    await supabase.from("notificaciones").insert({
                        usuario_destino_id: mentionedUser.id,
                        tipo: "mencion",
                        tarea_id: tareaId,
                        mensaje: `${currentUserNombre} te mencionó en una tarea`,
                    });
                }
            }

            // Also trigger a background fetch just in case to sync perfectly
            fetchComentarios(false);
        } else if (error) {
            console.error(error);
            // Revert optimistic update on failure
            setComentarios(prev => prev.filter(c => c.id !== tempId));
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
        inputRef.current?.focus();
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
        const parts = texto.split(/(@\w+\s\w+)/g);
        return parts.map((part, i) => {
            if (part.startsWith("@")) {
                return <span key={i} className="text-brand-primary font-medium">{part}</span>;
            }
            return <span key={i}>{part}</span>;
        });
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
                    return (
                        <div key={c.id} className={`flex ${esMio ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${esMio
                                ? "bg-brand-primary/20 text-white"
                                : "bg-bg-tertiary text-text-primary border border-border"
                                }`}>
                                {!esMio && (
                                    <p className="text-xs font-medium text-brand-secondary mb-1">
                                        {c.usuario?.nombre} {c.usuario?.apellido}
                                    </p>
                                )}
                                <p className="whitespace-pre-wrap">{renderContenido(c.contenido)}</p>
                                {c.adjuntos && c.adjuntos.length > 0 && (
                                    <div className="mt-2 space-y-1.5 flex flex-col">
                                        {c.adjuntos.map((adj: any, i: number) => (
                                            adj.tipo?.startsWith("image/") ? (
                                                <a key={i} href={adj.url} target="_blank" rel="noreferrer" className="inline-block mt-0.5 max-w-full">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={adj.url} alt={adj.nombre} className="max-h-32 object-contain rounded-md border border-border/50 hover:opacity-80 transition-opacity" />
                                                </a>
                                            ) : (
                                                <a key={i} href={adj.url} target="_blank" rel="noreferrer" className={`flex items-center w-max max-w-full gap-1.5 p-1.5 pr-3 rounded-md text-xs border border-border/50 shadow-sm ${esMio ? "bg-white/10 hover:bg-white/20" : "bg-bg-primary hover:bg-bg-secondary"}`}>
                                                    <FileIcon className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate">{adj.nombre}</span>
                                                </a>
                                            )
                                        ))}
                                    </div>
                                )}
                                <p className={`text-[10px] mt-1 ${esMio ? "text-brand-primary/60" : "text-text-muted"}`}>
                                    {format(new Date(c.created_at), "dd/MM HH:mm", { locale: es })}
                                </p>
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

                <div className="flex gap-2">
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
                        className="text-text-muted hover:text-text-primary hover:bg-bg-tertiary shrink-0"
                        title="Adjuntar archivo"
                    >
                        <Paperclip className="w-4 h-4" />
                    </Button>
                    <input
                        ref={inputRef}
                        value={nuevoComentario}
                        onChange={e => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Comentario... (@ para mencionar)"
                        className="flex-1 min-w-0 bg-bg-secondary border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-primary"
                    />
                    <Button
                        onClick={handleEnviar}
                        disabled={enviando || (!nuevoComentario.trim() && archivosPendientes.length === 0)}
                        size="icon"
                        className="bg-brand-primary hover:bg-brand-primary-hover text-white flex-shrink-0"
                    >
                        {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}

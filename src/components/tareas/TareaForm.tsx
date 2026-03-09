"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusCircle, Loader2, Paperclip, X, FileIcon, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRef } from "react";

interface TareaFormProps {
    usuarios: { id: string; nombre: string; apellido: string; rol: string }[];
    casoVinculadoId?: string;
    tareaEdit?: any;
    triggerNode?: React.ReactNode;
}

export function TareaForm({ usuarios, casoVinculadoId, tareaEdit, triggerNode }: TareaFormProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const isEdit = !!tareaEdit;

    const supabase = createClient();
    const fileRef = useRef<HTMLInputElement>(null);
    const [archivosPendientes, setArchivosPendientes] = useState<File[]>([]);
    const [adjuntosExistentes, setAdjuntosExistentes] = useState<any[]>(tareaEdit?.adjuntos || []);

    const [titulo, setTitulo] = useState(tareaEdit?.titulo || "");
    const [descripcion, setDescripcion] = useState(tareaEdit?.descripcion || "");
    const [participantesIds, setParticipantesIds] = useState<string[]>(
        tareaEdit ? (tareaEdit.participantes?.map((p: any) => p.usuario_id) || (tareaEdit.asignado_id ? [tareaEdit.asignado_id] : [])) : []
    );
    const [prioridad, setPrioridad] = useState(tareaEdit?.prioridad || "normal");
    const [fechaVencimiento, setFechaVencimiento] = useState(tareaEdit?.fecha_vencimiento ? tareaEdit.fecha_vencimiento.split('T')[0] : "");
    const [casoId, setCasoId] = useState(tareaEdit?.caso_id || casoVinculadoId || "");
    const [searchTerm, setSearchTerm] = useState("");
    const [casosResultados, setCasosResultados] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Búsqueda de casos
    const searchCasos = async (term: string) => {
        setSearchTerm(term);
        if (term.length < 3) {
            setCasosResultados([]);
            return;
        }
        setIsSearching(true);
        try {
            // Simple fetch to a new tiny endpoint or a server action, or we can use supabase client directly if we have it here. Let's use a standard fetch for simplicity.
            const res = await fetch(`/api/casos/search?q=${term}`);
            if (res.ok) {
                const data = await res.json();
                setCasosResultados(data);
            }
        } catch (e) { console.error(e); }
        finally { setIsSearching(false); }
    }

    const toggleParticipante = (id: string) => {
        setParticipantesIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const removeArchivo = (index: number) => {
        setArchivosPendientes(prev => prev.filter((_, i) => i !== index));
    };

    const removeAdjuntoExistente = (index: number) => {
        setAdjuntosExistentes(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titulo.trim()) {
            toast.error("El título es obligatorio.");
            return;
        }
        if (participantesIds.length === 0) {
            toast.error("Agrega al menos un participante.");
            return;
        }

        setLoading(true);
        try {
            const adjuntosNuevos = [];
            if (archivosPendientes.length > 0) {
                for (const archivo of archivosPendientes) {
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

                        adjuntosNuevos.push({
                            nombre: archivo.name,
                            url: publicUrlData.publicUrl,
                            tipo: archivo.type,
                            path: filePath
                        });
                    } else {
                        toast.error(`Error al subir ${archivo.name}`);
                    }
                }
            }

            const adjuntosFinales = [...adjuntosExistentes, ...adjuntosNuevos];

            const bodyPayload = {
                id: isEdit ? tareaEdit.id : undefined,
                titulo,
                descripcion,
                asignado_id: participantesIds[0],
                participantes_ids: participantesIds,
                prioridad,
                caso_id: casoId,
                fecha_vencimiento: fechaVencimiento || null,
                adjuntos: adjuntosFinales,
            };

            const res = await fetch("/api/tareas", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyPayload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Error ${isEdit ? "actualizando" : "creando"} tarea`);
            }

            toast.success(`Tarea ${isEdit ? "actualizada" : "creada"} con éxito.`);
            setOpen(false);
            router.refresh();

            if (!isEdit) {
                setTitulo("");
                setDescripcion("");
                setParticipantesIds([]);
                setPrioridad("normal");
                setFechaVencimiento("");
                setCasoId(casoVinculadoId || "");
                setSearchTerm("");
                setCasosResultados([]);
                setArchivosPendientes([]);
                setAdjuntosExistentes([]);
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerNode || (
                    <Button className="bg-brand-primary hover:bg-brand-primary-hover text-white flex items-center gap-2">
                        <PlusCircle className="w-4 h-4" />
                        Nueva Tarea
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="bg-bg-elevated border border-border sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="text-text-primary text-xl">{isEdit ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">Título <span className="text-danger">*</span></label>
                        <input
                            type="text" required
                            className="w-full bg-bg-secondary border border-border rounded-md px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-brand-primary"
                            placeholder="Ej: Solicitar presupuesto concesionario"
                            value={titulo} onChange={e => setTitulo(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 relative">
                        <label className="text-sm font-medium text-text-secondary">Siniestro Vinculado (Opcional)</label>
                        {casoId ? (
                            <div className="flex items-center justify-between bg-bg-secondary border border-brand-primary/50 text-text-primary rounded-md px-3 py-2 text-sm">
                                <span>✔ Siniestro seleccionado</span>
                                {!casoVinculadoId && ( // Only allow clear if it wasnt forced by a prop (i.e we are not on the CasoDetail page)
                                    <button type="button" onClick={() => { setCasoId(""); setSearchTerm(""); }} className="text-xs text-text-muted hover:text-danger">Cambiar</button>
                                )}
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full bg-bg-secondary border border-border rounded-md px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-brand-primary"
                                    placeholder="Buscar por Nº de Siniestro (ej: SIN-123)..."
                                    value={searchTerm} onChange={e => searchCasos(e.target.value)}
                                />
                                {isSearching && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-text-muted" />}

                                {casosResultados.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-bg-elevated border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                                        {casosResultados.map(c => (
                                            <div key={c.id} onClick={() => { setCasoId(c.id); setCasosResultados([]); setSearchTerm(c.numero_siniestro); }}
                                                className="px-3 py-2 text-sm text-text-primary hover:bg-brand-primary/20 cursor-pointer border-b border-border/50 last:border-0 flex justify-between">
                                                <span className="font-mono font-bold">{c.numero_siniestro}</span>
                                                <span className="text-xs text-text-muted">{c.dominio || "Sin patente"}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Multi-participante */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">
                            Participantes <span className="text-danger">*</span>
                            <span className="text-xs text-text-muted ml-2">({participantesIds.length} seleccionados)</span>
                        </label>
                        <div className="max-h-40 overflow-y-auto bg-bg-secondary border border-border rounded-md p-2 space-y-1">
                            {usuarios.map(u => (
                                <label key={u.id}
                                    className={`flex items-center gap-3 px-2 py-1.5 rounded cursor-pointer transition-colors text-sm ${participantesIds.includes(u.id)
                                        ? "bg-brand-primary/10 text-white"
                                        : "text-text-secondary hover:bg-bg-tertiary"
                                        }`}>
                                    <input
                                        type="checkbox"
                                        checked={participantesIds.includes(u.id)}
                                        onChange={() => toggleParticipante(u.id)}
                                        className="rounded border-border"
                                    />
                                    <span>{u.nombre} {u.apellido}</span>
                                    <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${u.rol === "admin" ? "bg-brand-primary/20 text-brand-primary"
                                        : u.rol === "calle" ? "bg-success/20 text-success"
                                            : "bg-info/20 text-color-info"
                                        }`}>{u.rol}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Prioridad</label>
                            <select value={prioridad} onChange={e => setPrioridad(e.target.value)}
                                className="w-full bg-bg-secondary border border-border rounded-md px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-brand-primary">
                                <option value="normal">Normal</option>
                                <option value="alta">🟠 Alta</option>
                                <option value="urgente">🔴 Urgente</option>
                                <option value="alfredo">🔥 Ver con Alfredo</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Fecha límite</label>
                            <input type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)}
                                className="w-full bg-bg-secondary border border-border rounded-md px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-brand-primary" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Descripción</label>
                            <textarea rows={6} value={descripcion} onChange={e => setDescripcion(e.target.value)}
                                placeholder="Detalle de lo solicitado..."
                                className="w-full bg-bg-secondary border border-border rounded-md px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-brand-primary min-h-[150px]" />
                        </div>

                        {/* File Upload UI */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Archivos Adjuntos</label>

                            <div className="flex flex-col gap-3">
                                {/* Attachments List */}
                                {(adjuntosExistentes.length > 0 || archivosPendientes.length > 0) && (
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        {adjuntosExistentes.map((adj, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-bg-secondary border border-border rounded-lg p-2 overflow-hidden text-xs relative group">
                                                {adj.tipo?.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-brand-secondary shrink-0" /> : <FileIcon className="w-4 h-4 text-brand-primary shrink-0" />}
                                                <span className="truncate flex-1">{adj.nombre}</span>
                                                <button type="button" onClick={() => removeAdjuntoExistente(i)} className="p-1 rounded bg-bg-primary text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {archivosPendientes.map((file, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-bg-secondary border border-border rounded-lg p-2 overflow-hidden text-xs relative group">
                                                {file.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-brand-secondary shrink-0" /> : <FileIcon className="w-4 h-4 text-brand-primary shrink-0" />}
                                                <span className="truncate flex-1 font-medium">{file.name} <span className="text-brand-primary">(Nuevo)</span></span>
                                                <button type="button" onClick={() => removeArchivo(i)} className="p-1 rounded bg-bg-primary text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div>
                                    <input
                                        type="file"
                                        ref={fileRef}
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files) {
                                                setArchivosPendientes(prev => [...prev, ...Array.from(e.target.files!)]);
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileRef.current?.click()}
                                        className="w-full border-2 border-dashed border-border hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-colors rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-text-muted cursor-pointer font-medium"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-brand-primary">
                                            <Paperclip className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs">Click para adjuntar fotos o documentos</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-brand-primary hover:bg-brand-primary-hover text-white min-w-[120px]">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEdit ? "Guardar Cambios" : "Crear Tarea")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Check, ChevronDown, Users } from "lucide-react";

// Avatar color pool (deterministic by name) — same as TareaCard
const AVATAR_COLORS = [
    "bg-amber-600", "bg-indigo-600", "bg-emerald-600", "bg-rose-600",
    "bg-cyan-600", "bg-violet-600", "bg-orange-600", "bg-teal-600",
];
const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

interface Participante {
    usuario_id: string;
    nombre: string;
    apellido: string;
}

interface ParticipantesPopoverProps {
    tareaId: string;
    participantes: Participante[];
    usuarios: { id: string; nombre: string; apellido: string; rol: string }[];
    canEdit: boolean; // admin/carga = true, calle = false
    onUpdate?: () => void;
    openDirection?: "up" | "down"; // default: "up" (for card footer), "down" for sheet header
}

export function ParticipantesPopover({ tareaId, participantes, usuarios, canEdit, onUpdate, openDirection = "up" }: ParticipantesPopoverProps) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set(participantes.map(p => p.usuario_id)));
    const [saving, setSaving] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const initialRef = useRef<Set<string>>(new Set(participantes.map(p => p.usuario_id)));

    // Sync when participantes prop changes
    useEffect(() => {
        const newSet = new Set(participantes.map(p => p.usuario_id));
        setSelected(newSet);
        initialRef.current = newSet;
    }, [participantes]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                handleClose();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open, selected]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleUser = (userId: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    const handleClose = async () => {
        setOpen(false);

        // Check if anything changed
        const initialIds = initialRef.current;
        const hasChanged = selected.size !== initialIds.size || [...selected].some(id => !initialIds.has(id));

        if (!hasChanged) return;

        // Save to DB: DELETE all + INSERT new
        setSaving(true);
        const supabase = createClient();

        try {
            // Delete current participants
            const { error: deleteError } = await supabase
                .from("tarea_participantes")
                .delete()
                .eq("tarea_id", tareaId);

            if (deleteError) throw deleteError;

            // Insert new participants
            if (selected.size > 0) {
                const rows = [...selected].map(uid => ({ tarea_id: tareaId, usuario_id: uid }));
                const { error: insertError } = await supabase
                    .from("tarea_participantes")
                    .insert(rows);

                if (insertError) throw insertError;
            }

            // Also update legacy asignado_id for backward compat (first participant or null)
            const firstParticipant = selected.size > 0 ? [...selected][0] : null;
            await supabase
                .from("tareas")
                .update({ asignado_id: firstParticipant, updated_at: new Date().toISOString() })
                .eq("id", tareaId);

            toast.success("Participantes actualizados");
            initialRef.current = new Set(selected);
            onUpdate?.();
        } catch (err: any) {
            toast.error(`Error al actualizar participantes: ${err?.message || "Error desconocido"}`);
            // Revert selection
            setSelected(new Set(initialRef.current));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="relative" ref={popoverRef}>
            {/* Pill display — clickable if canEdit */}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    if (canEdit) setOpen(!open);
                }}
                className={`flex items-center gap-1 flex-wrap ${canEdit ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
            >
                {participantes.length > 0 ? (
                    participantes.map((p, i) => {
                        const pName = `${p.nombre} ${p.apellido}`;
                        return (
                            <span
                                key={p.usuario_id || i}
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${getAvatarColor(pName)}`}
                                title={pName}
                            >
                                {p.nombre}
                            </span>
                        );
                    })
                ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-bg-tertiary text-text-muted border border-dashed border-border-default">
                        {canEdit ? "Asignar" : "Sin asignar"}
                    </span>
                )}
                {canEdit && (
                    <ChevronDown className={`w-3 h-3 text-text-muted transition-transform ${open ? "rotate-180" : ""}`} />
                )}
            </div>

            {/* Popover multi-select */}
            {open && canEdit && (
                <div
                    className={`absolute ${openDirection === "down" ? "top-full mt-2" : "bottom-full mb-2"} right-0 w-56 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="px-3 py-2 text-[10px] font-semibold text-text-muted border-b border-border-subtle bg-bg-tertiary uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3 h-3" />
                        Asignar Participantes
                    </div>
                    <div className="max-h-56 overflow-y-auto py-1">
                        {usuarios.map(u => {
                            const isChecked = selected.has(u.id);
                            const fullName = `${u.nombre} ${u.apellido}`;
                            return (
                                <button
                                    key={u.id}
                                    onClick={() => toggleUser(u.id)}
                                    className={`w-full text-left px-3 py-2 text-xs hover:bg-bg-tertiary transition-colors flex items-center gap-2.5 ${isChecked ? "text-text-primary" : "text-text-muted"}`}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isChecked
                                        ? "bg-brand-primary border-brand-primary"
                                        : "border-border-default bg-bg-primary"
                                        }`}>
                                        {isChecked && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-white uppercase shrink-0 ${getAvatarColor(fullName)}`}>
                                        {u.nombre.charAt(0)}{u.apellido.charAt(0)}
                                    </div>
                                    <span className="truncate flex-1">{fullName}</span>
                                    <span className="text-[9px] text-text-muted capitalize">{u.rol}</span>
                                </button>
                            );
                        })}
                    </div>
                    {saving && (
                        <div className="px-3 py-1.5 text-[10px] text-text-muted bg-bg-tertiary border-t border-border-subtle text-center">
                            Guardando...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

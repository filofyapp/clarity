"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Edit2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { updateCasoRapido } from "@/app/(dashboard)/casos/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function EditableLinkOrion({ casoId, linkOrion }: { casoId: string; linkOrion: string | null }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(linkOrion || "");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSave = () => {
        startTransition(async () => {
            await updateCasoRapido(casoId, "link_orion", value.trim() || null);
            router.refresh();
            setEditing(false);
            toast.success("Link de Orion actualizado");
        });
    };

    const handleCancel = () => {
        setValue(linkOrion || "");
        setEditing(false);
    };

    if (editing) {
        return (
            <div className="p-4 rounded-lg bg-bg-secondary border border-brand-primary/40 flex flex-col gap-2 md:col-span-3">
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5" /> Link de Orion
                </p>
                <div className="flex items-center gap-2">
                    <Input
                        autoFocus
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        placeholder="https://orion.sancorseguros.com/..."
                        className="flex-1 h-8 text-sm bg-bg-elevated border-border focus-visible:ring-brand-primary"
                        onKeyDown={e => {
                            if (e.key === "Enter") handleSave();
                            if (e.key === "Escape") handleCancel();
                        }}
                    />
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="p-1.5 rounded bg-success/20 text-success hover:bg-success/30 transition-colors"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleCancel}
                        className="p-1.5 rounded bg-bg-tertiary text-text-muted hover:bg-bg-elevated transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="p-4 rounded-lg bg-bg-secondary border border-border/60 flex flex-col gap-1 transition-colors hover:border-brand-primary/30 hover:bg-bg-tertiary group/orion md:col-span-3 cursor-pointer"
            onClick={() => {
                if (linkOrion) {
                    window.open(linkOrion.startsWith("http") ? linkOrion : `https://${linkOrion}`, "_blank");
                } else {
                    setEditing(true);
                }
            }}
        >
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5" /> Link de Orion
                </p>
                <button
                    onClick={e => { e.stopPropagation(); setEditing(true); }}
                    className="opacity-0 group-hover/orion:opacity-100 p-0.5 text-text-muted hover:text-brand-primary transition-opacity"
                >
                    <Edit2 className="w-3.5 h-3.5" />
                </button>
            </div>
            {linkOrion ? (
                <p className="font-medium text-brand-primary text-sm truncate hover:underline">
                    {linkOrion}
                </p>
            ) : (
                <p className="text-text-muted text-sm italic">Sin link — clic para agregar</p>
            )}
        </div>
    );
}

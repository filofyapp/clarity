"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, Hammer, Paintbrush, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatters";

interface ValorSancor {
    id: string;
    concepto: string;
    valor_estudio: number;
    updated_at: string;
}

const CONCEPTOS: Record<string, { label: string; unidad: string; icon: any }> = {
    dia_chapa: { label: "Día de Chapa", unidad: "por día", icon: Hammer },
    pano_pintura: { label: "Paño de Pintura", unidad: "por paño", icon: Paintbrush },
    hora_mecanica: { label: "Hora de Mecánica", unidad: "por hora", icon: Wrench },
};

export function ValoresSancorEditor({ valores: initial }: { valores: ValorSancor[] }) {
    const supabase = createClient();
    const [valores, setValores] = useState(initial);
    const [editando, setEditando] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSave = (v: ValorSancor) => {
        startTransition(async () => {
            const { error } = await supabase
                .from("precios")
                .update({
                    valor_estudio: v.valor_estudio,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", v.id);

            if (error) {
                toast.error("Error al guardar: " + error.message);
            } else {
                toast.success(`Valor "${CONCEPTOS[v.concepto]?.label || v.concepto}" actualizado.`);
                setEditando(null);
                // Refresh updated_at locally
                setValores(prev => prev.map(p =>
                    p.id === v.id ? { ...p, updated_at: new Date().toISOString() } : p
                ));
            }
        });
    };

    const updateValor = (id: string, value: number) => {
        setValores(prev => prev.map(p =>
            p.id === id ? { ...p, valor_estudio: value } : p
        ));
    };

    if (valores.length === 0) {
        return (
            <div className="bg-bg-secondary border border-border rounded-xl p-6 text-center text-text-muted text-sm">
                No se encontraron valores de mano de obra para Sancor. Ejecutá la migración 027_inspeccion_campo.sql primero.
            </div>
        );
    }

    return (
        <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-bg-tertiary border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-text-primary text-sm">Valores Sancor — Mano de Obra</h3>
                <span className="text-[10px] text-text-muted uppercase tracking-wide">Para inspecciones presenciales</span>
            </div>
            <div className="divide-y divide-border/30">
                {valores.map(v => {
                    const config = CONCEPTOS[v.concepto];
                    if (!config) return null;
                    const Icon = config.icon;
                    const isEditing = editando === v.id;

                    return (
                        <div key={v.id} className="flex items-center justify-between px-4 py-4 hover:bg-bg-tertiary/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-text-primary">{config.label}</p>
                                    <p className="text-[11px] text-text-muted">{config.unidad}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-text-muted text-sm">$</span>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            value={v.valor_estudio}
                                            onChange={e => updateValor(v.id, parseFloat(e.target.value) || 0)}
                                            className="w-28 bg-bg-tertiary border border-brand-primary/50 rounded-lg px-3 py-2 text-right text-text-primary font-mono text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                            autoFocus
                                        />
                                        <Button
                                            size="sm"
                                            onClick={() => handleSave(v)}
                                            disabled={isPending}
                                            className="bg-color-success hover:bg-color-success/90 h-9 text-xs px-3"
                                        >
                                            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3 mr-1" /> Guardar</>}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="font-mono text-lg font-bold text-text-primary">
                                                {formatCurrency(v.valor_estudio)}
                                            </p>
                                            {v.updated_at && (
                                                <p className="text-[10px] text-text-muted">
                                                    Actualizado: {new Date(v.updated_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setEditando(v.id)}
                                            className="text-xs text-brand-primary hover:text-text-primary transition-colors underline underline-offset-2"
                                        >
                                            Editar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

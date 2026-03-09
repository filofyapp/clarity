"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Save, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatters";

interface Precio {
    id: string;
    concepto: string;
    tipo: string;
    valor_estudio: number;
    valor_perito_calle: number; // Formerly valor_perito
    valor_perito_carga: number; // New column for backoffice peritos
    descripcion: string | null;
    activo: boolean;
}

export function PreciosEditor({ precios: initial }: { precios: Precio[] }) {
    const supabase = createClient();
    const [precios, setPrecios] = useState<Precio[]>(initial);
    const [isPending, startTransition] = useTransition();
    const [editando, setEditando] = useState<string | null>(null);

    const handleSave = (precio: Precio) => {
        startTransition(async () => {
            const updatePayload: any = {
                valor_estudio: precio.valor_estudio,
                descripcion: precio.descripcion,
                activo: precio.activo,
                updated_at: new Date().toISOString()
            };

            // Only update these if the row naturally uses them (tipo honorario)
            if (precio.tipo === "honorario") {
                updatePayload.valor_perito_calle = precio.valor_perito_calle;
                updatePayload.valor_perito_carga = precio.valor_perito_carga;
            } else if (precio.tipo === "kilometraje") {
                updatePayload.valor_perito_calle = precio.valor_perito_calle;
                updatePayload.valor_perito_carga = 0;
            } else {
                // Mano de obra (no peritos involved)
                updatePayload.valor_perito_calle = 0;
                updatePayload.valor_perito_carga = 0;
            }

            const { error } = await supabase
                .from("precios")
                .update(updatePayload)
                .eq("id", precio.id);

            if (error) {
                toast.error("Error al guardar: " + error.message);
            } else {
                toast.success(`Precio "${precio.concepto}" actualizado.`);
                setEditando(null);
            }
        });
    };

    const updatePrecio = (id: string, field: string, value: any) => {
        setPrecios(prev => prev.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    // Agrupar por tipo
    const grupos: Record<string, Precio[]> = {};
    precios.forEach(p => {
        if (!grupos[p.tipo]) grupos[p.tipo] = [];
        grupos[p.tipo].push(p);
    });

    const tipoLabels: Record<string, string> = {
        honorario: "Honorarios por Tipo de IP",
        kilometraje: "Kilometraje",
        mano_obra: "Mano de Obra (defaults)"
    };

    return (
        <div className="space-y-6">
            {Object.entries(grupos).map(([tipo, items]) => (
                <div key={tipo} className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-bg-tertiary border-b border-border">
                        <h3 className="font-semibold text-text-primary text-sm">{tipoLabels[tipo] || tipo}</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 text-text-muted text-xs">
                                    <th className="text-left px-4 py-2">Concepto</th>
                                    <th className="text-right px-4 py-2">Sancor Paga</th>
                                    {tipo === "honorario" && (
                                        <>
                                            <th className="text-right px-4 py-2 text-color-success">P. Calle</th>
                                            <th className="text-right px-4 py-2 text-color-info">P. Carga</th>
                                            <th className="text-right px-4 py-2 text-brand-primary">Margen</th>
                                        </>
                                    )}
                                    {tipo === "kilometraje" && (
                                        <>
                                            <th className="text-right px-4 py-2 text-color-success">P. Calle</th>
                                            <th className="text-right px-4 py-2 text-brand-primary">Margen</th>
                                        </>
                                    )}
                                    {tipo === "mano_obra" && (
                                        <th className="text-right px-4 py-2 text-text-muted">Valor Ref.</th>
                                    )}
                                    <th className="text-center px-4 py-2">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {items.map(p => {
                                    const isEditing = editando === p.id;
                                    let margen = p.valor_estudio;
                                    if (tipo === "honorario") margen = p.valor_estudio - (p.valor_perito_calle || 0) - (p.valor_perito_carga || 0);
                                    if (tipo === "kilometraje") margen = p.valor_estudio - (p.valor_perito_calle || 0);

                                    return (
                                        <tr key={p.id} className={`hover:bg-bg-tertiary/50 transition-colors ${!p.activo ? "opacity-40" : ""}`}>
                                            <td className="px-4 py-3 text-text-primary font-medium capitalize">
                                                {p.concepto.replace(/_/g, " ")}
                                                {p.descripcion && <span className="block text-xs text-text-muted">{p.descripcion}</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        value={p.valor_estudio}
                                                        onChange={e => updatePrecio(p.id, "valor_estudio", parseFloat(e.target.value) || 0)}
                                                        className="w-24 bg-bg-tertiary border border-brand-primary rounded px-2 py-1 text-right text-text-primary font-mono text-sm focus:outline-none"
                                                    />
                                                ) : (
                                                    <span className="font-mono text-text-primary font-medium">{formatCurrency(p.valor_estudio)}</span>
                                                )}
                                            </td>

                                            {/* HONORARIOS */}
                                            {tipo === "honorario" && (
                                                <>
                                                    <td className="px-4 py-3 text-right">
                                                        {isEditing ? (
                                                            <input type="number" value={p.valor_perito_calle} onChange={e => updatePrecio(p.id, "valor_perito_calle", parseFloat(e.target.value) || 0)}
                                                                className="w-20 bg-bg-tertiary border border-color-success/50 rounded px-2 py-1 text-right text-text-primary font-mono text-sm focus:outline-none" />
                                                        ) : (
                                                            <span className="font-mono text-color-success/80">{formatCurrency(p.valor_perito_calle)}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {isEditing ? (
                                                            <input type="number" value={p.valor_perito_carga} onChange={e => updatePrecio(p.id, "valor_perito_carga", parseFloat(e.target.value) || 0)}
                                                                className="w-20 bg-bg-tertiary border border-color-info/50 rounded px-2 py-1 text-right text-text-primary font-mono text-sm focus:outline-none" />
                                                        ) : (
                                                            <span className="font-mono text-color-info/80">{formatCurrency(p.valor_perito_carga)}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono text-brand-primary font-bold bg-brand-primary/5">
                                                        {formatCurrency(margen)}
                                                    </td>
                                                </>
                                            )}

                                            {/* KILOMETRAJE */}
                                            {tipo === "kilometraje" && (
                                                <>
                                                    <td className="px-4 py-3 text-right">
                                                        {isEditing ? (
                                                            <input type="number" value={p.valor_perito_calle} onChange={e => updatePrecio(p.id, "valor_perito_calle", parseFloat(e.target.value) || 0)}
                                                                className="w-20 bg-bg-tertiary border border-color-success/50 rounded px-2 py-1 text-right text-text-primary font-mono text-sm focus:outline-none" />
                                                        ) : (
                                                            <span className="font-mono text-color-success/80">{formatCurrency(p.valor_perito_calle)}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono text-brand-primary font-bold bg-brand-primary/5">
                                                        {formatCurrency(margen)}
                                                    </td>
                                                </>
                                            )}

                                            {/* MANO DE OBRA (Empty space to align buttons if needed, actually we just display Valor ref up there) */}
                                            {tipo === "mano_obra" && (
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-xs text-text-muted italic">Sólo referencia tabla manual</span>
                                                </td>
                                            )}

                                            <td className="px-4 py-3 text-center">
                                                {isEditing ? (
                                                    <Button size="sm" onClick={() => handleSave(p)} disabled={isPending}
                                                        className="bg-color-success hover:bg-color-success/90 h-7 text-xs">
                                                        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3 mr-1" /> Guardar</>}
                                                    </Button>
                                                ) : (
                                                    <button onClick={() => setEditando(p.id)}
                                                        className="text-xs text-brand-primary hover:text-text-primary transition-colors underline underline-offset-2">
                                                        Editar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}

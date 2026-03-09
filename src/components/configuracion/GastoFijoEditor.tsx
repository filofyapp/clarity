"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, Edit2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/formatters";

export function GastoFijoEditor({ valorInicial }: { valorInicial: number }) {
    const supabase = createClient();
    const [valor, setValor] = useState<number>(valorInicial);
    const [editando, setEditando] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        startTransition(async () => {
            // Check if it exists
            const { data } = await supabase.from("configuracion").select("id").eq("clave", "gasto_fijo_administrativo").single();

            let error;
            if (data) {
                const res = await supabase.from("configuracion").update({ valor: valor.toString() }).eq("clave", "gasto_fijo_administrativo");
                error = res.error;
            } else {
                const res = await supabase.from("configuracion").insert({ clave: "gasto_fijo_administrativo", valor: valor.toString() });
                error = res.error;
            }

            if (error) {
                toast.error("Error al guardar: " + error.message);
            } else {
                toast.success("Honorario administrativo actualizado correctamente.");
                setEditando(false);
            }
        });
    };

    return (
        <div className="bg-bg-secondary border border-border rounded-xl p-5 mt-6 w-full max-w-xl">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-semibold text-text-primary">Honorario Administrativo (Mensual)</h3>
                    <p className="text-sm text-text-muted mt-0.5">Monto de honorarios o abonos fijos. Se restará del reporte general para proyectar el Punto de Equilibrio.</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {editando ? (
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-text-muted">$</span>
                            <Input
                                type="number"
                                value={valor}
                                onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                                className="pl-7 w-40 bg-bg-tertiary border-brand-primary"
                                autoFocus
                            />
                        </div>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isPending}
                            className="bg-color-success hover:bg-color-success/90 text-white"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1.5" /> Confirmar</>}
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setEditando(false); setValor(valorInicial); }}
                            className="text-text-muted"
                        >
                            Cancelar
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-6">
                        <div className="text-2xl font-mono text-brand-secondary font-bold">
                            {formatCurrency(valor)}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setEditando(true)} className="border-border hover:bg-bg-tertiary">
                            <Edit2 className="w-3.5 h-3.5 mr-2 text-text-muted" /> Editar valor
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

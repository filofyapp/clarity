"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveInformePericial } from "./actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Loader2, Camera } from "lucide-react";
import { CamaraCaptura } from "./CamaraCaptura";

interface InformeProps {
    casoId: string;
    talleres: any[];
}

export function InformePericial({ casoId, talleres }: InformeProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const [acuerdaBase, setAcuerdaBase] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.append("caso_id", casoId);

        // Ensure checkbox is properly tracked
        if (acuerdaBase) {
            formData.append("acuerda_reparacion", "on");
        }

        startTransition(async () => {
            const result = await saveInformePericial(formData);
            if (result.error) {
                toast.error("Error guardando el informe: " + result.error);
            } else {
                toast.success("Informe de inspección enviado correctamente.");
                router.refresh(); // Trigger server components rebuild to reflect new state
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-bg-secondary border border-border rounded-xl p-4 sm:p-6 space-y-6">

                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-border pb-4">
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">Informe Ténico de Inspección</h3>
                        <p className="text-sm text-text-muted">Carga los detalles relevados insitu o en taller.</p>
                    </div>
                </div>

                {/* Acuerdos Generales */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-text-primary text-sm uppercase tracking-wider">Resolución</h4>

                    <div className="flex items-center space-x-2 bg-bg-tertiary p-3 rounded-md border border-border cursor-pointer" onClick={() => setAcuerdaBase(!acuerdaBase)}>
                        <input
                            type="checkbox"
                            id="acuerda"
                            checked={acuerdaBase}
                            onChange={(e) => setAcuerdaBase(e.target.checked)}
                            className="w-5 h-5 rounded border-border bg-transparent text-brand-primary focus:ring-brand-primary"
                        />
                        <Label htmlFor="acuerda" className="text-base font-medium text-text-primary cursor-pointer select-none">
                            ¿Se acuerda reparación con el asegurado / tercero?
                        </Label>
                    </div>

                    {acuerdaBase && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label htmlFor="taller_id" className="text-text-secondary">Taller Seleccionado / Derivado</Label>
                            <select
                                id="taller_id"
                                name="taller_id"
                                className="flex h-11 w-full rounded-md border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary appearance-none"
                            >
                                <option value="">Selecciona un taller (Opcional)</option>
                                {talleres.map((t) => (
                                    <option key={t.id} value={t.id}>{t.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Numeros Crudos */}
                <div className="space-y-4 border-t border-border pt-4">
                    <h4 className="font-semibold text-text-primary text-sm uppercase tracking-wider">Cálculos</h4>
                    <div className="space-y-2">
                        <Label htmlFor="monto_presupuesto" className="text-text-secondary">Monto de Presupuesto Estimado ($ ARS)</Label>
                        <Input
                            id="monto_presupuesto"
                            name="monto_presupuesto"
                            type="number"
                            placeholder="Ej. 1500000"
                            step="0.01"
                            className="bg-bg-tertiary border-border focus-visible:ring-brand-primary h-11 text-lg font-mono"
                        />
                        <p className="text-xs text-text-muted">Ingresa el presupuesto global acordado durante la revisión.</p>
                    </div>
                </div>

                {/* Glosas Libres */}
                <div className="space-y-4 border-t border-border pt-4">
                    <h4 className="font-semibold text-text-primary text-sm uppercase tracking-wider">Observaciones</h4>
                    <div className="space-y-2">
                        <Label htmlFor="observaciones" className="text-text-secondary">Notas del Inspector</Label>
                        <Textarea
                            id="observaciones"
                            name="observaciones"
                            placeholder="Detallar daños encontrados no declarados, piezas faltantes, estado general..."
                            className="bg-bg-tertiary border-border focus-visible:ring-brand-primary min-h-[120px]"
                        />
                    </div>
                </div>

                {/* Submódulo de Captura Visual Independiente */}
                <div className="pt-2">
                    <CamaraCaptura casoId={casoId} />
                </div>

                <Button
                    type="submit"
                    className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white h-12 font-bold text-lg"
                    disabled={isPending}
                >
                    {isPending ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Guardando Informe...</>
                    ) : (
                        <><Save className="w-5 h-5 mr-2" /> Finalizar Inspección</>
                    )}
                </Button>
            </div>
        </form>
    );
}

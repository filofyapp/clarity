"use client";

import { useState, useTransition } from "react";
import { marcarComoFacturada } from "@/app/(dashboard)/facturacion/actions";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ColaFacturacionProps {
    casos: any[];
}

export function ColaFacturacion({ casos }: ColaFacturacionProps) {
    const [isPending, startTransition] = useTransition();
    const [facturando, setFacturando] = useState<string | null>(null);
    const [facturaNros, setFacturaNros] = useState<Record<string, string>>({});

    const handleFacturar = (casoId: string) => {
        setFacturando(casoId);
        startTransition(async () => {
            const nro = facturaNros[casoId] || "";
            const result = await marcarComoFacturada(casoId, nro);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Caso marcado como facturado.");
            }
            setFacturando(null);
        });
    };

    const updateNro = (casoId: string, value: string) => {
        setFacturaNros(prev => ({ ...prev, [casoId]: value }));
    };

    if (casos.length === 0) {
        return (
            <div className="bg-bg-secondary border border-border rounded-xl p-8 text-center">
                <Check className="w-10 h-10 text-color-success opacity-40 mx-auto mb-3" />
                <p className="text-text-primary font-medium">No hay casos pendientes de facturación</p>
                <p className="text-text-muted text-sm mt-1">Todos los casos cerrados ya fueron facturados.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Cola de Facturación ({casos.length})</h2>

            <div className="space-y-3">
                {casos.map(caso => (
                    <div key={caso.id} className="bg-bg-secondary border border-border rounded-xl p-4 hover:border-border-hover transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            {/* Info del caso */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-mono font-bold text-text-primary text-sm">{caso.numero_siniestro}</span>
                                    <span className="text-text-muted text-xs">|</span>
                                    <span className="text-text-secondary text-xs">{caso.dominio}</span>
                                    <span className="text-text-muted text-xs">|</span>
                                    <span className="text-text-secondary text-xs">{caso.marca} {caso.modelo}</span>
                                </div>
                                <div className="text-xs text-text-muted">
                                    {caso.compania?.nombre} · Calle: {caso.perito_calle?.nombre} {caso.perito_calle?.apellido} · Carga: {caso.perito_carga?.nombre} {caso.perito_carga?.apellido}
                                </div>
                            </div>

                            {/* Inputs de montos */}
                            {/* Nro Factura Input solo */}
                            <div className="w-full lg:w-48 text-xs shrink-0">
                                <label className="text-text-muted block mb-1">Nro Factura (Opcional)</label>
                                <input
                                    type="text"
                                    className="w-full bg-bg-tertiary border border-border rounded px-2 py-1.5 text-text-primary font-mono focus:border-brand-primary focus:outline-none placeholder-text-muted/40"
                                    placeholder="Ej: 0001-00001234"
                                    onChange={e => updateNro(caso.id, e.target.value)}
                                />
                            </div>

                            {/* Botón facturar */}
                            <Button
                                onClick={() => handleFacturar(caso.id)}
                                disabled={isPending && facturando === caso.id}
                                className="bg-color-success hover:bg-color-success/90 text-white shrink-0 h-10"
                            >
                                {isPending && facturando === caso.id
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <><Check className="w-4 h-4 mr-1" /> Facturar</>
                                }
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

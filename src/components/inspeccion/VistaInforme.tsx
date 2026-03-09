"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, X, ShieldAlert, BadgeDollarSign, Truck, AlertCircle, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { cambiarEstadoCaso } from "@/app/(dashboard)/casos/[id]/actions";
import { toast } from "sonner";

interface VistaInformeProps {
    casoId: string;
    puedeOperar: boolean;
}

export function VistaInforme({ casoId, puedeOperar }: VistaInformeProps) {
    const supabase = createClient();
    const [informe, setInforme] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        async function fetchInforme() {
            setLoading(true);
            const { data, error } = await supabase
                .from("informes_periciales")
                .select("*, taller:talleres(nombre)")
                .eq("caso_id", casoId)
                .single();

            if (!error && data) {
                setInforme(data);
            }
            setLoading(false);
        }
        fetchInforme();
    }, [casoId, supabase]);

    const handleAction = (accion: "licitar_repuestos" | "aprobar_cierre") => {
        const nuevoEstado = accion === "licitar_repuestos" ? "licitando_repuestos" : "ip_cerrada";
        startTransition(async () => {
            const result = await cambiarEstadoCaso(casoId, nuevoEstado);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(
                    accion === "licitar_repuestos"
                        ? "Estado cambiado a Licitando Repuestos."
                        : "IP cerrada correctamente."
                );
            }
        });
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-10 bg-bg-tertiary rounded-md w-1/3"></div>
                <div className="h-32 bg-bg-tertiary rounded-md"></div>
            </div>
        );
    }

    if (!informe) {
        return (
            <div className="p-4 bg-bg-secondary border border-border rounded-lg text-center text-text-muted">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-text-muted opacity-50" />
                <p>El informe técnico no ha sido redactado aún.</p>
            </div>
        );
    }

    return (
        <div className="bg-bg-secondary rounded-xl border border-border p-6 mt-6 space-y-8 animate-in fade-in">
            <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                    <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-brand-secondary" />
                        Informe Pericial
                    </h3>
                    <p className="text-sm text-text-muted mt-1">
                        Completado el {new Date(informe.updated_at).toLocaleDateString('es-AR', { dateStyle: 'long' })}
                    </p>
                </div>

                <div className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 ${informe.se_acuerda ? 'bg-color-success-soft text-color-success' : 'bg-danger/10 text-danger'}`}>
                    {informe.se_acuerda ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {informe.se_acuerda ? "Acuerdo C/ Taller" : "Sin Acuerdo de Reparación"}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Diagnóstico */}
                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Taller Destino</h4>
                        <p className="text-text-primary bg-bg-tertiary px-3 py-2 rounded-md border border-border/50">
                            {informe.taller?.nombre || informe.taller_nombre_manual || "No especificado"}
                        </p>
                    </div>

                    {informe.reparar && (
                        <div>
                            <h4 className="text-sm font-semibold text-color-info uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Wrench className="w-4 h-4" /> A Reparar
                            </h4>
                            <p className="text-text-primary text-sm bg-color-info-soft/30 px-4 py-3 rounded-md whitespace-pre-wrap">{informe.reparar}</p>
                        </div>
                    )}

                    {informe.cambiar && (
                        <div>
                            <h4 className="text-sm font-semibold text-color-warning uppercase tracking-wider mb-2 flex items-center gap-1">
                                <ShoppingCart className="w-4 h-4" /> A Sustituir (Repuestos)
                            </h4>
                            <p className="text-text-primary text-sm bg-color-warning-soft/30 px-4 py-3 rounded-md whitespace-pre-wrap">{informe.cambiar}</p>
                        </div>
                    )}

                    {informe.pintar && (
                        <div>
                            <h4 className="text-sm font-semibold text-brand-primary uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Brush className="w-4 h-4" /> A Pintar
                            </h4>
                            <p className="text-text-primary text-sm bg-brand-primary-soft/30 px-4 py-3 rounded-md whitespace-pre-wrap">{informe.pintar}</p>
                        </div>
                    )}

                    {informe.observaciones && (
                        <div className="pt-4 border-t border-border/50">
                            <h4 className="text-sm font-semibold text-text-muted mb-2">Observaciones Adicionales</h4>
                            <p className="text-text-secondary text-sm italic">{informe.observaciones}</p>
                        </div>
                    )}
                </div>

                {/* Resumen Financiero */}
                <div className="bg-bg-tertiary rounded-lg p-6 border border-border h-fit space-y-6">
                    <h4 className="font-bold text-text-primary flex items-center gap-2 border-b border-border/50 pb-3">
                        <BadgeDollarSign className="w-5 h-5 text-color-success" />
                        Costos Acordados de Mano de Obra
                    </h4>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center text-text-secondary">
                            <span>Chapa ({informe.chapa_dias || 0} días)</span>
                            <span className="font-medium text-text-primary">{formatCurrency(informe.chapa_subtotal || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center text-text-secondary">
                            <span>Pintura ({informe.pintura_panos || 0} paños)</span>
                            <span className="font-medium text-text-primary">{formatCurrency(informe.pintura_subtotal || 0)}</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border flex justify-between items-center">
                        <span className="font-bold text-text-primary">Subtotal MO</span>
                        <span className="text-xl font-black text-color-success">{formatCurrency(informe.total_mano_obra || 0)}</span>
                    </div>

                    {/* Botonera de Acción para la Oficina */}
                    {puedeOperar && (
                        <div className="pt-8 space-y-3">
                            <p className="text-xs text-center text-text-muted mb-4 uppercase tracking-wider">Acciones de Resolución</p>

                            <Button
                                variant="outline"
                                className="w-full justify-between h-12 border-color-warning/50 hover:bg-color-warning-soft text-color-warning"
                                onClick={() => handleAction("licitar_repuestos")}
                                disabled={isPending}
                            >
                                <span className="flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4" /> Pasar a Licitación
                                </span>
                                <span className="text-xs opacity-70">Licita en Sancor</span>
                            </Button>

                            <Button
                                className="w-full justify-between h-12 bg-color-success hover:bg-color-success/90 text-white"
                                onClick={() => handleAction("aprobar_cierre")}
                                disabled={isPending}
                            >
                                <span className="flex items-center gap-2">
                                    <Check className="w-4 h-4" /> Cerrar IP
                                </span>
                                <span className="text-xs opacity-80">Marcar como cerrada</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Dummy Icon stubs within same file to avoid bloated imports if not used elsewhere
function Wrench(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
}
function Brush(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" /><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" /></svg>
}

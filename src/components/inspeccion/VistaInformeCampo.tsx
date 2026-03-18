"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    ShieldCheck, Hammer, Paintbrush, Wrench,
    MapPin, Clock, Mic, BadgeDollarSign,
    ShoppingCart, AlertCircle, ChevronDown
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";

interface Props {
    casoId: string;
}

export function VistaInformeCampo({ casoId }: Props) {
    const supabase = createClient();
    const [informe, setInforme] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [conformidadOpen, setConformidadOpen] = useState(false);

    useEffect(() => {
        async function fetch() {
            setLoading(true);
            const { data, error } = await supabase
                .from("informe_inspeccion_campo")
                .select("*")
                .eq("caso_id", casoId)
                .single();

            if (!error && data) setInforme(data);
            setLoading(false);
        }
        fetch();
    }, [casoId, supabase]);

    if (loading) {
        return (
            <div className="animate-pulse space-y-4 mb-6">
                <div className="h-10 bg-bg-tertiary rounded-md w-1/3" />
                <div className="h-40 bg-bg-tertiary rounded-md" />
            </div>
        );
    }

    if (!informe) return null; // No field inspection — VistaInforme will handle or show empty

    const manoDeObra: { concepto: string; valor: number; cantidad: number; unidad: string }[] = informe.mano_de_obra || [];
    const hasMO = manoDeObra.some(r => r.cantidad > 0);

    const parsePiezas = (text: string) =>
        (text || "").split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean);

    const firmaDate = informe.firma_timestamp
        ? new Date(informe.firma_timestamp).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : null;

    return (
        <div className="bg-bg-secondary rounded-xl border border-border p-6 mb-6 space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-border pb-4">
                <div>
                    <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-color-success" />
                        Informe de Inspección
                    </h3>
                    {informe.created_at && (
                        <p className="text-sm text-text-muted mt-1 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(informe.created_at).toLocaleDateString("es-AR", { dateStyle: "long" })}
                        </p>
                    )}
                </div>
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                    Inspección Presencial
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column: Pieces + Observations */}
                <div className="space-y-5">
                    {/* Piezas por Cambiar */}
                    {informe.piezas_cambiar && parsePiezas(informe.piezas_cambiar).length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-danger uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <ShoppingCart className="w-4 h-4" /> Piezas por Cambiar
                            </h4>
                            <ul className="text-sm text-text-primary bg-danger/5 border border-danger/10 px-4 py-3 rounded-lg space-y-1">
                                {parsePiezas(informe.piezas_cambiar).map((p: string, i: number) => (
                                    <li key={i}>• {p}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Piezas por Reparar */}
                    {informe.piezas_reparar && parsePiezas(informe.piezas_reparar).length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-color-warning uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Wrench className="w-4 h-4" /> Piezas por Reparar
                            </h4>
                            <ul className="text-sm text-text-primary bg-color-warning/5 border border-color-warning/10 px-4 py-3 rounded-lg space-y-1">
                                {parsePiezas(informe.piezas_reparar).map((p: string, i: number) => (
                                    <li key={i}>• {p}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Piezas por Pintar */}
                    {informe.piezas_pintar && parsePiezas(informe.piezas_pintar).length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-color-info uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Paintbrush className="w-4 h-4" /> Piezas por Pintar
                            </h4>
                            <ul className="text-sm text-text-primary bg-color-info/5 border border-color-info/10 px-4 py-3 rounded-lg space-y-1">
                                {parsePiezas(informe.piezas_pintar).map((p: string, i: number) => (
                                    <li key={i}>• {p}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Observaciones */}
                    {informe.observaciones && (
                        <div className="pt-2 border-t border-border/50">
                            <h4 className="text-sm font-semibold text-text-muted mb-2">Observaciones</h4>
                            <p className="text-text-secondary text-sm whitespace-pre-wrap">{informe.observaciones}</p>
                        </div>
                    )}

                    {/* Audio */}
                    {informe.audio_url && (
                        <div className="pt-2">
                            <h4 className="text-sm font-semibold text-text-muted mb-2 flex items-center gap-1.5">
                                <Mic className="w-4 h-4" /> Audio de Observaciones
                            </h4>
                            <audio controls className="w-full" src={informe.audio_url} />
                        </div>
                    )}
                </div>

                {/* Right column: MO + Firma */}
                <div className="space-y-5">
                    {/* Mano de Obra */}
                    {hasMO && (
                        <div className="bg-bg-tertiary rounded-xl p-5 border border-border space-y-4">
                            <h4 className="font-bold text-text-primary flex items-center gap-2 border-b border-border/50 pb-3">
                                <BadgeDollarSign className="w-5 h-5 text-color-success" />
                                Mano de Obra Acordada
                            </h4>
                            <div className="space-y-2 text-sm">
                                {manoDeObra.filter(r => r.cantidad > 0).map((r, i) => (
                                    <div key={i} className="flex justify-between items-center text-text-secondary">
                                        <span>{r.concepto} ({r.cantidad} {r.unidad})</span>
                                        <span className="font-medium text-text-primary font-mono">{formatCurrency(r.valor * r.cantidad)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-3 border-t border-border flex justify-between items-center">
                                <span className="font-bold text-text-primary">Total MO</span>
                                <span className="text-xl font-black text-color-success font-mono">{formatCurrency(informe.total_mano_de_obra || 0)}</span>
                            </div>
                        </div>
                    )}

                    {/* Conformidad del Taller — Collapsible (closed by default) */}
                    {(informe.resumen_firmado_url || informe.firma_url) && (
                        <div className="bg-bg-tertiary rounded-xl border border-color-success/30 overflow-hidden">
                            <button
                                onClick={() => setConformidadOpen(prev => !prev)}
                                className="w-full flex items-center justify-between px-5 py-4 text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-color-success" />
                                    <span className="font-bold text-text-primary text-sm">Conformidad del Taller</span>
                                    <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-color-success/10 text-color-success rounded-full">
                                        Firmado ✓
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-text-muted">
                                    {firmaDate && <span className="text-[11px] hidden sm:inline">{firmaDate}</span>}
                                    <span className="text-[11px] text-text-muted">{conformidadOpen ? 'Ocultar' : 'Ver detalle'}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${conformidadOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </button>

                            {/* Expandable detail */}
                            <div className={`transition-all duration-300 overflow-hidden ${conformidadOpen ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="px-5 pb-5 space-y-4 border-t border-color-success/10">
                                    {/* Resumen firmado image */}
                                    {informe.resumen_firmado_url && (
                                        <a href={informe.resumen_firmado_url} target="_blank" rel="noopener noreferrer" className="block mt-4">
                                            <img
                                                src={informe.resumen_firmado_url}
                                                alt="Resumen firmado"
                                                className="max-w-[400px] w-full mx-auto rounded-lg border border-border hover:border-brand-primary/50 transition-colors cursor-pointer"
                                            />
                                        </a>
                                    )}

                                    {/* Meta */}
                                    <div className="space-y-1.5 text-xs text-text-muted">
                                        {firmaDate && (
                                            <p className="flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" /> {firmaDate}
                                            </p>
                                        )}
                                        {informe.firma_latitud && informe.firma_longitud && (
                                            <a
                                                href={`https://www.google.com/maps?q=${informe.firma_latitud},${informe.firma_longitud}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-brand-primary hover:underline"
                                            >
                                                <MapPin className="w-3 h-3" />
                                                {Number(informe.firma_latitud).toFixed(4)}, {Number(informe.firma_longitud).toFixed(4)}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

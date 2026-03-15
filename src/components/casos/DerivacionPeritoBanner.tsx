"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Send, Loader2, Mail, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogTitle, DialogDescription,
    DialogFooter, DialogHeader
} from "@/components/ui/dialog";

interface Props {
    casoId: string;
    siniestro: string;
    peritoNombre?: string;
    peritoEmail?: string;
    fechaInspeccion?: string;
    direccion?: string;
    localidad?: string;
    vehiculo?: string;
    dominio?: string;
    gestorNombre?: string;
    descripcion?: string;
    derivacionEnviadaAt?: string | null;
    esNuevo?: boolean; // ?nuevo=1
}

export function DerivacionPeritoBanner({
    casoId, siniestro, peritoNombre, peritoEmail,
    fechaInspeccion, direccion, localidad, vehiculo, dominio,
    gestorNombre, descripcion, derivacionEnviadaAt, esNuevo
}: Props) {
    const [bannerVisible, setBannerVisible] = useState(!!esNuevo);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [lastSent, setLastSent] = useState(derivacionEnviadaAt);
    const supabase = createClient();

    // Validation
    const faltantes: string[] = [];
    if (!peritoEmail) faltantes.push("perito de calle con email");
    if (!fechaInspeccion) faltantes.push("fecha de inspección");
    if (!direccion) faltantes.push("dirección");
    const puedEnviar = faltantes.length === 0;

    const handleSend = async () => {
        setSending(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch("/api/derivacion/enviar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ casoId }),
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);
            toast.success(`Derivación enviada a ${body.enviadoA || peritoNombre}`);
            setLastSent(new Date().toISOString());
            setBannerVisible(false);
            setDialogOpen(false);
        } catch (err: any) {
            toast.error("Error: " + (err.message || "No se pudo enviar"));
        }
        setSending(false);
    };

    const formatDate = (d: string) => {
        try {
            return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
        } catch { return d; }
    };

    return (
        <>
            {/* Banner post-creación (una sola vez) */}
            {bannerVisible && (
                <div className="bg-brand-primary/10 border border-brand-primary/30 rounded-xl p-5 space-y-3 animate-in fade-in slide-in-from-top-3 duration-500">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-color-success" />
                            <span className="font-semibold text-text-primary">Caso creado exitosamente</span>
                        </div>
                        <button onClick={() => setBannerVisible(false)} className="text-text-muted hover:text-text-primary">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-sm text-text-secondary">¿Enviar derivación al perito de calle?</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setBannerVisible(false)}>
                            Ahora no
                        </Button>
                        <Button
                            size="sm"
                            className="bg-brand-primary hover:bg-brand-primary/90 text-white"
                            onClick={() => { if (puedEnviar) setDialogOpen(true); }}
                            disabled={!puedEnviar}
                            title={!puedEnviar ? `Completá: ${faltantes.join(", ")}` : undefined}
                        >
                            <Send className="w-4 h-4 mr-2" /> Enviar derivación
                        </Button>
                    </div>
                    {!puedEnviar && (
                        <p className="text-[11px] text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                            Completá {faltantes.join(", ")} para poder enviar.
                        </p>
                    )}
                </div>
            )}

            {/* Botón permanente en expediente */}
            {!bannerVisible && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        if (puedEnviar) setDialogOpen(true);
                        else toast.error(`Completá: ${faltantes.join(", ")}`);
                    }}
                    className="text-xs gap-1.5"
                    title={!puedEnviar ? `Completá: ${faltantes.join(", ")}` : "Enviar derivación al perito de calle"}
                >
                    <Mail className="w-3.5 h-3.5" /> Enviar derivación
                </Button>
            )}

            {/* Preview Dialog */}
            <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-brand-primary" /> Derivación a Perito de Calle
                        </DialogTitle>
                        <DialogDescription>
                            {lastSent
                                ? `Ya se envió una derivación el ${formatDate(lastSent)}. ¿Enviar nuevamente?`
                                : "Se enviará el siguiente mail:"
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 text-sm">
                        {/* Resend warning */}
                        {lastSent && (
                            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>Ya se envió una derivación el {formatDate(lastSent)}. ¿Enviar nuevamente?</span>
                            </div>
                        )}

                        {/* Email preview */}
                        <div className="bg-bg-tertiary/50 border border-border rounded-lg p-3 space-y-1.5">
                            <div className="flex gap-2">
                                <span className="text-text-muted w-12 shrink-0">Para:</span>
                                <span className="text-text-primary font-medium">{peritoNombre} ({peritoEmail})</span>
                            </div>
                            <div className="flex gap-2 pt-1 border-t border-border/50 mt-1">
                                <span className="text-text-muted shrink-0">Asunto:</span>
                                <span className="text-text-primary font-semibold">NUEVA DERIVACIÓN STRO {siniestro}</span>
                            </div>
                        </div>

                        {/* Body preview */}
                        <div className="bg-white dark:bg-bg-secondary border border-border rounded-lg p-4 text-text-primary leading-relaxed space-y-2">
                            <p className="font-semibold">📋 Nueva Derivación</p>
                            <p><strong>Siniestro:</strong> {siniestro}</p>
                            {fechaInspeccion && <p>📅 <strong>Fecha:</strong> {fechaInspeccion}</p>}
                            {direccion && <p>📍 <strong>Dirección:</strong> {direccion}</p>}
                            {localidad && <p>📍 <strong>Localidad:</strong> {localidad}</p>}
                            {vehiculo && <p>🚗 <strong>Vehículo:</strong> {vehiculo}</p>}
                            {dominio && <p>🔖 <strong>Patente:</strong> {dominio}</p>}
                            {gestorNombre && <p>👤 <strong>Gestor:</strong> {gestorNombre}</p>}
                            {descripcion && (
                                <div className="pt-2 border-t border-border/50">
                                    <p className="font-semibold text-xs text-text-muted mb-1">📝 Descripción:</p>
                                    <p className="text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">{descripcion.substring(0, 500)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={sending}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={sending}
                            className="bg-brand-primary hover:bg-brand-primary/90 text-white"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            {lastSent ? "Reenviar derivación" : "Enviar derivación"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

"use client";

import { useState, useTransition, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Clock, Car, Building2, Hash, User, ChevronRight,
    Loader2, Send, FileCheck, XCircle, AlertTriangle, ShieldCheck,
    MoreVertical, ArrowRightLeft, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogTitle, DialogDescription,
    DialogFooter, DialogHeader
} from "@/components/ui/dialog";
import Link from "next/link";

interface CasoCarga {
    id: string;
    numero_siniestro: string;
    marca?: string;
    dominio?: string;
    tipo_inspeccion?: string;
    created_at: string;
    updated_at: string;
    fecha_inspeccion_real?: string;
    fecha_carga_sistema?: string;
    nombre_asegurado?: string;
    compania?: { nombre: string } | null;
    perito_calle?: { nombre: string; apellido: string } | null;
    perito_carga?: { nombre: string; apellido: string } | null;
}

interface ColaDeCargaBoardProps {
    casos: CasoCarga[];
}

type AccionCarga = "licitando_repuestos" | "pendiente_presupuesto" | "ip_cerrada";

const ACCIONES: { value: AccionCarga; label: string; icon: React.ReactNode; description: string }[] = [
    { value: "licitando_repuestos", label: "Enviar a Licitar", icon: <Send className="w-4 h-4" />, description: "Solicitar cotización de repuestos a proveedores" },
    { value: "pendiente_presupuesto", label: "Pendiente Presupuesto", icon: <FileCheck className="w-4 h-4" />, description: "Marcar como pendiente de presupuesto del taller" },
    { value: "ip_cerrada", label: "Cerrar Inspección", icon: <XCircle className="w-4 h-4" />, description: "Cerrar el informe pericial y enviar a compañía" },
];

function getAntiguedad(fecha: string): { label: string; isOld: boolean; hours: number; color: string } {
    const now = new Date();
    const created = new Date(fecha);
    const diffMs = now.getTime() - created.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    const diffD = Math.floor(diffH / 24);

    let label: string;
    if (diffH < 1) {
        label = `Hace ${diffMin} min`;
    } else if (diffH < 24) {
        label = `Hace ${diffH} hs`;
    } else {
        label = `Hace ${diffD}d ${diffH % 24}hs`;
    }

    // Color: < 12h normal, 12-24h amber, > 24h red
    let color = "bg-bg-tertiary text-text-muted border border-border";
    if (diffH >= 24) {
        color = "bg-red-500/15 text-red-400 border border-red-500/30";
    } else if (diffH >= 12) {
        color = "bg-amber-500/15 text-amber-400 border border-amber-500/30";
    }

    return { label, isOld: diffH >= 24, hours: diffH, color };
}

export function ColaDeCargaBoard({ casos: initialCasos }: ColaDeCargaBoardProps) {
    const [casos, setCasos] = useState(initialCasos);
    const [confirmDialog, setConfirmDialog] = useState<{ casoId: string; accion: AccionCarga; siniestro: string } | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const supabase = createClient();

    // ═══ Migration config (loaded from DB) ═══
    const [migConfig, setMigConfig] = useState({ to: "rcardozo@sancorseguros.com", cc: ["MCossa@sancorseguros.com", "SGuzman@sancorseguros.com"], usuario: "ALFREDO MIÑO" });
    const [migracionDialog, setMigracionDialog] = useState<{ id: string; siniestro: string; marca?: string; dominio?: string } | null>(null);
    const [migracionSending, setMigracionSending] = useState(false);

    useEffect(() => {
        supabase.from("configuracion").select("clave, valor").in("clave", ["migracion_email_to", "migracion_email_cc", "migracion_usuario_destino"]).then(({ data }) => {
            if (!data) return;
            const m: Record<string, any> = {};
            data.forEach(r => { m[r.clave] = r.valor; });
            setMigConfig({
                to: (typeof m.migracion_email_to === "string" ? m.migracion_email_to : migConfig.to).replace(/"/g, ""),
                cc: Array.isArray(m.migracion_email_cc) ? m.migracion_email_cc : migConfig.cc,
                usuario: (typeof m.migracion_usuario_destino === "string" ? m.migracion_usuario_destino : migConfig.usuario).replace(/"/g, ""),
            });
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sort by time in pendiente_carga (oldest first)
    const sorted = [...casos].sort((a, b) =>
        new Date(a.fecha_inspeccion_real || a.fecha_carga_sistema || a.updated_at).getTime() - new Date(b.fecha_inspeccion_real || b.fecha_carga_sistema || b.updated_at).getTime()
    );

    const handleProcesar = async () => {
        if (!confirmDialog) return;
        const { casoId, accion } = confirmDialog;

        startTransition(async () => {
            const { error } = await supabase
                .from("casos")
                .update({ estado: accion })
                .eq("id", casoId);

            if (error) {
                toast.error("Error al procesar caso: " + error.message);
            } else {
                toast.success(`Caso procesado → ${ACCIONES.find(a => a.value === accion)?.label}`);
                // Animate out
                setCasos(prev => prev.filter(c => c.id !== casoId));
                router.refresh();
            }
            setConfirmDialog(null);
        });
    };

    // Migration handler — sends email immediately, NOT via queue
    const handleMigracion = async () => {
        if (!migracionDialog) return;
        setMigracionSending(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch("/api/migracion/enviar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ casoId: migracionDialog.id }),
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);
            toast.success("Solicitud de migración enviada");
            setCasos(prev => prev.filter(c => c.id !== migracionDialog.id));
            router.refresh();
        } catch (err: any) {
            toast.error("Error: " + (err.message || "No se pudo enviar"));
        }
        setMigracionSending(false);
        setMigracionDialog(null);
    };

    if (casos.length === 0) {
        return (
            <div className="flex flex-col flex-1 h-[60vh] items-center justify-center p-8 text-center bg-bg-secondary/50 rounded-xl border border-dashed border-border animate-in fade-in duration-500">
                <ShieldCheck className="w-16 h-16 text-color-success mb-4" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">Oficina al día</h3>
                <p className="text-text-muted max-w-sm">
                    No tienes informes técnicos listos para cerrar o cotizar por el momento. 🎉
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Header Banner */}
            <div className="bg-bg-secondary border border-border rounded-xl px-5 py-4 flex items-center justify-between animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/15 rounded-lg">
                        <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-text-primary">{casos.length} {casos.length === 1 ? "caso pendiente" : "casos pendientes"}</p>
                        <p className="text-xs text-text-muted">Ordenados por antigüedad — los más viejos primero</p>
                    </div>
                </div>
            </div>

            {/* Cards */}
            <div className="space-y-3 mt-4">
                {sorted.map((caso, idx) => {
                    const antiguedad = getAntiguedad(caso.fecha_inspeccion_real || caso.fecha_carga_sistema || caso.updated_at);
                    return (
                        <div
                            key={caso.id}
                            className={`group bg-bg-secondary border rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:border-brand-primary/20 animate-in slide-in-from-bottom-2 ${
                                antiguedad.isOld ? "border-red-500/30 bg-red-950/5" : "border-border"
                            }`}
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            <div className="flex items-center justify-between gap-4">
                                {/* Left: Main info */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    {/* Siniestro number - Prominent */}
                                    <div className="shrink-0">
                                        <Link
                                            href={`/casos/${caso.id}`}
                                            className="flex items-center gap-1.5 text-accent-text hover:underline"
                                        >
                                            <Hash className="w-4 h-4" />
                                            <span className="font-bold font-mono text-lg tracking-wide">{caso.numero_siniestro}</span>
                                        </Link>
                                    </div>

                                    {/* Separator */}
                                    <div className="h-8 w-px bg-border shrink-0 hidden sm:block" />

                                    {/* Vehicle & Details */}
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                        {caso.marca && (
                                            <span className="flex items-center gap-1 text-text-primary">
                                                <Car className="w-3.5 h-3.5 text-text-muted" />
                                                {caso.marca}
                                            </span>
                                        )}
                                        {caso.dominio && (
                                            <span className="font-mono text-xs bg-bg-tertiary px-2 py-0.5 rounded border border-border uppercase tracking-wider text-text-primary">
                                                {caso.dominio}
                                            </span>
                                        )}
                                        {caso.compania?.nombre && (
                                            <span className="flex items-center gap-1 text-text-muted text-xs">
                                                <Building2 className="w-3 h-3" />
                                                {caso.compania.nombre}
                                            </span>
                                        )}
                                        {caso.perito_calle && (
                                            <span className="flex items-center gap-1 text-text-muted text-xs">
                                                <User className="w-3 h-3" />
                                                {caso.perito_calle.nombre} {caso.perito_calle.apellido}
                                            </span>
                                        )}
                                        {caso.tipo_inspeccion && (
                                            <span className="text-[10px] uppercase tracking-wider bg-brand-primary/10 text-brand-primary font-semibold px-2 py-0.5 rounded-full">
                                                {caso.tipo_inspeccion}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Antiquity + Actions */}
                                <div className="flex items-center gap-3 shrink-0">
                                    {/* Antiquity badge */}
                                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${antiguedad.color}`}>
                                        {antiguedad.isOld && <AlertTriangle className="w-3 h-3" />}
                                        <Clock className="w-3 h-3" />
                                        <span>{antiguedad.label}</span>
                                    </div>

                                    {/* Process Dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-1.5 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10 hover:border-brand-primary font-semibold"
                                            >
                                                Procesar
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-64 bg-bg-elevated border border-border z-50">
                                            {ACCIONES.map((accion, i) => (
                                                <DropdownMenuItem
                                                    key={accion.value}
                                                    onClick={() => setConfirmDialog({
                                                        casoId: caso.id,
                                                        accion: accion.value,
                                                        siniestro: caso.numero_siniestro
                                                    })}
                                                    className="flex flex-col items-start gap-0.5 py-2.5 cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-2 font-medium">
                                                        {accion.icon}
                                                        {accion.label}
                                                    </div>
                                                    <p className="text-[11px] text-text-muted pl-6">{accion.description}</p>
                                                </DropdownMenuItem>
                                            ))}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => setMigracionDialog({
                                                    id: caso.id,
                                                    siniestro: caso.numero_siniestro,
                                                    marca: caso.marca,
                                                    dominio: caso.dominio,
                                                })}
                                                className="flex flex-col items-start gap-0.5 py-2.5 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2 font-medium text-indigo-500">
                                                    <ArrowRightLeft className="w-4 h-4" />
                                                    Pedir Migración
                                                </div>
                                                <p className="text-[11px] text-text-muted pl-6">Solicitar migración del siniestro al usuario de {migConfig.usuario}</p>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* Link to case */}
                                    <Link href={`/casos/${caso.id}`}>
                                        <Button variant="ghost" size="icon" className="text-text-muted hover:text-text-primary">
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirmar Acción</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que querés <strong>{ACCIONES.find(a => a.value === confirmDialog?.accion)?.label.toLowerCase()}</strong> el
                            siniestro <strong className="font-mono">{confirmDialog?.siniestro}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setConfirmDialog(null)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleProcesar}
                            disabled={isPending}
                            className="bg-brand-primary hover:bg-brand-primary-hover text-white"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Migration Preview Dialog */}
            <Dialog open={!!migracionDialog} onOpenChange={(open) => !open && setMigracionDialog(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-indigo-500" /> Pedir Migración
                        </DialogTitle>
                        <DialogDescription>
                            Se enviará el siguiente mail:
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 text-sm">
                        {/* Recipients */}
                        <div className="bg-bg-tertiary/50 border border-border rounded-lg p-3 space-y-1.5">
                            <div className="flex gap-2">
                                <span className="text-text-muted w-8 shrink-0">Para:</span>
                                <span className="text-text-primary font-medium">{migConfig.to}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-text-muted w-8 shrink-0">CC:</span>
                                <span className="text-text-secondary">{migConfig.cc.join(", ")}</span>
                            </div>
                            <div className="flex gap-2 pt-1 border-t border-border/50 mt-1">
                                <span className="text-text-muted shrink-0">Asunto:</span>
                                <span className="text-text-primary font-semibold">PEDIDO DE MIGRACION STRO {migracionDialog?.siniestro}</span>
                            </div>
                        </div>

                        {/* Body preview */}
                        <div className="bg-white dark:bg-bg-secondary border border-border rounded-lg p-4 text-text-primary leading-relaxed">
                            <p>Buenos días estimados, los molesto para migrar el siguiente siniestro al usuario de {migConfig.usuario}:</p>
                            <div className="mt-3 space-y-1">
                                <p><strong>Siniestro:</strong> {migracionDialog?.siniestro}</p>
                                <p><strong>Vehículo:</strong> {migracionDialog?.marca || "—"}</p>
                                <p><strong>Dominio:</strong> {migracionDialog?.dominio || "—"}</p>
                            </div>
                            <p className="mt-3">¡Muchas gracias!</p>
                        </div>

                        {/* State change note */}
                        <div className="flex items-start gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 text-xs text-indigo-400">
                            <ArrowRightLeft className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                                El caso pasará a <strong>"En Consulta con Cía"</strong> y volverá a <strong>"Pdte. de Carga"</strong> automáticamente cuando respondan.
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setMigracionDialog(null)} disabled={migracionSending}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleMigracion}
                            disabled={migracionSending}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {migracionSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Enviar solicitud
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

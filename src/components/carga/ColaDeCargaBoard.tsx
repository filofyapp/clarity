"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Clock, Car, Building2, Hash, User, ChevronRight,
    Loader2, Send, FileCheck, XCircle, AlertTriangle, ShieldCheck,
    MoreVertical
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

function getAntiguedad(fecha: string): { label: string; isOld: boolean; hours: number } {
    const now = new Date();
    const created = new Date(fecha);
    const diffMs = now.getTime() - created.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    const diffD = Math.floor(diffH / 24);

    if (diffD > 0) {
        return { label: `${diffD}d ${diffH % 24}h`, isOld: diffH >= 24, hours: diffH };
    }
    return { label: `${diffH}h`, isOld: diffH >= 24, hours: diffH };
}

export function ColaDeCargaBoard({ casos: initialCasos }: ColaDeCargaBoardProps) {
    const [casos, setCasos] = useState(initialCasos);
    const [confirmDialog, setConfirmDialog] = useState<{ casoId: string; accion: AccionCarga; siniestro: string } | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const supabase = createClient();

    // Sort by antiquity descending (oldest first)
    const sorted = [...casos].sort((a, b) =>
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
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
                    const antiguedad = getAntiguedad(caso.updated_at);
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
                                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                        antiguedad.isOld
                                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                                            : "bg-bg-tertiary text-text-muted border border-border"
                                    }`}>
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
        </>
    );
}

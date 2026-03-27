"use client";

import { useState, useTransition } from "react";
import { cambiarEstadoCaso } from "@/app/(dashboard)/casos/[id]/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";

const ESTADOS_DISPONIBLES: Record<string, string> = {
    ip_coordinada: "IP Coordinada",
    pendiente_coordinacion: "Pdte. Coordinación",
    contactado: "Contactado",
    en_consulta_cia: "En Consulta Cía",
    pendiente_carga: "Pdte. Carga",
    pendiente_presupuesto: "Pdte. Presupuesto",
    licitando_repuestos: "Licitando Repuestos",
    ip_reclamada_perito: "Reclamada Perito",
    esperando_respuesta_tercero: "Esp. Respuesta 3°",
    inspeccion_anulada: "Anulada",
    ip_cerrada: "IP Cerrada",
    facturada: "Facturada",
};

interface SelectorEstadoProps {
    casoId: string;
    estadoActual: string;
    userRol: string;
}

export function SelectorEstado({ casoId, estadoActual, userRol }: SelectorEstadoProps) {
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const router = useRouter();

    // Filtrar estados según rol
    const getEstadosPermitidos = () => {
        if (userRol === "admin" || userRol === "carga") return Object.keys(ESTADOS_DISPONIBLES);
        if (userRol === "calle") return ["pendiente_carga"];
        return [];
    };

    const estadosPermitidos = getEstadosPermitidos().filter(e => e !== estadoActual);
    if (estadosPermitidos.length === 0) return null;

    const handleCambio = (nuevoEstado: string) => {
        setOpen(false);
        startTransition(async () => {
            const result = await cambiarEstadoCaso(casoId, nuevoEstado);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`Estado cambiado a ${ESTADOS_DISPONIBLES[nuevoEstado]}`);
                router.refresh();
            }
        });
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                disabled={isPending}
                className="flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-bg-tertiary border border-border rounded-md px-3 py-1.5 hover:bg-bg-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronDown className="w-3 h-3" />}
                Cambiar estado
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-bg-elevated border border-border rounded-lg shadow-xl overflow-hidden">
                        {estadosPermitidos.map(estado => (
                            <button
                                key={estado}
                                onClick={() => handleCambio(estado)}
                                className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors first:rounded-t-lg last:rounded-b-lg"
                            >
                                {ESTADOS_DISPONIBLES[estado]}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

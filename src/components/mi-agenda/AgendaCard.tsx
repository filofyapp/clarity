"use client";

import { MapPin, Phone, Car, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { marcarInspeccionRealizada } from "@/app/(dashboard)/casos/[id]/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AgendaCardProps {
    caso: any;
}

export function AgendaCard({ caso }: AgendaCardProps) {
    const [isPending, startTransition] = useTransition();
    const [marcado, setMarcado] = useState(false);
    const router = useRouter();

    const formatPhone = (phone: string) => {
        if (!phone) return "";
        return phone.replace(/\D/g, "");
    };

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${caso.direccion_inspeccion || ""}, ${caso.localidad || ""}`)}`;

    const handleInspeccionRealizada = () => {
        startTransition(async () => {
            const result = await marcarInspeccionRealizada(caso.id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Inspección realizada — caso pasado a Pendiente de Carga");
                setMarcado(true);
                router.refresh();
            }
        });
    };

    if (marcado) {
        return (
            <div className="bg-success/5 border border-success/20 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
                <CheckCircle2 className="w-10 h-10 text-success mb-3" />
                <p className="text-sm font-medium text-text-primary">{caso.numero_siniestro}</p>
                <p className="text-xs text-success mt-1">Inspección completada</p>
            </div>
        );
    }

    const formatDateLocal = (dateStr: string) => {
        if (!dateStr) return "Fecha a definir";
        const safeDateStr = dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`;
        return format(new Date(safeDateStr), "EEEE d 'de' MMMM", { locale: es });
    };

    return (
        <div className="bg-bg-secondary border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border bg-bg-tertiary flex justify-between items-center">
                <div className="w-full">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-lg text-text-primary">{caso.numero_siniestro}</h3>
                        <span className="text-xs font-medium text-brand-secondary bg-brand-primary/10 px-2 py-1 rounded-md border border-brand-primary/20 capitalize">
                            {formatDateLocal(caso.fecha_inspeccion_programada)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="bg-bg-primary font-mono text-xs px-2 py-0.5 rounded text-text-primary uppercase flex items-center gap-1">
                            <Car className="w-3 h-3" /> {caso.dominio || "S/D"}
                        </span>
                        <span className="text-xs text-text-muted">{caso.marca} {caso.modelo}</span>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-3 flex-1">
                {caso.nombre_asegurado && (
                    <p className="text-sm text-text-secondary">👤 {caso.nombre_asegurado}</p>
                )}
                <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-brand-secondary shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-text-primary">{caso.direccion_inspeccion || "Sin dirección"}</p>
                        <p className="text-xs text-text-muted">{caso.localidad}</p>
                    </div>
                </div>

                {caso.telefono_asegurado && (
                    <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-brand-secondary shrink-0" />
                        <p className="text-sm font-medium text-text-primary">{caso.telefono_asegurado}</p>
                    </div>
                )}
            </div>

            <div className="p-4 pt-0 mt-auto space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm"
                        className="w-full text-xs h-10 border-border bg-bg-tertiary"
                        onClick={() => window.open(mapsUrl, '_blank')}>
                        <MapPin className="w-4 h-4 mr-2 text-text-muted" /> GPS
                    </Button>
                    <Button variant="outline" size="sm"
                        className="w-full text-xs h-10 border-border bg-bg-tertiary"
                        onClick={() => window.open(`tel:${formatPhone(caso.telefono_asegurado)}`, '_self')}
                        disabled={!caso.telefono_asegurado}>
                        <Phone className="w-4 h-4 mr-2 text-text-muted" /> Llamar
                    </Button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    <Link href={`/casos/${caso.id}`}>
                        <Button variant="outline" className="w-full h-11 text-xs font-semibold border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition-colors">
                            Ver Expediente
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

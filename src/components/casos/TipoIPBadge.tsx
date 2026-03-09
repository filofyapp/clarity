import { Badge } from "@/components/ui/badge";

const TIPO_IP_LABELS: Record<string, string> = {
    ip_con_orden: "IP con Orden",
    posible_dt: "Posible DT",
    ip_sin_orden: "IP sin Orden",
    ampliacion: "Ampliación",
    ausente: "Ausente",
    terceros: "Terceros",
    ip_camiones: "IP Camiones",
    ip_remota: "IP Remota",
    sin_honorarios: "Sin Honorarios",
    ip_final_intermedia: "Final/Inter",
};

export function TipoIPBadge({ tipo, compacto }: { tipo: string, compacto?: boolean }) {
    const fallbackLabel = tipo.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // Posible DT could have a distinct warning color, others use secondary
    const isDT = tipo === "posible_dt";

    return (
        <Badge
            variant="secondary"
            className={`rounded-sm whitespace-nowrap font-medium ${isDT ? "bg-danger/10 text-danger hover:bg-danger/20" : "bg-bg-surface text-text-secondary hover:bg-bg-elevated"} ${compacto ? 'px-1 py-0.5 text-[10px]' : 'px-2 py-0.5'}`}
        >
            {TIPO_IP_LABELS[tipo] || fallbackLabel}
        </Badge>
    );
}

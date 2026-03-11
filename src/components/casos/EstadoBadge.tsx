import { Badge } from "@/components/ui/badge";

const ESTADO_LABELS: Record<string, string> = {
    ip_coordinada: "IP Coordinada",
    pendiente_coordinacion: "Pdte. Coordinación",
    contactado: "Contactado",
    pendiente_carga: "Pdte. Carga",
    pendiente_presupuesto: "Pdte. Presupuesto",
    licitando_repuestos: "Licitando",
    en_consulta_cia: "En Consulta Cía",
    ip_reclamada_perito: "Reclamada Perito",
    esperando_respuesta_tercero: "Esp. Resp. 3°",
    inspeccion_anulada: "Anulada",
    ip_cerrada: "IP Cerrada",
    facturada: "Facturada",
};

export const estadoStyles: Record<string, string> = {
    ip_coordinada: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    pendiente_coordinacion: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    contactado: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    pendiente_carga: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    pendiente_presupuesto: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
    licitando_repuestos: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
    en_consulta_cia: 'bg-red-600/20 text-red-400 border-red-600/40',
    ip_reclamada_perito: 'bg-rose-600/20 text-rose-400 border-rose-600/40',
    esperando_respuesta_tercero: 'bg-teal-500/15 text-teal-400 border-teal-500/25',
    ip_cerrada: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    facturada: 'bg-[#111] text-gray-500 border-[#222] shadow-sm',
    inspeccion_anulada: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
};

export const estadoStylesRow: Record<string, string> = {
    ip_coordinada: 'bg-blue-500/15 hover:bg-blue-500/25 border-blue-500/30 dark:bg-blue-500/25 dark:hover:bg-blue-500/35',
    pendiente_coordinacion: 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/40 dark:bg-orange-500/30 dark:hover:bg-orange-500/40',
    contactado: 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/30 dark:bg-cyan-500/25 dark:hover:bg-cyan-500/35',
    pendiente_carga: 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 dark:bg-amber-500/25 dark:hover:bg-amber-500/35',
    pendiente_presupuesto: 'bg-yellow-500/15 hover:bg-yellow-500/25 border-yellow-500/30 dark:bg-yellow-500/25 dark:hover:bg-yellow-500/35',
    licitando_repuestos: 'bg-violet-500/15 hover:bg-violet-500/25 border-violet-500/30 dark:bg-violet-500/25 dark:hover:bg-violet-500/35',
    en_consulta_cia: 'bg-red-600/25 hover:bg-red-600/35 border-red-600/40 dark:bg-red-600/35 dark:hover:bg-red-600/45 shadow-[inset_4px_0_0_0_rgba(220,38,38,1)]',
    ip_reclamada_perito: 'bg-rose-600/25 hover:bg-rose-600/35 border-rose-600/40 dark:bg-rose-600/35 dark:hover:bg-rose-600/45 shadow-[inset_4px_0_0_0_rgba(225,29,72,1)]',
    esperando_respuesta_tercero: 'bg-teal-500/15 hover:bg-teal-500/25 border-teal-500/30 dark:bg-teal-500/25 dark:hover:bg-teal-500/35',
    ip_cerrada: 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 dark:bg-emerald-500/25 dark:hover:bg-emerald-500/35',
    facturada: 'bg-[#111] hover:bg-[#1a1a1a] border-[#222]',
    inspeccion_anulada: 'bg-gray-500/15 hover:bg-gray-500/25 border-gray-500/30 dark:bg-gray-500/25 dark:hover:bg-gray-500/35',
};

export function EstadoBadge({ estado, compacto }: { estado?: string | null, compacto?: boolean }) {
    if (!estado) {
        return (
            <Badge variant="outline" className={`rounded-md font-medium border bg-gray-500/15 text-gray-400 border-gray-500/25 ${compacto ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
                Desconocido
            </Badge>
        );
    }

    const fallbackLabel = estado.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const badgeStyle = estadoStyles[estado] || 'bg-gray-500/15 text-gray-400 border-gray-500/25';

    return (
        <Badge
            variant="outline"
            className={`rounded-md font-medium whitespace-nowrap border ${badgeStyle} ${compacto ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
        >
            {ESTADO_LABELS[estado] || fallbackLabel}
        </Badge>
    );
}

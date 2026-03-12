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
    // Normal states — dual light/dark text for WCAG AA compliance
    ip_coordinada: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
    pendiente_coordinacion: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30',
    contactado: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border-cyan-500/30',
    licitando_repuestos: 'bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-500/30',
    esperando_respuesta_tercero: 'bg-teal-500/20 text-teal-700 dark:text-teal-400 border-teal-500/30',
    ip_cerrada: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    facturada: 'bg-gray-100 dark:bg-[#111] text-gray-600 dark:text-gray-500 border-gray-300 dark:border-[#222] shadow-sm',
    inspeccion_anulada: 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30',
    // CRITICAL / saturated states — these MUST pop in both modes
    en_consulta_cia: 'bg-red-600/30 text-red-700 dark:text-red-400 border-red-600/60 font-bold',
    pendiente_carga: 'bg-amber-500/30 text-amber-800 dark:text-amber-300 border-amber-500/60 font-bold',
    pendiente_presupuesto: 'bg-yellow-500/30 text-yellow-800 dark:text-yellow-300 border-yellow-500/60 font-bold',
    ip_reclamada_perito: 'bg-rose-600/30 text-rose-700 dark:text-rose-400 border-rose-600/60 font-bold',
};

export const estadoStylesRow: Record<string, string> = {
    // Normal row backgrounds — subtle tint visible
    ip_coordinada: 'bg-blue-500/8 hover:bg-blue-500/15',
    pendiente_coordinacion: 'bg-orange-500/8 hover:bg-orange-500/15',
    contactado: 'bg-cyan-500/8 hover:bg-cyan-500/15',
    licitando_repuestos: 'bg-violet-500/8 hover:bg-violet-500/15',
    esperando_respuesta_tercero: 'bg-teal-500/8 hover:bg-teal-500/15',
    ip_cerrada: 'bg-emerald-500/8 hover:bg-emerald-500/15',
    facturada: 'bg-gray-100 dark:bg-[#111] hover:bg-gray-200 dark:hover:bg-[#1a1a1a] border-gray-300 dark:border-[#222]',
    inspeccion_anulada: 'bg-gray-500/8 hover:bg-gray-500/15',
    // CRITICAL row backgrounds — stronger tint + inset border
    en_consulta_cia: 'bg-red-600/15 hover:bg-red-600/20 shadow-[inset_4px_0_0_0_rgba(220,38,38,1)]',
    pendiente_carga: 'bg-amber-500/15 hover:bg-amber-500/20 shadow-[inset_4px_0_0_0_rgba(245,158,11,1)]',
    pendiente_presupuesto: 'bg-yellow-500/15 hover:bg-yellow-500/20 shadow-[inset_4px_0_0_0_rgba(234,179,8,1)]',
    ip_reclamada_perito: 'bg-rose-600/15 hover:bg-rose-600/20 shadow-[inset_4px_0_0_0_rgba(225,29,72,1)]',
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

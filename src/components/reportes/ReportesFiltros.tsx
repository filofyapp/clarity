"use client";

import { useState } from "react";
import { BarChart3, Users, Calendar, Filter, TrendingUp, Banknote, Target, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";

interface ReportesFiltrosProps {
    casos: any[];
    peritos: { id: string; nombre: string; apellido: string; rol: string; roles?: string[] }[];
    historial: any[];
    gastoFijo: number;
}

const ESTADOS_LABELS: Record<string, string> = {
    pendiente_coordinacion: "Pdte. Coordinación",
    contactado: "Contactado",
    ip_coordinada: "IP Coordinada",
    pendiente_carga: "Pdte. Carga",
    pendiente_presupuesto: "Pdte. Presupuesto",
    licitando_repuestos: "Licitando Repuestos",
    en_consulta_cia: "Consulta Cía",
    ip_cerrada: "IP Cerrada",
    facturada: "Facturada",
    inspeccion_anulada: "Anulada",
};

const TIPO_IP_LABELS: Record<string, string> = {
    ip_con_orden: "IP Con Orden",
    ip_sin_orden: "IP Sin Orden",
    ip_remota: "IP Remota",
    posible_dt: "Posible DT",
    terceros: "Terceros",
    ip_camiones: "IP Camiones",
    ip_final_intermedia: "IP Final/Intermedia",
    ampliacion: "Ampliación",
    ausente: "Ausente",
};

function formatDuration(ms: number) {
    if (ms < 0) return "—";
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days === 0 && hours === 0) return "< 1 h";
    return `${days > 0 ? `${days}d ` : ''}${hours}h`;
}

function formatTipoIP(tipo: string) {
    return TIPO_IP_LABELS[tipo] || tipo.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export function ReportesFiltros({ casos, peritos, historial, gastoFijo }: ReportesFiltrosProps) {
    const [peritoId, setPeritoId] = useState<string>("todos");
    const [tipoIP, setTipoIP] = useState<string>("todos");
    const [desde, setDesde] = useState<string>(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
    const [hasta, setHasta] = useState<string>(() => format(endOfMonth(new Date()), "yyyy-MM-dd"));

    // ═══════════════════════════════════════════════════════════════
    // 1. FILTROS BASE (Perito y Tipo IP — aplicados a todo)
    // ═══════════════════════════════════════════════════════════════
    let casosFiltroPrincipal = casos;
    if (peritoId !== "todos") {
        casosFiltroPrincipal = casosFiltroPrincipal.filter(c =>
            c.perito_calle_id === peritoId || c.perito_carga_id === peritoId
        );
    }
    if (tipoIP !== "todos") {
        casosFiltroPrincipal = casosFiltroPrincipal.filter(c => c.tipo_inspeccion === tipoIP);
    }

    // Helper: ¿fecha cae en rango seleccionado?
    const isDateInRange = (dateStr: string | null) => {
        if (!dateStr) return false;
        const d = new Date(dateStr).getTime();
        if (isNaN(d)) return false;
        const start = desde ? new Date(desde + "T00:00:00").getTime() : 0;
        const end = hasta ? new Date(hasta + "T23:59:59").getTime() : Infinity;
        return d >= start && d <= end;
    };

    // ═══════════════════════════════════════════════════════════════
    // 2. ARRAYS ANALÍTICOS SEPARADOS POR CONTEXTO TEMPORAL
    // ═══════════════════════════════════════════════════════════════

    // Casos INGRESADOS en el rango (por fecha_derivacion o created_at)
    const casosIngresadosRango = casosFiltroPrincipal.filter(c =>
        isDateInRange(c.fecha_derivacion || c.created_at)
    );

    // Casos CERRADOS en el rango (por fecha_cierre) — para financial de estudio y perito carga
    // EXCLUYE anuladas: no generan billing
    const casosCerradosRango = casosFiltroPrincipal.filter(c =>
        c.fecha_cierre && isDateInRange(c.fecha_cierre)
        && c.estado !== "inspeccion_anulada"
    );

    // Casos con IP REALIZADA en el rango
    // Fecha: fecha_inspeccion_real (cuándo se completó la inspección)
    // EXCLUYE anuladas
    const casosIPRealizadaRango = casosFiltroPrincipal.filter(c => {
        if (c.estado === "inspeccion_anulada") return false;
        const fechaIP = c.fecha_inspeccion_real;
        return fechaIP && isDateInRange(fechaIP);
    });

    // Solo los cerrados que tienen billing (ip_cerrada o facturada)
    const cerradosConBilling = casosCerradosRango.filter(c =>
        c.estado === "ip_cerrada" || c.estado === "facturada" || c.facturado === true
    );

    // Quick filters
    const handleQuickFilter = (preset: "semana" | "mes_actual" | "mes_anterior" | "ultimos_3_meses") => {
        const hoy = new Date();
        let fDesde: Date, fHasta: Date;
        switch (preset) {
            case "semana":
                fDesde = startOfWeek(hoy, { weekStartsOn: 1 });
                fHasta = endOfWeek(hoy, { weekStartsOn: 1 });
                break;
            case "mes_actual":
                fDesde = startOfMonth(hoy);
                fHasta = endOfMonth(hoy);
                break;
            case "mes_anterior":
                const mesAnterior = subMonths(hoy, 1);
                fDesde = startOfMonth(mesAnterior);
                fHasta = endOfMonth(mesAnterior);
                break;
            case "ultimos_3_meses":
                fDesde = startOfMonth(subMonths(hoy, 3));
                fHasta = endOfMonth(hoy);
                break;
        }
        setDesde(format(fDesde, "yyyy-MM-dd"));
        setHasta(format(fHasta, "yyyy-MM-dd"));
    };

    // ═══════════════════════════════════════════════════════════════
    // 3. MÉTRICAS OPERATIVAS (basado en Ingresados)
    // ═══════════════════════════════════════════════════════════════
    const totalIngresados = casosIngresadosRango.length;
    const estadosTerminales = ["ip_cerrada", "facturada", "inspeccion_anulada"];
    const activos = casosIngresadosRango.filter(c => !estadosTerminales.includes(c.estado)).length;
    const totalCerradosRango = casosCerradosRango.length;
    const totalIPsRealizadas = casosIPRealizadaRango.length;

    // ═══════════════════════════════════════════════════════════════
    // 4. MÉTRICAS FINANCIERAS (basado en Cierres para estudio/carga, IPs realizadas para calle)
    // ═══════════════════════════════════════════════════════════════

    // Facturado Bruto del Estudio: se reconoce al CIERRE
    const totalFacturadoEstudio = cerradosConBilling.reduce(
        (s: number, c: any) => s + (Number(c.monto_facturado_estudio) || 0), 0
    );

    // Pagado a Peritos de Carga: se reconoce al CIERRE (ip_cerrada/facturada)
    // Solo casos con perito_carga_id asignado (consistencia con tabla per-perito)
    const totalPagadoPeritoCarga = cerradosConBilling
        .filter(c => c.perito_carga_id)
        .reduce((s: number, c: any) => s + (Number(c.monto_pagado_perito_carga) || 0), 0);

    // Pagado a Peritos de Calle: se reconoce cuando IP se completó
    // Fecha: fecha_inspeccion_real (trabajo del perito de calle completado)
    // EXCLUYE anuladas
    // Solo casos con perito_calle_id asignado (consistencia con tabla per-perito)
    const totalPagadoPeritoCalle = casosFiltroPrincipal
        .filter(c => {
            if (c.estado === "inspeccion_anulada") return false;
            if (!c.perito_calle_id) return false;
            const fechaCalle = c.fecha_inspeccion_real;
            return fechaCalle && isDateInRange(fechaCalle) && Number(c.monto_pagado_perito_calle) > 0;
        })
        .reduce((s: number, c: any) => s + (Number(c.monto_pagado_perito_calle) || 0), 0);

    const totalPagadoPeritos = totalPagadoPeritoCalle + totalPagadoPeritoCarga;
    const gananciaNetaBruta = totalFacturadoEstudio - totalPagadoPeritos;
    const breakeven = gananciaNetaBruta - gastoFijo;

    // Ticket promedio
    const ticketPromedio = cerradosConBilling.length > 0
        ? totalFacturadoEstudio / cerradosConBilling.length : 0;

    // Tasa de cierre
    const tasaCierre = totalIngresados > 0
        ? ((totalCerradosRango / totalIngresados) * 100) : 0;

    // ═══════════════════════════════════════════════════════════════
    // 5. DISTRIBUCIÓN POR ESTADO
    // ═══════════════════════════════════════════════════════════════
    const porEstado: Record<string, number> = {};
    casosIngresadosRango.forEach((c: any) => {
        porEstado[c.estado] = (porEstado[c.estado] || 0) + 1;
    });

    // Tipos de inspección únicos (de ALL casos, no solo filtrados)
    const tiposUnicos = [...new Set(casos.map(c => c.tipo_inspeccion).filter(Boolean))];

    // ═══════════════════════════════════════════════════════════════
    // 6. DESGLOSE FINANCIERO POR TIPO DE IP
    // ═══════════════════════════════════════════════════════════════
    const desgloseTipoIP = tiposUnicos.map(tipo => {
        const casosTipo = cerradosConBilling.filter(c => c.tipo_inspeccion === tipo);
        const bruto = casosTipo.reduce((s: number, c: any) => s + (Number(c.monto_facturado_estudio) || 0), 0);
        const pagadoCalle = casosTipo.reduce((s: number, c: any) => s + (Number(c.monto_pagado_perito_calle) || 0), 0);
        const pagadoCarga = casosTipo.reduce((s: number, c: any) => s + (Number(c.monto_pagado_perito_carga) || 0), 0);
        return {
            tipo: tipo as string,
            cantidad: casosTipo.length,
            bruto,
            pagadoCalle,
            pagadoCarga,
            neto: bruto - pagadoCalle - pagadoCarga
        };
    }).filter(d => d.cantidad > 0).sort((a, b) => b.neto - a.neto);

    // ═══════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════

    return (
        <div className="space-y-6">
            {/* ─── Barra de filtros ─── */}
            <div className="bg-bg-secondary border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3 text-text-muted text-sm">
                    <Filter className="w-4 h-4" /> Filtros
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                        <label className="text-xs text-text-muted block mb-1">Perito</label>
                        <select value={peritoId} onChange={e => setPeritoId(e.target.value)}
                            className="w-full bg-bg-tertiary border border-border rounded-md px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary">
                            <option value="todos">Todos</option>
                            {peritos.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre} {p.apellido} ({p.rol})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-text-muted block mb-1">Tipo IP</label>
                        <select value={tipoIP} onChange={e => setTipoIP(e.target.value)}
                            className="w-full bg-bg-tertiary border border-border rounded-md px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary">
                            <option value="todos">Todos</option>
                            {tiposUnicos.map(t => <option key={t} value={t}>{formatTipoIP(t)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-text-muted block mb-1">Desde</label>
                        <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                            className="w-full bg-bg-tertiary border border-border rounded-md px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary" />
                    </div>
                    <div>
                        <label className="text-xs text-text-muted block mb-1">Hasta</label>
                        <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                            className="w-full bg-bg-tertiary border border-border rounded-md px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary" />
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-border/50">
                    <button onClick={() => handleQuickFilter("semana")} className="px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-bg-tertiary text-text-secondary hover:text-brand-primary hover:border-brand-primary/50 transition-colors">Esta Semana</button>
                    <button onClick={() => handleQuickFilter("mes_actual")} className="px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-bg-tertiary text-text-secondary hover:text-brand-primary hover:border-brand-primary/50 transition-colors">Mes Actual</button>
                    <button onClick={() => handleQuickFilter("mes_anterior")} className="px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-bg-tertiary text-text-secondary hover:text-brand-primary hover:border-brand-primary/50 transition-colors">Mes Anterior</button>
                    <button onClick={() => handleQuickFilter("ultimos_3_meses")} className="px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-bg-tertiary text-text-secondary hover:text-brand-primary hover:border-brand-primary/50 transition-colors">Últimos 3 Meses</button>
                    {(desde || hasta) && (
                        <button onClick={() => { setDesde(""); setHasta(""); }} className="px-3 py-1.5 rounded-md text-xs font-medium text-text-muted hover:text-text-primary transition-colors ml-auto">
                            Limpiar fechas
                        </button>
                    )}
                </div>
            </div>

            {/* ─── KPIs Operativas ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiMini label="Ingresados" value={totalIngresados.toString()} icon={<BarChart3 className="w-4 h-4" />} />
                <KpiMini label="Activos" value={activos.toString()} color="text-color-warning" icon={<Clock className="w-4 h-4" />} />
                <KpiMini label="IPs Realizadas" value={totalIPsRealizadas.toString()} color="text-color-info" icon={<Target className="w-4 h-4" />} />
                <KpiMini label="Cerrados" value={totalCerradosRango.toString()} color="text-color-success" icon={<TrendingUp className="w-4 h-4" />} />
            </div>

            {/* ─── KPIs Financieros ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <KpiMini label="Facturado Bruto" value={formatCurrency(totalFacturadoEstudio)} color="text-color-success" gradient />
                <KpiMini label="Pagado P. Calle" value={formatCurrency(totalPagadoPeritoCalle)} color="text-orange-400" sublabel="Al realizar IP" />
                <KpiMini label="Pagado P. Carga" value={formatCurrency(totalPagadoPeritoCarga)} color="text-sky-400" sublabel="Al cerrar IP" />
                <KpiMini label="Neto Estudio" value={formatCurrency(gananciaNetaBruta)} color="text-brand-secondary" gradient />
                <KpiMini label="Breakeven (R.I) ★" value={formatCurrency(breakeven)} color={breakeven >= 0 ? "text-color-success" : "text-danger"} />
                <KpiMini label="Ticket Promedio" value={formatCurrency(ticketPromedio)} color="text-text-primary" sublabel={`${tasaCierre.toFixed(0)}% tasa cierre`} />
            </div>

            {/* ─── Tiempos Medios de Gestión ─── */}
            {(() => {
                // Build historial maps: caso_id → first date of each key state transition
                const histCargaMap = new Map<string, string>();
                const histLicitMap = new Map<string, string>();
                const histCierreMap = new Map<string, string>();
                historial.forEach((h: any) => {
                    if (h.estado_nuevo === "pendiente_carga" && !histCargaMap.has(h.caso_id)) {
                        histCargaMap.set(h.caso_id, h.created_at);
                    }
                    if (h.estado_nuevo === "licitando_repuestos" && !histLicitMap.has(h.caso_id)) {
                        histLicitMap.set(h.caso_id, h.created_at);
                    }
                    if ((h.estado_nuevo === "ip_cerrada" || h.estado_nuevo === "facturada") && !histCierreMap.has(h.caso_id)) {
                        histCierreMap.set(h.caso_id, h.created_at);
                    }
                });

                // Enrich closed cases with fallback dates from historial
                const casosConFechas = casosCerradosRango.map((c: any) => ({
                    ...c,
                    fecha_carga: c.fecha_carga_sistema || histCargaMap.get(c.id) || null,
                    fecha_licitacion: histLicitMap.get(c.id) || null,
                }));

                // Helper: calculate avg ms between two date getters, returns { avg, count, values }
                const calcInterval = (datos: any[], getFrom: (c: any) => string | null, getTo: (c: any) => string | null) => {
                    const values: number[] = [];
                    datos.forEach(c => {
                        const fromStr = getFrom(c);
                        const toStr = getTo(c);
                        if (!fromStr || !toStr) return;
                        const from = new Date(fromStr).getTime();
                        const to = new Date(toStr).getTime();
                        if (isNaN(from) || isNaN(to) || to < from) return;
                        values.push(to - from);
                    });
                    return {
                        avg: values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : -1,
                        count: values.length,
                        values,
                    };
                };

                // 6 intervals on closed cases in range
                const i1 = calcInterval(casosConFechas, c => c.fecha_derivacion || c.created_at, c => c.fecha_inspeccion_real);
                const i2 = calcInterval(casosConFechas, c => c.fecha_inspeccion_real, c => c.fecha_carga);
                const i3 = calcInterval(casosConFechas, c => c.fecha_carga, c => c.fecha_licitacion);
                const i4 = calcInterval(casosConFechas, c => c.fecha_licitacion, c => c.fecha_cierre);
                const i5 = calcInterval(casosConFechas, c => c.fecha_inspeccion_real, c => c.fecha_cierre);
                const i6 = calcInterval(casosConFechas, c => c.fecha_derivacion || c.created_at, c => c.fecha_cierre);

                const intervals = [
                    { label: "Asignación → IP", ...i1, color: "text-sky-400", emoji: "📋" },
                    { label: "IP → Carga", ...i2, color: "text-orange-400", emoji: "📸" },
                    { label: "Carga → Licitación", ...i3, color: "text-amber-400", emoji: "📦" },
                    { label: "Licitación → Cierre", ...i4, color: "text-emerald-400", emoji: "🔧" },
                    { label: "IP → Cierre (Neto)", ...i5, color: "text-brand-secondary", emoji: "⚡" },
                    { label: "Ciclo Completo", ...i6, color: "text-brand-primary", emoji: "🔄" },
                ];

                // Find the slowest of the 4 pipeline intervals (i1-i4) for bottleneck highlighting
                const pipeline = [i1, i2, i3, i4];
                const maxPipeline = Math.max(...pipeline.filter(x => x.avg > 0).map(x => x.avg));

                // Per-perito timing (only for peritos de calle — they affect Asig→IP)
                const peritoTimings = peritos
                    .filter(p => {
                        const roles = p.roles || [p.rol];
                        return roles.includes("calle");
                    })
                    .map(p => {
                        const casosCalle = casosConFechas.filter((c: any) => c.perito_calle_id === p.id);
                        const pI1 = calcInterval(casosCalle, c => c.fecha_derivacion || c.created_at, c => c.fecha_inspeccion_real);
                        const pI2 = calcInterval(casosCalle, c => c.fecha_inspeccion_real, c => c.fecha_carga);
                        const pI5 = calcInterval(casosCalle, c => c.fecha_inspeccion_real, c => c.fecha_cierre);
                        const pI6 = calcInterval(casosCalle, c => c.fecha_derivacion || c.created_at, c => c.fecha_cierre);
                        return {
                            nombre: `${p.nombre} ${p.apellido}`,
                            total: casosCalle.length,
                            asigToIp: pI1.avg,
                            ipToCarga: pI2.avg,
                            ipToCierre: pI5.avg,
                            ciclo: pI6.avg,
                            countAsigIp: pI1.count,
                            countIpCarga: pI2.count,
                        };
                    })
                    .filter(p => p.total > 0)
                    .sort((a, b) => (b.ciclo > 0 ? b.ciclo : 0) - (a.ciclo > 0 ? a.ciclo : 0));

                // Color coding helper (relative to overall avg)
                const getTimingColor = (val: number, refAvg: number) => {
                    if (val < 0 || refAvg < 0) return "text-text-muted";
                    const ratio = val / refAvg;
                    if (ratio <= 0.7) return "text-emerald-400"; // fast
                    if (ratio <= 1.3) return "text-amber-400";   // normal
                    return "text-red-400";                        // slow
                };

                return (
                    <div className="space-y-4">
                        {/* Pipeline Overview */}
                        <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-3">
                                <Clock className="w-4 h-4 text-brand-secondary" />
                                <h3 className="font-bold text-text-primary text-sm tracking-wide">Tiempos Medios de Gestión</h3>
                                <span className="text-[10px] bg-bg-tertiary text-text-muted px-2 py-0.5 rounded-full border border-border">
                                    {casosCerradosRango.length} casos cerrados en rango
                                </span>
                            </div>

                            {/* 6 Interval Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
                                {intervals.map((int, idx) => {
                                    const isBottleneck = idx < 4 && int.avg === maxPipeline && int.avg > 0;
                                    return (
                                        <div key={idx} className={`bg-bg-tertiary p-3 rounded-lg border transition-all ${isBottleneck ? "border-red-500/50 ring-1 ring-red-500/20" : "border-border"}`}>
                                            <div className="flex items-center gap-1 mb-1">
                                                <span className="text-sm">{int.emoji}</span>
                                                <p className="text-[10px] text-text-muted leading-tight">{int.label}</p>
                                            </div>
                                            <p className={`text-xl font-bold ${int.avg === -1 ? "text-text-muted/40" : int.color}`}>
                                                {int.avg === -1 ? "—" : formatDuration(int.avg)}
                                            </p>
                                            <p className="text-[9px] text-text-muted mt-0.5">
                                                {int.count > 0 ? `${int.count} caso${int.count > 1 ? "s" : ""}` : "Sin datos"}
                                                {isBottleneck && <span className="text-red-400 ml-1 font-bold">⚠ Cuello de botella</span>}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pipeline Bar (visual proportions of the 4 stages) */}
                            {pipeline.some(x => x.avg > 0) && (() => {
                                const pipelineValid = pipeline.filter(x => x.avg > 0);
                                const totalMs = pipelineValid.reduce((s, x) => s + x.avg, 0);
                                const labels = ["Asig→IP", "IP→Carga", "Carga→Lic.", "Lic.→Cierre"];
                                const colors = ["bg-sky-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500"];

                                return (
                                    <div>
                                        <p className="text-[10px] text-text-muted mb-2 uppercase tracking-wider">Pipeline visual (proporción)</p>
                                        <div className="flex h-8 rounded-lg overflow-hidden border border-border">
                                            {pipeline.map((seg, idx) => {
                                                if (seg.avg <= 0) return null;
                                                const pct = (seg.avg / totalMs) * 100;
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`${colors[idx]} flex items-center justify-center text-[9px] text-white font-bold transition-all relative group`}
                                                        style={{ width: `${Math.max(pct, 5)}%` }}
                                                        title={`${labels[idx]}: ${formatDuration(seg.avg)} (${pct.toFixed(0)}%)`}
                                                    >
                                                        {pct > 12 && <span>{labels[idx]}</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex gap-4 mt-2">
                                            {pipeline.map((seg, idx) => {
                                                if (seg.avg <= 0) return null;
                                                const pct = (seg.avg / totalMs) * 100;
                                                return (
                                                    <div key={idx} className="flex items-center gap-1.5 text-[10px] text-text-muted">
                                                        <div className={`w-2 h-2 rounded-full ${colors[idx]}`} />
                                                        {labels[idx]}: {pct.toFixed(0)}%
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Per-Perito Timing Table */}
                        {peritoTimings.length > 0 && (
                            <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-3">
                                    <Users className="w-4 h-4 text-brand-secondary" />
                                    <h3 className="font-bold text-text-primary text-sm tracking-wide">Velocidad por Perito de Calle</h3>
                                    <span className="text-[10px] bg-bg-tertiary text-text-muted px-2 py-0.5 rounded-full border border-border">
                                        🟢 Rápido &nbsp;🟡 Normal &nbsp;🔴 Lento (vs promedio general)
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-border text-text-muted">
                                                <th className="text-left px-2 py-2">Perito</th>
                                                <th className="text-center px-2 py-2">Cerrados</th>
                                                <th className="text-center px-2 py-2">Asig → IP</th>
                                                <th className="text-center px-2 py-2">IP → Carga</th>
                                                <th className="text-center px-2 py-2">IP → Cierre</th>
                                                <th className="text-center px-2 py-2">Ciclo Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {peritoTimings.map(p => (
                                                <tr key={p.nombre} className="hover:bg-bg-tertiary/50">
                                                    <td className="px-2 py-2.5 text-text-primary font-medium">{p.nombre}</td>
                                                    <td className="px-2 py-2.5 text-center font-mono">{p.total}</td>
                                                    <td className={`px-2 py-2.5 text-center font-mono font-bold ${getTimingColor(p.asigToIp, i1.avg)}`}>
                                                        {p.asigToIp === -1 ? "—" : formatDuration(p.asigToIp)}
                                                    </td>
                                                    <td className={`px-2 py-2.5 text-center font-mono font-bold ${getTimingColor(p.ipToCarga, i2.avg)}`}>
                                                        {p.ipToCarga === -1 ? "—" : formatDuration(p.ipToCarga)}
                                                    </td>
                                                    <td className={`px-2 py-2.5 text-center font-mono font-bold ${getTimingColor(p.ipToCierre, i5.avg)}`}>
                                                        {p.ipToCierre === -1 ? "—" : formatDuration(p.ipToCierre)}
                                                    </td>
                                                    <td className={`px-2 py-2.5 text-center font-mono font-bold ${getTimingColor(p.ciclo, i6.avg)}`}>
                                                        {p.ciclo === -1 ? "—" : formatDuration(p.ciclo)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* ─── Distribución por Estado ─── */}
            <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-3">
                    <h3 className="font-bold text-text-primary text-sm tracking-wide">Distribución por Estado</h3>
                    <span className="text-[10px] bg-bg-tertiary text-text-muted px-2 py-0.5 rounded-full border border-border">
                        {totalIngresados} ingresos en rango
                    </span>
                </div>
                <div className="space-y-2">
                    {Object.entries(porEstado)
                        .sort(([, a], [, b]) => b - a)
                        .map(([estado, count]) => (
                            <div key={estado} className="flex items-center gap-3">
                                <span className="text-xs text-text-muted w-36 truncate">{ESTADOS_LABELS[estado] || estado}</span>
                                <div className="flex-1 h-5 bg-bg-tertiary rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-primary/60 rounded-full transition-all flex items-center px-2"
                                        style={{ width: `${Math.max((count / totalIngresados) * 100, 8)}%` }}>
                                        <span className="text-[10px] text-text-primary font-medium">{count}</span>
                                    </div>
                                </div>
                                <span className="text-xs text-text-secondary w-10 text-right">{((count / totalIngresados) * 100).toFixed(0)}%</span>
                            </div>
                        ))}
                </div>
            </div>

            {/* ─── Finanzas por Tipo de IP ─── */}
            <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-3">
                    <h3 className="font-bold text-text-primary text-sm tracking-wide">Finanzas por Tipo de Inspección</h3>
                    <span className="text-[10px] bg-color-success/10 text-color-success px-2 py-0.5 rounded-full border border-color-success/20">
                        Sólo Cerrados/Facturados
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-border text-text-muted">
                                <th className="text-left px-2 py-2">Tipo IP</th>
                                <th className="text-center px-2 py-2">Cerrados</th>
                                <th className="text-right px-2 py-2">Bruto</th>
                                <th className="text-right px-2 py-2">P. Calle</th>
                                <th className="text-right px-2 py-2">P. Carga</th>
                                <th className="text-right px-2 py-2">Neto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {desgloseTipoIP.map(d => (
                                <tr key={d.tipo} className="hover:bg-bg-tertiary/50">
                                    <td className="px-2 py-2.5 text-text-primary font-medium">{formatTipoIP(d.tipo)}</td>
                                    <td className="px-2 py-2.5 text-center font-mono">{d.cantidad}</td>
                                    <td className="px-2 py-2.5 text-right font-mono text-color-success">{formatCurrency(d.bruto)}</td>
                                    <td className="px-2 py-2.5 text-right font-mono text-orange-400">{formatCurrency(d.pagadoCalle)}</td>
                                    <td className="px-2 py-2.5 text-right font-mono text-sky-400">{formatCurrency(d.pagadoCarga)}</td>
                                    <td className="px-2 py-2.5 text-right font-mono font-bold text-brand-secondary">{formatCurrency(d.neto)}</td>
                                </tr>
                            ))}
                            {desgloseTipoIP.length > 0 && (
                                <tr className="border-t-2 border-border font-bold">
                                    <td className="px-2 py-2.5 text-text-primary">TOTALES</td>
                                    <td className="px-2 py-2.5 text-center font-mono">{desgloseTipoIP.reduce((s, d) => s + d.cantidad, 0)}</td>
                                    <td className="px-2 py-2.5 text-right font-mono text-color-success">{formatCurrency(desgloseTipoIP.reduce((s, d) => s + d.bruto, 0))}</td>
                                    <td className="px-2 py-2.5 text-right font-mono text-orange-400">{formatCurrency(desgloseTipoIP.reduce((s, d) => s + d.pagadoCalle, 0))}</td>
                                    <td className="px-2 py-2.5 text-right font-mono text-sky-400">{formatCurrency(desgloseTipoIP.reduce((s, d) => s + d.pagadoCarga, 0))}</td>
                                    <td className="px-2 py-2.5 text-right font-mono text-brand-secondary">{formatCurrency(desgloseTipoIP.reduce((s, d) => s + d.neto, 0))}</td>
                                </tr>
                            )}
                            {desgloseTipoIP.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-4 text-text-muted">No hay datos financieros en este rango.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── Rendimiento por Perito ─── */}
            <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-3">
                    <h3 className="font-bold text-text-primary text-sm tracking-wide">Rendimiento por Perito</h3>
                    <span className="text-[10px] bg-bg-tertiary text-text-muted px-2 py-0.5 rounded-full border border-border">
                        Honorarios imputados por fecha de acción
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-border text-text-muted">
                                <th className="text-left px-2 py-2">Perito</th>
                                <th className="text-right px-2 py-2">IPs Realizadas</th>
                                <th className="text-right px-2 py-2">Cerrados</th>
                                <th className="text-right px-2 py-2">Hon. Calle</th>
                                <th className="text-right px-2 py-2">Hon. Carga</th>
                                <th className="text-right px-2 py-2">Total Ganado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {peritos.map(p => {
                                // IPs realizadas en rango donde este perito es calle
                                const ipsCalleRango = casosIPRealizadaRango.filter(c => c.perito_calle_id === p.id);
                                const honCalle = ipsCalleRango
                                    .filter(c => Number(c.monto_pagado_perito_calle) > 0)
                                    .reduce((s: number, c: any) => s + (Number(c.monto_pagado_perito_calle) || 0), 0);

                                // Cerrados en rango donde este perito es carga
                                const cerradosCargaRango = cerradosConBilling.filter(c => c.perito_carga_id === p.id);
                                const honCarga = cerradosCargaRango
                                    .reduce((s: number, c: any) => s + (Number(c.monto_pagado_perito_carga) || 0), 0);

                                const totalGanado = honCalle + honCarga;

                                // Desglose por tipo de IP
                                const desgloseCalleIP = tiposUnicos.map(tipo => {
                                    const ct = ipsCalleRango.filter(c => c.tipo_inspeccion === tipo && Number(c.monto_pagado_perito_calle) > 0);
                                    const monto = ct.reduce((s: number, c: any) => s + (Number(c.monto_pagado_perito_calle) || 0), 0);
                                    return { tipo: tipo as string, cantidad: ct.length, monto };
                                }).filter(d => d.cantidad > 0);

                                const desgloseCargaIP = tiposUnicos.map(tipo => {
                                    const ct = cerradosCargaRango.filter(c => c.tipo_inspeccion === tipo);
                                    const monto = ct.reduce((s: number, c: any) => s + (Number(c.monto_pagado_perito_carga) || 0), 0);
                                    return { tipo: tipo as string, cantidad: ct.length, monto };
                                }).filter(d => d.cantidad > 0);

                                if (ipsCalleRango.length === 0 && cerradosCargaRango.length === 0) return null;

                                return (
                                    <tr key={p.id} className="hover:bg-bg-tertiary/50 align-top">
                                        <td className="px-2 py-3">
                                            <p className="text-text-primary font-medium">{p.nombre} {p.apellido}</p>
                                            <p className="text-[10px] text-text-secondary capitalize">{p.rol}</p>
                                        </td>
                                        <td className="px-2 py-3 text-right font-mono">{ipsCalleRango.length}</td>
                                        <td className="px-2 py-3 text-right font-mono">{cerradosCargaRango.length}</td>
                                        <td className="px-2 py-3 text-right">
                                            <span className="font-mono text-orange-400 font-bold">{formatCurrency(honCalle)}</span>
                                            {desgloseCalleIP.length > 0 && (
                                                <div className="mt-1 flex flex-col items-end gap-0.5">
                                                    {desgloseCalleIP.map(di => (
                                                        <span key={di.tipo} className="text-[9px] text-text-muted">
                                                            {di.cantidad}× {formatTipoIP(di.tipo)}: {formatCurrency(di.monto)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-2 py-3 text-right">
                                            <span className="font-mono text-sky-400 font-bold">{formatCurrency(honCarga)}</span>
                                            {desgloseCargaIP.length > 0 && (
                                                <div className="mt-1 flex flex-col items-end gap-0.5">
                                                    {desgloseCargaIP.map(di => (
                                                        <span key={di.tipo} className="text-[9px] text-text-muted">
                                                            {di.cantidad}× {formatTipoIP(di.tipo)}: {formatCurrency(di.monto)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-2 py-3 text-right">
                                            <span className="font-mono text-text-primary font-bold text-sm">{formatCurrency(totalGanado)}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {/* ═══ Fila "Sin asignar" para casos sin perito ═══ */}
                            {(() => {
                                const sinCargaId = cerradosConBilling.filter(c => !c.perito_carga_id);
                                const sinCalleId = casosIPRealizadaRango.filter(c => !c.perito_calle_id);
                                const honCargaSinAsignar = sinCargaId.reduce((s: number, c: any) => s + (Number(c.monto_pagado_perito_carga) || 0), 0);
                                const honCalleSinAsignar = sinCalleId.filter(c => Number(c.monto_pagado_perito_calle) > 0)
                                    .reduce((s: number, c: any) => s + (Number(c.monto_pagado_perito_calle) || 0), 0);
                                if (sinCargaId.length === 0 && sinCalleId.length === 0) return null;
                                return (
                                    <tr className="hover:bg-bg-tertiary/50 align-top border-t border-border/50">
                                        <td className="px-2 py-3">
                                            <p className="text-text-muted font-medium italic">Sin asignar</p>
                                            <p className="text-[10px] text-text-muted">Casos sin perito</p>
                                        </td>
                                        <td className="px-2 py-3 text-right font-mono text-text-muted">{sinCalleId.length}</td>
                                        <td className="px-2 py-3 text-right font-mono text-text-muted">{sinCargaId.length}</td>
                                        <td className="px-2 py-3 text-right">
                                            <span className="font-mono text-orange-400/50">{formatCurrency(honCalleSinAsignar)}</span>
                                        </td>
                                        <td className="px-2 py-3 text-right">
                                            <span className="font-mono text-sky-400/50">{formatCurrency(honCargaSinAsignar)}</span>
                                        </td>
                                        <td className="px-2 py-3 text-right">
                                            <span className="font-mono text-text-muted font-bold text-sm">{formatCurrency(honCalleSinAsignar + honCargaSinAsignar)}</span>
                                        </td>
                                    </tr>
                                );
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function KpiMini({ label, value, color = "text-text-primary", gradient = false, icon, sublabel }: {
    label: string; value: string; color?: string; gradient?: boolean; icon?: React.ReactNode; sublabel?: string;
}) {
    return (
        <div className={`relative overflow-hidden rounded-xl p-4 border transition-all hover:border-brand-primary/30 ${gradient ? 'bg-gradient-to-br from-bg-secondary to-bg-tertiary border-brand-primary/20 shadow-[0_0_15px_rgba(255,255,255,0.02)]' : 'bg-bg-secondary border-border shadow-sm'}`}>
            {gradient && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-brand-primary/10 rounded-bl-full blur-2xl pointer-events-none" />
            )}
            <div className="flex items-center gap-1.5 mb-1 z-10 relative">
                {icon && <span className="text-text-muted">{icon}</span>}
                <p className="text-[11px] text-text-muted font-medium tracking-wide uppercase">{label}</p>
            </div>
            <p className={`text-xl font-bold tracking-tight z-10 relative ${color}`}>{value}</p>
            {sublabel && <p className="text-[10px] text-text-muted mt-0.5 z-10 relative">{sublabel}</p>}
        </div>
    );
}

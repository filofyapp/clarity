"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
    Map, Calendar, DollarSign, ChevronDown, ChevronUp,
    Loader2, CheckCircle2, Circle, Calculator, Download,
    Image as ImageIcon, ExternalLink, MapPin, Route, Copy,
    AlertCircle, Clock, Navigation, Check
} from "lucide-react";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils/formatters";
import {
    DiaKilometraje, CasoInspeccion,
    guardarKilometraje, actualizarInclusiones
} from "@/app/(dashboard)/kilometraje/actions";
import { KilometrajeMapa } from "./KilometrajeMapa";

// ═══ Tipos ═══
interface Props {
    dias: DiaKilometraje[];
    peritos: { id: string; nombre: string; apellido: string; direccion_base: string | null }[];
    precioKm: { estudio: number; perito: number };
    mesInicial: string;
    mapsApiKey: string;
}

interface DiaState {
    expanded: boolean;
    incluidos: Set<string>;
    puntoPartida: string;
    siniestroAsociado: string;
    calculating: boolean;
    calculado: boolean;
    kmTotal: number;
    duracionMin: number;
    polyline: string | null;
    legs: any[] | null;
    rutaOrden: number[] | null;
    googleMapsUrl: string | null;
    needsRecalc: boolean;
}

// ═══ Helper ═══
const TIPOS_REMOTOS = new Set(["ip_remota"]);

function buildInitialState(dia: DiaKilometraje): DiaState {
    const reg = dia.registro;
    const incluidosFromDB = reg?.casos_incluidos || [];
    const excluidosFromDB = reg?.casos_excluidos || [];
    const hasDBState = incluidosFromDB.length > 0 || excluidosFromDB.length > 0;

    const incluidos = new Set<string>();
    for (const c of dia.casos) {
        if (hasDBState) {
            // Restore from DB
            if (incluidosFromDB.includes(c.caso_id)) incluidos.add(c.caso_id);
        } else {
            // Default: presenciales included, remotas excluded
            if (!TIPOS_REMOTOS.has(c.tipo_inspeccion)) incluidos.add(c.caso_id);
        }
    }

    return {
        expanded: false,
        incluidos,
        puntoPartida: reg?.punto_partida || dia.perito_direccion_base || "",
        siniestroAsociado: reg?.siniestro_asociado || dia.casos[0]?.numero_siniestro || "",
        calculating: false,
        calculado: !!reg?.km_total && reg.km_total > 0,
        kmTotal: reg?.km_total || 0,
        duracionMin: reg?.duracion_estimada_min || 0,
        polyline: reg?.ruta_polyline || null,
        legs: reg?.legs || null,
        rutaOrden: reg?.ruta_orden || null,
        googleMapsUrl: reg?.ruta_google_maps_url || null,
        needsRecalc: false,
    };
}

function diaKey(dia: DiaKilometraje) {
    return `${dia.fecha}_${dia.perito_id}`;
}

// ═══ MAIN COMPONENT ═══
export function KilometrajeBoard({ dias, peritos, precioKm, mesInicial, mapsApiKey }: Props) {
    // ─── Filters ───
    const [selectedPerito, setSelectedPerito] = useState<string>("todos");
    const [selectedMes, setSelectedMes] = useState(mesInicial);
    const [precioEstudio, setPrecioEstudio] = useState(precioKm.estudio);
    const [precioPerito, setPrecioPerito] = useState(precioKm.perito);

    // ─── Day states ───
    const [diaStates, setDiaStates] = useState<Record<string, DiaState>>(() => {
        const s: Record<string, DiaState> = {};
        for (const d of dias) s[diaKey(d)] = buildInitialState(d);
        return s;
    });

    // ─── Global loading ───
    const [calculatingAll, setCalculatingAll] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [exportingImages, setExportingImages] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Reinit states when dias change
    useEffect(() => {
        const s: Record<string, DiaState> = {};
        for (const d of dias) {
            const key = diaKey(d);
            s[key] = diaStates[key] || buildInitialState(d);
        }
        setDiaStates(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dias]);

    // ─── Filtered dias ───
    const filteredDias = useMemo(() => {
        if (selectedPerito === "todos") return dias;
        return dias.filter(d => d.perito_id === selectedPerito);
    }, [dias, selectedPerito]);

    // ─── KPIs ───
    const kpis = useMemo(() => {
        let calculados = 0, pendientes = 0, kmTotal = 0;
        for (const d of filteredDias) {
            const st = diaStates[diaKey(d)];
            if (st?.calculado && !st.needsRecalc) { calculados++; kmTotal += st.kmTotal; }
            else pendientes++;
        }
        return {
            calculados,
            pendientes,
            kmTotal,
            montoEstudio: kmTotal * precioEstudio,
            montoPerito: kmTotal * precioPerito,
        };
    }, [filteredDias, diaStates, precioEstudio, precioPerito]);

    // ═══ ACTIONS ═══

    const toggleExpand = useCallback((key: string) => {
        setDiaStates(prev => ({
            ...prev,
            [key]: { ...prev[key], expanded: !prev[key].expanded }
        }));
    }, []);

    const toggleIncluido = useCallback((key: string, casoId: string) => {
        setDiaStates(prev => {
            const st = { ...prev[key] };
            const newSet = new Set(st.incluidos);
            if (newSet.has(casoId)) newSet.delete(casoId);
            else newSet.add(casoId);
            st.incluidos = newSet;
            if (st.calculado) st.needsRecalc = true;
            return { ...prev, [key]: st };
        });
    }, []);

    const updateField = useCallback((key: string, field: string, value: string) => {
        setDiaStates(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    }, []);

    // ─── Calculate single day ───
    const calcularRuta = useCallback(async (dia: DiaKilometraje) => {
        const key = diaKey(dia);
        const st = diaStates[key];
        if (!st || !st.puntoPartida) return;

        const casosIncluidos = dia.casos.filter(c => st.incluidos.has(c.caso_id));
        if (casosIncluidos.length === 0) return;

        setDiaStates(prev => ({
            ...prev,
            [key]: { ...prev[key], calculating: true }
        }));

        try {
            const res = await fetch("/api/kilometraje/calcular-ruta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    origin: st.puntoPartida,
                    waypoints: casosIncluidos.map(c => c.direccion),
                }),
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            // Save to DB
            await guardarKilometraje({
                perito_id: dia.perito_id,
                fecha: dia.fecha,
                casos_ids: casosIncluidos.map(c => c.caso_id),
                direcciones_ordenadas: casosIncluidos.map(c => c.direccion),
                km_total: data.km_total,
                duracion_estimada_min: data.duracion_min,
                ruta_polyline: data.polyline,
                ruta_google_maps_url: data.google_maps_url,
                precio_km_estudio: precioEstudio,
                precio_km_perito: precioPerito,
                punto_partida: st.puntoPartida,
                siniestro_asociado: st.siniestroAsociado,
                casos_incluidos: casosIncluidos.map(c => c.caso_id),
                casos_excluidos: dia.casos.filter(c => !st.incluidos.has(c.caso_id)).map(c => c.caso_id),
                ruta_orden: data.waypoint_order,
                legs: data.legs,
            });

            setDiaStates(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    calculating: false,
                    calculado: true,
                    needsRecalc: false,
                    kmTotal: data.km_total,
                    duracionMin: data.duracion_min,
                    polyline: data.polyline,
                    legs: data.legs,
                    rutaOrden: data.waypoint_order,
                    googleMapsUrl: data.google_maps_url,
                }
            }));
        } catch (err: any) {
            console.error("Error calculating route:", err);
            setDiaStates(prev => ({
                ...prev,
                [key]: { ...prev[key], calculating: false }
            }));
        }
    }, [diaStates, precioEstudio, precioPerito]);

    // ─── Calculate all pending ───
    const calcularTodas = useCallback(async () => {
        setCalculatingAll(true);
        for (const dia of filteredDias) {
            const key = diaKey(dia);
            const st = diaStates[key];
            if (st && (!st.calculado || st.needsRecalc)) {
                await calcularRuta(dia);
                await new Promise(r => setTimeout(r, 2500)); // Rate limit
            }
        }
        setCalculatingAll(false);
    }, [filteredDias, diaStates, calcularRuta]);

    // ─── Copy summary ───
    const copyResumen = useCallback((dia: DiaKilometraje) => {
        const key = diaKey(dia);
        const st = diaStates[key];
        if (!st) return;
        const casosIncl = dia.casos.filter(c => st.incluidos.has(c.caso_id));
        const text = [
            `Fecha: ${format(parse(dia.fecha, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")}`,
            `Perito: ${dia.perito_nombre} ${dia.perito_apellido}`,
            `Siniestro asociado: ${st.siniestroAsociado}`,
            `Siniestros: ${casosIncl.map(c => c.numero_siniestro).join(" - ")}`,
            `Kilómetros: ${st.kmTotal.toFixed(1)} km`,
            `Monto estudio: ${formatCurrency(st.kmTotal * precioEstudio)}`,
        ].join("\n");
        navigator.clipboard.writeText(text);
        setCopiedId(key);
        setTimeout(() => setCopiedId(null), 2000);
    }, [diaStates, precioEstudio]);

    // ─── Excel export ───
    const exportExcel = useCallback(async () => {
        setExportingExcel(true);
        try {
            const XLSX = await import("xlsx");
            const rows: any[] = [];
            let totalKm = 0;
            for (const dia of filteredDias) {
                const key = diaKey(dia);
                const st = diaStates[key];
                if (!st || !st.calculado) continue;
                const casosIncl = dia.casos.filter(c => st.incluidos.has(c.caso_id));

                // Build localidades in optimal order
                const localidades = [st.puntoPartida];
                if (st.rutaOrden && st.rutaOrden.length > 0) {
                    for (const idx of st.rutaOrden) {
                        if (casosIncl[idx]) localidades.push(casosIncl[idx].localidad || casosIncl[idx].direccion);
                    }
                } else {
                    for (const c of casosIncl) localidades.push(c.localidad || c.direccion);
                }
                localidades.push(st.puntoPartida);

                rows.push({
                    "Fecha": format(parse(dia.fecha, "yyyy-MM-dd", new Date()), "dd/MM"),
                    "Perito": `${dia.perito_nombre} ${dia.perito_apellido}`,
                    "Sin. Asociado": st.siniestroAsociado,
                    "Localidades": localidades.join(" - "),
                    "Siniestros": casosIncl.map(c => c.numero_siniestro).join(" - "),
                    "Kilometraje": st.kmTotal,
                });
                totalKm += st.kmTotal;
            }
            rows.push({
                "Fecha": "", "Perito": "", "Sin. Asociado": "", "Localidades": "", "Siniestros": "TOTAL",
                "Kilometraje": totalKm,
            });

            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Kilometraje");
            XLSX.writeFile(wb, `Kilometraje_${selectedMes}.xlsx`);
        } catch (err) {
            console.error("Excel export error:", err);
        }
        setExportingExcel(false);
    }, [filteredDias, diaStates, selectedMes]);

    // ─── PNG export ───
    const exportImage = useCallback(async (dia: DiaKilometraje) => {
        const key = diaKey(dia);
        const st = diaStates[key];
        if (!st || !st.calculado) return;

        const casosIncl = dia.casos.filter(c => st.incluidos.has(c.caso_id));
        const canvas = document.createElement("canvas");
        const W = 1000, rowH = 30, headerH = 80, tableH = headerH + (casosIncl.length + 1) * rowH + 20;
        const mapH = 500;
        const H = tableH + mapH + 60;
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d")!;

        // Background
        ctx.fillStyle = "#0D0B12";
        ctx.fillRect(0, 0, W, H);

        // Header
        ctx.fillStyle = "#F59E0B";
        ctx.font = "bold 20px Inter, system-ui";
        ctx.fillText(
            `${format(parse(dia.fecha, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")} — ${dia.perito_nombre} ${dia.perito_apellido}`,
            20, 35
        );
        ctx.fillStyle = "#9CA3AF";
        ctx.font = "14px Inter, system-ui";
        ctx.fillText(`${st.kmTotal.toFixed(1)} km · ${formatCurrency(st.kmTotal * precioEstudio)}`, 20, 58);

        // Table header
        const ty = headerH;
        ctx.fillStyle = "#1F1B2E";
        ctx.fillRect(20, ty, W - 40, rowH);
        ctx.fillStyle = "#FBBF24";
        ctx.font = "bold 12px Inter, system-ui";
        ctx.fillText("Siniestro", 30, ty + 20);
        ctx.fillText("Dirección", 200, ty + 20);
        ctx.fillText("Tipo IP", 700, ty + 20);

        // Table rows
        for (let i = 0; i < casosIncl.length; i++) {
            const c = casosIncl[i];
            const ry = ty + rowH + i * rowH;
            ctx.fillStyle = i % 2 === 0 ? "#16131B" : "#1A1725";
            ctx.fillRect(20, ry, W - 40, rowH);
            ctx.fillStyle = "#E5E7EB";
            ctx.font = "12px monospace";
            ctx.fillText(c.numero_siniestro, 30, ry + 20);
            ctx.font = "12px Inter, system-ui";
            ctx.fillText((c.direccion || "").substring(0, 60), 200, ry + 20);
            ctx.fillStyle = "#9CA3AF";
            ctx.fillText(c.tipo_inspeccion, 700, ry + 20);
        }

        // Map (static)
        if (st.polyline && mapsApiKey) {
            try {
                const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=900x500&scale=2&maptype=roadmap` +
                    `&path=enc:${encodeURIComponent(st.polyline)}&path=color:0xF59E0B|weight:4|enc:${encodeURIComponent(st.polyline)}` +
                    `&style=element:geometry|color:0x1d2c4d&style=element:labels.text.fill|color:0x8ec3b9` +
                    `&style=feature:road|element:geometry|color:0x304a7d&style=feature:water|element:geometry|color:0x0e1626` +
                    `&key=${mapsApiKey}`;
                const img = new Image();
                img.crossOrigin = "anonymous";
                await new Promise<void>((resolve, reject) => {
                    img.onload = () => { resolve(); };
                    img.onerror = () => { reject(); };
                    img.src = mapUrl;
                });
                ctx.drawImage(img, 20, tableH + 20, W - 40, mapH);
            } catch {
                ctx.fillStyle = "#374151";
                ctx.fillRect(20, tableH + 20, W - 40, mapH);
                ctx.fillStyle = "#9CA3AF";
                ctx.font = "16px Inter, system-ui";
                ctx.fillText("Mapa no disponible", W / 2 - 80, tableH + mapH / 2);
            }
        }

        // Download
        const link = document.createElement("a");
        link.download = `KM_${dia.fecha}_${dia.perito_nombre}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    }, [diaStates, precioEstudio, mapsApiKey]);

    // ═══ MONTHS OPTIONS ═══
    const monthOptions = useMemo(() => {
        const opts: { value: string; label: string }[] = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            opts.push({
                value: val,
                label: format(d, "MMMM yyyy", { locale: es }),
            });
        }
        return opts;
    }, []);

    // ═══ RENDER ═══
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ── Header ── */}
            <div>
                <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <Map className="w-6 h-6 text-brand-secondary" />
                    Kilometraje
                </h1>
                <p className="text-text-muted text-sm mt-1">
                    Cálculo automático de rutas y facturación de kilómetros
                </p>
            </div>

            {/* ── Filters ── */}
            <div className="flex flex-wrap items-end gap-4 bg-bg-secondary border border-border rounded-xl p-4">
                <div className="flex-1 min-w-[160px]">
                    <label className="text-[11px] text-text-muted uppercase tracking-wider font-medium mb-1 block">Perito</label>
                    <select
                        value={selectedPerito}
                        onChange={e => setSelectedPerito(e.target.value)}
                        className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-brand-secondary focus:outline-none"
                    >
                        <option value="todos">Todos</option>
                        {peritos.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 min-w-[160px]">
                    <label className="text-[11px] text-text-muted uppercase tracking-wider font-medium mb-1 block">Mes</label>
                    <select
                        value={selectedMes}
                        onChange={e => setSelectedMes(e.target.value)}
                        className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-brand-secondary focus:outline-none capitalize"
                    >
                        {monthOptions.map(m => (
                            <option key={m.value} value={m.value} className="capitalize">{m.label}</option>
                        ))}
                    </select>
                </div>
                <div className="min-w-[140px]">
                    <label className="text-[11px] text-text-muted uppercase tracking-wider font-medium mb-1 block">$/KM (estudio)</label>
                    <input
                        type="number"
                        value={precioEstudio}
                        onChange={e => setPrecioEstudio(Number(e.target.value))}
                        className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:border-brand-secondary focus:outline-none"
                    />
                </div>
                <div className="min-w-[140px]">
                    <label className="text-[11px] text-text-muted uppercase tracking-wider font-medium mb-1 block">$/KM (perito)</label>
                    <input
                        type="number"
                        value={precioPerito}
                        onChange={e => setPrecioPerito(Number(e.target.value))}
                        className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:border-brand-secondary focus:outline-none"
                    />
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <KpiCard icon={Calendar} label="Días calculados" value={String(kpis.calculados)} color="text-color-success" />
                <KpiCard icon={Clock} label="Días pendientes" value={String(kpis.pendientes)} color="text-amber-500" />
                <KpiCard icon={Route} label="KM totales" value={`${kpis.kmTotal.toFixed(1)} km`} color="text-brand-secondary" />
                <KpiCard icon={DollarSign} label="Monto estudio" value={formatCurrency(kpis.montoEstudio)} color="text-color-success" />
                <KpiCard icon={DollarSign} label="Monto perito" value={formatCurrency(kpis.montoPerito)} color="text-text-secondary" />
            </div>

            {/* ── Global actions ── */}
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={calcularTodas}
                    disabled={calculatingAll || kpis.pendientes === 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-brand-secondary/15 border border-brand-secondary/30 text-brand-secondary rounded-xl text-sm font-medium hover:bg-brand-secondary/25 transition-colors disabled:opacity-40"
                >
                    {calculatingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                    {calculatingAll ? "Calculando..." : `Calcular ${kpis.pendientes} pendientes`}
                </button>
                <button
                    onClick={exportExcel}
                    disabled={exportingExcel || kpis.calculados === 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-bg-secondary border border-border text-text-primary rounded-xl text-sm font-medium hover:bg-bg-tertiary transition-colors disabled:opacity-40"
                >
                    {exportingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Descargar Excel
                </button>
            </div>

            {/* ── Days list ── */}
            {filteredDias.length === 0 ? (
                <div className="bg-bg-secondary border border-border rounded-xl p-8 text-center">
                    <Navigation className="w-10 h-10 text-text-muted opacity-40 mx-auto mb-3" />
                    <p className="text-text-primary font-medium">Sin inspecciones este mes</p>
                    <p className="text-text-muted text-sm mt-1">
                        No se encontraron inspecciones completadas para el período seleccionado.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredDias.map(dia => {
                        const key = diaKey(dia);
                        const st = diaStates[key];
                        if (!st) return null;
                        const casosIncl = dia.casos.filter(c => st.incluidos.has(c.caso_id));
                        const monto = st.kmTotal * precioEstudio;

                        return (
                            <div key={key} className={`bg-bg-secondary border rounded-xl transition-all duration-300 ${
                                st.calculado && !st.needsRecalc ? "border-color-success/20" : "border-border"
                            }`}>
                                {/* Card header */}
                                <button
                                    onClick={() => toggleExpand(key)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-bg-tertiary/30 transition-colors rounded-xl"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        {st.calculado && !st.needsRecalc ? (
                                            <CheckCircle2 className="w-5 h-5 text-color-success shrink-0" />
                                        ) : (
                                            <Circle className="w-5 h-5 text-text-muted shrink-0" />
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2 text-text-primary font-semibold">
                                                <span>Día {format(parse(dia.fecha, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")}</span>
                                                <span className="text-text-muted font-normal">—</span>
                                                <span className="text-brand-secondary">{dia.perito_nombre} {dia.perito_apellido}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                                                <span>{dia.casos.length} siniestro{dia.casos.length !== 1 ? "s" : ""}</span>
                                                {st.calculado && !st.needsRecalc && (
                                                    <>
                                                        <span>·</span>
                                                        <span className="text-brand-secondary font-mono font-medium">{st.kmTotal.toFixed(1)} km</span>
                                                        <span>·</span>
                                                        <span className="text-color-success font-mono">{formatCurrency(monto)}</span>
                                                    </>
                                                )}
                                                {st.needsRecalc && (
                                                    <span className="text-amber-500 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> Necesita recalcular
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-1 rounded-lg">
                                            {casosIncl.length} incl.
                                        </span>
                                        {st.expanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                                    </div>
                                </button>

                                {/* Expanded body */}
                                {st.expanded && (
                                    <div className="border-t border-border p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                        {/* Config row */}
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div className="flex-1 min-w-[200px]">
                                                <label className="text-[11px] text-text-muted uppercase tracking-wider font-medium mb-1 block">
                                                    <MapPin className="w-3 h-3 inline mr-1" />Punto de partida
                                                </label>
                                                <input
                                                    value={st.puntoPartida}
                                                    onChange={e => updateField(key, "puntoPartida", e.target.value)}
                                                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-text-primary focus:border-brand-secondary focus:outline-none"
                                                    placeholder="Dirección base del perito"
                                                />
                                            </div>
                                            <div className="min-w-[200px]">
                                                <label className="text-[11px] text-text-muted uppercase tracking-wider font-medium mb-1 block">
                                                    Siniestro asociado
                                                </label>
                                                <input
                                                    value={st.siniestroAsociado}
                                                    onChange={e => updateField(key, "siniestroAsociado", e.target.value)}
                                                    className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-text-primary font-mono focus:border-brand-secondary focus:outline-none"
                                                    placeholder="Nro siniestro"
                                                />
                                            </div>
                                        </div>

                                        {/* Siniestros table */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-border bg-bg-tertiary/50">
                                                        <th className="w-10 px-3 py-2"></th>
                                                        <th className="text-left px-3 py-2 text-text-muted text-xs font-medium">Siniestro</th>
                                                        <th className="text-left px-3 py-2 text-text-muted text-xs font-medium">Dirección</th>
                                                        <th className="text-left px-3 py-2 text-text-muted text-xs font-medium">Tipo IP</th>
                                                        <th className="text-left px-3 py-2 text-text-muted text-xs font-medium">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/30">
                                                    {dia.casos.map(caso => {
                                                        const isIncluded = st.incluidos.has(caso.caso_id);
                                                        const isRemota = TIPOS_REMOTOS.has(caso.tipo_inspeccion);
                                                        return (
                                                            <tr key={caso.caso_id} className={`transition-colors ${isIncluded ? "hover:bg-bg-tertiary/30" : "opacity-50"}`}>
                                                                <td className="px-3 py-2">
                                                                    <button
                                                                        onClick={() => toggleIncluido(key, caso.caso_id)}
                                                                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                                                            isIncluded
                                                                                ? "bg-brand-secondary border-brand-secondary text-white"
                                                                                : "border-border bg-bg-tertiary hover:border-text-muted"
                                                                        }`}
                                                                    >
                                                                        {isIncluded && <Check className="w-3 h-3" />}
                                                                    </button>
                                                                </td>
                                                                <td className="px-3 py-2 font-mono text-text-primary">{caso.numero_siniestro}</td>
                                                                <td className="px-3 py-2 text-text-secondary max-w-[300px] truncate">{caso.direccion}</td>
                                                                <td className="px-3 py-2">
                                                                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${
                                                                        isRemota ? "bg-purple-500/10 text-purple-400" : "bg-brand-primary/10 text-brand-primary"
                                                                    }`}>
                                                                        {caso.tipo_inspeccion.replace(/_/g, " ")}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2 text-xs">
                                                                    {isRemota && !isIncluded ? (
                                                                        <span className="text-text-muted">Excluida (remota)</span>
                                                                    ) : isIncluded ? (
                                                                        <span className="text-color-success flex items-center gap-1">
                                                                            <Check className="w-3 h-3" /> Incluida
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-text-muted">Excluida</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => calcularRuta(dia)}
                                                disabled={st.calculating || casosIncl.length === 0 || !st.puntoPartida}
                                                className="flex items-center gap-2 px-4 py-2 bg-brand-secondary/15 border border-brand-secondary/30 text-brand-secondary rounded-lg text-sm font-medium hover:bg-brand-secondary/25 transition-colors disabled:opacity-40"
                                            >
                                                {st.calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                                                {st.calculating ? "Calculando..." : st.needsRecalc ? "Recalcular ruta" : "Calcular ruta óptima"}
                                            </button>
                                            {st.googleMapsUrl && (
                                                <a
                                                    href={st.googleMapsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary border border-border text-text-primary rounded-lg text-sm font-medium hover:bg-bg-secondary transition-colors"
                                                >
                                                    <ExternalLink className="w-4 h-4" /> Ver en Maps
                                                </a>
                                            )}
                                            {st.calculado && (
                                                <>
                                                    <button
                                                        onClick={() => copyResumen(dia)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary border border-border text-text-primary rounded-lg text-sm font-medium hover:bg-bg-secondary transition-colors"
                                                    >
                                                        {copiedId === key ? <Check className="w-4 h-4 text-color-success" /> : <Copy className="w-4 h-4" />}
                                                        {copiedId === key ? "Copiado" : "Copiar resumen"}
                                                    </button>
                                                    <button
                                                        onClick={() => exportImage(dia)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary border border-border text-text-primary rounded-lg text-sm font-medium hover:bg-bg-secondary transition-colors"
                                                    >
                                                        <ImageIcon className="w-4 h-4" /> Descargar imagen
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Results after calculation */}
                                        {st.calculado && !st.needsRecalc && (
                                            <div className="space-y-4 pt-2 border-t border-border">
                                                {/* Summary */}
                                                <div className="flex flex-wrap gap-4">
                                                    <div className="bg-brand-secondary/10 border border-brand-secondary/20 rounded-xl px-5 py-3">
                                                        <p className="text-[11px] text-brand-secondary/70 uppercase tracking-wider">Distancia total</p>
                                                        <p className="text-2xl font-bold text-brand-secondary font-mono">{st.kmTotal.toFixed(1)} km</p>
                                                    </div>
                                                    <div className="bg-color-success/10 border border-color-success/20 rounded-xl px-5 py-3">
                                                        <p className="text-[11px] text-color-success/70 uppercase tracking-wider">Monto estudio</p>
                                                        <p className="text-2xl font-bold text-color-success font-mono">{formatCurrency(monto)}</p>
                                                    </div>
                                                    <div className="bg-bg-tertiary border border-border rounded-xl px-5 py-3">
                                                        <p className="text-[11px] text-text-muted uppercase tracking-wider">Duración</p>
                                                        <p className="text-2xl font-bold text-text-primary font-mono">{st.duracionMin} min</p>
                                                    </div>
                                                </div>

                                                {/* Legs (route order) */}
                                                {st.legs && st.legs.length > 0 && (
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Orden de la ruta</p>
                                                        <div className="space-y-1">
                                                            {st.legs.map((leg, i) => (
                                                                <div key={i} className="flex items-center gap-2 text-xs bg-bg-tertiary/50 rounded-lg px-3 py-2">
                                                                    <span className="w-5 h-5 rounded-full bg-brand-secondary/20 text-brand-secondary text-[10px] font-bold flex items-center justify-center shrink-0">
                                                                        {i + 1}
                                                                    </span>
                                                                    <span className="text-text-secondary truncate flex-1">{leg.start_address}</span>
                                                                    <span className="text-text-muted">→</span>
                                                                    <span className="text-text-secondary truncate flex-1">{leg.end_address}</span>
                                                                    <span className="text-brand-secondary font-mono font-medium shrink-0">{leg.distance_text}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Map */}
                                                {st.polyline && mapsApiKey && (
                                                    <KilometrajeMapa
                                                        apiKey={mapsApiKey}
                                                        polyline={st.polyline}
                                                        legs={st.legs || []}
                                                        puntoPartida={st.puntoPartida}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ═══ KPI Card ═══
function KpiCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
    return (
        <div className="bg-bg-secondary border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                <Icon className="w-3.5 h-3.5" /> {label}
            </div>
            <p className={`text-2xl font-bold ${color} font-mono`}>{value}</p>
        </div>
    );
}

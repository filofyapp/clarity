import { createClient } from "@/lib/supabase/server";
import { Clock, CheckCircle2, AlertTriangle, Briefcase, FileText, Car } from "lucide-react";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/formatters";
import { FacturacionMensualCarga } from "./FacturacionMensualCarga";

interface Props { userId: string; }

export async function PanelPeritoCarga({ userId }: Props) {
    const supabase = await createClient();

    // ═══ 1. Query ALL cases where this user is perito_carga OR perito_calle ═══
    const { data: allCasos } = await supabase
        .from("casos")
        .select("id, numero_siniestro, estado, dominio, marca, modelo, tipo_inspeccion, monto_facturado_estudio, monto_pagado_perito_calle, monto_pagado_perito_carga, updated_at, fecha_cierre, fecha_carga_sistema, fecha_inspeccion_real, perito_calle_id, perito_carga_id")
        .or(`perito_carga_id.eq.${userId},perito_calle_id.eq.${userId}`)
        .order("updated_at", { ascending: false });

    const casos = allCasos || [];
    const now = new Date();
    const mesActualStr = format(now, "MMMM yyyy", { locale: es });

    // ═══ 2. Separate by role ═══
    const casosCarga = casos.filter(c => c.perito_carga_id === userId);
    const casosCalle = casos.filter(c => c.perito_calle_id === userId);
    const isDualRole = casosCalle.length > 0 && casosCarga.length > 0;

    // ═══ 3. Month boundaries (local time, precise) ═══
    const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    const mesFin = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const mesAnteriorInicio = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const mesAnteriorFin = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const isInMonth = (dateStr: string | null, start: Date, end: Date) => {
        if (!dateStr) return false;
        const d = new Date(dateStr).getTime();
        return d >= start.getTime() && d <= end.getTime();
    };

    const isThisMonth = (d: string | null) => isInMonth(d, mesInicio, mesFin);
    const isLastMonth = (d: string | null) => isInMonth(d, mesAnteriorInicio, mesAnteriorFin);

    // ═══ 4. PERITO CARGA metrics — billing recognized at fecha_cierre (ip_cerrada) ═══
    const pendientesCarga = casosCarga.filter(c => c.estado === "pendiente_carga");
    const pendientePpto = casosCarga.filter(c => c.estado === "pendiente_presupuesto");
    const licitando = casosCarga.filter(c => c.estado === "licitando_repuestos");
    const enConsulta = casosCarga.filter(c => c.estado === "en_consulta_cia");
    const enProcesoCarga = [...pendientesCarga, ...pendientePpto, ...licitando, ...enConsulta];

    // Cerrados: ip_cerrada or facturada (NOT anulada)
    const cerradosCarga = casosCarga.filter(c => c.estado === "ip_cerrada" || c.estado === "facturada");
    const cerradosCargaMesActual = cerradosCarga.filter(c => isThisMonth(c.fecha_cierre));
    const cerradosCargaMesAnterior = cerradosCarga.filter(c => isLastMonth(c.fecha_cierre));

    const calcDesgloseCarga = (lista: typeof casos) => {
        const total = lista.reduce((s, c) => s + (Number(c.monto_pagado_perito_carga) || 0), 0);
        const desglose = lista.reduce((acc, c) => {
            const tipo = c.tipo_inspeccion || "otros";
            if (!acc[tipo]) acc[tipo] = { count: 0, sum: 0 };
            acc[tipo].count += 1;
            acc[tipo].sum += (Number(c.monto_pagado_perito_carga) || 0);
            return acc;
        }, {} as Record<string, { count: number, sum: number }>);
        return { total, desglose, count: lista.length };
    };

    const cargaMesActualData = calcDesgloseCarga(cerradosCargaMesActual);
    const cargaMesAnteriorData = calcDesgloseCarga(cerradosCargaMesAnterior);

    // ═══ 5. PERITO CALLE metrics — billing recognized at fecha_inspeccion_real (IP completada) ═══
    // fecha_inspeccion_real = when perito calle completed the inspection = perito calle's work is done
    const calleBillingDate = (c: any): string | null => c.fecha_inspeccion_real || null;
    const casosCalleBillable = casosCalle.filter(c =>
        c.estado !== "inspeccion_anulada" && Number(c.monto_pagado_perito_calle) > 0
    );
    const calleMesActual = casosCalleBillable.filter(c => isThisMonth(calleBillingDate(c)));
    const calleMesAnterior = casosCalleBillable.filter(c => isLastMonth(calleBillingDate(c)));

    const calcDesgloseCalle = (lista: typeof casos) => {
        const total = lista.reduce((s, c) => s + (Number(c.monto_pagado_perito_calle) || 0), 0);
        const desglose = lista.reduce((acc, c) => {
            const tipo = c.tipo_inspeccion || "otros";
            if (!acc[tipo]) acc[tipo] = { count: 0, sum: 0 };
            acc[tipo].count += 1;
            acc[tipo].sum += (Number(c.monto_pagado_perito_calle) || 0);
            return acc;
        }, {} as Record<string, { count: number, sum: number }>);
        return { total, desglose, count: lista.length };
    };

    const calleMesActualData = calcDesgloseCalle(calleMesActual);
    const calleMesAnteriorData = calcDesgloseCalle(calleMesAnterior);

    // ═══ 6. Actividad Reciente (últimos 10 de carga) ═══
    const recientes = casosCarga.slice(0, 10);

    // ═══ 7. Tareas ═══
    const { data: tareasPendientes } = await supabase
        .from("tareas")
        .select("id, titulo, prioridad, estado")
        .eq("asignado_id", userId)
        .in("estado", ["pendiente", "en_proceso"]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ═══ Bloque 1: Resumen del Mes ═══ */}
            <div>
                <h1 className="text-2xl font-bold text-text-primary capitalize">📋 {mesActualStr}</h1>
                <p className="text-text-muted text-sm mt-1">Tu resumen del mes actual.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={AlertTriangle} label="En cola (carga)" value={pendientesCarga.length.toString()} color="text-color-danger" />
                <KpiCard icon={Briefcase} label="En proceso" value={enProcesoCarga.length.toString()} color="text-color-warning" />
                <KpiCard icon={CheckCircle2} label="Cerrados este mes" value={cerradosCargaMesActual.length.toString()} color="text-color-success" />
                <FacturacionMensualCarga
                    mesActual={cargaMesActualData}
                    mesAnterior={cargaMesAnteriorData}
                    label="Hon. Carga"
                />
            </div>

            {/* ═══ Bloque 1b: Hon. Calle (solo si es dual role) ═══ */}
            {isDualRole && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard icon={Car} label="IPs realizadas (calle)" value={calleMesActual.length.toString()} color="text-orange-400" />
                    <FacturacionMensualCarga
                        mesActual={calleMesActualData}
                        mesAnterior={calleMesAnteriorData}
                        label="Hon. Calle"
                    />
                    <div className="bg-bg-secondary border border-brand-primary/20 rounded-xl p-4 col-span-2 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] text-text-muted font-medium uppercase tracking-wide">Total Generado (Calle + Carga)</p>
                            <p className="text-xs text-text-muted mt-0.5">{calleMesActual.length + cerradosCargaMesActual.length} casos</p>
                        </div>
                        <p className="text-2xl font-bold text-brand-secondary">
                            {formatCurrency(cargaMesActualData.total + calleMesActualData.total)}
                        </p>
                    </div>
                </div>
            )}

            {/* ═══ Bloque 2: Actividad Reciente ═══ */}
            <div className="bg-bg-secondary border border-border rounded-xl p-4">
                <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-secondary" /> Actividad Reciente
                </h2>
                {recientes.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-4">Sin actividad reciente.</p>
                ) : (
                    <div className="space-y-2">
                        {recientes.map(c => (
                            <Link key={c.id} href={`/casos/${c.id}`}
                                className="flex items-center justify-between bg-bg-tertiary border border-border rounded-lg px-3 py-2 hover:border-border-hover transition-colors">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-mono text-sm text-text-primary shrink-0">{c.numero_siniestro}</span>
                                    <span className="text-xs text-text-muted truncate">{c.dominio} · {c.marca} {c.modelo}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-secondary text-text-muted capitalize shrink-0">{c.estado.replace(/_/g, " ")}</span>
                                </div>
                                <span className="text-xs text-text-muted shrink-0">{formatDistanceToNow(new Date(c.updated_at), { locale: es, addSuffix: true })}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* ═══ Bloque 3: Distribución por Estado (Carga) ═══ */}
            <div className="bg-bg-secondary border border-border rounded-xl p-4">
                <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-brand-primary" /> Distribución por Estado (Carga)
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <EstadoChip label="Pdte. Carga" count={pendientesCarga.length} color="bg-danger/10 text-danger border-danger/20" />
                    <EstadoChip label="Pdte. Presupuesto" count={pendientePpto.length} color="bg-color-warning/10 text-color-warning border-color-warning/20" />
                    <EstadoChip label="Licitando" count={licitando.length} color="bg-brand-primary/10 text-brand-primary border-brand-primary/20" />
                    <EstadoChip label="En Consulta" count={enConsulta.length} color="bg-color-critical/10 text-color-critical border-color-critical/20" />
                    <EstadoChip label="Cerrados / Fact." count={cerradosCarga.length} color="bg-color-success/10 text-color-success border-color-success/20" />
                </div>
            </div>

            {/* Pendientes de carga */}
            {pendientesCarga.length > 0 && (
                <div className="bg-bg-secondary border border-danger/20 rounded-xl p-4">
                    <h2 className="font-semibold text-danger mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Pendientes de Carga ({pendientesCarga.length})
                    </h2>
                    <div className="space-y-2">
                        {pendientesCarga.map(c => (
                            <Link key={c.id} href={`/casos/${c.id}`}
                                className="flex items-center justify-between bg-bg-tertiary border border-border rounded-lg px-3 py-2 hover:border-danger/40 transition-colors">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm text-text-primary">{c.numero_siniestro}</span>
                                    <span className="text-xs text-text-muted">{c.dominio} · {c.marca} {c.modelo}</span>
                                </div>
                                <span className="text-xs text-danger font-medium">
                                    {formatDistanceToNow(new Date(c.updated_at), { locale: es, addSuffix: true })}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* En proceso */}
            {enProcesoCarga.length > 0 && (
                <div className="bg-bg-secondary border border-border rounded-xl p-4">
                    <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-color-info" /> En Proceso ({enProcesoCarga.length})
                    </h2>
                    <div className="space-y-3">
                        {enProcesoCarga.map(c => {
                            const days = differenceInDays(new Date(), new Date(c.updated_at));
                            return (
                                <Link key={c.id} href={`/casos/${c.id}`}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between bg-bg-tertiary border border-border rounded-xl p-3 hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all shadow-sm group">
                                    <div className="flex flex-col gap-1 mb-2 sm:mb-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">{c.numero_siniestro}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium
                                                ${c.estado === 'licitando_repuestos' ? 'bg-color-warning/10 text-color-warning border border-color-warning/20' :
                                                    c.estado === 'pendiente_carga' ? 'bg-color-danger/10 text-color-danger border border-color-danger/20' :
                                                        c.estado === 'en_consulta_cia' ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' :
                                                            'bg-color-info/10 text-color-info border border-color-info/20'}`}>
                                                {c.estado.replace(/_/g, " ")}
                                            </span>
                                        </div>
                                        <span className="text-xs text-text-muted flex items-center gap-1.5 line-clamp-1">
                                            <Briefcase className="w-3.5 h-3.5" />
                                            {c.dominio || "S/D"} · {c.marca} {c.modelo}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                                        <span className={`text-xs font-medium px-2 py-1 rounded-md ${days > 5 ? "bg-danger/10 text-danger" : "bg-bg-secondary text-text-secondary"}`}>
                                            Hace {days} {days === 1 ? "día" : "días"}
                                        </span>
                                        <span className="text-brand-primary bg-brand-primary/10 hover:bg-brand-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1">
                                            Abrir <CheckCircle2 className="w-3 h-3" />
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tareas */}
            {(tareasPendientes || []).length > 0 && (
                <div className="bg-bg-secondary border border-border rounded-xl p-4">
                    <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-color-info" /> Tareas ({tareasPendientes!.length})
                    </h2>
                    <div className="space-y-2">
                        {tareasPendientes!.map(t => (
                            <Link key={t.id} href="/tareas"
                                className="flex flex-col sm:flex-row sm:items-center justify-between bg-bg-tertiary border border-border rounded-xl px-4 py-3 hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all shadow-sm group gap-2">
                                <span className="text-text-primary font-medium group-hover:text-brand-primary transition-colors">{t.titulo}</span>
                                <span className={`text-[11px] px-2.5 py-1 rounded-md font-semibold ${t.prioridad === "urgente" ? "bg-danger text-white hover:bg-danger/90"
                                    : t.prioridad === "alta" ? "bg-color-warning text-bg-primary"
                                        : "bg-color-info text-white"
                                    }`}>{t.prioridad.toUpperCase()}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function KpiCard({ icon: Icon, label, value, color = "text-text-primary" }: { icon: any; label: string; value: string; color?: string }) {
    return (
        <div className="bg-bg-secondary border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                <Icon className="w-3.5 h-3.5" /> {label}
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
    );
}

function EstadoChip({ label, count, color }: { label: string; count: number; color: string }) {
    return (
        <div className={`flex items-center justify-between border rounded-lg px-3 py-2.5 ${color}`}>
            <span className="text-xs font-medium">{label}</span>
            <span className="text-lg font-bold">{count}</span>
        </div>
    );
}

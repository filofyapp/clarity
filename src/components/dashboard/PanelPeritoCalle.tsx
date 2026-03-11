import { createClient } from "@/lib/supabase/server";
import { Clock, CheckCircle2, AlertTriangle, Briefcase, TrendingUp, Calendar } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/formatters";

interface Props { userId: string; }

export async function PanelPeritoCalle({ userId }: Props) {
    const supabase = await createClient();

    // Mis casos como perito de calle
    const { data: misCasos } = await supabase
        .from("casos")
        .select("id, numero_siniestro, estado, dominio, marca, modelo, fecha_inspeccion_programada, fecha_inspeccion_real, tipo_inspeccion, monto_pagado_perito_calle, localidad, updated_at")
        .eq("perito_calle_id", userId)
        .order("updated_at", { ascending: false });

    const casos = misCasos || [];
    const activos = casos.filter(c => c.estado === "ip_coordinada" || c.estado === "pendiente_coordinacion" || c.estado === "contactado");
    const hoyManana = casos.filter(c => {
        if (!c.fecha_inspeccion_programada) return false;
        const f = new Date(c.fecha_inspeccion_programada);
        const hoy = new Date();
        const diff = (f.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= -1 && diff <= 2;
    });

    const cerrados = casos.filter(c => c.estado === "ip_cerrada" || c.estado === "facturada");

    const now = new Date();
    const isThisMonth = (d: string | null) => {
        if (!d) return false;
        const date = new Date(d);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    };

    const totalMesCasos = casos.filter(c => isThisMonth(c.fecha_inspeccion_real) && (c.monto_pagado_perito_calle || 0) > 0);
    const totalFacturado = totalMesCasos.reduce((s, c) => s + (c.monto_pagado_perito_calle || 0), 0);

    // Desglose por tipo
    const desglose = totalMesCasos.reduce((acc, c) => {
        const tipo = c.tipo_inspeccion || "otros";
        if (!acc[tipo]) acc[tipo] = { count: 0, sum: 0 };
        acc[tipo].count += 1;
        acc[tipo].sum += (c.monto_pagado_perito_calle || 0);
        return acc;
    }, {} as Record<string, { count: number, sum: number }>);

    // Tareas
    const { data: tareasPendientes } = await supabase
        .from("tareas")
        .select("id, titulo, prioridad, estado")
        .eq("asignado_id", userId)
        .in("estado", ["pendiente", "en_proceso"]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">🚗 Mi Panel — Perito de Calle</h1>
                <p className="text-text-muted text-sm mt-1">Resumen de tus inspecciones y tareas.</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={Briefcase} label="Casos Activos" value={activos.length.toString()} color="text-color-warning" />
                <KpiCard icon={Calendar} label="IP Próximas" value={hoyManana.length.toString()} color="text-brand-primary" />
                <KpiCard icon={CheckCircle2} label="Realizadas" value={cerrados.length.toString()} color="text-color-success" />

                {/* Cobrado KPI con Tooltip / Popover Desglose */}
                <div className="bg-bg-secondary border border-border rounded-xl p-4 flex flex-col group relative">
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                        <TrendingUp className="w-3.5 h-3.5" /> Generado (Mes)
                    </div>
                    <p className={`text-2xl font-bold text-brand-secondary`}>{formatCurrency(totalFacturado)}</p>
                    {/* Tooltip Hover Breakdown */}
                    {Object.keys(desglose).length > 0 && (
                        <div className="absolute top-full left-0 mt-2 w-full bg-bg-elevated border border-border p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                            <h4 className="text-[10px] uppercase font-bold text-text-muted mb-2 border-b border-border pb-1">Desglose de Ingresos (Cobrará este mes)</h4>
                            <div className="space-y-1.5">
                                {Object.entries(desglose).map(([tipo, data]) => (
                                    <div key={tipo} className="flex items-center justify-between text-xs">
                                        <span className="capitalize text-text-secondary">{tipo.replace(/_/g, " ")} ({data.count})</span>
                                        <span className="font-semibold text-text-primary">{formatCurrency(data.sum)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Próximas inspecciones */}
            <div className="bg-bg-secondary border border-border rounded-xl p-4">
                <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-secondary" /> Inspecciones Próximas
                </h2>
                {hoyManana.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-4">Sin inspecciones programadas en las próximas 48hs.</p>
                ) : (
                    <div className="space-y-2">
                        {hoyManana.map(c => (
                            <Link key={c.id} href={`/casos/${c.id}`}
                                className="flex items-center justify-between bg-bg-tertiary border border-border rounded-lg px-3 py-2 hover:border-border-hover transition-colors">
                                <div>
                                    <span className="font-mono text-sm text-text-primary">{c.numero_siniestro}</span>
                                    <span className="text-xs text-text-muted ml-2">{c.dominio} · {c.marca} · {c.localidad}</span>
                                </div>
                                <div className="text-xs text-brand-primary font-medium">
                                    {c.fecha_inspeccion_programada && format(new Date(c.fecha_inspeccion_programada), "dd MMM HH:mm", { locale: es })}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Mis casos activos */}
            <div className="bg-bg-secondary border border-border rounded-xl p-4">
                <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-color-warning" /> Requieren Acción ({activos.length})
                </h2>
                <div className="space-y-2">
                    {activos.slice(0, 10).map(c => (
                        <Link key={c.id} href={`/casos/${c.id}`}
                            className="flex items-center justify-between bg-bg-tertiary border border-border rounded-lg px-3 py-2 hover:border-border-hover transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-text-primary">{c.numero_siniestro}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-color-warning/10 text-color-warning capitalize">{c.estado.replace(/_/g, " ")}</span>
                            </div>
                            <span className="text-xs text-text-muted">{formatDistanceToNow(new Date(c.updated_at), { locale: es, addSuffix: true })}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Tareas pendientes */}
            {(tareasPendientes || []).length > 0 && (
                <div className="bg-bg-secondary border border-border rounded-xl p-4">
                    <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-color-info" /> Tareas ({tareasPendientes!.length})
                    </h2>
                    <div className="space-y-1">
                        {tareasPendientes!.map(t => (
                            <Link key={t.id} href="/tareas"
                                className="flex items-center justify-between bg-bg-tertiary border border-border rounded-lg px-3 py-2 hover:border-border-hover transition-colors text-sm">
                                <span className="text-text-primary">{t.titulo}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.prioridad === "urgente" ? "bg-danger/20 text-danger" : "bg-bg-secondary text-text-muted"}`}>{t.prioridad}</span>
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

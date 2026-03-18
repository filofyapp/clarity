import { createClient } from "@/lib/supabase/server";
import { Clock, CheckCircle2, AlertTriangle, Briefcase, TrendingUp, Calendar, MapPin } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/formatters";

interface Props { userId: string; }

export async function PanelPeritoCalle({ userId }: Props) {
    const supabase = await createClient();

    const { data: misCasos } = await supabase
        .from("casos")
        .select("id, numero_siniestro, estado, dominio, marca, modelo, fecha_inspeccion_programada, fecha_inspeccion_real, tipo_inspeccion, monto_pagado_perito_calle, localidad, updated_at")
        .eq("perito_calle_id", userId)
        .order("updated_at", { ascending: false });

    const casos = misCasos || [];

    const now = new Date();
    const mesActualStr = format(now, "MMMM yyyy", { locale: es });
    const mesActualInicio = new Date(now.getFullYear(), now.getMonth(), 1);

    // Month calculations
    const isThisMonth = (d: string | null) => {
        if (!d) return false;
        const date = new Date(d);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    };

    const inspeccionesEsteMes = casos.filter(c => isThisMonth(c.fecha_inspeccion_real));
    const pendientesHoy = casos.filter(c => {
        if (c.estado !== "ip_coordinada") return false;
        if (!c.fecha_inspeccion_programada) return false;
        const f = new Date(c.fecha_inspeccion_programada);
        return f.toDateString() === now.toDateString();
    });

    const proximaIP = casos
        .filter(c => c.fecha_inspeccion_programada && new Date(c.fecha_inspeccion_programada) >= now && c.estado === "ip_coordinada")
        .sort((a, b) => new Date(a.fecha_inspeccion_programada!).getTime() - new Date(b.fecha_inspeccion_programada!).getTime())[0];

    const totalMesCasos = casos.filter(c => isThisMonth(c.fecha_inspeccion_real) && (c.monto_pagado_perito_calle || 0) > 0);
    const totalFacturado = totalMesCasos.reduce((s, c) => s + (c.monto_pagado_perito_calle || 0), 0);

    // Historical
    const activos = casos.filter(c => c.estado === "ip_coordinada" || c.estado === "pendiente_coordinacion" || c.estado === "contactado");
    const cerrados = casos.filter(c => c.estado === "ip_cerrada" || c.estado === "facturada");

    // Actividad reciente (últimos 10)
    const recientes = casos.slice(0, 10);

    // Tareas
    const { data: tareasPendientes } = await supabase
        .from("tareas")
        .select("id, titulo, prioridad, estado")
        .eq("asignado_id", userId)
        .in("estado", ["pendiente", "en_proceso"]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ═══ Bloque 1: Resumen del Mes ═══ */}
            <div>
                <h1 className="text-2xl font-bold text-text-primary capitalize">🚗 {mesActualStr}</h1>
                <p className="text-text-muted text-sm mt-1">Tu resumen del mes actual.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={CheckCircle2} label="Inspecciones este mes" value={inspeccionesEsteMes.length.toString()} color="text-color-success" />
                <KpiCard icon={Calendar} label="Pendientes hoy" value={pendientesHoy.length.toString()} color="text-brand-primary" />
                <KpiCard icon={TrendingUp} label="Generado (Mes)" value={formatCurrency(totalFacturado)} color="text-brand-secondary" />
                <div className="bg-bg-secondary border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                        <MapPin className="w-3.5 h-3.5" /> Próxima IP
                    </div>
                    {proximaIP ? (
                        <Link href={`/casos/${proximaIP.id}`} className="hover:text-brand-primary transition-colors">
                            <p className="text-sm font-bold text-text-primary">{proximaIP.numero_siniestro}</p>
                            <p className="text-xs text-text-muted mt-0.5">
                                {format(new Date(proximaIP.fecha_inspeccion_programada!), "dd MMM HH:mm", { locale: es })}
                                {proximaIP.localidad && ` · ${proximaIP.localidad}`}
                            </p>
                        </Link>
                    ) : (
                        <p className="text-sm text-text-muted">Sin inspecciones</p>
                    )}
                </div>
            </div>

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
                                    <span className="text-xs text-text-muted truncate">{c.dominio} · {c.marca}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-secondary text-text-muted capitalize shrink-0">{c.estado.replace(/_/g, " ")}</span>
                                </div>
                                <span className="text-xs text-text-muted shrink-0">{formatDistanceToNow(new Date(c.updated_at), { locale: es, addSuffix: true })}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* ═══ Bloque 3: Datos Históricos (más chico) ═══ */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-bg-secondary/50 border border-border/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-text-muted">Total asignados</p>
                    <p className="text-lg font-bold text-text-secondary">{casos.length}</p>
                </div>
                <div className="bg-bg-secondary/50 border border-border/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-text-muted">Activos</p>
                    <p className="text-lg font-bold text-color-warning">{activos.length}</p>
                </div>
                <div className="bg-bg-secondary/50 border border-border/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-text-muted">Cerrados</p>
                    <p className="text-lg font-bold text-color-success">{cerrados.length}</p>
                </div>
            </div>

            {/* Requieren acción */}
            {activos.length > 0 && (
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
            )}

            {/* Tareas */}
            {(tareasPendientes || []).length > 0 && (
                <div className="bg-bg-secondary border border-border rounded-xl p-4">
                    <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-color-info" /> Tareas ({tareasPendientes!.length})
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

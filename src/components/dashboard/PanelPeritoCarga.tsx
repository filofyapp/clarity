import { createClient } from "@/lib/supabase/server";
import { Clock, CheckCircle2, AlertTriangle, Briefcase, TrendingUp, FileText } from "lucide-react";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/formatters";

interface Props { userId: string; }

export async function PanelPeritoCarga({ userId }: Props) {
    const supabase = await createClient();

    // Mis casos como perito de carga
    const { data: misCasos } = await supabase
        .from("casos")
        .select("id, numero_siniestro, estado, dominio, marca, modelo, tipo_inspeccion, monto_facturado_estudio, monto_pagado_perito_carga, updated_at")
        .eq("perito_carga_id", userId)
        .order("updated_at", { ascending: false });

    const casos = misCasos || [];
    const pendientes = casos.filter(c => c.estado === "pendiente_carga");
    const enProceso = casos.filter(c => c.estado === "licitando_repuestos" || c.estado === "en_consulta_cia" || c.estado === "pendiente_presupuesto");
    const cerrados = casos.filter(c => c.estado === "ip_cerrada" || c.estado === "facturada");

    const now = new Date();
    const isThisMonth = (d: string) => {
        if (!d) return false;
        const date = new Date(d);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    };

    const totalFacturado = casos
        .filter(c => c.estado === "facturada" && isThisMonth(c.updated_at))
        .reduce((s, c) => s + (c.monto_pagado_perito_carga || 0), 0);
    // IMPORTANTE: Aseguramos la suma correcta para Jairo sumando montos pagados a peritos de carga que apliquen.

    // Tareas
    const { data: tareasPendientes } = await supabase
        .from("tareas")
        .select("id, titulo, prioridad, estado")
        .eq("asignado_id", userId)
        .in("estado", ["pendiente", "en_proceso"]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">📋 Mi Panel — Perito de Carga</h1>
                <p className="text-text-muted text-sm mt-1">Resumen de tu carga de trabajo y expedientes.</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={AlertTriangle} label="Pdte. Carga" value={pendientes.length.toString()} color="text-danger" />
                <KpiCard icon={Clock} label="En Proceso" value={enProceso.length.toString()} color="text-color-warning" />
                <KpiCard icon={CheckCircle2} label="Cerrados" value={cerrados.length.toString()} color="text-color-success" />
                <KpiCard icon={TrendingUp} label="Cobrado (mes)" value={formatCurrency(totalFacturado)} color="text-brand-secondary" />
            </div>

            {/* Cola pendiente_carga */}
            <div className="bg-bg-secondary border border-danger/20 rounded-xl p-4">
                <h2 className="font-semibold text-danger mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Pendientes de Carga ({pendientes.length})
                </h2>
                {pendientes.length === 0 ? (
                    <div className="text-center py-6">
                        <CheckCircle2 className="w-8 h-8 text-color-success/40 mx-auto mb-2" />
                        <p className="text-sm text-text-muted">¡Sin casos pendientes de carga!</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {pendientes.map(c => (
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
                )}
            </div>

            {/* En proceso */}
            {enProceso.length > 0 && (
                <div className="bg-bg-secondary border border-border rounded-xl p-4">
                    <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-color-info" /> En Proceso ({enProceso.length})
                    </h2>
                    <div className="space-y-3">
                        {enProceso.map(c => {
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

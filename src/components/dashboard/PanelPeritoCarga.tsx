import { createClient } from "@/lib/supabase/server";
import { Clock, CheckCircle2, AlertTriangle, Briefcase, TrendingUp, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
    const totalFacturado = casos.filter(c => c.estado === "facturada").reduce((s, c) => s + (c.monto_pagado_perito_carga || 0), 0);

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
                    <div className="space-y-2">
                        {enProceso.map(c => (
                            <Link key={c.id} href={`/casos/${c.id}`}
                                className="flex items-center justify-between bg-bg-tertiary border border-border rounded-lg px-3 py-2 hover:border-border-hover transition-colors">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm text-text-primary">{c.numero_siniestro}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-color-info/10 text-color-info capitalize">{c.estado.replace(/_/g, " ")}</span>
                                </div>
                                <span className="text-xs text-text-muted">{c.dominio}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Tareas */}
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

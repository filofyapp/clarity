export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AlertCircle, Clock, CalendarCheck2, DollarSign, TrendingUp, Copy, ChevronRight, Briefcase, MapPin } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format, addDays, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";

export const metadata = { title: "Dashboard - CLARITY" };

export default async function Dashboard() {
    const supabase = await createClient();
    const { getUsuarioActual } = await import("@/lib/auth");
    const usuario = await getUsuarioActual();

    // Role-specific panels
    const esCalle = usuario.roles?.includes("calle") || usuario.rol === "calle";
    const esCarga = usuario.roles?.includes("carga") || usuario.rol === "carga";

    if (esCalle && !esCarga) {
        const { PanelPeritoCalle } = await import("@/components/dashboard/PanelPeritoCalle");
        return <PanelPeritoCalle userId={usuario.id} />;
    }
    if (esCarga) {
        const { PanelPeritoCarga } = await import("@/components/dashboard/PanelPeritoCarga");
        return <PanelPeritoCarga userId={usuario.id} />;
    }

    // Admin dashboard below

    // ── Obtener configuración de umbrales ──
    const { data: configData } = await supabase.from("configuracion").select("clave, valor");
    const config: Record<string, number> = {};
    configData?.forEach((c: any) => {
        const val = typeof c.valor === "string" ? parseInt(c.valor.replace(/"/g, "")) : c.valor;
        if (!isNaN(val)) config[c.clave] = val;
    });
    const UMBRAL_PCARGA_HORAS = config["horas_alerta_pendiente_carga"] || 24;
    const UMBRAL_PCOORD_HORAS = config["dias_alerta_caso_viejo"] ? config["dias_alerta_caso_viejo"] * 24 : 48;

    // ── BLOQUE 1: Alertas de casos demorados ──
    const ahora = new Date();
    const { data: demorados } = await supabase
        .from("casos")
        .select("id, numero_siniestro, estado, dominio, updated_at, perito_calle:usuarios!casos_perito_calle_id_fkey(nombre, apellido), perito_carga:usuarios!casos_perito_carga_id_fkey(nombre, apellido)")
        .in("estado", ["pendiente_coordinacion", "contactado", "pendiente_carga", "pendiente_presupuesto", "licitando_repuestos", "ip_reclamada_perito", "esperando_respuesta_tercero", "ip_cerrada"])
        .order("updated_at", { ascending: true })
        .limit(200); // Fetch enough to find old ones

    const alertasRaw = (demorados || []).map((c: any) => {
        const horasEnEstado = (ahora.getTime() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60);
        let umbral = 0;
        if (c.estado === "pendiente_coordinacion") umbral = 48;
        else if (c.estado === "contactado") umbral = 72;
        else if (c.estado === "pendiente_carga") umbral = 24;
        else if (c.estado === "pendiente_presupuesto") umbral = 120;
        else if (c.estado === "licitando_repuestos") umbral = 48;
        else if (c.estado === "ip_reclamada_perito") umbral = 24;
        else if (c.estado === "esperando_respuesta_tercero") umbral = 168;
        else if (c.estado === "ip_cerrada") umbral = 120;

        const ratio = umbral > 0 ? (horasEnEstado / umbral) : 0;
        return {
            ...c,
            horasEnEstado,
            umbral,
            isDelayed: ratio >= 1,
            isCritical: ratio >= 2
        };
    }).filter((c: any) => c.isDelayed).sort((a: any, b: any) => (b.horasEnEstado / b.umbral) - (a.horasEnEstado / a.umbral));

    const alertas = alertasRaw;

    // ── BLOQUE 2: Contadores por estado ──
    const { data: todosLosCasos } = await supabase
        .from("casos")
        .select("estado")
        .not("estado", "in", '("facturada","inspeccion_anulada")');

    const contadores: Record<string, number> = {};
    (todosLosCasos || []).forEach((c: any) => {
        contadores[c.estado] = (contadores[c.estado] || 0) + 1;
    });
    const totalActivos = Object.values(contadores).reduce((a, b) => a + b, 0);

    // Cerrados y facturados este mes
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
    const { count: cerradosMes } = await supabase.from("casos").select("*", { count: "exact", head: true })
        .eq("estado", "ip_cerrada").gte("fecha_cierre", inicioMes);
    const { count: facturadosMes } = await supabase.from("casos").select("*", { count: "exact", head: true })
        .eq("estado", "facturada").gte("fecha_facturacion", inicioMes);

    // ── BLOQUE 3: Agenda del día y mañana ──
    const hoy = format(ahora, "yyyy-MM-dd");
    const manana = format(addDays(ahora, 1), "yyyy-MM-dd");
    const { data: agendaRaw } = await supabase
        .from("casos")
        .select("id, numero_siniestro, dominio, marca, modelo, tipo_inspeccion, direccion_inspeccion, fecha_inspeccion_programada, perito_calle:usuarios!casos_perito_calle_id_fkey(nombre, apellido)")
        .in("fecha_inspeccion_programada", [hoy, manana])
        .eq("estado", "ip_coordinada")
        .order("fecha_inspeccion_programada");

    // Agrupar por perito
    const agendaPorPerito: Record<string, { perito: string, inspecciones: any[] }> = {};
    (agendaRaw || []).forEach((c: any) => {
        const peritoNombre = c.perito_calle ? `${c.perito_calle.nombre} ${c.perito_calle.apellido}` : "Sin asignar";
        if (!agendaPorPerito[peritoNombre]) agendaPorPerito[peritoNombre] = { perito: peritoNombre, inspecciones: [] };
        agendaPorPerito[peritoNombre].inspecciones.push(c);
    });

    // ── BLOQUE 4: Facturación pendiente ──
    const { data: pendientesFacturar } = await supabase
        .from("casos")
        .select("id, numero_siniestro, dominio, tipo_inspeccion, fecha_cierre, perito_carga:usuarios!casos_perito_carga_id_fkey(nombre, apellido)")
        .eq("estado", "ip_cerrada")
        .order("fecha_cierre", { ascending: true })
        .limit(10);

    // ── BLOQUE 5: Métricas resumen ──
    const { count: ingresadosMes } = await supabase.from("casos").select("*", { count: "exact", head: true })
        .gte("created_at", inicioMes);

    // ── Estado label map ──
    const estadoLabels: Record<string, string> = {
        ip_coordinada: "IP Coordinada",
        pendiente_coordinacion: "Pdte. Coord.",
        contactado: "Contactado",
        pendiente_carga: "Pdte. Carga",
        pendiente_presupuesto: "Pdte. Presup.",
        licitando_repuestos: "Licitando",
        en_consulta_cia: "En Consulta",
        ip_reclamada_perito: "Reclamada",
        esperando_respuesta_tercero: "Esp. 3°",
        ip_cerrada: "IP Cerrada",
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Panel de Control</h1>
                <p className="text-sm text-text-muted">Centro de comando del estudio — {format(ahora, "EEEE dd 'de' MMMM, yyyy", { locale: es })}</p>
            </div>

            {/* ═══ BLOQUE 1: ALERTAS ═══ */}
            {alertas.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-color-danger-soft text-color-danger">
                            <AlertCircle className="h-3.5 w-3.5" />
                        </span>
                        <h2 className="text-[13px] font-bold uppercase tracking-widest text-text-primary font-outfit">
                            Casos Demorados ({alertas.length})
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {alertas.slice(0, 6).map((c: any) => {
                            // Determine severity based on new ratio logic
                            const isCritical = c.isCritical;
                            const borderColor = isCritical ? "border-l-[3px] border-l-color-danger border-y-border border-r-border" : "border-l-[3px] border-l-color-warning border-y-border border-r-border";
                            const bgColor = isCritical ? "bg-color-danger-soft/20" : "bg-color-warning-soft/20";
                            const iconColor = isCritical ? "text-color-danger" : "text-color-warning";

                            return (
                                <Link key={c.id} href={`/casos/${c.id}`}
                                    className={`card-premium p-5 flex flex-col justify-between group ${borderColor} ${bgColor} hover:border-r-border-hover hover:border-y-border-hover transition-all duration-150 block`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-base font-bold text-text-primary font-outfit tracking-tight leading-none group-hover:text-brand-secondary transition-colors">
                                                {c.numero_siniestro}
                                            </p>
                                            <p className="text-sm border-b border-border-subtle pb-2 text-text-muted mt-2 capitalize">
                                                {c.dominio || "S/D"}
                                            </p>
                                        </div>
                                        <span className={`text-[11px] font-mono px-2 py-1 rounded-md bg-black/40 ${iconColor} flex items-center gap-1.5 border border-white/5`}>
                                            <Clock className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(c.updated_at), { addSuffix: false, locale: es })}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-text-primary/80 bg-black/20 px-2 py-1 rounded-md">
                                            {estadoLabels[c.estado] || c.estado}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-text-primary/40 group-hover:text-text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ═══ BLOQUE 2: RESUMEN POR ESTADO ═══ */}
            <div className="space-y-4">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-text-muted font-outfit px-1">Resumen de Operatoria</h2>

                {/* Top Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="card-premium p-5 flex items-center justify-between bg-bg-surface/50">
                        <div>
                            <p className="text-sm text-text-muted font-medium">Total Activos</p>
                            <p className="text-3xl font-bold font-outfit text-text-primary mt-1">{totalActivos}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-color-info-soft flex items-center justify-center text-color-info">
                            <Briefcase className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="card-premium p-5 flex items-center justify-between border-color-success/20 bg-color-success-soft/30 hover:border-color-success/50">
                        <div>
                            <p className="text-sm text-text-muted font-medium">Cerrados (Mes)</p>
                            <p className="text-3xl font-bold font-outfit text-color-success mt-1">{cerradosMes || 0}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-color-success-soft flex items-center justify-center text-color-success">
                            <CalendarCheck2 className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="card-premium p-5 flex items-center justify-between border-brand-primary/20 bg-brand-primary-soft/30 hover:border-brand-primary/50">
                        <div>
                            <p className="text-sm text-text-muted font-medium">Facturados (Mes)</p>
                            <p className="text-3xl font-bold font-outfit text-brand-primary mt-1">{facturadosMes || 0}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-brand-primary-soft flex items-center justify-center text-brand-primary">
                            <DollarSign className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* State Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {Object.entries(estadoLabels).map(([key, label]) => {
                        const styleMap: Record<string, { border: string, text: string, bg: string }> = {
                            ip_coordinada: { border: "border-l-blue-500", text: "text-blue-500", bg: "bg-blue-500/5" },
                            pendiente_coordinacion: { border: "border-l-amber-500", text: "text-amber-500", bg: "bg-amber-500/5" },
                            contactado: { border: "border-l-cyan-500", text: "text-cyan-500", bg: "bg-cyan-500/5" },
                            pendiente_carga: { border: "border-l-orange-500", text: "text-orange-500", bg: "bg-orange-500/5" },
                            pendiente_presupuesto: { border: "border-l-yellow-500", text: "text-yellow-500", bg: "bg-yellow-500/5" },
                            licitando_repuestos: { border: "border-l-violet-500", text: "text-violet-500", bg: "bg-violet-500/5" },
                            en_consulta_cia: { border: "border-l-slate-400", text: "text-slate-400", bg: "bg-slate-400/5" },
                            ip_reclamada_perito: { border: "border-l-rose-500", text: "text-rose-500", bg: "bg-rose-500/5" },
                            esperando_respuesta_tercero: { border: "border-l-teal-500", text: "text-teal-500", bg: "bg-teal-500/5" },
                            ip_cerrada: { border: "border-l-emerald-500", text: "text-emerald-500", bg: "bg-emerald-500/5" },
                            facturada: { border: "border-l-green-500", text: "text-green-500", bg: "bg-green-500/5" },
                            inspeccion_anulada: { border: "border-l-gray-500", text: "text-gray-500", bg: "bg-gray-500/5" },
                        };
                        const styling = styleMap[key] || { border: "border-l-border-subtle", text: "text-text-primary", bg: "bg-bg-secondary" };

                        return (
                            <Link key={key} href={`/casos?estado=${key}`}
                                className={`rounded-xl border border-r-border border-y-border border-l-[3px] ${styling.border} ${styling.bg} p-4 pb-3 transition-all duration-150 hover:-translate-y-[2px] hover:shadow-lg group block`}>
                                <p className={`text-2xl font-bold font-outfit ${styling.text} transition-colors leading-none`}>{contadores[key] || 0}</p>
                                <p className="text-[12px] font-medium text-text-secondary mt-3 group-hover:text-text-primary transition-colors">{label}</p>
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* ═══ BLOQUE 3: AGENDA DEL DÍA ═══ */}
            <div className="space-y-4">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-text-muted font-outfit px-1">Agenda de Inspecciones</h2>
                {Object.keys(agendaPorPerito).length === 0 ? (
                    <div className="card-premium p-8 flex flex-col items-center justify-center text-center">
                        <div className="h-12 w-12 rounded-full bg-border-subtle flex items-center justify-center mb-4 text-text-muted">
                            <CalendarCheck2 className="h-6 w-6" />
                        </div>
                        <p className="text-text-primary font-medium font-outfit">Todo al día</p>
                        <p className="text-sm text-text-muted mt-1">No hay inspecciones programadas para hoy ni mañana.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.values(agendaPorPerito).map((grupo: any) => (
                            <div key={grupo.perito} className="card-premium overflow-hidden flex flex-col">
                                <div className="bg-bg-tertiary/80 px-5 py-4 border-b border-border-subtle flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-xs ring-1 ring-brand-primary/30">
                                            {grupo.perito.charAt(0)}
                                        </div>
                                        <h3 className="text-sm font-semibold text-text-primary font-outfit tracking-wide">{grupo.perito}</h3>
                                    </div>
                                    <span className="text-[11px] font-medium bg-brand-primary/10 border border-brand-primary/20 text-brand-primary px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        {grupo.inspecciones.length} IP
                                    </span>
                                </div>
                                <div className="divide-y divide-border-subtle flex-1 bg-bg-secondary/30">
                                    {grupo.inspecciones.map((ip: any) => (
                                        <div key={ip.id} className="p-4 hover:bg-bg-surface/50 transition-colors group">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0 pr-4">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <Link href={`/casos/${ip.id}`} className="text-sm text-text-primary font-semibold font-outfit tracking-tight hover:text-brand-primary transition-colors">
                                                            {ip.numero_siniestro}
                                                        </Link>
                                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-text-secondary border border-border-default">
                                                            {ip.dominio || "S/D"}
                                                        </span>
                                                    </div>
                                                    <p className="text-[13px] text-text-secondary mb-2 truncate">
                                                        {ip.marca} {ip.modelo}
                                                    </p>
                                                    {ip.direccion_inspeccion && (
                                                        <div className="flex items-start gap-1.5 text-text-muted">
                                                            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-brand-secondary" />
                                                            <p className="text-[12px] leading-relaxed line-clamp-2">{ip.direccion_inspeccion}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${ip.fecha_inspeccion_programada === hoy
                                                        ? "bg-brand-primary text-white shadow-shadow-glow"
                                                        : "bg-bg-tertiary text-text-muted border border-border-default"
                                                        }`}>
                                                        {ip.fecha_inspeccion_programada === hoy ? "HOY" : "MAÑANA"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ═══ BLOQUE 4: FACTURACIÓN PENDIENTE ═══ */}
            <div className="space-y-4">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-text-muted font-outfit px-1">Cola de Facturación</h2>
                {(pendientesFacturar || []).length === 0 ? (
                    <div className="card-premium p-8 flex flex-col items-center justify-center text-center">
                        <div className="h-12 w-12 rounded-full bg-border-subtle flex items-center justify-center mb-4 text-text-muted">
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <p className="text-text-primary font-medium font-outfit">Nada pendiente</p>
                        <p className="text-sm text-text-muted mt-1">Todos los casos cerrados han sido facturados.</p>
                    </div>
                ) : (
                    <div className="card-premium overflow-hidden">
                        <div className="divide-y divide-border-subtle">
                            {pendientesFacturar!.map((c: any) => {
                                const diasCerrado = c.fecha_cierre ? Math.floor((ahora.getTime() - new Date(c.fecha_cierre).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                                const delayColor = diasCerrado > 3 ? "text-color-danger font-medium" : "text-text-muted";

                                return (
                                    <Link key={c.id} href={`/casos/${c.id}`}
                                        className="flex items-center justify-between px-5 py-4 hover:bg-bg-surface/50 transition-colors group">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <p className="text-sm text-text-primary font-semibold font-outfit tracking-tight group-hover:text-brand-primary transition-colors">{c.numero_siniestro}</p>
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-text-secondary border border-border-default">
                                                    {c.dominio || "S/D"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className={delayColor}>
                                                    Cerrado hace {diasCerrado} día{diasCerrado !== 1 ? 's' : ''}
                                                </span>
                                                <span className="text-text-disabled">•</span>
                                                <span className="text-text-muted">{c.perito_carga ? `${c.perito_carga.nombre} ${c.perito_carga.apellido}` : "Sin cargar"}</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-primary group-hover:translate-x-1 transition-all" />
                                    </Link>
                                )
                            })}
                        </div>
                        <div className="bg-brand-primary-soft/10 border-t border-border-subtle px-5 py-3 text-xs text-brand-primary font-medium flex justify-between items-center">
                            <span>{pendientesFacturar!.length} caso{pendientesFacturar!.length > 1 ? "s" : ""} a facturar</span>
                            <Link href="/facturacion" className="hover:underline underline-offset-2">Ir a liquidación →</Link>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ BLOQUE 5: MÉTRICAS ═══ */}
            <div className="space-y-4">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-text-muted font-outfit px-1">Métricas del Mes</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card-premium p-5 flex flex-col justify-between group">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">Ingresados</p>
                            <TrendingUp className="h-4 w-4 text-color-info mt-0.5" />
                        </div>
                        <p className="text-3xl font-bold font-outfit text-text-primary">{ingresadosMes || 0}</p>
                    </div>
                    <div className="card-premium p-5 flex flex-col justify-between group border-color-success/20 bg-color-success-soft/30">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">Cerrados</p>
                            <CalendarCheck2 className="h-4 w-4 text-color-success mt-0.5" />
                        </div>
                        <p className="text-3xl font-bold font-outfit text-color-success">{cerradosMes || 0}</p>
                    </div>
                    <div className="card-premium p-5 flex flex-col justify-between group border-brand-primary/20 bg-brand-primary-soft/30">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">Facturados</p>
                            <DollarSign className="h-4 w-4 text-brand-primary mt-0.5" />
                        </div>
                        <p className="text-3xl font-bold font-outfit text-brand-primary">{facturadosMes || 0}</p>
                    </div>
                    <Link href="/reportes" className="card-premium p-5 flex flex-col justify-between group bg-bg-surface hover:bg-brand-primary/10 hover:border-brand-primary/50 transition-all duration-300">
                        <div className="flex flex-col h-full justify-between">
                            <p className="text-sm font-medium text-brand-primary font-outfit tracking-wide">Analítica Profunda</p>
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">Ver todos los reportes</p>
                                <ChevronRight className="h-4 w-4 text-brand-primary group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}

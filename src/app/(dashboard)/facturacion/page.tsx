export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DollarSign, FileCheck, Clock, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { ColaFacturacion } from "@/components/facturacion/ColaFacturacion";

export default async function FacturacionDashboard() {
    const supabase = await createClient();
    const { getUsuarioActual } = await import("@/lib/auth");
    const usuario = await getUsuarioActual();
    if (!usuario.roles?.includes("admin") && !["admin", "carga", "calle"].includes(usuario.rol)) {
        const { redirect } = await import("next/navigation");
        redirect("/dashboard");
    }
    const isAdmin = usuario.roles?.includes("admin") || usuario.rol === "admin";

    // Cola: casos en ip_cerrada (listos para facturar) o filtrado para el perito
    let colaFacturarQuery = supabase
        .from("casos")
        .select(`
            id, numero_siniestro, dominio, marca, modelo, tipo_inspeccion,
            fecha_cierre, fecha_derivacion,
            perito_calle:usuarios!casos_perito_calle_id_fkey(nombre, apellido),
            perito_carga:usuarios!casos_perito_carga_id_fkey(nombre, apellido),
            compania:companias(nombre)
        `)
        .eq("estado", "ip_cerrada");

    if (!isAdmin) {
        colaFacturarQuery.or(`perito_carga_id.eq.${usuario.id},perito_calle_id.eq.${usuario.id}`);
    }

    const { data: colaFacturar } = await colaFacturarQuery.order("fecha_cierre", { ascending: true });

    // Historial: últimas facturadas
    let ultimasFacturadasQuery = supabase
        .from("casos")
        .select(`
            id, numero_siniestro, dominio, fecha_facturacion, numero_factura,
            monto_facturado_estudio, monto_pagado_perito_calle, monto_pagado_perito_carga
        `)
        .eq("estado", "facturada");

    if (!isAdmin) {
        ultimasFacturadasQuery.or(`perito_carga_id.eq.${usuario.id},perito_calle_id.eq.${usuario.id}`);
    }

    const { data: ultimasFacturadas } = await ultimasFacturadasQuery
        .order("fecha_facturacion", { ascending: false })
        .limit(20);

    // KPIs
    const pendientes = (colaFacturar || []).length;
    const facturadas = (ultimasFacturadas || []).length;
    const totalFacturado = (ultimasFacturadas || []).reduce((sum, c) => sum + (c.monto_facturado_estudio || 0), 0);
    const totalPagado = (ultimasFacturadas || []).reduce((sum, c) =>
        sum + (c.monto_pagado_perito_calle || 0) + (c.monto_pagado_perito_carga || 0), 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-brand-secondary" />
                    Facturación
                </h1>
                <p className="text-text-muted mt-1 text-sm">
                    Tracking de facturación. CLARITY NO genera facturas — solo trackea qué se facturó.
                </p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-bg-secondary border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                        <Clock className="w-3.5 h-3.5" /> Pendientes
                    </div>
                    <p className="text-2xl font-bold text-color-warning">{pendientes}</p>
                </div>
                <div className="bg-bg-secondary border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                        <FileCheck className="w-3.5 h-3.5" /> Facturadas (últ. 20)
                    </div>
                    <p className="text-2xl font-bold text-color-success">{facturadas}</p>
                </div>
                <div className="bg-bg-secondary border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                        <DollarSign className="w-3.5 h-3.5" /> Total Facturado
                    </div>
                    <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalFacturado)}</p>
                </div>
                {isAdmin && (
                    <div className="bg-bg-secondary border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                            <TrendingUp className="w-3.5 h-3.5" /> Margen
                        </div>
                        <p className="text-2xl font-bold text-color-success">{formatCurrency(totalFacturado - totalPagado)}</p>
                    </div>
                )}
            </div>

            {/* Cola de Facturación */}
            <ColaFacturacion casos={colaFacturar || []} />
        </div>
    );
}

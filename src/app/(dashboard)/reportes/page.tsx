export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { ReportesFiltros } from "@/components/reportes/ReportesFiltros";

export default async function ReportesDashboard() {
    const supabase = await createClient();
    const { getUsuarioActual } = await import("@/lib/auth");
    const usuario = await getUsuarioActual();
    if (usuario.rol !== "admin") {
        const { redirect } = await import("next/navigation");
        redirect("/dashboard");
    }

    // Todos los casos con campos necesarios (incluye fecha_inspeccion_real para timing de perito calle)
    const { data: todosLosCasos } = await supabase
        .from("casos")
        .select("id, estado, created_at, fecha_derivacion, fecha_inspeccion_real, fecha_cierre, monto_facturado_estudio, monto_pagado_perito_calle, monto_pagado_perito_carga, perito_calle_id, perito_carga_id, tipo_inspeccion, facturado");

    // Historial de Estados para métricas de tiempo
    const { data: historialEstados } = await supabase
        .from("historial_estados")
        .select("caso_id, estado_nuevo, created_at")
        .order("created_at", { ascending: true });

    // Peritos activos (captura legacy rol column + new roles array)
    const { data: peritosData } = await supabase
        .from("usuarios")
        .select("id, nombre, apellido, rol, roles")
        .or('rol.eq.calle,rol.eq.carga,roles.cs.{"calle"},roles.cs.{"carga"}')
        .eq("activo", true);

    // Gasto Fijo Administrativo (Configuración)
    const { data: config } = await supabase
        .from("configuracion")
        .select("valor")
        .eq("clave", "gasto_fijo_administrativo")
        .single();

    const gastoFijoData = parseFloat(config?.valor || "0");

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-brand-secondary" />
                    Reportes
                </h1>
                <p className="text-text-muted mt-1 text-sm">Dashboard ejecutivo con filtros avanzados.</p>
            </div>

            <ReportesFiltros
                casos={todosLosCasos || []}
                peritos={peritosData || []}
                historial={historialEstados || []}
                gastoFijo={gastoFijoData}
            />
        </div>
    );
}

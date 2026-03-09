export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Map, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { ResumenKm } from "@/components/kilometraje/ResumenKm";
import { formatCurrency } from "@/lib/utils/formatters";

export default async function KilometrajeDashboard() {
    const supabase = await createClient();
    const { getUsuarioActual } = await import("@/lib/auth");
    const userData = await getUsuarioActual();

    // Admin ve todos los peritos, calle ve solo el suyo
    const isAdmin = userData.rol === "admin";

    // Fetch peritos de calle para el selector (admin)
    let peritos: any[] = [];
    if (isAdmin) {
        const { data } = await supabase
            .from("usuarios")
            .select("id, nombre, apellido, direccion_base")
            .eq("rol", "calle")
            .eq("activo", true);
        peritos = data || [];
    }

    // Mes actual por defecto
    const now = new Date();
    const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Fetch registros del mes del usuario o de todos (admin)
    let query = supabase
        .from("kilometraje_diario")
        .select("*")
        .gte("fecha", `${mesActual}-01`)
        .lte("fecha", `${mesActual}-31`)
        .order("fecha", { ascending: false });

    if (!isAdmin) {
        query = query.eq("perito_id", userData.id);
    }

    const { data: registros } = await query;

    // KPIs
    const totalKm = (registros || []).reduce((sum, r) => sum + (r.km_total || 0), 0);
    const totalEstudio = (registros || []).reduce((sum, r) => sum + (r.monto_total_estudio || 0), 0);
    const totalPerito = (registros || []).reduce((sum, r) => sum + (r.monto_total_perito || 0), 0);
    const totalDias = (registros || []).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <Map className="w-6 h-6 text-brand-secondary" />
                        Kilometraje
                    </h1>
                    <p className="text-text-muted mt-1 text-sm">
                        Registro de rutas diarias con doble precio (estudio/perito). Mes: {mesActual}
                    </p>
                </div>
            </div>

            {/* KPIs del Mes */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-bg-secondary border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                        <Calendar className="w-3.5 h-3.5" /> Días registrados
                    </div>
                    <p className="text-2xl font-bold text-text-primary">{totalDias}</p>
                </div>
                <div className="bg-bg-secondary border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                        <Map className="w-3.5 h-3.5" /> KM Total
                    </div>
                    <p className="text-2xl font-bold text-brand-secondary">{totalKm.toFixed(1)} km</p>
                </div>
                <div className="bg-bg-secondary border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                        <DollarSign className="w-3.5 h-3.5" /> Cobra el Estudio
                    </div>
                    <p className="text-2xl font-bold text-color-success">{formatCurrency(totalEstudio)}</p>
                </div>
                <div className="bg-bg-secondary border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                        <TrendingUp className="w-3.5 h-3.5" /> Margen
                    </div>
                    <p className="text-2xl font-bold text-color-warning">{formatCurrency(totalEstudio - totalPerito)}</p>
                </div>
            </div>

            {/* Tabla de registros */}
            <ResumenKm registros={registros || []} isAdmin={isAdmin} />
        </div>
    );
}

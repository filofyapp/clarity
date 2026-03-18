export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DollarSign, ArrowLeft } from "lucide-react";
import { PreciosEditor } from "@/components/configuracion/PreciosEditor";
import { GastoFijoEditor } from "@/components/configuracion/GastoFijoEditor";
import { ValoresSancorEditor } from "@/components/configuracion/ValoresSancorEditor";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PreciosPage() {
    const supabase = await createClient();
    const { getUsuarioActual } = await import("@/lib/auth");
    const usuario = await getUsuarioActual();
    if (usuario.rol !== "admin") {
        const { redirect } = await import("next/navigation");
        redirect("/dashboard");
    }

    const { data: precios } = await supabase
        .from("precios")
        .select("*")
        .order("tipo")
        .order("concepto");

    // Fetch gasto_fijo_administrativo
    const { data: configFix } = await supabase
        .from("configuracion")
        .select("valor")
        .eq("clave", "gasto_fijo_administrativo")
        .single();

    const gastoFijoValor = configFix?.valor ? parseFloat(configFix.valor) : 0;

    // Valores Sancor (mano_obra type)
    const valoresSancor = (precios || [])
        .filter((p: any) => p.tipo === "mano_obra" && ["dia_chapa", "pano_pintura", "hora_mecanica"].includes(p.concepto))
        .map((p: any) => ({ id: p.id, concepto: p.concepto, valor_estudio: p.valor_estudio, updated_at: p.updated_at }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link href="/configuracion">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-text-primary hover:bg-bg-elevated shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-brand-secondary" />
                        Precios y Honorarios
                    </h1>
                    <p className="text-text-muted mt-1 text-sm">
                        Precios dobles: lo que cobra el estudio a Sancor vs lo que paga al perito.
                    </p>
                </div>
            </div>

            <ValoresSancorEditor valores={valoresSancor} />

            <PreciosEditor precios={precios || []} />

            <GastoFijoEditor valorInicial={gastoFijoValor} />
        </div>
    );
}


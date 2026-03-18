export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InspeccionCampoWizard } from "@/components/inspeccion-campo/InspeccionCampoWizard";

interface PageProps {
    params: Promise<{ casoId: string }>;
}

export default async function InspeccionCampoPage({ params }: PageProps) {
    const { casoId } = await params;
    const supabase = await createClient();
    const { getUsuarioActual } = await import("@/lib/auth");
    const usuario = await getUsuarioActual();

    // Validate caso exists and belongs to this perito
    const { data: caso, error } = await supabase
        .from("casos")
        .select(`
            id, numero_siniestro, dominio, marca, modelo, tipo_inspeccion,
            nombre_asegurado, direccion_inspeccion, localidad, estado,
            perito_calle_id,
            compania:companias(codigo)
        `)
        .eq("id", casoId)
        .single();

    if (error || !caso) {
        redirect("/mi-agenda");
    }

    // Only perito de calle assigned or admin
    if (caso.perito_calle_id !== usuario.id && usuario.rol !== "admin") {
        redirect("/mi-agenda");
    }

    // Only ip_coordinada
    if (caso.estado !== "ip_coordinada") {
        redirect(`/casos/${casoId}`);
    }

    // Fetch existing photos count
    const { count: fotosCount } = await supabase
        .from("fotos_inspeccion")
        .select("*", { count: "exact", head: true })
        .eq("caso_id", casoId);

    // Fetch mano de obra reference values
    const companiaCodigo = (caso.compania as any)?.codigo || "SANCOR";
    const { data: preciosMO } = await supabase
        .from("precios")
        .select("concepto, valor_estudio")
        .eq("tipo", "mano_obra")
        .in("concepto", ["dia_chapa", "pano_pintura", "hora_mecanica"]);

    const valoresRef: Record<string, number> = {};
    (preciosMO || []).forEach((p: any) => {
        valoresRef[p.concepto] = p.valor_estudio;
    });

    return (
        <InspeccionCampoWizard
            casoId={caso.id}
            siniestro={caso.numero_siniestro || ""}
            vehiculo={`${caso.marca || ""} ${caso.modelo || ""}`.trim()}
            dominio={caso.dominio || ""}
            tipoInspeccion={caso.tipo_inspeccion || ""}
            asegurado={caso.nombre_asegurado || ""}
            direccion={caso.direccion_inspeccion || ""}
            localidad={caso.localidad || ""}
            fotosYaSubidas={fotosCount || 0}
            valoresRef={valoresRef}
            peritoId={usuario.id}
        />
    );
}

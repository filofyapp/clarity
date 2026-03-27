export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InspeccionCampoWizard } from "@/components/inspeccion-campo/InspeccionCampoWizard";

interface PageProps {
    params: Promise<{ casoId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function InspeccionCampoPage({ params, searchParams }: PageProps) {
    const { casoId } = await params;
    const sp = await searchParams;
    const isEditMode = sp.editar === "1";

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

    // ═══ GUARDRAIL 4: Server-side auth ═══
    // Only perito de calle assigned or admin can access
    if (caso.perito_calle_id !== usuario.id && usuario.rol !== "admin") {
        redirect("/mi-agenda");
    }

    // State guard: normal mode requires ip_coordinada; edit mode allows post-inspection states
    if (isEditMode) {
        // Edit mode — caso must have a completed inspection (NOT ip_coordinada)
        if (caso.estado === "ip_coordinada") {
            redirect(`/inspeccion-campo/${casoId}`); // redirect to normal wizard
        }
    } else {
        // Normal mode — only ip_coordinada
        if (caso.estado !== "ip_coordinada") {
            redirect(`/casos/${casoId}`);
        }
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

    // ═══ EDIT MODE: Fetch existing informe data from DB ═══
    let editData = undefined;
    if (isEditMode) {
        const { data: informe } = await supabase
            .from("informe_inspeccion_campo")
            .select("mano_de_obra, piezas_cambiar, piezas_reparar, piezas_pintar, observaciones, audio_url")
            .eq("caso_id", casoId)
            .single();

        if (informe) {
            // Map DB mano_de_obra JSONB to ManoObraRow format
            const moFromDB = (informe.mano_de_obra as any[] || []).map((r: any, i: number) => ({
                id: r.concepto?.toLowerCase().replace(/\s/g, "_") || `mo_${i}`,
                concepto: r.concepto || "",
                valor: r.valor || 0,
                cantidad: r.cantidad || 0,
                unidad: r.unidad || "unidades",
                custom: !["Chapa", "Pintura", "Mecánica"].includes(r.concepto),
            }));

            editData = {
                manoDeObra: moFromDB,
                piezasCambiar: informe.piezas_cambiar || "",
                piezasReparar: informe.piezas_reparar || "",
                piezasPintar: informe.piezas_pintar || "",
                observaciones: informe.observaciones || "",
                audioUrl: informe.audio_url || null,
            };
        } else {
            // No informe found — can't edit, redirect to case
            redirect(`/casos/${casoId}`);
        }
    }

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
            isEditMode={isEditMode}
            editData={editData}
        />
    );
}

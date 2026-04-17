import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import {
  CasoAuditoria,
  HistorialEstadoEntry,
  InformeAuditoriaDatos,
  calcularDatosAuditoriaPeriodo,
  detectarPendientesPresupuesto,
  generarTextoWhatsApp,
} from "@/lib/auditoria-engine";

/**
 * Cron endpoint para generación automática del informe de auditoría.
 * Se ejecuta a las 18:00 Argentina (21:00 UTC), lunes a viernes.
 * Protegido con CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split("T")[0];
    const mes = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();

    console.log(`[Cron Auditoría] Generando informe para ${hoyStr}...`);

    // 1. Peritos de calle activos
    const { data: peritosRaw } = await supabase
      .from("usuarios")
      .select("id, nombre, apellido, roles, rol")
      .eq("activo", true);

    const peritosCalle = (peritosRaw || []).filter((p: any) => {
      const roles = p.roles || [p.rol];
      return roles.includes("calle");
    });

    // 2. Casos con fecha_inspeccion_programada = hoy
    const { data: casosHoy } = await supabase
      .from("casos")
      .select("id, numero_siniestro, estado, fecha_inspeccion_programada, perito_calle_id")
      .eq("fecha_inspeccion_programada", hoyStr)
      .not("perito_calle_id", "is", null);

    if (!casosHoy || casosHoy.length === 0) {
      console.log("[Cron Auditoría] Sin inspecciones programadas para hoy. No se genera informe.");
      return NextResponse.json({ message: "Sin inspecciones para hoy", generado: false });
    }

    const casoIds = casosHoy.map((c: any) => c.id);

    // 3. Informe campo (presencial)
    const { data: informesCampo } = await supabase
      .from("informe_inspeccion_campo")
      .select("caso_id")
      .in("caso_id", casoIds);
    const informesCampoSet = new Set((informesCampo || []).map((i: any) => i.caso_id));

    // 4. Fotos (remota)
    const { data: fotosExisten } = await supabase
      .from("fotos_inspeccion")
      .select("caso_id")
      .in("caso_id", casoIds);
    const fotosSet = new Set((fotosExisten || []).map((f: any) => f.caso_id));

    // 5. Todos los casos en pdte presupuesto (globales)
    const { data: casosPPGlobal } = await supabase
      .from("casos")
      .select("id, numero_siniestro, estado, fecha_inspeccion_programada, perito_calle_id")
      .eq("estado", "pendiente_presupuesto")
      .not("perito_calle_id", "is", null);

    // 6. Historial estados
    const allCasoIds = [...new Set([...casoIds, ...(casosPPGlobal || []).map((c: any) => c.id)])];
    let historial: HistorialEstadoEntry[] = [];
    if (allCasoIds.length > 0) {
      const { data: h } = await supabase
        .from("historial_estados")
        .select("caso_id, estado_nuevo, created_at")
        .in("caso_id", allCasoIds)
        .eq("estado_nuevo", "pendiente_presupuesto")
        .order("created_at", { ascending: false });
      historial = (h || []) as HistorialEstadoEntry[];
    }

    // 7. Score mensual: todos los casos del mes
    const primerDiaMes = `${anio}-${String(mes).padStart(2, "0")}-01`;
    const ultimoDiaMes = new Date(anio, mes, 0).toISOString().split("T")[0];

    const { data: casosMes } = await supabase
      .from("casos")
      .select("id, numero_siniestro, estado, fecha_inspeccion_programada, perito_calle_id")
      .gte("fecha_inspeccion_programada", primerDiaMes)
      .lte("fecha_inspeccion_programada", ultimoDiaMes + "T23:59:59")
      .not("perito_calle_id", "is", null);

    const casosMesIds = (casosMes || []).map((c: any) => c.id);
    let informesCampoMesSet = new Set<string>();
    let fotosMesSet = new Set<string>();
    if (casosMesIds.length > 0) {
      const { data: icm } = await supabase.from("informe_inspeccion_campo").select("caso_id").in("caso_id", casosMesIds);
      informesCampoMesSet = new Set((icm || []).map((i: any) => i.caso_id));
      const { data: fm } = await supabase.from("fotos_inspeccion").select("caso_id").in("caso_id", casosMesIds);
      fotosMesSet = new Set((fm || []).map((f: any) => f.caso_id));
    }

    const casosMesArr: CasoAuditoria[] = (casosMes || []).map((c: any) => ({
      id: c.id,
      numero_siniestro: c.numero_siniestro,
      estado: c.estado,
      fecha_inspeccion_programada: c.fecha_inspeccion_programada,
      perito_calle_id: c.perito_calle_id,
      tiene_informe_campo: informesCampoMesSet.has(c.id),
      tiene_fotos: fotosMesSet.has(c.id),
    }));

    // Calcular resumen
    const peritosResumenMes = calcularDatosAuditoriaPeriodo(casosMesArr, historial, peritosCalle as any[]);

    // Agregar pendientes globales
    const allCasos: CasoAuditoria[] = [...casosMesArr];
    for (const cpp of (casosPPGlobal || [])) {
      if (!allCasos.find(c => c.id === cpp.id)) {
        allCasos.push({
          id: cpp.id,
          numero_siniestro: cpp.numero_siniestro,
          estado: cpp.estado,
          fecha_inspeccion_programada: cpp.fecha_inspeccion_programada,
          perito_calle_id: cpp.perito_calle_id,
          tiene_informe_campo: false,
          tiene_fotos: false,
        });
      }
    }

    for (const pr of peritosResumenMes) {
      const ppGlobal = detectarPendientesPresupuesto(
        allCasos.filter(c => c.perito_calle_id === pr.perito_id),
        historial
      );
      for (const pp of ppGlobal) {
        if (!pr.pendientes_presupuesto.find(e => e.caso_id === pp.caso_id)) {
          pr.pendientes_presupuesto.push(pp);
        }
      }
    }

    // Construir datos informe
    const totalPres = peritosResumenMes.reduce((s, p) => s + p.presenciales, 0);
    const totalRem = peritosResumenMes.reduce((s, p) => s + p.remotas, 0);
    const totalDesvios = peritosResumenMes.reduce((s, p) =>
      s + p.desvios.filter(d => d.fecha_inspeccion_programada === hoyStr).length, 0);
    const totalPP = peritosResumenMes.reduce((s, p) => s + p.pendientes_presupuesto.length, 0);

    const datosInforme: InformeAuditoriaDatos = {
      fecha: hoyStr,
      peritos: peritosResumenMes,
      total_inspecciones_dia: casosHoy.length,
      total_presenciales: totalPres,
      total_remotas: totalRem,
      total_desvios: totalDesvios,
      total_pendientes_presupuesto: totalPP,
    };

    const textoWhatsApp = generarTextoWhatsApp(datosInforme);

    // 8. Guardar informe
    const { error: insertError } = await supabase.from("informes_auditoria").insert({
      fecha: hoyStr,
      contenido_whatsapp: textoWhatsApp,
      datos_json: datosInforme as any,
    });

    if (insertError) {
      console.error("[Cron Auditoría] Error guardando informe:", insertError);
    }

    // 9. Upsert scores mensuales
    for (const perito of peritosResumenMes) {
      const { error: upsertError } = await supabase
        .from("scores_perito")
        .upsert({
          perito_id: perito.perito_id,
          mes,
          anio,
          score: perito.score,
          casos_totales: perito.casos_totales,
          casos_cumplidos: perito.casos_cumplidos,
          desvios: perito.desvios.length,
          datos_detalle: {
            tasa_cumplimiento: perito.tasa_cumplimiento,
            penalidad_desvios: perito.penalidad_desvios,
            penalidad_presupuesto: perito.penalidad_presupuesto,
            presenciales: perito.presenciales,
            remotas: perito.remotas,
          } as any,
          updated_at: new Date().toISOString(),
        }, { onConflict: "perito_id,mes,anio" });

      if (upsertError) {
        console.error(`[Cron Auditoría] Error upsert score perito ${perito.perito_nombre}:`, upsertError);
      }
    }

    console.log(`[Cron Auditoría] Informe generado. ${peritosResumenMes.length} peritos procesados.`);

    return NextResponse.json({
      message: "Informe generado",
      generado: true,
      fecha: hoyStr,
      peritos_procesados: peritosResumenMes.length,
      inspecciones_dia: casosHoy.length,
    });

  } catch (e: any) {
    console.error("[Cron Auditoría] Uncaught exception:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

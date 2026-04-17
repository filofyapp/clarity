"use server";

import { createClient } from "@/lib/supabase/server";
import {
  CasoAuditoria,
  HistorialEstadoEntry,
  InformeAuditoriaDatos,
  PeritoResumen,
  UmbralesScore,
  UMBRALES_SCORE_DEFAULT,
  calcularDatosAuditoriaPeriodo,
  calcularScore,
  detectarDesvios,
  detectarPendientesPresupuesto,
  getFechaCorteStr,
  generarTextoWhatsApp,
} from "@/lib/auditoria-engine";
import { revalidatePath } from "next/cache";

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

async function verificarAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("rol, roles")
    .eq("id", user.id)
    .single();

  if (!usuario) throw new Error("Usuario no encontrado");

  const roles = usuario.roles || [usuario.rol];
  if (!roles.includes("admin")) throw new Error("Solo admin puede acceder a auditoría");

  return { supabase, userId: user.id };
}

// ═══════════════════════════════════════════
// FETCH DATOS DE AUDITORÍA
// ═══════════════════════════════════════════

export async function getDatosAuditoria(mes: number, anio: number) {
  const { supabase } = await verificarAdmin();

  // Fecha de corte (18:00 Argentina)
  const fechaCorte = getFechaCorteStr();

  // Rango del mes
  const primerDia = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const ultimoDia = new Date(anio, mes, 0).toISOString().split('T')[0];

  // 1. Peritos de calle activos
  const { data: peritosRaw } = await supabase
    .from("usuarios")
    .select("id, nombre, apellido, roles, rol")
    .eq("activo", true)
    .order("nombre");

  const peritosCalle = (peritosRaw || []).filter(p => {
    const roles = p.roles || [p.rol];
    return roles.includes("calle");
  });

  // 2. Casos del período
  const { data: casosRaw } = await supabase
    .from("casos")
    .select(`
      id,
      numero_siniestro,
      estado,
      fecha_inspeccion_programada,
      fecha_inspeccion_real,
      perito_calle_id,
      tipo_inspeccion
    `)
    .gte("fecha_inspeccion_programada", primerDia)
    .lte("fecha_inspeccion_programada", ultimoDia + "T23:59:59")
    .not("perito_calle_id", "is", null);

  if (!casosRaw || casosRaw.length === 0) {
    return { peritos: [], casosDetalle: [], totalCasos: 0 };
  }

  const casoIds = casosRaw.map(c => c.id);

  // 3. Informe campo (presencial)
  const { data: informesCampo } = await supabase
    .from("informe_inspeccion_campo")
    .select("caso_id")
    .in("caso_id", casoIds);
  const informesCampoSet = new Set((informesCampo || []).map(i => i.caso_id));

  // 4. Fotos (remota)
  const { data: fotosExisten } = await supabase
    .from("fotos_inspeccion")
    .select("caso_id")
    .in("caso_id", casoIds);
  const fotosSet = new Set((fotosExisten || []).map(f => f.caso_id));

  // 5. Historial para pendientes de presupuesto
  const { data: historialRaw } = await supabase
    .from("historial_estados")
    .select("caso_id, estado_nuevo, created_at")
    .in("caso_id", casoIds)
    .eq("estado_nuevo", "pendiente_presupuesto")
    .order("created_at", { ascending: false });

  // 6. Historial para desvíos resueltos (transiciones a post-inspección)
  const { data: historialPostInsp } = await supabase
    .from("historial_estados")
    .select("caso_id, estado_nuevo, created_at")
    .in("caso_id", casoIds)
    .in("estado_nuevo", [
      'pendiente_carga', 'pendiente_presupuesto', 'licitando_repuestos',
      'ip_cerrada', 'facturada', 'inspeccion_anulada', 'en_consulta_cia',
      'ip_reclamada_perito', 'esperando_respuesta_tercero'
    ])
    .order("created_at", { ascending: true });

  // 7. Casos en pdte presupuesto global
  const { data: casosPPGlobal } = await supabase
    .from("casos")
    .select("id, numero_siniestro, estado, fecha_inspeccion_programada, perito_calle_id")
    .eq("estado", "pendiente_presupuesto")
    .not("perito_calle_id", "is", null);

  const casosPPIds = (casosPPGlobal || []).map(c => c.id);
  let historialPPGlobal: HistorialEstadoEntry[] = [];
  if (casosPPIds.length > 0) {
    const { data: hPP } = await supabase
      .from("historial_estados")
      .select("caso_id, estado_nuevo, created_at")
      .in("caso_id", casosPPIds)
      .eq("estado_nuevo", "pendiente_presupuesto")
      .order("created_at", { ascending: false });
    historialPPGlobal = (hPP || []) as HistorialEstadoEntry[];
  }

  // Construir CasoAuditoria[]
  const peritoMap = new Map(peritosCalle.map(p => [p.id, p]));

  const casos: CasoAuditoria[] = casosRaw.map(c => ({
    id: c.id,
    numero_siniestro: c.numero_siniestro,
    estado: c.estado,
    fecha_inspeccion_programada: c.fecha_inspeccion_programada,
    fecha_inspeccion_real: c.fecha_inspeccion_real,
    perito_calle_id: c.perito_calle_id,
    perito_nombre: peritoMap.get(c.perito_calle_id!)?.nombre,
    perito_apellido: peritoMap.get(c.perito_calle_id!)?.apellido,
    tipo_inspeccion: c.tipo_inspeccion,
    tiene_informe_campo: informesCampoSet.has(c.id),
    tiene_fotos: fotosSet.has(c.id),
  }));

  const historial: HistorialEstadoEntry[] = [
    ...(historialRaw || []) as HistorialEstadoEntry[],
    ...historialPPGlobal,
  ];

  const historialPostInspeccion = (historialPostInsp || []) as HistorialEstadoEntry[];

  // Incluir los casos pdte presupuesto globales
  const casosConPPGlobal: CasoAuditoria[] = [...casos];
  for (const cpp of (casosPPGlobal || [])) {
    if (!casosConPPGlobal.find(c => c.id === cpp.id)) {
      casosConPPGlobal.push({
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

  // Calcular resumen por perito (con fechaCorte e historial post-inspección)
  const peritosResumen = calcularDatosAuditoriaPeriodo(
    casos, historial, peritosCalle, fechaCorte, historialPostInspeccion
  );

  // Agregar pendientes presupuesto globales
  for (const pr of peritosResumen) {
    const ppGlobal = detectarPendientesPresupuesto(
      casosConPPGlobal.filter(c => c.perito_calle_id === pr.perito_id),
      historial
    );
    for (const pp of ppGlobal) {
      if (!pr.pendientes_presupuesto.find(existing => existing.caso_id === pp.caso_id)) {
        pr.pendientes_presupuesto.push(pp);
      }
    }
  }

  // Detalle para tabla
  const allDesvios = peritosResumen.flatMap(p => [...p.desvios, ...p.desvios_resueltos]);
  const casosDetalle = casos.map(c => {
    const perito = peritoMap.get(c.perito_calle_id!);
    const desvio = allDesvios.find(d => d.caso_id === c.id);
    const pp = peritosResumen.flatMap(p => p.pendientes_presupuesto).find(p => p.caso_id === c.id);

    return {
      ...c,
      perito_nombre_completo: perito ? `${perito.nombre} ${perito.apellido || ''}`.trim() : 'Sin asignar',
      tipo_inspeccion_real: c.tipo_inspeccion === 'ausente' ? 'Presencial' : (c.tiene_informe_campo ? 'Presencial' : (c.tiene_fotos ? 'Remota' : '—')),
      desvio_info: desvio ? `⚠️ ${desvio.dias_demora} días ${ESTADOS_POST_INSPECCION_SET.has(c.estado) ? '(resuelto)' : 'sin inspeccionar'}` : null,
      pp_info: pp ? `⏱ ${pp.dias_en_estado} días en pdte. presup.` : null,
      dias_en_estado: desvio?.dias_demora || pp?.dias_en_estado || 0,
    };
  });

  return {
    peritos: peritosResumen,
    casosDetalle,
    totalCasos: casos.length,
  };
}

const ESTADOS_POST_INSPECCION_SET = new Set([
  'pendiente_carga', 'pendiente_presupuesto', 'licitando_repuestos',
  'ip_cerrada', 'facturada', 'inspeccion_anulada', 'en_consulta_cia',
  'ip_reclamada_perito', 'esperando_respuesta_tercero'
]);

// ═══════════════════════════════════════════
// GENERAR INFORME DEL DÍA
// ═══════════════════════════════════════════

export async function generarInformeDelDia() {
  const { supabase } = await verificarAdmin();
  const hoy = new Date();
  const hoyStr = hoy.toISOString().split('T')[0];
  const mes = hoy.getMonth() + 1;
  const anio = hoy.getFullYear();

  // Peritos de calle activos
  const { data: peritosRaw } = await supabase
    .from("usuarios")
    .select("id, nombre, apellido, roles, rol")
    .eq("activo", true);

  const peritosCalle = (peritosRaw || []).filter(p => {
    const roles = p.roles || [p.rol];
    return roles.includes("calle");
  });

  // Casos con fecha_inspeccion_programada = hoy
  const { data: casosHoy } = await supabase
    .from("casos")
    .select("id, numero_siniestro, estado, fecha_inspeccion_programada, fecha_inspeccion_real, perito_calle_id, tipo_inspeccion")
    .eq("fecha_inspeccion_programada", hoyStr)
    .not("perito_calle_id", "is", null);

  const casoIds = (casosHoy || []).map(c => c.id);

  // Informe campo (presencial)
  let informesCampoSet = new Set<string>();
  if (casoIds.length > 0) {
    const { data: ic } = await supabase.from("informe_inspeccion_campo").select("caso_id").in("caso_id", casoIds);
    informesCampoSet = new Set((ic || []).map(i => i.caso_id));
  }

  // Fotos (remota)
  let fotosSet = new Set<string>();
  if (casoIds.length > 0) {
    const { data: fotos } = await supabase.from("fotos_inspeccion").select("caso_id").in("caso_id", casoIds);
    fotosSet = new Set((fotos || []).map(f => f.caso_id));
  }

  // Todos los casos en pdte presupuesto (global, no solo hoy)
  const { data: casosPPGlobal } = await supabase
    .from("casos")
    .select("id, numero_siniestro, estado, fecha_inspeccion_programada, perito_calle_id")
    .eq("estado", "pendiente_presupuesto")
    .not("perito_calle_id", "is", null);

  // Historial para pdte presupuesto
  const allCasoIdsForHistorial = [...new Set([...casoIds, ...(casosPPGlobal || []).map(c => c.id)])];
  let historial: HistorialEstadoEntry[] = [];
  if (allCasoIdsForHistorial.length > 0) {
    const { data: h } = await supabase
      .from("historial_estados")
      .select("caso_id, estado_nuevo, created_at")
      .in("caso_id", allCasoIdsForHistorial)
      .eq("estado_nuevo", "pendiente_presupuesto")
      .order("created_at", { ascending: false });
    historial = (h || []) as HistorialEstadoEntry[];
  }

  // Combinar casos de hoy con pdte presupuesto global
  const allCasos: CasoAuditoria[] = (casosHoy || []).map(c => ({
    id: c.id,
    numero_siniestro: c.numero_siniestro,
    estado: c.estado,
    fecha_inspeccion_programada: c.fecha_inspeccion_programada,
    perito_calle_id: c.perito_calle_id,
    tipo_inspeccion: c.tipo_inspeccion,
    tiene_informe_campo: informesCampoSet.has(c.id),
    tiene_fotos: fotosSet.has(c.id),
  }));

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

  // Calcular resumen para informe del día (solo casos de hoy para score)
  const casosHoyArr: CasoAuditoria[] = (casosHoy || []).map(c => ({
    id: c.id,
    numero_siniestro: c.numero_siniestro,
    estado: c.estado,
    fecha_inspeccion_programada: c.fecha_inspeccion_programada,
    perito_calle_id: c.perito_calle_id,
    tiene_informe_campo: informesCampoSet.has(c.id),
    tiene_fotos: fotosSet.has(c.id),
  }));

  // Para el score del informe diario, calcular sobre todo el mes
  const primerDiaMes = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const ultimoDiaMes = new Date(anio, mes, 0).toISOString().split('T')[0];

  const { data: casosMes } = await supabase
    .from("casos")
    .select("id, numero_siniestro, estado, fecha_inspeccion_programada, fecha_inspeccion_real, perito_calle_id, tipo_inspeccion")
    .gte("fecha_inspeccion_programada", primerDiaMes)
    .lte("fecha_inspeccion_programada", ultimoDiaMes + "T23:59:59")
    .not("perito_calle_id", "is", null);

  const casosMesIds = (casosMes || []).map(c => c.id);
  let informesCampoMesSet = new Set<string>();
  let fotosMesSet = new Set<string>();
  if (casosMesIds.length > 0) {
    const { data: icm } = await supabase.from("informe_inspeccion_campo").select("caso_id").in("caso_id", casosMesIds);
    informesCampoMesSet = new Set((icm || []).map(i => i.caso_id));
    const { data: fm } = await supabase.from("fotos_inspeccion").select("caso_id").in("caso_id", casosMesIds);
    fotosMesSet = new Set((fm || []).map(f => f.caso_id));
  }

  const casosMesArr: CasoAuditoria[] = (casosMes || []).map(c => ({
    id: c.id,
    numero_siniestro: c.numero_siniestro,
    estado: c.estado,
    fecha_inspeccion_programada: c.fecha_inspeccion_programada,
    fecha_inspeccion_real: c.fecha_inspeccion_real,
    perito_calle_id: c.perito_calle_id,
    tipo_inspeccion: c.tipo_inspeccion,
    tiene_informe_campo: informesCampoMesSet.has(c.id),
    tiene_fotos: fotosMesSet.has(c.id),
  }));

  // Historial post-inspección para desvíos resueltos
  let historialPostInsp: HistorialEstadoEntry[] = [];
  if (casosMesIds.length > 0) {
    const { data: hpi } = await supabase
      .from("historial_estados")
      .select("caso_id, estado_nuevo, created_at")
      .in("caso_id", casosMesIds)
      .in("estado_nuevo", [
        'pendiente_carga', 'pendiente_presupuesto', 'licitando_repuestos',
        'ip_cerrada', 'facturada', 'inspeccion_anulada', 'en_consulta_cia',
        'ip_reclamada_perito', 'esperando_respuesta_tercero'
      ])
      .order("created_at", { ascending: true });
    historialPostInsp = (hpi || []) as HistorialEstadoEntry[];
  }

  // Fecha de corte
  const fechaCorte = getFechaCorteStr();

  // Score mensual por perito (con fecha corte e historial post-inspección)
  const peritosResumenMes = calcularDatosAuditoriaPeriodo(
    casosMesArr, historial, peritosCalle, fechaCorte, historialPostInsp
  );

  // Agregar pendientes globales
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

  // Construir datos del informe
  const totalPres = peritosResumenMes.reduce((s, p) => s + p.presenciales, 0);
  const totalRem = peritosResumenMes.reduce((s, p) => s + p.remotas, 0);
  const totalDesvios = peritosResumenMes.reduce((s, p) => s + p.desvios.filter(d => d.fecha_inspeccion_programada === hoyStr).length, 0);
  const totalPP = peritosResumenMes.reduce((s, p) => s + p.pendientes_presupuesto.length, 0);

  const datosInforme: InformeAuditoriaDatos = {
    fecha: hoyStr,
    peritos: peritosResumenMes,
    total_inspecciones_dia: (casosHoy || []).length,
    total_inspecciones_mes: (casosMes || []).length,
    total_presenciales: totalPres,
    total_remotas: totalRem,
    total_desvios: totalDesvios,
    total_pendientes_presupuesto: totalPP,
  };

  // Generar texto WhatsApp
  const textoWhatsApp = generarTextoWhatsApp(datosInforme);

  // Guardar informe en DB
  await supabase.from("informes_auditoria").insert({
    fecha: hoyStr,
    contenido_whatsapp: textoWhatsApp,
    datos_json: datosInforme as any,
  });

  // Upsert scores mensuales
  for (const perito of peritosResumenMes) {
    await supabase
      .from("scores_perito")
      .upsert({
        perito_id: perito.perito_id,
        mes,
        anio,
        score: perito.score,
        casos_totales: perito.casos_totales,
        casos_cumplidos: perito.casos_cumplidos,
        desvios: perito.desvios.length + perito.desvios_resueltos.length,
        datos_detalle: {
          tasa_cumplimiento: perito.tasa_cumplimiento,
          penalidad_desvios: perito.penalidad_desvios,
          penalidad_presupuesto: perito.penalidad_presupuesto,
          presenciales: perito.presenciales,
          remotas: perito.remotas,
        } as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: "perito_id,mes,anio" });
  }

  revalidatePath("/auditoria");
  return { textoWhatsApp, datos: datosInforme };
}

// ═══════════════════════════════════════════
// INFORMES HISTÓRICOS
// ═══════════════════════════════════════════

export async function getInformesHistoricos(limit: number = 30) {
  const { supabase } = await verificarAdmin();

  const { data } = await supabase
    .from("informes_auditoria")
    .select("id, fecha, contenido_whatsapp, created_at")
    .order("fecha", { ascending: false })
    .limit(limit);

  return data || [];
}

// ═══════════════════════════════════════════
// SCORES HISTÓRICOS DE UN PERITO
// ═══════════════════════════════════════════

export async function getScoresHistoricosPerito(peritoId: string) {
  const { supabase } = await verificarAdmin();

  const { data } = await supabase
    .from("scores_perito")
    .select("*")
    .eq("perito_id", peritoId)
    .order("anio", { ascending: false })
    .order("mes", { ascending: false })
    .limit(12);

  return data || [];
}

// ═══════════════════════════════════════════
// UMBRALES DE SCORE (CONFIGURABLES)
// ═══════════════════════════════════════════

export async function getUmbralesScore(): Promise<UmbralesScore> {
  const { supabase } = await verificarAdmin();

  const { data } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "umbrales_score_auditoria")
    .maybeSingle();

  if (data?.valor) {
    const val = data.valor as any;
    return {
      excelente: val.excelente ?? UMBRALES_SCORE_DEFAULT.excelente,
      bueno: val.bueno ?? UMBRALES_SCORE_DEFAULT.bueno,
      regular: val.regular ?? UMBRALES_SCORE_DEFAULT.regular,
    };
  }

  return UMBRALES_SCORE_DEFAULT;
}

export async function setUmbralesScore(umbrales: UmbralesScore) {
  const { supabase } = await verificarAdmin();

  // Validar orden: excelente > bueno > regular > 0
  if (umbrales.excelente <= umbrales.bueno || umbrales.bueno <= umbrales.regular || umbrales.regular <= 0) {
    return { error: "Los umbrales deben ser: Excelente > Bueno > Regular > 0" };
  }

  const { error } = await supabase
    .from("configuracion")
    .upsert({
      clave: "umbrales_score_auditoria",
      valor: umbrales as any,
      descripcion: "Umbrales de score para el m\u00f3dulo de auditor\u00eda (Excelente/Bueno/Regular/Cr\u00edtico)",
      updated_at: new Date().toISOString(),
    }, { onConflict: "clave" });

  if (error) return { error: error.message };

  revalidatePath("/auditoria");
  return { success: true };
}

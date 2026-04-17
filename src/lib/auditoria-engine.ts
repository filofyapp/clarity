/**
 * Motor de cálculos de auditoría — funciones puras reutilizadas por
 * server actions (panel) y cron (informe automático 18hs).
 *
 * NO importa Supabase ni Next.js — recibe datos ya fetched.
 */

// ═══════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════

export interface CasoAuditoria {
  id: string;
  numero_siniestro: string;
  estado: string;
  fecha_inspeccion_programada: string | null;
  fecha_inspeccion_real?: string | null; // TIMESTAMPTZ real de inspección
  perito_calle_id: string | null;
  perito_nombre?: string;
  perito_apellido?: string;
  tipo_inspeccion?: string | null;
  tiene_informe_campo: boolean;
  tiene_fotos: boolean;
}

export interface HistorialEstadoEntry {
  caso_id: string;
  estado_nuevo: string;
  created_at: string;
}

export interface PeritoResumen {
  perito_id: string;
  perito_nombre: string;
  casos_totales: number;
  casos_cumplidos: number;
  desvios: DesvioDetalle[];
  desvios_resueltos: DesvioDetalle[]; // desvíos que fueron tarde pero se completaron
  pendientes_presupuesto: PendientePresupuestoDetalle[];
  presenciales: number;
  remotas: number;
  sin_inspeccion: number;
  score: number;
  tasa_cumplimiento: number;
  penalidad_desvios: number;
  penalidad_presupuesto: number;
}

export interface DesvioDetalle {
  caso_id: string;
  numero_siniestro: string;
  fecha_inspeccion_programada: string;
  estado_actual: string;
  dias_demora: number;
}

export interface PendientePresupuestoDetalle {
  caso_id: string;
  numero_siniestro: string;
  fecha_entrada_estado: string;
  dias_en_estado: number;
}

export interface InformeAuditoriaDatos {
  fecha: string;
  peritos: PeritoResumen[];
  total_inspecciones_dia: number;
  total_inspecciones_mes: number;
  total_presenciales: number;
  total_remotas: number;
  total_desvios: number;
  total_pendientes_presupuesto: number;
}

// ═══════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════

/** Estados que indican que el perito completó la inspección (o el caso avanzó por otro motivo) */
const ESTADOS_POST_INSPECCION = [
  'pendiente_carga',
  'pendiente_presupuesto',
  'licitando_repuestos',
  'ip_cerrada',
  'facturada',
  'inspeccion_anulada',
  'en_consulta_cia',           // Problema con la compañía, no es culpa del perito
  'ip_reclamada_perito',       // La IP fue reclamada, no es desvío
  'esperando_respuesta_tercero', // Esperando tercero, no es desvío
];

/** Umbrales de score configurables desde /configuracion */
export interface UmbralesScore {
  excelente: number; // >= este valor
  bueno: number;
  regular: number;
  // < regular = Crítico
}

export const UMBRALES_SCORE_DEFAULT: UmbralesScore = {
  excelente: 90,
  bueno: 70,
  regular: 50,
};

/** Colores de score para el frontend */
export function getScoreColor(score: number, u: UmbralesScore = UMBRALES_SCORE_DEFAULT): string {
  if (score >= u.excelente) return '#10B981'; // verde
  if (score >= u.bueno) return '#F59E0B'; // ámbar
  if (score >= u.regular) return '#F97316'; // naranja
  return '#EF4444'; // rojo
}

export function getScoreLabel(score: number, u: UmbralesScore = UMBRALES_SCORE_DEFAULT): string {
  if (score >= u.excelente) return 'Excelente';
  if (score >= u.bueno) return 'Bueno';
  if (score >= u.regular) return 'Regular';
  return 'Crítico';
}

// ═══════════════════════════════════════════
// FUNCIONES DE CÁLCULO
// ═══════════════════════════════════════════

/**
 * Calcula la fecha de corte de auditoría basada en las 18:00 Argentina (UTC-3).
 * - Antes de las 18:00 AR: los casos de hoy aún tienen tiempo → corte = ayer.
 * - Después de las 18:00 AR: los casos de hoy ya debieron completarse → corte = hoy.
 */
export function getFechaCorteStr(ahora: Date = new Date()): string {
  const utcH = ahora.getUTCHours();
  const argH = ((utcH - 3) % 24 + 24) % 24;

  // Si UTC < 3, en Argentina todavía es el día anterior
  const argDate = new Date(ahora.getTime());
  if (utcH < 3) {
    argDate.setUTCDate(argDate.getUTCDate() - 1);
  }
  const argDateStr = argDate.toISOString().split('T')[0];

  if (argH >= 18) {
    return argDateStr; // Hoy: las 18hs ya pasaron
  } else {
    // Los casos de hoy aún tienen tiempo
    const ayer = new Date(argDate.getTime());
    ayer.setUTCDate(ayer.getUTCDate() - 1);
    return ayer.toISOString().split('T')[0];
  }
}

/**
 * Detecta desvíos ACTIVOS: casos con fecha_ip <= fechaCorte
 * que NO están en estado post-inspección.
 */
export function detectarDesvios(
  casos: CasoAuditoria[],
  fechaCorteStr: string,
  ahora: Date = new Date()
): DesvioDetalle[] {
  const desvios: DesvioDetalle[] = [];

  for (const caso of casos) {
    if (!caso.fecha_inspeccion_programada) continue;

    const fechaIP = caso.fecha_inspeccion_programada.split('T')[0];
    if (fechaIP > fechaCorteStr) continue; // aún no vence

    if (ESTADOS_POST_INSPECCION.includes(caso.estado)) continue; // completado

    // Deadline: 18:00 Argentina = 21:00 UTC del día programado
    const deadline = new Date(fechaIP + 'T21:00:00Z');
    const diasDemora = Math.max(1, Math.ceil(
      (ahora.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)
    ));

    desvios.push({
      caso_id: caso.id,
      numero_siniestro: caso.numero_siniestro,
      fecha_inspeccion_programada: fechaIP,
      estado_actual: caso.estado,
      dias_demora: diasDemora,
    });
  }

  return desvios;
}

/**
 * Detecta desvíos RESUELTOS: casos que se completaron TARDE
 * (después de su deadline 18:00 AR del día programado).
 * Usa fecha_inspeccion_real o historial_estados como fallback.
 */
export function detectarDesviosResueltos(
  casos: CasoAuditoria[],
  historialPostInspeccion: HistorialEstadoEntry[],
  fechaCorteStr: string
): DesvioDetalle[] {
  const desvios: DesvioDetalle[] = [];

  for (const caso of casos) {
    if (!caso.fecha_inspeccion_programada) continue;
    const fechaIP = caso.fecha_inspeccion_programada.split('T')[0];
    if (fechaIP > fechaCorteStr) continue; // aún no vencía
    if (!ESTADOS_POST_INSPECCION.includes(caso.estado)) continue; // no completado → activo, no resuelto

    const deadline = new Date(fechaIP + 'T21:00:00Z'); // 18:00 AR

    // 1. Usar fecha_inspeccion_real si existe
    if (caso.fecha_inspeccion_real) {
      const realDate = new Date(caso.fecha_inspeccion_real);
      if (realDate > deadline) {
        const diasDemora = Math.max(1, Math.ceil(
          (realDate.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)
        ));
        desvios.push({
          caso_id: caso.id,
          numero_siniestro: caso.numero_siniestro,
          fecha_inspeccion_programada: fechaIP,
          estado_actual: caso.estado,
          dias_demora: diasDemora,
        });
      }
      continue;
    }

    // 2. Fallback: buscar en historial la primera transición a post-inspección
    const transitions = historialPostInspeccion
      .filter(h => h.caso_id === caso.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (transitions.length > 0) {
      const firstTransition = new Date(transitions[0].created_at);
      if (firstTransition > deadline) {
        const diasDemora = Math.max(1, Math.ceil(
          (firstTransition.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)
        ));
        desvios.push({
          caso_id: caso.id,
          numero_siniestro: caso.numero_siniestro,
          fecha_inspeccion_programada: fechaIP,
          estado_actual: caso.estado,
          dias_demora: diasDemora,
        });
      }
    }
  }

  return desvios;
}

/**
 * Detecta casos en pendiente_presupuesto por más de 24hs.
 * Busca en historial_estados la entrada más reciente a ese estado.
 */
export function detectarPendientesPresupuesto(
  casos: CasoAuditoria[],
  historialEstados: HistorialEstadoEntry[],
  ahora: Date = new Date()
): PendientePresupuestoDetalle[] {
  const pendientes: PendientePresupuestoDetalle[] = [];

  // Solo considerar casos que están actualmente en pendiente_presupuesto
  const casosPP = casos.filter(c => c.estado === 'pendiente_presupuesto');

  for (const caso of casosPP) {
    // Buscar la última vez que entró a pendiente_presupuesto
    const entradas = historialEstados
      .filter(h => h.caso_id === caso.id && h.estado_nuevo === 'pendiente_presupuesto')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (entradas.length === 0) continue;

    const fechaEntrada = new Date(entradas[0].created_at);
    const horasEnEstado = (ahora.getTime() - fechaEntrada.getTime()) / (1000 * 60 * 60);

    // Solo penaliza después de 24hs
    if (horasEnEstado <= 24) continue;

    const diasEnEstado = Math.ceil(horasEnEstado / 24);

    pendientes.push({
      caso_id: caso.id,
      numero_siniestro: caso.numero_siniestro,
      fecha_entrada_estado: entradas[0].created_at,
      dias_en_estado: diasEnEstado,
    });
  }

  return pendientes;
}

/**
 * Determina el tipo de inspección real de un caso.
 * Ausentes = presencial (el perito fue físicamente pero el asegurado no se presentó).
 */
export function determinarTipoInspeccion(caso: CasoAuditoria): 'presencial' | 'remota' | 'sin_inspeccion' {
  // Ausente siempre cuenta como presencial (el perito fue al lugar)
  if (caso.tipo_inspeccion === 'ausente') return 'presencial';
  if (caso.tiene_informe_campo) return 'presencial';
  if (caso.tiene_fotos) return 'remota';
  return 'sin_inspeccion';
}

/**
 * Calcula el score de efectividad de un perito.
 *
 * SCORE = TASA_CUMPLIMIENTO - PENALIDAD_SEVERIDAD - PENALIDAD_PRESUPUESTO
 * Piso: 0, Techo: 100
 */
export function calcularScore(
  casosTotales: number,
  casosCumplidos: number,
  desvios: DesvioDetalle[],
  pendientesPresupuesto: PendientePresupuestoDetalle[]
): { score: number; tasa: number; penDesvios: number; penPresupuesto: number } {
  if (casosTotales === 0) {
    return { score: 100, tasa: 100, penDesvios: 0, penPresupuesto: 0 };
  }

  const tasa = (casosCumplidos / casosTotales) * 100;

  // Penalidad desvíos: Σ(días_demora × 2) / total_casos
  const sumDiasDesvio = desvios.reduce((sum, d) => sum + d.dias_demora * 2, 0);
  const penDesvios = sumDiasDesvio / casosTotales;

  // Penalidad presupuesto: Σ(días_en_pdte_presupuesto × 1) / total_casos
  // Solo la parte que excede 24hs (los primeros 24hs no penalizan)
  const sumDiasPP = pendientesPresupuesto.reduce((sum, p) => sum + Math.max(0, p.dias_en_estado - 1) * 1, 0);
  const penPresupuesto = sumDiasPP / casosTotales;

  const scoreRaw = tasa - penDesvios - penPresupuesto;
  const score = Math.min(100, Math.max(0, Math.round(scoreRaw * 100) / 100));

  return { score, tasa: Math.round(tasa * 100) / 100, penDesvios: Math.round(penDesvios * 100) / 100, penPresupuesto: Math.round(penPresupuesto * 100) / 100 };
}

/**
 * Calcula datos de auditoría completos para un período dado.
 * Solo cuenta casos con fecha_ip <= fechaCorte en el denominador del score.
 */
export function calcularDatosAuditoriaPeriodo(
  casos: CasoAuditoria[],
  historialEstados: HistorialEstadoEntry[],
  peritosCalle: { id: string; nombre: string; apellido: string }[],
  fechaCorteStr?: string,
  historialPostInspeccion?: HistorialEstadoEntry[]
): PeritoResumen[] {
  const corte = fechaCorteStr || getFechaCorteStr();
  const resumenPeritos: PeritoResumen[] = [];

  for (const perito of peritosCalle) {
    const casosPerito = casos.filter(c => c.perito_calle_id === perito.id);

    if (casosPerito.length === 0) continue;

    // Casos ELEGIBLES: solo los que ya vencieron (fecha_ip <= corte)
    const casosElegibles = casosPerito.filter(c => {
      if (!c.fecha_inspeccion_programada) return false;
      return c.fecha_inspeccion_programada.split('T')[0] <= corte;
    });

    // Casos completados (dentro de los elegibles)
    const casosCumplidos = casosElegibles.filter(c =>
      ESTADOS_POST_INSPECCION.includes(c.estado)
    );

    // Desvíos activos
    const desvios = detectarDesvios(casosPerito, corte);

    // Desvíos resueltos (completados tarde)
    const desviosResueltos = detectarDesviosResueltos(
      casosPerito,
      historialPostInspeccion || [],
      corte
    );

    // Pendientes presupuesto
    const pendientesPresupuesto = detectarPendientesPresupuesto(casosPerito, historialEstados);

    // Tipo inspección (sobre completados)
    let presenciales = 0;
    let remotas = 0;
    let sinInspeccion = 0;
    for (const c of casosPerito) {
      if (!ESTADOS_POST_INSPECCION.includes(c.estado)) {
        sinInspeccion++;
        continue;
      }
      const tipo = determinarTipoInspeccion(c);
      if (tipo === 'presencial') presenciales++;
      else if (tipo === 'remota') remotas++;
      else sinInspeccion++;
    }

    // Score: cumplidos EN FECHA = completados - resueltos tarde
    const todosDesvios = [...desvios, ...desviosResueltos];
    const cumplidosEnFecha = Math.max(0, casosCumplidos.length - desviosResueltos.length);
    const { score, tasa, penDesvios, penPresupuesto } = calcularScore(
      casosElegibles.length,
      cumplidosEnFecha,
      todosDesvios,
      pendientesPresupuesto
    );

    resumenPeritos.push({
      perito_id: perito.id,
      perito_nombre: `${perito.nombre} ${perito.apellido || ''}`.trim(),
      casos_totales: casosElegibles.length,
      casos_cumplidos: cumplidosEnFecha,
      desvios,
      desvios_resueltos: desviosResueltos,
      pendientes_presupuesto: pendientesPresupuesto,
      presenciales,
      remotas,
      sin_inspeccion: sinInspeccion,
      score,
      tasa_cumplimiento: tasa,
      penalidad_desvios: penDesvios,
      penalidad_presupuesto: penPresupuesto,
    });
  }

  // Ordenar por score descendente
  resumenPeritos.sort((a, b) => b.score - a.score);

  return resumenPeritos;
}

/**
 * Genera el texto formateado para WhatsApp con emojis y asteriscos (negrita).
 */
export function generarTextoWhatsApp(datos: InformeAuditoriaDatos): string {
  const fechaFmt = formatearFechaCorta(datos.fecha);

  let texto = `📊 *AUDITORÍA DEL ${fechaFmt}*\n`;

  for (const perito of datos.peritos) {
    texto += `\n*${perito.perito_nombre.toUpperCase()}* · Score: ${perito.score}/100\n`;

    const totalCompletados = perito.presenciales + perito.remotas;
    if (totalCompletados > 0) {
      const pctPres = totalCompletados > 0 ? Math.round((perito.presenciales / totalCompletados) * 100) : 0;
      const pctRem = totalCompletados > 0 ? Math.round((perito.remotas / totalCompletados) * 100) : 0;

      if (perito.presenciales > 0) {
        texto += `✅ Presenciales: ${perito.presenciales} (${pctPres}%)\n`;
      }
      if (perito.remotas > 0) {
        texto += `📱 Remotas: ${perito.remotas} (${pctRem}%)\n`;
      }
    }

    // Desvíos activos
    if (perito.desvios.length > 0) {
      texto += `❌ No realizadas: ${perito.desvios.length}\n`;
      for (const d of perito.desvios) {
        texto += `   → Stro ${d.numero_siniestro} (coordinada ${formatearFechaCorta(d.fecha_inspeccion_programada)}, ${d.dias_demora} días)\n`;
      }
    }

    // Desvíos resueltos (completados tarde)
    if (perito.desvios_resueltos.length > 0) {
      texto += `⚠️ Completadas con demora: ${perito.desvios_resueltos.length}\n`;
      for (const d of perito.desvios_resueltos) {
        texto += `   → Stro ${d.numero_siniestro} (${d.dias_demora} días tarde)\n`;
      }
    }

    // Pendientes presupuesto
    if (perito.pendientes_presupuesto.length > 0) {
      texto += `⏱ Pdte. Presupuesto:\n`;
      for (const p of perito.pendientes_presupuesto) {
        texto += `   → Stro ${p.numero_siniestro} (hace ${p.dias_en_estado} días)\n`;
      }
    }
  }

  return texto.trimEnd();
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function formatearFechaCorta(fecha: string): string {
  try {
    const parts = fecha.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return fecha;
  } catch {
    return fecha;
  }
}

/** Nombre de mes en español */
export function nombreMes(mes: number): string {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return meses[mes - 1] || '';
}

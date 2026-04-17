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
  perito_calle_id: string | null;
  perito_nombre?: string;
  perito_apellido?: string;
  tipo_inspeccion?: string | null; // tipo de IP original (ausente, remota, etc.)
  tiene_informe_campo: boolean; // true = presencial
  tiene_fotos: boolean;         // true si tiene fotos de inspeccion
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
 * Detecta casos en desvío: fecha_inspeccion_programada <= hoy/fechaRef
 * y el caso NO está en un estado post-inspección.
 */
export function detectarDesvios(
  casos: CasoAuditoria[],
  fechaRef: Date = new Date()
): DesvioDetalle[] {
  const hoyStr = fechaRef.toISOString().split('T')[0];
  const desvios: DesvioDetalle[] = [];

  for (const caso of casos) {
    if (!caso.fecha_inspeccion_programada) continue;

    const fechaIP = caso.fecha_inspeccion_programada.split('T')[0];
    if (fechaIP > hoyStr) continue; // futuro, no es desvío

    if (ESTADOS_POST_INSPECCION.includes(caso.estado)) continue; // ya completado

    // Es desvío: estaba coordinada para ese día (o antes) y no fue completada
    const diasDemora = Math.max(1, Math.ceil(
      (fechaRef.getTime() - new Date(fechaIP + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24)
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
 */
export function calcularDatosAuditoriaPeriodo(
  casos: CasoAuditoria[],
  historialEstados: HistorialEstadoEntry[],
  peritosCalle: { id: string; nombre: string; apellido: string }[],
  fechaRef: Date = new Date()
): PeritoResumen[] {
  const resumenPeritos: PeritoResumen[] = [];

  for (const perito of peritosCalle) {
    const casosPerito = casos.filter(c => c.perito_calle_id === perito.id);

    if (casosPerito.length === 0) continue;

    // Casos completados en fecha
    const casosCumplidos = casosPerito.filter(c => {
      if (!c.fecha_inspeccion_programada) return false;
      return ESTADOS_POST_INSPECCION.includes(c.estado);
    });

    // Desvíos
    const desvios = detectarDesvios(casosPerito, fechaRef);

    // Pendientes presupuesto
    const pendientesPresupuesto = detectarPendientesPresupuesto(casosPerito, historialEstados, fechaRef);

    // Tipo inspección
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

    // Score
    const { score, tasa, penDesvios, penPresupuesto } = calcularScore(
      casosPerito.length,
      casosCumplidos.length,
      desvios,
      pendientesPresupuesto
    );

    resumenPeritos.push({
      perito_id: perito.id,
      perito_nombre: `${perito.nombre} ${perito.apellido || ''}`.trim(),
      casos_totales: casosPerito.length,
      casos_cumplidos: casosCumplidos.length,
      desvios,
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

    // Desvíos del día
    const desviosDia = perito.desvios;
    texto += `❌ No realizadas: ${desviosDia.length}\n`;
    for (const d of desviosDia) {
      texto += `   → Stro ${d.numero_siniestro} (coordinada para ${formatearFechaCorta(d.fecha_inspeccion_programada)}, sin inspeccionar)\n`;
    }

    // Pendientes presupuesto
    if (perito.pendientes_presupuesto.length > 0) {
      texto += `⏱ Pdte. Presupuesto:\n`;
      for (const p of perito.pendientes_presupuesto) {
        texto += `   → Stro ${p.numero_siniestro} (hace ${p.dias_en_estado} días)\n`;
      }
    }
  }

  // Resumen del estudio
  const totalCompMes = datos.total_presenciales + datos.total_remotas;
  texto += `\n──────────────\n`;
  texto += `📈 *RESUMEN DEL ESTUDIO*\n`;
  texto += `Inspecciones programadas hoy: ${datos.total_inspecciones_dia}\n`;
  texto += `Total del mes: ${datos.total_inspecciones_mes} (Presenciales: ${datos.total_presenciales} ${totalCompMes > 0 ? `(${Math.round((datos.total_presenciales / totalCompMes) * 100)}%)` : ''} | Remotas: ${datos.total_remotas} ${totalCompMes > 0 ? `(${Math.round((datos.total_remotas / totalCompMes) * 100)}%)` : ''})\n`;
  texto += `Desvíos del día: ${datos.total_desvios}\n`;
  texto += `Pdte. presupuesto activos: ${datos.total_pendientes_presupuesto}`;

  return texto;
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

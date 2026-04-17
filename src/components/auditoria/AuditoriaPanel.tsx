"use client";

import { useState, useEffect, useMemo } from "react";
import { getDatosAuditoria, generarInformeDelDia, getScoresHistoricosPerito, getUmbralesScore, setUmbralesScore } from "@/app/(dashboard)/auditoria/actions";
import { getScoreColor, getScoreLabel, nombreMes, PeritoResumen, UmbralesScore, UMBRALES_SCORE_DEFAULT } from "@/lib/auditoria-engine";
import { InformeWhatsAppModal } from "./InformeWhatsAppModal";
import { HistorialInformes } from "./HistorialInformes";
import { generarPDFAuditoria } from "@/lib/auditoria-pdf";
import { toast } from "sonner";
import {
  ShieldCheck, Download, ClipboardCopy, ChevronDown, ArrowLeft,
  TrendingUp, AlertTriangle, Clock, Users, BarChart3, Filter, Settings
} from "lucide-react";

// ═══════════════════════════════════════════
// TIPOS LOCALES
// ═══════════════════════════════════════════

interface CasoDetalle {
  id: string;
  numero_siniestro: string;
  estado: string;
  fecha_inspeccion_programada: string | null;
  perito_calle_id: string | null;
  perito_nombre_completo: string;
  tipo_inspeccion_real: string;
  desvio_info: string | null;
  pp_info: string | null;
  dias_en_estado: number;
}

interface ScoreHistorico {
  mes: number;
  anio: number;
  score: number;
  casos_totales: number;
  desvios: number;
  datos_detalle: any;
}

// ═══════════════════════════════════════════
// ESTADO LABELS
// ═══════════════════════════════════════════

const ESTADO_LABELS: Record<string, string> = {
  ip_coordinada: "IP Coordinada",
  pendiente_coordinacion: "Pdte. Coordinación",
  contactado: "Contactado",
  en_consulta_cia: "En Consulta Cía",
  pendiente_carga: "Pdte. Carga",
  pendiente_presupuesto: "Pdte. Presupuesto",
  licitando_repuestos: "Licitando Repuestos",
  ip_reclamada_perito: "IP Reclamada",
  esperando_respuesta_tercero: "Esperando Tercero",
  inspeccion_anulada: "Anulada",
  ip_cerrada: "IP Cerrada",
  facturada: "Facturada",
};

// ═══════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════

export default function AuditoriaPanel() {
  const ahora = new Date();
  const [mes, setMes] = useState(ahora.getMonth() + 1);
  const [anio, setAnio] = useState(ahora.getFullYear());
  const [peritoSeleccionado, setPeritoSeleccionado] = useState<string | null>(null);
  const [peritos, setPeritos] = useState<PeritoResumen[]>([]);
  const [casosDetalle, setCasosDetalle] = useState<CasoDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [modalWhatsApp, setModalWhatsApp] = useState<string | null>(null);
  const [showHistorial, setShowHistorial] = useState(false);
  const [scoresHistoricos, setScoresHistoricos] = useState<ScoreHistorico[]>([]);
  const [sortColumn, setSortColumn] = useState<string>("perito_nombre_completo");
  const [sortAsc, setSortAsc] = useState(true);
  const [filtroPerito, setFiltroPerito] = useState<string>("todos");
  const [filtroDesvio, setFiltroDesvio] = useState<string>("todos");
  const [umbrales, setUmbrales] = useState<UmbralesScore>(UMBRALES_SCORE_DEFAULT);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch umbrales al montar
  useEffect(() => {
    getUmbralesScore().then(setUmbrales).catch(() => {});
  }, []);

  // Fetch datos al cambiar período
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getDatosAuditoria(mes, anio);
        setPeritos(data.peritos);
        setCasosDetalle(data.casosDetalle as CasoDetalle[]);
      } catch (err: any) {
        toast.error(err.message || "Error al cargar datos de auditoría");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mes, anio]);

  // Fetch scores históricos al seleccionar perito
  useEffect(() => {
    if (!peritoSeleccionado) {
      setScoresHistoricos([]);
      return;
    }
    const fetchScores = async () => {
      try {
        const scores = await getScoresHistoricosPerito(peritoSeleccionado);
        setScoresHistoricos(scores as ScoreHistorico[]);
      } catch {
        // silencioso
      }
    };
    fetchScores();
  }, [peritoSeleccionado]);

  // Generar informe
  const handleGenerarInforme = async () => {
    setGenerando(true);
    try {
      const result = await generarInformeDelDia();
      setModalWhatsApp(result.textoWhatsApp);
      toast.success("Informe generado correctamente");
    } catch (err: any) {
      toast.error(err.message || "Error al generar informe");
    } finally {
      setGenerando(false);
    }
  };

  // Descargar PDF
  const handleDescargarPDF = () => {
    try {
      generarPDFAuditoria(peritos, casosDetalle, mes, anio);
      toast.success("PDF descargado");
    } catch (err: any) {
      toast.error("Error al generar PDF: " + err.message);
    }
  };

  // Perito seleccionado
  const peritoActual = peritos.find(p => p.perito_id === peritoSeleccionado);

  // Score histórico promedio
  const scoreHistorico = useMemo(() => {
    if (scoresHistoricos.length === 0) return null;
    const avg = scoresHistoricos.reduce((s, x) => s + Number(x.score), 0) / scoresHistoricos.length;
    return Math.round(avg * 100) / 100;
  }, [scoresHistoricos]);

  // Tabla filtrada y ordenada
  const casosTabla = useMemo(() => {
    let filtered = [...casosDetalle];

    if (filtroPerito !== "todos") {
      filtered = filtered.filter(c => c.perito_calle_id === filtroPerito);
    }
    if (filtroDesvio === "desvios") {
      filtered = filtered.filter(c => c.desvio_info);
    } else if (filtroDesvio === "presupuesto") {
      filtered = filtered.filter(c => c.pp_info);
    }

    filtered.sort((a, b) => {
      const aVal = (a as any)[sortColumn] || "";
      const bVal = (b as any)[sortColumn] || "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return sortAsc ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });

    return filtered;
  }, [casosDetalle, filtroPerito, filtroDesvio, sortColumn, sortAsc]);

  const handleSort = (col: string) => {
    if (sortColumn === col) setSortAsc(!sortAsc);
    else { setSortColumn(col); setSortAsc(true); }
  };

  // Selector de meses
  const meses = Array.from({ length: 12 }, (_, i) => i + 1);
  const anios = [2025, 2026, 2027];

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-primary/10 rounded-xl">
            <ShieldCheck className="h-6 w-6 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-outfit">Auditoría</h1>
            <p className="text-sm text-text-muted">Control de rendimiento y desvíos</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Período */}
          <div className="flex items-center gap-2 bg-bg-secondary rounded-lg border border-border-subtle px-3 py-2">
            <select
              value={mes}
              onChange={e => setMes(Number(e.target.value))}
              className="bg-transparent text-text-primary text-sm font-medium focus:outline-none cursor-pointer"
            >
              {meses.map(m => (
                <option key={m} value={m} className="bg-bg-secondary text-text-primary">{nombreMes(m)}</option>
              ))}
            </select>
            <select
              value={anio}
              onChange={e => setAnio(Number(e.target.value))}
              className="bg-transparent text-text-primary text-sm font-medium focus:outline-none cursor-pointer"
            >
              {anios.map(a => (
                <option key={a} value={a} className="bg-bg-secondary text-text-primary">{a}</option>
              ))}
            </select>
          </div>

          {/* Perito selector */}
          <select
            value={peritoSeleccionado || "todos"}
            onChange={e => setPeritoSeleccionado(e.target.value === "todos" ? null : e.target.value)}
            className="bg-bg-secondary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none cursor-pointer"
          >
            <option value="todos" className="bg-bg-secondary">Todos los peritos</option>
            {peritos.map(p => (
              <option key={p.perito_id} value={p.perito_id} className="bg-bg-secondary">{p.perito_nombre}</option>
            ))}
          </select>

          {/* Botones */}
          <button
            onClick={handleGenerarInforme}
            disabled={generando}
            className="flex items-center gap-2 bg-brand-primary text-text-on-brand px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <ClipboardCopy className="h-4 w-4" />
            {generando ? "Generando..." : "📋 Generar informe del día"}
          </button>

          <button
            onClick={handleDescargarPDF}
            className="flex items-center gap-2 bg-bg-secondary border border-border-subtle text-text-primary px-4 py-2 rounded-lg font-medium text-sm hover:bg-bg-tertiary transition-colors"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>

          <button
            onClick={() => setShowHistorial(!showHistorial)}
            className="flex items-center gap-2 bg-bg-secondary border border-border-subtle text-text-primary px-4 py-2 rounded-lg font-medium text-sm hover:bg-bg-tertiary transition-colors"
          >
            <Clock className="h-4 w-4" />
            Historial
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 bg-bg-secondary border border-border-subtle text-text-primary px-3 py-2 rounded-lg font-medium text-sm hover:bg-bg-tertiary transition-colors"
            title="Configurar umbrales de score"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ═══ SETTINGS UMBRALES ═══ */}
      {showSettings && (
        <UmbralesSettings
          umbrales={umbrales}
          onSave={async (u) => {
            const result = await setUmbralesScore(u);
            if ('error' in result && result.error) {
              toast.error(result.error);
            } else {
              setUmbrales(u);
              setShowSettings(false);
              toast.success("Umbrales actualizados");
            }
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ═══ HISTORIAL INFORMES ═══ */}
      {showHistorial && (
        <HistorialInformes onVerInforme={(texto) => setModalWhatsApp(texto)} />
      )}

      {/* ═══ LOADING ═══ */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-2 border-brand-primary border-t-transparent rounded-full" />
        </div>
      ) : peritoSeleccionado && peritoActual ? (
        /* ═══ VISTA INDIVIDUAL ═══ */
        <VistaIndividual
          perito={peritoActual}
          scoresHistoricos={scoresHistoricos}
          scoreHistorico={scoreHistorico}
          umbrales={umbrales}
          onVolver={() => setPeritoSeleccionado(null)}
        />
      ) : (
        /* ═══ VISTA GENERAL ═══ */
        <>
          {/* Cards de peritos */}
          {peritos.length === 0 ? (
            <div className="bg-bg-secondary rounded-xl border border-border-subtle p-12 text-center">
              <Users className="h-12 w-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-lg">Sin datos de auditoría para {nombreMes(mes)} {anio}</p>
              <p className="text-text-muted text-sm mt-1">No hay casos con inspección programada en este período</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {peritos.map(p => (
                <PeritoCard
                  key={p.perito_id}
                  perito={p}
                  umbrales={umbrales}
                  onClick={() => setPeritoSeleccionado(p.perito_id)}
                />
              ))}
            </div>
          )}

          {/* Tabla detallada */}
          {casosDetalle.length > 0 && (
            <div className="bg-bg-secondary rounded-xl border border-border-subtle overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
                <h3 className="text-base font-semibold text-text-primary font-outfit flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-brand-primary" />
                  Detalle de Casos — {nombreMes(mes)} {anio}
                </h3>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-text-muted" />
                  <select
                    value={filtroPerito}
                    onChange={e => setFiltroPerito(e.target.value)}
                    className="bg-bg-tertiary border border-border-subtle rounded-md px-2 py-1 text-xs text-text-primary focus:outline-none"
                  >
                    <option value="todos">Todos peritos</option>
                    {peritos.map(p => (
                      <option key={p.perito_id} value={p.perito_id}>{p.perito_nombre}</option>
                    ))}
                  </select>
                  <select
                    value={filtroDesvio}
                    onChange={e => setFiltroDesvio(e.target.value)}
                    className="bg-bg-tertiary border border-border-subtle rounded-md px-2 py-1 text-xs text-text-primary focus:outline-none"
                  >
                    <option value="todos">Todos</option>
                    <option value="desvios">Solo desvíos</option>
                    <option value="presupuesto">Solo pdte. presupuesto</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-bg-tertiary/50">
                      {[
                        { key: "perito_nombre_completo", label: "Perito" },
                        { key: "numero_siniestro", label: "Siniestro" },
                        { key: "fecha_inspeccion_programada", label: "Fecha IP" },
                        { key: "estado", label: "Estado" },
                        { key: "tipo_inspeccion_real", label: "Tipo" },
                        { key: "dias_en_estado", label: "Días" },
                        { key: "desvio_info", label: "Desvío" },
                      ].map(col => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors"
                        >
                          {col.label}
                          {sortColumn === col.key && (
                            <ChevronDown className={`inline-block h-3 w-3 ml-1 transition-transform ${sortAsc ? '' : 'rotate-180'}`} />
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {casosTabla.map(c => {
                      const isDesvio = !!c.desvio_info;
                      const isPP = !!c.pp_info;
                      return (
                        <tr
                          key={c.id}
                          className={`transition-colors hover:bg-bg-tertiary/30 ${isDesvio ? 'bg-red-500/5' : isPP ? 'bg-amber-500/5' : ''}`}
                        >
                          <td className="px-4 py-3 text-text-primary font-medium">{c.perito_nombre_completo}</td>
                          <td className="px-4 py-3 font-mono text-brand-primary font-bold text-xs">{c.numero_siniestro}</td>
                          <td className="px-4 py-3 text-text-secondary text-xs">
                            {c.fecha_inspeccion_programada ? formatDate(c.fecha_inspeccion_programada) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary">
                              {ESTADO_LABELS[c.estado] || c.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-text-secondary text-xs">{c.tipo_inspeccion_real}</td>
                          <td className="px-4 py-3 text-text-secondary text-xs">
                            {c.dias_en_estado > 0 ? `${c.dias_en_estado} días` : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {c.desvio_info && <span className="text-red-400 font-medium">{c.desvio_info}</span>}
                            {c.pp_info && <span className="text-amber-400 font-medium">{c.pp_info}</span>}
                            {!c.desvio_info && !c.pp_info && <span className="text-text-muted">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal WhatsApp */}
      {modalWhatsApp && (
        <InformeWhatsAppModal
          texto={modalWhatsApp}
          onClose={() => setModalWhatsApp(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// CARD DE PERITO
// ═══════════════════════════════════════════

function PeritoCard({ perito, umbrales, onClick }: { perito: PeritoResumen; umbrales: UmbralesScore; onClick: () => void }) {
  const scoreColor = getScoreColor(perito.score, umbrales);
  const totalCompletados = perito.presenciales + perito.remotas;
  const pctPres = totalCompletados > 0 ? Math.round((perito.presenciales / totalCompletados) * 100) : 0;
  const pctRem = totalCompletados > 0 ? Math.round((perito.remotas / totalCompletados) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-bg-secondary rounded-xl border border-border-subtle p-5 hover:border-brand-primary/30 hover:shadow-lg transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-text-primary font-outfit group-hover:text-brand-primary transition-colors">
            {perito.perito_nombre.toUpperCase()}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">{getScoreLabel(perito.score, umbrales)}</p>
        </div>
        <div
          className="text-3xl font-black font-outfit leading-none"
          style={{ color: scoreColor }}
        >
          {perito.score}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-text-secondary">
          <BarChart3 className="h-3.5 w-3.5 text-text-muted" />
          <span>{perito.casos_totales} casos asignados</span>
        </div>
        <div className="flex items-center gap-2 text-color-success">
          <span className="text-base">✅</span>
          <span>{perito.casos_cumplidos} completados en fecha</span>
        </div>
        {perito.desvios.length > 0 && (
          <div className="flex items-center gap-2 text-red-400">
            <span className="text-base">❌</span>
            <span>{perito.desvios.length} desvíos</span>
          </div>
        )}
        {perito.pendientes_presupuesto.length > 0 && (
          <div className="flex items-center gap-2 text-amber-400">
            <span className="text-base">⏱</span>
            <span>{perito.pendientes_presupuesto.length} caso{perito.pendientes_presupuesto.length > 1 ? 's' : ''} en pdte. presupuesto</span>
          </div>
        )}
        {totalCompletados > 0 && (
          <div className="flex items-center gap-2 text-text-secondary">
            <span className="text-base">📱</span>
            <span>Presencial: {pctPres}% | Remota: {pctRem}%</span>
          </div>
        )}
      </div>

      {/* Barra de ratio presencial/remota */}
      {totalCompletados > 0 && (
        <div className="mt-3 h-1.5 bg-bg-tertiary rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pctPres}%` }} />
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${pctRem}%` }} />
        </div>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════
// VISTA INDIVIDUAL
// ═══════════════════════════════════════════

function VistaIndividual({
  perito,
  scoresHistoricos,
  scoreHistorico,
  umbrales,
  onVolver,
}: {
  perito: PeritoResumen;
  scoresHistoricos: ScoreHistorico[];
  scoreHistorico: number | null;
  umbrales: UmbralesScore;
  onVolver: () => void;
}) {
  const scoreColor = getScoreColor(perito.score, umbrales);
  const totalCompletados = perito.presenciales + perito.remotas;
  const pctPres = totalCompletados > 0 ? Math.round((perito.presenciales / totalCompletados) * 100) : 0;
  const pctRem = totalCompletados > 0 ? Math.round((perito.remotas / totalCompletados) * 100) : 0;

  // Mini gráfico SVG
  const chartData = [...scoresHistoricos].reverse().slice(-6);
  const chartWidth = 320;
  const chartHeight = 80;

  return (
    <div className="space-y-6">
      {/* Botón volver */}
      <button
        onClick={onVolver}
        className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a vista general
      </button>

      {/* Score prominente */}
      <div className="bg-bg-secondary rounded-xl border border-border-subtle p-8 text-center">
        <h2 className="text-xl font-bold text-text-primary font-outfit mb-1">
          {perito.perito_nombre.toUpperCase()}
        </h2>
        <div className="text-7xl font-black font-outfit my-4" style={{ color: scoreColor }}>
          {perito.score}
        </div>
        <p className="text-lg text-text-muted">{getScoreLabel(perito.score, umbrales)}</p>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-text-secondary">
          <span>Score mensual: <strong style={{ color: scoreColor }}>{perito.score}</strong></span>
          <span className="text-border-subtle">|</span>
          <span>Score histórico: <strong>{scoreHistorico !== null ? scoreHistorico : '—'}</strong></span>
        </div>

        {/* Mini gráfico de evolución */}
        {chartData.length >= 2 && (
          <div className="mt-6 flex justify-center">
            <svg width={chartWidth} height={chartHeight + 20} className="overflow-visible">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(v => {
                const y = chartHeight - (v / 100) * chartHeight;
                return (
                  <g key={v}>
                    <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="currentColor" strokeOpacity="0.1" />
                    <text x={chartWidth + 4} y={y + 3} fontSize="8" fill="currentColor" opacity="0.4">{v}</text>
                  </g>
                );
              })}
              {/* Line */}
              <polyline
                fill="none"
                stroke={getScoreColor(perito.score, umbrales)}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={chartData.map((d, i) => {
                  const x = (i / (chartData.length - 1)) * chartWidth;
                  const y = chartHeight - (Number(d.score) / 100) * chartHeight;
                  return `${x},${y}`;
                }).join(' ')}
              />
              {/* Points and labels */}
              {chartData.map((d, i) => {
                const x = (i / (chartData.length - 1)) * chartWidth;
                const y = chartHeight - (Number(d.score) / 100) * chartHeight;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill={getScoreColor(Number(d.score), umbrales)} />
                    <text x={x} y={chartHeight + 14} fontSize="9" fill="currentColor" opacity="0.5" textAnchor="middle">
                      {nombreMes(d.mes).substring(0, 3)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Desglose */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stats */}
        <div className="bg-bg-secondary rounded-xl border border-border-subtle p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Desglose</h3>
          <div className="space-y-3">
            <StatRow label="Total asignados" value={perito.casos_totales} />
            <StatRow label="Completados en fecha" value={`${perito.casos_cumplidos} (${Math.round(perito.tasa_cumplimiento)}%)`} color="text-color-success" />
            <StatRow label="Desvíos" value={perito.desvios.length} color={perito.desvios.length > 0 ? "text-red-400" : undefined} />
            <StatRow label="Tasa cumplimiento" value={`${perito.tasa_cumplimiento}%`} />
            <StatRow label="Penalidad desvíos" value={`-${perito.penalidad_desvios}`} color="text-red-400" />
            <StatRow label="Penalidad presupuesto" value={`-${perito.penalidad_presupuesto}`} color="text-amber-400" />
          </div>

          {/* Barra presencial/remota */}
          {totalCompletados > 0 && (
            <div>
              <p className="text-xs text-text-muted mb-2">Ratio presencial / remota</p>
              <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500 transition-all flex items-center justify-center" style={{ width: `${pctPres}%` }}>
                  {pctPres > 15 && <span className="text-[8px] text-white font-bold">{pctPres}%</span>}
                </div>
                <div className="h-full bg-blue-500 transition-all flex items-center justify-center" style={{ width: `${pctRem}%` }}>
                  {pctRem > 15 && <span className="text-[8px] text-white font-bold">{pctRem}%</span>}
                </div>
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-text-muted">
                <span>🟢 Presencial: {perito.presenciales}</span>
                <span>🔵 Remota: {perito.remotas}</span>
              </div>
            </div>
          )}
        </div>

        {/* Listas de desvíos y pendientes */}
        <div className="space-y-4">
          {/* Desvíos */}
          <div className="bg-bg-secondary rounded-xl border border-border-subtle p-5">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Desvíos ({perito.desvios.length})
            </h3>
            {perito.desvios.length === 0 ? (
              <p className="text-sm text-color-success">Sin desvíos ✓</p>
            ) : (
              <div className="space-y-2">
                {perito.desvios.map(d => (
                  <div key={d.caso_id} className="flex items-center justify-between text-sm border-l-2 border-red-400 pl-3 py-1">
                    <span className="font-mono text-xs text-text-primary">{d.numero_siniestro}</span>
                    <span className="text-red-400 text-xs">{d.dias_demora} días</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pendientes presupuesto */}
          <div className="bg-bg-secondary rounded-xl border border-border-subtle p-5">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-amber-400" />
              Pdte. Presupuesto ({perito.pendientes_presupuesto.length})
            </h3>
            {perito.pendientes_presupuesto.length === 0 ? (
              <p className="text-sm text-color-success">Sin pendientes ✓</p>
            ) : (
              <div className="space-y-2">
                {perito.pendientes_presupuesto.map(p => (
                  <div key={p.caso_id} className="flex items-center justify-between text-sm border-l-2 border-amber-400 pl-3 py-1">
                    <span className="font-mono text-xs text-text-primary">{p.numero_siniestro}</span>
                    <span className="text-amber-400 text-xs">{p.dias_en_estado} días</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historial de scores */}
      {scoresHistoricos.length > 0 && (
        <div className="bg-bg-secondary rounded-xl border border-border-subtle overflow-hidden">
          <div className="px-5 py-4 border-b border-border-subtle">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-primary" />
              Historial de Scores Mensuales
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-tertiary/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Mes</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Casos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Desvíos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {scoresHistoricos.map(s => (
                <tr key={`${s.anio}-${s.mes}`} className={Number(s.score) < 70 ? 'bg-red-500/5' : ''}>
                  <td className="px-4 py-3 text-text-primary font-medium">{nombreMes(s.mes)} {s.anio}</td>
                  <td className="px-4 py-3 text-text-secondary">{s.casos_totales}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: getScoreColor(Number(s.score), umbrales) }}>{s.score}</td>
                  <td className="px-4 py-3 text-text-secondary">{s.desvios}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-muted">{label}</span>
      <span className={`text-sm font-semibold ${color || 'text-text-primary'}`}>{value}</span>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const parts = dateStr.split('T')[0].split('-');
    return `${parts[2]}/${parts[1]}`;
  } catch {
    return dateStr;
  }
}

// ═══════════════════════════════════════════
// SETTINGS UMBRALES
// ═══════════════════════════════════════════

function UmbralesSettings({
  umbrales,
  onSave,
  onClose,
}: {
  umbrales: UmbralesScore;
  onSave: (u: UmbralesScore) => Promise<void>;
  onClose: () => void;
}) {
  const [excelente, setExcelente] = useState(umbrales.excelente);
  const [bueno, setBueno] = useState(umbrales.bueno);
  const [regular, setRegular] = useState(umbrales.regular);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ excelente, bueno, regular });
    setSaving(false);
  };

  return (
    <div className="bg-bg-secondary rounded-xl border border-border-subtle p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary font-outfit flex items-center gap-2">
          <Settings className="h-4 w-4 text-brand-primary" />
          Umbrales de Score
        </h3>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xs">
          Cerrar
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-text-muted block mb-1">Excelente (≥)</label>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <input
              type="number"
              value={excelente}
              onChange={e => setExcelente(Number(e.target.value))}
              className="w-full bg-bg-tertiary border border-border-subtle rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary"
              min={1}
              max={100}
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Bueno (≥)</label>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <input
              type="number"
              value={bueno}
              onChange={e => setBueno(Number(e.target.value))}
              className="w-full bg-bg-tertiary border border-border-subtle rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary"
              min={1}
              max={100}
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Regular (≥)</label>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <input
              type="number"
              value={regular}
              onChange={e => setRegular(Number(e.target.value))}
              className="w-full bg-bg-tertiary border border-border-subtle rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary"
              min={1}
              max={100}
            />
          </div>
        </div>
      </div>
      <p className="text-[11px] text-text-muted mt-2">Valores menores a Regular = Crítico 🔴</p>
      <div className="flex justify-end mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-primary text-text-on-brand px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar umbrales"}
        </button>
      </div>
    </div>
  );
}

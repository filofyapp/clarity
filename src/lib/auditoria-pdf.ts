/**
 * Generación de PDF de auditoría usando jspdf + jspdf-autotable.
 * Se ejecuta client-side.
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { PeritoResumen, getScoreColor, nombreMes } from "./auditoria-engine";

interface CasoDetallePDF {
  numero_siniestro: string;
  estado: string;
  fecha_inspeccion_programada: string | null;
  perito_nombre_completo: string;
  tipo_inspeccion_real: string;
  desvio_info: string | null;
  pp_info: string | null;
  dias_en_estado: number;
}

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

export function generarPDFAuditoria(
  peritos: PeritoResumen[],
  casosDetalle: CasoDetallePDF[],
  mes: number,
  anio: number
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // ═══ PÁGINA 1: RESUMEN GENERAL ═══

  // Header
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text("CLARITY — AOM Siniestros", 14, 15);

  doc.setFontSize(20);
  doc.setTextColor(30, 30, 30);
  doc.text(`Informe de Auditoría`, 14, 28);

  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(`${nombreMes(mes)} ${anio}`, 14, 36);

  doc.setDrawColor(245, 158, 11); // ámbar
  doc.setLineWidth(0.8);
  doc.line(14, 40, pageWidth - 14, 40);

  let y = 50;

  // Cards de resumen por perito
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text("Resumen por Perito", 14, y);
  y += 8;

  const tableBody = peritos.map(p => {
    const totalComp = p.presenciales + p.remotas;
    const pctPres = totalComp > 0 ? Math.round((p.presenciales / totalComp) * 100) : 0;
    const pctRem = totalComp > 0 ? Math.round((p.remotas / totalComp) * 100) : 0;

    return [
      p.perito_nombre,
      String(p.score),
      String(p.casos_totales),
      String(p.casos_cumplidos),
      String(p.desvios.length),
      String(p.pendientes_presupuesto.length),
      `${pctPres}% / ${pctRem}%`,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Perito", "Score", "Casos", "Cumplidos", "Desvíos", "Pdte. Presup.", "Pres. / Rem."]],
    body: tableBody,
    theme: "grid",
    headStyles: {
      fillColor: [245, 158, 11],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      1: { fontStyle: "bold", halign: "center" },
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center" },
      5: { halign: "center" },
      6: { halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 1) {
        const score = Number(data.cell.raw);
        if (score >= 90) data.cell.styles.textColor = [16, 185, 129];
        else if (score >= 70) data.cell.styles.textColor = [245, 158, 11];
        else if (score >= 50) data.cell.styles.textColor = [249, 115, 22];
        else data.cell.styles.textColor = [239, 68, 68];
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Resumen del estudio
  const finalY = (doc as any).lastAutoTable?.finalY || y + 40;
  let ry = finalY + 12;

  const totalCasos = peritos.reduce((s, p) => s + p.casos_totales, 0);
  const totalPres = peritos.reduce((s, p) => s + p.presenciales, 0);
  const totalRem = peritos.reduce((s, p) => s + p.remotas, 0);
  const totalDesvios = peritos.reduce((s, p) => s + p.desvios.length, 0);
  const totalPP = peritos.reduce((s, p) => s + p.pendientes_presupuesto.length, 0);

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text("Resumen del Estudio", 14, ry);
  ry += 7;

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Total de casos en el período: ${totalCasos}`, 14, ry); ry += 5;
  doc.text(`Presenciales: ${totalPres} | Remotas: ${totalRem}`, 14, ry); ry += 5;
  doc.text(`Desvíos totales: ${totalDesvios}`, 14, ry); ry += 5;
  doc.text(`Pendientes de presupuesto: ${totalPP}`, 14, ry);

  // ═══ PÁGINAS 2+: DETALLE POR PERITO ═══

  for (const perito of peritos) {
    doc.addPage();

    // Header perito
    doc.setFontSize(16);
    doc.setTextColor(30, 30, 30);
    doc.text(perito.perito_nombre.toUpperCase(), 14, 20);

    doc.setFontSize(28);
    const scoreColorHex = getScoreColor(perito.score);
    const rgb = hexToRgb(scoreColorHex);
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text(`${perito.score}`, pageWidth - 14, 22, { align: "right" });

    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.5);
    doc.line(14, 28, pageWidth - 14, 28);

    let py = 36;

    // Desglose
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Casos totales: ${perito.casos_totales}`, 14, py); py += 5;
    doc.text(`Completados en fecha: ${perito.casos_cumplidos} (${perito.tasa_cumplimiento}%)`, 14, py); py += 5;

    const totalComp = perito.presenciales + perito.remotas;
    const pctP = totalComp > 0 ? Math.round((perito.presenciales / totalComp) * 100) : 0;
    const pctR = totalComp > 0 ? Math.round((perito.remotas / totalComp) * 100) : 0;
    doc.text(`Presencial: ${perito.presenciales} (${pctP}%) | Remota: ${perito.remotas} (${pctR}%)`, 14, py); py += 5;
    doc.text(`Tasa: ${perito.tasa_cumplimiento}% | Pen. Desvíos: -${perito.penalidad_desvios} | Pen. Presup.: -${perito.penalidad_presupuesto}`, 14, py);
    py += 10;

    // Desvíos
    if (perito.desvios.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(239, 68, 68);
      doc.text(`Desvíos (${perito.desvios.length})`, 14, py);
      py += 4;

      autoTable(doc, {
        startY: py,
        head: [["Siniestro", "Fecha Coordinada", "Días de Demora", "Estado"]],
        body: perito.desvios.map(d => [
          d.numero_siniestro,
          formatDatePDF(d.fecha_inspeccion_programada),
          String(d.dias_demora),
          ESTADO_LABELS[d.estado_actual] || d.estado_actual,
        ]),
        theme: "striped",
        headStyles: { fillColor: [254, 202, 202], textColor: [153, 27, 27], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      });

      py = (doc as any).lastAutoTable?.finalY + 8 || py + 30;
    }

    // Pendientes presupuesto
    if (perito.pendientes_presupuesto.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(245, 158, 11);
      doc.text(`Pendientes de Presupuesto (${perito.pendientes_presupuesto.length})`, 14, py);
      py += 4;

      autoTable(doc, {
        startY: py,
        head: [["Siniestro", "Días en Estado"]],
        body: perito.pendientes_presupuesto.map(p => [
          p.numero_siniestro,
          String(p.dias_en_estado),
        ]),
        theme: "striped",
        headStyles: { fillColor: [254, 243, 199], textColor: [146, 64, 14], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      });
    }
  }

  // Footer en todas las páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `CLARITY — Informe de Auditoría — ${nombreMes(mes)} ${anio} — Página ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  doc.save(`Auditoria_${nombreMes(mes)}_${anio}.pdf`);
}

// Helpers

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

function formatDatePDF(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
}

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';
import type { Node, Edge } from 'reactflow';
import type { BusNodeData, TransmissionEdgeData } from '../types';
import { generateEngineeringInsights, type InsightSeverity } from './engineeringInsights';

// ─── Colors ────────────────────────────────────────────────────────────────
const NAVY = '#1e3a5f';
const MID_BLUE = '#2d5a8e';
const ROW_ALT = '#f0f4f8';
const RED_BG = '#fee2e2';
const RED_TEXT = '#991b1b';
const YELLOW_BG = '#fef9c3';
const YELLOW_TEXT = '#854d0e';
const INSIGHT_CRITICAL_BG = '#fff1f2';
const INSIGHT_WARNING_BG = '#fffbeb';
const INSIGHT_INFO_BG = '#eff6ff';
const INSIGHT_OK_BG = '#f0fdf4';

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ─── Canvas Capture ─────────────────────────────────────────────────────────
export async function captureCanvasImage(): Promise<string> {
  const el = document.querySelector('.react-flow') as HTMLElement;
  if (!el) throw new Error('React Flow element not found');
  return toPng(el, { pixelRatio: 2, backgroundColor: '#f9fafb' });
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface ReportParams {
  nodes: Node[];
  edges: Edge[];
  isSimulated: boolean;
  scReport: { ikss_ka: number; skss_mw: number } | null;
  scFaultBusId: string | null;
  snapshotName?: string;
  diagramImage: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function addFooters(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...hexToRgb('#e5e7eb'));
    doc.line(14, h - 12, w - 14, h - 12);
    doc.setTextColor(...hexToRgb('#6b7280'));
    doc.text('PowerFlow Simulator', 14, h - 7);
    doc.text(`Page ${i} of ${pageCount}`, w - 14, h - 7, { align: 'right' });
  }
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...hexToRgb(NAVY));
  doc.text(title, 14, y);
  doc.setDrawColor(...hexToRgb(MID_BLUE));
  doc.setLineWidth(0.4);
  doc.line(14, y + 1.5, doc.internal.pageSize.getWidth() - 14, y + 1.5);
  return y + 8;
}

// ─── Main Generator ──────────────────────────────────────────────────────────
export async function generateEngineeringReport(params: ReportParams): Promise<void> {
  const { nodes, edges, isSimulated, scReport, scFaultBusId, snapshotName, diagramImage } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 0;

  // ── 1. Header band ────────────────────────────────────────────────────────
  doc.setFillColor(...hexToRgb(NAVY));
  doc.rect(0, 0, pageW, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Power System Simulation Report', pageW / 2, 16, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('PowerFlow Simulator', pageW / 2, 24, { align: 'center' });

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const metaLine = snapshotName ? `${dateStr}  •  Scenario: ${snapshotName}` : dateStr;
  doc.setFontSize(8);
  doc.text(metaLine, pageW / 2, 33, { align: 'center' });

  y = 52;

  // ── 2. Diagram ────────────────────────────────────────────────────────────
  y = sectionTitle(doc, 'Network Diagram', y);

  const maxImgW = pageW - 28;
  const maxImgH = 90;
  // We'll size proportionally; we don't know native dims so fill max width
  doc.addImage(diagramImage, 'PNG', 14, y, maxImgW, maxImgH);
  y += maxImgH + 10;

  // ── 3. Bus Results ────────────────────────────────────────────────────────
  if (isSimulated) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, 'Load Flow Results — Buses', y);

    const busNodes = nodes.filter((n) => n.type === 'busNode');
    const busRows = busNodes.map((n) => {
      const d = n.data as BusNodeData;
      return [
        n.id,
        d.label ?? '',
        d.busType ?? '',
        d.v_mag != null ? d.v_mag.toFixed(4) : '—',
        d.v_ang != null ? d.v_ang.toFixed(2) : '—',
        d.p_load != null ? d.p_load.toFixed(3) : '—',
        d.q_load != null ? d.q_load.toFixed(3) : '—',
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Bus ID', 'Label', 'Type', 'V (pu)', 'Angle (°)', 'P_load (MW)', 'Q_load (MVAr)']],
      body: busRows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: {
        fillColor: hexToRgb(MID_BLUE),
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: hexToRgb(ROW_ALT) },
      margin: { left: 14, right: 14 },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 3) {
          const raw = busNodes[data.row.index]?.data as BusNodeData | undefined;
          if (raw?.v_mag != null && (raw.v_mag < 0.95 || raw.v_mag > 1.05)) {
            data.cell.styles.fillColor = hexToRgb(YELLOW_BG);
            data.cell.styles.textColor = hexToRgb(YELLOW_TEXT);
          }
        }
      },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ── 4. Branch Results ─────────────────────────────────────────────────────
  if (isSimulated) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, 'Load Flow Results — Branches', y);

    const lineEdges = edges.filter((e) => {
      const d = e.data as TransmissionEdgeData | undefined;
      return d?.p_from_mw != null;
    });

    const branchRows = lineEdges.map((e) => {
      const d = e.data as TransmissionEdgeData;
      const losses =
        d.p_from_mw != null && d.p_to_mw != null
          ? Math.abs(d.p_from_mw + d.p_to_mw).toFixed(4)
          : '—';
      return [
        d.label ?? e.id,
        e.source,
        e.target,
        d.p_from_mw != null ? d.p_from_mw.toFixed(4) : '—',
        losses,
        d.loading_percent != null ? d.loading_percent.toFixed(1) : '—',
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Branch', 'From', 'To', 'P_from (MW)', 'Losses (MW)', 'Loading (%)']],
      body: branchRows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: {
        fillColor: hexToRgb(MID_BLUE),
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: hexToRgb(ROW_ALT) },
      margin: { left: 14, right: 14 },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 5) {
          const edge = lineEdges[data.row.index];
          const d = edge?.data as TransmissionEdgeData | undefined;
          if (d?.loading_percent != null && d.loading_percent >= 100) {
            data.cell.styles.fillColor = hexToRgb(RED_BG);
            data.cell.styles.textColor = hexToRgb(RED_TEXT);
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ── 5. Short-Circuit ──────────────────────────────────────────────────────
  if (scReport !== null) {
    if (y > 200) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, 'Short-Circuit Analysis', y);

    // Fault bus label
    const faultNode = nodes.find((n) => n.id === scFaultBusId);
    const faultLabel = faultNode
      ? `${(faultNode.data as BusNodeData).label} (ID: ${scFaultBusId})`
      : (scFaultBusId ?? '—');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb('#374151'));
    doc.text(`Fault bus: ${faultLabel}`, 14, y);
    y += 7;

    // Summary two-column
    autoTable(doc, {
      startY: y,
      head: [["I''k (kA)", "Sk (MVA)"]],
      body: [[scReport.ikss_ka.toFixed(3), scReport.skss_mw.toFixed(2)]],
      styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
      headStyles: {
        fillColor: hexToRgb(MID_BLUE),
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      tableWidth: 80,
      margin: { left: 14 },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    // Per-node SC table
    const scNodes = nodes.filter((n) => {
      const d = n.data as BusNodeData;
      return d.ikss_ka != null;
    });

    if (scNodes.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Bus", "Label", "I''k (kA)"]],
        body: scNodes.map((n) => {
          const d = n.data as BusNodeData;
          return [n.id, d.label ?? '', d.ikss_ka!.toFixed(3)];
        }),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
          fillColor: hexToRgb(MID_BLUE),
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: hexToRgb(ROW_ALT) },
        margin: { left: 14, right: 14 },
      });

      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }
  }

  // ── 6. Engineering Notes & Recommendations ────────────────────────────────
  const insights = generateEngineeringInsights(nodes, edges, scReport, scFaultBusId);

  if (y > 200) { doc.addPage(); y = 20; }
  y = sectionTitle(doc, 'Engineering Notes & Recommendations', y);

  const SEVERITY_ROW_BG: Record<InsightSeverity, string> = {
    critical: INSIGHT_CRITICAL_BG,
    warning: INSIGHT_WARNING_BG,
    info: INSIGHT_INFO_BG,
  };
  const SEVERITY_LABEL_TEXT: Record<InsightSeverity, [number, number, number]> = {
    critical: [185, 28, 28],
    warning: [146, 64, 14],
    info: [29, 78, 216],
  };

  if (insights.length === 0) {
    autoTable(doc, {
      startY: y,
      body: [['System Analysis: The network is operating within nominal technical limits. No critical violations detected.']],
      styles: { fontSize: 8.5, cellPadding: 4, font: 'courier', fillColor: hexToRgb(INSIGHT_OK_BG), textColor: [22, 101, 52] },
      margin: { left: 14, right: 14 },
      tableLineColor: [187, 247, 208],
      tableLineWidth: 0.3,
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  } else {
    for (const insight of insights) {
      if (y > 260) { doc.addPage(); y = 20; }

      const bgColor = hexToRgb(SEVERITY_ROW_BG[insight.severity]);
      const labelColor = SEVERITY_LABEL_TEXT[insight.severity];
      const label = `[${insight.category.toUpperCase()}]`;

      // Wrap message text manually across a max width
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      const labelW = doc.getTextWidth(label) + 2;

      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      const maxMsgWidth = doc.internal.pageSize.getWidth() - 28 - labelW - 4;
      const wrapped = doc.splitTextToSize(insight.message, maxMsgWidth);
      const rowH = Math.max(10, wrapped.length * 4.5 + 5);

      // Background rect
      doc.setFillColor(...bgColor);
      doc.setDrawColor(...bgColor);
      doc.roundedRect(14, y - 1, doc.internal.pageSize.getWidth() - 28, rowH, 1.5, 1.5, 'F');

      // Left accent stripe
      const stripeColor = SEVERITY_LABEL_TEXT[insight.severity];
      doc.setFillColor(...stripeColor);
      doc.rect(14, y - 1, 2.5, rowH, 'F');

      // Category label
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...labelColor);
      doc.text(label, 20, y + 3.5);

      // Message text
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...hexToRgb('#374151'));
      doc.text(wrapped, 20 + labelW, y + 3.5);

      y += rowH + 2.5;
    }
    y += 5;
  }

  // ── 7. Footers ────────────────────────────────────────────────────────────
  addFooters(doc);

  // ── Save ──────────────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  doc.save(`simulation_report_${today}.pdf`);
}

import type { Node, Edge } from 'reactflow';
import type { BusNodeData, TransmissionEdgeData } from '../types';

// ─── Per-element helpers (used by canvas tooltips) ───────────────────────────

export function getBusInsights(nodeId: string, data: BusNodeData, isSimulated: boolean): Insight[] {
  if (!isSimulated || data.v_mag == null) return [];
  const insights: Insight[] = [];
  if (data.v_mag < 0.95) {
    insights.push({
      severity: 'critical',
      category: 'Under-voltage',
      message:
        `Voltage at ${data.v_mag.toFixed(4)} p.u. — below the 0.95 p.u. lower limit. ` +
        `Consider installing a shunt capacitor bank or adjusting the transformer tap to restore the voltage profile.`,
    });
  } else if (data.v_mag > 1.05) {
    insights.push({
      severity: 'warning',
      category: 'Over-voltage',
      message:
        `Voltage at ${data.v_mag.toFixed(4)} p.u. — above the 1.05 p.u. upper limit. ` +
        `Check for light-load conditions or consider inductive compensation (reactor bank).`,
    });
  }
  if (data.ikss_ka != null && data.ikss_ka > 20) {
    insights.push({
      severity: 'warning',
      category: 'High Fault Current',
      message:
        `Fault current of ${data.ikss_ka.toFixed(3)} kA exceeds the 20 kA reference. ` +
        `Verify the breaking capacity (kA rating) of all circuit breakers at this bus.`,
    });
  }
  void nodeId;
  return insights;
}

export function getEdgeInsights(edgeId: string, data: TransmissionEdgeData): Insight[] {
  const insights: Insight[] = [];
  if (data.loading_percent != null) {
    if (data.loading_percent >= 100) {
      insights.push({
        severity: 'critical',
        category: 'System Overload',
        message:
          `Loading at ${data.loading_percent.toFixed(1)}% — Immediate Action Required. ` +
          `Consider network reconfiguration, load shedding, or line reinforcement.`,
      });
    } else if (data.loading_percent >= 90) {
      insights.push({
        severity: 'warning',
        category: 'Capacity Warning',
        message:
          `Loading at ${data.loading_percent.toFixed(1)}% — high thermal stress detected. ` +
          `Consider reconfiguring the network to redistribute the load.`,
      });
    }
  }
  if (
    data.breakerThreshold_ka &&
    data.breakerThreshold_ka > 0 &&
    data.ikss_ka != null &&
    data.ikss_ka > data.breakerThreshold_ka
  ) {
    insights.push({
      severity: 'critical',
      category: 'Breaker Capacity Exceeded',
      message:
        `Breaker rated at ${data.breakerThreshold_ka.toFixed(2)} kA would experience ` +
        `${data.ikss_ka.toFixed(3)} kA during fault. Immediate breaker upgrade required.`,
    });
  }
  void edgeId;
  return insights;
}

export type InsightSeverity = 'critical' | 'warning' | 'info';

export interface Insight {
  severity: InsightSeverity;
  category: string;
  message: string;
}

export function generateEngineeringInsights(
  nodes: Node[],
  edges: Edge[],
  scReport: { ikss_ka: number; skss_mw: number } | null,
  scFaultBusId: string | null,
): Insight[] {
  const insights: Insight[] = [];
  const busNodes = nodes.filter((n) => n.type === 'busNode');

  // ── Voltage violations ────────────────────────────────────────────────────
  for (const node of busNodes) {
    const d = node.data as BusNodeData;
    if (d.v_mag == null) continue;

    if (d.v_mag < 0.95) {
      insights.push({
        severity: 'critical',
        category: 'Under-voltage',
        message:
          `Warning: Bus ${d.label ?? node.id} voltage is at ${d.v_mag.toFixed(4)} p.u., ` +
          `which is below the 0.95 p.u. threshold. Consider installing a shunt capacitor ` +
          `at this node to improve the voltage profile.`,
      });
    } else if (d.v_mag > 1.05) {
      insights.push({
        severity: 'warning',
        category: 'Over-voltage',
        message:
          `Warning: Bus ${d.label ?? node.id} voltage is at ${d.v_mag.toFixed(4)} p.u., ` +
          `which exceeds the 1.05 p.u. threshold. Check for light load conditions ` +
          `or consider inductive compensation (reactor bank) at this node.`,
      });
    }
  }

  // ── Branch loading ────────────────────────────────────────────────────────
  for (const edge of edges) {
    const d = edge.data as TransmissionEdgeData | undefined;
    if (d?.loading_percent == null) continue;

    if (d.loading_percent >= 100) {
      insights.push({
        severity: 'critical',
        category: 'System Overload',
        message:
          `Observation: Transmission Line ${d.label ?? edge.id} is operating at ` +
          `${d.loading_percent.toFixed(1)}% capacity — Immediate Action Required. ` +
          `Consider network reconfiguration, load shedding, or line reinforcement.`,
      });
    } else if (d.loading_percent >= 90) {
      insights.push({
        severity: 'warning',
        category: 'Capacity Warning',
        message:
          `Observation: Transmission Line ${d.label ?? edge.id} is operating at ` +
          `${d.loading_percent.toFixed(1)}% capacity. High thermal stress detected; ` +
          `consider network reconfiguration to redistribute the load.`,
      });
    }
  }

  // ── Short-circuit analysis ────────────────────────────────────────────────
  if (scReport !== null && scFaultBusId !== null) {
    const faultNode = nodes.find((n) => n.id === scFaultBusId);
    const faultLabel = faultNode
      ? ((faultNode.data as BusNodeData).label ?? scFaultBusId)
      : scFaultBusId;

    insights.push({
      severity: 'info',
      category: 'Short-Circuit Result',
      message:
        `Short-Circuit Result: A fault at Bus ${faultLabel} results in a symmetrical ` +
        `current of ${scReport.ikss_ka.toFixed(3)} kA (Sk = ${scReport.skss_mw.toFixed(2)} MVA). ` +
        `Ensure protective devices are rated accordingly.`,
    });

    // Breaker threshold violations
    for (const edge of edges) {
      const d = edge.data as TransmissionEdgeData | undefined;
      if (
        d?.breakerThreshold_ka &&
        d.breakerThreshold_ka > 0 &&
        d.ikss_ka != null &&
        d.ikss_ka > d.breakerThreshold_ka
      ) {
        insights.push({
          severity: 'critical',
          category: 'Breaker Capacity Exceeded',
          message:
            `Warning: Circuit breaker on line ${d.label ?? edge.id} is rated at ` +
            `${d.breakerThreshold_ka.toFixed(2)} kA but would experience ` +
            `${d.ikss_ka.toFixed(3)} kA during the fault. Immediate breaker upgrade required.`,
        });
      }
    }

    // Exceptionally high per-bus fault currents (> 20 kA)
    for (const node of busNodes) {
      const d = node.data as BusNodeData;
      if (d.ikss_ka != null && d.ikss_ka > 20) {
        insights.push({
          severity: 'warning',
          category: 'High Fault Current',
          message:
            `Short-Circuit Result: Bus ${d.label ?? node.id} shows a fault current of ` +
            `${d.ikss_ka.toFixed(3)} kA, which exceeds the 20 kA reference level. ` +
            `Verify the breaking capacity (kA rating) of all installed circuit breakers at this node.`,
        });
      }
    }
  }

  return insights;
}

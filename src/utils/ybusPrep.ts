import type { Edge } from 'reactflow';
import type { BusNodeData, TransmissionEdgeData } from '../types';
import type { NetworkIsland } from '../types/topology';

export interface YbusLineData {
  fromBus: string;
  toBus: string;
  y_series: { re: number; im: number };
  b_shunt: number;
}

export interface YbusTransformerData {
  fromBus: string;
  toBus: string;
  tap: number;
  y_pu: { re: number; im: number };
}

export interface YbusIslandData {
  islandId: number;
  buses: {
    id: string;
    label: string;
    type: string;
    v_nom: number;
    p_gen_mw: number;
    q_gen_mvar: number;
    p_load_mw: number;
    q_load_mw: number;
  }[];
  lines: YbusLineData[];
  transformers: YbusTransformerData[];
}

export function prepareYbusData(
  islands: NetworkIsland[],
  edges: Edge<TransmissionEdgeData>[]
): YbusIslandData[] {
  return islands.map((island) => {
    const islandNodeIds = new Set(island.nodes.map((n) => n.id));

    // Collect edges within this island
    const islandEdges = edges.filter(
      (e) => islandNodeIds.has(e.source) && islandNodeIds.has(e.target)
    );

    const lines: YbusLineData[] = [];
    const transformers: YbusTransformerData[] = [];

    // Group edges by whether they touch a transformerNode
    const transformerEdges = islandEdges.filter((e) => {
      const src = island.nodes.find((n) => n.id === e.source);
      const tgt = island.nodes.find((n) => n.id === e.target);
      return src?.type === 'transformerNode' || tgt?.type === 'transformerNode';
    });
    const lineEdges = islandEdges.filter((e) => !transformerEdges.includes(e));

    // Build transformer entries: each transformerNode connects two buses via two edges
    const transformerNodeIds = new Set(
      transformerEdges.flatMap((e) => {
        const src = island.nodes.find((n) => n.id === e.source);
        const tgt = island.nodes.find((n) => n.id === e.target);
        return src?.type === 'transformerNode' ? [src.id] : [tgt!.id];
      })
    );

    for (const txId of transformerNodeIds) {
      const txNode = island.nodes.find((n) => n.id === txId);
      if (!txNode) continue;

      const attachedEdges = transformerEdges.filter(
        (e) => e.source === txId || e.target === txId
      );
      if (attachedEdges.length < 2) continue; // incomplete transformer, skip

      const busIdA =
        attachedEdges[0].source === txId
          ? attachedEdges[0].target
          : attachedEdges[0].source;
      const busIdB =
        attachedEdges[1].source === txId
          ? attachedEdges[1].target
          : attachedEdges[1].source;

      const xPu = (txNode.data as { x_pu?: number }).x_pu ?? 0.1;
      const tap = (txNode.data as { tap_ratio?: number }).tap_ratio ?? 1.0;
      const scale = 1 / (tap * tap);
      transformers.push({
        fromBus: busIdA,
        toBus: busIdB,
        tap,
        y_pu: { re: 0, im: (-1 / xPu) * scale },
      });
    }

    // Transmission lines
    for (const edge of lineEdges) {
      if (!edge.data) continue;
      const r = edge.data.r;
      const x = edge.data.x;
      const b = edge.data.b;
      const denom = r * r + x * x;
      const y_re = denom !== 0 ? r / denom : 0;
      const y_im = denom !== 0 ? -x / denom : 0;
      lines.push({
        fromBus: edge.source,
        toBus: edge.target,
        y_series: { re: y_re, im: y_im },
        b_shunt: b / 2,
      });
    }

    const buses = island.nodes
      .filter((n) => n.type === 'busNode')
      .map((n) => {
        const d = n.data as BusNodeData;
        return {
          id: n.id,
          label: d.label,
          type: d.busType,
          v_nom: d.v_nom,
          p_gen_mw: d.p_gen,
          q_gen_mvar: d.q_gen,
          p_load_mw: d.p_load,
          q_load_mw: d.q_load,
        };
      });

    return { islandId: island.id, buses, lines, transformers };
  });
}

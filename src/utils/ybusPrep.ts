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

    for (const edge of islandEdges) {
      const sourceNode = island.nodes.find((n) => n.id === edge.source);
      const targetNode = island.nodes.find((n) => n.id === edge.target);
      if (!sourceNode || !targetNode || !edge.data) continue;

      const isTransformerEdge =
        sourceNode.type === 'transformerNode' || targetNode.type === 'transformerNode';

      if (isTransformerEdge) {
        // Transformer: Y = 1/(jX_pu), scaled by 1/tap²
        const xPu = edge.data.x !== 0 ? edge.data.x : 0.1;
        // tap ratio from transformer node data if available
        const transformerNode =
          sourceNode.type === 'transformerNode' ? sourceNode : targetNode;
        const tap = (transformerNode.data as { tap_ratio?: number }).tap_ratio ?? 1.0;
        // Y = 1/(j*xPu) = -j/xPu, scaled by 1/tap²
        const scale = 1 / (tap * tap);
        transformers.push({
          fromBus: edge.source,
          toBus: edge.target,
          tap,
          y_pu: { re: 0, im: (-1 / xPu) * scale },
        });
      } else {
        // Transmission line: Z = R + jX, Y = 1/Z
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

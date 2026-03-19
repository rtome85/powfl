import type { Edge, Node } from 'reactflow';
import type { BusNodeData, TransformerNodeData, TransmissionEdgeData } from '../types';
import type { NetworkIsland } from '../types/topology';
import type {
  BusPayload,
  BranchPayload,
  IslandPayload,
  PowerFlowPayload,
} from '../types/powerFlow';

const S_BASE_MVA = 100;

export function generatePowerFlowPayload(
  islands: NetworkIsland[],
  edges: Edge<TransmissionEdgeData>[],
  nodes: Node[]
): PowerFlowPayload {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const islandPayloads: IslandPayload[] = islands.map((island) => {
    const islandNodeIds = new Set(island.nodes.map((n) => n.id));

    const islandEdges = edges.filter(
      (e) => islandNodeIds.has(e.source) && islandNodeIds.has(e.target)
    );

    // Separate transformer edges from line edges
    const transformerEdges = islandEdges.filter((e) => {
      const src = island.nodes.find((n) => n.id === e.source);
      const tgt = island.nodes.find((n) => n.id === e.target);
      return src?.type === 'transformerNode' || tgt?.type === 'transformerNode';
    });
    const lineEdges = islandEdges.filter(
      (e) => !transformerEdges.includes(e) && !(e.data as TransmissionEdgeData | undefined)?.isOpen
    );

    const branches: BranchPayload[] = [];

    // Build transformer branches by grouping edges around each transformerNode
    const transformerNodeIds = new Set(
      transformerEdges.flatMap((e) => {
        const src = island.nodes.find((n) => n.id === e.source);
        const tgt = island.nodes.find((n) => n.id === e.target);
        return src?.type === 'transformerNode' ? [src.id] : [tgt!.id];
      })
    );

    for (const txId of transformerNodeIds) {
      const txNode = nodeMap.get(txId);
      if (!txNode) continue;

      const attachedEdges = transformerEdges.filter(
        (e) => e.source === txId || e.target === txId
      );
      if (attachedEdges.length !== 2) {
        throw new Error(
          `Transformer "${txId}" must have exactly 2 terminals but has ${attachedEdges.length}. ` +
          `Connect it to exactly two buses before running the simulation.`
        );
      }

      const fromBus =
        attachedEdges[0].source === txId
          ? attachedEdges[0].target
          : attachedEdges[0].source;
      const toBus =
        attachedEdges[1].source === txId
          ? attachedEdges[1].target
          : attachedEdges[1].source;

      const txData = txNode.data as Partial<TransformerNodeData>;
      const xPu = txData.x_pu ?? 0.1;
      const tap = txData.tap_ratio ?? 1.0;
      const ratingMva = txData.rating_mva ?? 100;
      const vkrPercent = txData.vkr_percent ?? 1.0;

      branches.push({
        branch_id: txId,
        from_bus: fromBus,
        to_bus: toBus,
        r_pu: 0,
        x_pu: xPu,
        b_pu: 0,
        rating_mva: ratingMva,
        is_transformer: true,
        tap,
        vkr_percent: vkrPercent,
      });
    }

    // Transmission line branches — R/X/B are stored as p.u. (entered via UI)
    for (const edge of lineEdges) {
      if (!edge.data) continue;

      branches.push({
        branch_id: edge.id,
        from_bus: edge.source,
        to_bus: edge.target,
        r_pu: edge.data.r,
        x_pu: edge.data.x,
        b_pu: edge.data.b,
        rating_mva: edge.data.rating_mva,
        is_transformer: false,
        tap: 1.0,
      });
    }

    // Bus payloads from busNode entries only
    const buses: BusPayload[] = island.nodes
      .filter((n) => n.type === 'busNode')
      .map((n) => {
        const d = n.data as BusNodeData;
        return {
          id: n.id,
          label: d.label,
          type: d.busType,
          v_nom_kv: d.v_nom,
          v_mag_pu: d.v_mag,
          v_ang_deg: d.v_ang,
          p_gen_mw: d.p_gen,
          q_gen_mvar: d.q_gen,
          p_load_mw: d.p_load,
          q_load_mvar: d.q_load,
          c_factor: d.c_factor ?? 1.1,
        };
      });

    return { island_id: island.id, buses, branches };
  });

  return { s_base_mva: S_BASE_MVA, islands: islandPayloads };
}

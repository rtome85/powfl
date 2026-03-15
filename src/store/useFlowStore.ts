import { create } from 'zustand';
import type { Node, Edge } from 'reactflow';
import type { BusNodeData, TransformerNodeData, TransmissionEdgeData, SelectedElement } from '../types';
import type { TopologyReport } from '../types/topology';
import { analyzeTopology } from '../utils/topologyEngine';
import { generatePowerFlowPayload } from '../utils/payloadGenerator';
import { postPowerFlow } from '../api/powerFlowApi';

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  selectedElement: SelectedElement;
  topologyReport: TopologyReport | null;
  simulationStatus: 'idle' | 'loading' | 'success' | 'error';
  simulationError: string | null;
  setNodes(nodes: Node[]): void;
  setEdges(edges: Edge[]): void;
  updateNodeData(id: string, data: Partial<BusNodeData | TransformerNodeData>): void;
  updateEdgeData(id: string, data: Partial<TransmissionEdgeData>): void;
  setSelectedElement(el: SelectedElement): void;
  runTopologyAnalysis(): void;
  runSimulation(): Promise<void>;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedElement: null,
  topologyReport: null,
  simulationStatus: 'idle',
  simulationError: null,
  setNodes: (nodes) =>
    set((state) => ({
      nodes,
      topologyReport: analyzeTopology(nodes, state.edges),
    })),
  setEdges: (edges) =>
    set((state) => ({
      edges,
      topologyReport: analyzeTopology(state.nodes, edges),
    })),
  updateNodeData: (id, data) =>
    set((state) => {
      const nodes = state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      );
      return { nodes, topologyReport: analyzeTopology(nodes, state.edges) };
    }),
  updateEdgeData: (id, data) =>
    set((state) => ({
      edges: state.edges.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, ...data } } : e
      ),
    })),
  setSelectedElement: (selectedElement) => set({ selectedElement }),
  runTopologyAnalysis: () =>
    set((state) => ({
      topologyReport: analyzeTopology(state.nodes, state.edges),
    })),
  runSimulation: async () => {
    const { topologyReport, nodes, edges } = get();
    if (!topologyReport?.isReadyForCalculation) return;
    set({ simulationStatus: 'loading', simulationError: null });
    try {
      const payload = generatePowerFlowPayload(
        topologyReport.islands,
        edges as Edge<TransmissionEdgeData>[],
        nodes
      );
      const result = await postPowerFlow(payload);
      if (result.status === 'error') {
        set({ simulationStatus: 'error', simulationError: result.message });
        return;
      }
      // Batch-apply all bus results in one set() to avoid N topology re-analyses
      set((state) => {
        const resultMap = new Map(
          result.islands.flatMap((i) => i.buses.map((b) => [b.id, b]))
        );
        const updatedNodes = state.nodes.map((n) => {
          const r = resultMap.get(n.id);
          return r
            ? { ...n, data: { ...n.data, v_mag: r.v_mag_pu, v_ang: r.v_ang_deg } }
            : n;
        });
        return {
          nodes: updatedNodes,
          topologyReport: analyzeTopology(updatedNodes, state.edges),
          simulationStatus: 'success' as const,
          simulationError: null,
        };
      });
    } catch (err) {
      set({
        simulationStatus: 'error',
        simulationError: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  },
}));

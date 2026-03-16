import { create } from 'zustand';
import type { Node, Edge } from 'reactflow';
import type { BusNodeData, TransformerNodeData, TransmissionEdgeData, SelectedElement } from '../types';
import type { TopologyReport } from '../types/topology';
import { analyzeTopology } from '../utils/topologyEngine';
import { generatePowerFlowPayload } from '../utils/payloadGenerator';
import { postPowerFlow, PowerFlowError } from '../api/powerFlowApi';

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  selectedElement: SelectedElement;
  topologyReport: TopologyReport | null;
  simulationStatus: 'idle' | 'loading' | 'success' | 'error';
  simulationError: string | null;
  errorElementIds: string[];
  isSimulated: boolean;
  fitViewRequested: boolean;
  snapshotVersion: number;
  setNodes(nodes: Node[]): void;
  setEdges(edges: Edge[]): void;
  updateNodeData(id: string, data: Partial<BusNodeData | TransformerNodeData>): void;
  updateEdgeData(id: string, data: Partial<TransmissionEdgeData>): void;
  setSelectedElement(el: SelectedElement): void;
  runTopologyAnalysis(): void;
  runSimulation(): Promise<void>;
  requestFitView(): void;
  clearFitView(): void;
  loadSnapshotData(nodes: Node[], edges: Edge[], simulationStatus: 'idle' | 'loading' | 'success' | 'error', isSimulated: boolean): void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedElement: null,
  topologyReport: null,
  simulationStatus: 'idle',
  simulationError: null,
  errorElementIds: [],
  isSimulated: false,
  fitViewRequested: false,
  snapshotVersion: 0,
  setNodes: (nodes) =>
    set((state) => ({
      nodes,
      topologyReport: analyzeTopology(nodes, state.edges),
      isSimulated: false,
      simulationStatus: 'idle',
      simulationError: null,
      errorElementIds: [],
    })),
  setEdges: (edges) =>
    set((state) => ({
      edges,
      topologyReport: analyzeTopology(state.nodes, edges),
      isSimulated: false,
      simulationStatus: 'idle',
      simulationError: null,
      errorElementIds: [],
    })),
  updateNodeData: (id, data) =>
    set((state) => {
      const nodes = state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      );
      return {
        nodes,
        topologyReport: analyzeTopology(nodes, state.edges),
        isSimulated: false,
        simulationStatus: 'idle' as const,
        simulationError: null,
        errorElementIds: [],
      };
    }),
  updateEdgeData: (id, data) =>
    set((state) => ({
      edges: state.edges.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, ...data } } : e
      ),
      isSimulated: false,
      simulationStatus: 'idle' as const,
      simulationError: null,
      errorElementIds: [],
    })),
  setSelectedElement: (selectedElement) => set({ selectedElement }),
  requestFitView: () => set({ fitViewRequested: true }),
  clearFitView: () => set({ fitViewRequested: false }),
  loadSnapshotData: (nodes, edges, simulationStatus, isSimulated) =>
    set((state) => ({
      nodes,
      edges,
      topologyReport: analyzeTopology(nodes, edges),
      simulationStatus,
      isSimulated,
      simulationError: null,
      errorElementIds: [],
      selectedElement: null,
      fitViewRequested: true,
      snapshotVersion: state.snapshotVersion + 1,
    })),
  runTopologyAnalysis: () =>
    set((state) => ({
      topologyReport: analyzeTopology(state.nodes, state.edges),
    })),
  runSimulation: async () => {
    const { topologyReport, nodes, edges } = get();
    if (!topologyReport?.isReadyForCalculation) return;
    set({ simulationStatus: 'loading', simulationError: null, errorElementIds: [], isSimulated: false });
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
      const unconverged = result.islands.filter((i) => !i.converged);
      if (unconverged.length > 0) {
        set({
          simulationStatus: 'error',
          simulationError: `Power flow did not converge for island(s): ${unconverged.map((i) => i.island_id).join(', ')}`,
        });
        return;
      }
      // Batch-apply all bus + branch results in one set()
      set((state) => {
        const busMap = new Map(
          result.islands.flatMap((i) => i.buses.map((b) => [b.id, b]))
        );
        const branchMap = new Map(
          result.islands.flatMap((i) => i.branches.map((br) => [br.branch_id, br]))
        );
        const updatedNodes = state.nodes.map((n) => {
          const r = busMap.get(n.id);
          return r
            ? { ...n, data: { ...n.data, v_mag: r.v_mag_pu, v_ang: r.v_ang_deg } }
            : n;
        });
        const updatedEdges = state.edges.map((e) => {
          const br = branchMap.get(e.id);
          return br
            ? {
                ...e,
                data: {
                  ...e.data,
                  p_from_mw: br.p_from_mw,
                  q_from_mvar: br.q_from_mvar,
                  p_to_mw: br.p_to_mw,
                  q_to_mvar: br.q_to_mvar,
                  loading_percent: br.loading_percent,
                },
              }
            : e;
        });
        return {
          nodes: updatedNodes,
          edges: updatedEdges,
          topologyReport: analyzeTopology(updatedNodes, updatedEdges),
          simulationStatus: 'success' as const,
          simulationError: null,
          isSimulated: true,
        };
      });
    } catch (err) {
      const errorElementIds = err instanceof PowerFlowError ? err.elementIds : [];
      set({
        simulationStatus: 'error',
        simulationError: err instanceof Error ? err.message : 'Unknown error',
        errorElementIds,
      });
    }
  },
}));

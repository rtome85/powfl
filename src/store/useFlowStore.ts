import { create } from 'zustand';
import type { Node, Edge } from 'reactflow';
import type { BusNodeData, TransformerNodeData, TransmissionEdgeData, SelectedElement } from '../types';
import type { TopologyReport } from '../types/topology';
import { analyzeTopology } from '../utils/topologyEngine';
import { generatePowerFlowPayload } from '../utils/payloadGenerator';
import { postPowerFlow, PowerFlowError } from '../api/powerFlowApi';
import { postShortCircuit } from '../api/shortCircuitApi';

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  selectedElement: SelectedElement;
  topologyReport: TopologyReport | null;
  simulationStatus: 'idle' | 'loading' | 'success' | 'error';
  simulationError: string | null;
  errorElementIds: string[];
  isSimulated: boolean;
  fitViewRequestId: number;
  snapshotVersion: number;
  // Short-circuit state
  scStatus: 'idle' | 'loading' | 'success' | 'error';
  scError: string | null;
  scFaultBusId: string | null;
  scReport: { ikss_ka: number; skss_mw: number } | null;
  setNodes(nodes: Node[]): void;
  setEdges(edges: Edge[]): void;
  updateNodeData(id: string, data: Partial<BusNodeData | TransformerNodeData>): void;
  updateEdgeData(id: string, data: Partial<TransmissionEdgeData>): void;
  setSelectedElement(el: SelectedElement): void;
  runTopologyAnalysis(): void;
  runSimulation(): Promise<void>;
  runShortCircuit(busId: string): Promise<void>;
  clearShortCircuit(): void;
  requestFitView(): void;
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
  fitViewRequestId: 0,
  snapshotVersion: 0,
  scStatus: 'idle',
  scError: null,
  scFaultBusId: null,
  scReport: null,
  setNodes: (nodes) =>
    set((state) => ({
      nodes,
      topologyReport: analyzeTopology(nodes, state.edges),
      isSimulated: false,
      simulationStatus: 'idle',
      simulationError: null,
      errorElementIds: [],
      scStatus: 'idle',
      scError: null,
      scFaultBusId: null,
      scReport: null,
    })),
  setEdges: (edges) =>
    set((state) => ({
      edges,
      topologyReport: analyzeTopology(state.nodes, edges),
      isSimulated: false,
      simulationStatus: 'idle',
      simulationError: null,
      errorElementIds: [],
      scStatus: 'idle',
      scError: null,
      scFaultBusId: null,
      scReport: null,
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
        scStatus: 'idle' as const,
        scError: null,
        scFaultBusId: null,
        scReport: null,
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
      scStatus: 'idle' as const,
      scError: null,
      scFaultBusId: null,
      scReport: null,
    })),
  setSelectedElement: (selectedElement) => set({ selectedElement }),
  requestFitView: () => set((state) => ({ fitViewRequestId: state.fitViewRequestId + 1 })),
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
      fitViewRequestId: state.fitViewRequestId + 1,
      snapshotVersion: state.snapshotVersion + 1,
      scStatus: 'idle',
      scError: null,
      scFaultBusId: null,
      scReport: null,
    })),
  runTopologyAnalysis: () =>
    set((state) => ({
      topologyReport: analyzeTopology(state.nodes, state.edges),
    })),
  runSimulation: async () => {
    const { topologyReport, nodes, edges } = get();
    if (!topologyReport?.isReadyForCalculation) return;
    set({
      simulationStatus: 'loading',
      simulationError: null,
      errorElementIds: [],
      isSimulated: false,
      scStatus: 'idle',
      scError: null,
      scFaultBusId: null,
      scReport: null,
    });
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
  runShortCircuit: async (busId: string) => {
    const { topologyReport, nodes, edges } = get();
    if (!topologyReport?.isReadyForCalculation) return;
    set({ scStatus: 'loading', scError: null, scFaultBusId: busId, scReport: null });
    try {
      const payload = generatePowerFlowPayload(
        topologyReport.islands,
        edges as Edge<TransmissionEdgeData>[],
        nodes
      );
      const result = await postShortCircuit({
        s_base_mva: payload.s_base_mva,
        fault_bus_id: busId,
        islands: payload.islands,
      });
      if (result.status === 'error') {
        set({ scStatus: 'error', scError: result.message, scFaultBusId: null });
        return;
      }
      // Map SC results onto nodes and edges
      const busResultMap = new Map(result.bus_results.map((b) => [b.id, b]));
      const branchResultMap = new Map(result.branch_results.map((br) => [br.branch_id, br]));
      set((state) => {
        const updatedNodes = state.nodes.map((n) => {
          const scBus = busResultMap.get(n.id);
          return scBus
            ? { ...n, data: { ...n.data, ikss_ka: scBus.ikss_ka } }
            : n;
        });
        // Build set of transformer node IDs for edge mapping
        const txNodeIds = new Set(
          state.nodes.filter((n) => n.type === 'transformerNode').map((n) => n.id)
        );
        const updatedEdges = state.edges.map((e) => {
          // Direct match for line edges (branch_id == edge id)
          let scBranch = branchResultMap.get(e.id);
          // For transformer edges: the branch_id is the transformer node id,
          // so check if source or target is a transformer with a result
          if (!scBranch) {
            if (txNodeIds.has(e.source)) scBranch = branchResultMap.get(e.source);
            if (!scBranch && txNodeIds.has(e.target)) scBranch = branchResultMap.get(e.target);
          }
          return scBranch
            ? { ...e, data: { ...e.data, ikss_ka: scBranch.ikss_ka } }
            : e;
        });
        return {
          nodes: updatedNodes,
          edges: updatedEdges,
          scStatus: 'success' as const,
          scFaultBusId: busId,
          scReport: { ikss_ka: result.ikss_ka, skss_mw: result.skss_mw },
        };
      });
    } catch (err) {
      set({
        scStatus: 'error',
        scError: err instanceof Error ? err.message : 'Unknown error',
        scFaultBusId: null,
      });
    }
  },
  clearShortCircuit: () =>
    set((state) => {
      const updatedNodes = state.nodes.map((n) => {
        if (n.data?.ikss_ka !== undefined || n.data?.skss_mw !== undefined) {
          const { ikss_ka, skss_mw, ...rest } = n.data;
          return { ...n, data: rest };
        }
        return n;
      });
      const updatedEdges = state.edges.map((e) => {
        if (e.data?.ikss_ka !== undefined) {
          const { ikss_ka, ...rest } = e.data;
          return { ...e, data: rest };
        }
        return e;
      });
      return {
        nodes: updatedNodes,
        edges: updatedEdges,
        scStatus: 'idle' as const,
        scError: null,
        scFaultBusId: null,
        scReport: null,
      };
    }),
}));

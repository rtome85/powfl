import { create } from 'zustand';
import type { Node, Edge } from 'reactflow';
import type { BusNodeData, TransformerNodeData, TransmissionEdgeData, SelectedElement } from '../types';

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  selectedElement: SelectedElement;
  setNodes(nodes: Node[]): void;
  setEdges(edges: Edge[]): void;
  updateNodeData(id: string, data: Partial<BusNodeData | TransformerNodeData>): void;
  updateEdgeData(id: string, data: Partial<TransmissionEdgeData>): void;
  setSelectedElement(el: SelectedElement): void;
}

export const useFlowStore = create<FlowState>((set) => ({
  nodes: [],
  edges: [],
  selectedElement: null,
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  updateNodeData: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    })),
  updateEdgeData: (id, data) =>
    set((state) => ({
      edges: state.edges.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, ...data } } : e
      ),
    })),
  setSelectedElement: (selectedElement) => set({ selectedElement }),
}));

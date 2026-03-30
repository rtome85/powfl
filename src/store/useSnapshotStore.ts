import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Node, Edge } from 'reactflow';
import { useFlowStore } from './useFlowStore';

export interface Snapshot {
  id: string;
  name: string;
  createdAt: string;
  nodes: Node[];
  edges: Edge[];
  simulationStatus: 'idle' | 'loading' | 'success' | 'error';
  isSimulated: boolean;
}

interface SnapshotState {
  snapshots: Snapshot[];
  saveSnapshot(name: string): void;
  loadSnapshot(id: string): void;
  deleteSnapshot(id: string): void;
  exportSnapshot(id: string): void;
  importSnapshot(data: Snapshot): void;
}

export const useSnapshotStore = create<SnapshotState>()(
  persist(
    (set, get) => ({
      snapshots: [],

      saveSnapshot: (name: string) => {
        const { nodes, edges, simulationStatus, isSimulated } =
          useFlowStore.getState();
        const snapshot: Snapshot = {
          id: crypto.randomUUID(),
          name,
          createdAt: new Date().toISOString(),
          nodes: structuredClone(nodes),
          edges: structuredClone(edges),
          simulationStatus,
          isSimulated,
        };
        set((state) => ({ snapshots: [...state.snapshots, snapshot] }));
      },

      loadSnapshot: (id: string) => {
        const snapshot = get().snapshots.find((s) => s.id === id);
        if (!snapshot) return;
        const { loadSnapshotData } = useFlowStore.getState();
        loadSnapshotData(
          structuredClone(snapshot.nodes),
          structuredClone(snapshot.edges),
          snapshot.simulationStatus,
          snapshot.isSimulated
        );
      },

      deleteSnapshot: (id: string) => {
        set((state) => ({
          snapshots: state.snapshots.filter((s) => s.id !== id),
        }));
      },

      importSnapshot: (data: Snapshot) => {
        const snapshot: Snapshot = {
          ...data,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ snapshots: [...state.snapshots, snapshot] }));
      },

      exportSnapshot: (id: string) => {
        const snapshot = get().snapshots.find((s) => s.id === id);
        if (!snapshot) return;
        const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${snapshot.name.replace(/[^a-z0-9]/gi, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
    }),
    { name: 'powfl-snapshots' }
  )
);

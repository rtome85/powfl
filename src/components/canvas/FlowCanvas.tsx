import { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type OnSelectionChangeParams,
} from 'reactflow';
import { useFlowStore } from '../../store/useFlowStore';
import BusNode from '../nodes/BusNode';
import TransformerNode from '../nodes/TransformerNode';
import TransmissionEdge from '../edges/TransmissionEdge';
import {
  createBusNode,
  createTransformerNode,
  createLoadNode,
  createGeneratorNode,
} from '../../utils/nodeFactory';
import type { BusNodeData, DragPayload, TransmissionEdgeData } from '../../types';
import NetworkStatus from './NetworkStatus';

const nodeTypes = {
  busNode: BusNode,
  transformerNode: TransformerNode,
};

const edgeTypes = {
  transmissionEdge: TransmissionEdge,
};

const defaultEdgeData: TransmissionEdgeData = {
  label: 'Line',
  r: 0,
  x: 0,
  b: 0,
  rating_mva: 100,
};

export default function FlowCanvas() {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const storeNodes = useFlowStore((s) => s.nodes);
  const storeEdges = useFlowStore((s) => s.edges);
  const setStoreNodes = useFlowStore((s) => s.setNodes);
  const setStoreEdges = useFlowStore((s) => s.setEdges);
  const setSelectedElement = useFlowStore((s) => s.setSelectedElement);
  const fitViewRequestId = useFlowStore((s) => s.fitViewRequestId);
  const snapshotVersion = useFlowStore((s) => s.snapshotVersion);
  const prevSnapshotVersion = useRef(snapshotVersion);
  const prevFitViewRequestId = useRef(fitViewRequestId);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);

  // Full replacement when a snapshot is loaded
  useEffect(() => {
    if (snapshotVersion !== prevSnapshotVersion.current) {
      prevSnapshotVersion.current = snapshotVersion;
      setRfNodes(structuredClone(storeNodes));
      setRfEdges(structuredClone(storeEdges));
      return;
    }
    // Sync data from Zustand → RF (data only, never position/layout)
    setRfNodes((rfNds) =>
      rfNds.map((rfN) => {
        const s = storeNodes.find((n) => n.id === rfN.id);
        return s ? { ...rfN, data: s.data } : rfN;
      })
    );
    setRfEdges((rfEds) =>
      rfEds.map((rfE) => {
        const s = storeEdges.find((e) => e.id === rfE.id);
        return s ? { ...rfE, data: s.data } : rfE;
      })
    );
  }, [storeNodes, storeEdges, snapshotVersion, setRfNodes, setRfEdges]);

  // FitView on request (reacts to counter changes)
  useEffect(() => {
    if (fitViewRequestId !== prevFitViewRequestId.current) {
      prevFitViewRequestId.current = fitViewRequestId;
      // Small delay to let RF render the new nodes first
      const timer = setTimeout(() => {
        fitView({ padding: 0.2 });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [fitViewRequestId, fitView]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        id: `edge-${Date.now()}`,
        type: 'transmissionEdge',
        data: { ...defaultEdgeData },
      };
      setRfEdges((eds) => {
        const updated = addEdge(newEdge, eds);
        setStoreEdges(updated);
        return updated;
      });
    },
    [setRfEdges, setStoreEdges]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData('application/powfl');
      if (!raw) return;
      const payload: DragPayload & { nodeVariant?: string } = JSON.parse(raw);
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      let newNode;
      if (payload.nodeVariant === 'load') {
        newNode = createLoadNode(position);
      } else if (payload.nodeVariant === 'generator') {
        newNode = createGeneratorNode(position);
      } else if (payload.nodeType === 'transformerNode') {
        newNode = createTransformerNode(position);
      } else {
        newNode = createBusNode(position);
      }

      setRfNodes((nds) => {
        const updated = [...nds, newNode];
        setStoreNodes(updated);
        return updated;
      });
    },
    [screenToFlowPosition, setRfNodes, setStoreNodes]
  );

  const onNodeDragStop = useCallback(() => {
    setRfNodes((nds) => {
      setStoreNodes(nds);
      return nds;
    });
  }, [setRfNodes, setStoreNodes]);

  const onSelectionChange = useCallback(
    ({ nodes, edges }: OnSelectionChangeParams) => {
      if (nodes.length === 1) {
        setSelectedElement({
          kind: 'node',
          id: nodes[0].id,
          nodeType: nodes[0].type as 'busNode' | 'transformerNode',
        });
      } else if (edges.length === 1) {
        setSelectedElement({ kind: 'edge', id: edges[0].id });
      } else {
        setSelectedElement(null);
      }
    },
    [setSelectedElement]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  const isValidConnection = useCallback(
    (connection: Connection): boolean => {
      const { source, target } = connection;
      if (source === target) return false;

      const sourceNode = rfNodes.find((n) => n.id === source);
      const targetNode = rfNodes.find((n) => n.id === target);
      if (!sourceNode || !targetNode) return false;

      // At least one endpoint must be a true bus (not a load/generator variant)
      const isTrueBus = (n: typeof sourceNode) => {
        const data = n.data as BusNodeData;
        return n.type === 'busNode' && data?.variant !== 'load' && data?.variant !== 'generator';
      };
      if (!isTrueBus(sourceNode) && !isTrueBus(targetNode)) return false;

      // load/generator variant → max 1 connection
      for (const node of [sourceNode, targetNode]) {
        const data = node.data as BusNodeData;
        if (data?.variant === 'load' || data?.variant === 'generator') {
          const degree = rfEdges.filter(
            (e) => e.source === node.id || e.target === node.id
          ).length;
          if (degree >= 1) return false;
        }
      }

      return true;
    },
    [rfNodes, rfEdges]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        isValidConnection={isValidConnection}
        fitView
        deleteKeyCode="Delete"
      >
        <Background variant={BackgroundVariant.Dots} />
        <Controls />
        <MiniMap />
        <NetworkStatus />
      </ReactFlow>
    </div>
  );
}

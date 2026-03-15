import { useCallback, useEffect } from 'react';
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
import type { DragPayload, TransmissionEdgeData } from '../../types';

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
  const { screenToFlowPosition } = useReactFlow();
  const storeNodes = useFlowStore((s) => s.nodes);
  const setStoreNodes = useFlowStore((s) => s.setNodes);
  const setStoreEdges = useFlowStore((s) => s.setEdges);
  const setSelectedElement = useFlowStore((s) => s.setSelectedElement);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);

  // Sync data from Zustand → RF (data only, never position)
  useEffect(() => {
    setRfNodes((rfNds) =>
      rfNds.map((rfN) => {
        const s = storeNodes.find((n) => n.id === rfN.id);
        return s ? { ...rfN, data: s.data } : rfN;
      })
    );
  }, [storeNodes, setRfNodes]);

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
        fitView
        deleteKeyCode="Delete"
      >
        <Background variant={BackgroundVariant.Dots} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

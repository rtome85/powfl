import { useFlowStore } from '../../store/useFlowStore';
import BusProperties from '../properties/BusProperties';
import TransformerProperties from '../properties/TransformerProperties';
import EdgeProperties from '../properties/EdgeProperties';
import type { BusNodeData, TransformerNodeData, TransmissionEdgeData } from '../../types';
import type { Node, Edge } from 'reactflow';

export default function PropertiesPanel() {
  const selectedElement = useFlowStore((s) => s.selectedElement);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Properties</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {!selectedElement && (
          <p className="text-xs text-gray-400 text-center mt-8">
            Select a node or edge to view properties
          </p>
        )}
        {selectedElement?.kind === 'node' && selectedElement.nodeType === 'busNode' && (() => {
          const node = nodes.find((n) => n.id === selectedElement.id) as Node<BusNodeData> | undefined;
          return node ? <BusProperties node={node} /> : null;
        })()}
        {selectedElement?.kind === 'node' && selectedElement.nodeType === 'transformerNode' && (() => {
          const node = nodes.find((n) => n.id === selectedElement.id) as Node<TransformerNodeData> | undefined;
          return node ? <TransformerProperties node={node} /> : null;
        })()}
        {selectedElement?.kind === 'edge' && (() => {
          const edge = edges.find((e) => e.id === selectedElement.id) as Edge<TransmissionEdgeData> | undefined;
          return edge ? <EdgeProperties edge={edge} /> : null;
        })()}
      </div>
    </div>
  );
}

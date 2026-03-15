import { MousePointerClick } from 'lucide-react';
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
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Properties</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!selectedElement && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 px-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <MousePointerClick size={18} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Nothing selected</p>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                Click a node or edge to inspect and edit its parameters
              </p>
            </div>
          </div>
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

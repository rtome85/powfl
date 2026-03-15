import { Zap, Repeat, Plug, Wind } from 'lucide-react';
import type { DragPayload } from '../../types';

interface ToolboxItem {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  payload: DragPayload & { nodeVariant?: string };
}

const items: ToolboxItem[] = [
  { label: 'Bus', icon: Zap, payload: { nodeType: 'busNode' } },
  { label: 'Transformer', icon: Repeat, payload: { nodeType: 'transformerNode' } },
  { label: 'Load', icon: Plug, payload: { nodeType: 'busNode', nodeVariant: 'load' } },
  { label: 'Generator', icon: Wind, payload: { nodeType: 'busNode', nodeVariant: 'generator' } },
];

export default function Toolbox() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Components</h2>
      </div>
      <div className="flex flex-col gap-2 p-3">
        {items.map(({ label, icon: Icon, payload }) => (
          <div
            key={label}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/powfl', JSON.stringify(payload));
              e.dataTransfer.effectAllowed = 'move';
            }}
            className="flex items-center gap-2 px-3 py-2.5 rounded border border-gray-200 bg-white cursor-grab hover:bg-blue-50 hover:border-blue-300 active:cursor-grabbing transition-colors select-none"
          >
            <Icon size={16} className="text-gray-600" />
            <span className="text-sm text-gray-700">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

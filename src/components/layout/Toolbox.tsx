import { Zap, Repeat2, Plug, Wind } from 'lucide-react';
import type { DragPayload } from '../../types';

interface ToolboxItem {
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  payload: DragPayload & { nodeVariant?: string };
  color: string;
  iconBg: string;
}

const items: ToolboxItem[] = [
  {
    label: 'Bus',
    description: 'Network bus node',
    icon: Zap,
    payload: { nodeType: 'busNode' },
    color: 'text-slate-600',
    iconBg: 'bg-slate-100',
  },
  {
    label: 'Transformer',
    description: 'Voltage transformer',
    icon: Repeat2,
    payload: { nodeType: 'transformerNode' },
    color: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
  {
    label: 'Load',
    description: 'Power consumer',
    icon: Plug,
    payload: { nodeType: 'busNode', nodeVariant: 'load' },
    color: 'text-orange-600',
    iconBg: 'bg-orange-50',
  },
  {
    label: 'Generator',
    description: 'Power source (PV)',
    icon: Wind,
    payload: { nodeType: 'busNode', nodeVariant: 'generator' },
    color: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
  },
];

export default function Toolbox() {
  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Components</p>
      </div>
      <div className="flex flex-col gap-1 px-2 pb-4">
        {items.map(({ label, description, icon: Icon, payload, color, iconBg }) => (
          <div
            key={label}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/powfl', JSON.stringify(payload));
              e.dataTransfer.effectAllowed = 'move';
            }}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-grab hover:bg-gray-50 active:cursor-grabbing active:bg-gray-100 transition-all duration-100 select-none border border-transparent hover:border-gray-200"
          >
            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
              <Icon size={15} className={color} strokeWidth={2} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-gray-800 leading-tight">{label}</span>
              <span className="text-[11px] text-gray-400 leading-tight truncate">{description}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto px-4 pb-4 pt-2 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 leading-relaxed">
          Drag components onto the canvas to build your network.
        </p>
      </div>
    </div>
  );
}

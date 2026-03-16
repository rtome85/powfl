import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { TransformerNodeData } from '../../types';
import { useFlowStore } from '../../store/useFlowStore';

function TransformerNode({ id, data, selected }: NodeProps<TransformerNodeData>) {
  const hasError = useFlowStore((s) => s.errorElementIds.includes(id));

  const borderClass = hasError ? 'border-red-500' : 'border-violet-400';
  const bgClass = hasError ? 'bg-red-50' : 'bg-white';

  return (
    <div
      className={`relative flex flex-col items-center px-3 py-2.5 ${bgClass} rounded-xl border-2 ${borderClass} w-[130px] transition-shadow ${
        selected
          ? 'shadow-lg shadow-violet-100 ring-2 ring-indigo-400 ring-offset-1'
          : 'shadow-sm hover:shadow-md shadow-violet-50'
      }`}
    >
      <Handle type="target" position={Position.Top} />

      <span className="text-xs font-semibold text-gray-900 mb-2 leading-none">{data.label}</span>

      {/* Transformer symbol */}
      <svg width="44" height="52" viewBox="0 0 44 52" fill="none">
        {/* Windings hint lines */}
        <line x1="22" y1="0" x2="22" y2="6" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="22" y1="46" x2="22" y2="52" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
        {/* Primary coil */}
        <circle cx="22" cy="16" r="10" stroke="#8b5cf6" strokeWidth="2" />
        {/* Core line */}
        <line x1="11" y1="26" x2="33" y2="26" stroke="#c4b5fd" strokeWidth="1" strokeDasharray="2 2" />
        {/* Secondary coil */}
        <circle cx="22" cy="36" r="10" stroke="#7c3aed" strokeWidth="2" />
      </svg>

      <div className="flex items-center gap-1 mt-2">
        <span className="text-[10px] font-mono text-gray-500">{data.v_primary}kV</span>
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
          <path d="M0 4h10M7 1l3 3-3 3" stroke="#8b5cf6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[10px] font-mono text-gray-500">{data.v_secondary}kV</span>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default memo(TransformerNode);

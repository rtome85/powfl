import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { TransformerNodeData } from '../../types';

function TransformerNode({ data, selected }: NodeProps<TransformerNodeData>) {
  return (
    <div
      className={`flex flex-col items-center px-2 py-1 bg-white rounded border-2 border-purple-500 ${
        selected ? 'shadow-lg ring-2 ring-offset-1 ring-blue-300' : 'shadow'
      } w-[120px]`}
    >
      <Handle type="target" position={Position.Top} />
      <span className="text-xs font-semibold text-gray-800 mb-1">{data.label}</span>
      <svg width="48" height="56" viewBox="0 0 48 56">
        <circle cx="24" cy="16" r="13" fill="none" stroke="#7c3aed" strokeWidth="2" />
        <circle cx="24" cy="40" r="13" fill="none" stroke="#7c3aed" strokeWidth="2" />
      </svg>
      <div className="text-[10px] text-gray-500 mt-1">
        {data.v_primary}kV → {data.v_secondary}kV
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default memo(TransformerNode);

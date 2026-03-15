import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { BusNodeData } from '../../types';

const busTypeColors: Record<string, string> = {
  Slack: 'border-amber-500',
  PV: 'border-blue-500',
  PQ: 'border-slate-400',
};

const busTypeBadgeColors: Record<string, string> = {
  Slack: 'bg-amber-100 text-amber-800',
  PV: 'bg-blue-100 text-blue-800',
  PQ: 'bg-slate-100 text-slate-700',
};

function BusNode({ data, selected }: NodeProps<BusNodeData>) {
  const borderColor = busTypeColors[data.busType] ?? 'border-slate-400';
  const badgeColor = busTypeBadgeColors[data.busType] ?? 'bg-slate-100 text-slate-700';

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 bg-white rounded border-2 ${borderColor} ${
        selected ? 'shadow-lg ring-2 ring-offset-1 ring-blue-300' : 'shadow'
      } min-w-[140px]`}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex flex-col gap-0.5 flex-1">
        <span className="text-xs font-semibold text-gray-800 leading-tight">{data.label}</span>
        <div className="flex items-center gap-1">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badgeColor}`}>
            {data.busType}
          </span>
          <span className="text-[10px] text-gray-500">|V|={data.v_mag.toFixed(3)}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(BusNode);

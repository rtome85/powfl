import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { BusNodeData } from '../../types';

const typeConfig: Record<string, { border: string; badge: string; dot: string; glow: string }> = {
  Slack: {
    border: 'border-amber-400',
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    dot: 'bg-amber-400',
    glow: 'shadow-amber-100',
  },
  PV: {
    border: 'border-blue-400',
    badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    dot: 'bg-blue-400',
    glow: 'shadow-blue-100',
  },
  PQ: {
    border: 'border-slate-300',
    badge: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
    dot: 'bg-slate-400',
    glow: 'shadow-slate-100',
  },
};

function BusNode({ data, selected }: NodeProps<BusNodeData>) {
  const cfg = typeConfig[data.busType] ?? typeConfig.PQ;

  return (
    <div
      className={`relative flex items-center gap-2.5 px-3 py-2.5 bg-white rounded-xl border-2 ${cfg.border} min-w-[160px] transition-shadow ${
        selected
          ? `shadow-lg ${cfg.glow} ring-2 ring-indigo-400 ring-offset-1`
          : `shadow-sm hover:shadow-md ${cfg.glow}`
      }`}
    >
      <Handle type="target" position={Position.Left} />

      {/* Color accent dot */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />

      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <span className="text-xs font-semibold text-gray-900 leading-none truncate">{data.label}</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${cfg.badge}`}>
            {data.busType}
          </span>
          <span className="text-[10px] font-mono text-gray-400">
            {data.v_mag.toFixed(3)} pu
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(BusNode);

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { BusNodeData } from '../../types';
import { useFlowStore } from '../../store/useFlowStore';

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

/** Return a voltage-based border color when simulation results are available. */
function getVoltageBorder(v_mag: number, isSimulated: boolean): string | null {
  if (!isSimulated) return null;
  if (v_mag < 0.95) return 'border-red-500';
  if (v_mag > 1.05) return 'border-yellow-500';
  return 'border-green-500';
}

function getVoltageDot(v_mag: number, isSimulated: boolean): string | null {
  if (!isSimulated) return null;
  if (v_mag < 0.95) return 'bg-red-500';
  if (v_mag > 1.05) return 'bg-yellow-500';
  return 'bg-green-500';
}

function BusNode({ id, data, selected }: NodeProps<BusNodeData>) {
  const cfg = typeConfig[data.busType] ?? typeConfig.PQ;
  const isSimulated = useFlowStore((s) => s.isSimulated);
  const hasError = useFlowStore((s) => s.errorElementIds.includes(id));
  const scFaultBusId = useFlowStore((s) => s.scFaultBusId);

  const isFaulted = scFaultBusId === id;
  const isScActive = scFaultBusId !== null;

  const borderClass = isFaulted
    ? 'border-red-500'
    : hasError
      ? 'border-red-500'
      : getVoltageBorder(data.v_mag, isSimulated) ?? cfg.border;
  const dotClass = isFaulted
    ? 'bg-red-500'
    : hasError
      ? 'bg-red-500'
      : getVoltageDot(data.v_mag, isSimulated) ?? cfg.dot;
  const bgClass = isFaulted ? 'bg-red-50' : hasError ? 'bg-red-50' : 'bg-white';

  return (
    <div
      className={`relative flex items-center gap-2.5 px-3 py-2.5 ${bgClass} rounded-xl border-2 ${borderClass} min-w-[160px] transition-shadow ${
        isFaulted
          ? 'animate-fault-pulse'
          : selected
            ? `shadow-lg ${cfg.glow} ring-2 ring-indigo-400 ring-offset-1`
            : `shadow-sm hover:shadow-md ${cfg.glow}`
      }`}
    >
      <Handle type="target" position={Position.Left} />

      {/* Fault lightning icon — positioned top-right, overlapping the node */}
      {isFaulted && (
        <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-red-600 flex items-center justify-center shadow-lg animate-fault-pulse z-10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="rgba(255,255,255,0.3)" />
          </svg>
        </div>
      )}

      {/* Color accent dot */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />

      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <span className="text-xs font-semibold text-gray-900 leading-none truncate">{data.label}</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${cfg.badge}`}>
            {data.busType}
          </span>
          {isScActive && data.ikss_ka != null ? (
            <span className="text-[10px] font-mono text-red-600 font-semibold">
              {data.ikss_ka.toFixed(2)} kA
            </span>
          ) : (
            <span className="text-[10px] font-mono text-gray-400">
              {data.v_mag.toFixed(3)} pu
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(BusNode);

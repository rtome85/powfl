import { memo } from 'react';
import {
  getBezierPath,
  EdgeLabelRenderer,
  type EdgeProps,
} from 'reactflow';
import type { TransmissionEdgeData } from '../../types';
import { useFlowStore } from '../../store/useFlowStore';

function getLoadingColor(loading: number): string {
  if (loading >= 100) return '#ef4444'; // red-500
  if (loading >= 80) return '#f59e0b';  // amber-500
  return '#22c55e';                      // green-500
}

function TransmissionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<TransmissionEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isSimulated = useFlowStore((s) => s.isSimulated);
  const hasError = useFlowStore((s) => s.errorElementIds.includes(id));
  const scFaultBusId = useFlowStore((s) => s.scFaultBusId);

  const isScActive = scFaultBusId !== null;
  const hasScResult = isScActive && data?.ikss_ka != null;
  // Any edge carrying SC current is feeding the fault
  const feedsFault = hasScResult && (data?.ikss_ka ?? 0) > 0;

  const hasResults = isSimulated && data?.loading_percent != null;
  const strokeColor = hasError
    ? '#ef4444'
    : feedsFault
      ? '#60a5fa' // electric blue for feeding edges
      : isScActive
        ? '#94a3b8'
        : hasResults
          ? getLoadingColor(data!.loading_percent!)
          : selected
            ? '#6366f1'
            : '#94a3b8';

  return (
    <>
      {/* Glow layer for feeding edges in SC mode */}
      {feedsFault && (
        <path
          d={edgePath}
          strokeWidth={10}
          stroke="#60a5fa"
          fill="none"
          strokeOpacity={0.25}
          strokeLinecap="round"
        />
      )}
      {/* Glow layer when selected */}
      {selected && !isScActive && (
        <path
          d={edgePath}
          strokeWidth={8}
          stroke="#6366f1"
          fill="none"
          strokeOpacity={0.15}
          strokeLinecap="round"
        />
      )}
      <path
        id={id}
        className={`react-flow__edge-path${feedsFault ? ' animate-fault-flow' : ''}`}
        d={edgePath}
        strokeWidth={feedsFault ? 3.5 : selected ? 2.5 : 1.8}
        stroke={strokeColor}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={feedsFault ? '8 8' : undefined}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={`nodrag nopan rounded-lg px-2 py-1 text-[10px] font-mono shadow-sm transition-colors ${
            hasError
              ? 'bg-red-50 text-red-700 ring-1 ring-red-300'
              : feedsFault
                ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-300 font-semibold'
                : isScActive
                  ? 'bg-white text-gray-500 ring-1 ring-gray-200'
                  : selected
                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                    : 'bg-white text-gray-500 ring-1 ring-gray-200'
          }`}
        >
          {hasScResult ? (
            <span>{data!.ikss_ka!.toFixed(2)} kA</span>
          ) : hasResults ? (
            <span>
              P={Math.abs(data!.p_from_mw!).toFixed(1)} MW · {data!.loading_percent!.toFixed(1)}%
            </span>
          ) : (
            <span>R={data?.r ?? 0} · X={data?.x ?? 0}</span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(TransmissionEdge);

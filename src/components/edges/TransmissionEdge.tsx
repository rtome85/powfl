import { memo } from 'react';
import {
  getBezierPath,
  EdgeLabelRenderer,
  type EdgeProps,
} from 'reactflow';
import type { TransmissionEdgeData } from '../../types';

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

  return (
    <>
      {/* Glow layer when selected */}
      {selected && (
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
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={selected ? 2.5 : 1.8}
        stroke={selected ? '#6366f1' : '#94a3b8'}
        fill="none"
        strokeLinecap="round"
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={`nodrag nopan rounded-lg px-2 py-1 text-[10px] font-mono shadow-sm transition-colors ${
            selected
              ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
              : 'bg-white text-gray-500 ring-1 ring-gray-200'
          }`}
        >
          R={data?.r ?? 0} · X={data?.x ?? 0}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(TransmissionEdge);

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
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={selected ? 2.5 : 1.5}
        stroke={selected ? '#2563eb' : '#64748b'}
        fill="none"
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-gray-600 shadow-sm"
        >
          R={data?.r ?? 0} X={data?.x ?? 0}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(TransmissionEdge);

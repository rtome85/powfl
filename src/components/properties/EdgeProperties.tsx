import type { Edge } from 'reactflow';
import type { TransmissionEdgeData } from '../../types';
import { useFlowStore } from '../../store/useFlowStore';

interface Props {
  edge: Edge<TransmissionEdgeData>;
}

export default function EdgeProperties({ edge }: Props) {
  const updateEdgeData = useFlowStore((s) => s.updateEdgeData);
  const { data, id } = edge;

  const update = (patch: Partial<TransmissionEdgeData>) => updateEdgeData(id, patch);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Line Properties</h3>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Label</span>
        <input
          className="border rounded px-2 py-1 text-sm"
          value={data?.label ?? ''}
          onChange={(e) => update({ label: e.target.value })}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Resistance R (pu)</span>
        <input
          type="number"
          step="0.001"
          className="border rounded px-2 py-1 text-sm"
          value={data?.r ?? 0}
          onChange={(e) => update({ r: parseFloat(e.target.value) || 0 })}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Reactance X (pu)</span>
        <input
          type="number"
          step="0.001"
          className="border rounded px-2 py-1 text-sm"
          value={data?.x ?? 0}
          onChange={(e) => update({ x: parseFloat(e.target.value) || 0 })}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Susceptance B (pu)</span>
        <input
          type="number"
          step="0.001"
          className="border rounded px-2 py-1 text-sm"
          value={data?.b ?? 0}
          onChange={(e) => update({ b: parseFloat(e.target.value) || 0 })}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Rating (MVA)</span>
        <input
          type="number"
          className="border rounded px-2 py-1 text-sm"
          value={data?.rating_mva ?? 0}
          onChange={(e) => update({ rating_mva: parseFloat(e.target.value) || 0 })}
        />
      </label>
    </div>
  );
}

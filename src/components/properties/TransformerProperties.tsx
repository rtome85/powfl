import type { Node } from 'reactflow';
import type { TransformerNodeData } from '../../types';
import { useFlowStore } from '../../store/useFlowStore';

interface Props {
  node: Node<TransformerNodeData>;
}

export default function TransformerProperties({ node }: Props) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const { data, id } = node;

  const update = (patch: Partial<TransformerNodeData>) => updateNodeData(id, patch);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Transformer Properties</h3>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Label</span>
        <input
          className="border rounded px-2 py-1 text-sm"
          value={data.label}
          onChange={(e) => update({ label: e.target.value })}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Primary Voltage (kV)</span>
        <input
          type="number"
          className="border rounded px-2 py-1 text-sm"
          value={data.v_primary}
          onChange={(e) => update({ v_primary: parseFloat(e.target.value) || 0 })}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Secondary Voltage (kV)</span>
        <input
          type="number"
          className="border rounded px-2 py-1 text-sm"
          value={data.v_secondary}
          onChange={(e) => update({ v_secondary: parseFloat(e.target.value) || 0 })}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Rating (MVA)</span>
        <input
          type="number"
          className="border rounded px-2 py-1 text-sm"
          value={data.rating_mva}
          onChange={(e) => update({ rating_mva: parseFloat(e.target.value) || 0 })}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Tap Ratio</span>
        <input
          type="number"
          step="0.01"
          className="border rounded px-2 py-1 text-sm"
          value={data.tap_ratio}
          onChange={(e) => update({ tap_ratio: parseFloat(e.target.value) || 0 })}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Reactance (pu)</span>
        <input
          type="number"
          step="0.001"
          className="border rounded px-2 py-1 text-sm"
          value={data.x_pu}
          onChange={(e) => update({ x_pu: parseFloat(e.target.value) || 0 })}
        />
      </label>
    </div>
  );
}

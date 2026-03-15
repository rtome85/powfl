import type { Node } from 'reactflow';
import type { BusNodeData, BusType } from '../../types';
import { useFlowStore } from '../../store/useFlowStore';

interface Props {
  node: Node<BusNodeData>;
}

const busTypes: BusType[] = ['Slack', 'PV', 'PQ'];

export default function BusProperties({ node }: Props) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const { data, id } = node;

  const update = (patch: Partial<BusNodeData>) => updateNodeData(id, patch);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Bus Properties</h3>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Label</span>
        <input
          className="border rounded px-2 py-1 text-sm"
          value={data.label}
          onChange={(e) => update({ label: e.target.value })}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Bus Type</span>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={data.busType}
          onChange={(e) => update({ busType: e.target.value as BusType })}
        >
          {busTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Nominal Voltage (kV)</span>
        <input
          type="number"
          className="border rounded px-2 py-1 text-sm"
          value={data.v_nom}
          onChange={(e) => update({ v_nom: parseFloat(e.target.value) || 0 })}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Voltage Magnitude (pu)</span>
        <input
          type="number"
          step="0.001"
          className="border rounded px-2 py-1 text-sm"
          value={data.v_mag}
          onChange={(e) => update({ v_mag: parseFloat(e.target.value) || 0 })}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Voltage Angle (deg)</span>
        <input
          type="number"
          step="0.1"
          className="border rounded px-2 py-1 text-sm"
          value={data.v_ang}
          onChange={(e) => update({ v_ang: parseFloat(e.target.value) || 0 })}
        />
      </label>

      <div className="border-t pt-2">
        <span className="text-xs font-medium text-gray-600">Generation (MW / MVAr)</span>
        <div className="flex gap-2 mt-1">
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-xs text-gray-500">P_gen</span>
            <input
              type="number"
              className="border rounded px-2 py-1 text-sm"
              value={data.p_gen}
              onChange={(e) => update({ p_gen: parseFloat(e.target.value) || 0 })}
            />
          </label>
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-xs text-gray-500">Q_gen</span>
            <input
              type="number"
              className="border rounded px-2 py-1 text-sm"
              value={data.q_gen}
              onChange={(e) => update({ q_gen: parseFloat(e.target.value) || 0 })}
            />
          </label>
        </div>
      </div>

      <div className="border-t pt-2">
        <span className="text-xs font-medium text-gray-600">Load (MW / MVAr)</span>
        <div className="flex gap-2 mt-1">
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-xs text-gray-500">P_load</span>
            <input
              type="number"
              className="border rounded px-2 py-1 text-sm"
              value={data.p_load}
              onChange={(e) => update({ p_load: parseFloat(e.target.value) || 0 })}
            />
          </label>
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-xs text-gray-500">Q_load</span>
            <input
              type="number"
              className="border rounded px-2 py-1 text-sm"
              value={data.q_load}
              onChange={(e) => update({ q_load: parseFloat(e.target.value) || 0 })}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

import type { Edge } from 'reactflow';
import type { TransmissionEdgeData } from '../../types';
import { useFlowStore } from '../../store/useFlowStore';

interface Props {
  edge: Edge<TransmissionEdgeData>;
}

const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow';
const labelCls = 'block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide';

export default function EdgeProperties({ edge }: Props) {
  const updateEdgeData = useFlowStore((s) => s.updateEdgeData);
  const { data, id } = edge;
  const update = (patch: Partial<TransmissionEdgeData>) => updateEdgeData(id, patch);

  return (
    <div className="p-4 flex flex-col gap-5">
      {/* Summary card */}
      <div className="flex items-center gap-2.5 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
        <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-indigo-400" />
        <div>
          <p className="text-xs font-semibold text-gray-800">{data?.label ?? 'Transmission Line'}</p>
          <p className="text-[11px] text-gray-400 font-mono">R={data?.r ?? 0} X={data?.x ?? 0}</p>
        </div>
      </div>

      {/* Identity */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Identity</p>
        <div>
          <label className={labelCls}>Label</label>
          <input className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow"
            value={data?.label ?? ''}
            onChange={(e) => update({ label: e.target.value })} />
        </div>
      </section>

      {/* Impedance */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Impedance (pu)</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>R — Resistance</label>
            <input type="number" step="0.001" className={inputCls} value={data?.r ?? 0}
              onChange={(e) => update({ r: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className={labelCls}>X — Reactance</label>
            <input type="number" step="0.001" className={inputCls} value={data?.x ?? 0}
              onChange={(e) => update({ x: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
        <div>
          <label className={labelCls}>B — Susceptance</label>
          <input type="number" step="0.001" className={inputCls} value={data?.b ?? 0}
            onChange={(e) => update({ b: parseFloat(e.target.value) || 0 })} />
        </div>
      </section>

      {/* Capacity */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Capacity</p>
        <div>
          <label className={labelCls}>Thermal Rating (MVA)</label>
          <input type="number" className={inputCls} value={data?.rating_mva ?? 0}
            onChange={(e) => update({ rating_mva: parseFloat(e.target.value) || 0 })} />
        </div>
      </section>
    </div>
  );
}

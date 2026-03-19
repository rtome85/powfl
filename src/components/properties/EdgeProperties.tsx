import type { Edge } from 'reactflow';
import type { TransmissionEdgeData } from '../../types';
import { useFlowStore } from '../../store/useFlowStore';
import TripCurvePanel from '../protection/TripCurvePanel';

interface Props {
  edge: Edge<TransmissionEdgeData>;
}

const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow';
const labelCls = 'block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide';

export default function EdgeProperties({ edge }: Props) {
  const updateEdgeData = useFlowStore((s) => s.updateEdgeData);
  const toggleBreaker = useFlowStore((s) => s.toggleBreaker);
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

      {/* Circuit Breaker */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Circuit Breaker</p>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-700">
              Breaker: {data?.isOpen ? 'OPEN' : 'Closed'}
            </span>
            <span className="text-[11px] text-gray-400">
              {data?.isOpen ? 'Line isolated' : 'Line energized'}
            </span>
          </div>
          <button
            onClick={() => toggleBreaker(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
              ${data?.isOpen ? 'bg-red-100 text-red-700 hover:bg-red-200'
                             : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
          >
            {data?.isOpen ? 'Close' : 'Open'}
          </button>
        </div>

        <div>
          <label className={labelCls}>Trip Threshold (kA) — 0 disables</label>
          <input type="number" step="0.01" min="0" className={inputCls}
            value={data?.breakerThreshold_ka ?? 0}
            onChange={(e) => update({ breakerThreshold_ka: parseFloat(e.target.value) || 0 })} />
        </div>

        {(data?.breakerThreshold_ka ?? 0) > 0 && (
          <TripCurvePanel threshold_ka={data!.breakerThreshold_ka!} ikss_ka={data?.ikss_ka} />
        )}
      </section>
    </div>
  );
}

import type { Node } from 'reactflow';
import type { BusNodeData, BusType } from '../../types';
import { useFlowStore } from '../../store/useFlowStore';
import type { TopologyReport } from '../../types/topology';

interface Props {
  node: Node<BusNodeData>;
}

const busTypes: BusType[] = ['Slack', 'PV', 'PQ'];

const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow';
const labelCls = 'block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide';

const busTypeMeta: Record<BusType, { color: string; desc: string }> = {
  Slack: { color: 'bg-amber-500', desc: 'Reference / Slack bus' },
  PV: { color: 'bg-blue-500', desc: 'Generator bus' },
  PQ: { color: 'bg-slate-400', desc: 'Load bus' },
};

export default function BusProperties({ node }: Props) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const topologyReport = useFlowStore((s) => s.topologyReport) as TopologyReport | null;
  const scStatus = useFlowStore((s) => s.scStatus);
  const runShortCircuit = useFlowStore((s) => s.runShortCircuit);
  const { data, id } = node;
  const update = (patch: Partial<BusNodeData>) => updateNodeData(id, patch);
  const canRunSC = topologyReport?.isReadyForCalculation === true;

  return (
    <div className="p-4 flex flex-col gap-5">
      {/* Type indicator */}
      <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${busTypeMeta[data.busType]?.color ?? 'bg-slate-400'}`} />
        <div>
          <p className="text-xs font-semibold text-gray-800">{data.label}</p>
          <p className="text-[11px] text-gray-400">{busTypeMeta[data.busType]?.desc}</p>
        </div>
      </div>

      {/* Identity */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Identity</p>

        <div>
          <label className={labelCls}>Label</label>
          <input
            className={inputCls}
            value={data.label}
            onChange={(e) => update({ label: e.target.value })}
          />
        </div>

        <div>
          <label className={labelCls}>Bus Type</label>
          <select
            className={inputCls}
            value={data.busType}
            onChange={(e) => update({ busType: e.target.value as BusType })}
          >
            {busTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Voltage */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Voltage</p>

        <div>
          <label className={labelCls}>Nominal Voltage (kV)</label>
          <input type="number" className={inputCls} value={data.v_nom}
            onChange={(e) => update({ v_nom: parseFloat(e.target.value) || 0 })} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>|V| (pu)</label>
            <input type="number" step="0.001" className={inputCls} value={data.v_mag}
              onChange={(e) => update({ v_mag: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className={labelCls}>∠ (deg)</label>
            <input type="number" step="0.1" className={inputCls} value={data.v_ang}
              onChange={(e) => update({ v_ang: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
      </section>

      {/* Generation */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Generation</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>P (MW)</label>
            <input type="number" className={inputCls} value={data.p_gen}
              onChange={(e) => update({ p_gen: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className={labelCls}>Q (MVAr)</label>
            <input type="number" className={inputCls} value={data.q_gen}
              onChange={(e) => update({ q_gen: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
      </section>

      {/* Load */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Load</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>P (MW)</label>
            <input type="number" className={inputCls} value={data.p_load}
              onChange={(e) => update({ p_load: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className={labelCls}>Q (MVAr)</label>
            <input type="number" className={inputCls} value={data.q_load}
              onChange={(e) => update({ q_load: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
      </section>

      {/* IEC 60909 */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">IEC 60909</p>
        <div>
          <label className={labelCls}>Voltage Factor (c)</label>
          <input type="number" step="0.01" className={inputCls} value={data.c_factor ?? 1.1}
            onChange={(e) => update({ c_factor: parseFloat(e.target.value) || 1.1 })} />
        </div>
      </section>

      {/* Short-circuit trigger */}
      <section className="pt-2 border-t border-gray-100">
        <button
          disabled={!canRunSC || scStatus === 'loading'}
          onClick={() => runShortCircuit(id)}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
            canRunSC && scStatus !== 'loading'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {scStatus === 'loading' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Calculating...
            </span>
          ) : (
            'Simulate Short-Circuit'
          )}
        </button>
      </section>
    </div>
  );
}

import type { Node } from 'reactflow';
import type { TransformerNodeData } from '../../types';
import { useFlowStore } from '../../store/useFlowStore';

interface Props {
  node: Node<TransformerNodeData>;
}

const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow';
const labelCls = 'block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide';

export default function TransformerProperties({ node }: Props) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const { data, id } = node;
  const update = (patch: Partial<TransformerNodeData>) => updateNodeData(id, patch);

  return (
    <div className="p-4 flex flex-col gap-5">
      {/* Summary card */}
      <div className="flex items-center gap-2.5 p-3 bg-violet-50 rounded-xl border border-violet-100">
        <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-violet-500" />
        <div>
          <p className="text-xs font-semibold text-gray-800">{data.label}</p>
          <p className="text-[11px] text-gray-400">{data.v_primary}kV → {data.v_secondary}kV · {data.rating_mva} MVA</p>
        </div>
      </div>

      {/* Identity */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Identity</p>
        <div>
          <label className={labelCls}>Label</label>
          <input className={inputCls} value={data.label}
            onChange={(e) => update({ label: e.target.value })} />
        </div>
      </section>

      {/* Voltages */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Voltages</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Primary (kV)</label>
            <input type="number" className={inputCls} value={data.v_primary}
              onChange={(e) => update({ v_primary: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className={labelCls}>Secondary (kV)</label>
            <input type="number" className={inputCls} value={data.v_secondary}
              onChange={(e) => update({ v_secondary: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
      </section>

      {/* Parameters */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Parameters</p>
        <div>
          <label className={labelCls}>Rating (MVA)</label>
          <input type="number" className={inputCls} value={data.rating_mva}
            onChange={(e) => update({ rating_mva: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Tap Ratio</label>
            <input type="number" step="0.01" className={inputCls} value={data.tap_ratio}
              onChange={(e) => update({ tap_ratio: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className={labelCls}>X (pu)</label>
            <input type="number" step="0.001" className={inputCls} value={data.x_pu}
              onChange={(e) => update({ x_pu: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
      </section>
    </div>
  );
}

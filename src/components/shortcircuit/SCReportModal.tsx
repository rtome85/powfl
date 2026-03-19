import { useFlowStore } from '../../store/useFlowStore';

interface Props {
  onClose: () => void;
}

export default function SCReportModal({ onClose }: Props) {
  const scReport = useFlowStore((s) => s.scReport);
  const scFaultBusId = useFlowStore((s) => s.scFaultBusId);
  const nodes = useFlowStore((s) => s.nodes);

  if (!scReport || !scFaultBusId) return null;

  const faultNode = nodes.find((n) => n.id === scFaultBusId);
  const faultLabel = faultNode?.data?.label ?? scFaultBusId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[380px] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-red-50 border-b border-red-100">
          <h2 className="text-sm font-semibold text-red-800">Short-Circuit Report</h2>
          <p className="text-xs text-red-600 mt-0.5">IEC 60909 — 3-phase symmetrical fault</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Faulted bus */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-gray-800">{faultLabel}</p>
              <p className="text-[11px] text-gray-400">ID: {scFaultBusId}</p>
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">I''k</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{scReport.ikss_ka.toFixed(2)}</p>
              <p className="text-[10px] text-gray-400">kA</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Sk</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{scReport.skss_mw.toFixed(1)}</p>
              <p className="text-[10px] text-gray-400">MVA</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

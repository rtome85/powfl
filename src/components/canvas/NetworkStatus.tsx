import { Panel } from 'reactflow';
import { useFlowStore } from '../../store/useFlowStore';

export default function NetworkStatus() {
  const topologyReport = useFlowStore((s) => s.topologyReport);
  const nodes = useFlowStore((s) => s.nodes);

  if (!topologyReport || nodes.length === 0) return null;

  const { isReadyForCalculation, errors, warnings } = topologyReport;

  return (
    <Panel position="bottom-left" className="flex flex-col gap-1 mb-10">
      {isReadyForCalculation && (
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-300 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
          <span>✅</span>
          <span>Network Ready</span>
        </div>
      )}
      {errors.map((err, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 bg-red-50 border border-red-300 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm"
        >
          <span>❌</span>
          <span>{err}</span>
        </div>
      ))}
      {warnings.map((warn, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm"
        >
          <span>⚠️</span>
          <span>{warn}</span>
        </div>
      ))}
    </Panel>
  );
}

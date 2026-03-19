import { Panel } from 'reactflow';
import { useFlowStore } from '../../store/useFlowStore';

export default function NetworkStatus() {
  const topologyReport = useFlowStore((s) => s.topologyReport);
  const nodes = useFlowStore((s) => s.nodes);
  const simulationStatus = useFlowStore((s) => s.simulationStatus);
  const simulationError = useFlowStore((s) => s.simulationError);
  const runSimulation = useFlowStore((s) => s.runSimulation);
  const breakerTrips = useFlowStore((s) => s.breakerTrips);

  if (!topologyReport || nodes.length === 0) return null;

  const { isReadyForCalculation, errors, warnings } = topologyReport;

  return (
    <Panel position="bottom-left" className="flex flex-col gap-1 mb-10">
      {isReadyForCalculation && (
        <>
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-300 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
            <span>✅</span>
            <span>Network Ready</span>
          </div>
          <button
            onClick={() => void runSimulation()}
            disabled={simulationStatus === 'loading'}
            className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm transition-colors"
          >
            {simulationStatus === 'loading' ? '⟳ Calculating…' : 'Run Simulation'}
          </button>
        </>
      )}
      {simulationStatus === 'success' && (
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-300 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
          <span>✅</span>
          <span>Simulation completed successfully</span>
        </div>
      )}
      {simulationStatus === 'error' && simulationError && (
        <div className="max-w-xs bg-red-50 border border-red-300 text-red-800 text-xs font-medium px-2.5 py-2 rounded-lg shadow-sm">
          <div className="flex items-center gap-1.5 font-semibold mb-1">
            <span>❌</span>
            <span>Simulation Failed</span>
          </div>
          <p className="leading-relaxed">{simulationError}</p>
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
      {breakerTrips.map((trip, i) => (
        <div key={i} className="flex items-center gap-1.5 bg-amber-50 border border-amber-300
          text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
          <span>⚡</span>
          <span>Breaker '{trip.edgeLabel}' tripped — I = {trip.ikss_ka.toFixed(2)} kA</span>
        </div>
      ))}
    </Panel>
  );
}

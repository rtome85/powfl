import { Panel } from 'reactflow';
import { useFlowStore } from '../../store/useFlowStore';
import type { BusNodeData } from '../../types';

interface Props {
  onOpenHmReport: () => void;
}

export default function NetworkStatus({ onOpenHmReport }: Props) {
  const topologyReport = useFlowStore((s) => s.topologyReport);
  const nodes = useFlowStore((s) => s.nodes);
  const simulationStatus = useFlowStore((s) => s.simulationStatus);
  const simulationError = useFlowStore((s) => s.simulationError);
  const breakerTrips = useFlowStore((s) => s.breakerTrips);
  const isSimulated = useFlowStore((s) => s.isSimulated);
  const hmStatus = useFlowStore((s) => s.hmStatus);
  const hmError = useFlowStore((s) => s.hmError);
  const runHarmonics = useFlowStore((s) => s.runHarmonics);

  const hasHarmonicSources = nodes.some(
    (n) => ((n.data as BusNodeData).harmonic_injections?.length ?? 0) > 0
  );

  if (!topologyReport || nodes.length === 0) return null;

  const { errors, warnings } = topologyReport;

  const hasContent =
    simulationStatus === 'success' ||
    (simulationStatus === 'error' && simulationError) ||
    errors.length > 0 ||
    warnings.length > 0 ||
    breakerTrips.length > 0 ||
    (isSimulated && hasHarmonicSources) ||
    hmStatus === 'success' ||
    hmStatus === 'error';

  if (!hasContent) return null;

  return (
    <Panel position="top-right" className="flex flex-col gap-1 mt-1 mr-1 max-w-xs">
      {simulationStatus === 'success' && (
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-300 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
          <span>✅</span>
          <span>Simulation completed successfully</span>
        </div>
      )}
      {simulationStatus === 'error' && simulationError && (
        <div className="bg-red-50 border border-red-300 text-red-800 text-xs font-medium px-2.5 py-2 rounded-lg shadow-sm">
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
        <div
          key={i}
          className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm"
        >
          <span>⚡</span>
          <span>Breaker '{trip.edgeLabel}' tripped — I = {trip.ikss_ka.toFixed(2)} kA</span>
        </div>
      ))}

      {/* Harmonic Analysis controls */}
      {isSimulated && hasHarmonicSources && (
        <button
          onClick={() => void runHarmonics()}
          disabled={hmStatus === 'loading'}
          className="flex items-center gap-1.5 bg-purple-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span>{hmStatus === 'loading' ? '⟳ Analysing…' : '⚡ Run Harmonic Analysis'}</span>
        </button>
      )}
      {hmStatus === 'success' && (
        <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-300 text-purple-800 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
          <span>✅</span>
          <span>Harmonic analysis complete —</span>
          <button
            onClick={onOpenHmReport}
            className="underline font-semibold hover:text-purple-600"
          >
            View Report
          </button>
        </div>
      )}
      {hmStatus === 'error' && hmError && (
        <div className="bg-red-50 border border-red-300 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
          <span>❌ {hmError}</span>
        </div>
      )}
    </Panel>
  );
}

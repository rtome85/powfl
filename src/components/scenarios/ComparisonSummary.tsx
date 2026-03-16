import type { Snapshot } from '../../store/useSnapshotStore';
import type { TransmissionEdgeData, BusNodeData } from '../../types';

interface ComparisonSummaryProps {
  snapshotA: Snapshot;
  snapshotB: Snapshot;
}

function totalLosses(snapshot: Snapshot): number {
  return snapshot.edges.reduce((sum, e) => {
    const d = e.data as TransmissionEdgeData | undefined;
    const pFrom = d?.p_from_mw ?? 0;
    const pTo = d?.p_to_mw ?? 0;
    return sum + pFrom + pTo;
  }, 0);
}

function minVoltage(snapshot: Snapshot): number | null {
  let min: number | null = null;
  for (const n of snapshot.nodes) {
    const d = n.data as BusNodeData | undefined;
    if (d?.v_mag != null) {
      if (min === null || d.v_mag < min) min = d.v_mag;
    }
  }
  return min;
}

function fmt(val: number): string {
  return val >= 0 ? `+${val.toFixed(4)}` : val.toFixed(4);
}

export default function ComparisonSummary({
  snapshotA,
  snapshotB,
}: ComparisonSummaryProps) {
  const lossA = totalLosses(snapshotA);
  const lossB = totalLosses(snapshotB);
  const lossDelta = lossB - lossA;

  const vMinA = minVoltage(snapshotA);
  const vMinB = minVoltage(snapshotB);
  const vDelta = vMinA != null && vMinB != null ? vMinB - vMinA : null;

  const noSim = !snapshotA.isSimulated || !snapshotB.isSimulated;

  return (
    <div className="border border-gray-200 rounded-lg bg-gray-50 p-3 space-y-2 text-xs">
      <h4 className="font-semibold text-gray-700 text-xs">Comparison</h4>
      {noSim && (
        <p className="text-amber-600">
          One or both scenarios have no simulation results.
        </p>
      )}
      <div className="grid grid-cols-3 gap-1 text-gray-600">
        <span />
        <span className="font-medium truncate" title={snapshotA.name}>
          {snapshotA.name}
        </span>
        <span className="font-medium truncate" title={snapshotB.name}>
          {snapshotB.name}
        </span>

        <span className="font-medium">Total Losses (MW)</span>
        <span>{lossA.toFixed(4)}</span>
        <span>{lossB.toFixed(4)}</span>

        <span className="font-medium">Min Voltage (pu)</span>
        <span>{vMinA != null ? vMinA.toFixed(4) : '—'}</span>
        <span>{vMinB != null ? vMinB.toFixed(4) : '—'}</span>
      </div>

      <div className="pt-1 border-t border-gray-200 space-y-1 text-gray-600">
        <div>
          <span className="font-medium">Loss delta: </span>
          <span className={lossDelta > 0 ? 'text-red-600' : 'text-green-600'}>
            {fmt(lossDelta)} MW
          </span>
        </div>
        {vDelta != null && (
          <div>
            <span className="font-medium">Voltage delta: </span>
            <span
              className={vDelta < 0 ? 'text-red-600' : 'text-green-600'}
            >
              {fmt(vDelta)} pu
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

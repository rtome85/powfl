import { useState } from 'react';
import { useSnapshotStore } from '../../store/useSnapshotStore';
import SaveSnapshotModal from './SaveSnapshotModal';
import ComparisonSummary from './ComparisonSummary';

export default function ScenariosPanel() {
  const snapshots = useSnapshotStore((s) => s.snapshots);
  const loadSnapshot = useSnapshotStore((s) => s.loadSnapshot);
  const deleteSnapshot = useSnapshotStore((s) => s.deleteSnapshot);
  const exportSnapshot = useSnapshotStore((s) => s.exportSnapshot);

  const [showSave, setShowSave] = useState(false);
  const [compareA, setCompareA] = useState<string>('');
  const [compareB, setCompareB] = useState<string>('');

  const snapshotA = snapshots.find((s) => s.id === compareA);
  const snapshotB = snapshots.find((s) => s.id === compareB);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Save button / modal */}
        {showSave ? (
          <SaveSnapshotModal onClose={() => setShowSave(false)} />
        ) : (
          <button
            onClick={() => setShowSave(true)}
            className="w-full px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Save Current Scenario
          </button>
        )}

        {/* Snapshot list */}
        {snapshots.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            No saved scenarios yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {snapshots.map((snap) => (
              <li
                key={snap.id}
                className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {snap.name}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(snap.createdAt).toLocaleString()}
                    {snap.isSimulated && (
                      <span className="ml-1.5 text-green-600 font-medium">
                        simulated
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => loadSnapshot(snap.id)}
                    className="px-2 py-1 text-[11px] rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => exportSnapshot(snap.id)}
                    className="px-2 py-1 text-[11px] rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => {
                      deleteSnapshot(snap.id);
                      if (compareA === snap.id) setCompareA('');
                      if (compareB === snap.id) setCompareB('');
                    }}
                    className="px-2 py-1 text-[11px] rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Comparison */}
        {snapshots.length >= 2 && (
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Compare Scenarios
            </h3>
            <select
              value={compareA}
              onChange={(e) => setCompareA(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs bg-white"
            >
              <option value="">Select scenario A</option>
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={compareB}
              onChange={(e) => setCompareB(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs bg-white"
            >
              <option value="">Select scenario B</option>
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {snapshotA && snapshotB && snapshotA.id !== snapshotB.id && (
              <ComparisonSummary snapshotA={snapshotA} snapshotB={snapshotB} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

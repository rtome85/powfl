import { useState } from 'react';
import { useSnapshotStore } from '../../store/useSnapshotStore';

interface SaveSnapshotModalProps {
  onClose(): void;
}

export default function SaveSnapshotModal({ onClose }: SaveSnapshotModalProps) {
  const [name, setName] = useState('');
  const saveSnapshot = useSnapshotStore((s) => s.saveSnapshot);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    saveSnapshot(trimmed);
    onClose();
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-gray-50 p-3 space-y-3">
      <label className="block text-xs font-medium text-gray-700">
        Scenario name
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        placeholder="e.g. Base case"
        autoFocus
        className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs rounded-md text-gray-600 hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

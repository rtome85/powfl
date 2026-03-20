import { useEffect, useRef } from 'react';
import { useFlowStore } from '../../store/useFlowStore';
import type { BusNodeData } from '../../types';
import HarmonicChart from './HarmonicChart';

interface Props {
  onClose: () => void;
}

export default function HarmonicModal({ onClose }: Props) {
  const nodes = useFlowStore((s) => s.nodes);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    dialogRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, [onClose]);

  const busesWithResults = nodes.filter(
    (n) => (n.data as BusNodeData).thd_v_percent != null
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hm-report-title"
        tabIndex={-1}
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[520px] max-h-[80vh] overflow-hidden outline-none flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-purple-50 border-b border-purple-100 shrink-0">
          <h2 id="hm-report-title" className="text-sm font-semibold text-purple-800">Harmonic Analysis Report</h2>
          <p className="text-xs text-purple-600 mt-0.5">Voltage THD per bus</p>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex flex-col gap-5">
          {busesWithResults.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No harmonic results available.</p>
          ) : (
            busesWithResults.map((node) => {
              const data = node.data as BusNodeData;
              const thd = data.thd_v_percent!;
              const isHighThd = thd > 5;
              return (
                <div key={node.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-800">{data.label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isHighThd
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      THD = {thd.toFixed(2)}%
                    </span>
                  </div>
                  {data.harmonic_voltages && data.harmonic_voltages.length > 0 ? (
                    <HarmonicChart
                      harmonicVoltages={data.harmonic_voltages}
                      label={`Harmonic spectrum — ${data.label}`}
                    />
                  ) : (
                    <p className="text-[10px] text-gray-400 mt-1">No harmonic injections on this bus.</p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end shrink-0">
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

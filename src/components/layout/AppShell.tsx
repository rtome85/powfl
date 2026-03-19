import { useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import Toolbox from './Toolbox';
import PropertiesPanel from './PropertiesPanel';
import FlowCanvas from '../canvas/FlowCanvas';
import ScenariosPanel from '../scenarios/ScenariosPanel';
import SCReportModal from '../shortcircuit/SCReportModal';
import { useFlowStore } from '../../store/useFlowStore';

type RightTab = 'properties' | 'scenarios';

export default function AppShell() {
  const [rightTab, setRightTab] = useState<RightTab>('properties');
  const scStatus = useFlowStore((s) => s.scStatus);
  const scReport = useFlowStore((s) => s.scReport);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* Left sidebar — Toolbox */}
      <aside className="w-56 shrink-0 flex flex-col bg-white border-r border-gray-200 shadow-sm z-10">
        {/* App header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900 tracking-tight">PowerFlow</span>
          </div>
        </div>
        <Toolbox />
      </aside>

      {/* Main canvas */}
      <main className="flex-1 relative overflow-hidden">
        <ReactFlowProvider>
          <FlowCanvas />
        </ReactFlowProvider>
      </main>

      {/* Right sidebar — Tabs */}
      <aside className="w-72 shrink-0 flex flex-col bg-white border-l border-gray-200 shadow-sm z-10">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setRightTab('properties')}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
              rightTab === 'properties'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Properties
          </button>
          <button
            onClick={() => setRightTab('scenarios')}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
              rightTab === 'scenarios'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Scenarios
          </button>
        </div>
        {rightTab === 'properties' ? <PropertiesPanel /> : <ScenariosPanel />}
      </aside>

      {/* SC Report Modal */}
      {scStatus === 'success' && scReport != null && <SCReportModal />}
    </div>
  );
}

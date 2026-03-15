import { ReactFlowProvider } from 'reactflow';
import Toolbox from './Toolbox';
import PropertiesPanel from './PropertiesPanel';
import FlowCanvas from '../canvas/FlowCanvas';

export default function AppShell() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="w-56 shrink-0 border-r bg-white shadow-sm">
        <Toolbox />
      </aside>
      <main className="flex-1 relative overflow-hidden">
        <ReactFlowProvider>
          <FlowCanvas />
        </ReactFlowProvider>
      </main>
      <aside className="w-72 shrink-0 border-l bg-white shadow-sm">
        <PropertiesPanel />
      </aside>
    </div>
  );
}

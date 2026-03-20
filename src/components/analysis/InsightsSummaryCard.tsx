import { useMemo } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ChevronRight } from 'lucide-react';
import { useFlowStore } from '../../store/useFlowStore';
import { generateEngineeringInsights, type Insight, type InsightSeverity } from '../../utils/engineeringInsights';

const SEVERITY_CONFIG: Record<InsightSeverity, {
  icon: typeof AlertTriangle;
  iconClass: string;
  badgeClass: string;
  rowClass: string;
}> = {
  critical: {
    icon: AlertCircle,
    iconClass: 'text-red-500',
    badgeClass: 'bg-red-100 text-red-700',
    rowClass: 'border-l-2 border-red-400 bg-red-50/60',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    badgeClass: 'bg-amber-100 text-amber-700',
    rowClass: 'border-l-2 border-amber-400 bg-amber-50/60',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-500',
    badgeClass: 'bg-blue-100 text-blue-700',
    rowClass: 'border-l-2 border-blue-400 bg-blue-50/50',
  },
};

function InsightRow({ insight }: { insight: Insight }) {
  const cfg = SEVERITY_CONFIG[insight.severity];
  const Icon = cfg.icon;
  return (
    <div className={`flex gap-2 px-3 py-2 rounded-md ${cfg.rowClass}`}>
      <Icon size={13} className={`${cfg.iconClass} mt-0.5 shrink-0`} />
      <div className="min-w-0">
        <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mb-0.5 ${cfg.badgeClass}`}>
          {insight.category}
        </span>
        <p className="text-[11px] text-gray-700 leading-snug">{insight.message}</p>
      </div>
    </div>
  );
}

export default function InsightsSummaryCard() {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const isSimulated = useFlowStore((s) => s.isSimulated);
  const scReport = useFlowStore((s) => s.scReport);
  const scFaultBusId = useFlowStore((s) => s.scFaultBusId);

  const insights = useMemo(
    () =>
      isSimulated
        ? generateEngineeringInsights(nodes, edges, scReport, scFaultBusId)
        : [],
    [nodes, edges, isSimulated, scReport, scFaultBusId],
  );

  if (!isSimulated) return null;

  const criticalCount = insights.filter((i) => i.severity === 'critical').length;
  const warningCount = insights.filter((i) => i.severity === 'warning').length;

  return (
    <div className="shrink-0 border-t border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <ChevronRight size={12} className="text-gray-400" />
          <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
            Analysis Summary
          </span>
        </div>
        <div className="flex gap-1">
          {criticalCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
              {criticalCount} critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
              {warningCount} warning
            </span>
          )}
          {insights.length === 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
              OK
            </span>
          )}
        </div>
      </div>

      {/* Body — scrollable, max ~4 rows visible */}
      <div className="overflow-y-auto max-h-48 flex flex-col gap-1.5 p-2">
        {insights.length === 0 ? (
          <div className="flex items-center gap-2 px-2 py-2">
            <CheckCircle2 size={13} className="text-green-500 shrink-0" />
            <p className="text-[11px] text-gray-600 leading-snug">
              The network is operating within nominal technical limits. No critical violations detected.
            </p>
          </div>
        ) : (
          insights.map((insight, i) => <InsightRow key={i} insight={insight} />)
        )}
      </div>
    </div>
  );
}

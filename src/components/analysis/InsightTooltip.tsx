import { createPortal } from 'react-dom';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { Insight, InsightSeverity } from '../../utils/engineeringInsights';

const CFG: Record<InsightSeverity, {
  Icon: typeof AlertCircle;
  iconCls: string;
  badge: string;
  stripe: string;
  bg: string;
}> = {
  critical: {
    Icon: AlertCircle,
    iconCls: 'text-red-500',
    badge: 'bg-red-100 text-red-700',
    stripe: 'bg-red-400',
    bg: 'bg-red-50/80',
  },
  warning: {
    Icon: AlertTriangle,
    iconCls: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    stripe: 'bg-amber-400',
    bg: 'bg-amber-50/80',
  },
  info: {
    Icon: Info,
    iconCls: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    stripe: 'bg-blue-400',
    bg: 'bg-blue-50/60',
  },
};

interface Props {
  insights: Insight[];
  x: number;
  y: number;
}

export default function InsightTooltip({ insights, x, y }: Props) {
  if (insights.length === 0) return null;

  // Keep tooltip inside the viewport horizontally
  const tooltipW = 272;
  const left = x + 16 + tooltipW > window.innerWidth ? x - tooltipW - 8 : x + 16;
  const top = y - 8;

  return createPortal(
    <div
      style={{ position: 'fixed', left, top, zIndex: 9999, width: tooltipW, pointerEvents: 'none' }}
      className="flex flex-col gap-1.5 rounded-xl shadow-xl border border-gray-200/80 bg-white/95 backdrop-blur-sm p-2"
    >
      {insights.map((insight, i) => {
        const { Icon, iconCls, badge, stripe, bg } = CFG[insight.severity];
        return (
          <div key={i} className={`flex gap-2 rounded-lg pl-0 pr-2.5 py-2 overflow-hidden ${bg}`}>
            {/* Left accent stripe */}
            <div className={`w-1 shrink-0 rounded-full self-stretch ${stripe}`} />
            <Icon size={12} className={`${iconCls} mt-0.5 shrink-0`} />
            <div className="min-w-0">
              <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mb-0.5 ${badge}`}>
                {insight.category}
              </span>
              <p className="text-[11px] text-gray-700 leading-snug">{insight.message}</p>
            </div>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}

interface Props {
  threshold_ka: number;
  ikss_ka?: number;
}

export default function TripCurvePanel({ threshold_ka, ikss_ka }: Props) {
  const padL = 32, padR = 12, padT = 16, padB = 28;
  const totalW = 200;
  const totalH = 200;
  const chartW = totalW - padL - padR;
  const chartH = totalH - padT - padB;

  const xMax = Math.max(threshold_ka * 2, (ikss_ka ?? 0) * 1.2, threshold_ka + 1);

  const toX = (v: number) => padL + (v / xMax) * chartW;
  const baseY = padT + chartH;

  const threshX = toX(threshold_ka);
  const faultX = ikss_ka != null ? toX(ikss_ka) : null;
  const tripped = ikss_ka != null && ikss_ka > threshold_ka;

  // X-axis ticks
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const v = (xMax / tickCount) * i;
    return { x: toX(v), label: v.toFixed(1) };
  });

  return (
    <svg width="100%" viewBox={`0 0 ${totalW} ${totalH}`} style={{ display: 'block' }}>
      {/* Safe zone */}
      <rect
        x={padL}
        y={padT}
        width={threshX - padL}
        height={chartH}
        fill="#dcfce7"
        opacity={0.8}
      />
      {/* Trip zone */}
      <rect
        x={threshX}
        y={padT}
        width={padL + chartW - threshX}
        height={chartH}
        fill="#fee2e2"
        opacity={0.8}
      />
      {/* Zone labels */}
      <text x={(padL + threshX) / 2} y={padT + 12} textAnchor="middle" fontSize={9} fill="#16a34a" fontWeight="600">
        Safe
      </text>
      <text x={(threshX + padL + chartW) / 2} y={padT + 12} textAnchor="middle" fontSize={9} fill="#dc2626" fontWeight="600">
        Trip
      </text>
      {/* Threshold dashed line */}
      <line
        x1={threshX} y1={padT}
        x2={threshX} y2={baseY}
        stroke="#ef4444"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />
      {/* Threshold label */}
      <text x={threshX} y={padT - 3} textAnchor="middle" fontSize={8} fill="#ef4444">
        {threshold_ka} kA
      </text>
      {/* X axis */}
      <line x1={padL} y1={baseY} x2={padL + chartW} y2={baseY} stroke="#94a3b8" strokeWidth={1} />
      {ticks.map((t) => (
        <g key={t.label}>
          <line x1={t.x} y1={baseY} x2={t.x} y2={baseY + 4} stroke="#94a3b8" strokeWidth={1} />
          <text x={t.x} y={baseY + 12} textAnchor="middle" fontSize={8} fill="#6b7280">
            {t.label}
          </text>
        </g>
      ))}
      {/* X axis label */}
      <text x={padL + chartW / 2} y={totalH - 2} textAnchor="middle" fontSize={8} fill="#9ca3af">
        Current (kA)
      </text>
      {/* Fault current dot */}
      {faultX != null && (
        <circle cx={faultX} cy={baseY - 4} r={5} fill={tripped ? '#ef4444' : '#22c55e'}>
          <title>{`I = ${ikss_ka!.toFixed(2)} kA — ${tripped ? 'TRIPPED' : 'Safe'}`}</title>
        </circle>
      )}
    </svg>
  );
}

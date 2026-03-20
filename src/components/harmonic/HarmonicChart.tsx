import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
} from 'recharts';

interface HarmonicComponent { order: number; magnitude_percent: number; }

interface Props {
  harmonicVoltages: HarmonicComponent[];
  label: string;
}

function barColor(magnitude: number): string {
  if (magnitude > 10) return '#ef4444'; // red-500
  if (magnitude >= 5) return '#f59e0b'; // amber-500
  return '#22c55e';                      // green-500
}

function ordinalLabel(order: number): string {
  if (order === 1) return '1st';
  if (order === 2) return '2nd';
  if (order === 3) return '3rd';
  return `${order}th`;
}

export default function HarmonicChart({ harmonicVoltages, label }: Props) {
  // Always include fundamental at 100% as baseline
  const fundamentalPresent = harmonicVoltages.some((h) => h.order === 1);
  const data: HarmonicComponent[] = [
    ...(fundamentalPresent ? [] : [{ order: 1, magnitude_percent: 100 }]),
    ...harmonicVoltages,
  ].sort((a, b) => a.order - b.order);

  return (
    <div className="mt-2">
      <p className="text-[10px] text-gray-400 mb-1">{label}</p>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="order"
            tickFormatter={ordinalLabel}
            tick={{ fontSize: 9 }}
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} unit="%" />
          <Tooltip
            formatter={(val) => [`${(val as number).toFixed(2)}%`, 'Magnitude']}
            labelFormatter={(v) => `${ordinalLabel(v as number)} harmonic`}
          />
          <ReferenceLine y={5} stroke="#ef4444" strokeDasharray="4 2" label={{ value: '5%', position: 'right', fontSize: 9, fill: '#ef4444' }} />
          <Bar dataKey="magnitude_percent" radius={[2, 2, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={barColor(entry.magnitude_percent)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

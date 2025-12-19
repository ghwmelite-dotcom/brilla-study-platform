import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DailyProgress } from '@/utils/analyticsUtils';

interface PerformanceChartProps {
  data: DailyProgress[];
  showXP?: boolean;
}

export function PerformanceChart({ data, showXP = true }: PerformanceChartProps) {
  // Format date for x-axis
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-neutral-200">
        <p className="font-medium text-neutral-900 mb-2">{formatDate(label || '')}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.dataKey === 'accuracy' ? 'Accuracy' :
             entry.dataKey === 'questionsAttempted' ? 'Questions' :
             entry.dataKey === 'xpEarned' ? 'XP Earned' : entry.dataKey}:
            <span className="font-semibold ml-1">
              {entry.dataKey === 'accuracy' ? `${entry.value}%` : entry.value}
            </span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Progress Over Time</h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis stroke="#9CA3AF" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Accuracy %"
            />
            <Line
              type="monotone"
              dataKey="questionsAttempted"
              stroke="#22C55E"
              strokeWidth={2}
              dot={{ fill: '#22C55E', strokeWidth: 2, r: 4 }}
              name="Questions"
            />
            {showXP && (
              <Line
                type="monotone"
                dataKey="xpEarned"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                name="XP"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

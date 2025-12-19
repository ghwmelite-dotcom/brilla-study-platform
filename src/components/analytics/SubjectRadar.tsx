import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { SubjectPerformance } from '@/utils/analyticsUtils';

interface SubjectRadarProps {
  data: SubjectPerformance[];
}

export function SubjectRadar({ data }: SubjectRadarProps) {
  // Transform data for radar chart
  const chartData = data.map((d) => ({
    subject: d.subject,
    mastery: d.masteryLevel,
    accuracy: d.accuracy,
    fullMark: 100,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { subject: string; mastery: number; accuracy: number } }> }) => {
    if (!active || !payload || !payload.length) return null;

    const item = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-neutral-200">
        <p className="font-medium text-neutral-900">{item.subject}</p>
        <p className="text-sm text-blue-600">Mastery: {item.mastery}%</p>
        <p className="text-sm text-green-600">Accuracy: {item.accuracy}%</p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Subject Comparison</h3>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Mastery"
              dataKey="mastery"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Radar
              name="Accuracy"
              dataKey="accuracy"
              stroke="#22C55E"
              fill="#22C55E"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-neutral-600">Mastery</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-neutral-600">Accuracy</span>
        </div>
      </div>
    </div>
  );
}

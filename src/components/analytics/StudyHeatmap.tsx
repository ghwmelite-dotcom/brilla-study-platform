import type { StudyHeatmapData } from '@/utils/analyticsUtils';

interface StudyHeatmapProps {
  data: StudyHeatmapData[];
}

const levelColors = [
  'bg-neutral-100', // 0 - no activity
  'bg-green-200',   // 1 - light activity
  'bg-green-400',   // 2 - moderate activity
  'bg-green-500',   // 3 - high activity
  'bg-green-700',   // 4 - very high activity
];

export function StudyHeatmap({ data }: StudyHeatmapProps) {
  // Group data by weeks
  const weeks: StudyHeatmapData[][] = [];
  let currentWeek: StudyHeatmapData[] = [];

  data.forEach((day, index) => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();

    // Start new week on Sunday
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentWeek.push(day);

    // Push last week
    if (index === data.length - 1) {
      weeks.push(currentWeek);
    }
  });

  // Day labels
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Study Activity</h3>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-2">
            {dayLabels.map((label, i) => (
              <div
                key={label}
                className={`
                  h-3 text-[10px] text-neutral-400 flex items-center
                  ${i % 2 === 0 ? 'invisible' : ''}
                `}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {/* Pad incomplete weeks at the start */}
              {weekIndex === 0 && week.length < 7 && (
                <>
                  {Array(7 - week.length)
                    .fill(null)
                    .map((_, i) => (
                      <div key={`pad-${i}`} className="w-3 h-3" />
                    ))}
                </>
              )}

              {week.map((day) => (
                <div
                  key={day.date}
                  className={`
                    w-3 h-3 rounded-sm ${levelColors[day.level]}
                    cursor-pointer transition-transform hover:scale-125
                  `}
                  title={`${day.date}: ${day.count} questions`}
                />
              ))}

              {/* Pad incomplete weeks at the end */}
              {weekIndex === weeks.length - 1 && week.length < 7 && (
                <>
                  {Array(7 - week.length)
                    .fill(null)
                    .map((_, i) => (
                      <div key={`end-pad-${i}`} className="w-3 h-3" />
                    ))}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <span className="text-xs text-neutral-500">Less</span>
        {levelColors.map((color, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm ${color}`}
          />
        ))}
        <span className="text-xs text-neutral-500">More</span>
      </div>
    </div>
  );
}

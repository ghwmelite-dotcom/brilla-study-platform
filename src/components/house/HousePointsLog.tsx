import type { HousePoints } from '@/types';

interface HousePointsLogProps {
  activities: (HousePoints & { userName?: string; houseName?: string; houseColor?: string })[];
  showHouseName?: boolean;
  limit?: number;
}

const sourceIcons: Record<string, { icon: string; label: string }> = {
  practice: { icon: 'M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z', label: 'Practice' },
  battle: { icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z', label: 'Battle' },
  competition: { icon: 'M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z', label: 'Competition' },
  achievement: { icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', label: 'Achievement' },
  bonus: { icon: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z', label: 'Bonus' },
};

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function HousePointsLog({ activities, showHouseName = true, limit }: HousePointsLogProps) {
  const displayActivities = limit ? activities.slice(0, limit) : activities;

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Activity</h3>

      <div className="space-y-3">
        {displayActivities.map((activity) => {
          const source = sourceIcons[activity.source] || sourceIcons.bonus;

          return (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg"
            >
              {/* Source icon */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${activity.houseColor}20` }}
              >
                <svg
                  className="w-5 h-5"
                  fill={activity.houseColor || '#6B7280'}
                  viewBox="0 0 24 24"
                >
                  <path d={source.icon} />
                </svg>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-900">
                  <span className="font-medium">{activity.userName || 'User'}</span>
                  {' earned '}
                  <span className="font-bold text-primary">+{activity.points}</span>
                  {' points'}
                  {showHouseName && activity.houseName && (
                    <>
                      {' for '}
                      <span style={{ color: activity.houseColor }} className="font-medium">
                        {activity.houseName}
                      </span>
                    </>
                  )}
                </p>
                <p className="text-xs text-neutral-500">
                  {source.label} - {getTimeAgo(activity.createdAt)}
                </p>
              </div>

              {/* Points badge */}
              <div
                className="px-2 py-1 rounded-full text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: activity.houseColor || '#6B7280' }}
              >
                +{activity.points}
              </div>
            </div>
          );
        })}

        {displayActivities.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            No recent activity
          </div>
        )}
      </div>

      {limit && activities.length > limit && (
        <button className="w-full mt-4 py-2 text-sm text-primary hover:text-primary-dark font-medium">
          View all activity
        </button>
      )}
    </div>
  );
}

import { House } from '@/types';

interface HouseCardProps {
  house: House;
  rank?: number;
  isUserHouse?: boolean;
  onClick?: () => void;
}

export function HouseCard({ house, rank, isUserHouse, onClick }: HouseCardProps) {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return { emoji: '1', bg: 'bg-yellow-100', text: 'text-yellow-700' };
    if (rank === 2) return { emoji: '2', bg: 'bg-neutral-100', text: 'text-neutral-600' };
    if (rank === 3) return { emoji: '3', bg: 'bg-orange-100', text: 'text-orange-700' };
    return { emoji: `${rank}`, bg: 'bg-neutral-50', text: 'text-neutral-500' };
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative p-5 bg-white rounded-xl shadow-card transition-all
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}
        ${isUserHouse ? 'ring-2 ring-primary ring-offset-2' : ''}
      `}
    >
      {/* Rank badge */}
      {rank && (
        <div
          className={`
            absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center
            font-bold text-sm ${getRankBadge(rank).bg} ${getRankBadge(rank).text}
            shadow-md
          `}
        >
          {getRankBadge(rank).emoji}
        </div>
      )}

      {/* House color banner */}
      <div
        className="h-2 rounded-full mb-4"
        style={{ backgroundColor: house.color }}
      />

      {/* House icon */}
      <div
        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${house.color}20` }}
      >
        <svg
          className="w-8 h-8"
          fill={house.color}
          viewBox="0 0 24 24"
        >
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
        </svg>
      </div>

      {/* House name */}
      <h3 className="text-lg font-semibold text-center text-neutral-900 mb-1">
        {house.name}
      </h3>

      {isUserHouse && (
        <p className="text-xs text-center text-primary font-medium mb-2">Your House</p>
      )}

      {/* Description */}
      {house.description && (
        <p className="text-sm text-neutral-500 text-center mb-4 line-clamp-2">
          {house.description}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="text-center p-2 bg-neutral-50 rounded-lg">
          <p className="text-lg font-bold" style={{ color: house.color }}>
            {house.totalPoints?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-neutral-500">Points</p>
        </div>
        <div className="text-center p-2 bg-neutral-50 rounded-lg">
          <p className="text-lg font-bold text-neutral-700">
            {house.memberCount || 0}
          </p>
          <p className="text-xs text-neutral-500">Members</p>
        </div>
      </div>
    </div>
  );
}

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  count?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  count,
  interactive = false,
  onChange,
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: maxRating }, (_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= rating;
          const isHalfFilled = starValue > rating && starValue - 0.5 <= rating;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(starValue)}
              disabled={!interactive}
              className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} focus:outline-none`}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400'
                    : isHalfFilled
                    ? 'text-amber-400 fill-amber-200'
                    : 'text-neutral-300'
                }`}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className={`${textSizeClasses[size]} font-medium text-neutral-700`}>
          {rating.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className={`${textSizeClasses[size]} text-neutral-500`}>
          ({count})
        </span>
      )}
    </div>
  );
}

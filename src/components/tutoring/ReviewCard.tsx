import { ThumbsUp, MessageCircle } from 'lucide-react';
import { StarRating } from './StarRating';
import type { TeacherReview } from '@/types/tutoring';

interface ReviewCardProps {
  review: TeacherReview;
  onHelpful?: (reviewId: string) => void;
}

export function ReviewCard({ review, onHelpful }: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
            {review.studentName?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div>
            <h4 className="font-medium text-neutral-900">
              {review.studentName || 'Student'}
            </h4>
            <p className="text-sm text-neutral-500">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      {/* Title */}
      {review.title && (
        <h5 className="mt-3 font-medium text-neutral-900">{review.title}</h5>
      )}

      {/* Review text */}
      {review.reviewText && (
        <p className="mt-2 text-neutral-600 text-sm leading-relaxed">
          {review.reviewText}
        </p>
      )}

      {/* Aspect ratings */}
      {(review.knowledgeRating || review.communicationRating || review.punctualityRating || review.patienceRating) && (
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          {review.knowledgeRating && (
            <div className="flex items-center gap-1">
              <span className="text-neutral-500">Knowledge:</span>
              <StarRating rating={review.knowledgeRating} size="sm" />
            </div>
          )}
          {review.communicationRating && (
            <div className="flex items-center gap-1">
              <span className="text-neutral-500">Communication:</span>
              <StarRating rating={review.communicationRating} size="sm" />
            </div>
          )}
          {review.punctualityRating && (
            <div className="flex items-center gap-1">
              <span className="text-neutral-500">Punctuality:</span>
              <StarRating rating={review.punctualityRating} size="sm" />
            </div>
          )}
          {review.patienceRating && (
            <div className="flex items-center gap-1">
              <span className="text-neutral-500">Patience:</span>
              <StarRating rating={review.patienceRating} size="sm" />
            </div>
          )}
        </div>
      )}

      {/* Teacher response */}
      {review.teacherResponse && (
        <div className="mt-4 pl-4 border-l-2 border-blue-200 bg-blue-50 rounded-r-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-700 font-medium mb-1">
            <MessageCircle className="w-4 h-4" />
            Teacher's Response
          </div>
          <p className="text-sm text-neutral-600">{review.teacherResponse}</p>
          {review.teacherRespondedAt && (
            <p className="mt-1 text-xs text-neutral-400">
              {formatDate(review.teacherRespondedAt)}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-4">
        <button
          onClick={() => onHelpful?.(review.id)}
          className="flex items-center gap-1 text-sm text-neutral-500 hover:text-blue-600 transition-colors"
        >
          <ThumbsUp className="w-4 h-4" />
          Helpful ({review.helpfulCount})
        </button>
      </div>
    </div>
  );
}

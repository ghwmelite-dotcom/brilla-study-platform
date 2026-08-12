import { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import { tutoringService } from '@/lib/services';
import type { TutoringSession } from '@/types/tutoring';

interface ReviewFormProps {
  session: TutoringSession;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function RatingInput({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                star <= (hovered || value)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-neutral-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-neutral-500 self-center">
          {value > 0 ? `${value}/5` : 'Select rating'}
        </span>
      </div>
    </div>
  );
}

export function ReviewForm({ session, isOpen, onClose, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [knowledgeRating, setKnowledgeRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [patienceRating, setPatienceRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please provide an overall rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await tutoringService.submitReview(session.id, {
        rating,
        title: title || undefined,
        reviewText: reviewText || undefined,
        knowledgeRating: knowledgeRating || undefined,
        communicationRating: communicationRating || undefined,
        punctualityRating: punctualityRating || undefined,
        patienceRating: patienceRating || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Review Your Session</h2>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Session info */}
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
              {session.teacherProfilePhotoUrl ? (
                <img
                  src={session.teacherProfilePhotoUrl}
                  alt={session.teacherName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-blue-600 font-bold text-lg">
                  {session.teacherName?.charAt(0) || 'T'}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-medium text-neutral-900">{session.teacherName}</h3>
              <p className="text-sm text-neutral-500">{session.subjectName}</p>
            </div>
          </div>

          {/* Overall Rating */}
          <RatingInput
            label="Overall Rating"
            value={rating}
            onChange={setRating}
            required
          />

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Review Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={100}
            />
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Your Review (optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this tutor..."
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-neutral-400 mt-1">{reviewText.length}/1000</p>
          </div>

          {/* Detailed Ratings */}
          <div className="border-t border-neutral-200 pt-6">
            <h4 className="text-sm font-medium text-neutral-700 mb-4">
              Detailed Ratings (optional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <RatingInput
                label="Knowledge"
                value={knowledgeRating}
                onChange={setKnowledgeRating}
              />
              <RatingInput
                label="Communication"
                value={communicationRating}
                onChange={setCommunicationRating}
              />
              <RatingInput
                label="Punctuality"
                value={punctualityRating}
                onChange={setPunctualityRating}
              />
              <RatingInput
                label="Patience"
                value={patienceRating}
                onChange={setPatienceRating}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

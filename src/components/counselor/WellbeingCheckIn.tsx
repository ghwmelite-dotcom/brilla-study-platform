import { useState } from 'react';
import { X, Heart, Battery, BookOpen, Frown, Smile } from 'lucide-react';
import { cn } from '@/utils';
import { useCounselorStore } from '@/stores';
import { MOOD_OPTIONS } from '@/types/counselor';
import type { MoodType } from '@/types';

export function WellbeingCheckIn() {
  const { showWellbeingCheckIn, closeWellbeingCheckIn, logWellbeing, isLoading } = useCounselorStore();

  const [mood, setMood] = useState<MoodType | null>(null);
  const [stressLevel, setStressLevel] = useState<number>(3);
  const [studySatisfaction, setStudySatisfaction] = useState<number>(3);
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!showWellbeingCheckIn) return null;

  const handleSubmit = async () => {
    if (!mood) {
      setError('Please select how you\'re feeling');
      return;
    }

    try {
      await logWellbeing({
        logDate: new Date().toISOString().split('T')[0],
        mood,
        stressLevel,
        studySatisfaction,
        energyLevel,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setMood(null);
      setStressLevel(3);
      setStudySatisfaction(3);
      setEnergyLevel(3);
      setNotes('');
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      console.error('WellbeingCheckIn error:', err);
      setError(errorMessage);
    }
  };

  const handleClose = () => {
    closeWellbeingCheckIn();
    setMood(null);
    setStressLevel(3);
    setStudySatisfaction(3);
    setEnergyLevel(3);
    setNotes('');
    setError(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-neutral-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-neutral-900 text-sm sm:text-base">Daily Check-in</h2>
                <p className="text-xs text-neutral-500">How are you feeling today?</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Mood Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2 sm:mb-3">
                How are you feeling right now?
              </label>
              <div className="flex justify-between gap-1 sm:gap-2">
                {MOOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setMood(option.value);
                      setError(null);
                    }}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-0.5 sm:gap-1 p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all',
                      mood === option.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    )}
                  >
                    <span className="text-xl sm:text-2xl">{option.emoji}</span>
                    <span className="text-[10px] sm:text-xs font-medium text-neutral-600">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stress Level */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5 sm:gap-2">
                  <Frown className="w-4 h-4 text-orange-500" />
                  Stress Level
                </label>
                <span className="text-xs sm:text-sm text-neutral-500">{stressLevel}/5</span>
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setStressLevel(level)}
                    className={cn(
                      'flex-1 h-9 sm:h-10 rounded-lg font-medium text-sm transition-all',
                      stressLevel === level
                        ? 'bg-orange-500 text-white'
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] sm:text-xs text-neutral-400">Low</span>
                <span className="text-[10px] sm:text-xs text-neutral-400">High</span>
              </div>
            </div>

            {/* Study Satisfaction */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5 sm:gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  Study Satisfaction
                </label>
                <span className="text-xs sm:text-sm text-neutral-500">{studySatisfaction}/5</span>
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setStudySatisfaction(level)}
                    className={cn(
                      'flex-1 h-9 sm:h-10 rounded-lg font-medium text-sm transition-all',
                      studySatisfaction === level
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] sm:text-xs text-neutral-400">Not satisfied</span>
                <span className="text-[10px] sm:text-xs text-neutral-400">Very satisfied</span>
              </div>
            </div>

            {/* Energy Level */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5 sm:gap-2">
                  <Battery className="w-4 h-4 text-green-500" />
                  Energy Level
                </label>
                <span className="text-xs sm:text-sm text-neutral-500">{energyLevel}/5</span>
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setEnergyLevel(level)}
                    className={cn(
                      'flex-1 h-9 sm:h-10 rounded-lg font-medium text-sm transition-all',
                      energyLevel === level
                        ? 'bg-green-500 text-white'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] sm:text-xs text-neutral-400">Low</span>
                <span className="text-[10px] sm:text-xs text-neutral-400">High</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <Smile className="w-4 h-4 text-purple-500" />
                Anything else? (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your thoughts here..."
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-neutral-200 rounded-xl resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                rows={2}
              />
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="flex gap-2 sm:gap-3 p-3 sm:p-4 border-t border-neutral-200 flex-shrink-0">
            <button
              onClick={handleClose}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-neutral-200 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50 transition-colors text-sm"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !mood}
              className={cn(
                'flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-colors text-sm',
                mood
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              )}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

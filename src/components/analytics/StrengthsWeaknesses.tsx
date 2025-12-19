import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import type { TopicStrength } from '@/utils/analyticsUtils';
import { getSubjectColor } from '@/utils/analyticsUtils';

interface StrengthsWeaknessesProps {
  strengths: TopicStrength[];
  weaknesses: TopicStrength[];
  onTopicClick?: (topicId: string) => void;
}

export function StrengthsWeaknesses({
  strengths,
  weaknesses,
  onTopicClick,
}: StrengthsWeaknessesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Strengths */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-neutral-900">Your Strengths</h3>
        </div>

        <div className="space-y-3">
          {strengths.length > 0 ? (
            strengths.map((topic) => (
              <div
                key={topic.topicId}
                onClick={() => onTopicClick?.(topic.topicId)}
                className={`
                  p-4 rounded-lg bg-green-50 border border-green-100
                  ${onTopicClick ? 'cursor-pointer hover:bg-green-100 transition-colors' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">{topic.topicName}</p>
                    <p className="text-sm text-neutral-500">{topic.subjectName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">{topic.masteryLevel}%</span>
                    {onTopicClick && <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${topic.masteryLevel}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-neutral-500">
                  <span>{topic.questionsAttempted} questions</span>
                  <span>{topic.accuracy}% accuracy</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-neutral-500 text-center py-4">
              Complete more questions to identify your strengths
            </p>
          )}
        </div>
      </div>

      {/* Weaknesses */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-neutral-900">Needs Improvement</h3>
        </div>

        <div className="space-y-3">
          {weaknesses.length > 0 ? (
            weaknesses.map((topic) => (
              <div
                key={topic.topicId}
                onClick={() => onTopicClick?.(topic.topicId)}
                className={`
                  p-4 rounded-lg bg-red-50 border border-red-100
                  ${onTopicClick ? 'cursor-pointer hover:bg-red-100 transition-colors' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">{topic.topicName}</p>
                    <p className="text-sm text-neutral-500">{topic.subjectName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-bold">{topic.masteryLevel}%</span>
                    {onTopicClick && <ChevronRight className="w-4 h-4 text-neutral-400" />}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${topic.masteryLevel}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-neutral-500">
                  <span>{topic.questionsAttempted} questions</span>
                  <span>{topic.accuracy}% accuracy</span>
                </div>

                {/* Recommendation */}
                <div className="mt-3 p-2 bg-white rounded-lg border border-red-100">
                  <p className="text-xs text-neutral-600">
                    <span className="font-medium text-red-600">Tip:</span> Practice more {topic.topicName.toLowerCase()} questions to improve your mastery.
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-neutral-500 text-center py-4">
              Great job! No weak areas identified yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

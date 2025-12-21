import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { useGradingStore } from '@/stores/gradingStore';
import type { AssessmentAttemptAnswer } from '@/types';
import { cn } from '@/utils';

interface AnswerGraderProps {
  answer: AssessmentAttemptAnswer;
  questionNumber: number;
}

export function AnswerGrader({ answer, questionNumber }: AnswerGraderProps) {
  const { gradeAnswer, isSaving } = useGradingStore();

  const [marks, setMarks] = useState<number>(
    answer.manualMarks ?? answer.autoMarks ?? 0
  );
  const [comment, setComment] = useState(answer.teacherComment || '');
  const [showComment, setShowComment] = useState(!!answer.teacherComment);

  // Mock question data - in real app, this would come from the answer or question
  const maxMarks = 5; // This should come from the actual question
  const questionText = 'Sample question text would appear here';

  const handleGrade = async (value: number) => {
    setMarks(value);
    try {
      await gradeAnswer(answer.id, value, comment || undefined);
    } catch (error) {
      console.error('Failed to grade:', error);
    }
  };

  const handleCommentSave = async () => {
    try {
      await gradeAnswer(answer.id, marks, comment || undefined);
    } catch (error) {
      console.error('Failed to save comment:', error);
    }
  };

  const quickMarks = [0, 1, 2, 3, 4, 5].filter((m) => m <= maxMarks);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Question Header */}
      <div className="p-6 border-b border-neutral-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-purple-600">
            Question {questionNumber}
          </span>
          <span className="text-sm text-neutral-500">{maxMarks} marks</span>
        </div>
        <p className="text-neutral-900 leading-relaxed">{questionText}</p>
      </div>

      {/* Student Answer */}
      <div className="p-6 bg-neutral-50">
        <p className="text-sm font-medium text-neutral-500 mb-2">Student's Answer:</p>
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          {answer.answerText ? (
            <p className="text-neutral-900 whitespace-pre-wrap">{answer.answerText}</p>
          ) : (
            <p className="text-neutral-400 italic">No answer provided</p>
          )}
        </div>
      </div>

      {/* Grading Section */}
      <div className="p-6">
        {/* Auto-graded indicator */}
        {answer.isCorrect !== undefined && (
          <div
            className={cn(
              'flex items-center gap-2 mb-4 p-3 rounded-lg',
              answer.isCorrect
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            )}
          >
            {answer.isCorrect ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Correct answer (auto-graded)</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Incorrect answer (auto-graded)</span>
              </>
            )}
          </div>
        )}

        {/* Manual Grading */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Assign Marks
          </label>

          {/* Quick Score Buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            {quickMarks.map((m) => (
              <button
                key={m}
                onClick={() => handleGrade(m)}
                disabled={isSaving}
                className={cn(
                  'w-12 h-12 rounded-xl font-medium transition-colors',
                  marks === m
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                )}
              >
                {m}
              </button>
            ))}
            {isSaving && (
              <div className="w-12 h-12 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              </div>
            )}
          </div>

          {/* Custom marks input */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500">Custom:</span>
            <input
              type="number"
              min="0"
              max={maxMarks}
              value={marks}
              onChange={(e) => setMarks(parseInt(e.target.value) || 0)}
              onBlur={() => handleGrade(marks)}
              className="w-20 px-3 py-2 border border-neutral-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
            <span className="text-sm text-neutral-500">/ {maxMarks}</span>
          </div>
        </div>

        {/* Comment Toggle */}
        <button
          onClick={() => setShowComment(!showComment)}
          className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 mb-3"
        >
          <MessageSquare className="w-4 h-4" />
          {showComment ? 'Hide comment' : 'Add comment'}
        </button>

        {/* Comment Input */}
        {showComment && (
          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onBlur={handleCommentSave}
              placeholder="Add feedback for this answer..."
              rows={3}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
            />
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
        <span
          className={cn(
            'text-sm font-medium',
            marks > 0 ? 'text-green-600' : 'text-neutral-500'
          )}
        >
          {marks > 0 ? (
            <>
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Graded: {marks}/{maxMarks} marks
            </>
          ) : (
            'Not graded yet'
          )}
        </span>
      </div>
    </div>
  );
}

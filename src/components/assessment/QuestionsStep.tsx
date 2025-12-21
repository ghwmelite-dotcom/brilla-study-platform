import { useState } from 'react';
import {
  GripVertical,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  BookOpen,
  PenTool,
  HelpCircle,
} from 'lucide-react';
import type { AssessmentDraft, AssessmentQuestionDraft, QuestionType } from '@/types';
import { QuestionPicker } from './QuestionPicker';
import { QuestionCreator } from './QuestionCreator';
import { cn } from '@/utils';

interface QuestionsStepProps {
  draft: AssessmentDraft;
  onUpdate: (updates: Partial<AssessmentDraft>) => void;
}

export function QuestionsStep({ draft, onUpdate }: QuestionsStepProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AssessmentQuestionDraft | null>(null);
  const [expandedQuestion] = useState<string | null>(null);

  const totalMarks = draft.questions.reduce((sum, q) => sum + q.marks, 0);

  const addQuestionsFromBank = (questions: AssessmentQuestionDraft[]) => {
    const newQuestions = [...draft.questions, ...questions];
    // Update display order
    newQuestions.forEach((q, i) => {
      q.displayOrder = i;
    });
    onUpdate({ questions: newQuestions });
    setShowPicker(false);
  };

  const addCustomQuestion = (question: AssessmentQuestionDraft) => {
    if (editingQuestion) {
      // Update existing
      const updated = draft.questions.map((q) =>
        q.id === editingQuestion.id ? { ...question, id: editingQuestion.id } : q
      );
      onUpdate({ questions: updated });
      setEditingQuestion(null);
    } else {
      // Add new
      const newQuestion = {
        ...question,
        id: `temp-${Date.now()}`,
        displayOrder: draft.questions.length,
      };
      onUpdate({ questions: [...draft.questions, newQuestion] });
    }
    setShowCreator(false);
  };

  const removeQuestion = (questionId: string) => {
    const updated = draft.questions.filter((q) => q.id !== questionId);
    updated.forEach((q, i) => {
      q.displayOrder = i;
    });
    onUpdate({ questions: updated });
  };

  const updateQuestionMarks = (questionId: string, marks: number) => {
    const updated = draft.questions.map((q) =>
      q.id === questionId ? { ...q, marks } : q
    );
    onUpdate({ questions: updated });
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= draft.questions.length) return;

    const questions = [...draft.questions];
    [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];
    questions.forEach((q, i) => {
      q.displayOrder = i;
    });
    onUpdate({ questions });
  };

  const getQuestionTypeLabel = (type?: QuestionType) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'true_false':
        return 'True/False';
      case 'short_answer':
        return 'Short Answer';
      case 'essay':
        return 'Essay';
      case 'fill_blank':
        return 'Fill in the Blank';
      case 'direct_answer':
        return 'Direct Answer';
      default:
        return 'Question';
    }
  };

  const getQuestionTypeColor = (type?: QuestionType) => {
    switch (type) {
      case 'multiple_choice':
        return 'bg-blue-100 text-blue-700';
      case 'true_false':
        return 'bg-green-100 text-green-700';
      case 'short_answer':
      case 'essay':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-1">
            Questions
          </h2>
          <p className="text-neutral-500">
            Add questions from the bank or create new ones
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-indigo-600">{totalMarks}</p>
          <p className="text-sm text-neutral-500">Total Marks</p>
        </div>
      </div>

      {/* Add Question Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <BookOpen className="w-4 h-4" />
          Add from Question Bank
        </button>
        <button
          onClick={() => {
            setEditingQuestion(null);
            setShowCreator(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
        >
          <PenTool className="w-4 h-4" />
          Create New Question
        </button>
      </div>

      {/* Questions List */}
      {draft.questions.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-300">
          <HelpCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="font-medium text-neutral-700 mb-1">No questions yet</h3>
          <p className="text-sm text-neutral-500 mb-4">
            Start by adding questions from the bank or creating new ones
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {draft.questions.map((question, index) => (
            <div
              key={question.id}
              className="bg-neutral-50 rounded-xl border border-neutral-200 overflow-hidden"
            >
              {/* Question Header */}
              <div className="flex items-center gap-3 p-4">
                <button className="text-neutral-400 cursor-grab hover:text-neutral-600">
                  <GripVertical className="w-5 h-5" />
                </button>

                <span className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 truncate">
                    {question.customQuestionText || question.questionId || 'Question'}
                  </p>
                  <span
                    className={cn(
                      'inline-block px-2 py-0.5 rounded text-xs font-medium mt-1',
                      getQuestionTypeColor(question.customQuestionType)
                    )}
                  >
                    {getQuestionTypeLabel(question.customQuestionType)}
                  </span>
                </div>

                {/* Marks */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={question.marks}
                    onChange={(e) =>
                      updateQuestionMarks(question.id!, parseInt(e.target.value) || 1)
                    }
                    className="w-16 px-2 py-1 border border-neutral-300 rounded text-center text-sm"
                  />
                  <span className="text-sm text-neutral-500">marks</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveQuestion(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 rounded disabled:opacity-50"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveQuestion(index, 'down')}
                    disabled={index === draft.questions.length - 1}
                    className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 rounded disabled:opacity-50"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingQuestion(question);
                      setShowCreator(true);
                    }}
                    className="p-1.5 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeQuestion(question.id!)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded View (optional) */}
              {expandedQuestion === question.id && (
                <div className="px-4 pb-4 pt-0 border-t border-neutral-200">
                  <p className="text-sm text-neutral-600 mt-3">
                    {question.customQuestionText}
                  </p>
                  {question.customOptions && (
                    <div className="mt-2 space-y-1">
                      {question.customOptions.map((opt, i) => (
                        <div
                          key={i}
                          className={cn(
                            'text-sm px-2 py-1 rounded',
                            opt.isCorrect
                              ? 'bg-green-100 text-green-700'
                              : 'bg-neutral-100 text-neutral-600'
                          )}
                        >
                          {String.fromCharCode(65 + i)}. {opt.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {draft.questions.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-indigo-600">Questions</p>
              <p className="text-xl font-bold text-indigo-900">
                {draft.questions.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-indigo-600">Total Marks</p>
              <p className="text-xl font-bold text-indigo-900">{totalMarks}</p>
            </div>
          </div>
        </div>
      )}

      {/* Question Picker Modal */}
      {showPicker && (
        <QuestionPicker
          onSelect={addQuestionsFromBank}
          onClose={() => setShowPicker(false)}
          existingIds={draft.questions
            .filter((q) => q.questionId)
            .map((q) => q.questionId!)}
        />
      )}

      {/* Question Creator Modal */}
      {showCreator && (
        <QuestionCreator
          initialData={editingQuestion || undefined}
          onSave={addCustomQuestion}
          onClose={() => {
            setShowCreator(false);
            setEditingQuestion(null);
          }}
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import type { AssessmentQuestionDraft, QuestionType, QuestionOption } from '@/types';
import { cn } from '@/utils';

interface QuestionCreatorProps {
  initialData?: AssessmentQuestionDraft;
  onSave: (question: AssessmentQuestionDraft) => void;
  onClose: () => void;
}

export function QuestionCreator({ initialData, onSave, onClose }: QuestionCreatorProps) {
  const [questionType, setQuestionType] = useState<QuestionType>(
    initialData?.customQuestionType || 'multiple_choice'
  );
  const [questionText, setQuestionText] = useState(
    initialData?.customQuestionText || ''
  );
  const [options, setOptions] = useState<QuestionOption[]>(
    initialData?.customOptions || [
      { id: '1', text: '', isCorrect: false },
      { id: '2', text: '', isCorrect: false },
      { id: '3', text: '', isCorrect: false },
      { id: '4', text: '', isCorrect: false },
    ]
  );
  const [correctAnswer, setCorrectAnswer] = useState(
    initialData?.customCorrectAnswer || ''
  );
  const [explanation, setExplanation] = useState(
    initialData?.customExplanation || ''
  );
  const [marks, setMarks] = useState(initialData?.marks || 1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const questionTypes: { type: QuestionType; label: string }[] = [
    { type: 'multiple_choice', label: 'Multiple Choice' },
    { type: 'true_false', label: 'True/False' },
    { type: 'short_answer', label: 'Short Answer' },
    { type: 'essay', label: 'Essay' },
    { type: 'direct_answer', label: 'Direct Answer' },
  ];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!questionText.trim()) {
      newErrors.question = 'Question text is required';
    }

    if (questionType === 'multiple_choice') {
      const filledOptions = options.filter((o) => o.text.trim());
      if (filledOptions.length < 2) {
        newErrors.options = 'At least 2 options are required';
      }
      if (!options.some((o) => o.isCorrect)) {
        newErrors.correct = 'Select the correct answer';
      }
    }

    if (questionType === 'true_false' && !correctAnswer) {
      newErrors.correct = 'Select True or False';
    }

    if (
      (questionType === 'short_answer' || questionType === 'direct_answer') &&
      !correctAnswer.trim()
    ) {
      newErrors.correct = 'Correct answer is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const question: AssessmentQuestionDraft = {
      id: initialData?.id || `custom_${Date.now()}`,
      source: 'custom',
      customQuestionText: questionText.trim(),
      customQuestionType: questionType,
      marks,
      displayOrder: initialData?.displayOrder || 0,
    };

    if (questionType === 'multiple_choice') {
      question.customOptions = options.filter((o) => o.text.trim());
      const correct = options.find((o) => o.isCorrect);
      if (correct) {
        question.customCorrectAnswer = correct.text;
      }
    } else if (questionType === 'true_false') {
      question.customOptions = [
        { id: 'true', text: 'True', isCorrect: correctAnswer === 'true' },
        { id: 'false', text: 'False', isCorrect: correctAnswer === 'false' },
      ];
      question.customCorrectAnswer = correctAnswer;
    } else {
      question.customCorrectAnswer = correctAnswer.trim();
    }

    if (explanation.trim()) {
      question.customExplanation = explanation.trim();
    }

    onSave(question);
  };

  const updateOption = (index: number, updates: Partial<QuestionOption>) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    setOptions(newOptions);
  };

  const setCorrectOption = (index: number) => {
    const newOptions = options.map((o, i) => ({
      ...o,
      isCorrect: i === index,
    }));
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([
      ...options,
      { id: String(options.length + 1), text: '', isCorrect: false },
    ]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            {initialData ? 'Edit Question' : 'Create Question'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Question Type
            </label>
            <div className="flex flex-wrap gap-2">
              {questionTypes.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => setQuestionType(type)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    questionType === type
                      ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                      : 'bg-neutral-100 text-neutral-700 border-2 border-transparent hover:bg-neutral-200'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Question <span className="text-red-500">*</span>
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question here..."
              rows={3}
              className={cn(
                'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none',
                errors.question ? 'border-red-300' : 'border-neutral-300'
              )}
            />
            {errors.question && (
              <p className="mt-1 text-sm text-red-500">{errors.question}</p>
            )}
          </div>

          {/* Multiple Choice Options */}
          {questionType === 'multiple_choice' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Options <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCorrectOption(index)}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0',
                        option.isCorrect
                          ? 'bg-green-500 border-green-500'
                          : 'border-neutral-300 hover:border-green-400'
                      )}
                      title="Mark as correct"
                    >
                      {option.isCorrect && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <span className="text-sm text-neutral-500 w-6">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateOption(index, { text: e.target.value })}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    {options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 6 && (
                <button
                  onClick={addOption}
                  className="mt-2 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Option
                </button>
              )}
              {(errors.options || errors.correct) && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.options || errors.correct}
                </p>
              )}
            </div>
          )}

          {/* True/False */}
          {questionType === 'true_false' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Correct Answer <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setCorrectAnswer('true')}
                  className={cn(
                    'flex-1 py-3 rounded-lg font-medium transition-colors',
                    correctAnswer === 'true'
                      ? 'bg-green-100 text-green-700 border-2 border-green-500'
                      : 'bg-neutral-100 text-neutral-700 border-2 border-transparent hover:bg-neutral-200'
                  )}
                >
                  True
                </button>
                <button
                  onClick={() => setCorrectAnswer('false')}
                  className={cn(
                    'flex-1 py-3 rounded-lg font-medium transition-colors',
                    correctAnswer === 'false'
                      ? 'bg-red-100 text-red-700 border-2 border-red-500'
                      : 'bg-neutral-100 text-neutral-700 border-2 border-transparent hover:bg-neutral-200'
                  )}
                >
                  False
                </button>
              </div>
              {errors.correct && (
                <p className="mt-1 text-sm text-red-500">{errors.correct}</p>
              )}
            </div>
          )}

          {/* Short Answer / Direct Answer */}
          {(questionType === 'short_answer' || questionType === 'direct_answer') && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Correct Answer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="Enter the correct answer"
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
                  errors.correct ? 'border-red-300' : 'border-neutral-300'
                )}
              />
              {errors.correct && (
                <p className="mt-1 text-sm text-red-500">{errors.correct}</p>
              )}
              <p className="mt-1 text-xs text-neutral-500">
                {questionType === 'short_answer'
                  ? 'This will be used for manual grading reference'
                  : 'Student answers must match exactly (case-insensitive)'}
              </p>
            </div>
          )}

          {/* Essay - No correct answer needed */}
          {questionType === 'essay' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                Essay questions require manual grading. You can add a model answer or rubric in the explanation field.
              </p>
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Explanation (Optional)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain why this is the correct answer..."
              rows={2}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Marks */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Marks
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="100"
                value={marks}
                onChange={(e) => setMarks(parseInt(e.target.value) || 1)}
                className="w-24 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-center"
              />
              <div className="flex gap-1">
                {[1, 2, 5, 10].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMarks(m)}
                    className={cn(
                      'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                      marks === m
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            {initialData ? 'Update Question' : 'Add Question'}
          </button>
        </div>
      </div>
    </div>
  );
}

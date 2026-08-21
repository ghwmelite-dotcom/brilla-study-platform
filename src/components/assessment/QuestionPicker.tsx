import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  X,
  Check,
  ChevronDown,
  Loader2,
  BookOpen,
} from 'lucide-react';
import type { AssessmentQuestionDraft, Question, QuestionType } from '@/types';
import { api } from '@/lib/api';
import { cn } from '@/utils';

interface QuestionPickerProps {
  onSelect: (questions: AssessmentQuestionDraft[]) => void;
  onClose: () => void;
  existingIds: string[];
}

export function QuestionPicker({ onSelect, onClose, existingIds }: QuestionPickerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<QuestionType | ''>('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (typeFilter) params.append('type', typeFilter);
      if (subjectFilter) params.append('subject', subjectFilter);

      const response = await api.get<{ questions: Question[] }>(
        `/questions/bank?${params.toString()}`
      );
      if (response.success && response.data) {
        // Filter out already added questions
        const filtered = response.data.questions.filter(
          (q) => !existingIds.includes(q.id)
        );
        setQuestions(filtered);
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [existingIds, searchQuery, subjectFilter, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(loadQuestions, 300);
    return () => clearTimeout(timer);
  }, [loadQuestions]);

  const toggleQuestion = (questionId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(questions.map((q) => q.id)));
  };

  const handleAdd = () => {
    const selected = questions
      .filter((q) => selectedIds.has(q.id))
      .map((q, index) => ({
        id: `temp_${q.id}_${Date.now()}`,
        source: 'existing' as const,
        questionId: q.id,
        customQuestionText: q.questionText,
        customQuestionType: q.questionType,
        customOptions: q.options,
        customCorrectAnswer: q.correctAnswer,
        marks: q.marks || 1,
        displayOrder: index,
        question: q,
      }));
    onSelect(selected);
  };

  const getTypeLabel = (type: QuestionType) => {
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
        return 'Fill Blank';
      case 'direct_answer':
        return 'Direct Answer';
      default:
        return type;
    }
  };

  const getTypeColor = (type: QuestionType) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Add from Question Bank
            </h2>
            <p className="text-sm text-neutral-500">
              Select questions to add to your assessment
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-neutral-200 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
            />
          </div>

          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as QuestionType | '')}
              className="pl-3 pr-8 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white text-sm"
            >
              <option value="">All Types</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True/False</option>
              <option value="short_answer">Short Answer</option>
              <option value="essay">Essay</option>
              <option value="direct_answer">Direct Answer</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="pl-3 pr-8 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white text-sm"
            >
              <option value="">All Subjects</option>
              <option value="mathematics">Mathematics</option>
              <option value="english">English</option>
              <option value="science">Science</option>
              <option value="social-studies">Social Studies</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        {/* Selection Actions */}
        <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between text-sm">
          <p className="text-neutral-600">
            {selectedIds.size} of {questions.length} selected
          </p>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Select All
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-neutral-500 hover:text-neutral-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">No questions found</p>
              <p className="text-sm text-neutral-400 mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {questions.map((question) => {
                const isSelected = selectedIds.has(question.id);
                return (
                  <button
                    key={question.id}
                    onClick={() => toggleQuestion(question.id)}
                    className={cn(
                      'w-full p-4 rounded-xl border text-left transition-all',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5',
                          isSelected
                            ? 'bg-indigo-500 border-indigo-500'
                            : 'border-neutral-300'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-neutral-900 line-clamp-2">
                          {question.questionText}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-xs font-medium',
                              getTypeColor(question.questionType)
                            )}
                          >
                            {getTypeLabel(question.questionType)}
                          </span>
                          {question.difficulty && (
                            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs">
                              {question.difficulty}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
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
            onClick={handleAdd}
            disabled={selectedIds.size === 0}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
              selectedIds.size > 0
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            )}
          >
            Add {selectedIds.size > 0 ? `${selectedIds.size} ` : ''}Question
            {selectedIds.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

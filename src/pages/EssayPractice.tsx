import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Send,
  Sparkles,
  Clock,
  ArrowLeft,
  Loader2,
  Filter,
  Search,
  History,
  CheckCircle,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/common';
import { EssayEditor, EssayQuestion, EssayFeedback, ModelAnswer } from '@/components/essay';
import { useEssayStore } from '@/stores';
import { essayQuestions as dataEssayQuestions } from '@/data';
import { api } from '@/lib/api';
import type { EssayQuestion as EssayQuestionType } from '@/types';

// Transform data essay questions to match the component format
const sampleQuestions: EssayQuestionType[] = dataEssayQuestions.map((eq) => ({
  id: eq.id,
  questionId: eq.questionId || eq.id,
  questionText: eq.questionText || '',
  subject: eq.subjectId?.replace('subj_wassce_', '').replace('subj_bece_', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  topic: (eq.questionText || '').split('.')[0].slice(0, 50),
  wordLimitMin: eq.wordLimitMin,
  wordLimitMax: eq.wordLimitMax,
  marks: eq.marks,
  aiGradingEnabled: eq.aiGradingEnabled,
  markingScheme: eq.markingScheme,
  modelAnswer: eq.modelAnswer,
}));

type ViewMode = 'browse' | 'write' | 'results' | 'history';

interface EssayAttempt {
  id: string;
  questionId: string;
  questionText: string;
  subject: string;
  submittedAt: string;
  score: number | null;
  maxScore: number;
  status: 'pending' | 'graded';
}

export function EssayPracticePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [selectedQuestion, setSelectedQuestion] = useState<EssayQuestionType | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // History state
  const [essayHistory, setEssayHistory] = useState<EssayAttempt[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const {
    currentDraft,
    wordCount,
    isSubmitting,
    isGrading,
    gradingResult,
    updateDraft,
    submitEssay,
    requestAIGrading,
    clearCurrentSession,
    error,
  } = useEssayStore();

  // Fetch essay history when viewing history
  const fetchEssayHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get<Array<{
        id: string;
        essay_question_id: string;
        submitted_at: string;
        score: number | null;
        grading_status: string;
        essay_question?: {
          question_text: string;
          marks: number;
          subject_id: string;
        };
      }>>('/essays/attempts?limit=20');
      const response = res.success ? res.data : null;

      if (response && Array.isArray(response)) {
        const history: EssayAttempt[] = response.map(attempt => ({
          id: attempt.id,
          questionId: attempt.essay_question_id,
          questionText: attempt.essay_question?.question_text?.slice(0, 100) + '...' || 'Essay Question',
          subject: attempt.essay_question?.subject_id?.replace('subj_', '').replace(/_/g, ' ') || 'General',
          submittedAt: attempt.submitted_at,
          score: attempt.score,
          maxScore: attempt.essay_question?.marks || 20,
          status: attempt.grading_status === 'graded' ? 'graded' : 'pending',
        }));
        setEssayHistory(history);
      }
    } catch (err) {
      console.error('Failed to fetch essay history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handle question selection from URL
  useEffect(() => {
    const questionId = searchParams.get('question');
    if (questionId) {
      const question = sampleQuestions.find((q) => q.id === questionId);
      if (question) {
        setSelectedQuestion(question);
        setViewMode('write');
      }
    }
  }, [searchParams]);

  const handleSelectQuestion = (question: EssayQuestionType) => {
    setSelectedQuestion(question);
    setSearchParams({ question: question.id });
    setViewMode('write');
    clearCurrentSession();
  };

  const handleBack = () => {
    setViewMode('browse');
    setSelectedQuestion(null);
    setSearchParams({});
    clearCurrentSession();
  };

  const handleSubmit = async () => {
    if (!selectedQuestion || !currentDraft.trim()) return;

    // Strip HTML tags for word count validation
    const plainText = currentDraft.replace(/<[^>]*>/g, '');
    const words = plainText.trim().split(/\s+/).filter((w) => w.length > 0).length;

    if (selectedQuestion.wordLimitMin && words < selectedQuestion.wordLimitMin) {
      alert(`Please write at least ${selectedQuestion.wordLimitMin} words.`);
      return;
    }

    const attempt = await submitEssay(selectedQuestion.id, currentDraft);
    if (attempt) {
      // Automatically request AI grading
      await requestAIGrading(attempt.id);
      setViewMode('results');
    }
  };

  // Filter questions
  const filteredQuestions = sampleQuestions.filter((q) => {
    const matchesSubject = subjectFilter === 'all' || q.subject === subjectFilter;
    const matchesSearch =
      searchQuery === '' ||
      (q.questionText || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const subjects = [...new Set(sampleQuestions.map((q) => q.subject))];

  // Browse View
  if (viewMode === 'browse') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Essay Practice</h1>
            <p className="text-slate-500">
              Practice writing essays and get AI-powered feedback
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setViewMode('history');
              fetchEssayHistory();
            }}
          >
            <History className="w-4 h-4 mr-2" />
            View History
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search essays..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Essay Questions List */}
        <div className="grid gap-4">
          {filteredQuestions.map((question) => (
            <Card
              key={question.id}
              hoverable
              className="p-6 cursor-pointer"
              onClick={() => handleSelectQuestion(question)}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{question.subject}</Badge>
                    <Badge variant="neutral">{question.marks} marks</Badge>
                    {question.aiGradingEnabled && (
                      <Badge variant="accent">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Grading
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-800 line-clamp-2">{question.questionText}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {question.wordLimitMin}-{question.wordLimitMax} words
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      ~{Math.ceil((question.wordLimitMax || 500) / 15)} mins
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredQuestions.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No essays found</h3>
            <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
          </Card>
        )}
      </div>
    );
  }

  // Write View
  if (viewMode === 'write' && selectedQuestion) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold text-slate-900">Write Essay</h1>
          </div>
        </div>

        {/* Question */}
        <EssayQuestion question={selectedQuestion} />

        {/* Editor */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Answer</h3>
          <EssayEditor
            value={currentDraft}
            onChange={updateDraft}
            wordCount={wordCount}
            minWords={selectedQuestion.wordLimitMin}
            maxWords={selectedQuestion.wordLimitMax}
            disabled={isSubmitting}
            placeholder="Start writing your essay here. Use the toolbar above for formatting."
          />

          {/* Submit Button */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              {error && <span className="text-red-600">{error}</span>}
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting || !currentDraft.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit for AI Grading
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Results View
  if (viewMode === 'results' && selectedQuestion) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Essays
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold text-slate-900">Essay Results</h1>
          </div>
        </div>

        {/* Loading State */}
        {isGrading && (
          <Card className="p-12 text-center">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Grading Your Essay</h3>
            <p className="text-slate-500">Our AI is analyzing your response...</p>
          </Card>
        )}

        {/* Waiting for Results */}
        {!isGrading && !gradingResult && (
          <Card className="p-12 text-center">
            <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Grading In Progress</h3>
            <p className="text-slate-500 mb-4">
              Your essay has been submitted and is being graded. This may take a moment.
            </p>
            <p className="text-sm text-slate-400">
              You can view the model answer below while waiting.
            </p>
          </Card>
        )}

        {/* Results */}
        {!isGrading && gradingResult && (
          <EssayFeedback
            feedback={gradingResult}
            totalMarks={selectedQuestion.marks}
          />
        )}

        {/* Model Answer - Always show */}
        {selectedQuestion.modelAnswer && (
          <ModelAnswer modelAnswer={selectedQuestion.modelAnswer} />
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            Try Another Essay
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setViewMode('write');
              clearCurrentSession();
            }}
          >
            Retry This Essay
          </Button>
        </div>
      </div>
    );
  }

  // History View
  if (viewMode === 'history') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setViewMode('browse')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Essays
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold text-slate-900">Essay History</h1>
            <p className="text-slate-500">View your past essay submissions and scores</p>
          </div>
        </div>

        {/* History List */}
        {historyLoading ? (
          <Card className="p-12 text-center">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-slate-500">Loading your essay history...</p>
          </Card>
        ) : essayHistory.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No essays yet</h3>
            <p className="text-slate-500 mb-4">
              You haven't submitted any essays yet. Start practicing to build your history!
            </p>
            <Button variant="primary" onClick={() => setViewMode('browse')}>
              Browse Essays
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {essayHistory.map((attempt) => {
              const date = new Date(attempt.submittedAt);
              const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              return (
                <Card key={attempt.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="capitalize">
                          {attempt.subject}
                        </Badge>
                        <Badge
                          variant={attempt.status === 'graded' ? 'success' : 'warning'}
                        >
                          {attempt.status === 'graded' ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Graded
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-slate-800 line-clamp-2 mb-2">
                        {attempt.questionText}
                      </p>
                      <p className="text-sm text-slate-500">
                        Submitted on {formattedDate}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      {attempt.status === 'graded' && attempt.score !== null ? (
                        <div>
                          <p className="text-2xl font-bold text-slate-900">
                            {attempt.score}/{attempt.maxScore}
                          </p>
                          <p className="text-sm text-slate-500">
                            {Math.round((attempt.score / attempt.maxScore) * 100)}%
                          </p>
                        </div>
                      ) : (
                        <p className="text-slate-400">-</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
}

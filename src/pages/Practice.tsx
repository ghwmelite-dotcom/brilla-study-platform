import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  BookOpen,
  Target,
  ArrowRight,
  Settings,
  FileText,
  PenTool,
  Trophy,
  ClipboardList,
  Swords,
  Loader2,
  AlertTriangle,
  FlaskConical,
} from 'lucide-react';
import { Card, Button, Badge, Select } from '@/components/common';
import { TopicDrill, SpeedRace, Flashcard } from '@/components/practice';
import { DailyUsageIndicator, LimitReachedModal } from '@/components/subscription';
import { useExamStore, useUsageStore } from '@/stores';
import { getExamConfig, isCoreSubject } from '@/config';
import { cn } from '@/utils';
import { api } from '@/lib/api';
import type { Question, GhanaExamTypeSlug } from '@/types';
import { isGhanaExam } from '@/types';
import type { LucideIcon } from 'lucide-react';

// Transform snake_case API response to camelCase Question type
interface ApiQuestion {
  id: string;
  topic_id: string | null;
  subject_id: string;
  question_text: string;
  question_type: string;
  round_type: string;
  options: unknown[] | null;
  correct_answer: string;
  explanation: string | null;
  difficulty: string;
  points: number;
  marks: number;
  time_limit: number;
  image_url: string | null;
}

const transformQuestion = (q: ApiQuestion): Question => ({
  id: q.id,
  topicId: q.topic_id || '',
  subjectId: q.subject_id,
  questionText: q.question_text,
  questionType: q.question_type as Question['questionType'],
  roundType: q.round_type as Question['roundType'],
  options: q.options as Question['options'],
  correctAnswer: q.correct_answer,
  explanation: q.explanation || undefined,
  difficulty: q.difficulty as Question['difficulty'],
  points: q.points,
  marks: q.marks,
  timeLimit: q.time_limit,
  imageUrl: q.image_url || undefined,
  createdAt: new Date().toISOString(),
});


// Flashcard API types
interface ApiFlashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  difficulty: number;
}

interface ApiFlashcardDeck {
  id: string;
  name: string;
  description?: string;
  subject_id?: string;
  card_count: number;
  cards?: ApiFlashcard[];
}

type PracticeMode = 'drill' | 'speed' | 'flashcard' | null;

// Base practice modes available to all
const basePracticeModes = [
  {
    id: 'drill',
    name: 'Topic Drill',
    description: 'Focused practice on specific topics with instant feedback',
    icon: Target,
    color: 'bg-blue-500',
    features: ['Choose your topic', 'Timed questions', 'Detailed explanations'],
  },
  {
    id: 'speed',
    name: 'Speed Race',
    description: 'Race against the clock with quick-fire questions',
    icon: Zap,
    color: 'bg-yellow-500',
    features: ['10 seconds per question', 'Penalty for wrong answers', 'Build speed skills'],
  },
  {
    id: 'flashcard',
    name: 'Flashcards',
    description: 'Review key concepts and formulas',
    icon: BookOpen,
    color: 'bg-green-500',
    features: ['Self-paced review', 'Track what you know', 'Formula recall'],
  },
];

// Exam feature type
interface ExamFeature {
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  path: string;
}

// Exam-specific practice features (shown as links)
const examFeatures: Record<GhanaExamTypeSlug, ExamFeature[]> = {
  nsmq: [
    {
      name: '1v1 Battle',
      description: 'Challenge other students in real-time quiz battles',
      icon: Swords,
      color: 'bg-red-500',
      path: '/battle',
    },
    {
      name: 'Competition Sim',
      description: 'Simulate full NSMQ competition rounds',
      icon: Trophy,
      color: 'bg-amber-500',
      path: '/competition',
    },
  ],
  wassce: [
    {
      name: 'Past Papers',
      description: 'Practice with real WASSCE past questions',
      icon: FileText,
      color: 'bg-indigo-500',
      path: '/past-papers',
    },
    {
      name: 'Essay Practice',
      description: 'Write essays and get AI-powered feedback',
      icon: PenTool,
      color: 'bg-purple-500',
      path: '/practice/essay',
    },
    {
      name: 'Mock Exams',
      description: 'Take full-length timed mock exams',
      icon: ClipboardList,
      color: 'bg-teal-500',
      path: '/mock-exams',
    },
    {
      name: 'Virtual Lab',
      description: 'Practice WASSCE practical experiments',
      icon: FlaskConical,
      color: 'bg-green-500',
      path: '/virtual-lab',
    },
  ],
  bece: [
    {
      name: 'Past Papers',
      description: 'Practice with real BECE past questions',
      icon: FileText,
      color: 'bg-emerald-500',
      path: '/past-papers',
    },
    {
      name: 'Essay Practice',
      description: 'Practice composition and letter writing',
      icon: PenTool,
      color: 'bg-purple-500',
      path: '/practice/essay',
    },
    {
      name: 'Mock Exams',
      description: 'Take timed mock exams like the real BECE',
      icon: ClipboardList,
      color: 'bg-teal-500',
      path: '/mock-exams',
    },
  ],
};

const difficulties = [
  { value: 'all', label: 'All Difficulties' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
];

export function PracticePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialMode = searchParams.get('mode') as PracticeMode;
  const initialTopic = searchParams.get('topic');
  const { currentExamType, subjects: examSubjects } = useExamStore();
  const { dailyUsage, fetchDailyUsage, checkLimitReached } = useUsageStore();
  const examConfig = getExamConfig(currentExamType);

  const [activeMode, setActiveMode] = useState<PracticeMode>(initialMode);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedTopic] = useState(initialTopic || '');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [questionCount, setQuestionCount] = useState(10);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Check if user has premium access
  const isPremiumUser = dailyUsage?.isUnlimited || dailyUsage?.isPremium || false;

  // Check if a subject is locked for the current user
  const isSubjectLocked = (subjectSlug: string): boolean => {
    if (isPremiumUser) return false;
    return !isCoreSubject(currentExamType, subjectSlug);
  };

  // Fetch usage data on mount
  useEffect(() => {
    fetchDailyUsage();
  }, [fetchDailyUsage]);

  // Check if limit reached on mount
  useEffect(() => {
    if (dailyUsage && checkLimitReached()) {
      setShowLimitModal(true);
    }
  }, [dailyUsage, checkLimitReached]);

  // Speed race state
  const [speedQuestions, setSpeedQuestions] = useState<Question[]>([]);
  const [speedLoading, setSpeedLoading] = useState(false);
  const [speedError, setSpeedError] = useState<string | null>(null);

  // Topic drill state
  const [drillQuestions, setDrillQuestions] = useState<Question[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState<string | null>(null);

  // Recent sessions state
  interface RecentSession {
    id: string;
    mode: string;
    subject_id: string | null;
    topic_id: string | null;
    questions_count: number;
    correct_count: number;
    total_time: number;
    score: number;
    created_at: string;
  }
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Flashcard state
  const [flashcards, setFlashcards] = useState<Array<{ id: string; front: string; back: string; category: string }>>([]);
  const [flashcardLoading, setFlashcardLoading] = useState(false);
  const [flashcardError, setFlashcardError] = useState<string | null>(null);
  const [flashcardDeckName, setFlashcardDeckName] = useState('Formula Review');

  // Fetch recent sessions on mount
  useEffect(() => {
    const fetchRecentSessions = async () => {
      setSessionsLoading(true);
      try {
        const res = await api.get<RecentSession[]>('/practice/sessions?limit=5');
        const data = res.success ? res.data : null;
        if (data && Array.isArray(data)) {
          setRecentSessions(data);
        }
      } catch (err) {
        console.error('Failed to fetch recent sessions:', err);
      } finally {
        setSessionsLoading(false);
      }
    };
    fetchRecentSessions();
  }, []);

  // Auto-start drill mode if navigated with ?topic=...
  // Navigate directly to exam practice mode with the topic
  useEffect(() => {
    if (initialTopic) {
      const params = new URLSearchParams();
      params.set('mode', 'drill');
      params.set('topic', initialTopic);
      params.set('count', '10');
      navigate(`/exam/practice?${params.toString()}`, { replace: true });
    }
  }, [initialTopic, navigate]);

  // Get exam-specific features
  const currentExamFeatures = isGhanaExam(currentExamType)
    ? examFeatures[currentExamType]
    : [];

  // Build subject options from exam store (with lock indicators for premium subjects)
  const subjectOptions = [
    { value: 'all', label: 'All Subjects' },
    ...examSubjects.map((s) => ({
      value: s.slug,
      label: isSubjectLocked(s.slug) ? `🔒 ${s.name}` : s.name,
      disabled: isSubjectLocked(s.slug),
    })),
  ];

  // Fetch speed race questions from API
  const fetchSpeedQuestions = async () => {
    setSpeedLoading(true);
    setSpeedError(null);
    try {
      let url = `/questions?round=speed_race&limit=${questionCount}`;
      if (selectedSubject !== 'all') {
        url += `&subject=${selectedSubject}`;
      }
      if (selectedDifficulty !== 'all') {
        url += `&difficulty=${selectedDifficulty}`;
      }
      const res = await api.get<ApiQuestion[]>(url);
      const data = res.success ? res.data : null;
      if (data && Array.isArray(data) && data.length > 0) {
        // Transform snake_case to camelCase
        const transformedQuestions = data.map(transformQuestion);
        setSpeedQuestions(transformedQuestions);
      } else {
        setSpeedError('No speed race questions available. Try different filters.');
      }
    } catch (err) {
      console.error('Failed to fetch speed race questions:', err);
      setSpeedError('Failed to load questions. Please try again.');
    } finally {
      setSpeedLoading(false);
    }
  };

  // Fetch topic drill questions from API
  const fetchDrillQuestions = async () => {
    setDrillLoading(true);
    setDrillError(null);
    try {
      let url = `/questions?limit=${questionCount}`;
      if (selectedSubject !== 'all') {
        // Find subject ID from exam subjects, or use the slug directly
        const subject = examSubjects.find(s => s.slug === selectedSubject);
        const subjectId = subject?.id || selectedSubject;
        url += `&subject=${subjectId}`;
      }
      if (selectedDifficulty !== 'all') {
        url += `&difficulty=${selectedDifficulty}`;
      }
      const res = await api.get<ApiQuestion[]>(url);
      const data = res.success ? res.data : null;
      if (data && Array.isArray(data) && data.length > 0) {
        const transformedQuestions = data.map(transformQuestion);
        setDrillQuestions(transformedQuestions);
      } else {
        setDrillError('No questions available for these filters. Try different settings.');
      }
    } catch (err) {
      console.error('Failed to fetch drill questions:', err);
      setDrillError('Failed to load questions. Please try again.');
    } finally {
      setDrillLoading(false);
    }
  };

  // Fetch flashcards from API
  const fetchFlashcards = async () => {
    setFlashcardLoading(true);
    setFlashcardError(null);
    try {
      // Fetch public flashcard decks
      const decksRes = await api.get<ApiFlashcardDeck[]>('/flashcards/public');
      const decks = decksRes.success ? decksRes.data : null;

      if (decks && Array.isArray(decks) && decks.length > 0) {
        // Get the first deck with cards or a random deck
        let selectedDeck = decks.find(d => d.card_count > 0);

        // If subject is selected, try to find a matching deck
        if (selectedSubject !== 'all') {
          const subject = examSubjects.find(s => s.slug === selectedSubject);
          const subjectId = subject?.id || selectedSubject;
          const matchingDeck = decks.find(d => d.subject_id === subjectId && d.card_count > 0);
          if (matchingDeck) {
            selectedDeck = matchingDeck;
          }
        }

        if (selectedDeck) {
          // Fetch the deck with cards
          const deckRes = await api.get<{ cards: ApiFlashcard[] }>(`/flashcards/decks/${selectedDeck.id}/cards`);
          const deckWithCards = deckRes.success ? deckRes.data : null;

          if (deckWithCards && deckWithCards.cards && deckWithCards.cards.length > 0) {
            // Transform to the format expected by Flashcard component
            const transformedCards = deckWithCards.cards.map(card => ({
              id: card.id,
              front: card.front,
              back: card.back,
              category: selectedDeck!.name.replace(' - Key Concepts', '').replace(' Formulas', ''),
            }));
            setFlashcards(transformedCards);
            setFlashcardDeckName(selectedDeck.name);
          } else {
            setFlashcardError('No flashcards available in this deck.');
          }
        } else {
          setFlashcardError('No flashcard decks available.');
        }
      } else {
        setFlashcardError('No flashcard decks available. Check back later!');
      }
    } catch (err) {
      console.error('Failed to fetch flashcards:', err);
      setFlashcardError('Failed to load flashcards. Please try again.');
    } finally {
      setFlashcardLoading(false);
    }
  };

  const handleStartSession = async (mode: PracticeMode) => {
    // Check if daily limit is reached
    if (checkLimitReached()) {
      setShowLimitModal(true);
      return;
    }

    // Check if selected subject is locked
    if (selectedSubject !== 'all' && isSubjectLocked(selectedSubject)) {
      navigate('/pricing');
      return;
    }

    // For drill and speed modes, navigate to distraction-free exam mode
    if (mode === 'drill' || mode === 'speed') {
      const params = new URLSearchParams();
      params.set('mode', mode);
      if (selectedTopic) params.set('topic', selectedTopic);
      if (selectedSubject !== 'all') params.set('subject', selectedSubject);
      if (selectedDifficulty !== 'all') params.set('difficulty', selectedDifficulty);
      params.set('count', questionCount.toString());
      navigate(`/exam/practice?${params.toString()}`);
      return;
    }

    // For flashcards, use inline mode
    setActiveMode(mode);
    if (mode === 'flashcard') {
      await fetchFlashcards();
    }
    setIsSessionActive(true);
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    setActiveMode(null);
  };

  // Active practice session
  if (isSessionActive && activeMode) {
    switch (activeMode) {
      case 'drill':
        if (drillLoading) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-neutral-600">Loading practice questions...</p>
            </div>
          );
        }
        if (drillError) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
              <p className="text-neutral-600">{drillError}</p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleEndSession}>
                  Back to Practice
                </Button>
                <Button onClick={fetchDrillQuestions}>
                  Try Again
                </Button>
              </div>
            </div>
          );
        }
        if (drillQuestions.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
              <p className="text-neutral-600">No questions loaded. Please try again.</p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleEndSession}>
                  Back to Practice
                </Button>
                <Button onClick={fetchDrillQuestions}>
                  Reload Questions
                </Button>
              </div>
            </div>
          );
        }
        return (
          <TopicDrill
            questions={drillQuestions}
            topicName={selectedSubject !== 'all' ? subjectOptions.find(s => s.value === selectedSubject)?.label || 'Mixed Topics' : 'Mixed Topics'}
            onExit={handleEndSession}
          />
        );
      case 'speed':
        if (speedLoading) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-neutral-600">Loading speed race questions...</p>
            </div>
          );
        }
        if (speedError) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
              <p className="text-neutral-600">{speedError}</p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleEndSession}>
                  Back to Practice
                </Button>
                <Button onClick={fetchSpeedQuestions}>
                  Try Again
                </Button>
              </div>
            </div>
          );
        }
        if (speedQuestions.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
              <p className="text-neutral-600">No questions loaded. Please try again.</p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleEndSession}>
                  Back to Practice
                </Button>
                <Button onClick={fetchSpeedQuestions}>
                  Reload Questions
                </Button>
              </div>
            </div>
          );
        }
        return (
          <SpeedRace
            questions={speedQuestions}
            onExit={handleEndSession}
          />
        );
      case 'flashcard':
        if (flashcardLoading) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-neutral-600">Loading flashcards...</p>
            </div>
          );
        }
        if (flashcardError) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
              <p className="text-neutral-600">{flashcardError}</p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleEndSession}>
                  Back to Practice
                </Button>
                <Button onClick={fetchFlashcards}>
                  Try Again
                </Button>
              </div>
            </div>
          );
        }
        if (flashcards.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <BookOpen className="w-12 h-12 text-neutral-400" />
              <p className="text-neutral-600">No flashcards loaded. Please try again.</p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleEndSession}>
                  Back to Practice
                </Button>
                <Button onClick={fetchFlashcards}>
                  Reload Flashcards
                </Button>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={handleEndSession}>
              ← Back to Practice
            </Button>
            <Flashcard
              cards={flashcards}
              title={flashcardDeckName}
            />
          </div>
        );
    }
  }

  return (
    <div className="space-y-8">
      {/* Header with Usage Indicator */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Practice Mode</h1>
          <p className="text-neutral-500">Choose your practice style and start training</p>
        </div>
        {/* Daily usage indicator for non-premium users */}
        {dailyUsage && !dailyUsage.isUnlimited && (
          <DailyUsageIndicator variant="full" className="hidden md:block w-64" />
        )}
      </div>

      {/* Mobile usage indicator */}
      {dailyUsage && !dailyUsage.isUnlimited && (
        <div className="md:hidden">
          <DailyUsageIndicator variant="full" />
        </div>
      )}

      {/* Exam-Specific Features */}
      {currentExamFeatures.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            {currentExamType.toUpperCase()} Practice Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentExamFeatures.map((feature) => (
              <Link key={feature.path} to={feature.path}>
                <Card hoverable className="p-6 h-full">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4', feature.color)}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">{feature.name}</h3>
                  <p className="text-sm text-neutral-500">{feature.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Practice Mode Selection */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Practice Modes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {basePracticeModes.map((mode) => (
            <Card
              key={mode.id}
              hoverable
              className={cn(
                'p-6 cursor-pointer transition-all border-2',
                activeMode === mode.id
                  ? 'border-primary bg-primary-50'
                  : 'border-transparent'
              )}
              onClick={() => setActiveMode(mode.id as PracticeMode)}
            >
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4', mode.color)}>
                <mode.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">{mode.name}</h3>
              <p className="text-sm text-neutral-500 mb-4">{mode.description}</p>
              <ul className="space-y-1">
                {mode.features.map((feature, index) => (
                  <li key={index} className="text-xs text-neutral-400 flex items-center gap-1">
                    <span className="w-1 h-1 bg-neutral-400 rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Settings */}
      {activeMode && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-neutral-500" />
            <h3 className="font-semibold text-neutral-900">Session Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Select
              label="Subject"
              options={subjectOptions}
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            />
            <Select
              label="Difficulty"
              options={difficulties}
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            />
            <Select
              label="Questions"
              options={[
                { value: '5', label: '5 Questions' },
                { value: '10', label: '10 Questions' },
                { value: '15', label: '15 Questions' },
                { value: '20', label: '20 Questions' },
              ]}
              value={questionCount.toString()}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
            <div className="text-sm text-neutral-500">
              <p>Ready to practice {questionCount} questions</p>
              {selectedSubject !== 'all' && (
                <p>Subject: {subjectOptions.find((s) => s.value === selectedSubject)?.label}</p>
              )}
            </div>
            <Button
              size="lg"
              onClick={() => handleStartSession(activeMode)}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Start {basePracticeModes.find((m) => m.id === activeMode)?.name}
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Start Cards */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Start</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {examConfig.quickStartSubjects.map((item) => {
            const ItemIcon = item.icon;
            return (
              <Card
                key={item.slug}
                hoverable
                className="p-4 text-center cursor-pointer"
                onClick={() => {
                  navigate(`/exam/practice?mode=drill&subject=${item.slug}&count=${questionCount}`);
                }}
              >
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white mx-auto mb-2', item.color)}>
                  <ItemIcon className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-neutral-900">{item.label}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Recent Sessions */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Recent Sessions</h2>
        <Card className="divide-y divide-neutral-100">
          {sessionsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="text-center p-8 text-neutral-500">
              <p>No practice sessions yet. Start practicing to see your history!</p>
            </div>
          ) : (
            recentSessions.map((session) => {
              const modeType = session.mode === 'topic_drill' ? 'drill' :
                               session.mode === 'speed_race' ? 'speed' :
                               session.mode === 'flashcard' ? 'flashcard' : 'drill';
              const topicName = session.mode === 'speed_race' ? 'Speed Race' :
                               session.mode === 'flashcard' ? 'Flashcard Review' :
                               'Topic Drill';
              const scoreDisplay = session.mode === 'speed_race'
                ? `${session.score} pts`
                : `${session.correct_count}/${session.questions_count}`;

              // Format time ago
              const timeAgo = (() => {
                const now = new Date();
                const created = new Date(session.created_at);
                const diffMs = now.getTime() - created.getTime();
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);

                if (diffMins < 60) return `${diffMins} min ago`;
                if (diffHours < 24) return `${diffHours} hours ago`;
                if (diffDays === 1) return 'Yesterday';
                return `${diffDays} days ago`;
              })();

              return (
                <div key={session.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      modeType === 'drill' && 'bg-blue-100',
                      modeType === 'speed' && 'bg-yellow-100',
                      modeType === 'flashcard' && 'bg-green-100'
                    )}>
                      {modeType === 'drill' && <Target className="w-4 h-4 text-blue-500" />}
                      {modeType === 'speed' && <Zap className="w-4 h-4 text-yellow-500" />}
                      {modeType === 'flashcard' && <BookOpen className="w-4 h-4 text-green-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{topicName}</p>
                      <p className="text-xs text-neutral-500">{timeAgo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="primary">{scoreDisplay}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveMode(modeType as PracticeMode);
                        handleStartSession(modeType as PracticeMode);
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </section>

      {/* Limit reached modal */}
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
      />
    </div>
  );
}

import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Zap,
  BookOpen,
  Target,
  ArrowRight,
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  Settings,
  FileText,
  PenTool,
  Trophy,
  ClipboardList,
  Swords,
} from 'lucide-react';
import { Card, Button, Badge, Select } from '@/components/common';
import { TopicDrill, SpeedRace, Flashcard } from '@/components/practice';
import { useExamStore } from '@/stores';
import { cn } from '@/utils';
import type { Question } from '@/types';

// Sample questions for practice
const sampleQuestions: Question[] = [
  {
    id: 'q1',
    topicId: 'quadratic',
    subjectId: 'mathematics',
    questionText: 'Solve for x: x² - 5x + 6 = 0',
    questionType: 'direct_answer',
    roundType: 'round_one',
    correctAnswer: 'x = 2 or x = 3',
    explanation: 'Factoring: (x-2)(x-3) = 0, so x = 2 or x = 3',
    difficulty: 'easy',
    points: 3,
    marks: 3,
    timeLimit: 30,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q2',
    topicId: 'mechanics',
    subjectId: 'physics',
    questionText: 'A car accelerates from rest at 2 m/s² for 5 seconds. What is its final velocity?',
    questionType: 'direct_answer',
    roundType: 'round_one',
    correctAnswer: '10 m/s',
    explanation: 'Using v = u + at: v = 0 + (2)(5) = 10 m/s',
    difficulty: 'easy',
    points: 3,
    marks: 3,
    timeLimit: 30,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q3',
    topicId: 'stoichiometry',
    subjectId: 'chemistry',
    questionText: 'What is the molar mass of H₂SO₄?',
    questionType: 'direct_answer',
    roundType: 'round_one',
    correctAnswer: '98 g/mol',
    explanation: 'H₂SO₄: 2(1) + 32 + 4(16) = 2 + 32 + 64 = 98 g/mol',
    difficulty: 'easy',
    points: 3,
    marks: 3,
    timeLimit: 30,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q4',
    topicId: 'cells',
    subjectId: 'biology',
    questionText: 'What organelle is responsible for ATP production in eukaryotic cells?',
    questionType: 'direct_answer',
    roundType: 'round_one',
    correctAnswer: 'Mitochondria',
    explanation: 'Mitochondria are the powerhouse of the cell, producing ATP through cellular respiration',
    difficulty: 'easy',
    points: 3,
    marks: 3,
    timeLimit: 30,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q5',
    topicId: 'trigonometry',
    subjectId: 'mathematics',
    questionText: 'If sin θ = 3/5, what is cos θ? (θ is acute)',
    questionType: 'direct_answer',
    roundType: 'round_one',
    correctAnswer: '4/5',
    explanation: 'Using sin²θ + cos²θ = 1: cos²θ = 1 - 9/25 = 16/25, so cos θ = 4/5',
    difficulty: 'medium',
    points: 3,
    marks: 3,
    timeLimit: 30,
    createdAt: new Date().toISOString(),
  },
];

const speedQuestions: Question[] = [
  { ...sampleQuestions[0], roundType: 'speed_race', timeLimit: 10 },
  { ...sampleQuestions[1], roundType: 'speed_race', timeLimit: 10 },
  { ...sampleQuestions[2], roundType: 'speed_race', timeLimit: 10 },
  { ...sampleQuestions[3], roundType: 'speed_race', timeLimit: 10 },
  { ...sampleQuestions[4], roundType: 'speed_race', timeLimit: 10 },
];

const flashcards = [
  { id: '1', front: 'What is the quadratic formula?', back: 'x = (-b ± √(b²-4ac)) / 2a', category: 'Algebra' },
  { id: '2', front: 'What is Newton\'s Second Law?', back: 'F = ma', category: 'Mechanics' },
  { id: '3', front: 'What is the ideal gas law?', back: 'PV = nRT', category: 'Chemistry' },
  { id: '4', front: 'What is the energy equation?', back: 'E = mc²', category: 'Physics' },
  { id: '5', front: 'What is Avogadro\'s number?', back: '6.02 × 10²³', category: 'Chemistry' },
];

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

// Exam-specific practice features (shown as links)
const examFeatures = {
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
  const initialMode = searchParams.get('mode') as PracticeMode;
  const { currentExamType, subjects: examSubjects } = useExamStore();

  const [activeMode, setActiveMode] = useState<PracticeMode>(initialMode);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [questionCount, setQuestionCount] = useState(10);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Get exam-specific features
  const currentExamFeatures = examFeatures[currentExamType] || [];

  // Build subject options from exam store
  const subjectOptions = [
    { value: 'all', label: 'All Subjects' },
    ...examSubjects.slice(0, 6).map((s) => ({ value: s.slug, label: s.name })),
  ];

  const handleStartSession = (mode: PracticeMode) => {
    setActiveMode(mode);
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
        return (
          <TopicDrill
            questions={sampleQuestions.slice(0, questionCount)}
            topicName="Mixed Topics"
            onComplete={(results) => {
              console.log('Drill complete:', results);
            }}
            onExit={handleEndSession}
          />
        );
      case 'speed':
        return (
          <SpeedRace
            questions={speedQuestions.slice(0, questionCount)}
            onComplete={(results) => {
              console.log('Speed race complete:', results);
            }}
            onExit={handleEndSession}
          />
        );
      case 'flashcard':
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={handleEndSession}>
              ← Back to Practice
            </Button>
            <Flashcard
              cards={flashcards}
              title="Formula Review"
              onComplete={(results) => {
                console.log('Flashcard session complete:', results);
              }}
            />
          </div>
        );
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-neutral-900">Practice Mode</h1>
        <p className="text-neutral-500">Choose your practice style and start training</p>
      </div>

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
          {[
            { subject: 'mathematics', icon: Calculator, color: 'bg-blue-500', label: 'Math Drill' },
            { subject: 'physics', icon: Atom, color: 'bg-purple-500', label: 'Physics Drill' },
            { subject: 'chemistry', icon: FlaskConical, color: 'bg-green-500', label: 'Chemistry Drill' },
            { subject: 'biology', icon: Dna, color: 'bg-amber-500', label: 'Biology Drill' },
          ].map((item) => (
            <Card
              key={item.subject}
              hoverable
              className="p-4 text-center cursor-pointer"
              onClick={() => {
                setSelectedSubject(item.subject);
                setActiveMode('drill');
                setIsSessionActive(true);
              }}
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white mx-auto mb-2', item.color)}>
                <item.icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-neutral-900">{item.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Sessions */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Recent Sessions</h2>
        <Card className="divide-y divide-neutral-100">
          {[
            { type: 'drill', topic: 'Quadratic Equations', score: '8/10', time: '2 hours ago' },
            { type: 'speed', topic: 'Speed Race', score: '45 pts', time: '5 hours ago' },
            { type: 'flashcard', topic: 'Formula Review', score: '12/15', time: 'Yesterday' },
          ].map((session, index) => (
            <div key={index} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  session.type === 'drill' && 'bg-blue-100',
                  session.type === 'speed' && 'bg-yellow-100',
                  session.type === 'flashcard' && 'bg-green-100'
                )}>
                  {session.type === 'drill' && <Target className="w-4 h-4 text-blue-500" />}
                  {session.type === 'speed' && <Zap className="w-4 h-4 text-yellow-500" />}
                  {session.type === 'flashcard' && <BookOpen className="w-4 h-4 text-green-500" />}
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{session.topic}</p>
                  <p className="text-xs text-neutral-500">{session.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="primary">{session.score}</Badge>
                <Button variant="ghost" size="sm">
                  Retry
                </Button>
              </div>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}

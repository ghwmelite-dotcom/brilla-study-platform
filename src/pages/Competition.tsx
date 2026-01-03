import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Play,
  Users,
  Clock,
  Target,
  Zap,
  HelpCircle,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  Loader2,
  FileText,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { Card, Button, Badge, Input } from '@/components/common';
import { Scoreboard, RoundDisplay, RoundSelector, RoundProgress } from '@/components/competition';
import { cn } from '@/utils';
import { api } from '@/services/api';
import { useExamStore } from '@/stores/examStore';
import { getExamConfig } from '@/config';

type CompetitionView = 'home' | 'setup' | 'round' | 'results';

const defaultSchools = [
  { id: 'school1', name: 'St John\'s Grammar', score: 0, color: '#006B3F' },
  { id: 'school2', name: 'Presec Legon', score: 0, color: '#0066CC' },
  { id: 'school3', name: 'Opoku Ware', score: 0, color: '#CC0000' },
];

const roundInfo = [
  {
    number: 1,
    name: 'Fundamentals',
    icon: Target,
    description: '16 questions per school across 4 subjects',
    details: [
      '4 questions per subject (Math, Physics, Chemistry, Biology)',
      '3 points for correct answers',
      'Bonus questions from wrong answers',
    ],
    color: 'bg-blue-500',
  },
  {
    number: 2,
    name: 'Speed Race',
    icon: Zap,
    description: 'Race to answer! First correct answer wins',
    details: [
      '1st correct: 3 points',
      '2nd correct: 2 points',
      '3rd correct: 1 point',
      'Wrong answer: -1 point',
    ],
    color: 'bg-yellow-500',
  },
  {
    number: 3,
    name: 'Problem of the Day',
    icon: HelpCircle,
    description: 'One complex problem with multiple parts',
    details: [
      '3-4 minutes to solve',
      'Maximum 10 points',
      'Partial credit available',
    ],
    color: 'bg-purple-500',
  },
  {
    number: 4,
    name: 'True or False',
    icon: CheckCircle,
    description: 'Judge statements as true or false',
    details: [
      'Correct: +2 points',
      'Wrong: -1 point',
      'Pass becomes bonus for opponents',
    ],
    color: 'bg-green-500',
  },
  {
    number: 5,
    name: 'Riddles',
    icon: Lightbulb,
    description: 'Progressive clues, early guesses earn more',
    details: [
      '1st clue correct: 5 points',
      '2nd clue correct: 4 points',
      '3rd+ clue correct: 3 points',
    ],
    color: 'bg-orange-500',
  },
];

// Competition history type
interface CompetitionHistoryItem {
  id: string;
  date: string;
  winner: string;
  score: string;
  position: string;
}

export function CompetitionPage() {
  const navigate = useNavigate();
  const { currentExamType } = useExamStore();
  const examConfig = getExamConfig(currentExamType);
  const isNSMQ = currentExamType === 'nsmq';

  const [view, setView] = useState<CompetitionView>('home');
  const [schools, setSchools] = useState(defaultSchools);
  const [currentRound, setCurrentRound] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedPracticeRound, setSelectedPracticeRound] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [competitionHistory, setCompetitionHistory] = useState<CompetitionHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch competition/battle history on mount
  useEffect(() => {
    const fetchCompetitionHistory = async () => {
      setHistoryLoading(true);
      try {
        const data = await api.get('/battles/history?limit=10') as Array<{
          id: string;
          status: string;
          winner_id: string | null;
          your_score: number;
          opponent_score: number;
          created_at: string;
          opponent?: { name: string };
        }>;

        if (data && Array.isArray(data)) {
          const history: CompetitionHistoryItem[] = data
            .filter(battle => battle.status === 'completed')
            .map(battle => {
              const isWinner = battle.winner_id !== null;
              const score = battle.your_score || 0;
              const position = isWinner ? '1st' : '2nd';

              // Format time ago
              const created = new Date(battle.created_at);
              const now = new Date();
              const diffDays = Math.floor((now.getTime() - created.getTime()) / 86400000);
              const date = diffDays === 0 ? 'Today' :
                          diffDays === 1 ? 'Yesterday' :
                          diffDays < 7 ? `${diffDays} days ago` :
                          `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;

              return {
                id: battle.id,
                date,
                winner: battle.opponent?.name || 'Opponent',
                score: `${score} pts`,
                position,
              };
            });
          setCompetitionHistory(history);
        }
      } catch (err) {
        console.error('Failed to fetch competition history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchCompetitionHistory();
  }, []);

  const handleStartFullSimulation = () => {
    setSchools(defaultSchools.map((s) => ({ ...s, score: 0 })));
    setCurrentRound(1);
    setView('round');
  };

  const handleStartRoundPractice = (round: 1 | 2 | 3 | 4 | 5) => {
    setSelectedPracticeRound(round);
    setCurrentRound(round);
    setView('round');
  };

  // Competition setup view
  if (view === 'setup') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Setup Competition</h1>
          <p className="text-neutral-500">Configure your competition settings</p>
        </div>

        <Card className="p-6">
          <h3 className="font-semibold text-neutral-900 mb-4">School Names</h3>
          <div className="space-y-4">
            {schools.map((school, index) => (
              <div key={school.id} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: school.color }}
                />
                <Input
                  placeholder={`School ${index + 1}`}
                  value={school.name}
                  onChange={(e) => {
                    const newSchools = [...schools];
                    newSchools[index] = { ...school, name: e.target.value };
                    setSchools(newSchools);
                  }}
                />
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setView('home')}>
            Back
          </Button>
          <Button onClick={handleStartFullSimulation}>
            Start Competition
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Active round view
  if (view === 'round') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-neutral-900">
              {selectedPracticeRound ? `Round ${currentRound} Practice` : 'Competition'}
            </h1>
            <RoundProgress currentRound={currentRound} />
          </div>
          <Button variant="outline" onClick={() => setView('home')}>
            Exit
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-6">
            <RoundDisplay currentRound={currentRound} />

            {/* Placeholder for round-specific content */}
            <Card className="p-8 text-center">
              <div className="text-6xl mb-4">
                {currentRound === 1 && '🎯'}
                {currentRound === 2 && '⚡'}
                {currentRound === 3 && '🧮'}
                {currentRound === 4 && '✓'}
                {currentRound === 5 && '💡'}
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Round {currentRound}: {roundInfo[currentRound - 1].name}
              </h2>
              <p className="text-neutral-500 mb-6">
                {roundInfo[currentRound - 1].description}
              </p>

              <div className="bg-neutral-50 rounded-lg p-4 mb-6 text-left">
                <h4 className="font-medium text-neutral-700 mb-2">How it works:</h4>
                <ul className="space-y-1">
                  {roundInfo[currentRound - 1].details.map((detail, index) => (
                    <li key={index} className="text-sm text-neutral-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3 justify-center">
                {currentRound > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentRound((currentRound - 1) as 1 | 2 | 3 | 4 | 5)}
                  >
                    Previous Round
                  </Button>
                )}
                <Button>
                  Start Round {currentRound}
                </Button>
                {currentRound < 5 && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentRound((currentRound + 1) as 1 | 2 | 3 | 4 | 5)}
                  >
                    Next Round
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Scoreboard
              schools={schools}
              currentRound={currentRound}
            />

            <Card className="p-4">
              <h4 className="font-medium text-neutral-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  fullWidth
                  size="sm"
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? 'Resume Competition' : 'Pause Competition'}
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  size="sm"
                  onClick={() => setShowRulesModal(true)}
                >
                  View Rules
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  size="sm"
                  className="text-red-600"
                  onClick={() => setView('home')}
                >
                  End Competition
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // For WASSCE/BECE - show Mock Exam view instead of competition
  if (!isNSMQ) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className={cn(
            "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
            currentExamType === 'wassce' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
          )}>
            {currentExamType === 'wassce' ? (
              <GraduationCap className="w-8 h-8 text-white" />
            ) : (
              <BookOpen className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            {examConfig.competitionLabel}
          </h1>
          <p className="text-neutral-500 max-w-lg mx-auto">
            {examConfig.competitionDescription}
          </p>
        </div>

        {/* Mock Exam Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="p-6 border-2 border-primary bg-primary-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Full Mock Exam</h3>
                <p className="text-sm text-neutral-500">Complete {examConfig.shortName} simulation</p>
              </div>
            </div>
            <p className="text-neutral-600 mb-4">
              Take a full-length {examConfig.shortName} mock exam with realistic timing and conditions.
              Get your predicted score at the end.
            </p>
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
              <Clock className="w-4 h-4" />
              <span>{currentExamType === 'wassce' ? '2-3 hours per paper' : '1-2 hours'}</span>
              <FileText className="w-4 h-4 ml-4" />
              <span>All subjects</span>
            </div>
            <Button fullWidth onClick={() => navigate('/mock-exams')}>
              <Play className="w-4 h-4 mr-2" />
              Start Mock Exam
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-secondary rounded-xl">
                <Target className="w-6 h-6 text-neutral-900" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Past Papers</h3>
                <p className="text-sm text-neutral-500">Practice with real questions</p>
              </div>
            </div>
            <p className="text-neutral-600 mb-4">
              Practice with actual {examConfig.shortName} past questions from previous years.
              See detailed solutions and explanations.
            </p>
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
              <Clock className="w-4 h-4" />
              <span>Flexible timing</span>
              <FileText className="w-4 h-4 ml-4" />
              <span>Multiple years</span>
            </div>
            <Button variant="secondary" fullWidth onClick={() => navigate('/past-papers')}>
              Browse Past Papers
            </Button>
          </Card>
        </div>

        {/* Quick Practice */}
        <section className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4 text-center">Quick Practice by Subject</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Mathematics', 'English', 'Science', 'Social Studies'].map((subject) => (
              <Card
                key={subject}
                hoverable
                className="p-4 text-center cursor-pointer"
                onClick={() => navigate(`/practice?subject=${subject.toLowerCase().replace(' ', '-')}`)}
              >
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium text-neutral-900">{subject}</p>
                <p className="text-xs text-neutral-500">Practice now</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Recent Practice Sessions</h2>
          <Card className="divide-y divide-neutral-100">
            {historyLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : competitionHistory.length === 0 ? (
              <div className="text-center p-8 text-neutral-500">
                <p>No practice history yet. Start a mock exam or practice session!</p>
              </div>
            ) : (
              competitionHistory.map((comp) => (
                <div key={comp.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-neutral-900">{comp.winner}</p>
                    <p className="text-sm text-neutral-500">{comp.date}</p>
                  </div>
                  <Badge variant="primary">{comp.score}</Badge>
                </div>
              ))
            )}
          </Card>
        </section>
      </div>
    );
  }

  // NSMQ Home view - Original competition format
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-display font-bold text-neutral-900">NSMQ Competition Mode</h1>
        <p className="text-neutral-500 max-w-lg mx-auto">
          Experience the full National Science & Maths Quiz format with all 5 rounds
        </p>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card className="p-6 border-2 border-primary bg-primary-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Full Competition</h3>
              <p className="text-sm text-neutral-500">All 5 rounds, 3 schools</p>
            </div>
          </div>
          <p className="text-neutral-600 mb-4">
            Simulate a complete NSMQ competition with Fundamentals, Speed Race,
            Problem of the Day, True or False, and Riddles.
          </p>
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
            <Clock className="w-4 h-4" />
            <span>~45 minutes</span>
            <Users className="w-4 h-4 ml-4" />
            <span>3 schools</span>
          </div>
          <Button fullWidth onClick={() => setView('setup')}>
            <Play className="w-4 h-4 mr-2" />
            Start Competition
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-secondary rounded-xl">
              <Target className="w-6 h-6 text-neutral-900" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Practice Round</h3>
              <p className="text-sm text-neutral-500">Focus on specific rounds</p>
            </div>
          </div>
          <p className="text-neutral-600 mb-4">
            Practice individual rounds to improve your skills in specific formats
            before the full competition.
          </p>
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
            <Clock className="w-4 h-4" />
            <span>~10 minutes each</span>
          </div>
          <Button variant="secondary" fullWidth onClick={() => setSelectedPracticeRound(1)}>
            Choose Round
          </Button>
        </Card>
      </div>

      {/* Round Selector */}
      {selectedPracticeRound === null ? (
        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-4 text-center">
            Practice Individual Rounds
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {roundInfo.map((round) => (
              <Card
                key={round.number}
                hoverable
                className="p-4 text-center cursor-pointer"
                onClick={() => handleStartRoundPractice(round.number as 1 | 2 | 3 | 4 | 5)}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-white mx-auto mb-3',
                  round.color
                )}>
                  <round.icon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-neutral-900 mb-1">Round {round.number}</h4>
                <p className="text-sm text-neutral-500">{round.name}</p>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <Card className="p-6 max-w-2xl mx-auto">
          <RoundSelector
            selectedRound={selectedPracticeRound}
            onSelect={(round) => setSelectedPracticeRound(round)}
          />
          <div className="mt-6 flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setSelectedPracticeRound(null)}>
              Cancel
            </Button>
            <Button onClick={() => handleStartRoundPractice(selectedPracticeRound)}>
              Start Round {selectedPracticeRound}
            </Button>
          </div>
        </Card>
      )}

      {/* Recent Competitions */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Recent Competitions</h2>
        <Card className="divide-y divide-neutral-100">
          {historyLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : competitionHistory.length === 0 ? (
            <div className="text-center p-8 text-neutral-500">
              <p>No competition history yet. Start a competition to see your results here!</p>
            </div>
          ) : (
            competitionHistory.map((comp) => (
              <div key={comp.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-neutral-900">{comp.winner}</p>
                  <p className="text-sm text-neutral-500">{comp.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="primary">{comp.score}</Badge>
                  <Badge
                    variant={comp.position === '1st' ? 'success' : 'neutral'}
                  >
                    {comp.position}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </Card>
      </section>

      {/* Rules Modal */}
      {showRulesModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowRulesModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-xl shadow-xl z-50 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-100">
              <h2 className="text-xl font-semibold text-neutral-900">NSMQ Competition Rules</h2>
              <p className="text-neutral-500 text-sm">Official National Science & Maths Quiz rules</p>
            </div>
            <div className="p-6 space-y-6">
              {roundInfo.map((round) => (
                <div key={round.number} className="border-l-4 pl-4" style={{ borderColor: round.color.replace('bg-', '#').replace('-500', '') }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold', round.color)}>
                      {round.number}
                    </div>
                    <h3 className="font-semibold text-neutral-900">{round.name}</h3>
                  </div>
                  <p className="text-neutral-600 mb-2">{round.description}</p>
                  <ul className="space-y-1">
                    {round.details.map((detail, idx) => (
                      <li key={idx} className="text-sm text-neutral-500 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full mt-1.5 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-neutral-100 flex justify-end">
              <Button onClick={() => setShowRulesModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

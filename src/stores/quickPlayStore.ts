import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export type QuickPlayGameType = 'speed_blitz' | 'brain_teaser' | 'subject_dash';

// Custom question type for Quick Play (simplified for fast games)
export interface QuickPlayQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  subjectId: string;
  topicId: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuickPlayGame {
  id: string;
  type: QuickPlayGameType;
  title: string;
  description: string;
  icon: string;
  duration: number; // seconds
  questionCount: number;
  xpReward: { min: number; max: number };
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface DailyChallenge {
  id: string;
  date: string;
  question: QuickPlayQuestion;
  hints: string[];
  hintsUsed: number;
  completed: boolean;
  score?: number;
  xpEarned?: number;
}

export interface QuickPlaySession {
  id: string;
  gameType: QuickPlayGameType;
  subjectId?: string;
  questions: QuickPlayQuestion[];
  currentIndex: number;
  answers: QuickPlayAnswer[];
  startedAt: string;
  timeRemaining: number;
  isActive: boolean;
  score: number;
  streak: number; // Consecutive correct answers
}

export interface QuickPlayAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeTaken: number;
}

export interface QuickPlayResult {
  gameType: QuickPlayGameType;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timeTaken: number;
  xpEarned: number;
  streakBonus: number;
  perfectGame: boolean;
  newHighScore: boolean;
}

export interface QuickPlayStats {
  gamesPlayed: number;
  totalXpEarned: number;
  bestStreak: number;
  perfectGames: number;
  highScores: Record<QuickPlayGameType, number>;
}

interface QuickPlayState {
  // Data
  dailyChallenge: DailyChallenge | null;
  currentSession: QuickPlaySession | null;
  completedToday: string[];
  stats: QuickPlayStats;
  lastResult: QuickPlayResult | null;
  isLoading: boolean;
  error: string | null;

  // Modal states
  showQuickPlayModal: boolean;
  isQuickPlayModalOpen: boolean; // Alias for showQuickPlayModal
  showResultModal: boolean;

  // Actions
  fetchDailyChallenge: () => Promise<void>;
  startGame: (gameType: QuickPlayGameType, subjectId?: string) => Promise<void>;
  submitAnswer: (answer: string) => QuickPlayAnswer | null;
  nextQuestion: () => void;
  endGame: () => QuickPlayResult | null;
  useDailyHint: () => string | null;
  submitDailyAnswer: (answer: string) => { correct: boolean; xpEarned: number } | null;

  // Timer
  updateTimeRemaining: (time: number) => void;

  // Modal controls
  openQuickPlayModal: () => void;
  closeQuickPlayModal: () => void;
  closeResultModal: () => void;

  // Utils
  resetSession: () => void;
  clearError: () => void;
}

// Game configurations
export const QUICK_PLAY_GAMES: QuickPlayGame[] = [
  {
    id: 'speed_blitz',
    type: 'speed_blitz',
    title: 'Speed Blitz',
    description: '5 questions in 60 seconds. How fast can you go?',
    icon: 'Zap',
    duration: 60,
    questionCount: 5,
    xpReward: { min: 50, max: 150 },
    difficulty: 'medium',
  },
  {
    id: 'brain_teaser',
    type: 'brain_teaser',
    title: 'Daily Brain Teaser',
    description: 'One challenging question. Use hints wisely!',
    icon: 'Brain',
    duration: 120,
    questionCount: 1,
    xpReward: { min: 25, max: 100 },
    difficulty: 'hard',
  },
  {
    id: 'subject_dash',
    type: 'subject_dash',
    title: 'Subject Dash',
    description: '7 questions from your chosen subject in 90 seconds.',
    icon: 'Target',
    duration: 90,
    questionCount: 7,
    xpReward: { min: 75, max: 200 },
    difficulty: 'medium',
  },
];

// Sample questions for demo (will be replaced with API)
const generateDemoQuestions = (count: number, subjectId?: string): QuickPlayQuestion[] => {
  const subjects = ['mathematics', 'physics', 'chemistry', 'biology'];
  const selectedSubject = subjectId || subjects[Math.floor(Math.random() * subjects.length)];

  const questionBank: Record<string, QuickPlayQuestion[]> = {
    mathematics: [
      { id: 'q1', text: 'What is 15 × 8?', options: ['100', '120', '115', '125'], correctAnswer: '120', explanation: '15 × 8 = 120', subjectId: 'mathematics', topicId: 'arithmetic', difficulty: 'easy' },
      { id: 'q2', text: 'Solve: 2x + 5 = 15', options: ['x = 5', 'x = 10', 'x = 7', 'x = 3'], correctAnswer: 'x = 5', explanation: '2x = 10, so x = 5', subjectId: 'mathematics', topicId: 'algebra', difficulty: 'medium' },
      { id: 'q3', text: 'What is the square root of 144?', options: ['11', '12', '13', '14'], correctAnswer: '12', explanation: '12 × 12 = 144', subjectId: 'mathematics', topicId: 'arithmetic', difficulty: 'easy' },
      { id: 'q4', text: 'Find the value of x: x² = 49', options: ['±5', '±6', '±7', '±8'], correctAnswer: '±7', explanation: '7 × 7 = 49 and (-7) × (-7) = 49', subjectId: 'mathematics', topicId: 'algebra', difficulty: 'medium' },
      { id: 'q5', text: 'What is 25% of 80?', options: ['15', '20', '25', '30'], correctAnswer: '20', explanation: '25% = 0.25, 0.25 × 80 = 20', subjectId: 'mathematics', topicId: 'percentages', difficulty: 'easy' },
      { id: 'q6', text: 'Simplify: 3(2x + 4) - 2x', options: ['4x + 12', '8x + 12', '4x + 4', '6x + 12'], correctAnswer: '4x + 12', explanation: '6x + 12 - 2x = 4x + 12', subjectId: 'mathematics', topicId: 'algebra', difficulty: 'medium' },
      { id: 'q7', text: 'What is the perimeter of a square with side 9cm?', options: ['27cm', '36cm', '81cm', '18cm'], correctAnswer: '36cm', explanation: 'Perimeter = 4 × side = 4 × 9 = 36cm', subjectId: 'mathematics', topicId: 'geometry', difficulty: 'easy' },
    ],
    physics: [
      { id: 'p1', text: 'What is the SI unit of force?', options: ['Joule', 'Newton', 'Watt', 'Pascal'], correctAnswer: 'Newton', explanation: 'Force is measured in Newtons (N)', subjectId: 'physics', topicId: 'mechanics', difficulty: 'easy' },
      { id: 'p2', text: 'What is the speed of light in vacuum?', options: ['3×10⁶ m/s', '3×10⁸ m/s', '3×10⁵ m/s', '3×10⁷ m/s'], correctAnswer: '3×10⁸ m/s', explanation: 'Speed of light c ≈ 3×10⁸ m/s', subjectId: 'physics', topicId: 'optics', difficulty: 'medium' },
      { id: 'p3', text: 'What is the formula for kinetic energy?', options: ['½mv²', 'mgh', 'mv', 'ma'], correctAnswer: '½mv²', explanation: 'KE = ½mv² where m is mass and v is velocity', subjectId: 'physics', topicId: 'energy', difficulty: 'medium' },
      { id: 'p4', text: 'What type of lens converges light rays?', options: ['Concave', 'Convex', 'Plane', 'Cylindrical'], correctAnswer: 'Convex', explanation: 'Convex lenses converge light to a focal point', subjectId: 'physics', topicId: 'optics', difficulty: 'easy' },
      { id: 'p5', text: 'What is the acceleration due to gravity on Earth?', options: ['8.9 m/s²', '9.8 m/s²', '10.8 m/s²', '7.8 m/s²'], correctAnswer: '9.8 m/s²', explanation: 'g ≈ 9.8 m/s² on Earth\'s surface', subjectId: 'physics', topicId: 'mechanics', difficulty: 'easy' },
      { id: 'p6', text: 'Which law states F = ma?', options: ['First', 'Second', 'Third', 'Zeroth'], correctAnswer: 'Second', explanation: 'Newton\'s Second Law: F = ma', subjectId: 'physics', topicId: 'mechanics', difficulty: 'easy' },
      { id: 'p7', text: 'What is the unit of electrical resistance?', options: ['Ampere', 'Volt', 'Ohm', 'Watt'], correctAnswer: 'Ohm', explanation: 'Resistance is measured in Ohms (Ω)', subjectId: 'physics', topicId: 'electricity', difficulty: 'easy' },
    ],
    chemistry: [
      { id: 'c1', text: 'What is the chemical symbol for Gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correctAnswer: 'Au', explanation: 'Gold\'s symbol Au comes from Latin "Aurum"', subjectId: 'chemistry', topicId: 'periodic_table', difficulty: 'easy' },
      { id: 'c2', text: 'What is the pH of a neutral solution?', options: ['0', '7', '14', '1'], correctAnswer: '7', explanation: 'pH 7 is neutral (pure water)', subjectId: 'chemistry', topicId: 'acids_bases', difficulty: 'easy' },
      { id: 'c3', text: 'What is the atomic number of Carbon?', options: ['4', '6', '8', '12'], correctAnswer: '6', explanation: 'Carbon has 6 protons, so atomic number is 6', subjectId: 'chemistry', topicId: 'periodic_table', difficulty: 'easy' },
      { id: 'c4', text: 'What type of bond is formed when electrons are shared?', options: ['Ionic', 'Covalent', 'Metallic', 'Hydrogen'], correctAnswer: 'Covalent', explanation: 'Covalent bonds involve sharing of electrons', subjectId: 'chemistry', topicId: 'bonding', difficulty: 'medium' },
      { id: 'c5', text: 'What gas is produced when acids react with carbonates?', options: ['Oxygen', 'Hydrogen', 'Carbon dioxide', 'Nitrogen'], correctAnswer: 'Carbon dioxide', explanation: 'Acid + Carbonate → Salt + Water + CO₂', subjectId: 'chemistry', topicId: 'reactions', difficulty: 'medium' },
      { id: 'c6', text: 'What is the molecular formula of water?', options: ['H₂O', 'HO₂', 'H₃O', 'HO'], correctAnswer: 'H₂O', explanation: 'Water is 2 hydrogen atoms bonded to 1 oxygen', subjectId: 'chemistry', topicId: 'compounds', difficulty: 'easy' },
      { id: 'c7', text: 'Which element has the symbol Fe?', options: ['Fluorine', 'Iron', 'Francium', 'Fermium'], correctAnswer: 'Iron', explanation: 'Fe comes from Latin "Ferrum" meaning iron', subjectId: 'chemistry', topicId: 'periodic_table', difficulty: 'easy' },
    ],
    biology: [
      { id: 'b1', text: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Chloroplast'], correctAnswer: 'Mitochondria', explanation: 'Mitochondria produce ATP, the cell\'s energy currency', subjectId: 'biology', topicId: 'cell_biology', difficulty: 'easy' },
      { id: 'b2', text: 'What is the process by which plants make food?', options: ['Respiration', 'Photosynthesis', 'Digestion', 'Fermentation'], correctAnswer: 'Photosynthesis', explanation: 'Photosynthesis converts light energy to chemical energy', subjectId: 'biology', topicId: 'plant_biology', difficulty: 'easy' },
      { id: 'b3', text: 'How many chromosomes do humans have?', options: ['23', '46', '44', '48'], correctAnswer: '46', explanation: 'Humans have 46 chromosomes (23 pairs)', subjectId: 'biology', topicId: 'genetics', difficulty: 'easy' },
      { id: 'b4', text: 'What is the largest organ in the human body?', options: ['Heart', 'Liver', 'Skin', 'Brain'], correctAnswer: 'Skin', explanation: 'Skin is the largest organ by surface area', subjectId: 'biology', topicId: 'human_biology', difficulty: 'easy' },
      { id: 'b5', text: 'Which blood type is the universal donor?', options: ['A', 'B', 'AB', 'O'], correctAnswer: 'O', explanation: 'Type O negative can donate to all blood types', subjectId: 'biology', topicId: 'human_biology', difficulty: 'medium' },
      { id: 'b6', text: 'What is the basic unit of life?', options: ['Atom', 'Cell', 'Organ', 'Tissue'], correctAnswer: 'Cell', explanation: 'The cell is the fundamental unit of all living organisms', subjectId: 'biology', topicId: 'cell_biology', difficulty: 'easy' },
      { id: 'b7', text: 'What carries oxygen in red blood cells?', options: ['Plasma', 'Hemoglobin', 'Platelets', 'White cells'], correctAnswer: 'Hemoglobin', explanation: 'Hemoglobin binds to oxygen for transport', subjectId: 'biology', topicId: 'human_biology', difficulty: 'medium' },
    ],
  };

  const questions = questionBank[selectedSubject] || questionBank.mathematics;
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Generate daily brain teaser
const generateDailyBrainTeaser = (): DailyChallenge => {
  const hardQuestions: QuickPlayQuestion[] = [
    {
      id: 'bt1',
      text: 'A train travels from City A to City B at 60 km/h and returns at 40 km/h. What is the average speed for the whole journey?',
      options: ['48 km/h', '50 km/h', '52 km/h', '45 km/h'],
      correctAnswer: '48 km/h',
      explanation: 'Average speed = 2×v₁×v₂/(v₁+v₂) = 2×60×40/100 = 48 km/h. It\'s not simply (60+40)/2 because time spent at each speed differs.',
      subjectId: 'mathematics',
      topicId: 'speed_distance',
      difficulty: 'hard',
    },
    {
      id: 'bt2',
      text: 'If log₂(x) + log₂(x-2) = 3, find x.',
      options: ['4', '6', '8', '2'],
      correctAnswer: '4',
      explanation: 'log₂(x(x-2)) = 3 → x(x-2) = 8 → x² - 2x - 8 = 0 → (x-4)(x+2) = 0 → x = 4 (x > 2)',
      subjectId: 'mathematics',
      topicId: 'logarithms',
      difficulty: 'hard',
    },
    {
      id: 'bt3',
      text: 'A 2kg ball moving at 4m/s collides elastically with a stationary 2kg ball. What is the velocity of the first ball after collision?',
      options: ['0 m/s', '2 m/s', '4 m/s', '-2 m/s'],
      correctAnswer: '0 m/s',
      explanation: 'In elastic collision between equal masses, the moving ball stops and transfers all momentum to the stationary ball.',
      subjectId: 'physics',
      topicId: 'momentum',
      difficulty: 'hard',
    },
  ];

  const question = hardQuestions[Math.floor(Math.random() * hardQuestions.length)];
  const today = new Date().toISOString().split('T')[0];

  return {
    id: `daily_${today}`,
    date: today,
    question,
    hints: [
      'Think about the relationship between the variables.',
      'Consider using a formula or equation.',
      question.explanation.split('.')[0] + '...',
    ],
    hintsUsed: 0,
    completed: false,
  };
};

export const useQuickPlayStore = create<QuickPlayState>()(
  persist(
    (set, get) => ({
      // Initial state
      dailyChallenge: null,
      currentSession: null,
      completedToday: [],
      stats: {
        gamesPlayed: 0,
        totalXpEarned: 0,
        bestStreak: 0,
        perfectGames: 0,
        highScores: {
          speed_blitz: 0,
          brain_teaser: 0,
          subject_dash: 0,
        },
      },
      lastResult: null,
      isLoading: false,
      error: null,
      showQuickPlayModal: false,
      isQuickPlayModalOpen: false,
      showResultModal: false,

      // Fetch daily challenge
      fetchDailyChallenge: async () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];

        // Check if we already have today's challenge
        if (state.dailyChallenge?.date === today) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Try API first
          const token = localStorage.getItem('brilla_token');
          if (token) {
            const response = await fetch('/api/quickplay/daily-challenge', {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data?.challenge) {
                const apiChallenge = data.data.challenge;
                set({
                  dailyChallenge: {
                    id: apiChallenge.id,
                    date: apiChallenge.date,
                    question: apiChallenge.question || generateDailyBrainTeaser().question,
                    hints: apiChallenge.hints || ['Think carefully...', 'Consider all options...'],
                    hintsUsed: 0,
                    completed: apiChallenge.completed || false,
                  },
                  isLoading: false,
                });
                return;
              }
            }
          }
          // Fallback to mock data
          const challenge = generateDailyBrainTeaser();
          set({ dailyChallenge: challenge, isLoading: false });
        } catch (error) {
          // Fallback to mock data on error
          const challenge = generateDailyBrainTeaser();
          set({ dailyChallenge: challenge, isLoading: false });
        }
      },

      // Start a game
      startGame: async (gameType: QuickPlayGameType, subjectId?: string) => {
        set({ isLoading: true, error: null });

        try {
          const gameConfig = QUICK_PLAY_GAMES.find(g => g.type === gameType);
          if (!gameConfig) {
            throw new Error('Invalid game type');
          }

          let questions = generateDemoQuestions(gameConfig.questionCount, subjectId);
          let sessionId = `session_${Date.now()}`;

          // Try API first
          const token = localStorage.getItem('brilla_token');
          if (token) {
            try {
              const response = await fetch('/api/quickplay/start', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gameType, subjectId }),
              });
              if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                  sessionId = data.data.sessionId;
                  // multiplier is available in data.data.multiplier if needed
                  if (data.data.questions?.length > 0) {
                    questions = data.data.questions.map((q: any) => ({
                      id: q.id,
                      text: q.questionText,
                      options: q.options?.map((o: any) => typeof o === 'string' ? o : o.text) || [],
                      correctAnswer: q.options?.find((o: any) => o.isCorrect)?.text || q.correctAnswer || '',
                      explanation: q.explanation || '',
                      subjectId: q.subjectId || subjectId || '',
                      topicId: q.topicId || '',
                      difficulty: q.difficulty || 'medium',
                    }));
                  }
                }
              }
            } catch (apiError) {
              console.log('Using mock questions as fallback');
            }
          }

          const session: QuickPlaySession = {
            id: sessionId,
            gameType,
            subjectId,
            questions,
            currentIndex: 0,
            answers: [],
            startedAt: new Date().toISOString(),
            timeRemaining: gameConfig.duration,
            isActive: true,
            score: 0,
            streak: 0,
          };

          set({
            currentSession: session,
            isLoading: false,
            showQuickPlayModal: false,
            isQuickPlayModalOpen: false,
          });
        } catch (error) {
          set({ error: 'Failed to start game', isLoading: false });
        }
      },

      // Submit answer
      submitAnswer: (answer: string) => {
        const state = get();
        if (!state.currentSession || !state.currentSession.isActive) return null;

        const { currentSession } = state;
        const currentQuestion = currentSession.questions[currentSession.currentIndex];
        const isCorrect = answer === currentQuestion.correctAnswer;

        const timeTaken = Math.max(0,
          QUICK_PLAY_GAMES.find(g => g.type === currentSession.gameType)!.duration - currentSession.timeRemaining
        );

        const answerRecord: QuickPlayAnswer = {
          questionId: currentQuestion.id,
          answer,
          isCorrect,
          timeTaken,
        };

        const newStreak = isCorrect ? currentSession.streak + 1 : 0;
        const basePoints = isCorrect ? 100 : 0;
        const streakBonus = isCorrect && newStreak > 1 ? (newStreak - 1) * 10 : 0;
        const speedBonus = isCorrect && timeTaken < 5 ? 25 : 0;

        set({
          currentSession: {
            ...currentSession,
            answers: [...currentSession.answers, answerRecord],
            score: currentSession.score + basePoints + streakBonus + speedBonus,
            streak: newStreak,
          },
        });

        return answerRecord;
      },

      // Next question
      nextQuestion: () => {
        const state = get();
        if (!state.currentSession) return;

        const { currentSession } = state;
        const nextIndex = currentSession.currentIndex + 1;

        if (nextIndex >= currentSession.questions.length) {
          // Game complete
          get().endGame();
        } else {
          set({
            currentSession: {
              ...currentSession,
              currentIndex: nextIndex,
            },
          });
        }
      },

      // End game
      endGame: () => {
        const state = get();
        if (!state.currentSession) return null;

        const { currentSession, stats } = state;
        const gameConfig = QUICK_PLAY_GAMES.find(g => g.type === currentSession.gameType)!;

        const correctAnswers = currentSession.answers.filter(a => a.isCorrect).length;
        const totalQuestions = currentSession.questions.length;
        const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
        const timeTaken = gameConfig.duration - currentSession.timeRemaining;

        // Calculate XP
        const baseXp = Math.round(
          gameConfig.xpReward.min +
          (accuracy / 100) * (gameConfig.xpReward.max - gameConfig.xpReward.min)
        );
        const perfectBonus = accuracy === 100 ? 50 : 0;
        const speedBonus = timeTaken < gameConfig.duration * 0.5 ? 25 : 0;
        const xpEarned = baseXp + perfectBonus + speedBonus;

        const perfectGame = accuracy === 100;
        const newHighScore = currentSession.score > (stats.highScores[currentSession.gameType] || 0);

        const result: QuickPlayResult = {
          gameType: currentSession.gameType,
          totalQuestions,
          correctAnswers,
          accuracy,
          timeTaken,
          xpEarned,
          streakBonus: perfectBonus + speedBonus,
          perfectGame,
          newHighScore,
        };

        // Update stats
        const newStats: QuickPlayStats = {
          gamesPlayed: stats.gamesPlayed + 1,
          totalXpEarned: stats.totalXpEarned + xpEarned,
          bestStreak: Math.max(stats.bestStreak, currentSession.streak),
          perfectGames: stats.perfectGames + (perfectGame ? 1 : 0),
          highScores: {
            ...stats.highScores,
            [currentSession.gameType]: Math.max(
              stats.highScores[currentSession.gameType] || 0,
              currentSession.score
            ),
          },
        };

        const today = new Date().toISOString().split('T')[0];

        set({
          currentSession: { ...currentSession, isActive: false },
          stats: newStats,
          lastResult: result,
          completedToday: [...state.completedToday, `${currentSession.gameType}_${today}`],
          showResultModal: true,
        });

        return result;
      },

      // Use daily hint
      useDailyHint: () => {
        const state = get();
        if (!state.dailyChallenge || state.dailyChallenge.completed) return null;

        const { dailyChallenge } = state;
        if (dailyChallenge.hintsUsed >= dailyChallenge.hints.length) return null;

        const hint = dailyChallenge.hints[dailyChallenge.hintsUsed];

        set({
          dailyChallenge: {
            ...dailyChallenge,
            hintsUsed: dailyChallenge.hintsUsed + 1,
          },
        });

        return hint;
      },

      // Submit daily answer
      submitDailyAnswer: (answer: string) => {
        const state = get();
        if (!state.dailyChallenge || state.dailyChallenge.completed) return null;

        const { dailyChallenge, stats } = state;
        const correct = answer === dailyChallenge.question.correctAnswer;

        // XP calculation: base 100, minus 25 per hint used, bonus 50 for correct
        const baseXp = 25;
        const hintPenalty = dailyChallenge.hintsUsed * 25;
        const correctBonus = correct ? 75 : 0;
        const xpEarned = Math.max(0, baseXp + correctBonus - hintPenalty);

        set({
          dailyChallenge: {
            ...dailyChallenge,
            completed: true,
            score: correct ? 100 - (dailyChallenge.hintsUsed * 25) : 0,
            xpEarned,
          },
          stats: {
            ...stats,
            totalXpEarned: stats.totalXpEarned + xpEarned,
            highScores: {
              ...stats.highScores,
              brain_teaser: Math.max(
                stats.highScores.brain_teaser || 0,
                correct ? 100 - (dailyChallenge.hintsUsed * 25) : 0
              ),
            },
          },
        });

        return { correct, xpEarned };
      },

      // Update time remaining
      updateTimeRemaining: (time: number) => {
        const state = get();
        if (!state.currentSession) return;

        if (time <= 0) {
          get().endGame();
        } else {
          set({
            currentSession: {
              ...state.currentSession,
              timeRemaining: time,
            },
          });
        }
      },

      // Modal controls
      openQuickPlayModal: () => set({ showQuickPlayModal: true, isQuickPlayModalOpen: true }),
      closeQuickPlayModal: () => set({ showQuickPlayModal: false, isQuickPlayModalOpen: false }),
      closeResultModal: () => set({ showResultModal: false, currentSession: null }),

      // Reset session
      resetSession: () => set({ currentSession: null, lastResult: null }),

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'brilla-quickplay',
      version: 1,
      partialize: (state) => ({
        stats: state.stats,
        completedToday: state.completedToday,
        dailyChallenge: state.dailyChallenge,
      }),
    }
  )
);

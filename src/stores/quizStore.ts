import { create } from 'zustand';
import type { Question, PracticeSession, PracticeResult, Riddle } from '@/types';
import { SCORING } from '@/types';

type PracticeMode = 'topic_drill' | 'speed_race' | 'flashcard' | 'competition_sim';

interface QuizState {
  // Session state
  session: PracticeSession | null;
  currentQuestion: Question | null;
  currentIndex: number;
  questions: Question[];

  // Timer state
  timeRemaining: number;
  isTimerRunning: boolean;

  // Answer state
  selectedAnswer: string | null;
  isAnswerRevealed: boolean;
  results: PracticeResult[];

  // Score tracking
  score: number;
  correctCount: number;
  streak: number;

  // Riddle state
  currentRiddle: Riddle | null;
  revealedClues: number;

  // Actions
  startSession: (mode: PracticeMode, questions: Question[], subjectId?: string, topicId?: string) => void;
  endSession: () => void;

  setQuestions: (questions: Question[]) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;

  selectAnswer: (answer: string) => void;
  submitAnswer: () => PracticeResult;
  revealAnswer: () => void;

  startTimer: (duration: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  decrementTimer: () => void;
  resetTimer: () => void;

  // Riddle actions
  setRiddle: (riddle: Riddle) => void;
  revealNextClue: () => void;
  submitRiddleAnswer: (answer: string) => { isCorrect: boolean; points: number };

  // Reset
  reset: () => void;
}

const initialState = {
  session: null,
  currentQuestion: null,
  currentIndex: 0,
  questions: [],
  timeRemaining: 0,
  isTimerRunning: false,
  selectedAnswer: null,
  isAnswerRevealed: false,
  results: [],
  score: 0,
  correctCount: 0,
  streak: 0,
  currentRiddle: null,
  revealedClues: 0,
};

export const useQuizStore = create<QuizState>((set, get) => ({
  ...initialState,

  startSession: (mode, questions, subjectId, topicId) => {
    const session: PracticeSession = {
      id: `session_${Date.now()}`,
      userId: '', // Will be set from auth store
      mode,
      subjectId,
      topicId,
      questions,
      currentIndex: 0,
      score: 0,
      startedAt: new Date().toISOString(),
      results: [],
    };

    set({
      session,
      questions,
      currentQuestion: questions[0] || null,
      currentIndex: 0,
      score: 0,
      correctCount: 0,
      streak: 0,
      results: [],
      selectedAnswer: null,
      isAnswerRevealed: false,
    });
  },

  endSession: () => {
    const { session, score, results } = get();
    if (session) {
      // Session completed - could trigger API call here
      console.log('Session ended:', { ...session, score, results, completedAt: new Date().toISOString() });
    }
    set({ session: null });
  },

  setQuestions: (questions) => {
    set({
      questions,
      currentQuestion: questions[0] || null,
      currentIndex: 0,
    });
  },

  nextQuestion: () => {
    const { questions, currentIndex } = get();
    const nextIndex = currentIndex + 1;

    if (nextIndex < questions.length) {
      set({
        currentIndex: nextIndex,
        currentQuestion: questions[nextIndex],
        selectedAnswer: null,
        isAnswerRevealed: false,
        timeRemaining: questions[nextIndex].timeLimit,
      });
    }
  },

  previousQuestion: () => {
    const { questions, currentIndex } = get();
    const prevIndex = currentIndex - 1;

    if (prevIndex >= 0) {
      set({
        currentIndex: prevIndex,
        currentQuestion: questions[prevIndex],
        selectedAnswer: null,
        isAnswerRevealed: false,
      });
    }
  },

  goToQuestion: (index) => {
    const { questions } = get();

    if (index >= 0 && index < questions.length) {
      set({
        currentIndex: index,
        currentQuestion: questions[index],
        selectedAnswer: null,
        isAnswerRevealed: false,
        timeRemaining: questions[index].timeLimit,
      });
    }
  },

  selectAnswer: (answer) => {
    set({ selectedAnswer: answer });
  },

  submitAnswer: () => {
    const { currentQuestion, selectedAnswer, timeRemaining, streak } = get();

    if (!currentQuestion || selectedAnswer === null) {
      throw new Error('No question or answer selected');
    }

    const timeTaken = currentQuestion.timeLimit - timeRemaining;
    const isCorrect = selectedAnswer.toLowerCase().trim() ===
                      currentQuestion.correctAnswer.toLowerCase().trim();

    // Calculate points based on round type
    let pointsEarned = 0;
    if (isCorrect) {
      switch (currentQuestion.roundType) {
        case 'round_one':
          pointsEarned = SCORING.ROUND_ONE.CORRECT;
          break;
        case 'speed_race':
          pointsEarned = SCORING.ROUND_TWO.FIRST; // Default to first place points in practice
          break;
        case 'true_false':
          pointsEarned = SCORING.ROUND_FOUR.CORRECT;
          break;
        default:
          pointsEarned = currentQuestion.points;
      }
    } else if (currentQuestion.roundType === 'speed_race') {
      pointsEarned = SCORING.ROUND_TWO.WRONG;
    } else if (currentQuestion.roundType === 'true_false') {
      pointsEarned = SCORING.ROUND_FOUR.WRONG;
    }

    const result: PracticeResult = {
      questionId: currentQuestion.id,
      userAnswer: selectedAnswer,
      isCorrect,
      timeTaken,
      pointsEarned,
    };

    set((state) => ({
      results: [...state.results, result],
      score: state.score + pointsEarned,
      correctCount: isCorrect ? state.correctCount + 1 : state.correctCount,
      streak: isCorrect ? streak + 1 : 0,
      isAnswerRevealed: true,
      isTimerRunning: false,
    }));

    return result;
  },

  revealAnswer: () => {
    set({ isAnswerRevealed: true, isTimerRunning: false });
  },

  startTimer: (duration) => {
    set({ timeRemaining: duration, isTimerRunning: true });
  },

  pauseTimer: () => {
    set({ isTimerRunning: false });
  },

  resumeTimer: () => {
    set({ isTimerRunning: true });
  },

  decrementTimer: () => {
    const { timeRemaining, isTimerRunning } = get();
    if (isTimerRunning && timeRemaining > 0) {
      set({ timeRemaining: timeRemaining - 1 });
    } else if (timeRemaining === 0) {
      set({ isTimerRunning: false });
    }
  },

  resetTimer: () => {
    const { currentQuestion } = get();
    set({
      timeRemaining: currentQuestion?.timeLimit || 30,
      isTimerRunning: false,
    });
  },

  setRiddle: (riddle) => {
    set({ currentRiddle: riddle, revealedClues: 1 });
  },

  revealNextClue: () => {
    const { currentRiddle, revealedClues } = get();
    if (currentRiddle && revealedClues < currentRiddle.clues.length) {
      set({ revealedClues: revealedClues + 1 });
    }
  },

  submitRiddleAnswer: (answer) => {
    const { currentRiddle, revealedClues } = get();

    if (!currentRiddle) {
      return { isCorrect: false, points: 0 };
    }

    const isCorrect = answer.toLowerCase().trim() ===
                      currentRiddle.answer.toLowerCase().trim();

    let points = 0;
    if (isCorrect) {
      switch (revealedClues) {
        case 1:
          points = SCORING.ROUND_FIVE.CLUE_1;
          break;
        case 2:
          points = SCORING.ROUND_FIVE.CLUE_2;
          break;
        default:
          points = SCORING.ROUND_FIVE.CLUE_3_PLUS;
      }
    }

    set((state) => ({
      score: state.score + points,
    }));

    return { isCorrect, points };
  },

  reset: () => {
    set(initialState);
  },
}));

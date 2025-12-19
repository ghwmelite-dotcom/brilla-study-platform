import type { Question, Riddle, CompetitionSchool } from './index';

// Round-specific types
export interface Round1Question extends Question {
  roundType: 'round_one';
  bonusAvailable: boolean;
}

export interface Round2Question extends Question {
  roundType: 'speed_race';
}

export interface Round3Problem {
  id: string;
  subjectId: string;
  problemText: string;
  parts: ProblemPart[];
  totalPoints: number;
  timeLimit: number;
  imageUrl?: string;
}

export interface ProblemPart {
  id: string;
  partLabel: string;
  question: string;
  answer: string;
  points: number;
  explanation?: string;
}

export interface Round4Statement {
  id: string;
  subjectId: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
  requiresCalculation: boolean;
  timeLimit: number;
}

export interface Round5Riddle extends Riddle {
  currentClue: number;
  isAnswered: boolean;
  answeredBy?: string;
  pointsAwarded?: number;
}

// Competition round states
export interface Round1State {
  questions: Round1Question[];
  currentQuestionIndex: number;
  currentSubjectIndex: number;
  currentSchoolIndex: number;
  questionsPerSubject: number;
  subjects: string[];
  schoolScores: Record<string, number>;
  bonusQueue: BonusQuestion[];
}

export interface BonusQuestion {
  question: Round1Question;
  fromSchoolId: string;
  toSchoolId: string;
}

export interface Round2State {
  questions: Round2Question[];
  currentQuestionIndex: number;
  buzzerEnabled: boolean;
  buzzedSchools: BuzzRecord[];
  answersGiven: number;
}

export interface BuzzRecord {
  schoolId: string;
  timestamp: number;
  answer?: string;
  isCorrect?: boolean;
  points?: number;
}

export interface Round3State {
  problem: Round3Problem;
  schoolAnswers: Record<string, ProblemAnswer>;
  timeRemaining: number;
  isRevealed: boolean;
}

export interface ProblemAnswer {
  schoolId: string;
  partAnswers: Record<string, string>;
  totalPoints: number;
  submittedAt?: number;
}

export interface Round4State {
  statements: Round4Statement[];
  currentStatementIndex: number;
  currentSchoolIndex: number;
  schoolOrder: string[];
  passedStatements: PassedStatement[];
}

export interface PassedStatement {
  statement: Round4Statement;
  fromSchoolId: string;
  availableForBonus: boolean;
}

export interface Round5State {
  riddles: Round5Riddle[];
  currentRiddleIndex: number;
  currentClueIndex: number;
  isRiddleActive: boolean;
  schoolAttempts: Record<string, RiddleAttempt[]>;
}

export interface RiddleAttempt {
  schoolId: string;
  riddleId: string;
  clueNumber: number;
  answer: string;
  isCorrect: boolean;
  timestamp: number;
}

// Competition session
export interface CompetitionSession {
  id: string;
  competition: {
    id: string;
    name: string;
    schools: CompetitionSchool[];
  };
  currentRound: 1 | 2 | 3 | 4 | 5;
  roundStates: {
    round1?: Round1State;
    round2?: Round2State;
    round3?: Round3State;
    round4?: Round4State;
    round5?: Round5State;
  };
  isComplete: boolean;
  finalScores?: Record<string, number>;
}

// Buzzer types for Round 2
export interface BuzzerState {
  isEnabled: boolean;
  canBuzz: boolean;
  buzzedSchool?: string;
  buzzTimestamp?: number;
}

// Timer types
export interface TimerState {
  duration: number;
  remaining: number;
  isRunning: boolean;
  isPaused: boolean;
  onComplete?: () => void;
}

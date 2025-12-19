// Analytics utility functions for calculating performance metrics

export interface DailyProgress {
  date: string;
  questionsAttempted: number;
  questionsCorrect: number;
  accuracy: number;
  xpEarned: number;
}

export interface SubjectPerformance {
  subject: string;
  subjectId: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  masteryLevel: number;
  color: string;
}

export interface TopicStrength {
  topicId: string;
  topicName: string;
  subjectName: string;
  masteryLevel: number;
  questionsAttempted: number;
  accuracy: number;
  isStrength: boolean; // true if strong, false if weak
}

export interface StudyHeatmapData {
  date: string;
  count: number; // questions attempted
  level: 0 | 1 | 2 | 3 | 4; // intensity level for coloring
}

export interface AnalyticsStats {
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  overallAccuracy: number;
  averageTimePerQuestion: number;
  currentStreak: number;
  longestStreak: number;
  totalXpEarned: number;
  predictedNsmqScore: number;
  weeklyProgress: DailyProgress[];
  subjectPerformance: SubjectPerformance[];
  strengths: TopicStrength[];
  weaknesses: TopicStrength[];
  studyHeatmap: StudyHeatmapData[];
}

// Calculate overall accuracy percentage
export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

// Calculate mastery level based on accuracy and questions attempted
export function calculateMasteryLevel(accuracy: number, questionsAttempted: number): number {
  // More questions = higher confidence in the mastery level
  const confidenceMultiplier = Math.min(questionsAttempted / 20, 1); // Max out at 20 questions
  return Math.round(accuracy * confidenceMultiplier);
}

// Calculate predicted NSMQ score (0-100 readiness indicator)
export function calculatePredictedNsmqScore(stats: {
  accuracy: number;
  averageTime: number;
  subjectCoverage: number; // percentage of subjects with >50% mastery
  questionCount: number;
}): number {
  const { accuracy, averageTime, subjectCoverage, questionCount } = stats;

  // Base score from accuracy (50% weight)
  const accuracyScore = accuracy * 0.5;

  // Time bonus (20% weight) - faster is better, ideal is 15s or less
  const timeScore = Math.max(0, (30 - averageTime) / 30) * 20;

  // Subject coverage (20% weight)
  const coverageScore = subjectCoverage * 0.2;

  // Experience bonus (10% weight) - more questions = more experience
  const experienceScore = Math.min(questionCount / 500, 1) * 10;

  return Math.round(accuracyScore + timeScore + coverageScore + experienceScore);
}

// Get study heatmap intensity level based on question count
export function getHeatmapLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 5) return 1;
  if (count <= 15) return 2;
  if (count <= 30) return 3;
  return 4;
}

// Generate empty heatmap data for the last N days
export function generateEmptyHeatmap(days: number): StudyHeatmapData[] {
  const result: StudyHeatmapData[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    result.push({
      date: date.toISOString().split('T')[0],
      count: 0,
      level: 0,
    });
  }

  return result;
}

// Subject colors for charts
export const subjectColors: Record<string, string> = {
  mathematics: '#3B82F6', // Blue
  physics: '#8B5CF6', // Purple
  chemistry: '#22C55E', // Green
  biology: '#F59E0B', // Amber
};

// Get color for a subject
export function getSubjectColor(subject: string): string {
  return subjectColors[subject.toLowerCase()] || '#6B7280';
}

// Format time duration in seconds to readable string
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

// Calculate trend (percentage change)
export function calculateTrend(current: number, previous: number): {
  value: number;
  direction: 'up' | 'down' | 'neutral';
} {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'neutral' };
  }

  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(change)),
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
  };
}

// Group data by date for trend charts
export function groupByDate<T extends { createdAt: string }>(
  data: T[],
  days: number
): Map<string, T[]> {
  const result = new Map<string, T[]>();
  const today = new Date();

  // Initialize all dates
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    result.set(dateStr, []);
  }

  // Group data by date
  data.forEach((item) => {
    const dateStr = new Date(item.createdAt).toISOString().split('T')[0];
    const existing = result.get(dateStr);
    if (existing) {
      existing.push(item);
    }
  });

  return result;
}

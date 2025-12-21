// AI Student Counselor Type Definitions

export type CounselorType = 'academic' | 'career' | 'wellbeing' | 'general';
export type MessageRole = 'user' | 'counselor' | 'system';
export type Sentiment = 'positive' | 'neutral' | 'concerned' | 'urgent';
export type ConversationStatus = 'active' | 'archived' | 'flagged';
export type FeedbackType = 'helpful' | 'not_helpful' | 'inappropriate';
export type MoodType = 'great' | 'good' | 'okay' | 'low' | 'stressed';

// Counselor Conversation
export interface CounselorConversation {
  id: string;
  userId: string;
  counselorType: CounselorType;
  title?: string;
  status: ConversationStatus;
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  // Computed
  messages?: CounselorMessage[];
  lastMessage?: CounselorMessage;
}

// Counselor Message
export interface CounselorMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  thinking?: string;
  sentiment?: Sentiment;
  suggestedResources?: SuggestedResource[];
  createdAt: string;
  // UI state
  isNew?: boolean;
  isTyping?: boolean;
}

// Suggested Resource from Claude
export interface SuggestedResource {
  type: 'article' | 'video' | 'exercise' | 'tip' | 'professional';
  title: string;
  description?: string;
  url?: string;
  libraryResourceId?: string; // Link to E-Library
}

// Message Feedback
export interface CounselorFeedback {
  id: string;
  messageId: string;
  userId: string;
  rating?: number; // 1-5
  feedbackType?: FeedbackType;
  comment?: string;
  createdAt: string;
}

// Wellbeing Log (daily check-in)
export interface WellbeingLog {
  id: string;
  userId: string;
  logDate: string;
  stressLevel: number; // 1-5
  studySatisfaction: number; // 1-5
  energyLevel: number; // 1-5
  mood: MoodType;
  notes?: string;
  createdAt: string;
}

// Student Context (sent to Claude for personalized responses)
export interface StudentContext {
  name: string;
  preferredName?: string;
  gradeLevel?: string;
  schoolLevel?: 'jhs' | 'shs';
  subjects?: string[];
  recentPerformance?: {
    accuracy: number;
    trend: 'improving' | 'stable' | 'declining';
    questionsThisWeek: number;
  };
  streakDays?: number;
  studyHoursThisWeek?: number;
  goals?: string[];
  strengths?: string[];
  weakAreas?: string[];
  recentWellbeing?: {
    averageStress: number;
    averageMood: MoodType;
    trend: 'improving' | 'stable' | 'declining';
  };
}

// Counselor Configuration
export interface CounselorConfig {
  type: CounselorType;
  name: string;
  description: string;
  icon: string;
  color: string;
  avatar?: string;
  systemPrompt: string;
  quickActions: QuickAction[];
}

// Quick Action Button
export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}

// Counselor Resource (curated content)
export interface CounselorResource {
  id: string;
  counselorType: CounselorType;
  resourceType: 'article' | 'video' | 'exercise' | 'tip' | 'external_link';
  title: string;
  description?: string;
  content?: string;
  url?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

// Send Message Request
export interface SendMessageRequest {
  conversationId?: string; // Create new if not provided
  counselorType: CounselorType;
  message: string;
  context?: StudentContext;
}

// Chat Response from API
export interface CounselorChatResponse {
  message: CounselorMessage;
  conversation: CounselorConversation;
  sentiment?: Sentiment;
  suggestedResources?: SuggestedResource[];
}

// Wellbeing Statistics
export interface WellbeingStats {
  averageStress: number;
  averageSatisfaction: number;
  averageEnergy: number;
  moodDistribution: Record<MoodType, number>;
  trend: 'improving' | 'stable' | 'declining';
  logsThisWeek: number;
  streakDays: number;
}

// Counselor type configurations
export const COUNSELOR_CONFIGS: Record<CounselorType, Omit<CounselorConfig, 'systemPrompt'>> = {
  academic: {
    type: 'academic',
    name: 'Academic Advisor',
    description: 'Get help with study strategies, subject difficulties, and exam preparation',
    icon: 'GraduationCap',
    color: '#3B82F6',
    quickActions: [
      { id: 'study-tips', label: 'Study Tips', prompt: "What are some effective study techniques for better retention?" },
      { id: 'exam-prep', label: 'Exam Prep', prompt: "How should I prepare for my upcoming exams?" },
      { id: 'time-management', label: 'Time Management', prompt: "Help me create a study schedule" },
      { id: 'subject-help', label: 'Subject Help', prompt: "I'm struggling with a subject and need guidance" },
    ],
  },
  career: {
    type: 'career',
    name: 'Career Counselor',
    description: 'Explore STEM careers, university options, and future pathways',
    icon: 'Briefcase',
    color: '#8B5CF6',
    quickActions: [
      { id: 'stem-careers', label: 'STEM Careers', prompt: "What STEM careers match my interests and strengths?" },
      { id: 'university', label: 'University Advice', prompt: "What universities should I consider for my field?" },
      { id: 'skills', label: 'Skills Needed', prompt: "What skills do I need to develop for my career goals?" },
      { id: 'internships', label: 'Opportunities', prompt: "What internships or programs are available for students?" },
    ],
  },
  wellbeing: {
    type: 'wellbeing',
    name: 'Wellness Counselor',
    description: 'Support for stress, motivation, balance, and mental wellness',
    icon: 'Heart',
    color: '#22C55E',
    quickActions: [
      { id: 'stress', label: 'Feeling Stressed', prompt: "I'm feeling stressed about school. Can you help?" },
      { id: 'motivation', label: 'Need Motivation', prompt: "I'm struggling to stay motivated with my studies" },
      { id: 'balance', label: 'Life Balance', prompt: "How can I balance school, activities, and rest?" },
      { id: 'anxiety', label: 'Test Anxiety', prompt: "I get very anxious before exams. What can I do?" },
    ],
  },
  general: {
    type: 'general',
    name: 'General Counselor',
    description: 'Talk about anything - we\'re here to listen and help',
    icon: 'MessageCircle',
    color: '#F59E0B',
    quickActions: [
      { id: 'chat', label: 'Just Chat', prompt: "Hi! I'd like to talk about something" },
      { id: 'advice', label: 'Need Advice', prompt: "I need some advice on a situation" },
      { id: 'goals', label: 'Set Goals', prompt: "Help me set and track my goals" },
      { id: 'celebrate', label: 'Celebrate Win', prompt: "I want to share something good that happened!" },
    ],
  },
};

// Mood options for wellbeing check-in
export const MOOD_OPTIONS: { value: MoodType; label: string; emoji: string; color: string }[] = [
  { value: 'great', label: 'Great', emoji: '😊', color: '#22C55E' },
  { value: 'good', label: 'Good', emoji: '🙂', color: '#84CC16' },
  { value: 'okay', label: 'Okay', emoji: '😐', color: '#F59E0B' },
  { value: 'low', label: 'Low', emoji: '😔', color: '#F97316' },
  { value: 'stressed', label: 'Stressed', emoji: '😰', color: '#EF4444' },
];

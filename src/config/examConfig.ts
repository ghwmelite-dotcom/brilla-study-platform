// Exam-specific configuration for dynamic dashboard and home page content
// This ensures each exam mode displays relevant, contextual information

import type { ExamTypeSlug } from '@/types';
import {
  Trophy,
  GraduationCap,
  BookOpen,
  Brain,
  Zap,
  Target,
  Clock,
  Award,
  Users,
  FileText,
  PenTool,
  type LucideIcon,
} from 'lucide-react';

export interface ExamConfig {
  // Branding
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  targetAudience: string;

  // Colors
  primaryColor: string;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;

  // Hero section
  heroTitle: string;
  heroSubtitle: string;

  // Subjects section
  subjectsTitle: string;
  subjectsSubtitle: string;

  // Practice modes
  practiceModes: {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    color: string;
    borderColor: string;
    link: string;
  }[];

  // Features
  features: {
    icon: LucideIcon;
    title: string;
    description: string;
  }[];

  // Competition/Exam simulation
  hasCompetitionMode: boolean;
  competitionLabel: string;
  competitionDescription: string;

  // Dashboard specifics
  examReadinessLabel: string;
  studyPlanLabel: string;

  // Quick stats labels
  statsLabels: {
    streak: string;
    accuracy: string;
    xp: string;
    level: string;
  };
}

export const examConfigs: Record<ExamTypeSlug, ExamConfig> = {
  nsmq: {
    // Branding
    name: 'National Science & Maths Quiz',
    shortName: 'NSMQ',
    tagline: 'Compete. Excel. Win.',
    description: "Ghana's premier science and mathematics competition",
    targetAudience: 'SHS Students',

    // Colors
    primaryColor: '#FFD700',
    gradientFrom: 'from-amber-600',
    gradientTo: 'to-orange-700',
    accentColor: 'amber',

    // Hero section
    heroTitle: 'Train for NSMQ Victory',
    heroSubtitle: 'Master speed rounds, sharpen your reflexes, and compete like a champion.',

    // Subjects section
    subjectsTitle: 'NSMQ Subjects',
    subjectsSubtitle: 'Master the core science and mathematics subjects',

    // Practice modes
    practiceModes: [
      {
        id: 'drill',
        name: 'Topic Drill',
        description: 'Deep dive into specific topics with focused practice questions.',
        icon: Brain,
        color: 'text-primary',
        borderColor: 'border-l-primary',
        link: '/practice?mode=drill',
      },
      {
        id: 'speed',
        name: 'Speed Race',
        description: 'Race against the clock! NSMQ-style quick-fire questions.',
        icon: Zap,
        color: 'text-amber-500',
        borderColor: 'border-l-amber-500',
        link: '/practice?mode=speed',
      },
      {
        id: 'competition',
        name: 'Full Competition',
        description: 'Simulate the complete NSMQ experience with all 5 rounds.',
        icon: Trophy,
        color: 'text-orange-500',
        borderColor: 'border-l-orange-500',
        link: '/competition',
      },
    ],

    // Features
    features: [
      {
        icon: BookOpen,
        title: 'Subject Mastery',
        description: 'Comprehensive coverage of NSMQ subjects with theory and formulas',
      },
      {
        icon: Zap,
        title: 'Speed Training',
        description: 'Timed drills and speed rounds to sharpen your reflexes',
      },
      {
        icon: Trophy,
        title: 'Competition Simulation',
        description: 'Full NSMQ simulation with all 5 rounds and scoring',
      },
      {
        icon: Target,
        title: 'Performance Analytics',
        description: 'Track your speed, accuracy, and identify weak areas',
      },
    ],

    // Competition mode
    hasCompetitionMode: true,
    competitionLabel: 'Competition Mode',
    competitionDescription: 'Experience the thrill of NSMQ with full round simulations',

    // Dashboard
    examReadinessLabel: 'NSMQ Readiness',
    studyPlanLabel: 'Competition Prep Plan',

    // Stats
    statsLabels: {
      streak: 'Training Streak',
      accuracy: 'Answer Accuracy',
      xp: 'Competition XP',
      level: 'Competitor Level',
    },
  },

  wassce: {
    // Branding
    name: 'West African Senior School Certificate Examination',
    shortName: 'WASSCE',
    tagline: 'Prepare. Practice. Pass.',
    description: 'Comprehensive preparation for your SHS final exams',
    targetAudience: 'SHS Students',

    // Colors
    primaryColor: '#4F46E5',
    gradientFrom: 'from-indigo-600',
    gradientTo: 'to-purple-700',
    accentColor: 'indigo',

    // Hero section
    heroTitle: 'Ace Your WASSCE Exams',
    heroSubtitle: 'Practice with real past questions, get detailed explanations, and track your progress.',

    // Subjects section
    subjectsTitle: 'WASSCE Subjects',
    subjectsSubtitle: 'Explore all subjects across Core, Science, Business, Arts & more',

    // Practice modes
    practiceModes: [
      {
        id: 'drill',
        name: 'Topic Practice',
        description: 'Focus on specific topics with structured questions and explanations.',
        icon: Brain,
        color: 'text-primary',
        borderColor: 'border-l-primary',
        link: '/practice?mode=drill',
      },
      {
        id: 'past-papers',
        name: 'Past Papers',
        description: 'Practice with actual WASSCE past questions from previous years.',
        icon: FileText,
        color: 'text-indigo-500',
        borderColor: 'border-l-indigo-500',
        link: '/past-papers',
      },
      {
        id: 'mock',
        name: 'Mock Exams',
        description: 'Full-length timed exams simulating the real WASSCE experience.',
        icon: Clock,
        color: 'text-purple-500',
        borderColor: 'border-l-purple-500',
        link: '/mock-exams',
      },
    ],

    // Features
    features: [
      {
        icon: BookOpen,
        title: '50+ Subjects',
        description: 'Core subjects, Science, Business, Arts, Technical and Languages',
      },
      {
        icon: FileText,
        title: 'Past Questions',
        description: 'Thousands of real WASSCE questions with detailed solutions',
      },
      {
        icon: PenTool,
        title: 'Essay Practice',
        description: 'AI-powered essay grading with feedback and improvement tips',
      },
      {
        icon: Target,
        title: 'Grade Prediction',
        description: 'Track your progress and get predicted WASSCE grades',
      },
    ],

    // Competition mode
    hasCompetitionMode: false,
    competitionLabel: 'Mock Exams',
    competitionDescription: 'Take full-length timed mock exams',

    // Dashboard
    examReadinessLabel: 'WASSCE Readiness',
    studyPlanLabel: 'Exam Study Plan',

    // Stats
    statsLabels: {
      streak: 'Study Streak',
      accuracy: 'Accuracy Rate',
      xp: 'Study XP',
      level: 'Student Level',
    },
  },

  bece: {
    // Branding
    name: 'Basic Education Certificate Examination',
    shortName: 'BECE',
    tagline: 'Learn. Grow. Succeed.',
    description: 'Your pathway to Senior High School success',
    targetAudience: 'JHS Students',

    // Colors
    primaryColor: '#10B981',
    gradientFrom: 'from-emerald-600',
    gradientTo: 'to-teal-700',
    accentColor: 'emerald',

    // Hero section
    heroTitle: 'Excel in Your BECE',
    heroSubtitle: 'Master all JHS subjects with fun, interactive lessons and practice questions.',

    // Subjects section
    subjectsTitle: 'BECE Subjects',
    subjectsSubtitle: 'Practice all your JHS core and elective subjects',

    // Practice modes
    practiceModes: [
      {
        id: 'drill',
        name: 'Topic Practice',
        description: 'Learn and practice topics step by step with instant feedback.',
        icon: Brain,
        color: 'text-emerald-600',
        borderColor: 'border-l-emerald-500',
        link: '/practice?mode=drill',
      },
      {
        id: 'quiz',
        name: 'Quick Quiz',
        description: 'Test your knowledge with fun, timed quizzes on any subject.',
        icon: Zap,
        color: 'text-teal-500',
        borderColor: 'border-l-teal-500',
        link: '/practice?mode=speed',
      },
      {
        id: 'mock',
        name: 'Mock BECE',
        description: 'Practice with full BECE-style papers to prepare for exam day.',
        icon: FileText,
        color: 'text-green-600',
        borderColor: 'border-l-green-600',
        link: '/mock-exams',
      },
    ],

    // Features
    features: [
      {
        icon: BookOpen,
        title: 'All JHS Subjects',
        description: 'English, Maths, Science, Social Studies, RME, ICT and more',
      },
      {
        icon: Brain,
        title: 'Easy Explanations',
        description: 'Clear, simple explanations designed for JHS students',
      },
      {
        icon: Award,
        title: 'Earn Rewards',
        description: 'Collect points, badges and compete with classmates',
      },
      {
        icon: Users,
        title: 'Study Groups',
        description: 'Learn together with friends and classmates',
      },
    ],

    // Competition mode
    hasCompetitionMode: false,
    competitionLabel: 'Mock BECE',
    competitionDescription: 'Practice with full BECE examination papers',

    // Dashboard
    examReadinessLabel: 'BECE Readiness',
    studyPlanLabel: 'Study Plan',

    // Stats
    statsLabels: {
      streak: 'Learning Streak',
      accuracy: 'Score Rate',
      xp: 'Learning Points',
      level: 'Student Level',
    },
  },
};

// Helper function to get config for current exam type
export function getExamConfig(examType: ExamTypeSlug): ExamConfig {
  return examConfigs[examType];
}

// Get gradient class for exam type
export function getExamGradient(examType: ExamTypeSlug): string {
  const config = examConfigs[examType];
  return `${config.gradientFrom} ${config.gradientTo}`;
}

// Get icon for exam type
export function getExamIcon(examType: ExamTypeSlug): LucideIcon {
  switch (examType) {
    case 'nsmq':
      return Trophy;
    case 'wassce':
      return GraduationCap;
    case 'bece':
      return BookOpen;
    default:
      return BookOpen;
  }
}

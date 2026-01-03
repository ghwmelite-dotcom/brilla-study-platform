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

  // Dashboard customization
  dashboard: {
    // Welcome message
    welcomeTitle: string;
    welcomeSubtitle: string;

    // Hero banner
    heroBanner: {
      title: string;
      subtitle: string;
      ctaText: string;
      ctaLink: string;
      secondaryCtaText: string;
      secondaryCtaLink: string;
    };

    // Quick actions
    quickActions: {
      id: string;
      label: string;
      description: string;
      icon: LucideIcon;
      link: string;
      color: string;
      bgColor: string;
    }[];

    // Promotional flyers
    flyers: {
      id: string;
      title: string;
      description: string;
      icon: string; // emoji
      ctaText: string;
      ctaLink: string;
      gradient: string;
      textColor: string;
    }[];

    // Motivational tips
    tips: string[];

    // Featured section
    featuredTitle: string;
    featuredItems: {
      label: string;
      value: string;
      icon: LucideIcon;
      color: string;
    }[];
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

    // Dashboard
    dashboard: {
      welcomeTitle: 'Ready to Compete',
      welcomeSubtitle: 'Train hard, compete harder. Victory awaits!',

      heroBanner: {
        title: '🏆 Train Like a Champion',
        subtitle: 'Sharpen your speed, accuracy, and quick-thinking skills for the ultimate science and maths competition.',
        ctaText: 'Start Speed Drill',
        ctaLink: '/practice?mode=speed',
        secondaryCtaText: 'Competition Sim',
        secondaryCtaLink: '/competition',
      },

      quickActions: [
        {
          id: 'speed-drill',
          label: 'Speed Drill',
          description: 'Race the clock',
          icon: Zap,
          link: '/practice?mode=speed',
          color: 'text-amber-600',
          bgColor: 'bg-amber-100',
        },
        {
          id: 'competition',
          label: 'Full Competition',
          description: 'All 5 rounds',
          icon: Trophy,
          link: '/competition',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
        },
        {
          id: 'battle',
          label: '1v1 Battle',
          description: 'Challenge friends',
          icon: Users,
          link: '/battle',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
        },
        {
          id: 'leaderboard',
          label: 'Leaderboard',
          description: 'See rankings',
          icon: Award,
          link: '/leaderboard',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
        },
      ],

      flyers: [
        {
          id: 'speed-master',
          title: 'Speed Master Challenge',
          description: 'Answer 10 questions in under 60 seconds!',
          icon: '⚡',
          ctaText: 'Take Challenge',
          ctaLink: '/practice?mode=speed&challenge=speed-master',
          gradient: 'from-amber-500 to-orange-600',
          textColor: 'text-white',
        },
        {
          id: 'round-practice',
          title: 'Practice NSMQ Rounds',
          description: 'Master each round: Fundamentals, Speed Race, Problem of the Day, True/False, and Riddles.',
          icon: '🎯',
          ctaText: 'Choose Round',
          ctaLink: '/competition',
          gradient: 'from-orange-500 to-red-600',
          textColor: 'text-white',
        },
      ],

      tips: [
        'Speed is key! Practice answering within 10 seconds.',
        'Review formulas before speed rounds.',
        'Stay calm under pressure - accuracy beats speed.',
        'Practice mental math daily for faster calculations.',
        'Study with friends to simulate competition pressure.',
      ],

      featuredTitle: 'Competition Stats',
      featuredItems: [
        { label: 'Best Speed', value: '--', icon: Zap, color: 'text-amber-500' },
        { label: 'Rounds Won', value: '--', icon: Trophy, color: 'text-orange-500' },
        { label: 'Rank', value: '--', icon: Award, color: 'text-yellow-500' },
        { label: 'Win Rate', value: '--', icon: Target, color: 'text-red-500' },
      ],
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

    // Dashboard
    dashboard: {
      welcomeTitle: 'Focus on Success',
      welcomeSubtitle: 'Every question brings you closer to your A1s!',

      heroBanner: {
        title: '📚 Ace Your WASSCE',
        subtitle: 'Practice with real past questions, master each subject, and track your progress towards exam excellence.',
        ctaText: 'Practice Past Papers',
        ctaLink: '/past-papers',
        secondaryCtaText: 'Take Mock Exam',
        secondaryCtaLink: '/mock-exams',
      },

      quickActions: [
        {
          id: 'past-papers',
          label: 'Past Papers',
          description: 'Real WASSCE questions',
          icon: FileText,
          link: '/past-papers',
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100',
        },
        {
          id: 'mock-exam',
          label: 'Mock Exam',
          description: 'Timed full exam',
          icon: Clock,
          link: '/mock-exams',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
        },
        {
          id: 'essay-practice',
          label: 'Essay Practice',
          description: 'AI-graded essays',
          icon: PenTool,
          link: '/essay',
          color: 'text-pink-600',
          bgColor: 'bg-pink-100',
        },
        {
          id: 'subjects',
          label: 'All Subjects',
          description: '50+ subjects',
          icon: BookOpen,
          link: '/topics',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
        },
      ],

      flyers: [
        {
          id: 'past-questions',
          title: 'WASSCE Past Questions',
          description: 'Practice with 10+ years of past questions from all subjects. Get detailed solutions!',
          icon: '📝',
          ctaText: 'Browse Past Papers',
          ctaLink: '/past-papers',
          gradient: 'from-indigo-500 to-purple-600',
          textColor: 'text-white',
        },
        {
          id: 'essay-grading',
          title: 'AI Essay Grading',
          description: 'Write essays and get instant feedback with scoring based on WAEC marking schemes.',
          icon: '✍️',
          ctaText: 'Try Essay Practice',
          ctaLink: '/essay',
          gradient: 'from-purple-500 to-pink-600',
          textColor: 'text-white',
        },
      ],

      tips: [
        'Review past questions from the last 5 years - patterns repeat!',
        'Practice essay writing regularly for Paper 2.',
        'Focus on your weak subjects first.',
        'Time yourself during practice to build exam stamina.',
        'Read marking schemes to understand what examiners want.',
      ],

      featuredTitle: 'Exam Progress',
      featuredItems: [
        { label: 'Papers Done', value: '--', icon: FileText, color: 'text-indigo-500' },
        { label: 'Subjects', value: '--', icon: BookOpen, color: 'text-purple-500' },
        { label: 'Essays', value: '--', icon: PenTool, color: 'text-pink-500' },
        { label: 'Predicted', value: '--', icon: Target, color: 'text-blue-500' },
      ],
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

    // Dashboard
    dashboard: {
      welcomeTitle: 'Keep Learning',
      welcomeSubtitle: 'Every lesson makes you smarter! Keep going! 🌟',

      heroBanner: {
        title: '🎓 Prepare for BECE Success',
        subtitle: 'Fun quizzes, easy explanations, and rewards await! Master your JHS subjects step by step.',
        ctaText: 'Start Quick Quiz',
        ctaLink: '/practice?mode=speed',
        secondaryCtaText: 'Browse Subjects',
        secondaryCtaLink: '/topics',
      },

      quickActions: [
        {
          id: 'quick-quiz',
          label: 'Quick Quiz',
          description: 'Fun timed quiz',
          icon: Zap,
          link: '/practice?mode=speed',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-100',
        },
        {
          id: 'subjects',
          label: 'My Subjects',
          description: 'All JHS subjects',
          icon: BookOpen,
          link: '/topics',
          color: 'text-teal-600',
          bgColor: 'bg-teal-100',
        },
        {
          id: 'mock-bece',
          label: 'Mock BECE',
          description: 'Practice exams',
          icon: FileText,
          link: '/mock-exams',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
        },
        {
          id: 'badges',
          label: 'My Badges',
          description: 'View rewards',
          icon: Award,
          link: '/achievements',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
        },
      ],

      flyers: [
        {
          id: 'daily-challenge',
          title: 'Daily Learning Challenge',
          description: 'Complete 10 questions today and earn bonus points! Can you get them all right?',
          icon: '🌟',
          ctaText: 'Start Challenge',
          ctaLink: '/practice',
          gradient: 'from-emerald-500 to-teal-600',
          textColor: 'text-white',
        },
        {
          id: 'study-group',
          title: 'Study With Friends',
          description: 'Create a study group and learn together! Challenge your classmates to quizzes.',
          icon: '👥',
          ctaText: 'Find Friends',
          ctaLink: '/friends',
          gradient: 'from-teal-500 to-cyan-600',
          textColor: 'text-white',
        },
      ],

      tips: [
        'Try to learn something new every day!',
        'Don\'t worry about mistakes - they help you learn!',
        'Review what you learned yesterday before starting new topics.',
        'Ask questions when you don\'t understand something.',
        'Practice a little bit every day - it adds up!',
      ],

      featuredTitle: 'Learning Progress',
      featuredItems: [
        { label: 'Quizzes Done', value: '--', icon: Brain, color: 'text-emerald-500' },
        { label: 'Badges Earned', value: '--', icon: Award, color: 'text-yellow-500' },
        { label: 'Topics Done', value: '--', icon: BookOpen, color: 'text-teal-500' },
        { label: 'Best Score', value: '--', icon: Target, color: 'text-green-500' },
      ],
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

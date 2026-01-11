// Exam-specific configuration for dynamic dashboard and home page content
// This ensures each exam mode displays relevant, contextual information

import type { ExamTypeSlug, GhanaExamTypeSlug } from '@/types';
import { isGhanaExam } from '@/types';
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
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  Globe,
  Languages,
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

  // Quick start subjects for practice page
  quickStartSubjects: {
    slug: string;
    label: string;
    icon: LucideIcon;
    color: string;
  }[];
}

// Configuration for all exam types
// Ghana exams have full custom configs, international exams have adapted configs
export const examConfigs: Record<GhanaExamTypeSlug | 'igcse' | 'cambridge-a-level', ExamConfig> = {
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

    // Quick start subjects for practice
    quickStartSubjects: [
      { slug: 'mathematics', label: 'Math Drill', icon: Calculator, color: 'bg-blue-500' },
      { slug: 'physics', label: 'Physics Drill', icon: Atom, color: 'bg-purple-500' },
      { slug: 'chemistry', label: 'Chemistry Drill', icon: FlaskConical, color: 'bg-green-500' },
      { slug: 'biology', label: 'Biology Drill', icon: Dna, color: 'bg-amber-500' },
    ],
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

    // Quick start subjects for practice
    quickStartSubjects: [
      { slug: 'core-mathematics', label: 'Math Drill', icon: Calculator, color: 'bg-blue-500' },
      { slug: 'english-language', label: 'English Drill', icon: Languages, color: 'bg-purple-500' },
      { slug: 'physics', label: 'Physics Drill', icon: Atom, color: 'bg-indigo-500' },
      { slug: 'chemistry', label: 'Chemistry Drill', icon: FlaskConical, color: 'bg-green-500' },
    ],
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

    // Quick start subjects for practice - BECE specific
    quickStartSubjects: [
      { slug: 'mathematics', label: 'Math Drill', icon: Calculator, color: 'bg-blue-500' },
      { slug: 'english', label: 'English Drill', icon: Languages, color: 'bg-purple-500' },
      { slug: 'integrated-science', label: 'Science Drill', icon: FlaskConical, color: 'bg-green-500' },
      { slug: 'social-studies', label: 'Social Studies', icon: Globe, color: 'bg-amber-500' },
    ],
  },

  igcse: {
    // Branding
    name: 'Cambridge IGCSE',
    shortName: 'IGCSE',
    tagline: 'Excel Internationally',
    description: 'International General Certificate of Secondary Education',
    targetAudience: 'O-Level Students',

    // Colors
    primaryColor: '#0891B2',
    gradientFrom: 'from-cyan-600',
    gradientTo: 'to-teal-700',
    accentColor: 'cyan',

    // Hero section
    heroTitle: 'Master Cambridge IGCSE',
    heroSubtitle: 'Prepare for international O-Level exams with comprehensive practice and past papers.',

    // Subjects section
    subjectsTitle: 'IGCSE Subjects',
    subjectsSubtitle: 'Practice all Cambridge O-Level subjects',

    // Practice modes
    practiceModes: [
      {
        id: 'drill',
        name: 'Topic Practice',
        description: 'Master syllabus topics with focused practice questions.',
        icon: Brain,
        color: 'text-cyan-600',
        borderColor: 'border-l-cyan-500',
        link: '/practice?mode=drill',
      },
      {
        id: 'past-papers',
        name: 'Past Papers',
        description: 'Practice with Cambridge past examination papers.',
        icon: FileText,
        color: 'text-teal-500',
        borderColor: 'border-l-teal-500',
        link: '/past-papers',
      },
      {
        id: 'mock',
        name: 'Mock Exams',
        description: 'Full-length timed exams following Cambridge format.',
        icon: Clock,
        color: 'text-cyan-700',
        borderColor: 'border-l-cyan-700',
        link: '/mock-exams',
      },
    ],

    // Features
    features: [
      {
        icon: BookOpen,
        title: 'Cambridge Syllabus',
        description: 'Complete coverage of all IGCSE syllabus points',
      },
      {
        icon: FileText,
        title: 'Past Papers',
        description: 'Access Cambridge past papers with mark schemes',
      },
      {
        icon: Target,
        title: 'Grade Tracking',
        description: 'Track your progress against grade boundaries',
      },
      {
        icon: Award,
        title: 'Exam Skills',
        description: 'Learn command words and examiner expectations',
      },
    ],

    // Competition mode
    hasCompetitionMode: false,
    competitionLabel: 'Mock Exams',
    competitionDescription: 'Take full Cambridge-style mock examinations',

    // Dashboard
    examReadinessLabel: 'IGCSE Readiness',
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
      welcomeTitle: 'Excel Internationally',
      welcomeSubtitle: 'Master the Cambridge syllabus and achieve top grades!',

      heroBanner: {
        title: '🌍 Cambridge IGCSE Excellence',
        subtitle: 'Practice with past papers, master syllabus topics, and track your progress towards your target grades.',
        ctaText: 'Practice Past Papers',
        ctaLink: '/past-papers',
        secondaryCtaText: 'Topic Practice',
        secondaryCtaLink: '/practice',
      },

      quickActions: [
        {
          id: 'past-papers',
          label: 'Past Papers',
          description: 'Cambridge papers',
          icon: FileText,
          link: '/past-papers',
          color: 'text-cyan-600',
          bgColor: 'bg-cyan-100',
        },
        {
          id: 'mock-exam',
          label: 'Mock Exam',
          description: 'Timed practice',
          icon: Clock,
          link: '/mock-exams',
          color: 'text-teal-600',
          bgColor: 'bg-teal-100',
        },
        {
          id: 'topics',
          label: 'Syllabus Topics',
          description: 'By topic',
          icon: BookOpen,
          link: '/topics',
          color: 'text-cyan-700',
          bgColor: 'bg-cyan-50',
        },
        {
          id: 'progress',
          label: 'My Progress',
          description: 'Track grades',
          icon: Target,
          link: '/progress',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-100',
        },
      ],

      flyers: [
        {
          id: 'past-papers',
          title: 'Cambridge Past Papers',
          description: 'Practice with official past examination papers and mark schemes from recent sessions.',
          icon: '📝',
          ctaText: 'Browse Papers',
          ctaLink: '/past-papers',
          gradient: 'from-cyan-500 to-teal-600',
          textColor: 'text-white',
        },
        {
          id: 'grade-boundaries',
          title: 'Track Your Grades',
          description: 'See how your practice scores compare to Cambridge grade boundaries.',
          icon: '📊',
          ctaText: 'View Progress',
          ctaLink: '/progress',
          gradient: 'from-teal-500 to-emerald-600',
          textColor: 'text-white',
        },
      ],

      tips: [
        'Focus on understanding command words like "explain", "describe", and "evaluate".',
        'Practice under timed conditions to build exam stamina.',
        'Review mark schemes to understand how examiners award marks.',
        'Cover extended content for A* to A grade potential.',
        'Use past paper examiner reports to avoid common mistakes.',
      ],

      featuredTitle: 'Exam Progress',
      featuredItems: [
        { label: 'Papers Done', value: '--', icon: FileText, color: 'text-cyan-500' },
        { label: 'Topics', value: '--', icon: BookOpen, color: 'text-teal-500' },
        { label: 'Accuracy', value: '--', icon: Target, color: 'text-emerald-500' },
        { label: 'Predicted', value: '--', icon: Award, color: 'text-cyan-600' },
      ],
    },

    // Quick start subjects for practice - IGCSE specific
    quickStartSubjects: [
      { slug: 'igcse-mathematics', label: 'Mathematics', icon: Calculator, color: 'bg-cyan-500' },
      { slug: 'igcse-physics', label: 'Physics', icon: Atom, color: 'bg-teal-500' },
      { slug: 'igcse-chemistry', label: 'Chemistry', icon: FlaskConical, color: 'bg-emerald-500' },
      { slug: 'igcse-biology', label: 'Biology', icon: Dna, color: 'bg-green-500' },
    ],
  },

  'cambridge-a-level': {
    // Branding
    name: 'Cambridge A-Level',
    shortName: 'A-Level',
    tagline: 'Achieve Excellence',
    description: 'Cambridge International Advanced Level',
    targetAudience: 'Pre-University Students',

    // Colors
    primaryColor: '#7C3AED',
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-violet-700',
    accentColor: 'purple',

    // Hero section
    heroTitle: 'Excel at A-Level',
    heroSubtitle: 'Advanced preparation for university-level examinations with comprehensive practice.',

    // Subjects section
    subjectsTitle: 'A-Level Subjects',
    subjectsSubtitle: 'Master advanced subjects for university preparation',

    // Practice modes
    practiceModes: [
      {
        id: 'drill',
        name: 'Topic Practice',
        description: 'Master advanced syllabus topics with in-depth practice.',
        icon: Brain,
        color: 'text-purple-600',
        borderColor: 'border-l-purple-500',
        link: '/practice?mode=drill',
      },
      {
        id: 'past-papers',
        name: 'Past Papers',
        description: 'Practice with Cambridge A-Level past papers.',
        icon: FileText,
        color: 'text-violet-500',
        borderColor: 'border-l-violet-500',
        link: '/past-papers',
      },
      {
        id: 'mock',
        name: 'Mock Exams',
        description: 'Full A-Level examination simulations.',
        icon: Clock,
        color: 'text-purple-700',
        borderColor: 'border-l-purple-700',
        link: '/mock-exams',
      },
    ],

    // Features
    features: [
      {
        icon: BookOpen,
        title: 'Complete Syllabus',
        description: 'Full coverage of A-Level content and specifications',
      },
      {
        icon: FileText,
        title: 'Past Papers',
        description: 'Extensive A-Level past paper collection with solutions',
      },
      {
        icon: Target,
        title: 'Grade Prediction',
        description: 'Track progress against A-Level grade boundaries',
      },
      {
        icon: Award,
        title: 'University Prep',
        description: 'Develop critical thinking and analysis skills',
      },
    ],

    // Competition mode
    hasCompetitionMode: false,
    competitionLabel: 'Mock Exams',
    competitionDescription: 'Take full A-Level mock examinations',

    // Dashboard
    examReadinessLabel: 'A-Level Readiness',
    studyPlanLabel: 'A-Level Study Plan',

    // Stats
    statsLabels: {
      streak: 'Study Streak',
      accuracy: 'Accuracy Rate',
      xp: 'Study XP',
      level: 'Student Level',
    },

    // Dashboard
    dashboard: {
      welcomeTitle: 'Aim for Excellence',
      welcomeSubtitle: 'Master advanced content and achieve your university goals!',

      heroBanner: {
        title: '🎓 Cambridge A-Level Mastery',
        subtitle: 'Advanced preparation with past papers, detailed explanations, and grade tracking for university success.',
        ctaText: 'Practice Past Papers',
        ctaLink: '/past-papers',
        secondaryCtaText: 'Topic Practice',
        secondaryCtaLink: '/practice',
      },

      quickActions: [
        {
          id: 'past-papers',
          label: 'Past Papers',
          description: 'A-Level papers',
          icon: FileText,
          link: '/past-papers',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
        },
        {
          id: 'mock-exam',
          label: 'Mock Exam',
          description: 'Full exam sim',
          icon: Clock,
          link: '/mock-exams',
          color: 'text-violet-600',
          bgColor: 'bg-violet-100',
        },
        {
          id: 'topics',
          label: 'Syllabus',
          description: 'Advanced topics',
          icon: BookOpen,
          link: '/topics',
          color: 'text-purple-700',
          bgColor: 'bg-purple-50',
        },
        {
          id: 'progress',
          label: 'Progress',
          description: 'Grade tracking',
          icon: Target,
          link: '/progress',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-100',
        },
      ],

      flyers: [
        {
          id: 'past-papers',
          title: 'A-Level Past Papers',
          description: 'Practice with official Cambridge A-Level papers and mark schemes for exam excellence.',
          icon: '📚',
          ctaText: 'Browse Papers',
          ctaLink: '/past-papers',
          gradient: 'from-purple-500 to-violet-600',
          textColor: 'text-white',
        },
        {
          id: 'university-prep',
          title: 'University Preparation',
          description: 'Build the analytical skills and deep understanding required for university success.',
          icon: '🎯',
          ctaText: 'Start Practice',
          ctaLink: '/practice',
          gradient: 'from-violet-500 to-purple-600',
          textColor: 'text-white',
        },
      ],

      tips: [
        'Focus on developing analytical and evaluative skills.',
        'Practice extended response questions for higher marks.',
        'Understand the depth required for A-Level answers.',
        'Review mark schemes to see how top-band answers are structured.',
        'Connect topics to build a comprehensive understanding.',
      ],

      featuredTitle: 'A-Level Progress',
      featuredItems: [
        { label: 'Papers Done', value: '--', icon: FileText, color: 'text-purple-500' },
        { label: 'Topics', value: '--', icon: BookOpen, color: 'text-violet-500' },
        { label: 'Accuracy', value: '--', icon: Target, color: 'text-emerald-500' },
        { label: 'Predicted', value: '--', icon: Award, color: 'text-purple-600' },
      ],
    },

    // Quick start subjects for practice - A-Level specific
    quickStartSubjects: [
      { slug: 'alevel-mathematics', label: 'Mathematics', icon: Calculator, color: 'bg-purple-500' },
      { slug: 'alevel-physics', label: 'Physics', icon: Atom, color: 'bg-violet-500' },
      { slug: 'alevel-chemistry', label: 'Chemistry', icon: FlaskConical, color: 'bg-purple-600' },
      { slug: 'alevel-biology', label: 'Biology', icon: Dna, color: 'bg-emerald-500' },
    ],
  },
};

// Get config for exam type
export function getExamConfig(examType: ExamTypeSlug): ExamConfig {
  // Ghana exams
  if (isGhanaExam(examType)) {
    return examConfigs[examType];
  }

  // International exams with dedicated configs
  if (examType === 'igcse') {
    return examConfigs.igcse;
  }
  if (examType === 'cambridge-a-level') {
    return examConfigs['cambridge-a-level'];
  }

  // Other international exams (AS-Level, Edexcel) fall back to IGCSE or A-Level
  if (examType === 'cambridge-as' || examType === 'edexcel-as') {
    return examConfigs['cambridge-a-level']; // AS uses A-Level config
  }
  if (examType === 'edexcel-igcse') {
    return examConfigs.igcse; // Edexcel IGCSE uses Cambridge IGCSE config
  }
  if (examType === 'edexcel-a-level') {
    return examConfigs['cambridge-a-level']; // Edexcel A-Level uses Cambridge A-Level config
  }

  // Ultimate fallback
  return examConfigs.wassce;
}

// Get gradient class for exam type
export function getExamGradient(examType: ExamTypeSlug): string {
  // Ghana exams
  if (isGhanaExam(examType)) {
    const config = examConfigs[examType];
    return `${config.gradientFrom} ${config.gradientTo}`;
  }

  // International exams with dedicated configs
  if (examType === 'igcse' || examType === 'edexcel-igcse') {
    return `${examConfigs.igcse.gradientFrom} ${examConfigs.igcse.gradientTo}`;
  }
  if (examType === 'cambridge-a-level' || examType === 'cambridge-as' || examType === 'edexcel-a-level' || examType === 'edexcel-as') {
    return `${examConfigs['cambridge-a-level'].gradientFrom} ${examConfigs['cambridge-a-level'].gradientTo}`;
  }

  // Default fallback
  return 'from-blue-600 to-indigo-700';
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
    case 'igcse':
    case 'cambridge-as':
    case 'cambridge-a-level':
    case 'edexcel-igcse':
    case 'edexcel-as':
    case 'edexcel-a-level':
      return Globe;
    default:
      return BookOpen;
  }
}

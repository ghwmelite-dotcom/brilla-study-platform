import type { FeatureGuide, OnboardingStep, TourConfig, GuideCategory } from '@/types/guide';

// Category metadata
export const guideCategories: Record<GuideCategory, { label: string; description: string; icon: string }> = {
  'getting-started': {
    label: 'Getting Started',
    description: 'Learn the basics and set up your account',
    icon: 'Rocket',
  },
  'practice': {
    label: 'Practice & Study',
    description: 'Master different practice modes',
    icon: 'BookOpen',
  },
  'exams': {
    label: 'Exams & Papers',
    description: 'Past papers, mock exams, and essay practice',
    icon: 'FileText',
  },
  'social': {
    label: 'Community & Social',
    description: 'Connect with other students',
    icon: 'Users',
  },
  'progress': {
    label: 'Progress & Analytics',
    description: 'Track your learning journey',
    icon: 'TrendingUp',
  },
  'tools': {
    label: 'Study Tools',
    description: 'AI tutor, virtual lab, and more',
    icon: 'Wrench',
  },
  'advanced': {
    label: 'Advanced Features',
    description: 'Competition modes and more',
    icon: 'Zap',
  },
};

// Onboarding steps for new users
export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Brilla!',
    description: 'Your personal study companion for academic excellence. Let\'s take a quick tour to help you get the most out of your learning journey.',
    icon: 'Sparkles',
    features: [
      'Personalized learning paths',
      'AI-powered tutoring',
      'Real exam practice',
    ],
  },
  {
    id: 'exam-modes',
    title: 'Choose Your Exam',
    description: 'Brilla supports three major examination types. You can switch between them anytime from the sidebar.',
    icon: 'GraduationCap',
    features: [
      'WASSCE - West African Senior School Certificate',
      'BECE - Basic Education Certificate Examination',
      'NSMQ - National Science & Maths Quiz',
    ],
  },
  {
    id: 'practice',
    title: 'Practice Makes Perfect',
    description: 'Multiple practice modes to suit your learning style. From quick drills to full mock exams.',
    icon: 'Target',
    features: [
      'Topic Drills - Focused practice by topic',
      'Speed Race - Test your quick thinking',
      'Flashcards - Review key concepts',
      'Mock Exams - Full exam simulations',
    ],
  },
  {
    id: 'ai-tutor',
    title: 'Your AI Study Buddy',
    description: 'Meet Brilla AI - your personal tutor available 24/7. Ask questions, get explanations, and receive personalized study tips.',
    icon: 'Bot',
    features: [
      'Get instant explanations',
      'Ask any subject question',
      'Receive personalized study tips',
    ],
  },
  {
    id: 'progress',
    title: 'Track Your Growth',
    description: 'Watch your progress with detailed analytics. Set goals, earn achievements, and celebrate your success!',
    icon: 'TrendingUp',
    features: [
      'Daily streaks & XP points',
      'Subject mastery tracking',
      'Achievements & badges',
    ],
  },
  {
    id: 'ready',
    title: 'You\'re All Set!',
    description: 'You\'re ready to start your learning journey. Remember, consistency is key - even 15 minutes daily can make a huge difference!',
    icon: 'Rocket',
    action: {
      label: 'Start Learning',
    },
  },
];

// Feature guides for Help Center
export const featureGuides: FeatureGuide[] = [
  // Getting Started
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    description: 'Your central hub for tracking progress, viewing daily goals, and accessing quick shortcuts to all features.',
    icon: 'LayoutDashboard',
    category: 'getting-started',
    examTypes: ['all'],
    tips: [
      'Check your dashboard daily to track your streak',
      'Use the quick action cards to jump into practice',
      'Review your weak areas highlighted on the dashboard',
    ],
  },
  {
    id: 'exam-switcher',
    title: 'Switching Exam Modes',
    description: 'Learn how to switch between WASSCE, BECE, and NSMQ preparation modes. Each mode customizes the platform for that specific exam.',
    icon: 'RefreshCw',
    category: 'getting-started',
    examTypes: ['all'],
    tips: [
      'Use the exam switcher in the sidebar',
      'Your progress is tracked separately for each exam type',
      'Features automatically update based on your selected exam',
    ],
  },
  {
    id: 'profile-setup',
    title: 'Setting Up Your Profile',
    description: 'Complete your profile to get personalized recommendations and track your progress accurately.',
    icon: 'User',
    category: 'getting-started',
    examTypes: ['all'],
    tips: [
      'Add your school and year group for relevant content',
      'Join a house to participate in inter-house competitions',
      'Keep your profile updated for better recommendations',
    ],
  },

  // Practice & Study
  {
    id: 'topic-library',
    title: 'Topic Library',
    description: 'Browse all subjects and topics organized in an easy-to-navigate hierarchy. Track your mastery for each topic.',
    icon: 'Library',
    category: 'practice',
    examTypes: ['all'],
    tips: [
      'Use the search bar to quickly find topics',
      'Filter by mastery level to focus on weak areas',
      'Click any topic to start a drill immediately',
    ],
  },
  {
    id: 'topic-drill',
    title: 'Topic Drills',
    description: 'Focused practice sessions on specific topics. Get instant feedback and detailed explanations for every question.',
    icon: 'Target',
    category: 'practice',
    examTypes: ['all'],
    tips: [
      'Start with easy difficulty and progress up',
      'Read explanations even for correct answers',
      'Use the AI Tutor button for deeper explanations',
    ],
  },
  {
    id: 'speed-race',
    title: 'Speed Race Mode',
    description: 'Race against the clock! You have 10 seconds per question. Perfect for building quick-thinking skills.',
    icon: 'Zap',
    category: 'practice',
    examTypes: ['all'],
    tips: [
      'Practice mental math techniques beforehand',
      'Trust your first instinct for speed',
      'Focus on accuracy first, then build speed',
    ],
  },
  {
    id: 'flashcards',
    title: 'Flashcards',
    description: 'Review key concepts, formulas, and definitions at your own pace. Mark cards as learned or needs review.',
    icon: 'Layers',
    category: 'practice',
    examTypes: ['all'],
    tips: [
      'Review flashcards before bed for better retention',
      'Create a daily flashcard review routine',
      'Focus on cards marked as "needs review"',
    ],
  },

  // Exams & Papers
  {
    id: 'past-papers',
    title: 'Past Papers',
    description: 'Practice with real past examination papers. Includes objective, essay, and practical papers.',
    icon: 'FileText',
    category: 'exams',
    examTypes: ['wassce', 'bece'],
    tips: [
      'Start with recent years for current syllabus content',
      'Time yourself to simulate exam conditions',
      'Review the marking scheme after each paper',
    ],
  },
  {
    id: 'mock-exams',
    title: 'Mock Examinations',
    description: 'Full-length timed simulations of actual exams. Experience real exam pressure and timing.',
    icon: 'Clock',
    category: 'exams',
    examTypes: ['wassce', 'bece', 'nsmq'],
    tips: [
      'Find a quiet space with no distractions',
      'Complete the full exam in one sitting',
      'Review your performance analytics afterward',
    ],
  },
  {
    id: 'essay-practice',
    title: 'Essay Practice',
    description: 'Write essays and receive AI-powered feedback. Get graded on content, structure, grammar, and more.',
    icon: 'PenTool',
    category: 'exams',
    examTypes: ['wassce', 'bece'],
    tips: [
      'Plan your essay structure before writing',
      'Pay attention to the word limit',
      'Review the model answer after submitting',
    ],
  },

  // Social & Community
  {
    id: 'community-hub',
    title: 'Community Hub',
    description: 'Connect with fellow students, join study rooms, and learn together. Collaboration boosts learning!',
    icon: 'Users',
    category: 'social',
    examTypes: ['all'],
    tips: [
      'Join study rooms for subjects you find challenging',
      'Help others - teaching reinforces your own learning',
      'Be respectful and supportive in all interactions',
    ],
  },
  {
    id: 'study-rooms',
    title: 'Study Rooms',
    description: 'Join or create study rooms to discuss topics, share resources, and quiz each other.',
    icon: 'MessageSquare',
    category: 'social',
    examTypes: ['all'],
    tips: [
      'Create subject-specific rooms for focused discussion',
      'Schedule group study sessions in advance',
      'Share helpful resources with your room members',
    ],
  },
  {
    id: '1v1-battles',
    title: '1v1 Quiz Battles',
    description: 'Challenge other students to real-time quiz battles. Test your knowledge head-to-head!',
    icon: 'Swords',
    category: 'social',
    examTypes: ['nsmq'],
    tips: [
      'Start with friends to build confidence',
      'Review questions you got wrong after battles',
      'Challenge students at your level first, then progress',
    ],
  },
  {
    id: 'house-cup',
    title: 'House Cup Competition',
    description: 'Represent your house in inter-house competitions. Earn points through practice and achievements.',
    icon: 'Trophy',
    category: 'social',
    examTypes: ['all'],
    tips: [
      'Every question you answer correctly earns house points',
      'Check the leaderboard to see your house ranking',
      'Encourage housemates to stay active',
    ],
  },

  // Progress & Analytics
  {
    id: 'progress-analytics',
    title: 'Progress Analytics',
    description: 'Detailed charts and statistics about your learning journey. Identify strengths and areas to improve.',
    icon: 'BarChart3',
    category: 'progress',
    examTypes: ['all'],
    tips: [
      'Check your progress weekly to spot trends',
      'Focus on subjects with lowest mastery',
      'Celebrate improvements, no matter how small',
    ],
  },
  {
    id: 'achievements',
    title: 'Achievements & Badges',
    description: 'Unlock achievements as you reach milestones. Collect badges to showcase your dedication!',
    icon: 'Award',
    category: 'progress',
    examTypes: ['all'],
    tips: [
      'View all available achievements in your profile',
      'Some achievements have hidden requirements',
      'Share your achievements with friends for motivation',
    ],
  },
  {
    id: 'streaks-xp',
    title: 'Streaks & XP System',
    description: 'Maintain daily streaks and earn XP for all activities. Level up as you accumulate experience!',
    icon: 'Flame',
    category: 'progress',
    examTypes: ['all'],
    tips: [
      'Complete at least one activity daily to maintain your streak',
      'Higher difficulty questions earn more XP',
      'Check your level progress on the dashboard',
    ],
  },

  // Study Tools
  {
    id: 'ai-tutor',
    title: 'AI Tutor (Brilla AI)',
    description: 'Your personal AI study companion. Ask questions anytime and get instant, personalized explanations.',
    icon: 'Bot',
    category: 'tools',
    examTypes: ['all'],
    tips: [
      'Be specific with your questions for better answers',
      'Ask for step-by-step explanations for complex topics',
      'Use the quick action buttons for common requests',
    ],
  },
  {
    id: 'virtual-lab',
    title: 'Virtual Laboratory',
    description: 'Conduct virtual science experiments. Perfect for practicing practical exam skills without physical equipment.',
    icon: 'FlaskConical',
    category: 'tools',
    examTypes: ['wassce'],
    tips: [
      'Follow the procedure steps carefully',
      'Record all observations accurately',
      'Review the expected results before starting',
    ],
  },
  {
    id: 'subject-catalog',
    title: 'Subject Catalog',
    description: 'Browse all available subjects with detailed information about topics, question count, and your mastery.',
    icon: 'BookMarked',
    category: 'tools',
    examTypes: ['wassce', 'bece'],
    tips: [
      'Use the search to find specific subjects',
      'Filter by category to see related subjects',
      'Click on a subject to see all its topics',
    ],
  },

  // Advanced Features
  {
    id: 'competition-sim',
    title: 'NSMQ Competition Simulator',
    description: 'Experience a full NSMQ competition with all 5 rounds. Perfect for competition preparation!',
    icon: 'Trophy',
    category: 'advanced',
    examTypes: ['nsmq'],
    tips: [
      'Gather a team of 3 for authentic practice',
      'Practice each round individually first',
      'Time management is crucial in Round 2',
    ],
  },
  {
    id: 'leaderboard',
    title: 'Leaderboard & Rankings',
    description: 'See how you rank against other students. Filter by school, region, or overall.',
    icon: 'Medal',
    category: 'advanced',
    examTypes: ['all'],
    tips: [
      'Rankings update in real-time',
      'Consistent practice is key to climbing ranks',
      'Focus on learning, not just ranking',
    ],
  },
];

// Feature tours for interactive walkthroughs
export const featureTours: TourConfig[] = [
  {
    id: 'dashboard-tour',
    name: 'Dashboard Tour',
    description: 'Learn how to navigate your dashboard',
    triggerOnFirstVisit: true,
    showProgress: true,
    steps: [
      {
        id: 'welcome',
        target: '[data-tour="dashboard-header"]',
        title: 'Welcome to Your Dashboard!',
        content: 'This is your learning command center. Let\'s explore what you can do here.',
        placement: 'bottom',
      },
      {
        id: 'stats',
        target: '[data-tour="quick-stats"]',
        title: 'Your Quick Stats',
        content: 'Track your XP, streak, and level at a glance. Keep that streak going!',
        placement: 'bottom',
      },
      {
        id: 'daily-goals',
        target: '[data-tour="daily-goals"]',
        title: 'Daily Goals',
        content: 'Complete your daily goals to earn bonus XP and maintain your streak.',
        placement: 'right',
      },
      {
        id: 'quick-actions',
        target: '[data-tour="quick-actions"]',
        title: 'Quick Actions',
        content: 'Jump straight into practice with these shortcuts. Choose your preferred study mode.',
        placement: 'left',
      },
    ],
  },
  {
    id: 'practice-tour',
    name: 'Practice Modes Tour',
    description: 'Discover all the ways you can practice',
    showProgress: true,
    steps: [
      {
        id: 'practice-intro',
        target: '[data-tour="practice-page"]',
        title: 'Practice Modes',
        content: 'Multiple ways to practice and improve. Let\'s explore each mode!',
        placement: 'center',
      },
      {
        id: 'topic-drill',
        target: '[data-tour="topic-drill"]',
        title: 'Topic Drills',
        content: 'Focused practice on specific topics. Great for mastering individual concepts.',
        placement: 'bottom',
      },
      {
        id: 'speed-race',
        target: '[data-tour="speed-race"]',
        title: 'Speed Race',
        content: 'Test your quick thinking! Answer as fast as you can.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'ai-tutor-tour',
    name: 'AI Tutor Tour',
    description: 'Learn how to use Brilla AI',
    showProgress: true,
    steps: [
      {
        id: 'ai-button',
        target: '[data-tour="ai-button"]',
        title: 'Meet Brilla AI',
        content: 'Click here anytime to open your personal AI tutor.',
        placement: 'left',
      },
      {
        id: 'ai-chat',
        target: '[data-tour="ai-chat"]',
        title: 'Chat Interface',
        content: 'Type your questions here. Brilla AI can explain concepts, give study tips, and help with problems.',
        placement: 'left',
      },
      {
        id: 'quick-actions',
        target: '[data-tour="ai-quick-actions"]',
        title: 'Quick Actions',
        content: 'Use these shortcuts for common requests like explanations or study tips.',
        placement: 'top',
      },
    ],
  },
];

// Get guides filtered by exam type
export function getGuidesForExam(examType: 'wassce' | 'bece' | 'nsmq'): FeatureGuide[] {
  return featureGuides.filter(
    (guide) => guide.examTypes.includes('all') || guide.examTypes.includes(examType)
  );
}

// Get guides by category
export function getGuidesByCategory(category: GuideCategory): FeatureGuide[] {
  return featureGuides.filter((guide) => guide.category === category);
}

// Search guides
export function searchGuides(query: string, examType?: 'wassce' | 'bece' | 'nsmq'): FeatureGuide[] {
  const lowerQuery = query.toLowerCase();
  return featureGuides.filter((guide) => {
    const matchesQuery =
      guide.title.toLowerCase().includes(lowerQuery) ||
      guide.description.toLowerCase().includes(lowerQuery);
    const matchesExam =
      !examType ||
      guide.examTypes.includes('all') ||
      guide.examTypes.includes(examType);
    return matchesQuery && matchesExam;
  });
}

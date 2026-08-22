import type { FeatureGuide, OnboardingStep, TourConfig, GuideCategory } from '@/types/guide';
import type { GhanaExamTypeSlug, UserRole } from '@/types';

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
    description: 'AI tutor, E-Library, counselor, and more',
    icon: 'Wrench',
  },
  'advanced': {
    label: 'Advanced Features',
    description: 'Competition modes and more',
    icon: 'Zap',
  },
  'library': {
    label: 'E-Library',
    description: 'Digital resources and multimedia content',
    icon: 'BookOpen',
  },
  'counselor': {
    label: 'AI Counselor',
    description: 'Academic, career, and wellbeing support',
    icon: 'Heart',
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
    id: 'share-brilla',
    title: 'Lift Your Circle as You Learn',
    description: 'Every student starts as a Brilla Scout. Your personal link lets classmates join instantly and keeps your referrals and rewards together in one place.',
    icon: 'Share2',
    audience: ['student'],
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

export function getOnboardingStepsForRole(role?: UserRole): OnboardingStep[] {
  return onboardingSteps.filter((step) => !step.audience || (role ? step.audience.includes(role) : false));
}

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

  // E-Library Guides
  {
    id: 'elibrary-overview',
    title: 'E-Library Overview',
    description: 'Your digital learning hub with PDFs, videos, audio lessons, and interactive content. Access thousands of educational resources.',
    icon: 'Library',
    category: 'library',
    examTypes: ['all'],
    steps: [
      { id: '1', title: 'Navigate to E-Library', description: 'Click on "E-Library" in the sidebar to access the digital resource collection.' },
      { id: '2', title: 'Browse Resources', description: 'Explore featured resources or use filters to find specific content by subject, type, or school level.' },
      { id: '3', title: 'View a Resource', description: 'Click on any resource card to open the viewer. PDFs open in a full viewer, videos stream inline.' },
      { id: '4', title: 'Save to Collections', description: 'Click the bookmark icon to save resources to your personal collections for easy access.' },
    ],
    tips: [
      'Use the search bar to quickly find specific topics',
      'Filter by resource type (PDF, Video, Audio) for specific content',
      'Create collections to organize resources by subject or topic',
      'Check "Recently Viewed" to quickly access resources you have been studying',
    ],
  },
  {
    id: 'elibrary-resources',
    title: 'Viewing & Downloading Resources',
    description: 'Learn how to view PDFs, watch videos, listen to audio content, and download resources for offline study.',
    icon: 'FileText',
    category: 'library',
    examTypes: ['all'],
    steps: [
      { id: '1', title: 'Open a Resource', description: 'Click on any resource card to open it in the built-in viewer.' },
      { id: '2', title: 'Use Viewer Controls', description: 'For PDFs, use zoom, page navigation, and fullscreen. For videos/audio, use playback controls.' },
      { id: '3', title: 'Download if Available', description: 'If the resource is downloadable, click the download button in the viewer header.' },
      { id: '4', title: 'Track Your Progress', description: 'Your viewing progress is automatically saved, so you can resume where you left off.' },
    ],
    tips: [
      'Not all resources are downloadable - look for the download icon',
      'Use fullscreen mode for better reading experience',
      'Your progress is saved automatically - no need to worry about losing your place',
      'Rate resources to help other students find quality content',
    ],
  },
  {
    id: 'elibrary-collections',
    title: 'Managing Collections',
    description: 'Create and organize personal collections to save your favorite resources for quick access.',
    icon: 'BookMarked',
    category: 'library',
    examTypes: ['all'],
    steps: [
      { id: '1', title: 'Create a Collection', description: 'Go to Collections tab and click "New Collection". Give it a name and description.' },
      { id: '2', title: 'Add Resources', description: 'While viewing any resource, click the bookmark icon and select which collection to add it to.' },
      { id: '3', title: 'Organize Collections', description: 'View your collections, reorder resources, or remove items you no longer need.' },
      { id: '4', title: 'Share Collections', description: 'Make collections public to share study resources with classmates.' },
    ],
    tips: [
      'Create subject-specific collections for organized studying',
      'Add descriptive names to easily find collections later',
      'Use collections to create study playlists before exams',
    ],
  },
  {
    id: 'elibrary-upload',
    title: 'Uploading Resources (Teachers)',
    description: 'Teachers can upload educational materials including PDFs, videos, and audio content for students to access.',
    icon: 'PenTool',
    category: 'library',
    examTypes: ['all'],
    steps: [
      { id: '1', title: 'Click Upload Button', description: 'In the E-Library, click the "+ Upload" button (visible to teachers and admins).' },
      { id: '2', title: 'Select Resource Type', description: 'Choose the type of resource you are uploading: PDF, Video, Audio, Document, or Link.' },
      { id: '3', title: 'Add File and Details', description: 'Drag and drop your file, then fill in title, description, subject, and tags.' },
      { id: '4', title: 'Configure Options', description: 'Set school level, access level, and whether the resource can be downloaded.' },
      { id: '5', title: 'Submit Upload', description: 'Click Upload to publish the resource. It will be immediately available to students.' },
    ],
    tips: [
      'Use clear, descriptive titles that students can easily search for',
      'Add relevant tags to improve discoverability',
      'Consider making resources downloadable for offline study',
      'You can edit or delete your own uploads at any time',
    ],
  },

  // AI Counselor Guides
  {
    id: 'ai-counselor-overview',
    title: 'AI Student Counselor Overview',
    description: 'Get personalized support from AI counselors specialized in academics, career guidance, and student wellbeing.',
    icon: 'Heart',
    category: 'counselor',
    examTypes: ['all'],
    steps: [
      { id: '1', title: 'Access the Counselor', description: 'Click "AI Counselor" in the sidebar or the floating button on any page.' },
      { id: '2', title: 'Choose Counselor Type', description: 'Select from Academic, Career, or Wellbeing counselor based on your needs.' },
      { id: '3', title: 'Start a Conversation', description: 'Type your question or concern, or use the quick action buttons for common topics.' },
      { id: '4', title: 'Continue Conversations', description: 'Your conversation history is saved. Return anytime to continue where you left off.' },
    ],
    tips: [
      'Be specific about your concerns for more helpful advice',
      'The counselor remembers your previous conversations',
      'Use different counselor types for different types of questions',
      'Provide feedback on responses to help improve the service',
    ],
  },
  {
    id: 'academic-counselor',
    title: 'Academic Counselor',
    description: 'Get study tips, subject selection advice, exam preparation strategies, and help with academic challenges.',
    icon: 'GraduationCap',
    category: 'counselor',
    examTypes: ['all'],
    tips: [
      'Ask for help creating a study schedule before exams',
      'Get advice on which subjects to focus on based on your goals',
      'Request explanations for difficult concepts you are struggling with',
      'Ask for study techniques tailored to your learning style',
      'Get recommendations for balancing multiple subjects',
    ],
    relatedFeatures: ['ai-tutor', 'progress-analytics'],
  },
  {
    id: 'career-counselor',
    title: 'Career Counselor',
    description: 'Explore career paths in STEM and other fields, get university guidance, and plan your future.',
    icon: 'TrendingUp',
    category: 'counselor',
    examTypes: ['all'],
    tips: [
      'Describe your interests and strengths for personalized career suggestions',
      'Ask about required qualifications for specific careers',
      'Get information about universities and programs in Ghana and abroad',
      'Explore scholarship opportunities and how to apply',
      'Learn about emerging careers and future job market trends',
    ],
  },
  {
    id: 'wellbeing-counselor',
    title: 'Wellbeing Counselor',
    description: 'Support for managing stress, maintaining motivation, and balancing study with life.',
    icon: 'Heart',
    category: 'counselor',
    examTypes: ['all'],
    tips: [
      'Share how you are feeling without judgment',
      'Ask for stress management techniques before exams',
      'Get advice on maintaining motivation during challenging times',
      'Learn about healthy study habits and work-life balance',
      'Remember: the counselor will recommend professional help when appropriate',
    ],
  },

  // Additional Progress & Analytics Guides
  {
    id: 'daily-quests',
    title: 'Daily Quests System',
    description: 'Complete daily challenges to earn XP, maintain streaks, and unlock rewards.',
    icon: 'Calendar',
    category: 'progress',
    examTypes: ['all'],
    steps: [
      { id: '1', title: 'View Daily Quests', description: 'Check your dashboard to see today\'s quests and their rewards.' },
      { id: '2', title: 'Complete Activities', description: 'Practice questions, use the AI Tutor, or complete assessments to progress quests.' },
      { id: '3', title: 'Claim Rewards', description: 'Once a quest is complete, claim your XP reward.' },
      { id: '4', title: 'Keep Your Streak', description: 'Complete at least one quest daily to maintain your streak.' },
    ],
    tips: [
      'Quests reset at midnight - complete them before then',
      'Some quests give bonus XP - prioritize these',
      'Completing all daily quests gives a bonus reward',
      'Quests get progressively harder as you level up',
    ],
  },
  {
    id: 'streak-system',
    title: 'Streaks & Streak Protection',
    description: 'Build study habits with daily streaks. Use streak freezes to protect your progress when you cannot study.',
    icon: 'Flame',
    category: 'progress',
    examTypes: ['all'],
    steps: [
      { id: '1', title: 'Start Your Streak', description: 'Complete any practice activity to start your streak counter.' },
      { id: '2', title: 'Maintain Daily', description: 'Practice every day to keep your streak growing.' },
      { id: '3', title: 'Use Streak Freeze', description: 'If you will miss a day, activate a streak freeze in Settings beforehand.' },
      { id: '4', title: 'Watch for Warnings', description: 'You will get notifications when your streak is at risk.' },
    ],
    tips: [
      'Even 5 minutes of practice counts toward your streak',
      'You earn streak freezes through achievements and long streaks',
      'Longer streaks unlock special achievements and badges',
      'Set a daily reminder to never miss your streak',
    ],
    relatedFeatures: ['daily-quests', 'achievements'],
  },
  {
    id: 'xp-levels',
    title: 'XP & Level System',
    description: 'Earn experience points through all activities. Level up to unlock features and show your dedication.',
    icon: 'Award',
    category: 'progress',
    examTypes: ['all'],
    tips: [
      'Correct answers earn 10 XP each',
      'Higher difficulty questions earn more XP',
      'Winning battles gives 100 XP bonus',
      'Daily streaks provide XP multipliers',
      'Level milestones unlock special achievements',
    ],
  },

  // Parent & Teacher Guides
  {
    id: 'parent-dashboard',
    title: 'Parent Dashboard',
    description: 'Parents can monitor their children\'s progress, view reports, and stay connected with their learning journey.',
    icon: 'Shield',
    category: 'tools',
    examTypes: ['all'],
    steps: [
      { id: '1', title: 'Link to Child', description: 'Send a link request to your child\'s account. They will need to approve it.' },
      { id: '2', title: 'View Progress', description: 'See your child\'s daily activity, streak status, and performance metrics.' },
      { id: '3', title: 'Access Reports', description: 'View weekly and monthly progress reports with detailed analytics.' },
      { id: '4', title: 'Set Notifications', description: 'Configure alerts for low activity, achievements, or performance changes.' },
    ],
    tips: [
      'Check the dashboard weekly to stay informed',
      'Celebrate achievements with your child to encourage them',
      'Use the reports to identify areas where extra support may be needed',
      'Set up notifications to receive important updates',
    ],
  },
  {
    id: 'teacher-class-management',
    title: 'Class Management (Teachers)',
    description: 'Create classes, enroll students, track performance, and manage assignments all in one place.',
    icon: 'Users',
    category: 'tools',
    examTypes: ['all'],
    steps: [
      { id: '1', title: 'Create a Class', description: 'Go to Teacher Dashboard and click "Create Class". Set the name, subject, and grade level.' },
      { id: '2', title: 'Add Students', description: 'Invite students by sharing a class code or adding them by email.' },
      { id: '3', title: 'Create Assessments', description: 'Use the Assessment Builder to create quizzes and tests for your class.' },
      { id: '4', title: 'Monitor Progress', description: 'View class analytics to see overall and individual student performance.' },
    ],
    tips: [
      'Use class groups to organize students by ability or focus area',
      'Schedule assessments in advance for automatic distribution',
      'Export reports for parent-teacher meetings',
      'Upload resources to E-Library for your students to access',
    ],
  },
  {
    id: 'assessment-builder',
    title: 'Assessment Builder (Teachers)',
    description: 'Create custom quizzes, tests, and assignments with various question types and automatic grading.',
    icon: 'PenTool',
    category: 'tools',
    examTypes: ['all'],
    steps: [
      { id: '1', title: 'Start New Assessment', description: 'Click "Create Assessment" and choose the type (quiz, test, assignment).' },
      { id: '2', title: 'Add Questions', description: 'Add questions from the question bank or create custom questions.' },
      { id: '3', title: 'Configure Settings', description: 'Set time limits, passing score, randomization, and availability dates.' },
      { id: '4', title: 'Assign to Class', description: 'Select which classes or students should receive the assessment.' },
      { id: '5', title: 'Review Results', description: 'After submission, view individual and aggregate results with analytics.' },
    ],
    tips: [
      'Mix question types for comprehensive assessment',
      'Use the question bank to save time',
      'Enable shuffling to prevent cheating',
      'Set clear instructions and time expectations',
    ],
  },
  {
    id: 'study-reminders',
    title: 'Study Reminders',
    description: 'Set up personalized reminders to maintain consistent study habits and never miss your streak.',
    icon: 'Bell',
    category: 'tools',
    examTypes: ['all'],
    steps: [
      { id: '1', title: 'Go to Settings', description: 'Navigate to Settings > Notifications > Study Reminders.' },
      { id: '2', title: 'Set Reminder Time', description: 'Choose what time you want to be reminded to study each day.' },
      { id: '3', title: 'Choose Days', description: 'Select which days of the week you want reminders.' },
      { id: '4', title: 'Enable Notifications', description: 'Make sure browser/device notifications are enabled.' },
    ],
    tips: [
      'Set reminders for when you typically have free time',
      'Morning reminders help start the day productively',
      'Evening reminders work well before your streak deadline',
      'Adjust reminder times based on your schedule',
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
export function getGuidesForExam(examType: GhanaExamTypeSlug): FeatureGuide[] {
  return featureGuides.filter(
    (guide) => guide.examTypes.includes('all') || guide.examTypes.includes(examType)
  );
}

// Get guides by category
export function getGuidesByCategory(category: GuideCategory): FeatureGuide[] {
  return featureGuides.filter((guide) => guide.category === category);
}

// Search guides
export function searchGuides(query: string, examType?: GhanaExamTypeSlug): FeatureGuide[] {
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

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExamTypeSlug } from '@/types';

// Types for the AI Revision Classroom
export type RevisionSessionType = 'full_revision' | 'topic_review' | 'quick_recap' | 'exam_prep';
export type RevisionSessionStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export type LessonType = 'concept' | 'example' | 'practice' | 'assessment';
export type LessonStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'mastered';
export type CheckpointType = 'quick_check' | 'concept_check' | 'application' | 'exam_style';

export interface RevisionSession {
  id: string;
  userId: string;
  examType: ExamTypeSlug;
  subjectId: string;
  subjectName: string;
  topicId?: string;
  topicName?: string;
  sessionType: RevisionSessionType;
  status: RevisionSessionStatus;
  progressPercentage: number;
  currentLessonId?: string;
  lessonsCompleted: number;
  totalLessons: number;
  masteryScore: number;
  timeSpentMinutes: number;
  startedAt: string;
  lastActivityAt: string;
  completedAt?: string;
}

export interface RevisionLesson {
  id: string;
  sessionId: string;
  topicId: string;
  topicName: string;
  lessonOrder: number;
  title: string;
  description: string;
  lessonType: LessonType;
  status: LessonStatus;

  // AI Teaching Content
  hookContent?: string;
  explanationContent?: string;
  visualAids?: string[];
  examples?: WorkedExample[];
  keyPoints?: string[];

  // Student Progress
  understandingLevel: number; // 0-5
  questionsAttempted: number;
  questionsCorrect: number;
  timeSpentSeconds: number;

  startedAt?: string;
  completedAt?: string;
}

export interface WorkedExample {
  title: string;
  problem: string;
  steps: string[];
  solution: string;
  explanation: string;
}

export interface TopicMastery {
  id: string;
  userId: string;
  topicId: string;
  topicName: string;
  examType: ExamTypeSlug;
  masteryLevel: number;
  confidenceLevel: ConfidenceLevel;
  lessonsCompleted: number;
  practiceQuestionsAttempted: number;
  practiceQuestionsCorrect: number;
  revisionCount: number;
  lastRevisedAt?: string;
  nextRevisionDue?: string;
  examBoardTips?: string[];
  commonMistakes?: string[];
  highYieldPoints?: string[];
  improvementPercentage: number;
}

export interface RevisionCheckpoint {
  id: string;
  lessonId: string;
  checkpointType: CheckpointType;
  questionText: string;
  questionType: 'multiple_choice' | 'short_answer' | 'true_false' | 'fill_blank';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface CheckpointResponse {
  id: string;
  checkpointId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeTakenSeconds: number;
  aiFeedback?: string;
}

export interface RevisionAIMessage {
  id: string;
  lessonId: string;
  interactionType: 'teaching' | 'question' | 'clarification' | 'encouragement' | 'summary';
  aiMessage: string;
  userResponse?: string;
  timestamp: string;
}

// Teaching phases in a lesson
export type TeachingPhase = 'hook' | 'explain' | 'check' | 'practice' | 'confirm' | 'connect';

// AI Teaching State
export interface AITeachingState {
  isTeaching: boolean;
  currentPhase: TeachingPhase;
  currentMessage: string;
  isThinking: boolean;
  awaitingResponse: boolean;
}

interface RevisionClassroomState {
  // Sessions
  currentSession: RevisionSession | null;
  pastSessions: RevisionSession[];

  // Current Lesson
  currentLesson: RevisionLesson | null;
  lessonPlan: RevisionLesson[];

  // Topic Mastery
  topicMasteries: Record<string, TopicMastery>;

  // Checkpoints & Responses
  currentCheckpoints: RevisionCheckpoint[];
  checkpointResponses: CheckpointResponse[];

  // AI Teaching
  aiTeachingState: AITeachingState;
  aiMessages: RevisionAIMessage[];

  // UI State
  isLoading: boolean;
  error: string | null;

  // Actions - Sessions
  startRevisionSession: (
    userId: string,
    examType: ExamTypeSlug,
    subjectId: string,
    subjectName: string,
    sessionType?: RevisionSessionType,
    topicId?: string,
    topicName?: string
  ) => Promise<void>;
  resumeSession: (sessionId: string) => Promise<void>;
  pauseSession: () => Promise<void>;
  completeSession: () => Promise<void>;
  abandonSession: () => Promise<void>;

  // Actions - Lessons
  startLesson: (lessonId: string) => Promise<void>;
  completeLesson: () => Promise<void>;
  skipLesson: () => Promise<void>;
  nextLesson: () => Promise<void>;

  // Actions - AI Teaching
  requestAITeaching: (phase: TeachingPhase) => Promise<void>;
  respondToAI: (response: string) => Promise<void>;
  askQuestion: (question: string) => Promise<void>;
  requestClarification: (topic: string) => Promise<void>;

  // Actions - Checkpoints
  answerCheckpoint: (checkpointId: string, answer: string) => Promise<CheckpointResponse>;
  generateMorePractice: () => Promise<void>;

  // Actions - Topic Mastery
  updateTopicMastery: (topicId: string, updates: Partial<TopicMastery>) => void;
  getTopicMastery: (topicId: string) => TopicMastery | undefined;

  // Actions - Utility
  fetchPastSessions: (userId: string) => Promise<void>;
  clearError: () => void;
  resetClassroom: () => void;
}

// Helper to generate unique IDs
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Mock lesson content generator for different topics
function generateLessonPlan(
  sessionId: string,
  subjectId: string,
  subjectName: string,
  examType: ExamTypeSlug,
  topicId?: string
): RevisionLesson[] {
  // Define topic structures by subject
  const subjectTopics: Record<string, { id: string; name: string; order: number }[]> = {
    // IGCSE/A-Level Mathematics topics
    'subj_igcse_math': [
      { id: 'number', name: 'Number', order: 1 },
      { id: 'algebra', name: 'Algebra and Graphs', order: 2 },
      { id: 'coordinate_geometry', name: 'Coordinate Geometry', order: 3 },
      { id: 'geometry', name: 'Geometry', order: 4 },
      { id: 'mensuration', name: 'Mensuration', order: 5 },
      { id: 'trigonometry', name: 'Trigonometry', order: 6 },
      { id: 'vectors', name: 'Vectors and Transformations', order: 7 },
      { id: 'probability', name: 'Probability', order: 8 },
      { id: 'statistics', name: 'Statistics', order: 9 },
    ],
    'subj_igcse_add_math': [
      { id: 'functions', name: 'Functions', order: 1 },
      { id: 'quadratics', name: 'Quadratic Functions', order: 2 },
      { id: 'indices_surds', name: 'Indices and Surds', order: 3 },
      { id: 'factors_polynomials', name: 'Factors of Polynomials', order: 4 },
      { id: 'simultaneous', name: 'Simultaneous Equations', order: 5 },
      { id: 'logarithms', name: 'Logarithmic Functions', order: 6 },
      { id: 'straight_line', name: 'Straight Line Graphs', order: 7 },
      { id: 'circular_measure', name: 'Circular Measure', order: 8 },
      { id: 'trigonometry', name: 'Trigonometry', order: 9 },
      { id: 'permutations', name: 'Permutations and Combinations', order: 10 },
      { id: 'binomial', name: 'Binomial Theorem', order: 11 },
      { id: 'differentiation', name: 'Differentiation', order: 12 },
      { id: 'integration', name: 'Integration', order: 13 },
    ],
    'subj_alevel_math': [
      { id: 'pure_algebra', name: 'Pure Mathematics - Algebra', order: 1 },
      { id: 'pure_functions', name: 'Pure Mathematics - Functions', order: 2 },
      { id: 'pure_coord_geom', name: 'Pure Mathematics - Coordinate Geometry', order: 3 },
      { id: 'pure_sequences', name: 'Pure Mathematics - Sequences and Series', order: 4 },
      { id: 'pure_trig', name: 'Pure Mathematics - Trigonometry', order: 5 },
      { id: 'pure_differentiation', name: 'Pure Mathematics - Differentiation', order: 6 },
      { id: 'pure_integration', name: 'Pure Mathematics - Integration', order: 7 },
      { id: 'pure_diff_eq', name: 'Pure Mathematics - Differential Equations', order: 8 },
      { id: 'pure_vectors', name: 'Pure Mathematics - Vectors', order: 9 },
      { id: 'mechanics', name: 'Mechanics', order: 10 },
      { id: 'statistics', name: 'Probability and Statistics', order: 11 },
    ],
    'subj_alevel_further_math': [
      { id: 'complex_numbers', name: 'Complex Numbers', order: 1 },
      { id: 'matrices', name: 'Matrices', order: 2 },
      { id: 'roots_polynomials', name: 'Roots of Polynomials', order: 3 },
      { id: 'series', name: 'Series', order: 4 },
      { id: 'proof', name: 'Proof', order: 5 },
      { id: 'polar_coordinates', name: 'Polar Coordinates', order: 6 },
      { id: 'hyperbolic', name: 'Hyperbolic Functions', order: 7 },
      { id: 'further_calc', name: 'Further Calculus', order: 8 },
      { id: 'further_diff_eq', name: 'Further Differential Equations', order: 9 },
      { id: 'further_mechanics', name: 'Further Mechanics', order: 10 },
      { id: 'further_statistics', name: 'Further Statistics', order: 11 },
    ],
    // Physics
    'subj_igcse_physics': [
      { id: 'measurements', name: 'General Physics', order: 1 },
      { id: 'kinematics', name: 'Motion', order: 2 },
      { id: 'forces', name: 'Forces', order: 3 },
      { id: 'momentum', name: 'Momentum', order: 4 },
      { id: 'energy', name: 'Energy, Work and Power', order: 5 },
      { id: 'thermal', name: 'Thermal Physics', order: 6 },
      { id: 'waves', name: 'Waves', order: 7 },
      { id: 'light', name: 'Light', order: 8 },
      { id: 'sound', name: 'Sound', order: 9 },
      { id: 'magnetism', name: 'Magnetism', order: 10 },
      { id: 'electricity', name: 'Electricity', order: 11 },
      { id: 'em_induction', name: 'Electromagnetic Induction', order: 12 },
      { id: 'nuclear', name: 'Nuclear Physics', order: 13 },
    ],
    'subj_alevel_physics': [
      { id: 'physical_quantities', name: 'Physical Quantities and Units', order: 1 },
      { id: 'kinematics', name: 'Kinematics', order: 2 },
      { id: 'dynamics', name: 'Dynamics', order: 3 },
      { id: 'forces_equilibrium', name: 'Forces, Density and Pressure', order: 4 },
      { id: 'work_energy', name: 'Work, Energy and Power', order: 5 },
      { id: 'deformation', name: 'Deformation of Solids', order: 6 },
      { id: 'waves', name: 'Waves', order: 7 },
      { id: 'superposition', name: 'Superposition', order: 8 },
      { id: 'current_electricity', name: 'Current Electricity', order: 9 },
      { id: 'dc_circuits', name: 'D.C. Circuits', order: 10 },
      { id: 'particle_nuclear', name: 'Particle and Nuclear Physics', order: 11 },
    ],
    // Chemistry
    'subj_igcse_chemistry': [
      { id: 'states_matter', name: 'States of Matter', order: 1 },
      { id: 'atomic_structure', name: 'Atomic Structure', order: 2 },
      { id: 'bonding', name: 'Chemical Bonding', order: 3 },
      { id: 'stoichiometry', name: 'Stoichiometry', order: 4 },
      { id: 'electrochemistry', name: 'Electrochemistry', order: 5 },
      { id: 'energy_changes', name: 'Chemical Energetics', order: 6 },
      { id: 'reaction_rates', name: 'Chemical Reactions', order: 7 },
      { id: 'acids_bases', name: 'Acids, Bases and Salts', order: 8 },
      { id: 'periodic_table', name: 'The Periodic Table', order: 9 },
      { id: 'metals', name: 'Metals', order: 10 },
      { id: 'air_water', name: 'Air and Water', order: 11 },
      { id: 'organic', name: 'Organic Chemistry', order: 12 },
    ],
    'subj_alevel_chemistry': [
      { id: 'atoms_molecules', name: 'Atoms, Molecules and Stoichiometry', order: 1 },
      { id: 'atomic_structure', name: 'Atomic Structure', order: 2 },
      { id: 'chemical_bonding', name: 'Chemical Bonding', order: 3 },
      { id: 'states_matter', name: 'States of Matter', order: 4 },
      { id: 'energetics', name: 'Chemical Energetics', order: 5 },
      { id: 'electrochemistry', name: 'Electrochemistry', order: 6 },
      { id: 'equilibria', name: 'Equilibria', order: 7 },
      { id: 'reaction_kinetics', name: 'Reaction Kinetics', order: 8 },
      { id: 'periodicity', name: 'The Periodic Table: Chemical Periodicity', order: 9 },
      { id: 'group_2', name: 'Group 2', order: 10 },
      { id: 'group_17', name: 'Group 17', order: 11 },
      { id: 'nitrogen_sulfur', name: 'Nitrogen and Sulfur', order: 12 },
      { id: 'intro_organic', name: 'Introduction to Organic Chemistry', order: 13 },
      { id: 'hydrocarbons', name: 'Hydrocarbons', order: 14 },
      { id: 'halogen_compounds', name: 'Halogen Compounds', order: 15 },
      { id: 'hydroxy_compounds', name: 'Hydroxy Compounds', order: 16 },
    ],
    // Biology
    'subj_igcse_biology': [
      { id: 'characteristics', name: 'Characteristics of Living Organisms', order: 1 },
      { id: 'cells', name: 'Cells', order: 2 },
      { id: 'enzymes', name: 'Enzymes', order: 3 },
      { id: 'nutrition', name: 'Nutrition', order: 4 },
      { id: 'transportation', name: 'Transport in Plants and Animals', order: 5 },
      { id: 'respiration', name: 'Respiration', order: 6 },
      { id: 'coordination', name: 'Coordination and Response', order: 7 },
      { id: 'reproduction', name: 'Reproduction', order: 8 },
      { id: 'inheritance', name: 'Inheritance', order: 9 },
      { id: 'ecology', name: 'Ecology', order: 10 },
    ],
    'subj_alevel_biology': [
      { id: 'cell_structure', name: 'Cell Structure', order: 1 },
      { id: 'biological_molecules', name: 'Biological Molecules', order: 2 },
      { id: 'enzymes', name: 'Enzymes', order: 3 },
      { id: 'cell_membranes', name: 'Cell Membranes and Transport', order: 4 },
      { id: 'cell_cycle', name: 'The Mitotic Cell Cycle', order: 5 },
      { id: 'nucleic_acids', name: 'Nucleic Acids and Protein Synthesis', order: 6 },
      { id: 'gas_exchange', name: 'Transport in Plants and Gas Exchange', order: 7 },
      { id: 'circulation', name: 'Transport in Mammals', order: 8 },
      { id: 'infectious_disease', name: 'Infectious Disease', order: 9 },
      { id: 'immunity', name: 'Immunity', order: 10 },
    ],
    // WASSCE Subjects
    'subj_wassce_core_math': [
      { id: 'number_numeration', name: 'Number and Numeration', order: 1 },
      { id: 'algebraic_processes', name: 'Algebraic Processes', order: 2 },
      { id: 'mensuration', name: 'Mensuration', order: 3 },
      { id: 'plane_geometry', name: 'Plane Geometry', order: 4 },
      { id: 'statistics_probability', name: 'Statistics and Probability', order: 5 },
      { id: 'trigonometry', name: 'Trigonometry', order: 6 },
      { id: 'vectors_transformation', name: 'Vectors and Transformation', order: 7 },
    ],
    'subj_wassce_physics': [
      { id: 'measurements', name: 'Measurements and Units', order: 1 },
      { id: 'scalars_vectors', name: 'Scalars and Vectors', order: 2 },
      { id: 'motion', name: 'Motion', order: 3 },
      { id: 'equilibrium_forces', name: 'Equilibrium of Forces', order: 4 },
      { id: 'work_energy_power', name: 'Work, Energy and Power', order: 5 },
      { id: 'pressure', name: 'Pressure', order: 6 },
      { id: 'heat_energy', name: 'Heat Energy', order: 7 },
      { id: 'waves', name: 'Waves', order: 8 },
      { id: 'light', name: 'Light', order: 9 },
      { id: 'sound', name: 'Sound', order: 10 },
      { id: 'fields', name: 'Fields', order: 11 },
      { id: 'electricity', name: 'Electricity', order: 12 },
      { id: 'modern_physics', name: 'Modern Physics', order: 13 },
    ],
    // BECE Subjects
    'subj_bece_math': [
      { id: 'numbers', name: 'Numbers and Numeration', order: 1 },
      { id: 'fractions_decimals', name: 'Fractions and Decimals', order: 2 },
      { id: 'percentages', name: 'Percentages', order: 3 },
      { id: 'ratio_proportion', name: 'Ratio and Proportion', order: 4 },
      { id: 'basic_algebra', name: 'Basic Algebra', order: 5 },
      { id: 'shape_space', name: 'Shape and Space', order: 6 },
      { id: 'measurement', name: 'Measurement', order: 7 },
      { id: 'data_handling', name: 'Data Handling', order: 8 },
    ],
    'subj_bece_science': [
      { id: 'living_nonliving', name: 'Living and Non-Living Things', order: 1 },
      { id: 'human_body', name: 'The Human Body', order: 2 },
      { id: 'plants', name: 'Plants', order: 3 },
      { id: 'matter', name: 'Matter', order: 4 },
      { id: 'energy', name: 'Energy', order: 5 },
      { id: 'force_motion', name: 'Force and Motion', order: 6 },
      { id: 'electricity', name: 'Electricity', order: 7 },
      { id: 'environment', name: 'The Environment', order: 8 },
    ],
  };

  // Get topics for this subject, or use default
  const topics = subjectTopics[subjectId] || [
    { id: 'topic_1', name: 'Introduction', order: 1 },
    { id: 'topic_2', name: 'Core Concepts', order: 2 },
    { id: 'topic_3', name: 'Advanced Topics', order: 3 },
    { id: 'topic_4', name: 'Practice & Application', order: 4 },
  ];

  // Filter to specific topic if provided
  const filteredTopics = topicId
    ? topics.filter(t => t.id === topicId)
    : topics;

  // Generate lessons for each topic
  return filteredTopics.map((topic, index) => ({
    id: generateId('lesson'),
    sessionId,
    topicId: topic.id,
    topicName: topic.name,
    lessonOrder: index + 1,
    title: `${topic.name} - Complete Revision`,
    description: `Master ${topic.name} for ${subjectName} in your ${examType.toUpperCase()} exam`,
    lessonType: 'concept' as LessonType,
    status: index === 0 ? 'pending' : 'pending' as LessonStatus,
    understandingLevel: 0,
    questionsAttempted: 0,
    questionsCorrect: 0,
    timeSpentSeconds: 0,
  }));
}

// Generate AI teaching content for a lesson
async function generateAITeachingContent(
  lesson: RevisionLesson,
  phase: TeachingPhase,
  examType: ExamTypeSlug,
  userName?: string
): Promise<string> {
  const greeting = userName ? `${userName}, ` : '';

  // Generate content based on phase
  switch (phase) {
    case 'hook':
      return `${greeting}let me share something fascinating about ${lesson.topicName}!

Have you ever wondered why this topic is so important? In your ${examType.toUpperCase()} exam, ${lesson.topicName} questions can appear in multiple forms and are worth significant marks.

Here's a real-world connection: ${getTopicHook(lesson.topicName)}

Ready to dive in and master this topic? Let's make sure you understand it so well that exam questions feel easy!`;

    case 'explain':
      return `Now let me explain ${lesson.topicName} step by step.

**Key Concept:**
${getTopicExplanation(lesson.topicName)}

**Important Points to Remember:**
${getKeyPoints(lesson.topicName)}

Take a moment to read through this. When you're ready, let me know and I'll check your understanding with a quick question.`;

    case 'check':
      return `${greeting}let's check your understanding with a quick question.

Don't worry if you're not sure - this is just to see what you've grasped so far. I'll explain anything you find tricky.

Ready? Here's your question...`;

    case 'practice':
      return `Excellent! Now let's put your knowledge into practice.

**Practice Problem:**
${getPracticeProblem(lesson.topicName)}

Take your time to work through this. Remember the key concepts we covered:
${getKeyReminders(lesson.topicName)}

When you're ready, share your answer and I'll walk through the solution with you.`;

    case 'confirm':
      return `${greeting}you're making great progress! Let me summarize what we've covered:

**${lesson.topicName} - Key Takeaways:**
${getSummary(lesson.topicName)}

**Exam Tips:**
${getExamTips(lesson.topicName, examType)}

Do you have any questions before we move on? I'm here to clarify anything.`;

    case 'connect':
      return `Before we finish ${lesson.topicName}, let's see how it connects to other topics:

${getTopicConnections(lesson.topicName)}

This interconnected understanding will help you tackle complex exam questions that combine multiple concepts.

Well done on completing this revision! You're one step closer to exam success.`;

    default:
      return `Let's continue with ${lesson.topicName}...`;
  }
}

// Helper functions for generating topic-specific content
function getTopicHook(topicName: string): string {
  const hooks: Record<string, string> = {
    'Algebra and Graphs': 'Every time you use Google Maps to find the fastest route, algebra is working behind the scenes calculating optimal paths!',
    'Trigonometry': 'The Pyramids of Giza were built using trigonometric principles over 4,500 years ago - and the same math helps modern architects today!',
    'Quadratic Functions': 'The curved path of a football when kicked, or water from a fountain - these are all quadratic curves in action!',
    'Differentiation': 'Self-driving cars use calculus every millisecond to calculate speed changes and make safe decisions!',
    'Cells': 'Your body contains about 37.2 trillion cells - and each one is more complex than any computer ever built!',
    'Chemical Bonding': 'The reason water is liquid at room temperature while carbon dioxide is a gas comes down to the type of bonds between their atoms!',
    'Motion': 'Usain Bolt\'s 100m world record can be fully described using the equations we\'re about to learn!',
    'Electricity': 'The phone or computer you\'re using right now runs on principles discovered over 200 years ago!',
  };
  return hooks[topicName] || `This topic appears frequently in exams and is essential for understanding advanced concepts.`;
}

function getTopicExplanation(topicName: string): string {
  // In production, this would come from the API with full explanations
  return `${topicName} is a fundamental concept that forms the foundation for many exam questions. Understanding it deeply will help you solve problems confidently.

The core idea is to understand the underlying principles and how to apply them systematically.`;
}

function getKeyPoints(_topicName: string): string {
  return `1. Understand the definitions and key terms
2. Know the formulas and when to apply them
3. Practice identifying which method to use
4. Check your work using different approaches
5. Connect to related topics for deeper understanding`;
}

function getPracticeProblem(_topicName: string): string {
  return `Try applying what you've learned to this scenario. Think about which concepts apply and show your working clearly.`;
}

function getKeyReminders(_topicName: string): string {
  return `- Read the question carefully
- Identify what's being asked
- Show all your working
- Check your units
- Review your answer`;
}

function getSummary(_topicName: string): string {
  return `1. We covered the core concepts and definitions
2. You learned the key formulas and methods
3. You practiced applying these to problems
4. You now understand common exam question styles`;
}

function getExamTips(_topicName: string, examType: ExamTypeSlug): string {
  const examSpecificTips: Record<string, string> = {
    'igcse': `- This topic typically appears in Paper 2 and Paper 4
- Show all working to earn method marks
- Common mistakes: rushing calculations, not reading questions carefully`,
    'cambridge_a2': `- Often combined with other topics in longer questions
- Precision and mathematical rigor are essential
- Practice past paper questions from the last 5 years`,
    'wassce': `- Usually 2-3 questions on this topic
- Theory and practical application both tested
- WAEC often repeats question styles - practice past papers!`,
    'bece': `- Focus on fundamental understanding
- Questions test basic concepts clearly
- Time management is key - don't spend too long on one question`,
  };
  return examSpecificTips[examType] || `Practice past papers and understand the marking scheme for best results.`;
}

function getTopicConnections(_topicName: string): string {
  return `This topic connects to several other areas:
- It builds on foundational concepts you've already learned
- It's essential for understanding more advanced topics
- Exam questions often combine this with related areas

Understanding these connections helps you see the "big picture" of your subject.`;
}

export const useRevisionClassroomStore = create<RevisionClassroomState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      pastSessions: [],
      currentLesson: null,
      lessonPlan: [],
      topicMasteries: {},
      currentCheckpoints: [],
      checkpointResponses: [],
      aiTeachingState: {
        isTeaching: false,
        currentPhase: 'hook',
        currentMessage: '',
        isThinking: false,
        awaitingResponse: false,
      },
      aiMessages: [],
      isLoading: false,
      error: null,

      // Start a new revision session
      startRevisionSession: async (
        userId,
        examType,
        subjectId,
        subjectName,
        sessionType = 'full_revision',
        topicId,
        topicName
      ) => {
        set({ isLoading: true, error: null });

        try {
          const sessionId = generateId('session');

          // Generate lesson plan based on subject and exam type
          const lessonPlan = generateLessonPlan(sessionId, subjectId, subjectName, examType, topicId);

          const session: RevisionSession = {
            id: sessionId,
            userId,
            examType,
            subjectId,
            subjectName,
            topicId,
            topicName,
            sessionType,
            status: 'active',
            progressPercentage: 0,
            currentLessonId: lessonPlan[0]?.id,
            lessonsCompleted: 0,
            totalLessons: lessonPlan.length,
            masteryScore: 0,
            timeSpentMinutes: 0,
            startedAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
          };

          set({
            currentSession: session,
            lessonPlan,
            currentLesson: lessonPlan[0] || null,
            isLoading: false,
            aiMessages: [],
            checkpointResponses: [],
          });

          // Start the first lesson automatically
          if (lessonPlan[0]) {
            await get().startLesson(lessonPlan[0].id);
          }
        } catch (error) {
          set({
            error: 'Failed to start revision session',
            isLoading: false,
          });
        }
      },

      // Resume an existing session
      resumeSession: async (sessionId) => {
        set({ isLoading: true, error: null });

        try {
          const { pastSessions } = get();
          const session = pastSessions.find(s => s.id === sessionId);

          if (session) {
            // Regenerate lesson plan (in production, this would come from DB)
            const lessonPlan = generateLessonPlan(
              session.id,
              session.subjectId,
              session.subjectName,
              session.examType,
              session.topicId
            );

            set({
              currentSession: { ...session, status: 'active' },
              lessonPlan,
              currentLesson: lessonPlan.find(l => l.id === session.currentLessonId) || lessonPlan[0],
              isLoading: false,
            });

            // Resume AI teaching
            if (session.currentLessonId) {
              await get().startLesson(session.currentLessonId);
            }
          } else {
            set({ error: 'Session not found', isLoading: false });
          }
        } catch (error) {
          set({ error: 'Failed to resume session', isLoading: false });
        }
      },

      // Pause current session
      pauseSession: async () => {
        const { currentSession, pastSessions } = get();

        if (currentSession) {
          const pausedSession = { ...currentSession, status: 'paused' as const };
          set({
            pastSessions: [...pastSessions.filter(s => s.id !== currentSession.id), pausedSession],
            currentSession: null,
            currentLesson: null,
            aiTeachingState: {
              isTeaching: false,
              currentPhase: 'hook',
              currentMessage: '',
              isThinking: false,
              awaitingResponse: false,
            },
          });
        }
      },

      // Complete current session
      completeSession: async () => {
        const { currentSession, pastSessions, lessonPlan } = get();

        if (currentSession) {
          const completedSession = {
            ...currentSession,
            status: 'completed' as const,
            progressPercentage: 100,
            lessonsCompleted: lessonPlan.length,
            completedAt: new Date().toISOString(),
          };
          set({
            pastSessions: [...pastSessions.filter(s => s.id !== currentSession.id), completedSession],
            currentSession: null,
            currentLesson: null,
            lessonPlan: [],
            aiTeachingState: {
              isTeaching: false,
              currentPhase: 'hook',
              currentMessage: '',
              isThinking: false,
              awaitingResponse: false,
            },
          });
        }
      },

      // Abandon current session
      abandonSession: async () => {
        const { currentSession, pastSessions } = get();

        if (currentSession) {
          const abandonedSession = { ...currentSession, status: 'abandoned' as const };
          set({
            pastSessions: [...pastSessions.filter(s => s.id !== currentSession.id), abandonedSession],
            currentSession: null,
            currentLesson: null,
            lessonPlan: [],
            aiTeachingState: {
              isTeaching: false,
              currentPhase: 'hook',
              currentMessage: '',
              isThinking: false,
              awaitingResponse: false,
            },
          });
        }
      },

      // Start a specific lesson
      startLesson: async (lessonId) => {
        set({ isLoading: true });

        try {
          const { lessonPlan, currentSession } = get();
          const lesson = lessonPlan.find(l => l.id === lessonId);

          if (lesson && currentSession) {
            const updatedLesson = {
              ...lesson,
              status: 'in_progress' as const,
              startedAt: new Date().toISOString(),
            };

            const updatedPlan = lessonPlan.map(l =>
              l.id === lessonId ? updatedLesson : l
            );

            set({
              currentLesson: updatedLesson,
              lessonPlan: updatedPlan,
              currentSession: { ...currentSession, currentLessonId: lessonId },
              isLoading: false,
            });

            // Start AI teaching with hook phase
            await get().requestAITeaching('hook');
          } else {
            set({ error: 'Lesson not found', isLoading: false });
          }
        } catch (error) {
          set({ error: 'Failed to start lesson', isLoading: false });
        }
      },

      // Complete current lesson
      completeLesson: async () => {
        const { currentLesson, lessonPlan, currentSession } = get();

        if (currentLesson && currentSession) {
          const updatedLesson = {
            ...currentLesson,
            status: 'completed' as const,
            completedAt: new Date().toISOString(),
          };

          const updatedPlan = lessonPlan.map(l =>
            l.id === currentLesson.id ? updatedLesson : l
          );

          const completedCount = updatedPlan.filter(l => l.status === 'completed').length;
          const progress = Math.round((completedCount / updatedPlan.length) * 100);

          set({
            currentLesson: null,
            lessonPlan: updatedPlan,
            currentSession: {
              ...currentSession,
              lessonsCompleted: completedCount,
              progressPercentage: progress,
            },
          });
        }
      },

      // Skip current lesson
      skipLesson: async () => {
        const { currentLesson, lessonPlan, currentSession } = get();

        if (currentLesson && currentSession) {
          const updatedLesson = {
            ...currentLesson,
            status: 'skipped' as const,
          };

          const updatedPlan = lessonPlan.map(l =>
            l.id === currentLesson.id ? updatedLesson : l
          );

          set({
            currentLesson: null,
            lessonPlan: updatedPlan,
          });

          // Move to next lesson
          await get().nextLesson();
        }
      },

      // Go to next lesson
      nextLesson: async () => {
        const { lessonPlan, currentLesson } = get();

        if (currentLesson) {
          const currentIndex = lessonPlan.findIndex(l => l.id === currentLesson.id);
          const nextLesson = lessonPlan[currentIndex + 1];

          if (nextLesson) {
            await get().startLesson(nextLesson.id);
          } else {
            // No more lessons - complete the session
            await get().completeSession();
          }
        }
      },

      // Request AI teaching for a specific phase
      requestAITeaching: async (phase) => {
        const { currentLesson, currentSession } = get();

        if (!currentLesson || !currentSession) return;

        set({
          aiTeachingState: {
            isTeaching: true,
            currentPhase: phase,
            currentMessage: '',
            isThinking: true,
            awaitingResponse: false,
          },
        });

        // Simulate AI response generation
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        const content = await generateAITeachingContent(
          currentLesson,
          phase,
          currentSession.examType
        );

        const message: RevisionAIMessage = {
          id: generateId('msg'),
          lessonId: currentLesson.id,
          interactionType: 'teaching',
          aiMessage: content,
          timestamp: new Date().toISOString(),
        };

        set(state => ({
          aiTeachingState: {
            ...state.aiTeachingState,
            currentMessage: content,
            isThinking: false,
            awaitingResponse: phase === 'check' || phase === 'practice',
          },
          aiMessages: [...state.aiMessages, message],
        }));
      },

      // Respond to AI (user input)
      respondToAI: async (response) => {
        const { currentLesson, aiTeachingState, currentSession } = get();

        if (!currentLesson || !currentSession) return;

        // Add user response to messages
        const userMessage: RevisionAIMessage = {
          id: generateId('msg'),
          lessonId: currentLesson.id,
          interactionType: 'question',
          aiMessage: '',
          userResponse: response,
          timestamp: new Date().toISOString(),
        };

        set(state => ({
          aiMessages: [...state.aiMessages, userMessage],
          aiTeachingState: {
            ...state.aiTeachingState,
            isThinking: true,
            awaitingResponse: false,
          },
        }));

        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate AI response based on current phase
        const { currentPhase } = aiTeachingState;
        let nextPhase: TeachingPhase;

        switch (currentPhase) {
          case 'hook':
            nextPhase = 'explain';
            break;
          case 'explain':
            nextPhase = 'check';
            break;
          case 'check':
            nextPhase = 'practice';
            break;
          case 'practice':
            nextPhase = 'confirm';
            break;
          case 'confirm':
            nextPhase = 'connect';
            break;
          case 'connect':
            // Lesson complete
            await get().completeLesson();
            await get().nextLesson();
            return;
          default:
            nextPhase = 'explain';
        }

        // Move to next phase
        await get().requestAITeaching(nextPhase);
      },

      // Ask a question to the AI
      askQuestion: async (question) => {
        const { currentLesson, currentSession } = get();

        if (!currentLesson || !currentSession) return;

        set(state => ({
          aiTeachingState: {
            ...state.aiTeachingState,
            isThinking: true,
          },
        }));

        // Simulate AI response
        await new Promise(resolve => setTimeout(resolve, 1500));

        const response = `Great question! Let me clarify that for you.

${question.toLowerCase().includes('why') ? 'The reason is...' : 'Here\'s how it works...'}

Understanding this concept is important because it helps you see how ${currentLesson.topicName} connects to exam questions.

Does this help? Feel free to ask more questions!`;

        const message: RevisionAIMessage = {
          id: generateId('msg'),
          lessonId: currentLesson.id,
          interactionType: 'clarification',
          aiMessage: response,
          userResponse: question,
          timestamp: new Date().toISOString(),
        };

        set(state => ({
          aiMessages: [...state.aiMessages, message],
          aiTeachingState: {
            ...state.aiTeachingState,
            currentMessage: response,
            isThinking: false,
          },
        }));
      },

      // Request clarification
      requestClarification: async (topic) => {
        await get().askQuestion(`Can you explain ${topic} in more detail?`);
      },

      // Answer a checkpoint question
      answerCheckpoint: async (checkpointId, answer) => {
        const checkpoint = get().currentCheckpoints.find(c => c.id === checkpointId);

        if (!checkpoint) {
          return {
            id: generateId('response'),
            checkpointId,
            userAnswer: answer,
            isCorrect: false,
            timeTakenSeconds: 0,
            aiFeedback: 'Checkpoint not found',
          };
        }

        const isCorrect = answer.toLowerCase().trim() === checkpoint.correctAnswer.toLowerCase().trim();

        const response: CheckpointResponse = {
          id: generateId('response'),
          checkpointId,
          userAnswer: answer,
          isCorrect,
          timeTakenSeconds: 30, // Would be tracked in real implementation
          aiFeedback: isCorrect
            ? `Excellent! You got it right! ${checkpoint.explanation}`
            : `Not quite. ${checkpoint.explanation}`,
        };

        set(state => ({
          checkpointResponses: [...state.checkpointResponses, response],
          currentLesson: state.currentLesson
            ? {
                ...state.currentLesson,
                questionsAttempted: state.currentLesson.questionsAttempted + 1,
                questionsCorrect: state.currentLesson.questionsCorrect + (isCorrect ? 1 : 0),
              }
            : null,
        }));

        return response;
      },

      // Generate more practice questions
      generateMorePractice: async () => {
        // Would call API to generate more questions
        set({ isLoading: true });
        await new Promise(resolve => setTimeout(resolve, 1000));
        set({ isLoading: false });
      },

      // Update topic mastery
      updateTopicMastery: (topicId, updates) => {
        set(state => ({
          topicMasteries: {
            ...state.topicMasteries,
            [topicId]: {
              ...state.topicMasteries[topicId],
              ...updates,
            },
          },
        }));
      },

      // Get topic mastery
      getTopicMastery: (topicId) => {
        return get().topicMasteries[topicId];
      },

      // Fetch past sessions
      fetchPastSessions: async (_userId) => {
        // Would fetch from API in production
        set({ isLoading: true });
        await new Promise(resolve => setTimeout(resolve, 500));
        set({ isLoading: false });
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Reset classroom
      resetClassroom: () => set({
        currentSession: null,
        currentLesson: null,
        lessonPlan: [],
        currentCheckpoints: [],
        checkpointResponses: [],
        aiTeachingState: {
          isTeaching: false,
          currentPhase: 'hook',
          currentMessage: '',
          isThinking: false,
          awaitingResponse: false,
        },
        aiMessages: [],
        error: null,
      }),
    }),
    {
      name: 'brilla-revision-classroom',
      version: 1,
      partialize: (state) => ({
        pastSessions: state.pastSessions,
        topicMasteries: state.topicMasteries,
      }),
    }
  )
);

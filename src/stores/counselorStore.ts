import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import type {
  CounselorConversation,
  CounselorMessage,
  CounselorType,
  StudentContext,
  WellbeingLog,
} from '@/types';

type ThinkingStage = 'idle' | 'thinking' | 'composing' | 'typing';

interface CounselorState {
  // Conversations
  conversations: CounselorConversation[];
  currentConversation: CounselorConversation | null;
  messages: CounselorMessage[];

  // UI State
  isOpen: boolean;
  isLoading: boolean;
  thinkingStage: ThinkingStage;
  error: string | null;
  counselorType: CounselorType;

  // Wellbeing
  todayWellbeingLog: WellbeingLog | null;
  wellbeingHistory: WellbeingLog[];
  showWellbeingCheckIn: boolean;

  // Student Context
  studentContext: StudentContext | null;

  // Actions - UI
  openCounselor: (type?: CounselorType) => void;
  closeCounselor: () => void;
  setCounselorType: (type: CounselorType) => void;
  openWellbeingCheckIn: () => void;
  closeWellbeingCheckIn: () => void;

  // Actions - Conversations
  loadConversations: () => Promise<void>;
  startConversation: (type: CounselorType, initialMessage?: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  archiveConversation: (id: string) => Promise<void>;

  // Actions - Messaging
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;

  // Actions - Feedback
  rateFeedback: (messageId: string, rating: number, feedbackType?: 'helpful' | 'not_helpful' | 'inappropriate') => Promise<void>;

  // Actions - Wellbeing
  logWellbeing: (data: Omit<WellbeingLog, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  loadWellbeingHistory: () => Promise<void>;

  // Actions - Context
  setStudentContext: (context: StudentContext) => void;

  // Utility
  clearError: () => void;
  reset: () => void;
}

// System prompts for each counselor type (exported for API integration)
export const COUNSELOR_SYSTEM_PROMPTS: Record<CounselorType, string> = {
  academic: `You are an empathetic and knowledgeable academic advisor for the Brilla Study Platform, designed specifically for Ghanaian students preparing for NSMQ, WASSCE, and BECE exams.

Your role is to:
- Help students with study strategies and time management
- Provide guidance on difficult subjects and topics
- Offer exam preparation tips specific to Ghanaian curricula
- Suggest effective learning techniques based on the student's learning style
- Encourage and motivate students when they feel overwhelmed

Be warm, encouraging, and culturally aware. Use examples relevant to Ghanaian students when possible. Always be supportive but honest about the effort required for success.`,

  career: `You are a career guidance counselor for the Brilla Study Platform, helping Ghanaian students explore STEM careers and higher education pathways.

Your role is to:
- Help students discover careers that match their interests and strengths
- Provide information about universities in Ghana and abroad
- Explain the educational pathways for different STEM careers
- Discuss skills and qualifications needed for various professions
- Share information about scholarships, internships, and opportunities for students

Be inspiring and informative. Help students dream big while providing practical, actionable advice. Be aware of opportunities available both in Ghana and internationally.`,

  wellbeing: `You are a supportive wellness counselor for the Brilla Study Platform, focused on helping Ghanaian students manage stress and maintain mental wellness.

Your role is to:
- Listen empathetically when students share their concerns
- Help students manage exam stress and academic pressure
- Suggest healthy coping strategies and self-care practices
- Encourage work-life balance and proper rest
- Recognize when students might need professional help and gently suggest it

IMPORTANT: You are not a replacement for professional mental health services. If a student mentions self-harm, severe depression, or crisis situations, always encourage them to speak with a trusted adult, counselor, or contact a helpline.

Be warm, non-judgmental, and supportive. Validate students' feelings while helping them develop resilience.`,

  general: `You are a friendly and supportive school counselor for the Brilla Study Platform, available to help Ghanaian students with any concerns they might have.

Your role is to:
- Be a supportive listener for students who need someone to talk to
- Help students set and track personal goals
- Celebrate their achievements and progress
- Provide guidance on general student life issues
- Connect students with the right resources when needed

Be approachable, friendly, and encouraging. Help students feel heard and supported in their educational journey.`,
};

// Demo data
const DEMO_CONVERSATIONS: CounselorConversation[] = [];
const DEMO_WELLBEING: WellbeingLog[] = [];

export const useCounselorStore = create<CounselorState>()(
  persist(
    (set, get) => ({
      // Initial state
      conversations: [],
      currentConversation: null,
      messages: [],
      isOpen: false,
      isLoading: false,
      thinkingStage: 'idle',
      error: null,
      counselorType: 'general',
      todayWellbeingLog: null,
      wellbeingHistory: [],
      showWellbeingCheckIn: false,
      studentContext: null,

      // UI Actions
      openCounselor: (type?: CounselorType) => {
        set({
          isOpen: true,
          counselorType: type || get().counselorType,
          error: null,
        });
      },

      closeCounselor: () => {
        set({ isOpen: false });
      },

      setCounselorType: (type: CounselorType) => {
        set({ counselorType: type });
      },

      openWellbeingCheckIn: () => {
        set({ showWellbeingCheckIn: true });
      },

      closeWellbeingCheckIn: () => {
        set({ showWellbeingCheckIn: false });
      },

      // Conversation Actions
      loadConversations: async () => {
        try {
          const response = await api.get<CounselorConversation[]>('/counselor/conversations');
          if (response.success && response.data) {
            set({ conversations: response.data });
          } else {
            set({ conversations: DEMO_CONVERSATIONS });
          }
        } catch {
          console.error('Failed to load conversations');
          set({ conversations: DEMO_CONVERSATIONS });
        }
      },

      startConversation: async (type: CounselorType, initialMessage?: string) => {
        set({ isLoading: true, error: null, counselorType: type });

        try {
          // Try API first
          const response = await api.post<{
            id: string;
            counselorType: string;
            status: string;
            messageCount: number;
            welcomeMessage: CounselorMessage;
          }>('/counselor/conversations', { counselorType: type });

          if (response.success && response.data) {
            const newConversation: CounselorConversation = {
              id: response.data.id,
              userId: 'current_user',
              counselorType: type,
              status: 'active',
              messageCount: response.data.messageCount,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            set({
              currentConversation: newConversation,
              messages: [response.data.welcomeMessage],
              conversations: [newConversation, ...get().conversations],
              isLoading: false,
            });

            if (initialMessage) {
              await get().sendMessage(initialMessage);
            }
            return;
          }

          // Fallback to local creation
          const newConversation: CounselorConversation = {
            id: `conv_${Date.now()}`,
            userId: 'current_user',
            counselorType: type,
            status: 'active',
            messageCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const welcomeMessage: CounselorMessage = {
            id: `msg_${Date.now()}`,
            conversationId: newConversation.id,
            role: 'counselor',
            content: getWelcomeMessage(type, get().studentContext?.name),
            sentiment: 'positive',
            createdAt: new Date().toISOString(),
            isNew: true,
          };

          set({
            currentConversation: newConversation,
            messages: [welcomeMessage],
            conversations: [newConversation, ...get().conversations],
            isLoading: false,
          });

          if (initialMessage) {
            await get().sendMessage(initialMessage);
          }
        } catch {
          set({ error: 'Failed to start conversation', isLoading: false });
        }
      },

      loadConversation: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.get<{
            id: string;
            counselorType: CounselorType;
            title?: string;
            status: CounselorConversation['status'];
            messageCount: number;
            lastMessageAt?: string;
            createdAt: string;
            messages?: Array<Omit<CounselorMessage, 'conversationId'>>;
          }>(`/counselor/conversations/${id}`);

          if (response.success && response.data) {
            const data = response.data;
            const conversation: CounselorConversation = {
              id: data.id,
              userId: 'current_user',
              counselorType: data.counselorType,
              title: data.title,
              status: data.status,
              messageCount: data.messageCount,
              lastMessageAt: data.lastMessageAt,
              createdAt: data.createdAt,
              updatedAt: data.lastMessageAt || data.createdAt,
            };

            set({
              currentConversation: conversation,
              messages: (data.messages || []).map(m => ({ ...m, conversationId: data.id })),
              counselorType: data.counselorType,
              isLoading: false,
            });
            return;
          }
        } catch {
          console.error('Failed to load conversation from API');
        }

        // Fallback to the locally cached copy (offline/dev)
        const conversation = get().conversations.find(c => c.id === id);
        if (conversation) {
          set({
            currentConversation: conversation,
            messages: conversation.messages || [],
            counselorType: conversation.counselorType,
            isLoading: false,
          });
        } else {
          set({ error: 'Failed to load conversation', isLoading: false });
        }
      },

      archiveConversation: async (id: string) => {
        // DELETE /counselor/conversations/:id archives server-side
        // (the list endpoint excludes archived conversations).
        const response = await api.delete(`/counselor/conversations/${id}`);
        if (!response.success) {
          throw new Error(response.error || 'Failed to archive conversation');
        }

        set({
          conversations: get().conversations.filter(c => c.id !== id),
        });

        if (get().currentConversation?.id === id) {
          set({ currentConversation: null, messages: [] });
        }
      },

      // Messaging
      sendMessage: async (message: string) => {
        const { currentConversation, counselorType } = get();

        if (!currentConversation) {
          // Start a new conversation first
          await get().startConversation(counselorType, message);
          return;
        }

        set({ isLoading: true, thinkingStage: 'thinking', error: null });

        // Add user message optimistically
        const userMessage: CounselorMessage = {
          id: `msg_${Date.now()}`,
          conversationId: currentConversation.id,
          role: 'user',
          content: message,
          createdAt: new Date().toISOString(),
        };

        set({ messages: [...get().messages, userMessage] });

        try {
          // Show thinking stages for better UX
          await new Promise(resolve => setTimeout(resolve, 300));
          set({ thinkingStage: 'composing' });

          // Call API
          const response = await api.post<{
            conversationId: string;
            userMessage: CounselorMessage;
            counselorMessage: CounselorMessage;
          }>('/counselor/chat', {
            conversationId: currentConversation.id,
            message,
          });

          set({ thinkingStage: 'typing' });
          await new Promise(resolve => setTimeout(resolve, 200));

          if (response.success && response.data) {
            const counselorMessage: CounselorMessage = {
              ...response.data.counselorMessage,
              isNew: true,
            };

            set({
              messages: [...get().messages, counselorMessage],
              isLoading: false,
              thinkingStage: 'idle',
            });

            // Update conversation
            set({
              currentConversation: {
                ...currentConversation,
                messageCount: (currentConversation.messageCount || 0) + 2,
                lastMessageAt: new Date().toISOString(),
              },
            });
          } else {
            // No mock fallback: surface the failure instead of fabricating a
            // counselor reply (same error-state pattern as loadConversation).
            set({
              error: response.error || 'Failed to send message. Please try again.',
              isLoading: false,
              thinkingStage: 'idle',
            });
          }
        } catch {
          console.error('Failed to send message');
          set({
            error: 'Failed to send message. Please try again.',
            isLoading: false,
            thinkingStage: 'idle',
          });
        }
      },

      clearMessages: () => {
        set({ messages: [], currentConversation: null });
      },

      // Feedback
      rateFeedback: async (messageId: string, rating: number, feedbackType?: 'helpful' | 'not_helpful' | 'inappropriate') => {
        try {
          await api.post(`/counselor/messages/${messageId}/feedback`, {
            rating,
            feedbackType,
          });
        } catch {
          console.error('Failed to submit feedback');
        }
      },

      // Wellbeing
      logWellbeing: async (data: Omit<WellbeingLog, 'id' | 'userId' | 'createdAt'>) => {
        try {
          const log: WellbeingLog = {
            ...data,
            id: `well_${Date.now()}`,
            userId: 'current_user',
            createdAt: new Date().toISOString(),
          };

          const response = await api.post('/counselor/wellbeing/log', {
            stressLevel: data.stressLevel,
            studySatisfaction: data.studySatisfaction,
            energyLevel: data.energyLevel,
            mood: data.mood,
            notes: data.notes,
          });

          if (!response.success) {
            throw new Error(response.error || 'Failed to log wellbeing');
          }

          set({
            todayWellbeingLog: log,
            wellbeingHistory: [log, ...get().wellbeingHistory],
            showWellbeingCheckIn: false,
          });
        } catch {
          console.error('Error logging wellbeing');
          throw new Error('Failed to log wellbeing');
        }
      },

      loadWellbeingHistory: async () => {
        try {
          const response = await api.get<WellbeingLog[]>('/counselor/wellbeing/history?days=30');
          if (response.success && response.data) {
            set({ wellbeingHistory: response.data });
          } else {
            set({ wellbeingHistory: DEMO_WELLBEING });
          }
        } catch {
          console.error('Failed to load wellbeing history');
          set({ wellbeingHistory: DEMO_WELLBEING });
        }
      },

      // Context
      setStudentContext: (context: StudentContext) => {
        set({ studentContext: context });
      },

      // Utility
      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          conversations: [],
          currentConversation: null,
          messages: [],
          isOpen: false,
          isLoading: false,
          thinkingStage: 'idle',
          error: null,
        });
      },
    }),
    {
      name: 'brilla-counselor-v1',
      partialize: (state) => ({
        conversations: state.conversations,
        counselorType: state.counselorType,
        todayWellbeingLog: state.todayWellbeingLog,
        wellbeingHistory: state.wellbeingHistory,
        studentContext: state.studentContext,
      }),
    }
  )
);

// Helper function for welcome messages
function getWelcomeMessage(type: CounselorType, userName?: string): string {
  const greeting = userName ? `Hello ${userName}! ` : 'Hello! ';

  switch (type) {
    case 'academic':
      return `${greeting}I'm your Academic Advisor. I'm here to help you with study strategies, subject difficulties, and exam preparation. Whether you're preparing for NSMQ, WASSCE, or BECE, I've got tips and guidance for you.

What would you like help with today?`;

    case 'career':
      return `${greeting}I'm your Career Counselor. I'm excited to help you explore STEM careers and plan your future! Whether you're curious about different professions, university options, or skills you need to develop, I'm here to guide you.

What career questions are on your mind?`;

    case 'wellbeing':
      return `${greeting}I'm your Wellness Counselor, and I'm here to support you. School can be challenging, and it's important to take care of your mental health along with your studies.

This is a safe space to talk about anything that's on your mind. How are you feeling today?`;

    case 'general':
    default:
      return `${greeting}I'm here to chat and help with whatever you need. Whether it's about school, your goals, or just life in general, I'm a good listener.

What's on your mind today?`;
  }
}

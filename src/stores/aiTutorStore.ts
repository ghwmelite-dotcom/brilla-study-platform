import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getApiUrl, getAuthHeaders } from '../utils/api';
import { extractTextFromPDF, isPDFFile } from '../utils/pdfExtractor';

export interface FileAttachment {
  id: string;
  name: string;
  type: string; // MIME type
  size: number;
  url: string; // R2 public URL or data URL for preview
  thumbnailUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isNew?: boolean;
  messageType?: 'chat' | 'explanation' | 'hint' | 'step_by_step';
  questionId?: string;
  attachments?: FileAttachment[];
}

export interface UserPersonalization {
  name: string;
  preferredName?: string;
  learningStyle?: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  strengths?: string[];
  weakAreas?: string[];
  gradeLevel?: string;
  previousTopics?: string[];
  encouragementStyle?: 'motivational' | 'analytical' | 'supportive';
}

export interface QuestionContext {
  id?: string;
  subject?: string;
  topic?: string;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
  explanation?: string;
}

type ThinkingStage = 'idle' | 'thinking' | 'composing' | 'typing';

interface AiTutorState {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  thinkingStage: ThinkingStage;
  error: string | null;
  currentContext?: string;
  latestMessageId?: string;
  userPersonalization?: UserPersonalization;
  conversationId?: string;
  examType?: string;
  subjectId?: string;
  topicId?: string;

  // Actions
  openChat: (context?: string, examType?: string, subjectId?: string, topicId?: string) => void;
  closeChat: () => void;
  sendMessage: (message: string, userId: string, userName?: string, files?: File[]) => Promise<void>;
  explainQuestion: (questionContext: QuestionContext, userId: string) => Promise<string>;
  getHint: (questionContext: QuestionContext, hintLevel: number, userId: string) => Promise<{ hint: string; hasMoreHints: boolean }>;
  getStepByStep: (questionContext: QuestionContext, userId: string) => Promise<string>;
  clearMessages: () => void;
  clearError: () => void;
  markMessageAsOld: (messageId: string) => void;
  setUserPersonalization: (data: Partial<UserPersonalization>) => void;
  startNewConversation: () => void;
  uploadFile: (file: File, userId: string) => Promise<FileAttachment | null>;
}

// Mock AI responses when API is unavailable
function generateMockResponse(message: string, userName?: string): string {
  const lowerMessage = message.toLowerCase();
  const greeting = userName ? `${userName}, ` : '';
  const personalTouch = userName ? ` I'm here specifically for you, ${userName}.` : '';

  if (lowerMessage.includes('study') || lowerMessage.includes('tip')) {
    return `Great question, ${greeting}here are some effective study tips tailored for you:

**1. Active Recall**
Test yourself regularly instead of just re-reading notes. Try to explain concepts without looking at your materials.

**2. Spaced Repetition**
Review material at increasing intervals (1 day, 3 days, 1 week) to strengthen long-term memory.

**3. Practice Problems**
Work through past exam questions under timed conditions. This helps with both understanding and exam technique.

**4. Teach Others**
Explaining concepts to classmates helps solidify your own understanding.

**5. Take Breaks**
Use the Pomodoro technique: 25 minutes focused study, 5 minute break.

Would you like me to explain any of these strategies in more detail?${personalTouch}`;
  }

  if (lowerMessage.includes('explain') || lowerMessage.includes('what is')) {
    return `${greeting ? `Of course, ${greeting}` : ''}I'd be happy to help explain that concept!

To give you the best explanation, could you please:
1. Specify which subject (Maths, Physics, Chemistry, Biology, or another subject)
2. Tell me what specifically you're finding confusing

For example, you could ask:
- "Explain the concept of momentum in Physics"
- "What is photosynthesis and how does it work?"
- "How do I solve quadratic equations?"

I'm here to help you understand!${personalTouch}`;
  }

  if (lowerMessage.includes('formula') || lowerMessage.includes('equation')) {
    return `${greeting ? `Great thinking, ${greeting}` : ''}Formulas are key to success in science and maths exams!

**Tips for learning formulas:**

1. **Understand, don't just memorize** - Know what each variable represents and why the formula works
2. **Use flashcards** - Write formula on one side, meaning on the other
3. **Practice application** - Use the formula in different types of problems
4. **Group related formulas** - E.g., all kinematic equations together

Which specific formula would you like me to explain?`;
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage === 'hi') {
    return `Hello${userName ? `, ${userName}` : ''}! I'm Brilla AI, your personal study companion.

I'm so glad you're here! I can help you with:
- **Explaining concepts** in any subject
- **Study tips** and exam strategies
- **Practice questions** and worked solutions
- **Formula explanations** and derivations

What would you like to work on together today? Remember, there are no silly questions - I'm here to help you succeed!`;
  }

  // Default response
  return `${greeting ? `Thanks for reaching out, ${greeting}` : 'Thanks for your question! '}I'm here to help you prepare for your exams.

I can assist you with:
- **Subject explanations** - Ask me about any topic in Maths, Sciences, English, or other subjects
- **Study strategies** - Get tips for effective revision
- **Exam techniques** - Learn how to approach different question types
- **Practice problems** - Work through examples together

What specific topic or question would you like help with?${personalTouch}`;
}

// Mock response for file uploads when API is unavailable
function generateMockFileResponse(file: File, userName?: string): string {
  const greeting = userName ? `${userName}, ` : '';
  const fileType = file.type;
  const fileName = file.name;

  if (fileType.startsWith('image/')) {
    return `${greeting ? `Thanks for sharing that image, ${greeting}` : 'Thanks for sharing that image! '}I can see you've uploaded **${fileName}**.

📸 **Image Analysis:**

I can help you with:
- **Math problems** - If this is a photo of homework or an exam question, I'll work through it step by step
- **Diagrams** - Scientific diagrams, graphs, or charts that need explanation
- **Handwritten notes** - Help organize or explain concepts from your notes
- **Past papers** - Questions from WASSCE, BECE, or NSMQ

What would you like me to help you understand about this image?`;
  }

  if (fileType === 'application/pdf') {
    return `${greeting ? `Thanks for sharing that PDF, ${greeting}` : 'Thanks for sharing that document! '}I can see you've uploaded **${fileName}**.

📄 **Document Received:**

I can help you with:
- **Past papers** - Work through questions and explain solutions
- **Study materials** - Summarize key concepts
- **Textbook pages** - Explain difficult sections
- **Practice tests** - Review your answers

What specific part of this document would you like help with?`;
  }

  return `${greeting ? `Thanks for sharing that file, ${greeting}` : 'Thanks for sharing that file! '}I've received **${fileName}**.

I'll do my best to help you with the content. What would you like me to focus on?`;
}

// Mock explanation generator
function generateMockExplanation(questionContext: QuestionContext, userName?: string): string {
  const { isCorrect, correctAnswer, userAnswer, topic, subject } = questionContext;

  if (isCorrect) {
    return `${userName ? `Excellent work, ${userName}! ` : 'Excellent work! '}You got it right! 🎉

The correct answer is **${correctAnswer}**.

**Why this is correct:**
This question is about ${topic || 'this topic'} in ${subject || 'this subject'}. Understanding the core concept here will help you with similar questions.

**Key Takeaway:** Keep practicing questions like this to reinforce your understanding!`;
  } else {
    return `Good try! Let's learn from this. 📚

The correct answer is **${correctAnswer}**${userAnswer ? `, but you selected **${userAnswer}**` : ''}.

**Why the correct answer is right:**
This relates to a key concept in ${topic || 'this topic'}. Take a moment to review this topic.

**Common mistake:** Many students confuse this concept. The key is to remember the fundamental principle.

**Study Tip:** Review ${topic || 'this topic'} in your textbook and try more practice questions.`;
  }
}

// Mock hint generator
function generateMockHint(hintLevel: number, topic?: string, userName?: string): string {
  const hints = [
    `${userName ? `${userName}, think` : 'Think'} about the fundamental concepts involved in ${topic || 'this topic'}. What principles might apply here?`,
    `${userName ? `You've got this, ${userName}! ` : ''}Consider breaking the problem into smaller parts. What information do you already have? Look for key words in the question.`,
    `${userName ? `Almost there, ${userName}! ` : ''}Focus on the key variables and relationships. The answer involves understanding how ${topic || 'the concept'} works in practice.`
  ];

  return hints[Math.min(hintLevel - 1, hints.length - 1)];
}

// Mock step-by-step generator
function generateMockStepByStep(questionContext: QuestionContext): string {
  const { questionText, correctAnswer, topic, subject } = questionContext;

  return `Let's solve this step by step:

**Problem:** ${questionText}

**Step 1:** Identify what we're looking for
We need to find the answer related to ${topic || 'this concept'}.

**Step 2:** Recall the relevant concept
Remember the key principle from ${subject || 'this subject'}.

**Step 3:** Apply the concept
Using what we know, we can work through the options.

**Step 4:** Check our answer
The correct answer is **${correctAnswer}**.

**Why:** This follows from the core principle we applied. Make sure you understand each step before moving on!`;
}

// Safe JSON parse helper
async function safeJsonParse(response: Response): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const text = await response.text();
    if (!text || text.trim() === '') {
      return { success: false, error: 'Empty response from server' };
    }
    const data = JSON.parse(text);
    return { success: true, data };
  } catch {
    return { success: false, error: 'Invalid response from server' };
  }
}

// Simulate thinking stages with delays
function simulateThinking(
  setStage: (stage: ThinkingStage) => void,
  onComplete: () => void
) {
  setStage('thinking');

  setTimeout(() => {
    setStage('composing');

    setTimeout(() => {
      onComplete();
    }, 800 + Math.random() * 400);
  }, 600 + Math.random() * 400);
}

export const useAiTutorStore = create<AiTutorState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      messages: [],
      isLoading: false,
      thinkingStage: 'idle',
      error: null,
      currentContext: undefined,
      latestMessageId: undefined,
      userPersonalization: undefined,
      conversationId: undefined,
      examType: undefined,
      subjectId: undefined,
      topicId: undefined,

      openChat: (context, examType, subjectId, topicId) => {
        set({
          isOpen: true,
          currentContext: context,
          examType,
          subjectId,
          topicId,
        });
      },

      closeChat: () => {
        set({ isOpen: false });
      },

      startNewConversation: () => {
        set({
          conversationId: undefined,
          messages: [],
          latestMessageId: undefined
        });
      },

      setUserPersonalization: (data) => {
        set((state) => ({
          userPersonalization: { ...state.userPersonalization, ...data } as UserPersonalization,
        }));
      },

      markMessageAsOld: (messageId) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId ? { ...m, isNew: false } : m
          ),
        }));
      },

      uploadFile: async (file, _userId) => {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(getApiUrl('/api/tutor/upload'), {
            method: 'POST',
            headers: {
              ...getAuthHeaders(),
            },
            body: formData,
          });

          if (!response.ok) {
            console.error('File upload failed');
            return null;
          }

          const data = await response.json() as {
            success: boolean;
            data?: {
              id: string;
              name: string;
              type: string;
              size: number;
              url: string;
              thumbnailUrl?: string;
            };
          };

          if (data.success && data.data) {
            return {
              id: data.data.id,
              name: data.data.name,
              type: data.data.type,
              size: data.data.size,
              url: data.data.url,
              thumbnailUrl: data.data.thumbnailUrl,
            };
          }
          return null;
        } catch (error) {
          console.error('File upload error:', error);
          return null;
        }
      },

      sendMessage: async (message, _userId, userName, files) => {
        // Upload files first if provided
        const attachments: FileAttachment[] = [];

        if (files && files.length > 0) {
          set({ isLoading: true, thinkingStage: 'thinking' });

          for (const file of files) {
            // Create a local preview URL for immediate display
            const localPreview: FileAttachment = {
              id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              type: file.type,
              size: file.size,
              url: URL.createObjectURL(file),
            };
            attachments.push(localPreview);
          }
        }

        const userMessage: ChatMessage = {
          id: `msg_${Date.now()}_user`,
          role: 'user',
          content: message,
          timestamp: new Date(),
          isNew: false,
          messageType: 'chat',
          attachments: attachments.length > 0 ? attachments : undefined,
        };

        // Mark all previous messages as old
        set((state) => ({
          messages: [...state.messages.map((m) => ({ ...m, isNew: false })), userMessage],
          isLoading: true,
          thinkingStage: 'thinking',
          error: null,
        }));

        try {
          let assistantContent: string;
          let newConversationId: string | undefined;
          const personalization = get().userPersonalization;
          const displayName = userName || personalization?.preferredName || personalization?.name;

          // Simulate thinking stages
          await new Promise<void>((resolve) => {
            simulateThinking(
              (stage) => set({ thinkingStage: stage }),
              resolve
            );
          });

          try {
            // If there are files, upload them and get URLs
            const uploadedAttachments: Array<{ url: string; type: string; name: string }> = [];
            let pdfContent: string | undefined;

            if (files && files.length > 0) {
              for (const file of files) {
                // Handle PDF files - extract text content or render for OCR
                if (isPDFFile(file)) {
                  set({ thinkingStage: 'thinking' }); // Show thinking while extracting PDF
                  const extraction = await extractTextFromPDF(file);
                  if (extraction.success) {
                    pdfContent = extraction.text;

                    // If this is a scanned PDF, add page images for OCR
                    if (extraction.isScanned && extraction.pageImages) {
                      for (const pageImage of extraction.pageImages) {
                        uploadedAttachments.push({
                          url: pageImage.base64,
                          type: 'image/jpeg',
                          name: `${file.name} - Page ${pageImage.pageNum}`,
                        });
                      }
                    }

                    // Still add PDF attachment info for display purposes
                    uploadedAttachments.push({
                      url: '', // No base64 needed for PDF itself
                      type: file.type,
                      name: file.name,
                    });
                  } else {
                    // PDF extraction failed - add note
                    uploadedAttachments.push({
                      url: '',
                      type: file.type,
                      name: file.name,
                    });
                    console.warn('PDF extraction failed:', extraction.error);
                  }
                } else {
                  // Convert non-PDF files (images, etc.) to base64 for sending to API
                  const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const result = reader.result as string;
                      // Extract base64 data after the data URL prefix
                      const base64Data = result.split(',')[1];
                      resolve(base64Data);
                    };
                    reader.readAsDataURL(file);
                  });

                  uploadedAttachments.push({
                    url: base64,
                    type: file.type,
                    name: file.name,
                  });
                }
              }
            }

            const response = await fetch(getApiUrl('/api/tutor/chat'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
              },
              body: JSON.stringify({
                conversationId: get().conversationId,
                message,
                context: get().currentContext,
                examType: get().examType,
                subjectId: get().subjectId,
                topicId: get().topicId,
                attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
                pdfContent, // Include extracted PDF text
              }),
            });

            const parsed = await safeJsonParse(response);

            if (!parsed.success || !response.ok) {
              // API unavailable or returned error - use mock response
              assistantContent = files && files.length > 0
                ? generateMockFileResponse(files[0], displayName)
                : generateMockResponse(message, displayName);
            } else {
              const responseData = parsed.data as {
                success: boolean;
                data?: {
                  conversationId?: string;
                  assistantMessage?: { content?: string };
                }
              };

              if (responseData.success && responseData.data) {
                assistantContent = responseData.data.assistantMessage?.content ||
                  (files && files.length > 0
                    ? generateMockFileResponse(files[0], displayName)
                    : generateMockResponse(message, displayName));
                newConversationId = responseData.data.conversationId;
              } else {
                assistantContent = files && files.length > 0
                  ? generateMockFileResponse(files[0], displayName)
                  : generateMockResponse(message, displayName);
              }
            }
          } catch {
            // Network error or API unavailable - use mock response
            assistantContent = files && files.length > 0
              ? generateMockFileResponse(files[0], userName || get().userPersonalization?.name)
              : generateMockResponse(message, userName || get().userPersonalization?.name);
          }

          const messageId = `msg_${Date.now()}_assistant`;
          const assistantMessage: ChatMessage = {
            id: messageId,
            role: 'assistant',
            content: assistantContent,
            timestamp: new Date(),
            isNew: true,
            messageType: 'chat',
          };

          set((state) => ({
            messages: [...state.messages, assistantMessage],
            isLoading: false,
            thinkingStage: 'typing',
            latestMessageId: messageId,
            conversationId: newConversationId || state.conversationId,
          }));

          // Clear typing stage after a delay
          setTimeout(() => {
            set({ thinkingStage: 'idle' });
          }, 500);

        } catch {
          // Final fallback - still provide a response
          const displayName = userName || get().userPersonalization?.name;
          const messageId = `msg_${Date.now()}_assistant`;
          const fallbackMessage: ChatMessage = {
            id: messageId,
            role: 'assistant',
            content: files && files.length > 0
              ? generateMockFileResponse(files[0], displayName)
              : generateMockResponse(message, displayName),
            timestamp: new Date(),
            isNew: true,
            messageType: 'chat',
          };

          set((state) => ({
            messages: [...state.messages, fallbackMessage],
            isLoading: false,
            thinkingStage: 'idle',
            error: null,
            latestMessageId: messageId,
          }));
        }
      },

      explainQuestion: async (questionContext, _userId) => {
        set({ isLoading: true, thinkingStage: 'thinking', error: null });

        const userName = get().userPersonalization?.name;

        try {
          // Simulate thinking
          await new Promise<void>((resolve) => {
            simulateThinking(
              (stage) => set({ thinkingStage: stage }),
              resolve
            );
          });

          const response = await fetch(getApiUrl('/api/tutor/explain'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            body: JSON.stringify({
              questionId: questionContext.id,
              questionText: questionContext.questionText,
              subject: questionContext.subject,
              topic: questionContext.topic,
              options: questionContext.options,
              correctAnswer: questionContext.correctAnswer,
              userAnswer: questionContext.userAnswer,
              isCorrect: questionContext.isCorrect,
              existingExplanation: questionContext.explanation,
              conversationId: get().conversationId,
            }),
          });

          const parsed = await safeJsonParse(response);

          if (!parsed.success || !response.ok) {
            set({ isLoading: false, thinkingStage: 'idle' });
            return generateMockExplanation(questionContext, userName);
          }

          const responseData = parsed.data as {
            success: boolean;
            data?: {
              explanation?: string;
              conversationId?: string;
            };
          };

          if (responseData.success && responseData.data?.explanation) {
            if (responseData.data.conversationId) {
              set({ conversationId: responseData.data.conversationId });
            }
            set({ isLoading: false, thinkingStage: 'idle' });
            return responseData.data.explanation;
          }

          set({ isLoading: false, thinkingStage: 'idle' });
          return generateMockExplanation(questionContext, userName);
        } catch {
          set({ isLoading: false, thinkingStage: 'idle' });
          return generateMockExplanation(questionContext, userName);
        }
      },

      getHint: async (questionContext, hintLevel, _userId) => {
        set({ isLoading: true, thinkingStage: 'thinking', error: null });

        const userName = get().userPersonalization?.name;

        try {
          // Simulate thinking
          await new Promise<void>((resolve) => {
            simulateThinking(
              (stage) => set({ thinkingStage: stage }),
              resolve
            );
          });

          const response = await fetch(getApiUrl('/api/tutor/hint'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            body: JSON.stringify({
              questionId: questionContext.id,
              questionText: questionContext.questionText,
              subject: questionContext.subject,
              topic: questionContext.topic,
              options: questionContext.options,
              correctAnswer: questionContext.correctAnswer,
              hintLevel,
              conversationId: get().conversationId,
            }),
          });

          const parsed = await safeJsonParse(response);

          if (!parsed.success || !response.ok) {
            set({ isLoading: false, thinkingStage: 'idle' });
            return {
              hint: generateMockHint(hintLevel, questionContext.topic, userName),
              hasMoreHints: hintLevel < 3,
            };
          }

          const responseData = parsed.data as {
            success: boolean;
            data?: {
              hint?: string;
              hasMoreHints?: boolean;
              conversationId?: string;
            };
          };

          if (responseData.success && responseData.data?.hint) {
            if (responseData.data.conversationId) {
              set({ conversationId: responseData.data.conversationId });
            }
            set({ isLoading: false, thinkingStage: 'idle' });
            return {
              hint: responseData.data.hint,
              hasMoreHints: responseData.data.hasMoreHints ?? hintLevel < 3,
            };
          }

          set({ isLoading: false, thinkingStage: 'idle' });
          return {
            hint: generateMockHint(hintLevel, questionContext.topic, userName),
            hasMoreHints: hintLevel < 3,
          };
        } catch {
          set({ isLoading: false, thinkingStage: 'idle' });
          return {
            hint: generateMockHint(hintLevel, questionContext.topic, userName),
            hasMoreHints: hintLevel < 3,
          };
        }
      },

      getStepByStep: async (questionContext, _userId) => {
        set({ isLoading: true, thinkingStage: 'thinking', error: null });

        try {
          // Simulate thinking
          await new Promise<void>((resolve) => {
            simulateThinking(
              (stage) => set({ thinkingStage: stage }),
              resolve
            );
          });

          const response = await fetch(getApiUrl('/api/tutor/step-by-step'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            body: JSON.stringify({
              questionId: questionContext.id,
              questionText: questionContext.questionText,
              subject: questionContext.subject,
              topic: questionContext.topic,
              options: questionContext.options,
              correctAnswer: questionContext.correctAnswer,
              explanation: questionContext.explanation,
              conversationId: get().conversationId,
            }),
          });

          const parsed = await safeJsonParse(response);

          if (!parsed.success || !response.ok) {
            set({ isLoading: false, thinkingStage: 'idle' });
            return generateMockStepByStep(questionContext);
          }

          const responseData = parsed.data as {
            success: boolean;
            data?: {
              solution?: string;
              conversationId?: string;
            };
          };

          if (responseData.success && responseData.data?.solution) {
            if (responseData.data.conversationId) {
              set({ conversationId: responseData.data.conversationId });
            }
            set({ isLoading: false, thinkingStage: 'idle' });
            return responseData.data.solution;
          }

          set({ isLoading: false, thinkingStage: 'idle' });
          return generateMockStepByStep(questionContext);
        } catch {
          set({ isLoading: false, thinkingStage: 'idle' });
          return generateMockStepByStep(questionContext);
        }
      },

      clearMessages: () => {
        set({ messages: [], latestMessageId: undefined, conversationId: undefined });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'brilla-ai-tutor',
      partialize: (state) => ({
        userPersonalization: state.userPersonalization,
        conversationId: state.conversationId,
      }),
    }
  )
);

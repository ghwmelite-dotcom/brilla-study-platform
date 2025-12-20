import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ChatRoom,
  ChatMessage,
  ChatTypingUser,
  CreateRoomData,
  ChatRoomType,
} from '@/types';

interface ChatState {
  // Connection state
  isConnected: boolean;
  connectionError: string | null;
  ws: WebSocket | null;

  // Data
  rooms: ChatRoom[];
  activeRoomId: string | null;
  messagesByRoom: Record<string, ChatMessage[]>;
  typingUsers: ChatTypingUser[];

  // UI State
  isChatOpen: boolean;
  isRoomListOpen: boolean;
  activeTab: 'chats' | 'rooms' | 'people';
  searchQuery: string;
  replyingTo: ChatMessage | null;

  // Loading states
  isLoadingRooms: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;

  // Actions
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  setActiveTab: (tab: 'chats' | 'rooms' | 'people') => void;
  setSearchQuery: (query: string) => void;
  setReplyingTo: (message: ChatMessage | null) => void;

  // Room actions
  fetchRooms: () => Promise<void>;
  fetchMessages: (roomId: string) => Promise<void>;
  setActiveRoom: (roomId: string | null) => void;
  createRoom: (data: CreateRoomData) => Promise<ChatRoom>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  startDM: (userId: string, userName: string) => Promise<ChatRoom>;

  // Message actions
  sendMessage: (content: string, replyToId?: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;

  // Typing indicators
  setTyping: (isTyping: boolean) => void;
  simulateTyping: (userName: string, duration?: number) => void;

  // Utility
  markAsRead: (roomId: string) => void;
  clearError: () => void;
  getRoomsByType: (type: ChatRoomType | 'all') => ChatRoom[];
  getUnreadCount: () => number;
  clearAllData: () => void;
}

// Helper to get current user from auth store
const getCurrentUser = () => {
  try {
    const authState = JSON.parse(localStorage.getItem('brilla-auth') || '{}');
    return authState?.state?.user || null;
  } catch {
    return null;
  }
};

// Clear old cached data on load
const STORE_VERSION = 3;
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('brilla-chat');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Clear if no version or old version
      if (!parsed.version || parsed.version < STORE_VERSION) {
        localStorage.removeItem('brilla-chat');
      }
    }
  } catch {
    localStorage.removeItem('brilla-chat');
  }
}

// Demo rooms to show chat functionality
const getDemoRooms = (): ChatRoom[] => {
  const now = new Date().toISOString();
  const hourAgo = new Date(Date.now() - 3600000).toISOString();
  const dayAgo = new Date(Date.now() - 86400000).toISOString();

  return [
    {
      id: 'room_wassce_physics',
      name: 'WASSCE Physics Study Group',
      description: 'Discuss physics concepts, formulas, and exam preparation',
      type: 'subject',
      subjectId: 'sub_physics',
      examTypeId: 'exam_wassce',
      isArchived: false,
      maxMembers: 500,
      createdBy: 'system',
      createdAt: dayAgo,
      updatedAt: hourAgo,
      memberCount: 156,
      unreadCount: 3,
      myRole: 'member',
      lastMessage: {
        id: 'msg_demo1',
        roomId: 'room_wassce_physics',
        senderId: 'user_kwame',
        content: 'Can someone explain the difference between velocity and acceleration?',
        contentType: 'text',
        isEdited: false,
        isDeleted: false,
        createdAt: hourAgo,
        updatedAt: hourAgo,
        sender: { id: 'user_kwame', name: 'Kwame Asante' },
        reactions: [],
      },
    },
    {
      id: 'room_wassce_maths',
      name: 'WASSCE Mathematics Help',
      description: 'Get help with mathematics problems and exam prep',
      type: 'subject',
      subjectId: 'sub_maths',
      examTypeId: 'exam_wassce',
      isArchived: false,
      maxMembers: 500,
      createdBy: 'system',
      createdAt: dayAgo,
      updatedAt: now,
      memberCount: 234,
      unreadCount: 0,
      myRole: 'member',
    },
    {
      id: 'room_nsmq_practice',
      name: 'NSMQ Speed Drills',
      description: 'Practice speed rounds and riddles together',
      type: 'public',
      examTypeId: 'exam_nsmq',
      isArchived: false,
      maxMembers: 200,
      createdBy: 'system',
      createdAt: dayAgo,
      updatedAt: hourAgo,
      memberCount: 89,
      unreadCount: 5,
      myRole: 'member',
      lastMessage: {
        id: 'msg_demo2',
        roomId: 'room_nsmq_practice',
        senderId: 'user_ama',
        content: 'Just finished a 50-question speed drill! My best time yet 🔥',
        contentType: 'text',
        isEdited: false,
        isDeleted: false,
        createdAt: hourAgo,
        updatedAt: hourAgo,
        sender: { id: 'user_ama', name: 'Ama Mensah' },
        reactions: [{ emoji: '🔥', count: 5, userIds: [], hasReacted: false }],
      },
    },
    {
      id: 'room_chemistry_lab',
      name: 'Chemistry Lab Partners',
      description: 'Discuss practical experiments and lab reports',
      type: 'subject',
      subjectId: 'sub_chemistry',
      examTypeId: 'exam_wassce',
      isArchived: false,
      maxMembers: 100,
      createdBy: 'system',
      createdAt: dayAgo,
      updatedAt: dayAgo,
      memberCount: 67,
      unreadCount: 0,
      myRole: 'member',
    },
  ];
};

// Demo messages for rooms
const getDemoMessages = (): Record<string, ChatMessage[]> => {
  const now = new Date();
  const times = [
    new Date(now.getTime() - 7200000).toISOString(), // 2 hours ago
    new Date(now.getTime() - 3600000).toISOString(), // 1 hour ago
    new Date(now.getTime() - 1800000).toISOString(), // 30 min ago
    new Date(now.getTime() - 600000).toISOString(),  // 10 min ago
    new Date(now.getTime() - 60000).toISOString(),   // 1 min ago
  ];

  return {
    room_wassce_physics: [
      {
        id: 'msg_p1',
        roomId: 'room_wassce_physics',
        senderId: 'user_teacher',
        content: 'Welcome everyone! Feel free to ask any physics questions here. Remember to be respectful and help each other learn.',
        contentType: 'text',
        isEdited: false,
        isDeleted: false,
        createdAt: times[0],
        updatedAt: times[0],
        sender: { id: 'user_teacher', name: 'Mr. Osei (Moderator)' },
        reactions: [{ emoji: '👍', count: 12, userIds: [], hasReacted: false }],
      },
      {
        id: 'msg_p2',
        roomId: 'room_wassce_physics',
        senderId: 'user_kofi',
        content: 'Hello everyone! I\'m struggling with projectile motion. Any tips?',
        contentType: 'text',
        isEdited: false,
        isDeleted: false,
        createdAt: times[1],
        updatedAt: times[1],
        sender: { id: 'user_kofi', name: 'Kofi Boateng' },
        reactions: [],
      },
      {
        id: 'msg_p3',
        roomId: 'room_wassce_physics',
        senderId: 'user_ama',
        content: 'Break it down into horizontal and vertical components! The key formulas are:\n\n• Horizontal: x = v₀cos(θ)t\n• Vertical: y = v₀sin(θ)t - ½gt²\n\nRemember, horizontal velocity stays constant (no air resistance) while vertical velocity changes due to gravity.',
        contentType: 'text',
        isEdited: false,
        isDeleted: false,
        createdAt: times[2],
        updatedAt: times[2],
        sender: { id: 'user_ama', name: 'Ama Mensah' },
        reactions: [{ emoji: '❤️', count: 3, userIds: [], hasReacted: false }, { emoji: '🙏', count: 2, userIds: [], hasReacted: false }],
      },
      {
        id: 'msg_p4',
        roomId: 'room_wassce_physics',
        senderId: 'user_kofi',
        content: 'Thank you Ama! That makes so much more sense now.',
        contentType: 'text',
        isEdited: false,
        isDeleted: false,
        createdAt: times[3],
        updatedAt: times[3],
        sender: { id: 'user_kofi', name: 'Kofi Boateng' },
        replyToId: 'msg_p3',
        replyTo: { id: 'msg_p3', content: 'Break it down into horizontal and vertical...', senderName: 'Ama Mensah' },
        reactions: [],
      },
      {
        id: 'msg_p5',
        roomId: 'room_wassce_physics',
        senderId: 'user_kwame',
        content: 'Can someone explain the difference between velocity and acceleration?',
        contentType: 'text',
        isEdited: false,
        isDeleted: false,
        createdAt: times[4],
        updatedAt: times[4],
        sender: { id: 'user_kwame', name: 'Kwame Asante' },
        reactions: [],
      },
    ],
    room_nsmq_practice: [
      {
        id: 'msg_n1',
        roomId: 'room_nsmq_practice',
        senderId: 'user_yaa',
        content: 'Anyone up for a riddle practice session? I have some from past competitions!',
        contentType: 'text',
        isEdited: false,
        isDeleted: false,
        createdAt: times[0],
        updatedAt: times[0],
        sender: { id: 'user_yaa', name: 'Yaa Asantewaa' },
        reactions: [{ emoji: '🙋', count: 8, userIds: [], hasReacted: false }],
      },
      {
        id: 'msg_n2',
        roomId: 'room_nsmq_practice',
        senderId: 'user_kwesi',
        content: 'Yes! Let\'s do it. I need practice on the speed rounds.',
        contentType: 'text',
        isEdited: false,
        isDeleted: false,
        createdAt: times[1],
        updatedAt: times[1],
        sender: { id: 'user_kwesi', name: 'Kwesi Appiah' },
        reactions: [],
      },
      {
        id: 'msg_n3',
        roomId: 'room_nsmq_practice',
        senderId: 'user_ama',
        content: 'Just finished a 50-question speed drill! My best time yet 🔥',
        contentType: 'text',
        isEdited: false,
        isDeleted: false,
        createdAt: times[4],
        updatedAt: times[4],
        sender: { id: 'user_ama', name: 'Ama Mensah' },
        reactions: [{ emoji: '🔥', count: 5, userIds: [], hasReacted: false }],
      },
    ],
  };
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state - empty, will be populated from API
      isConnected: false,
      connectionError: null,
      ws: null,
      rooms: [],
      activeRoomId: null,
      messagesByRoom: {},
      typingUsers: [],
      isChatOpen: false,
      isRoomListOpen: true,
      activeTab: 'chats',
      searchQuery: '',
      replyingTo: null,
      isLoadingRooms: false,
      isLoadingMessages: false,
      isSendingMessage: false,

      // UI Actions
      openChat: () => set({ isChatOpen: true }),
      closeChat: () => set({ isChatOpen: false, activeRoomId: null }),
      toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setReplyingTo: (message) => set({ replyingTo: message }),

      // Room actions
      fetchRooms: async () => {
        set({ isLoadingRooms: true });
        try {
          // TODO: Replace with API call in production
          // const response = await fetch('/api/chat/rooms');
          // const data = await response.json();
          // set({ rooms: data.rooms });
          await new Promise((resolve) => setTimeout(resolve, 300));

          // Load demo rooms if no rooms exist
          const { rooms } = get();
          if (rooms.length === 0) {
            const demoRooms = getDemoRooms();
            const demoMessages = getDemoMessages();
            set({
              rooms: demoRooms,
              messagesByRoom: demoMessages,
              isLoadingRooms: false,
              isConnected: true,
            });
          } else {
            set({ isLoadingRooms: false, isConnected: true });
          }
        } catch (error) {
          set({
            connectionError: 'Failed to load rooms',
            isLoadingRooms: false,
          });
        }
      },

      fetchMessages: async (roomId: string) => {
        set({ isLoadingMessages: true });
        try {
          // TODO: Replace with API call in production
          // const response = await fetch(`/api/chat/rooms/${roomId}/messages`);
          // const data = await response.json();
          await new Promise((resolve) => setTimeout(resolve, 200));

          const { messagesByRoom } = get();

          // If no messages for this room, check demo messages
          if (!messagesByRoom[roomId]) {
            const demoMessages = getDemoMessages();
            const roomMessages = demoMessages[roomId] || [];
            set({
              messagesByRoom: { ...messagesByRoom, [roomId]: roomMessages },
            });
          }
          set({ isLoadingMessages: false });
        } catch (error) {
          set({
            connectionError: 'Failed to load messages',
            isLoadingMessages: false,
          });
        }
      },

      setActiveRoom: (roomId) => {
        set({ activeRoomId: roomId, replyingTo: null });
        if (roomId) {
          get().fetchMessages(roomId);
          get().markAsRead(roomId);
        }
      },

      createRoom: async (data: CreateRoomData) => {
        const user = getCurrentUser();
        const userId = user?.id || 'anonymous';

        // TODO: Replace with API call
        // const response = await fetch('/api/chat/rooms', {
        //   method: 'POST',
        //   body: JSON.stringify(data),
        // });
        // const newRoom = await response.json();

        const newRoom: ChatRoom = {
          id: `room_${Date.now()}`,
          name: data.name,
          description: data.description,
          type: data.type,
          subjectId: data.subjectId,
          examTypeId: data.examTypeId,
          isArchived: false,
          maxMembers: data.type === 'private' ? 50 : 500,
          createdBy: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          memberCount: 1,
          unreadCount: 0,
          myRole: 'owner',
        };

        set((state) => ({
          rooms: [newRoom, ...state.rooms],
          messagesByRoom: { ...state.messagesByRoom, [newRoom.id]: [] },
        }));

        return newRoom;
      },

      joinRoom: async (roomId: string) => {
        // TODO: API call to join room
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === roomId
              ? { ...room, memberCount: (room.memberCount || 0) + 1 }
              : room
          ),
        }));
      },

      leaveRoom: async (roomId: string) => {
        // TODO: API call to leave room
        set((state) => ({
          rooms: state.rooms.filter((room) => room.id !== roomId),
          activeRoomId: state.activeRoomId === roomId ? null : state.activeRoomId,
        }));
      },

      startDM: async (userId: string, userName: string) => {
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id || 'anonymous';

        // Check if DM already exists
        const existingDM = get().rooms.find(
          (room) => room.type === 'dm' && room.otherUser?.id === userId
        );
        if (existingDM) {
          set({ activeRoomId: existingDM.id });
          return existingDM;
        }

        // TODO: Replace with API call
        // const response = await fetch('/api/chat/dm', {
        //   method: 'POST',
        //   body: JSON.stringify({ userId }),
        // });
        // const newRoom = await response.json();

        const newRoom: ChatRoom = {
          id: `dm_${Date.now()}`,
          type: 'dm',
          isArchived: false,
          maxMembers: 2,
          createdBy: currentUserId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          memberCount: 2,
          unreadCount: 0,
          otherUser: {
            id: userId,
            name: userName,
            isOnline: true,
          },
        };

        set((state) => ({
          rooms: [newRoom, ...state.rooms],
          messagesByRoom: { ...state.messagesByRoom, [newRoom.id]: [] },
          activeRoomId: newRoom.id,
        }));

        return newRoom;
      },

      // Message actions
      sendMessage: async (content: string, replyToId?: string) => {
        const { activeRoomId, messagesByRoom, replyingTo } = get();
        if (!activeRoomId || !content.trim()) return;

        const user = getCurrentUser();
        const userId = user?.id || 'anonymous';
        const userName = user?.name || 'Anonymous';

        set({ isSendingMessage: true });

        // TODO: Replace with API call
        // const response = await fetch(`/api/chat/rooms/${activeRoomId}/messages`, {
        //   method: 'POST',
        //   body: JSON.stringify({ content, replyToId }),
        // });
        // const newMessage = await response.json();

        const newMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          roomId: activeRoomId,
          senderId: userId,
          content: content.trim(),
          contentType: 'text',
          isEdited: false,
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sender: { id: userId, name: userName },
          replyToId: replyToId || replyingTo?.id,
          replyTo: replyingTo
            ? {
                id: replyingTo.id,
                content: replyingTo.content,
                senderName: replyingTo.sender?.name || 'Unknown',
              }
            : undefined,
          reactions: [],
        };

        const roomMessages = messagesByRoom[activeRoomId] || [];
        set({
          messagesByRoom: {
            ...messagesByRoom,
            [activeRoomId]: [...roomMessages, newMessage],
          },
          replyingTo: null,
          isSendingMessage: false,
        });

        // Update last message in room
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === activeRoomId
              ? { ...room, lastMessage: newMessage, updatedAt: newMessage.createdAt }
              : room
          ),
        }));

        // Simulate a response from demo users occasionally (30% chance)
        if (Math.random() < 0.3 && activeRoomId.startsWith('room_')) {
          const demoResponders = [
            { id: 'user_ama', name: 'Ama Mensah' },
            { id: 'user_kofi', name: 'Kofi Boateng' },
            { id: 'user_yaa', name: 'Yaa Asantewaa' },
            { id: 'user_kwesi', name: 'Kwesi Appiah' },
          ];
          const responder = demoResponders[Math.floor(Math.random() * demoResponders.length)];

          // Show typing indicator after 1-2 seconds
          setTimeout(() => {
            get().simulateTyping(responder.name, 2500);
          }, 1000 + Math.random() * 1000);

          // Add response message after typing
          setTimeout(() => {
            const responses = [
              'Great question! Let me think about that...',
              'I agree with you! 👍',
              'That\'s a really good point!',
              'Has anyone tried the practice questions for this topic?',
              'I found a helpful resource for this - will share later!',
              'Thanks for sharing! This is really helpful 🙏',
              'I was just thinking about the same thing!',
              'Let\'s discuss this more in the study session!',
            ];
            const responseContent = responses[Math.floor(Math.random() * responses.length)];

            const responseMessage: ChatMessage = {
              id: `msg_sim_${Date.now()}`,
              roomId: activeRoomId,
              senderId: responder.id,
              content: responseContent,
              contentType: 'text',
              isEdited: false,
              isDeleted: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              sender: responder,
              reactions: [],
            };

            set((state) => ({
              messagesByRoom: {
                ...state.messagesByRoom,
                [activeRoomId]: [...(state.messagesByRoom[activeRoomId] || []), responseMessage],
              },
            }));
          }, 4000 + Math.random() * 1000);
        }
      },

      editMessage: async (messageId: string, newContent: string) => {
        const { activeRoomId, messagesByRoom } = get();
        if (!activeRoomId) return;

        // TODO: API call to edit message
        set({
          messagesByRoom: {
            ...messagesByRoom,
            [activeRoomId]: messagesByRoom[activeRoomId].map((msg) =>
              msg.id === messageId
                ? { ...msg, content: newContent, isEdited: true, updatedAt: new Date().toISOString() }
                : msg
            ),
          },
        });
      },

      deleteMessage: async (messageId: string) => {
        const { activeRoomId, messagesByRoom } = get();
        if (!activeRoomId) return;

        // TODO: API call to delete message
        set({
          messagesByRoom: {
            ...messagesByRoom,
            [activeRoomId]: messagesByRoom[activeRoomId].map((msg) =>
              msg.id === messageId
                ? { ...msg, isDeleted: true, content: 'This message was deleted' }
                : msg
            ),
          },
        });
      },

      addReaction: (messageId: string, emoji: string) => {
        const { activeRoomId, messagesByRoom } = get();
        if (!activeRoomId) return;

        const user = getCurrentUser();
        const userId = user?.id || 'anonymous';

        set({
          messagesByRoom: {
            ...messagesByRoom,
            [activeRoomId]: messagesByRoom[activeRoomId].map((msg) => {
              if (msg.id !== messageId) return msg;

              const reactions = msg.reactions || [];
              const existingReaction = reactions.find((r) => r.emoji === emoji);

              if (existingReaction) {
                if (existingReaction.hasReacted) return msg;
                return {
                  ...msg,
                  reactions: reactions.map((r) =>
                    r.emoji === emoji
                      ? { ...r, count: r.count + 1, userIds: [...r.userIds, userId], hasReacted: true }
                      : r
                  ),
                };
              }

              return {
                ...msg,
                reactions: [...reactions, { emoji, count: 1, userIds: [userId], hasReacted: true }],
              };
            }),
          },
        });
      },

      removeReaction: (messageId: string, emoji: string) => {
        const { activeRoomId, messagesByRoom } = get();
        if (!activeRoomId) return;

        const user = getCurrentUser();
        const userId = user?.id || 'anonymous';

        set({
          messagesByRoom: {
            ...messagesByRoom,
            [activeRoomId]: messagesByRoom[activeRoomId].map((msg) => {
              if (msg.id !== messageId) return msg;

              const reactions = msg.reactions || [];
              return {
                ...msg,
                reactions: reactions
                  .map((r) =>
                    r.emoji === emoji
                      ? {
                          ...r,
                          count: r.count - 1,
                          userIds: r.userIds.filter((id) => id !== userId),
                          hasReacted: false,
                        }
                      : r
                  )
                  .filter((r) => r.count > 0),
              };
            }),
          },
        });
      },

      setTyping: (_isTyping: boolean) => {
        // TODO: Send typing indicator via WebSocket in production
        // For demo, this would broadcast to other users
      },

      // Simulate another user typing (for demo purposes)
      simulateTyping: (userName: string, duration: number = 3000) => {
        const typingUser: ChatTypingUser = {
          id: `typing_${Date.now()}`,
          name: userName,
        };

        set((state) => ({
          typingUsers: [...state.typingUsers, typingUser],
        }));

        // Remove typing indicator after duration
        setTimeout(() => {
          set((state) => ({
            typingUsers: state.typingUsers.filter((u) => u.id !== typingUser.id),
          }));
        }, duration);
      },

      markAsRead: (roomId: string) => {
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === roomId ? { ...room, unreadCount: 0 } : room
          ),
        }));
      },

      clearError: () => set({ connectionError: null }),

      getRoomsByType: (type) => {
        const { rooms, searchQuery } = get();
        let filtered = type === 'all' ? rooms : rooms.filter((room) => room.type === type);

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (room) =>
              room.name?.toLowerCase().includes(query) ||
              room.description?.toLowerCase().includes(query) ||
              room.otherUser?.name.toLowerCase().includes(query)
          );
        }

        return filtered.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      },

      getUnreadCount: () => {
        return get().rooms.reduce((total, room) => total + (room.unreadCount || 0), 0);
      },

      clearAllData: () => {
        set({
          rooms: [],
          activeRoomId: null,
          messagesByRoom: {},
          typingUsers: [],
          isChatOpen: false,
          searchQuery: '',
          replyingTo: null,
        });
      },
    }),
    {
      name: 'brilla-chat',
      version: STORE_VERSION,
      partialize: (state) => ({
        rooms: state.rooms,
        messagesByRoom: state.messagesByRoom,
      }),
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ChatRoom,
  ChatMessage,
  ChatTypingUser,
  CreateRoomData,
  ChatRoomType,
} from '@/types';
import { getApiUrl, getAuthHeaders } from '../utils/api';

interface ChatState {
  // Connection state
  isConnected: boolean;
  connectionError: string | null;
  ws: WebSocket | null;
  pollingInterval: NodeJS.Timeout | null;
  lastPollTime: string | null;

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

  // Polling
  startPolling: () => void;
  stopPolling: () => void;
  pollForUpdates: () => Promise<void>;

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
const STORE_VERSION = 6;
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
    // WASSCE Rooms
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
      memberCount: 1,
      unreadCount: 0,
      myRole: 'member',
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
      memberCount: 1,
      unreadCount: 0,
      myRole: 'member',
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
      memberCount: 1,
      unreadCount: 0,
      myRole: 'member',
    },
    // NSMQ Rooms
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
      memberCount: 1,
      unreadCount: 0,
      myRole: 'member',
    },
    // BECE Rooms
    {
      id: 'room_bece_maths',
      name: 'BECE Mathematics Study Group',
      description: 'Get help with JHS mathematics and BECE prep',
      type: 'subject',
      subjectId: 'sub_maths',
      examTypeId: 'exam_bece',
      isArchived: false,
      maxMembers: 500,
      createdBy: 'system',
      createdAt: dayAgo,
      updatedAt: hourAgo,
      memberCount: 1,
      unreadCount: 0,
      myRole: 'member',
    },
    {
      id: 'room_bece_english',
      name: 'BECE English Language Help',
      description: 'Improve your English comprehension and writing skills',
      type: 'subject',
      subjectId: 'sub_english',
      examTypeId: 'exam_bece',
      isArchived: false,
      maxMembers: 500,
      createdBy: 'system',
      createdAt: dayAgo,
      updatedAt: now,
      memberCount: 1,
      unreadCount: 0,
      myRole: 'member',
    },
    {
      id: 'room_bece_science',
      name: 'BECE Integrated Science',
      description: 'Discuss science concepts and prepare for BECE practicals',
      type: 'subject',
      subjectId: 'sub_science',
      examTypeId: 'exam_bece',
      isArchived: false,
      maxMembers: 500,
      createdBy: 'system',
      createdAt: dayAgo,
      updatedAt: dayAgo,
      memberCount: 1,
      unreadCount: 0,
      myRole: 'member',
    },
  ];
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
          const user = getCurrentUser();
          if (!user?.id) {
            // Use demo rooms if not authenticated
            const demoRooms = getDemoRooms();
            set({ rooms: demoRooms, isLoadingRooms: false, isConnected: true });
            return;
          }

          const response = await fetch(getApiUrl('/api/chat/rooms'), {
            headers: {
              ...getAuthHeaders(),
              'x-user-id': user.id,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch rooms');
          }

          const data = await response.json();

          if (data.success && data.data) {
            set({
              rooms: data.data,
              isLoadingRooms: false,
              isConnected: true,
            });
          } else {
            // Fallback to demo rooms
            const demoRooms = getDemoRooms();
            set({ rooms: demoRooms, isLoadingRooms: false, isConnected: true });
          }
        } catch {
          // Fallback to demo rooms on error
          const { rooms } = get();
          if (rooms.length === 0) {
            const demoRooms = getDemoRooms();
            set({ rooms: demoRooms, isLoadingRooms: false, isConnected: true });
          } else {
            set({ isLoadingRooms: false, isConnected: true });
          }
        }
      },

      fetchMessages: async (roomId: string) => {
        set({ isLoadingMessages: true });
        try {
          const user = getCurrentUser();
          if (!user?.id) {
            const { messagesByRoom } = get();
            if (!messagesByRoom[roomId]) {
              set({ messagesByRoom: { ...messagesByRoom, [roomId]: [] } });
            }
            set({ isLoadingMessages: false });
            return;
          }

          const response = await fetch(getApiUrl(`/api/chat/rooms/${roomId}/messages`), {
            headers: {
              ...getAuthHeaders(),
              'x-user-id': user.id,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch messages');
          }

          const data = await response.json();
          const { messagesByRoom } = get();

          if (data.success && data.data) {
            set({
              messagesByRoom: { ...messagesByRoom, [roomId]: data.data },
              isLoadingMessages: false,
              lastPollTime: new Date().toISOString(),
            });
          } else {
            if (!messagesByRoom[roomId]) {
              set({ messagesByRoom: { ...messagesByRoom, [roomId]: [] } });
            }
            set({ isLoadingMessages: false });
          }
        } catch {
          const { messagesByRoom } = get();
          if (!messagesByRoom[roomId]) {
            set({ messagesByRoom: { ...messagesByRoom, [roomId]: [] } });
          }
          set({ isLoadingMessages: false });
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

        try {
          if (user?.id) {
            const response = await fetch(getApiUrl('/api/chat/rooms'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
                'x-user-id': user.id,
              },
              body: JSON.stringify(data),
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                const newRoom: ChatRoom = {
                  ...result.data,
                  memberCount: 1,
                  unreadCount: 0,
                  myRole: 'owner',
                };

                set((state) => ({
                  rooms: [newRoom, ...state.rooms],
                  messagesByRoom: { ...state.messagesByRoom, [newRoom.id]: [] },
                }));

                return newRoom;
              }
            }
          }
        } catch {
          // Fallback to local creation
        }

        // Fallback: create room locally
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
        const user = getCurrentUser();

        try {
          if (user?.id) {
            const response = await fetch(getApiUrl(`/api/chat/rooms/${roomId}/join`), {
              method: 'POST',
              headers: {
                ...getAuthHeaders(),
                'x-user-id': user.id,
              },
            });

            if (response.ok) {
              // Refresh rooms to get updated data
              get().fetchRooms();
              return;
            }
          }
        } catch {
          // Fallback to local update
        }

        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === roomId
              ? { ...room, memberCount: (room.memberCount || 0) + 1, myRole: 'member' }
              : room
          ),
        }));
      },

      leaveRoom: async (roomId: string) => {
        const user = getCurrentUser();

        try {
          if (user?.id) {
            await fetch(getApiUrl(`/api/chat/rooms/${roomId}/leave`), {
              method: 'POST',
              headers: {
                ...getAuthHeaders(),
                'x-user-id': user.id,
              },
            });
          }
        } catch {
          // Continue with local update
        }

        set((state) => ({
          rooms: state.rooms.filter((room) => room.id !== roomId),
          activeRoomId: state.activeRoomId === roomId ? null : state.activeRoomId,
        }));
      },

      startDM: async (userId: string, userName: string) => {
        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.id || 'anonymous';

        // Check if DM already exists locally
        const existingDM = get().rooms.find(
          (room) => room.type === 'dm' && room.otherUser?.id === userId
        );
        if (existingDM) {
          set({ activeRoomId: existingDM.id });
          return existingDM;
        }

        try {
          if (currentUser?.id) {
            const response = await fetch(getApiUrl('/api/chat/dm'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
                'x-user-id': currentUser.id,
              },
              body: JSON.stringify({ targetUserId: userId }),
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                const newRoom: ChatRoom = {
                  id: result.data.roomId,
                  type: 'dm',
                  isArchived: false,
                  maxMembers: 2,
                  createdBy: currentUserId,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  memberCount: 2,
                  unreadCount: 0,
                  otherUser: result.data.otherUser,
                };

                if (!result.data.isNew) {
                  // DM already existed on server
                  set({ activeRoomId: newRoom.id });
                  get().fetchRooms(); // Refresh to get the room
                  return newRoom;
                }

                set((state) => ({
                  rooms: [newRoom, ...state.rooms],
                  messagesByRoom: { ...state.messagesByRoom, [newRoom.id]: [] },
                  activeRoomId: newRoom.id,
                }));

                return newRoom;
              }
            }
          }
        } catch {
          // Fallback to local creation
        }

        // Fallback: create DM locally
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

        // Create optimistic message
        const tempId = `msg_${Date.now()}`;
        const newMessage: ChatMessage = {
          id: tempId,
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

        // Optimistically add message
        const roomMessages = messagesByRoom[activeRoomId] || [];
        set({
          messagesByRoom: {
            ...messagesByRoom,
            [activeRoomId]: [...roomMessages, newMessage],
          },
          replyingTo: null,
        });

        try {
          if (user?.id) {
            const response = await fetch(getApiUrl(`/api/chat/rooms/${activeRoomId}/messages`), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
                'x-user-id': user.id,
              },
              body: JSON.stringify({
                content: content.trim(),
                replyToId: replyToId || replyingTo?.id,
              }),
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                // Replace temp message with server response
                set((state) => ({
                  messagesByRoom: {
                    ...state.messagesByRoom,
                    [activeRoomId]: state.messagesByRoom[activeRoomId].map((msg) =>
                      msg.id === tempId ? { ...result.data, reactions: [] } : msg
                    ),
                  },
                }));
              }
            }
          }
        } catch {
          // Keep optimistic message on error
        }

        set({ isSendingMessage: false });

        // Update last message in room
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === activeRoomId
              ? { ...room, lastMessage: newMessage, updatedAt: newMessage.createdAt }
              : room
          ),
        }));
      },

      editMessage: async (messageId: string, newContent: string) => {
        const { activeRoomId, messagesByRoom } = get();
        if (!activeRoomId) return;

        const user = getCurrentUser();

        // Optimistic update
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

        try {
          if (user?.id) {
            await fetch(getApiUrl(`/api/chat/messages/${messageId}`), {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
                'x-user-id': user.id,
              },
              body: JSON.stringify({ content: newContent }),
            });
          }
        } catch {
          // Keep optimistic update
        }
      },

      deleteMessage: async (messageId: string) => {
        const { activeRoomId, messagesByRoom } = get();
        if (!activeRoomId) return;

        const user = getCurrentUser();

        // Optimistic update
        set({
          messagesByRoom: {
            ...messagesByRoom,
            [activeRoomId]: messagesByRoom[activeRoomId].map((msg) =>
              msg.id === messageId
                ? { ...msg, isDeleted: true, content: '[Message deleted]' }
                : msg
            ),
          },
        });

        try {
          if (user?.id) {
            await fetch(getApiUrl(`/api/chat/messages/${messageId}`), {
              method: 'DELETE',
              headers: {
                ...getAuthHeaders(),
                'x-user-id': user.id,
              },
            });
          }
        } catch {
          // Keep optimistic update
        }
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

      setTyping: async (isTyping: boolean) => {
        const { activeRoomId } = get();
        if (!activeRoomId || !isTyping) return;

        const user = getCurrentUser();
        if (!user?.id) return;

        try {
          await fetch(getApiUrl(`/api/chat/rooms/${activeRoomId}/typing`), {
            method: 'POST',
            headers: {
              ...getAuthHeaders(),
              'x-user-id': user.id,
            },
          });
        } catch {
          // Ignore typing indicator errors
        }
      },

      // Polling functions
      startPolling: () => {
        const { pollingInterval } = get();
        if (pollingInterval) return; // Already polling

        const interval = setInterval(() => {
          get().pollForUpdates();
        }, 3000); // Poll every 3 seconds

        set({ pollingInterval: interval });
      },

      stopPolling: () => {
        const { pollingInterval } = get();
        if (pollingInterval) {
          clearInterval(pollingInterval);
          set({ pollingInterval: null });
        }
      },

      pollForUpdates: async () => {
        const { activeRoomId, lastPollTime, messagesByRoom } = get();
        if (!activeRoomId) return;

        const user = getCurrentUser();
        if (!user?.id) return;

        try {
          const since = lastPollTime || new Date(Date.now() - 60000).toISOString();
          const response = await fetch(
            getApiUrl(`/api/chat/rooms/${activeRoomId}/poll?since=${encodeURIComponent(since)}`),
            {
              headers: {
                ...getAuthHeaders(),
                'x-user-id': user.id,
              },
            }
          );

          if (!response.ok) return;

          const result = await response.json();
          if (!result.success || !result.data) return;

          const { messages, typingUsers, serverTime } = result.data;

          // Add new messages (avoid duplicates)
          if (messages && messages.length > 0) {
            const currentMessages = messagesByRoom[activeRoomId] || [];
            const currentIds = new Set(currentMessages.map((m) => m.id));
            const newMessages = messages.filter((m: ChatMessage) => !currentIds.has(m.id));

            if (newMessages.length > 0) {
              set((state) => ({
                messagesByRoom: {
                  ...state.messagesByRoom,
                  [activeRoomId]: [...currentMessages, ...newMessages],
                },
              }));
            }
          }

          // Update typing users
          set({
            typingUsers: typingUsers || [],
            lastPollTime: serverTime || new Date().toISOString(),
          });
        } catch {
          // Ignore polling errors
        }
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

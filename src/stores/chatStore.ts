import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ChatRoom,
  ChatMessage,
  ChatTypingUser,
  CreateRoomData,
  ChatRoomType,
} from '@/types';

// Mock data for demo
const mockRooms: ChatRoom[] = [
  {
    id: 'room_wassce_physics',
    name: 'WASSCE Physics 2025',
    description: 'Discuss physics topics, share resources, and help each other prepare for WASSCE',
    type: 'subject',
    subjectId: 'subj_wassce_physics',
    examTypeId: 'exam_wassce',
    isArchived: false,
    maxMembers: 500,
    createdBy: 'user_admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    memberCount: 156,
    unreadCount: 3,
  },
  {
    id: 'room_wassce_math',
    name: 'WASSCE Core Math',
    description: 'Core Mathematics discussion and study group',
    type: 'subject',
    subjectId: 'subj_wassce_core_math',
    examTypeId: 'exam_wassce',
    isArchived: false,
    maxMembers: 500,
    createdBy: 'user_admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    memberCount: 234,
    unreadCount: 0,
  },
  {
    id: 'room_nsmq_prep',
    name: 'NSMQ Prep Zone',
    description: 'General NSMQ preparation discussions',
    type: 'public',
    examTypeId: 'exam_nsmq',
    isArchived: false,
    maxMembers: 500,
    createdBy: 'user_admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    memberCount: 89,
    unreadCount: 5,
  },
  {
    id: 'room_study_group_1',
    name: 'Elite Study Squad',
    description: 'Private study group for serious WASSCE prep',
    type: 'private',
    isArchived: false,
    maxMembers: 20,
    createdBy: 'user_demo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    memberCount: 8,
    unreadCount: 12,
    myRole: 'owner',
  },
];

const mockMessages: Record<string, ChatMessage[]> = {
  room_wassce_physics: [
    {
      id: 'msg_1',
      roomId: 'room_wassce_physics',
      senderId: 'user_1',
      content: 'Can someone explain the concept of electromagnetic induction?',
      contentType: 'text',
      isEdited: false,
      isDeleted: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      sender: { id: 'user_1', name: 'Kofi Mensah' },
      reactions: [{ emoji: '👍', count: 3, userIds: ['user_2', 'user_3', 'user_4'], hasReacted: false }],
    },
    {
      id: 'msg_2',
      roomId: 'room_wassce_physics',
      senderId: 'user_2',
      content: 'Sure! Electromagnetic induction is the production of voltage across an electrical conductor in a changing magnetic field. Faraday\'s law states that the induced EMF is proportional to the rate of change of magnetic flux.',
      contentType: 'text',
      isEdited: false,
      isDeleted: false,
      createdAt: new Date(Date.now() - 3500000).toISOString(),
      updatedAt: new Date(Date.now() - 3500000).toISOString(),
      sender: { id: 'user_2', name: 'Ama Asante' },
      replyToId: 'msg_1',
      replyTo: { id: 'msg_1', content: 'Can someone explain the concept of electromagnetic induction?', senderName: 'Kofi Mensah' },
    },
    {
      id: 'msg_3',
      roomId: 'room_wassce_physics',
      senderId: 'user_3',
      content: 'The formula is: EMF = -N × (dΦ/dt) where N is the number of turns and dΦ/dt is the rate of change of flux',
      contentType: 'text',
      isEdited: false,
      isDeleted: false,
      createdAt: new Date(Date.now() - 3400000).toISOString(),
      updatedAt: new Date(Date.now() - 3400000).toISOString(),
      sender: { id: 'user_3', name: 'Kwame Boateng' },
    },
    {
      id: 'msg_4',
      roomId: 'room_wassce_physics',
      senderId: 'user_1',
      content: 'Thanks! This really helps. Does anyone have practice questions on this topic?',
      contentType: 'text',
      isEdited: false,
      isDeleted: false,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
      sender: { id: 'user_1', name: 'Kofi Mensah' },
      reactions: [{ emoji: '🙏', count: 1, userIds: ['user_2'], hasReacted: false }],
    },
  ],
};

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

  // Utility
  markAsRead: (roomId: string) => void;
  clearError: () => void;
  getRoomsByType: (type: ChatRoomType | 'all') => ChatRoom[];
  getUnreadCount: () => number;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: false,
      connectionError: null,
      ws: null,
      rooms: mockRooms,
      activeRoomId: null,
      messagesByRoom: mockMessages,
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
          // TODO: Replace with API call
          // const response = await fetch('/api/chat/rooms');
          // const data = await response.json();
          // set({ rooms: data.rooms });
          await new Promise((resolve) => setTimeout(resolve, 500));
          set({ isLoadingRooms: false });
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
          // TODO: Replace with API call
          await new Promise((resolve) => setTimeout(resolve, 300));

          // Initialize empty messages array if room doesn't have messages
          const { messagesByRoom } = get();
          if (!messagesByRoom[roomId]) {
            set({
              messagesByRoom: { ...messagesByRoom, [roomId]: [] },
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
        const newRoom: ChatRoom = {
          id: `room_${Date.now()}`,
          name: data.name,
          description: data.description,
          type: data.type,
          subjectId: data.subjectId,
          examTypeId: data.examTypeId,
          isArchived: false,
          maxMembers: data.type === 'private' ? 50 : 500,
          createdBy: 'user_demo',
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
        // Check if DM already exists
        const existingDM = get().rooms.find(
          (room) => room.type === 'dm' && room.otherUser?.id === userId
        );
        if (existingDM) {
          set({ activeRoomId: existingDM.id });
          return existingDM;
        }

        // Create new DM
        const newRoom: ChatRoom = {
          id: `dm_${Date.now()}`,
          type: 'dm',
          isArchived: false,
          maxMembers: 2,
          createdBy: 'user_demo',
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

        set({ isSendingMessage: true });

        const newMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          roomId: activeRoomId,
          senderId: 'user_demo',
          content: content.trim(),
          contentType: 'text',
          isEdited: false,
          isDeleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sender: { id: 'user_demo', name: 'Demo Student' },
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
      },

      editMessage: async (messageId: string, newContent: string) => {
        const { activeRoomId, messagesByRoom } = get();
        if (!activeRoomId) return;

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
                      ? { ...r, count: r.count + 1, userIds: [...r.userIds, 'user_demo'], hasReacted: true }
                      : r
                  ),
                };
              }

              return {
                ...msg,
                reactions: [...reactions, { emoji, count: 1, userIds: ['user_demo'], hasReacted: true }],
              };
            }),
          },
        });
      },

      removeReaction: (messageId: string, emoji: string) => {
        const { activeRoomId, messagesByRoom } = get();
        if (!activeRoomId) return;

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
                          userIds: r.userIds.filter((id) => id !== 'user_demo'),
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
        // TODO: Send typing indicator via WebSocket
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
    }),
    {
      name: 'brilla-chat',
      partialize: (state) => ({
        rooms: state.rooms,
        activeRoomId: state.activeRoomId,
      }),
    }
  )
);

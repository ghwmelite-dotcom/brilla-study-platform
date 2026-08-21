import { useState } from 'react';
import { X, Search, Plus, Users, MessageSquare, Hash } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { cn } from '@/utils';
import { ChatRoomList } from './ChatRoomList';
import { ChatRoom } from './ChatRoom';
import { ChatCreateRoom } from './ChatCreateRoom';
import { ChatUserSearch } from './ChatUserSearch';

type Tab = 'chats' | 'rooms' | 'people';

export function ChatSidebar() {
  const {
    isChatOpen,
    closeChat,
    activeRoomId,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
  } = useChatStore();

  const [showCreateRoom, setShowCreateRoom] = useState(false);

  if (!isChatOpen) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'chats', label: 'Chats', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'rooms', label: 'Rooms', icon: <Hash className="w-4 h-4" /> },
    { id: 'people', label: 'People', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-[55] lg:hidden"
        onClick={closeChat}
      />

      {/* Chat panel */}
      <div
        className={cn(
          'fixed z-[60] bg-white shadow-2xl flex flex-col',
          // Mobile: full screen
          'inset-x-0 bottom-0 top-0',
          // Desktop: fixed panel on left
          'sm:inset-auto sm:left-4 sm:bottom-4 sm:top-auto',
          'sm:w-[400px] sm:h-[min(700px,calc(100vh-2rem))] sm:rounded-xl',
          'max-h-[100dvh] sm:max-h-none'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-neutral-200 bg-gradient-to-r from-secondary to-accent sm:rounded-t-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="text-white">
              <h3 className="font-semibold text-sm sm:text-base">Community Chat</h3>
              <p className="text-xs text-white/80">Connect with students</p>
            </div>
          </div>
          <button
            onClick={closeChat}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Active room view or room list */}
        {activeRoomId ? (
          <ChatRoom />
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-neutral-200 shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-neutral-500 hover:text-neutral-700'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search bar */}
            <div className="p-3 border-b border-neutral-100 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'people'
                      ? 'Search users...'
                      : activeTab === 'rooms'
                      ? 'Search rooms...'
                      : 'Search chats...'
                  }
                  className="w-full pl-10 pr-4 py-2 bg-neutral-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'people' ? (
                <ChatUserSearch />
              ) : (
                <ChatRoomList type={activeTab === 'rooms' ? 'public' : 'all'} />
              )}
            </div>

            {/* Create room button (for rooms tab) */}
            {activeTab === 'rooms' && (
              <div className="p-3 border-t border-neutral-200 shrink-0">
                <button
                  onClick={() => setShowCreateRoom(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Room
                </button>
              </div>
            )}

          </>
        )}
      </div>

      {/* Modals */}
      {showCreateRoom && <ChatCreateRoom onClose={() => setShowCreateRoom(false)} />}
    </>
  );
}

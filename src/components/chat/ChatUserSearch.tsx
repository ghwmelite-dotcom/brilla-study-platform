import { useState, useEffect } from 'react';
import { Search, MessageSquare, Users } from 'lucide-react';
import { useChatStore } from '@/stores';
import { cn } from '@/utils';

interface SearchUser {
  id: string;
  name: string;
  house?: string;
  level: number;
  isOnline: boolean;
  avatarUrl?: string;
}

export function ChatUserSearch() {
  const { startDM, searchQuery, rooms } = useChatStore();
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setUsers([]);
        return;
      }

      setIsSearching(true);
      try {
        // TODO: Replace with API call
        // const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        // const data = await response.json();
        // setUsers(data.users);
        await new Promise((resolve) => setTimeout(resolve, 300));
        setUsers([]);
      } catch (error) {
        console.error('Failed to search users:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Check if DM already exists with user
  const hasDMWith = (userId: string) => {
    return rooms.some((room) => room.type === 'dm' && room.otherUser?.id === userId);
  };

  const handleStartDM = async (user: SearchUser) => {
    setIsLoading(true);
    try {
      await startDM(user.id, user.name);
    } catch (error) {
      console.error('Failed to start DM:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Empty state - no search query
  if (!searchQuery.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <Users className="w-12 h-12 text-neutral-300 mb-3" />
        <p className="text-neutral-500 text-sm">Find students to connect with</p>
        <p className="text-neutral-400 text-xs mt-1">Search by name to start a conversation</p>
      </div>
    );
  }

  // Loading state
  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // No results
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <Search className="w-12 h-12 text-neutral-300 mb-3" />
        <p className="text-neutral-500 text-sm">No users found</p>
        <p className="text-neutral-400 text-xs mt-1">Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-100">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors"
        >
          {/* Avatar */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {/* Online indicator */}
            <span
              className={cn(
                'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
                user.isOnline ? 'bg-green-500' : 'bg-neutral-400'
              )}
            />
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-neutral-900 truncate">{user.name}</h4>
              <span className="text-xs text-primary">Lv. {user.level}</span>
            </div>
            {user.house && <p className="text-xs text-neutral-500">{user.house}</p>}
          </div>

          {/* Message button */}
          <button
            onClick={() => handleStartDM(user)}
            disabled={isLoading}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              hasDMWith(user.id)
                ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                : 'bg-primary text-white hover:bg-primary-dark'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            {hasDMWith(user.id) ? 'Chat' : 'Message'}
          </button>
        </div>
      ))}
    </div>
  );
}

import { useState } from 'react';
import { Search, MessageSquare } from 'lucide-react';
import { useChatStore } from '@/stores';
import { cn } from '@/utils';

// Mock users for demo
const mockUsers = [
  { id: 'user_1', name: 'Kofi Mensah', house: 'Blue House', level: 5, isOnline: true },
  { id: 'user_2', name: 'Ama Asante', house: 'Red House', level: 8, isOnline: true },
  { id: 'user_3', name: 'Kwame Boateng', house: 'Green House', level: 12, isOnline: false },
  { id: 'user_4', name: 'Akua Adjei', house: 'Yellow House', level: 6, isOnline: true },
  { id: 'user_5', name: 'Yaw Owusu', house: 'Blue House', level: 4, isOnline: false },
  { id: 'user_6', name: 'Efua Mensah', house: 'Red House', level: 9, isOnline: true },
  { id: 'user_7', name: 'Kojo Ansah', house: 'Green House', level: 7, isOnline: false },
  { id: 'user_8', name: 'Abena Osei', house: 'Yellow House', level: 11, isOnline: true },
];

export function ChatUserSearch() {
  const { startDM, searchQuery, rooms } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);

  // Filter users based on search query
  const filteredUsers = mockUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if DM already exists with user
  const hasDMWith = (userId: string) => {
    return rooms.some((room) => room.type === 'dm' && room.otherUser?.id === userId);
  };

  const handleStartDM = async (user: typeof mockUsers[0]) => {
    setIsLoading(true);
    try {
      await startDM(user.id, user.name);
    } catch (error) {
      console.error('Failed to start DM:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (filteredUsers.length === 0) {
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
      {filteredUsers.map((user) => (
        <div
          key={user.id}
          className="flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors"
        >
          {/* Avatar */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </span>
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
            <p className="text-xs text-neutral-500">{user.house}</p>
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

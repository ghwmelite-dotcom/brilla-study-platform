import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  Hash,
  Lock,
  BookOpen,
  TrendingUp,
  Search,
  Plus,
  ArrowRight,
  Star,
  Clock,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { useChatStore, useExamStore } from '@/stores';
import { cn } from '@/utils';
import { ChatCreateRoom } from '@/components/chat';

interface OnlineUser {
  id: string;
  name: string;
  house?: string;
  level: number;
  avatarUrl?: string;
}

interface FeaturedRoom {
  id: string;
  name: string;
  members: number;
  isHot?: boolean;
}

interface RecentDiscussion {
  room: string;
  topic: string;
  replies: number;
  time: string;
  author: string;
}

export function CommunityPage() {
  const { currentExamType } = useExamStore();
  const {
    rooms,
    openChat,
    setActiveRoom,
    setActiveTab,
    startDM,
    isLoadingRooms,
    fetchRooms,
  } = useChatStore();

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [featuredRooms, setFeaturedRooms] = useState<FeaturedRoom[]>([]);
  const [recentDiscussions, setRecentDiscussions] = useState<RecentDiscussion[]>([]);
  const [isLoadingOnline, setIsLoadingOnline] = useState(false);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchRooms();
    fetchOnlineUsers();
    fetchFeaturedRooms();
    fetchRecentDiscussions();
  }, [currentExamType]);

  const fetchOnlineUsers = async () => {
    setIsLoadingOnline(true);
    try {
      // TODO: Replace with API call in production
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Demo online users
      const demoUsers: OnlineUser[] = [
        { id: 'user_ama', name: 'Ama Mensah', house: 'Blue House', level: 15, avatarUrl: undefined },
        { id: 'user_kofi', name: 'Kofi Boateng', house: 'Red House', level: 12, avatarUrl: undefined },
        { id: 'user_yaa', name: 'Yaa Asantewaa', house: 'Green House', level: 18, avatarUrl: undefined },
        { id: 'user_kwesi', name: 'Kwesi Appiah', house: 'Yellow House', level: 10, avatarUrl: undefined },
        { id: 'user_abena', name: 'Abena Osei', house: 'Blue House', level: 14, avatarUrl: undefined },
        { id: 'user_kojo', name: 'Kojo Mensah', house: 'Red House', level: 9, avatarUrl: undefined },
      ];
      setOnlineUsers(demoUsers);
    } catch (error) {
      console.error('Failed to fetch online users:', error);
    } finally {
      setIsLoadingOnline(false);
    }
  };

  const fetchFeaturedRooms = async () => {
    setIsLoadingFeatured(true);
    try {
      // TODO: Replace with API call in production
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Demo featured rooms based on exam type
      const demoFeatured: FeaturedRoom[] = currentExamType === 'nsmq'
        ? [
            { id: 'room_nsmq_practice', name: 'NSMQ Speed Drills', members: 89, isHot: true },
            { id: 'room_nsmq_riddles', name: 'Riddle Masters', members: 67 },
          ]
        : [
            { id: 'room_wassce_physics', name: 'WASSCE Physics Study Group', members: 156, isHot: true },
            { id: 'room_wassce_maths', name: 'WASSCE Mathematics Help', members: 234 },
            { id: 'room_chemistry_lab', name: 'Chemistry Lab Partners', members: 67 },
          ];
      setFeaturedRooms(demoFeatured);
    } catch (error) {
      console.error('Failed to fetch featured rooms:', error);
    } finally {
      setIsLoadingFeatured(false);
    }
  };

  const fetchRecentDiscussions = async () => {
    try {
      // TODO: Replace with API call in production
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Demo recent discussions
      const demoDiscussions: RecentDiscussion[] = [
        {
          room: 'WASSCE Physics Study Group',
          topic: 'Can someone explain the difference between velocity and acceleration?',
          replies: 3,
          time: '1 hour ago',
          author: 'Kwame Asante',
        },
        {
          room: 'NSMQ Speed Drills',
          topic: 'Just finished a 50-question speed drill! My best time yet',
          replies: 8,
          time: '2 hours ago',
          author: 'Ama Mensah',
        },
        {
          room: 'Chemistry Lab Partners',
          topic: 'Tips for qualitative analysis practicals?',
          replies: 5,
          time: '3 hours ago',
          author: 'Yaa Asantewaa',
        },
      ];
      setRecentDiscussions(demoDiscussions);
    } catch (error) {
      console.error('Failed to fetch recent discussions:', error);
    }
  };

  // Filter rooms based on current exam type
  const myRooms = rooms.filter(
    room => room.type !== 'dm' &&
    (room.examTypeId === `exam_${currentExamType}` || !room.examTypeId)
  ).slice(0, 4);

  const handleOpenRoom = (roomId: string) => {
    setActiveRoom(roomId);
    openChat();
  };

  const handleBrowseRooms = () => {
    setActiveTab('rooms');
    openChat();
  };

  const handleFindPeople = () => {
    setActiveTab('people');
    openChat();
  };

  const handleStartDM = async (userId: string, userName: string) => {
    await startDM(userId, userName);
    openChat();
  };

  const examColors = {
    nsmq: 'from-amber-500 to-orange-600',
    wassce: 'from-indigo-500 to-purple-600',
    bece: 'from-emerald-500 to-teal-600',
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Community</h1>
          <p className="text-neutral-500">Connect, collaborate, and learn together</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateRoom(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Room
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => { setActiveTab('chats'); openChat(); }}
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow text-left"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-neutral-900">My Chats</p>
            <p className="text-xs text-neutral-500">View messages</p>
          </div>
        </button>

        <button
          onClick={handleBrowseRooms}
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow text-left"
        >
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Hash className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-neutral-900">Browse Rooms</p>
            <p className="text-xs text-neutral-500">Join study groups</p>
          </div>
        </button>

        <button
          onClick={handleFindPeople}
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow text-left"
        >
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-neutral-900">Find Students</p>
            <p className="text-xs text-neutral-500">Connect with peers</p>
          </div>
        </button>

        <button
          onClick={() => setShowCreateRoom(true)}
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow text-left"
        >
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Plus className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="font-medium text-neutral-900">New Room</p>
            <p className="text-xs text-neutral-500">Start a group</p>
          </div>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Featured Study Rooms */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className={cn(
              'px-5 py-4 bg-gradient-to-r text-white',
              examColors[currentExamType]
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5" />
                  <h2 className="font-semibold">
                    Featured {currentExamType.toUpperCase()} Study Rooms
                  </h2>
                </div>
                <button
                  onClick={handleBrowseRooms}
                  className="text-sm text-white/80 hover:text-white flex items-center gap-1"
                >
                  View all <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isLoadingFeatured ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
              </div>
            ) : featuredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <BookOpen className="w-12 h-12 text-neutral-300 mb-3" />
                <p className="text-neutral-500 text-sm">No featured rooms yet</p>
                <p className="text-neutral-400 text-xs mt-1">Create the first study room for {currentExamType.toUpperCase()}</p>
                <button
                  onClick={() => setShowCreateRoom(true)}
                  className="mt-4 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Create Room
                </button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {featuredRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleOpenRoom(room.id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors text-left"
                  >
                    <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-neutral-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-neutral-900">{room.name}</h3>
                      <p className="text-sm text-neutral-500">{room.members} members active</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* My Study Rooms */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Hash className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-neutral-900">My Study Rooms</h2>
                </div>
                <button
                  onClick={() => { setActiveTab('chats'); openChat(); }}
                  className="text-sm text-primary hover:text-primary-dark flex items-center gap-1"
                >
                  View all <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isLoadingRooms ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
              </div>
            ) : myRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Hash className="w-12 h-12 text-neutral-300 mb-3" />
                <p className="text-neutral-500 text-sm">You haven't joined any rooms yet</p>
                <p className="text-neutral-400 text-xs mt-1">Browse rooms or create your own</p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleBrowseRooms}
                    className="px-4 py-2 border border-neutral-300 text-neutral-700 text-sm rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Browse Rooms
                  </button>
                  <button
                    onClick={() => setShowCreateRoom(true)}
                    className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Create Room
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {myRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleOpenRoom(room.id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors text-left"
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      room.type === 'private' ? 'bg-amber-100' : 'bg-primary/10'
                    )}>
                      {room.type === 'private' ? (
                        <Lock className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Hash className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-neutral-900 truncate">{room.name}</h3>
                      <p className="text-sm text-neutral-500">
                        {room.memberCount} members
                        {room.unreadCount && room.unreadCount > 0 && (
                          <span className="ml-2 text-primary font-medium">
                            • {room.unreadCount} new
                          </span>
                        )}
                      </p>
                    </div>
                    {room.unreadCount && room.unreadCount > 0 && (
                      <span className="min-w-[24px] h-6 px-2 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {room.unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent Discussions */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-neutral-500" />
                <h2 className="font-semibold text-neutral-900">Recent Discussions</h2>
              </div>
            </div>

            {recentDiscussions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageSquare className="w-12 h-12 text-neutral-300 mb-3" />
                <p className="text-neutral-500 text-sm">No recent discussions</p>
                <p className="text-neutral-400 text-xs mt-1">Start a conversation in a study room</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {recentDiscussions.map((discussion, i) => (
                  <button
                    key={i}
                    onClick={handleBrowseRooms}
                    className="w-full p-4 hover:bg-neutral-50 transition-colors text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900 truncate">
                          {discussion.topic}
                        </p>
                        <p className="text-sm text-neutral-500 mt-1">
                          in <span className="text-primary">{discussion.room}</span>
                          {' • '}{discussion.replies} replies
                          {' • '}{discussion.time}
                        </p>
                      </div>
                      <span className="text-xs text-neutral-400 whitespace-nowrap">
                        by {discussion.author}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Search */}
          <div className="bg-white rounded-xl shadow-card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rooms & users..."
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Online Now */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <h3 className="font-semibold text-neutral-900">Online Now</h3>
                </div>
                <span className="text-xs text-neutral-500">{onlineUsers.length} students</span>
              </div>
            </div>

            {isLoadingOnline ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
              </div>
            ) : onlineUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Users className="w-10 h-10 text-neutral-300 mb-2" />
                <p className="text-neutral-500 text-sm">No students online</p>
                <p className="text-neutral-400 text-xs mt-1">Check back later</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-neutral-100">
                  {onlineUsers.slice(0, 5).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleStartDM(u.id, u.name)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors text-left"
                    >
                      <div className="relative">
                        <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center overflow-hidden">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white text-sm font-semibold">
                              {u.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 text-sm truncate">{u.name}</p>
                        <p className="text-xs text-neutral-500">{u.house} • Lv. {u.level}</p>
                      </div>
                      <UserPlus className="w-4 h-4 text-neutral-400" />
                    </button>
                  ))}
                </div>

                <div className="p-3 border-t border-neutral-100">
                  <button
                    onClick={handleFindPeople}
                    className="w-full text-center text-sm text-primary font-medium hover:text-primary-dark"
                  >
                    View all students
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Community Stats */}
          <div className="bg-gradient-to-br from-secondary to-accent rounded-xl p-5 text-white">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Community Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/80">Active Rooms</span>
                <span className="font-semibold">{rooms.filter(r => r.type !== 'dm').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Online Students</span>
                <span className="font-semibold">{onlineUsers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">My Conversations</span>
                <span className="font-semibold">{rooms.length}</span>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-white rounded-xl shadow-card p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Community Guidelines</h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Be respectful and supportive
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Stay on topic in subject rooms
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                No sharing of exam answers
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Report inappropriate content
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && <ChatCreateRoom onClose={() => setShowCreateRoom(false)} />}
    </div>
  );
}

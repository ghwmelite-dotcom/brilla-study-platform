import { useState } from 'react';
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
  Flame,
  Star,
  Clock,
  UserPlus,
} from 'lucide-react';
import { useChatStore, useExamStore, useAuthStore } from '@/stores';
import { cn } from '@/utils';
import { ChatCreateRoom } from '@/components/chat';

// Featured rooms for each exam type
const featuredRooms = {
  nsmq: [
    { id: 'room_nsmq_riddles', name: 'Riddles & Problem Solving', members: 89, isHot: true },
    { id: 'room_nsmq_speed', name: 'Speed Practice', members: 156, isHot: false },
    { id: 'room_nsmq_biology', name: 'Biology Round Prep', members: 67, isHot: true },
  ],
  wassce: [
    { id: 'room_wassce_physics', name: 'Physics Study Group', members: 234, isHot: true },
    { id: 'room_wassce_math', name: 'Core Mathematics Help', members: 312, isHot: true },
    { id: 'room_wassce_english', name: 'English Essay Practice', members: 178, isHot: false },
  ],
  bece: [
    { id: 'room_bece_science', name: 'Integrated Science', members: 145, isHot: true },
    { id: 'room_bece_math', name: 'Mathematics Support', members: 203, isHot: false },
    { id: 'room_bece_english', name: 'English Language', members: 167, isHot: false },
  ],
};

// Online users
const onlineUsers = [
  { id: 'user_1', name: 'Kofi Mensah', house: 'Blue House', level: 5 },
  { id: 'user_2', name: 'Ama Asante', house: 'Red House', level: 8 },
  { id: 'user_3', name: 'Kwame Boateng', house: 'Green House', level: 12 },
  { id: 'user_4', name: 'Akua Adjei', house: 'Yellow House', level: 6 },
  { id: 'user_5', name: 'Yaw Owusu', house: 'Blue House', level: 4 },
  { id: 'user_6', name: 'Efua Mensah', house: 'Red House', level: 9 },
];

// Recent discussions
const recentDiscussions = [
  {
    room: 'WASSCE Physics',
    topic: 'How to solve projectile motion problems?',
    replies: 12,
    time: '5 min ago',
    author: 'Kofi M.',
  },
  {
    room: 'NSMQ Speed Quiz',
    topic: 'Tips for faster mental calculations',
    replies: 24,
    time: '15 min ago',
    author: 'Ama A.',
  },
  {
    room: 'Core Mathematics',
    topic: 'Integration techniques explained',
    replies: 8,
    time: '1 hour ago',
    author: 'Kwame B.',
  },
];

export function CommunityPage() {
  const { currentExamType } = useExamStore();
  useAuthStore(); // Ensure authenticated
  const {
    rooms,
    openChat,
    setActiveRoom,
    setActiveTab,
    startDM,
  } = useChatStore();

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const examFeatured = featuredRooms[currentExamType] || featuredRooms.wassce;

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

            <div className="divide-y divide-neutral-100">
              {examFeatured.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleOpenRoom(room.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-neutral-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-neutral-900">{room.name}</h3>
                      {room.isHot && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                          <Flame className="w-3 h-3" /> Hot
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500">{room.members} members active</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-400" />
                </button>
              ))}
            </div>
          </div>

          {/* My Study Rooms */}
          {myRooms.length > 0 && (
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
            </div>
          )}

          {/* Recent Discussions */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-neutral-500" />
                <h2 className="font-semibold text-neutral-900">Recent Discussions</h2>
              </div>
            </div>

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

            <div className="divide-y divide-neutral-100">
              {onlineUsers.slice(0, 5).map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleStartDM(u.id, u.name)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="relative">
                    <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {u.name.charAt(0)}
                      </span>
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
                <span className="font-semibold">24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Online Students</span>
                <span className="font-semibold">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Messages Today</span>
                <span className="font-semibold">1,247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Questions Answered</span>
                <span className="font-semibold">89</span>
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

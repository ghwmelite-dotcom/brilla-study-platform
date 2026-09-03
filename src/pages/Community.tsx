import { useState, useEffect } from 'react';
import { useRef } from 'react';
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
  Loader2,
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useExamStore } from '@/stores/examStore';
import { api } from '@/lib/api';
import { cn } from '@/utils';
import { ChatCreateRoom } from '@/components/chat';
import type { GhanaExamTypeSlug, ExamTypeSlug } from '@/types';
import { isGhanaExam } from '@/types';

interface FeaturedRoom {
  id: string;
  name: string;
  members: number;
  isHot?: boolean;
}

export function CommunityPage() {
  const { currentExamType } = useExamStore();
  const {
    rooms,
    openChat,
    setActiveRoom,
    setActiveTab,
    isLoadingRooms,
    fetchRooms,
  } = useChatStore();

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredRooms, setFeaturedRooms] = useState<FeaturedRoom[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(false);
  const fetchFeaturedRoomsRef = useRef<() => void>(() => {});

  // Fetch data on mount
  useEffect(() => {
    fetchRooms();
    fetchFeaturedRoomsRef.current();
  }, [currentExamType, fetchRooms]);

  const fetchFeaturedRooms = async () => {
    setIsLoadingFeatured(true);
    try {
      // Real public rooms, ordered by membership (most active first)
      const response = await api.get<Array<{ id: string; name: string; memberCount: number }>>(
        '/chat/rooms/browse?type=public'
      );

      if (response.success && response.data) {
        setFeaturedRooms(
          response.data.slice(0, 3).map((room) => ({
            id: room.id,
            name: room.name,
            members: room.memberCount,
          }))
        );
      } else {
        setFeaturedRooms([]);
      }
    } catch (error) {
      console.error('Failed to fetch featured rooms:', error);
      setFeaturedRooms([]);
    } finally {
      setIsLoadingFeatured(false);
    }
  };

  fetchFeaturedRoomsRef.current = fetchFeaturedRooms;

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

  const examColors: Record<GhanaExamTypeSlug, string> = {
    nsmq: 'from-amber-500 to-orange-600',
    wassce: 'from-indigo-500 to-purple-600',
    bece: 'from-emerald-500 to-teal-600',
  };

  // Get color for current exam type with fallback for international exams
  const getExamColor = (examType: ExamTypeSlug) => {
    if (isGhanaExam(examType)) {
      return examColors[examType];
    }
    return 'from-blue-500 to-indigo-600';
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
              getExamColor(currentExamType)
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5" />
                  <h2 className="font-semibold">
                    Featured Study Rooms
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
                <p className="text-neutral-400 text-xs mt-1">Create the first study room</p>
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
                      <p className="text-sm text-neutral-500">{room.members} {room.members === 1 ? 'member' : 'members'} active</p>
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
                        {room.memberCount} {room.memberCount === 1 ? 'member' : 'members'}
                        {(room.unreadCount ?? 0) > 0 && (
                          <span className="ml-2 text-primary font-medium">
                            • {room.unreadCount} new
                          </span>
                        )}
                      </p>
                    </div>
                    {(room.unreadCount ?? 0) > 0 && (
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

            {/* No cross-room discussion feed endpoint exists yet; static empty state. */}
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <MessageSquare className="w-12 h-12 text-neutral-300 mb-3" />
              <p className="text-neutral-500 text-sm">No recent discussions</p>
              <p className="text-neutral-400 text-xs mt-1">Start a conversation in a study room</p>
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

          {/* Online Now — presence is not tracked server-side yet, so this is a
              static entry point to Find Students rather than a fake live list. */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200">
              <h3 className="font-semibold text-neutral-900">Find Students</h3>
            </div>

            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Users className="w-10 h-10 text-neutral-300 mb-2" />
              <p className="text-neutral-500 text-sm">Connect with other students</p>
              <p className="text-neutral-400 text-xs mt-1">Search for students to start a conversation</p>
              <button
                onClick={handleFindPeople}
                className="mt-4 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
              >
                Find Students
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
                <span className="font-semibold">{rooms.filter(r => r.type !== 'dm').length}</span>
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

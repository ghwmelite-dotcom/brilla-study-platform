import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  BookOpen,
  Brain,
  PenTool,
  Mic,
  Globe,
  ChevronRight,
  Sparkles,
  Video,
  MessageCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/utils';
import { useStudyRoomStore, CreateSessionData } from '@/stores/studyRoomStore';
import { useAuthStore } from '@/stores';
import { StudyRoom } from '@/components/study-room/StudyRoom';

export function StudyRoomsPage() {
  const { user } = useAuthStore();
  const {
    currentSession,
    isInSession,
    availableSessions,
    isLoadingSessions,
    isConnecting,
    connectionError,
    createSession,
    joinSession,
    leaveSession,
    fetchAvailableSessions,
    toggleMic,
    toggleHand,
    sendMessage,
    askAI,
  } = useStudyRoomStore();

  // Local state
  const [view, setView] = useState<'browse' | 'create' | 'join'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  // Create session form
  const [createForm, setCreateForm] = useState<CreateSessionData>({
    title: '',
    description: '',
    subjectId: '',
    examType: 'WASSCE',
    maxParticipants: 5,
    aiEnabled: true,
    whiteboardEnabled: true,
    voiceEnabled: true,
    recordingEnabled: false,
    isPublic: true,
  });

  // Fetch sessions on mount
  useEffect(() => {
    fetchAvailableSessions();
  }, [fetchAvailableSessions]);

  // If in session, show the study room
  if (isInSession && currentSession) {
    return (
      <StudyRoom
        session={currentSession}
        currentUserId={user?.id || 'guest'}
        currentUserName={user?.name || 'Guest'}
        onLeave={leaveSession}
        onSendMessage={sendMessage}
        onAskAI={askAI}
        onToggleMic={toggleMic}
        onToggleHand={toggleHand}
        className="h-screen"
      />
    );
  }

  // Handle create session
  const handleCreateSession = async () => {
    if (!createForm.title.trim()) return;

    try {
      await createSession(createForm);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  // Handle join session
  const handleJoinSession = async () => {
    if (!joinCode.trim()) return;

    try {
      await joinSession(joinCode.toUpperCase(), joinPassword || undefined);
    } catch (error) {
      console.error('Failed to join session:', error);
    }
  };

  // Filter sessions
  const filteredSessions = availableSessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-violet-400" />
              Study Rooms
            </h1>
            <p className="text-slate-400 mt-1">
              Learn together with AI-powered collaborative study sessions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('join')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Join Room
            </button>
            <button
              onClick={() => setView('create')}
              className="px-4 py-2 bg-violet-500 hover:bg-violet-400 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Room
            </button>
          </div>
        </div>

        {/* Error message */}
        {connectionError && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl text-red-300">
            {connectionError}
          </div>
        )}

        {/* Browse View */}
        {view === 'browse' && (
          <>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search study rooms by topic, subject..."
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none"
              />
            </div>

            {/* Features highlight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Brain, title: 'AI Tutor', desc: 'Get instant help from Brilla AI', color: 'violet' },
                { icon: PenTool, title: 'Shared Whiteboard', desc: 'Draw and solve problems together', color: 'blue' },
                { icon: Mic, title: 'Voice Chat', desc: 'Talk to your study group', color: 'emerald' },
              ].map((feature, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-4 rounded-xl border bg-gradient-to-br",
                    feature.color === 'violet' && "from-violet-500/10 to-purple-500/5 border-violet-400/20",
                    feature.color === 'blue' && "from-blue-500/10 to-cyan-500/5 border-blue-400/20",
                    feature.color === 'emerald' && "from-emerald-500/10 to-green-500/5 border-emerald-400/20"
                  )}
                >
                  <feature.icon className={cn(
                    "w-8 h-8 mb-2",
                    feature.color === 'violet' && "text-violet-400",
                    feature.color === 'blue' && "text-blue-400",
                    feature.color === 'emerald' && "text-emerald-400"
                  )} />
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Sessions list */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-violet-400" />
                Public Study Rooms
              </h2>

              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-white/10">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No study rooms available</h3>
                  <p className="text-slate-400 mb-4">Be the first to create one!</p>
                  <button
                    onClick={() => setView('create')}
                    className="px-4 py-2 bg-violet-500 hover:bg-violet-400 text-white rounded-lg inline-flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Room
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredSessions.map(session => (
                    <div
                      key={session.id}
                      className="p-4 bg-slate-900/50 rounded-xl border border-white/10 hover:border-violet-400/30 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{session.title}</h3>
                            {session.aiEnabled && (
                              <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 text-xs rounded-full flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                AI
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {session.subject}
                            </span>
                            <span>•</span>
                            <span>{session.topic}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {session.participants.length}/{session.maxParticipants}
                            </span>
                          </div>
                          {session.description && (
                            <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                              {session.description}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => joinSession(session.roomCode)}
                          disabled={isConnecting || session.participants.length >= session.maxParticipants}
                          className="px-4 py-2 bg-violet-500 hover:bg-violet-400 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isConnecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              Join
                              <ChevronRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Features indicators */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                        {session.whiteboardEnabled && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <PenTool className="w-3 h-3" />
                            Whiteboard
                          </span>
                        )}
                        {session.voiceEnabled && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Mic className="w-3 h-3" />
                            Voice
                          </span>
                        )}
                        {session.recordingEnabled && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Video className="w-3 h-3" />
                            Recording
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Create View */}
        {view === 'create' && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setView('browse')}
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to rooms
            </button>

            <div className="bg-slate-900/50 rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-violet-400" />
                Create Study Room
              </h2>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Room Title *</label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="e.g., WASSCE Math Study Group"
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="What will you study in this session?"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none resize-none"
                  />
                </div>

                {/* Exam Type */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Exam Type</label>
                  <select
                    value={createForm.examType}
                    onChange={(e) => setCreateForm({ ...createForm, examType: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-violet-400/50 focus:outline-none"
                  >
                    <option value="BECE">BECE</option>
                    <option value="WASSCE">WASSCE</option>
                    <option value="IGCSE">IGCSE</option>
                    <option value="A-Level">A-Level</option>
                  </select>
                </div>

                {/* Max participants */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Max Participants</label>
                  <select
                    value={createForm.maxParticipants}
                    onChange={(e) => setCreateForm({ ...createForm, maxParticipants: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-violet-400/50 focus:outline-none"
                  >
                    {[2, 3, 4, 5, 6, 8, 10].map(n => (
                      <option key={n} value={n}>{n} participants</option>
                    ))}
                  </select>
                </div>

                {/* Features toggles */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <label className="block text-sm text-slate-400">Features</label>

                  {[
                    { key: 'aiEnabled', icon: Brain, label: 'AI Tutor', desc: 'Enable Brilla AI assistance' },
                    { key: 'whiteboardEnabled', icon: PenTool, label: 'Shared Whiteboard', desc: 'Collaborative drawing' },
                    { key: 'voiceEnabled', icon: Mic, label: 'Voice Chat', desc: 'Talk with participants' },
                    { key: 'isPublic', icon: Globe, label: 'Public Room', desc: 'Anyone can discover and join' },
                  ].map(feature => (
                    <label
                      key={feature.key}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <feature.icon className="w-5 h-5 text-violet-400" />
                        <div>
                          <span className="text-white">{feature.label}</span>
                          <p className="text-xs text-slate-500">{feature.desc}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={(createForm as any)[feature.key]}
                        onChange={(e) => setCreateForm({ ...createForm, [feature.key]: e.target.checked })}
                        className="w-5 h-5 rounded accent-violet-500"
                      />
                    </label>
                  ))}
                </div>

                {/* Create button */}
                <button
                  onClick={handleCreateSession}
                  disabled={!createForm.title.trim() || isConnecting}
                  className="w-full py-3 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create Room
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join View */}
        {view === 'join' && (
          <div className="max-w-md mx-auto">
            <button
              onClick={() => setView('browse')}
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to rooms
            </button>

            <div className="bg-slate-900/50 rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-violet-400" />
                Join Study Room
              </h2>

              <div className="space-y-4">
                {/* Room code */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Room Code</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white text-center text-2xl tracking-widest font-mono placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none uppercase"
                  />
                </div>

                {/* Password (optional) */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Password (if required)</label>
                  <input
                    type="password"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    placeholder="Enter room password"
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none"
                  />
                </div>

                {/* Join button */}
                <button
                  onClick={handleJoinSession}
                  disabled={joinCode.length !== 6 || isConnecting}
                  className="w-full py-3 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      Join Room
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudyRoomsPage;

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users,
  Mic,
  MicOff,
  PhoneOff,
  MessageCircle,
  Settings,
  Share2,
  Copy,
  Check,
  Crown,
  Hand,
  Sparkles,
  BookOpen,
  Send,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  LogOut,
  Maximize2,
  Minimize2,
  PenTool,
  Brain,
} from 'lucide-react';
import { cn } from '@/utils';
import { InteractiveWhiteboard } from '../whiteboard/InteractiveWhiteboard';
import { VoiceConversation } from '../voice/VoiceConversation';

// Types
interface Participant {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  role: 'host' | 'co-host' | 'participant';
  isSpeaking: boolean;
  micEnabled: boolean;
  handRaised: boolean;
  cursorX?: number;
  cursorY?: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'question' | 'ai_response' | 'system';
  timestamp: Date;
  reactions?: Record<string, string[]>;
}

interface StudySession {
  id: string;
  title: string;
  roomCode: string;
  subject: string;
  topic: string;
  hostId: string;
  status: 'waiting' | 'active' | 'paused' | 'ended';
  participants: Participant[];
  aiEnabled: boolean;
  whiteboardEnabled: boolean;
  voiceEnabled: boolean;
}

interface StudyRoomProps {
  session: StudySession;
  currentUserId: string;
  currentUserName: string;
  onLeave: () => void;
  onSendMessage: (message: string) => Promise<void>;
  onAskAI: (question: string) => Promise<string>;
  onToggleMic: () => void;
  onToggleHand: () => void;
  className?: string;
}

const PARTICIPANT_COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export function StudyRoom({
  session,
  currentUserId,
  currentUserName,
  onLeave,
  onSendMessage,
  onAskAI,
  onToggleMic,
  onToggleHand,
  className,
}: StudyRoomProps) {
  // State
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'ai'>('chat');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Current user
  const currentUser = session.participants.find(p => p.id === currentUserId);
  // isHost available for future use: currentUser?.role === 'host' || currentUser?.role === 'co-host'

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Copy room code
  const copyRoomCode = useCallback(() => {
    navigator.clipboard.writeText(session.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [session.roomCode]);

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      senderName: currentUserName,
      content: inputMessage,
      type: 'text',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, message]);
    setInputMessage('');
    await onSendMessage(inputMessage);
  }, [inputMessage, currentUserId, currentUserName, onSendMessage]);

  // Ask AI
  const handleAskAI = useCallback(async (question: string) => {
    setIsAiThinking(true);

    // Add user question
    const questionMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      senderName: currentUserName,
      content: question,
      type: 'question',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, questionMessage]);

    try {
      const response = await onAskAI(question);

      // Add AI response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        senderId: 'ai',
        senderName: 'Brilla AI',
        content: response,
        type: 'ai_response',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);

      return response;
    } catch (error) {
      console.error('Failed to get AI response:', error);
      return 'Sorry, I encountered an error. Please try again.';
    } finally {
      setIsAiThinking(false);
    }
  }, [currentUserId, currentUserName, onAskAI]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Participant card
  const ParticipantCard = ({ participant }: { participant: Participant }) => (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg transition-all",
      participant.isSpeaking
        ? "bg-violet-500/20 border border-violet-400/30"
        : "bg-slate-800/50 hover:bg-slate-800"
    )}>
      {/* Avatar */}
      <div className="relative">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: participant.color }}
        >
          {participant.avatar ? (
            <img src={participant.avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            participant.name[0].toUpperCase()
          )}
        </div>
        {participant.role === 'host' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
            <Crown className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {participant.isSpeaking && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">
            {participant.name}
            {participant.id === currentUserId && ' (You)'}
          </span>
          {participant.handRaised && (
            <Hand className="w-4 h-4 text-amber-400 animate-bounce" />
          )}
        </div>
        <span className="text-xs text-slate-400 capitalize">{participant.role}</span>
      </div>

      {/* Status */}
      <div className="flex items-center gap-1">
        {participant.micEnabled ? (
          <Mic className="w-4 h-4 text-green-400" />
        ) : (
          <MicOff className="w-4 h-4 text-slate-500" />
        )}
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col h-full bg-slate-950",
        isFullscreen && "fixed inset-0 z-50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* Session info */}
          <div>
            <h2 className="font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-400" />
              {session.title}
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>{session.subject}</span>
              <span>•</span>
              <span>{session.topic}</span>
            </div>
          </div>

          {/* Room code */}
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <span className="text-sm font-mono text-violet-300">{session.roomCode}</span>
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 rounded-lg">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-white">{session.participants.length}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            onClick={onLeave}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Leave
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Whiteboard / Main area */}
        <div className="flex-1 flex flex-col">
          {/* Whiteboard */}
          <div className="flex-1 relative">
            {session.whiteboardEnabled ? (
              <InteractiveWhiteboard
                userId={currentUserId}
                userName={currentUserName}
                userColor={currentUser?.color || PARTICIPANT_COLORS[0]}
                participants={session.participants}
                className="h-full"
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-slate-900">
                <div className="text-center">
                  <PenTool className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Whiteboard is disabled for this session</p>
                </div>
              </div>
            )}

            {/* AI Tutor floating button */}
            {session.aiEnabled && (
              <VoiceConversation
                onTranscript={() => {}}
                onSendMessage={handleAskAI}
                isProcessing={isAiThinking}
                mode="floating"
                autoSpeak={true}
              />
            )}
          </div>

          {/* Bottom control bar */}
          <div className="flex items-center justify-center gap-4 p-4 border-t border-white/10 bg-slate-900">
            {/* Mic */}
            <button
              onClick={onToggleMic}
              className={cn(
                "p-4 rounded-full transition-all",
                currentUser?.micEnabled
                  ? "bg-slate-700 text-white hover:bg-slate-600"
                  : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              )}
            >
              {currentUser?.micEnabled ? (
                <Mic className="w-6 h-6" />
              ) : (
                <MicOff className="w-6 h-6" />
              )}
            </button>

            {/* Raise hand */}
            <button
              onClick={onToggleHand}
              className={cn(
                "p-4 rounded-full transition-all",
                currentUser?.handRaised
                  ? "bg-amber-500 text-white"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              )}
            >
              <Hand className="w-6 h-6" />
            </button>

            {/* Share */}
            <button className="p-4 rounded-full bg-slate-700 text-slate-400 hover:bg-slate-600 transition-all">
              <Share2 className="w-6 h-6" />
            </button>

            {/* Leave */}
            <button
              onClick={onLeave}
              className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className={cn(
          "border-l border-white/10 bg-slate-900/50 transition-all duration-300 flex flex-col",
          sidebarCollapsed ? "w-12" : "w-80"
        )}>
          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute top-1/2 -left-3 w-6 h-12 bg-slate-800 rounded-l-lg flex items-center justify-center text-slate-400 hover:text-white z-10"
          >
            {sidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {!sidebarCollapsed && (
            <>
              {/* Tabs */}
              <div className="flex border-b border-white/10">
                {[
                  { id: 'chat', icon: MessageCircle, label: 'Chat' },
                  { id: 'participants', icon: Users, label: 'People' },
                  { id: 'ai', icon: Brain, label: 'AI' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'chat' | 'participants' | 'ai')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 p-3 transition-colors",
                      activeTab === tab.id
                        ? "text-violet-400 border-b-2 border-violet-400"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Chat tab */}
                {activeTab === 'chat' && (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No messages yet</p>
                          <p className="text-xs">Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map(msg => (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex gap-2",
                              msg.senderId === currentUserId && "flex-row-reverse"
                            )}
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                              style={{
                                backgroundColor: msg.type === 'ai_response'
                                  ? '#8b5cf6'
                                  : session.participants.find(p => p.id === msg.senderId)?.color || '#64748b'
                              }}
                            >
                              {msg.type === 'ai_response' ? (
                                <Sparkles className="w-4 h-4" />
                              ) : (
                                msg.senderName[0].toUpperCase()
                              )}
                            </div>
                            <div className={cn(
                              "max-w-[80%] rounded-xl p-3",
                              msg.type === 'ai_response'
                                ? "bg-violet-500/20 border border-violet-400/30"
                                : msg.senderId === currentUserId
                                  ? "bg-violet-600 text-white"
                                  : "bg-slate-800"
                            )}>
                              <p className="text-xs text-white/60 mb-1">
                                {msg.senderName}
                              </p>
                              <p className="text-sm text-white">{msg.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat input */}
                    <div className="p-3 border-t border-white/10">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 px-3 py-2 bg-slate-800 rounded-lg text-white text-sm border border-white/10 focus:border-violet-400/50 focus:outline-none"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!inputMessage.trim()}
                          className="px-3 py-2 bg-violet-500 hover:bg-violet-400 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Participants tab */}
                {activeTab === 'participants' && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {session.participants.map(participant => (
                      <ParticipantCard key={participant.id} participant={participant} />
                    ))}

                    {/* Invite button */}
                    <button
                      onClick={copyRoomCode}
                      className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-white/20 rounded-lg text-slate-400 hover:text-white hover:border-violet-400/50 transition-colors"
                    >
                      <UserPlus className="w-5 h-5" />
                      Invite Others
                    </button>
                  </div>
                )}

                {/* AI tab */}
                {activeTab === 'ai' && (
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Brain className="w-8 h-8 text-violet-400" />
                      </div>
                      <h3 className="font-semibold text-white mb-2">Brilla AI Tutor</h3>
                      <p className="text-sm text-slate-400 mb-4">
                        Ask questions, get explanations, and learn together with AI assistance.
                      </p>

                      {/* Quick actions */}
                      <div className="space-y-2">
                        {[
                          'Explain this concept',
                          'Give me an example',
                          'Check my understanding',
                          'Suggest practice problems',
                        ].map(action => (
                          <button
                            key={action}
                            onClick={() => handleAskAI(action)}
                            disabled={isAiThinking}
                            className="w-full p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white transition-colors disabled:opacity-50"
                          >
                            {action}
                          </button>
                        ))}
                      </div>

                      {isAiThinking && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-violet-400">
                          <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudyRoom;

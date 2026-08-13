import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ImmersiveWhiteboard } from './ImmersiveWhiteboard';
import { ImmersiveControls } from './ImmersiveControls';
import { AIPresenceIndicator } from './AIPresenceIndicator';
import { AmbientSounds } from './AmbientSounds';
import { SessionSummary } from './SessionSummary';
import { VoiceConversation } from '../voice/VoiceConversation';
import { TutorConnectPrompt, TutorPresenceIndicator } from '../tutor-classroom';
import { useRevisionClassroomStore } from '@/stores/revisionClassroomStore';
import { cn } from '@/utils';

interface ImmersiveClassroomProps {
  subjectId: string;
  topicId?: string;
  lessonId?: string;
  onExit?: () => void;
}

export function ImmersiveClassroom({
  subjectId: _subjectId,
  topicId: _topicId,
  lessonId,
  onExit,
}: ImmersiveClassroomProps) {
  // Note: subjectId and topicId are available via props if needed for future features
  void _subjectId;
  void _topicId;
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Store
  const {
    currentLesson,
    aiTeachingState,
    aiMessages,
    tutorPresence,
    handoffState,
    startLesson,
    askQuestion,
    pauseSession,
    acceptHandoffSuggestion,
    declineHandoffSuggestion,
    dismissTutor,
  } = useRevisionClassroomStore();

  // State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [ambientSound, setAmbientSound] = useState<'none' | 'rain' | 'library' | 'lofi'>('none');
  const [ambientVolume, setAmbientVolume] = useState(0.3);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Session stats for summary
  const [sessionStats, setSessionStats] = useState({
    startTime: Date.now(),
    questionsAsked: 0,
    conceptsCovered: 0,
    drawingsCreated: 0,
    timeSpent: 0,
  });

  // Enter fullscreen on mount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (containerRef.current && document.fullscreenEnabled) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch {
        // Fullscreen not available
      }
    };

    // Request wake lock to prevent screen sleep
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch {
        // Wake lock not available
      }
    };

    // Entrance animation
    const timer = setTimeout(() => {
      setIsEntering(false);
      enterFullscreen();
      requestWakeLock();
    }, 1500);

    return () => {
      clearTimeout(timer);
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Idle detection - hide cursor and controls after inactivity
  useEffect(() => {
    const resetIdleTimer = () => {
      setIsIdle(false);
      setShowControls(true);

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true);
        setShowControls(false);
      }, 3000); // 3 seconds of inactivity
    };

    const handleActivity = () => resetIdleTimer();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    resetIdleTimer();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExit();
      } else if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        // Toggle voice listening
        setIsListening(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Start lesson on mount
  useEffect(() => {
    if (lessonId && !currentLesson) {
      startLesson(lessonId);
    }
  }, [lessonId, currentLesson, startLesson]);

  // Handle voice transcript
  const handleVoiceTranscript = useCallback((_text: string, isFinal: boolean) => {
    if (isFinal) {
      setIsListening(false);
    }
  }, []);

  // Handle voice message to AI
  const handleVoiceMessage = useCallback(async (text: string): Promise<string> => {
    setSessionStats(prev => ({ ...prev, questionsAsked: prev.questionsAsked + 1 }));

    // Check for special commands
    const lowerText = text.toLowerCase();

    if (lowerText.includes('exit') || lowerText.includes('leave') || lowerText.includes('quit')) {
      handleExit();
      return "Goodbye! Great studying today.";
    }

    if (lowerText.includes('next') || lowerText.includes('continue')) {
      // Move to next concept
      return "Let's move on to the next concept.";
    }

    // Send to AI tutor
    await askQuestion(text);

    // Return latest AI response
    const latestResponse = aiMessages[aiMessages.length - 1]?.aiMessage ||
      "I'm thinking about that. Let me explain...";

    return latestResponse;
  }, [askQuestion, aiMessages]);

  // Handle drawing added
  const handleDrawingAdd = useCallback((drawing: any) => {
    setSessionStats(prev => ({ ...prev, drawingsCreated: prev.drawingsCreated + 1 }));

    // If it's a question mark, trigger AI explanation
    if (drawing.type === 'question') {
      askQuestion("Can you explain this part more clearly?");
    }
  }, [askQuestion]);

  // Handle exit
  const handleExit = useCallback(() => {
    setIsExiting(true);

    // Calculate session stats
    const timeSpent = Math.floor((Date.now() - sessionStats.startTime) / 1000 / 60);
    setSessionStats(prev => ({
      ...prev,
      timeSpent,
      conceptsCovered: aiMessages.length,
    }));

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    // Release wake lock
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
    }

    // Pause session
    pauseSession();

    // Show summary
    setTimeout(() => {
      setShowSummary(true);
    }, 500);
  }, [sessionStats.startTime, aiMessages.length, pauseSession]);

  // Handle summary close
  const handleSummaryClose = useCallback(() => {
    setShowSummary(false);
    if (onExit) {
      onExit();
    } else {
      navigate(-1);
    }
  }, [navigate, onExit]);

  // Generate invite code
  const handleInviteFriends = useCallback(() => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInviteCode(code);
    // In a real implementation, this would create a study room
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 bg-slate-950 overflow-hidden",
        isIdle && "cursor-none"
      )}
    >
      {/* Entrance animation */}
      <AnimatePresence>
        {isEntering && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-50 bg-slate-950 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 rounded-full bg-white/20"
                />
              </div>
              <h2 className="text-2xl font-light text-white/80">Entering Focus Mode</h2>
              <p className="text-white/40 mt-2">Preparing your learning space...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit animation */}
      <AnimatePresence>
        {isExiting && !showSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-slate-950 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h2 className="text-2xl font-light text-white/80">Great session!</h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      {!isEntering && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isExiting ? 0 : 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-full h-full"
        >
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />

          {/* Interactive Whiteboard - The main focus */}
          {/* isAiDrawing intentionally not passed: the AI canvas layer receives
              no data yet (Phase C) — showing the indicator would be theater. */}
          <ImmersiveWhiteboard
            aiContent={aiTeachingState.currentMessage}
            onDrawingAdd={handleDrawingAdd}
            onQuestionMark={() => {
              askQuestion("Can you explain what's at this point on the whiteboard?");
            }}
            className="absolute inset-0"
          />

          {/* AI Presence Indicator */}
          <AIPresenceIndicator
            isThinking={aiTeachingState.isThinking}
            isSpeaking={isAiSpeaking}
            isListening={isListening}
            className={cn(
              "absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-500",
              isIdle ? "opacity-30" : "opacity-100"
            )}
          />

          {/* Voice Conversation (invisible but active) */}
          {voiceEnabled && (
            <VoiceConversation
              onTranscript={handleVoiceTranscript}
              onSendMessage={handleVoiceMessage}
              isProcessing={aiTeachingState.isThinking}
              mode="minimal"
              autoSpeak={true}
              voiceSettings={{
                rate: 0.95,
                pitch: 1.0,
                volume: 1.0,
              }}
            />
          )}

          {/* Contextual Controls - appear on hover/activity */}
          <ImmersiveControls
            visible={showControls}
            isFullscreen={isFullscreen}
            voiceEnabled={voiceEnabled}
            ambientSound={ambientSound}
            ambientVolume={ambientVolume}
            inviteCode={inviteCode}
            onToggleFullscreen={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                containerRef.current?.requestFullscreen();
              }
            }}
            onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
            onChangeAmbient={setAmbientSound}
            onChangeVolume={setAmbientVolume}
            onInviteFriends={handleInviteFriends}
            onExit={handleExit}
          />

          {/* Ambient Sounds */}
          <AmbientSounds
            sound={ambientSound}
            volume={ambientVolume}
          />

          {/* Invite code toast */}
          <AnimatePresence>
            {inviteCode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 text-center"
              >
                <p className="text-white/60 text-sm mb-1">Share this code with friends</p>
                <p className="text-3xl font-mono font-bold text-white tracking-wider">{inviteCode}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Tutor Presence Indicator */}
      {tutorPresence?.isConnected && (
        <TutorPresenceIndicator
          isConnected={tutorPresence.isConnected}
          tutorName={tutorPresence.tutorName}
          tutorAvatarUrl={tutorPresence.tutorAvatarUrl}
          mode={tutorPresence.mode}
          onDismiss={tutorPresence.mode === 'observe' ? dismissTutor : undefined}
        />
      )}

      {/* Tutor Connect Prompt */}
      {handoffState.status !== 'none' && handoffState.status !== 'connected' && (
        <TutorConnectPrompt
          status={handoffState.status}
          onAccept={acceptHandoffSuggestion}
          onDecline={declineHandoffSuggestion}
          onClose={declineHandoffSuggestion}
          tutorName={tutorPresence?.tutorName}
        />
      )}

      {/* Session Summary */}
      <AnimatePresence>
        {showSummary && (
          <SessionSummary
            stats={sessionStats}
            onClose={handleSummaryClose}
            onContinue={() => {
              setShowSummary(false);
              setIsExiting(false);
              setIsEntering(true);
              setTimeout(() => setIsEntering(false), 1500);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default ImmersiveClassroom;

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Briefcase,
  Heart,
  MessageSquare,
  ArrowRight,
  ChevronRight,
  History,
  Sparkles,
} from 'lucide-react';
import { useCounselorStore, useAuthStore } from '@/stores';
import { CounselorChat, WellbeingCheckIn } from '@/components/counselor';
import type { CounselorType } from '@/types';
import { COUNSELOR_CONFIGS, MOOD_OPTIONS } from '@/types/counselor';

const counselorIcons: Record<CounselorType, React.ElementType> = {
  academic: GraduationCap,
  career: Briefcase,
  wellbeing: Heart,
  general: MessageSquare,
};

export function CounselorPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    conversations,
    currentConversation,
    isOpen,
    todayWellbeingLog,
    wellbeingHistory,
    loadConversations,
    loadConversation,
    startConversation,
    openCounselor,
    loadWellbeingHistory,
    openWellbeingCheckIn,
  } = useCounselorStore();

  useEffect(() => {
    if (user) {
      loadConversations();
      loadWellbeingHistory();
    }
  }, [user, loadConversations, loadWellbeingHistory]);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
      openCounselor();
    }
  }, [conversationId, loadConversation, openCounselor]);

  const handleStartConversation = (type: CounselorType) => {
    startConversation(type);
    openCounselor(type);
  };

  const handleContinueConversation = (convId: string) => {
    navigate(`/counselor/${convId}`);
  };

  // Show full-screen chat if conversation is active
  if (isOpen && currentConversation) {
    return <CounselorChat />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-neutral-900">AI Student Counselor</h1>
        <p className="text-neutral-500">
          Get personalized guidance for academics, career, and wellbeing
        </p>
      </div>

      {/* Wellbeing Check-in Card */}
      {!todayWellbeingLog && (
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-neutral-900 mb-1">Daily Wellbeing Check-in</h3>
              <p className="text-sm text-neutral-600 mb-3">
                Take a moment to reflect on how you're feeling today. It helps us support you better.
              </p>
              <button
                onClick={openWellbeingCheckIn}
                className="btn btn-primary btn-sm"
              >
                Check In Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counselor Types */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Start a Conversation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(COUNSELOR_CONFIGS) as CounselorType[]).map((type) => {
            const config = COUNSELOR_CONFIGS[type];
            const Icon = counselorIcons[type];

            return (
              <button
                key={type}
                onClick={() => handleStartConversation(type)}
                className="bg-white rounded-xl border border-neutral-200 p-5 text-left hover:border-primary hover:shadow-lg transition-all group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${config.color}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: config.color }} />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-primary transition-colors">
                  {config.name}
                </h3>
                <p className="text-sm text-neutral-500 mb-4">{config.description}</p>
                <div className="flex items-center text-sm text-primary font-medium">
                  Start Chat
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Quick Help
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: "I'm stressed about exams", type: 'wellbeing' as CounselorType },
            { label: 'Help me study effectively', type: 'academic' as CounselorType },
            { label: 'What career suits me?', type: 'career' as CounselorType },
            { label: 'I need motivation', type: 'wellbeing' as CounselorType },
            { label: 'Explain a difficult topic', type: 'academic' as CounselorType },
            { label: 'Just want to chat', type: 'general' as CounselorType },
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => {
                startConversation(action.type, action.label);
                openCounselor(action.type);
              }}
              className="flex items-center justify-between px-4 py-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <span className="text-sm text-neutral-700">{action.label}</span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>
          ))}
        </div>
      </section>

      {/* Conversation History */}
      {conversations.length > 0 && (
        <section className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-neutral-500" />
            Recent Conversations
          </h2>
          <div className="space-y-3">
            {conversations.slice(0, 5).map((conv) => {
              const config = COUNSELOR_CONFIGS[conv.counselorType];
              const Icon = counselorIcons[conv.counselorType];

              return (
                <button
                  key={conv.id}
                  onClick={() => handleContinueConversation(conv.id)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${config.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-medium text-neutral-900">
                      {conv.title || `${config.name} Chat`}
                    </h4>
                    <p className="text-xs text-neutral-500">
                      {conv.messageCount} messages • {formatDate(conv.lastMessageAt || conv.createdAt)}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Wellbeing Trend (if logged) */}
      {wellbeingHistory.length > 0 && (
        <section className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Your Wellbeing Trend</h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {wellbeingHistory.slice(0, 7).reverse().map((log, i) => {
              const moodInfo = MOOD_OPTIONS.find((m) => m.value === log.mood);
              return (
                <div key={i} className="flex flex-col items-center gap-1 min-w-[60px]">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${moodInfo?.color}20` }}
                  >
                    {moodInfo?.emoji}
                  </div>
                  <span className="text-xs text-neutral-500">
                    {formatShortDate(log.logDate)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Floating Chat Modal */}
      <CounselorChat />

      {/* Wellbeing Check-in Modal */}
      <WellbeingCheckIn />
    </div>
  );
}

// Helper functions
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

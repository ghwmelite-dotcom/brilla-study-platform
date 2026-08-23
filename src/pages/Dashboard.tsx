import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Flame,
  Star,
  Target,
  BookOpen,
  Brain,
  Award,
  Gift,
  Sparkles,
  GraduationCap,
  ArrowRight,
  Flag,
} from 'lucide-react';
import { Card, CardHeader, Button, Badge, ProgressBar, CircularProgress } from '@/components/common';
import { TrialBanner } from '@/components/subscription';
import { QuickPlayCard, QuickPlayModal, SpeedBlitz, DailyBrainTeaser } from '@/components/quickplay';
import { RecommendedNext, ExamReadinessGauge, StudyPlanWidget } from '@/components/learning';
import { FriendActivityWidget } from '@/components/social';
import { EventBanner } from '@/components/events';
import { DailyMultiplierBanner, MysteryChestModal, LuckyWheelModal, SurpriseChallengePopup } from '@/components/rewards';
import { StreakWarningBanner, ComebackModal, NudgeContainer } from '@/components/engagement';
import { DashboardHero, ExamFlyers, DailyTip, FeaturedStats } from '@/components/dashboard';
import { ScoutNetworkCard } from '@/components/affiliate';
import { OALevelBanner, OALevelProgressWidget } from '@/components/exam-setup';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import { useQuickPlayStore } from '@/stores/quickPlayStore';
import { useEventStore } from '@/stores/eventStore';
import { useRewardStore } from '@/stores/rewardStore';
import { useEngagementStore } from '@/stores/engagementStore';
import { useRaceStore } from '@/stores/raceStore';
import { useExamStore } from '@/stores/examStore';
import { useExamBoardStore } from '@/stores/examBoardStore';
import { getExamConfig } from '@/config';
import { cn } from '@/utils';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { currentExamType } = useExamStore();
  const { setupComplete, userSpecifications, fetchUserSpecifications } = useExamBoardStore();
  const examConfig = getExamConfig(currentExamType);
  const {
    totalQuestionsAttempted,
    totalCorrect,
    overallAccuracy,
    currentStreak,
    longestStreak,
    totalXP,
    level,
    topicProgress,
    getStrengths,
    getWeaknesses,
  } = useProgressStore();
  const { currentSession, isQuickPlayModalOpen, openQuickPlayModal, closeQuickPlayModal } = useQuickPlayStore();

  // Race store
  const { current: race, fetchCurrent: fetchRace } = useRaceStore();

  // Event store
  const { activeEvents, fetchActiveEvents } = useEventStore();

  // Reward store
  const {
    dailyMultiplier,
    activeChallenge,
    fetchDailyMultiplier,
    checkForSurpriseChallenge,
    dismissSurpriseChallenge,
    availableChests,
    fetchAvailableChests,
    luckyWheel,
    fetchLuckyWheel,
  } = useRewardStore();

  // Engagement store
  const {
    engagementStatus,
    comebackChallenge,
    hasSeenComebackModal,
    checkEngagementStatus,
  } = useEngagementStore();

  // Modal states
  const [brainTeaserOpen, setBrainTeaserOpen] = useState(false);
  const [chestModalOpen, setChestModalOpen] = useState(false);
  const [wheelModalOpen, setWheelModalOpen] = useState(false);
  const [comebackModalOpen, setComebackModalOpen] = useState(false);

  // Fetch engagement data on mount
  useEffect(() => {
    fetchActiveEvents();
    fetchDailyMultiplier();
    checkForSurpriseChallenge();
    fetchAvailableChests();
    fetchLuckyWheel();
    checkEngagementStatus();
    fetchUserSpecifications();
    fetchRace();
  }, [fetchActiveEvents, fetchDailyMultiplier, checkForSurpriseChallenge, fetchAvailableChests, fetchLuckyWheel, checkEngagementStatus, fetchUserSpecifications, fetchRace]);

  // Show comeback modal if applicable
  useEffect(() => {
    if (comebackChallenge && !hasSeenComebackModal && engagementStatus && engagementStatus.daysInactive >= 1) {
      setComebackModalOpen(true);
    }
  }, [comebackChallenge, hasSeenComebackModal, engagementStatus]);

  // Redirect admins to admin dashboard
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Redirect parents to parent dashboard
  if (user?.role === 'parent') {
    return <Navigate to="/parent" replace />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Please log in to view your dashboard.</p>
      </div>
    );
  }

  // Calculate level progress
  const xpForCurrentLevel = (level - 1) * 1000;
  const xpProgress = totalXP - xpForCurrentLevel;
  const xpPercentage = Math.min((xpProgress / 1000) * 100, 100);

  // Get real data from progress store
  const strengths = getStrengths();
  const weaknesses = getWeaknesses();

  // Check for available rewards
  const hasAvailableChest = availableChests.some(c => c.available);
  const hasWheelSpin = luckyWheel?.available && luckyWheel.spinsRemaining > 0;

  // Define available achievements (these would come from API in production)
  const availableAchievements = [
    { id: 'first_question', icon: '🎯', name: 'First Steps', description: 'Answer your first question', requirement: 1 },
    { id: 'streak_3', icon: '🔥', name: 'Getting Started', description: '3 correct in a row', requirement: 3 },
    { id: 'streak_7', icon: '🔥', name: 'Week Warrior', description: '7 day streak', requirement: 7 },
    { id: 'questions_50', icon: '📚', name: 'Dedicated Learner', description: 'Answer 50 questions', requirement: 50 },
    { id: 'accuracy_90', icon: '🎯', name: 'Sharpshooter', description: 'Achieve 90% accuracy', requirement: 90 },
  ];

  return (
    <div className="space-y-6">
      {/* Streak Warning Banner - Show when streak is at risk */}
      {engagementStatus?.streakAtRisk && (
        <StreakWarningBanner />
      )}

      {/* Event Banner - Show active seasonal events */}
      {activeEvents.length > 0 && (
        <EventBanner />
      )}

      {/* Daily Multiplier Banner */}
      {dailyMultiplier && !dailyMultiplier.claimedAt && (
        <DailyMultiplierBanner />
      )}

      {/* Exam-Specific Dashboard Hero */}
      <DashboardHero />

      {/* Show active multiplier badge if claimed */}
      {dailyMultiplier?.claimedAt && (
        <div className="flex items-center gap-2">
          <DailyMultiplierBanner compact />
        </div>
      )}

      {/* Trial/Subscription Banner */}
      <TrialBanner variant="full" />

      {/* Daily Tip */}
      <DailyTip />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{currentStreak}</p>
              <p className="text-xs text-neutral-500">{examConfig.statsLabels.streak}</p>
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-2">Best: {longestStreak} days</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{overallAccuracy || 0}%</p>
              <p className="text-xs text-neutral-500">{examConfig.statsLabels.accuracy}</p>
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-2">{totalCorrect}/{totalQuestionsAttempted} correct</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{totalXP || user.xpPoints}</p>
              <p className="text-xs text-neutral-500">{examConfig.statsLabels.xp}</p>
            </div>
          </div>
          <ProgressBar value={xpPercentage} size="sm" variant="secondary" className="mt-2" />
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">Level {level || user.level}</p>
              <p className="text-xs text-neutral-500">{1000 - xpProgress} XP to next</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Student Scout network - own aggregate referral performance only */}
      {user.role === 'student' && <ScoutNetworkCard />}

      {/* Exam-Specific Promotional Flyers */}
      <ExamFlyers />

      {/* O-Level / A-Level Progress Widget or Setup Banner */}
      {setupComplete || userSpecifications.length > 0 ? (
        <OALevelProgressWidget variant="full" />
      ) : (
        <OALevelBanner variant="full" />
      )}

      {/* AI Revision Classroom Banner */}
      <Link
        to="/revision-classroom"
        className="block group"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-1/4 translate-y-1/4" />
          </div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold">AI Revision Classroom</h3>
                  <Badge variant="accent" className="bg-white/20 text-white border-0 text-xs">
                    NEW
                  </Badge>
                </div>
                <p className="text-white/80 text-sm max-w-md">
                  Let AI teach you every topic before your exam. Personalized, comprehensive revision led by your AI tutor.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
              <GraduationCap className="w-5 h-5" />
              <span className="font-semibold">Start Learning</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Goals */}
          <Card className="p-6">
            <CardHeader
              title="Today's Goals"
              subtitle={totalQuestionsAttempted > 0 ? "Keep up the momentum!" : "Start your learning journey"}
            />
            <div className="space-y-4">
              {/* Goal 1: Answer questions */}
              <div className={cn(
                "flex items-center justify-between p-3 rounded-lg",
                totalQuestionsAttempted >= 10 ? "bg-green-50" : "bg-neutral-50"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    totalQuestionsAttempted >= 10 ? "bg-green-500" : "bg-neutral-200"
                  )}>
                    <span className={totalQuestionsAttempted >= 10 ? "text-white text-sm" : "text-neutral-500 text-sm"}>
                      {totalQuestionsAttempted >= 10 ? "✓" : "1"}
                    </span>
                  </div>
                  <span className="text-neutral-700">Answer 10 questions</span>
                </div>
                <span className={cn("text-sm", totalQuestionsAttempted >= 10 ? "text-green-600" : "text-neutral-500")}>
                  {Math.min(totalQuestionsAttempted, 10)}/10
                </span>
              </div>

              {/* Goal 2: Get correct answers */}
              <div className={cn(
                "flex items-center justify-between p-3 rounded-lg",
                totalCorrect >= 5 ? "bg-green-50" : "bg-neutral-50"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    totalCorrect >= 5 ? "bg-green-500" : "bg-neutral-200"
                  )}>
                    <span className={totalCorrect >= 5 ? "text-white text-sm" : "text-neutral-500 text-sm"}>
                      {totalCorrect >= 5 ? "✓" : "2"}
                    </span>
                  </div>
                  <span className="text-neutral-700">Get 5 correct answers</span>
                </div>
                <span className={cn("text-sm", totalCorrect >= 5 ? "text-green-600" : "text-neutral-500")}>
                  {Math.min(totalCorrect, 5)}/5
                </span>
              </div>

              {/* Goal 3: Build a streak */}
              <div className={cn(
                "flex items-center justify-between p-3 rounded-lg",
                currentStreak >= 3 ? "bg-green-50" : "bg-neutral-50"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    currentStreak >= 3 ? "bg-green-500" : "bg-neutral-200"
                  )}>
                    <span className={currentStreak >= 3 ? "text-white text-sm" : "text-neutral-500 text-sm"}>
                      {currentStreak >= 3 ? "✓" : "3"}
                    </span>
                  </div>
                  <span className="text-neutral-700">Build a 3-answer streak</span>
                </div>
                <span className={cn("text-sm", currentStreak >= 3 ? "text-green-600" : "text-neutral-500")}>
                  {currentStreak}/3 streak
                </span>
              </div>

              {/* Goal 4: Start practicing */}
              <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg border border-primary-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary text-sm">4</span>
                  </div>
                  <span className="text-neutral-700">
                    {totalQuestionsAttempted === 0 ? "Start your first practice session" : "Continue practicing"}
                  </span>
                </div>
                <Link to="/practice">
                  <Button size="sm">Start</Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Study Plan */}
          <StudyPlanWidget />

          {/* Recent Activity */}
          <Card className="p-6">
            <CardHeader
              title="Recent Activity"
            />
            {totalQuestionsAttempted === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 font-medium">No activity yet</p>
                <p className="text-sm text-neutral-400 mt-1">
                  Start practicing to see your progress here
                </p>
                <Link to="/practice" className="inline-block mt-4">
                  <Button size="sm">Start Practice</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Brain className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">Practice Session</p>
                      <p className="text-xs text-neutral-500">Questions answered</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-neutral-900">{totalCorrect}/{totalQuestionsAttempted}</p>
                    <p className="text-xs text-neutral-500">{overallAccuracy}% accuracy</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Play Widget */}
          <QuickPlayCard
            onOpenModal={openQuickPlayModal}
            onOpenBrainTeaser={() => setBrainTeaserOpen(true)}
          />

          {/* Weekly Race */}
          {race?.cycle && (
            <Link to="/leaderboard" className="block group">
              <Card className="p-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Flag className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">Weekly Race</h3>
                      <p className="text-xs text-neutral-500">
                        First to {race.cycle.targetPoints.toLocaleString()} XP wins
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <ProgressBar
                  value={Math.min(((race.top[0]?.score ?? 0) / race.cycle.targetPoints) * 100, 100)}
                  size="sm"
                  className="mt-2"
                />
                <p className="text-xs text-neutral-500 mt-2">
                  {race.me
                    ? `You're #${race.me.rank} with ${race.me.score.toLocaleString()} XP`
                    : 'Earn XP this week to join the race'}
                </p>
              </Card>
            </Link>
          )}

          {/* O-Level / A-Level Progress Widget or Setup Card (sidebar version) */}
          {setupComplete || userSpecifications.length > 0 ? (
            <OALevelProgressWidget variant="compact" />
          ) : (
            <OALevelBanner variant="card" />
          )}

          {/* Rewards Widget - Mystery Chest & Lucky Wheel */}
          {(hasAvailableChest || hasWheelSpin) && (
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-neutral-900">Daily Rewards</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {hasAvailableChest && (
                  <button
                    onClick={() => setChestModalOpen(true)}
                    className="p-3 bg-white rounded-xl border border-purple-200 hover:shadow-md transition-all text-center"
                  >
                    <span className="text-2xl">🎁</span>
                    <p className="text-sm font-medium text-neutral-700 mt-1">Open Chest</p>
                  </button>
                )}
                {hasWheelSpin && (
                  <button
                    onClick={() => setWheelModalOpen(true)}
                    className="p-3 bg-white rounded-xl border border-purple-200 hover:shadow-md transition-all text-center"
                  >
                    <Sparkles className="w-6 h-6 mx-auto text-amber-500" />
                    <p className="text-sm font-medium text-neutral-700 mt-1">Spin Wheel</p>
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* Friend Activity Feed */}
          <FriendActivityWidget />

          {/* Exam Readiness */}
          <ExamReadinessGauge examType={currentExamType} compact />

          {/* Exam-Specific Featured Stats */}
          <FeaturedStats />

          {/* What to Study Next */}
          <RecommendedNext maxItems={3} />

          {/* Overall Progress */}
          <Card className="p-6">
            <CardHeader title="Overall Progress" />
            <div className="flex justify-center mb-4">
              <CircularProgress
                value={overallAccuracy}
                size={120}
                variant="primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-neutral-900">{totalQuestionsAttempted}</p>
                <p className="text-xs text-neutral-500">Questions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{Object.keys(topicProgress).length}</p>
                <p className="text-xs text-neutral-500">Topics Covered</p>
              </div>
            </div>
          </Card>

          {/* Areas to Improve */}
          <Card className="p-6">
            <CardHeader
              title="Areas to Improve"
              action={weaknesses.length > 0 ? <Badge variant="warning" size="sm">Focus</Badge> : undefined}
            />
            {weaknesses.length > 0 ? (
              <>
                <div className="space-y-3">
                  {weaknesses.map((topic) => (
                    <div key={topic.topicId}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-neutral-700 truncate">{topic.name}</span>
                        <span className="text-neutral-500">{topic.mastery}%</span>
                      </div>
                      <ProgressBar value={topic.mastery} variant="warning" size="sm" />
                    </div>
                  ))}
                </div>
                <Link to="/practice?filter=weak" className="block mt-4">
                  <Button variant="outline" fullWidth size="sm">
                    Practice Weak Topics
                  </Button>
                </Link>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-neutral-500 text-sm">
                  {totalQuestionsAttempted > 0
                    ? "Great job! No weak areas identified yet."
                    : "Start practicing to identify areas for improvement."
                  }
                </p>
              </div>
            )}
          </Card>

          {/* Strengths */}
          <Card className="p-6">
            <CardHeader
              title="Your Strengths"
              action={strengths.length > 0 ? <Badge variant="success" size="sm">Great!</Badge> : undefined}
            />
            {strengths.length > 0 ? (
              <div className="space-y-3">
                {strengths.map((topic) => (
                  <div key={topic.topicId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-700 truncate">{topic.name}</span>
                      <span className="text-neutral-500">{topic.mastery}%</span>
                    </div>
                    <ProgressBar value={topic.mastery} variant="success" size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-neutral-500 text-sm">
                  {totalQuestionsAttempted > 0
                    ? "Keep practicing to build your strengths!"
                    : "Your strengths will appear here as you practice."
                  }
                </p>
              </div>
            )}
          </Card>

          {/* Achievements */}
          <Card className="p-6">
            <CardHeader
              title="Achievements"
            />
            <div className="space-y-3">
              {availableAchievements.slice(0, 3).map((achievement) => {
                // Determine if achievement is unlocked based on current progress
                let isUnlocked = false;
                if (achievement.id === 'first_question') isUnlocked = totalQuestionsAttempted >= 1;
                if (achievement.id === 'streak_3') isUnlocked = longestStreak >= 3;
                if (achievement.id === 'streak_7') isUnlocked = longestStreak >= 7;
                if (achievement.id === 'questions_50') isUnlocked = totalQuestionsAttempted >= 50;
                if (achievement.id === 'accuracy_90') isUnlocked = overallAccuracy >= 90 && totalQuestionsAttempted >= 10;

                return (
                  <div
                    key={achievement.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg',
                      isUnlocked ? 'bg-primary-50' : 'bg-neutral-50 opacity-50'
                    )}
                  >
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <p className="font-medium text-neutral-900">{achievement.name}</p>
                      <p className="text-xs text-neutral-500">{achievement.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Play Modals */}
      <QuickPlayModal
        isOpen={isQuickPlayModalOpen}
        onClose={closeQuickPlayModal}
      />

      {/* Speed Blitz Game (renders when session active) */}
      {currentSession && <SpeedBlitz />}

      {/* Daily Brain Teaser */}
      <DailyBrainTeaser
        isOpen={brainTeaserOpen}
        onClose={() => setBrainTeaserOpen(false)}
      />

      {/* Mystery Chest Modal */}
      <MysteryChestModal
        isOpen={chestModalOpen}
        onClose={() => setChestModalOpen(false)}
      />

      {/* Lucky Wheel Modal */}
      <LuckyWheelModal
        isOpen={wheelModalOpen}
        onClose={() => setWheelModalOpen(false)}
      />

      {/* Comeback Challenge Modal */}
      <ComebackModal
        isOpen={comebackModalOpen}
        onClose={() => setComebackModalOpen(false)}
      />

      {/* Surprise Challenge Popup */}
      {activeChallenge && (
        <SurpriseChallengePopup
          challenge={activeChallenge}
          onAccept={dismissSurpriseChallenge}
          onDismiss={dismissSurpriseChallenge}
        />
      )}

      {/* Nudge Container - Fixed position for friend nudges */}
      <NudgeContainer />
    </div>
  );
}

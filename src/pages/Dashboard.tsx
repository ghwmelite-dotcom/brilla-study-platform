import { Link } from 'react-router-dom';
import {
  Flame,
  Star,
  Target,
  Trophy,
  BookOpen,
  Brain,
  Award,
} from 'lucide-react';
import { Card, CardHeader, Button, Badge, ProgressBar, CircularProgress } from '@/components/common';
import { useAuthStore, useProgressStore } from '@/stores';
import { cn } from '@/utils';

export function DashboardPage() {
  const { user } = useAuthStore();
  const {
    totalQuestionsAttempted,
    totalCorrect,
    overallAccuracy,
    currentStreak,
    longestStreak,
    totalXP,
    level,
    topicProgress,
  } = useProgressStore();

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
  const strengths = useProgressStore((state) => state.getStrengths());
  const weaknesses = useProgressStore((state) => state.getWeaknesses());

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
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">
            Welcome back, {user.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-neutral-500">
            Keep up the great work. You're making excellent progress!
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/practice">
            <Button leftIcon={<Brain className="w-4 h-4" />}>
              Practice Now
            </Button>
          </Link>
          <Link to="/competition">
            <Button variant="outline" leftIcon={<Trophy className="w-4 h-4" />}>
              Competition
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{currentStreak}</p>
              <p className="text-xs text-neutral-500">Day Streak</p>
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
              <p className="text-xs text-neutral-500">Accuracy</p>
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
              <p className="text-xs text-neutral-500">Total XP</p>
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
    </div>
  );
}

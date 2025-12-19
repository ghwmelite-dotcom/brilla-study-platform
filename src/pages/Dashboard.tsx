import { Link } from 'react-router-dom';
import {
  Flame,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Clock,
  BookOpen,
  Brain,
  ChevronRight,
  Award,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, Button, Badge, ProgressBar, CircularProgress } from '@/components/common';
import { useAuthStore, useProgressStore } from '@/stores';
import { cn, formatRelativeTime } from '@/utils';

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

  // Sample data for demonstration
  const recentActivity = [
    { type: 'practice', topic: 'Quadratic Equations', score: 8, total: 10, time: '2 hours ago' },
    { type: 'speed', topic: 'Speed Race', score: 45, total: 50, time: '5 hours ago' },
    { type: 'quiz', topic: 'Thermodynamics', score: 7, total: 10, time: 'Yesterday' },
  ];

  const weakTopics = [
    { name: 'Organic Chemistry', mastery: 35 },
    { name: 'Modern Physics', mastery: 42 },
    { name: 'Ecology', mastery: 48 },
  ];

  const strongTopics = [
    { name: 'Algebra', mastery: 92 },
    { name: 'Mechanics', mastery: 88 },
    { name: 'Cell Biology', mastery: 85 },
  ];

  const achievements = [
    { icon: '🔥', name: 'Week Warrior', description: '7 day streak', unlocked: true },
    { icon: '🎯', name: 'Sharpshooter', description: '90% accuracy', unlocked: true },
    { icon: '⚡', name: 'Speed Demon', description: 'Coming soon', unlocked: false },
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
              subtitle="Complete these to maintain your streak"
              action={<Badge variant="primary">3/5 complete</Badge>}
            />
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-neutral-700">Answer 10 questions</span>
                </div>
                <span className="text-sm text-green-600">10/10</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-neutral-700">Complete a speed round</span>
                </div>
                <span className="text-sm text-green-600">Done</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-neutral-700">Review 5 flashcards</span>
                </div>
                <span className="text-sm text-green-600">Done</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg border border-primary-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary text-sm">4</span>
                  </div>
                  <span className="text-neutral-700">Practice a weak topic</span>
                </div>
                <Link to="/practice?mode=drill">
                  <Button size="sm">Start</Button>
                </Link>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                    <span className="text-neutral-500 text-sm">5</span>
                  </div>
                  <span className="text-neutral-500">Achieve 80% accuracy today</span>
                </div>
                <span className="text-sm text-neutral-400">75%</span>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <CardHeader
              title="Recent Activity"
              action={
                <Link to="/history">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              }
            />
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      activity.type === 'practice' && 'bg-blue-100',
                      activity.type === 'speed' && 'bg-yellow-100',
                      activity.type === 'quiz' && 'bg-purple-100'
                    )}>
                      {activity.type === 'practice' && <BookOpen className="w-4 h-4 text-blue-500" />}
                      {activity.type === 'speed' && <Zap className="w-4 h-4 text-yellow-500" />}
                      {activity.type === 'quiz' && <Brain className="w-4 h-4 text-purple-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{activity.topic}</p>
                      <p className="text-xs text-neutral-500">{activity.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-neutral-900">{activity.score}/{activity.total}</p>
                    <p className="text-xs text-neutral-500">
                      {Math.round((activity.score / activity.total) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Overall Progress */}
          <Card className="p-6">
            <CardHeader title="Overall Progress" />
            <div className="flex justify-center mb-4">
              <CircularProgress
                value={overallAccuracy || 75}
                size={120}
                variant="primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-neutral-900">{totalQuestionsAttempted || 156}</p>
                <p className="text-xs text-neutral-500">Questions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{Object.keys(topicProgress).length || 12}</p>
                <p className="text-xs text-neutral-500">Topics Covered</p>
              </div>
            </div>
          </Card>

          {/* Areas to Improve */}
          <Card className="p-6">
            <CardHeader
              title="Areas to Improve"
              action={<Badge variant="warning" size="sm">Focus</Badge>}
            />
            <div className="space-y-3">
              {weakTopics.map((topic, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-700">{topic.name}</span>
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
          </Card>

          {/* Strengths */}
          <Card className="p-6">
            <CardHeader
              title="Your Strengths"
              action={<Badge variant="success" size="sm">Great!</Badge>}
            />
            <div className="space-y-3">
              {strongTopics.map((topic, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-700">{topic.name}</span>
                    <span className="text-neutral-500">{topic.mastery}%</span>
                  </div>
                  <ProgressBar value={topic.mastery} variant="success" size="sm" />
                </div>
              ))}
            </div>
          </Card>

          {/* Achievements */}
          <Card className="p-6">
            <CardHeader
              title="Achievements"
              action={
                <Link to="/achievements">
                  <Button variant="ghost" size="sm">
                    All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              }
            />
            <div className="space-y-3">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    achievement.unlocked ? 'bg-primary-50' : 'bg-neutral-50 opacity-50'
                  )}
                >
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <p className="font-medium text-neutral-900">{achievement.name}</p>
                    <p className="text-xs text-neutral-500">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

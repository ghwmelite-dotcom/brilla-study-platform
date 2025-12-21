import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Bell,
  Settings,
  TrendingUp,
  Target,
  Flame,
  Star,
  Award,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  BookOpen,
} from 'lucide-react';
import { Card, CardHeader, Button, Badge, ProgressBar, CircularProgress } from '@/components/common';
import { useParentStore, useAuthStore } from '@/stores';
import { cn } from '@/utils';
import type { ParentStudentLink, StudentProgressSummary } from '@/types';

// Student Card Component
function StudentCard({
  link,
  progress,
  isSelected,
  onSelect,
}: {
  link: ParentStudentLink;
  progress?: StudentProgressSummary;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const student = link.student;
  if (!student) return null;

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary border-primary'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            {student.avatarUrl ? (
              <img src={student.avatarUrl} alt={student.name} className="w-12 h-12 rounded-full" />
            ) : (
              <span className="text-lg font-bold text-primary">
                {student.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">{student.name}</h3>
            <p className="text-sm text-neutral-500">
              {student.schoolLevel?.toUpperCase()} {student.yearGroup && `Year ${student.yearGroup}`}
            </p>
          </div>
        </div>
        {isSelected && (
          <Badge variant="primary" size="sm">Selected</Badge>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-orange-50 rounded-lg">
          <div className="flex items-center justify-center gap-1">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="font-bold text-neutral-900">{student.streakDays || 0}</span>
          </div>
          <p className="text-xs text-neutral-500">Streak</p>
        </div>
        <div className="p-2 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center gap-1">
            <Star className="w-3 h-3 text-blue-500" />
            <span className="font-bold text-neutral-900">{student.level || 1}</span>
          </div>
          <p className="text-xs text-neutral-500">Level</p>
        </div>
        <div className="p-2 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center gap-1">
            <Target className="w-3 h-3 text-green-500" />
            <span className="font-bold text-neutral-900">
              {progress?.overallAccuracy || 0}%
            </span>
          </div>
          <p className="text-xs text-neutral-500">Accuracy</p>
        </div>
      </div>

      {student.lastActiveAt && (
        <p className="mt-3 text-xs text-neutral-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Last active: {new Date(student.lastActiveAt).toLocaleDateString()}
        </p>
      )}
    </Card>
  );
}

// Notification Preview Component
function NotificationPreview({
  notifications,
  unreadCount,
}: {
  notifications: any[];
  unreadCount: number;
}) {
  const recentNotifs = notifications.slice(0, 3);

  return (
    <Card className="p-6">
      <CardHeader
        title="Recent Notifications"
        action={
          unreadCount > 0 ? (
            <Badge variant="primary" size="sm">{unreadCount} new</Badge>
          ) : undefined
        }
      />

      {recentNotifs.length === 0 ? (
        <div className="text-center py-6">
          <Bell className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-neutral-500 text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentNotifs.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                'p-3 rounded-lg flex items-start gap-3',
                notif.isRead ? 'bg-neutral-50' : 'bg-primary-50'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                notif.type === 'achievement_unlocked' && 'bg-yellow-100',
                notif.type === 'streak_milestone' && 'bg-orange-100',
                notif.type === 'low_performance' && 'bg-red-100',
                notif.type === 'topic_mastered' && 'bg-green-100',
                !['achievement_unlocked', 'streak_milestone', 'low_performance', 'topic_mastered'].includes(notif.type) && 'bg-blue-100'
              )}>
                {notif.type === 'achievement_unlocked' && <Award className="w-4 h-4 text-yellow-600" />}
                {notif.type === 'streak_milestone' && <Flame className="w-4 h-4 text-orange-600" />}
                {notif.type === 'low_performance' && <AlertCircle className="w-4 h-4 text-red-600" />}
                {notif.type === 'topic_mastered' && <CheckCircle className="w-4 h-4 text-green-600" />}
                {!['achievement_unlocked', 'streak_milestone', 'low_performance', 'topic_mastered'].includes(notif.type) &&
                  <Bell className="w-4 h-4 text-blue-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 text-sm">{notif.title}</p>
                <p className="text-xs text-neutral-500 truncate">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link to="/parent/notifications" className="block mt-4">
        <Button variant="outline" fullWidth size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
          View All Notifications
        </Button>
      </Link>
    </Card>
  );
}

export function ParentDashboardPage() {
  const { user } = useAuthStore();
  const {
    linkedStudents,
    selectedStudentId,
    studentProgress,
    notifications,
    unreadCount,
    isLoading,
    fetchLinkedStudents,
    selectStudent,
    fetchStudentProgress,
    fetchNotifications,
  } = useParentStore();

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchLinkedStudents(),
        fetchNotifications(),
      ]);
      setIsInitialLoad(false);
    };
    loadData();
  }, []);

  // Fetch progress when student is selected
  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentProgress(selectedStudentId);
    }
  }, [selectedStudentId]);

  const selectedStudent = linkedStudents.find(l => l.studentId === selectedStudentId);
  const currentProgress = selectedStudentId ? studentProgress[selectedStudentId] : null;

  if (!user || user.role !== 'parent') {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Access denied. Parent account required.</p>
      </div>
    );
  }

  if (isInitialLoad && isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // No linked students view
  if (linkedStudents.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="p-8 text-center">
          <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            No Students Linked Yet
          </h2>
          <p className="text-neutral-500 mb-6">
            To start monitoring your ward's progress, ask them to generate an invite code
            from their account settings.
          </p>
          <div className="bg-neutral-50 p-4 rounded-lg text-left mb-6">
            <h3 className="font-medium text-neutral-900 mb-2">How to link:</h3>
            <ol className="text-sm text-neutral-600 space-y-2">
              <li>1. Your ward logs into their Brilla account</li>
              <li>2. They go to Settings &gt; Parent Access</li>
              <li>3. They click "Generate Invite Code"</li>
              <li>4. They share the 6-character code with you</li>
              <li>5. You enter the code below to link accounts</li>
            </ol>
          </div>
          <Link to="/parent/settings">
            <Button>Enter Invite Code</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">
            Parent Dashboard
          </h1>
          <p className="text-neutral-500">
            Monitor your ward's learning progress and achievements
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/parent/notifications">
            <Button variant="outline" leftIcon={<Bell className="w-4 h-4" />}>
              {unreadCount > 0 && (
                <span className="mr-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
              Notifications
            </Button>
          </Link>
          <Link to="/parent/settings">
            <Button variant="outline" leftIcon={<Settings className="w-4 h-4" />}>
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Student Selector */}
      {linkedStudents.length > 1 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">Your Students</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {linkedStudents.map((link) => (
              <StudentCard
                key={link.id}
                link={link}
                progress={studentProgress[link.studentId]}
                isSelected={link.studentId === selectedStudentId}
                onSelect={() => selectStudent(link.studentId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Progress Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">
                      {currentProgress?.streakDays || 0}
                    </p>
                    <p className="text-xs text-neutral-500">Day Streak</p>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  Best: {currentProgress?.longestStreak || 0} days
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">
                      {currentProgress?.overallAccuracy || 0}%
                    </p>
                    <p className="text-xs text-neutral-500">Accuracy</p>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  {currentProgress?.totalCorrect || 0}/{currentProgress?.totalQuestionsAttempted || 0} correct
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">
                      {currentProgress?.xpPoints || 0}
                    </p>
                    <p className="text-xs text-neutral-500">Total XP</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">
                      Level {currentProgress?.level || 1}
                    </p>
                    <p className="text-xs text-neutral-500">Current Level</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Overall Progress */}
            <Card className="p-6">
              <CardHeader
                title={`${selectedStudent.student?.name}'s Progress`}
                action={
                  <Link to={`/parent/student/${selectedStudentId}`}>
                    <Button size="sm" variant="outline" rightIcon={<ChevronRight className="w-4 h-4" />}>
                      View Details
                    </Button>
                  </Link>
                }
              />
              <div className="flex items-center gap-8">
                <CircularProgress
                  value={currentProgress?.overallAccuracy || 0}
                  size={120}
                  variant="primary"
                />
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-neutral-50 rounded-lg">
                    <p className="text-2xl font-bold text-neutral-900">
                      {currentProgress?.totalQuestionsAttempted || 0}
                    </p>
                    <p className="text-sm text-neutral-500">Questions Attempted</p>
                  </div>
                  <div className="text-center p-4 bg-neutral-50 rounded-lg">
                    <p className="text-2xl font-bold text-neutral-900">
                      {currentProgress?.topicsStarted || 0}
                    </p>
                    <p className="text-sm text-neutral-500">Topics Started</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {currentProgress?.topicsMastered || 0}
                    </p>
                    <p className="text-sm text-neutral-500">Topics Mastered</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {currentProgress?.recentAchievements?.length || 0}
                    </p>
                    <p className="text-sm text-neutral-500">Achievements</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card className="p-6">
                <CardHeader
                  title="Strengths"
                  action={<Badge variant="success" size="sm">Good</Badge>}
                />
                {currentProgress?.strengthAreas && currentProgress.strengthAreas.length > 0 ? (
                  <div className="space-y-3">
                    {currentProgress.strengthAreas.map((topic) => (
                      <div key={topic.topicId}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-700 truncate">{topic.topicName}</span>
                          <span className="text-neutral-500">{topic.mastery}%</span>
                        </div>
                        <ProgressBar value={topic.mastery} variant="success" size="sm" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-neutral-500 text-sm">
                      Strengths will appear as your ward practices more
                    </p>
                  </div>
                )}
              </Card>

              {/* Areas to Improve */}
              <Card className="p-6">
                <CardHeader
                  title="Areas to Improve"
                  action={<Badge variant="warning" size="sm">Focus</Badge>}
                />
                {currentProgress?.weakAreas && currentProgress.weakAreas.length > 0 ? (
                  <div className="space-y-3">
                    {currentProgress.weakAreas.map((topic) => (
                      <div key={topic.topicId}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-700 truncate">{topic.topicName}</span>
                          <span className="text-neutral-500">{topic.mastery}%</span>
                        </div>
                        <ProgressBar value={topic.mastery} variant="warning" size="sm" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <BookOpen className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                    <p className="text-neutral-500 text-sm">
                      No weak areas identified yet
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Recent Achievements */}
            {currentProgress?.recentAchievements && currentProgress.recentAchievements.length > 0 && (
              <Card className="p-6">
                <CardHeader title="Recent Achievements" />
                <div className="flex flex-wrap gap-3">
                  {currentProgress.recentAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg"
                    >
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <p className="font-medium text-neutral-900 text-sm">{achievement.name}</p>
                        <p className="text-xs text-neutral-500">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Notifications */}
          <div className="space-y-6">
            <NotificationPreview
              notifications={notifications}
              unreadCount={unreadCount}
            />

            {/* Quick Actions */}
            <Card className="p-6">
              <CardHeader title="Quick Actions" />
              <div className="space-y-2">
                <Link to={`/parent/student/${selectedStudentId}`} className="block">
                  <Button variant="outline" fullWidth leftIcon={<TrendingUp className="w-4 h-4" />}>
                    View Detailed Progress
                  </Button>
                </Link>
                <Link to="/parent/settings" className="block">
                  <Button variant="outline" fullWidth leftIcon={<Settings className="w-4 h-4" />}>
                    Notification Settings
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Last Active */}
            {currentProgress?.lastActiveAt && (
              <Card className="p-4">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Clock className="w-4 h-4" />
                  <span>
                    Last active: {new Date(currentProgress.lastActiveAt).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Single student view (no selector needed) */}
      {linkedStudents.length === 1 && !selectedStudent && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-neutral-500">Loading student data...</p>
        </div>
      )}
    </div>
  );
}

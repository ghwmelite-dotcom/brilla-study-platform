import { useEffect, useState } from 'react';
import { useRef } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Clock,
  Target,
  Award,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { AdminCard, AdminCardHeader, AdminButton } from '@/components/admin';
import { api } from '@/lib/api';
import { cn } from '@/utils';

interface AnalyticsData {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    userGrowthPercent: number;
    byRole: { role: string; count: number }[];
    bySchoolLevel: { level: string; count: number }[];
  };
  engagementStats: {
    totalQuestionsAnswered: number;
    averageAccuracy: number;
    averageSessionDuration: number;
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
  };
  contentStats: {
    totalQuestions: number;
    questionsBySubject: { subject: string; count: number }[];
    questionsByDifficulty: { difficulty: string; count: number }[];
  };
  revenueStats: {
    totalRevenue: number;
    revenueThisMonth: number;
    revenueGrowthPercent: number;
    activeSubscriptions: number;
    churnRate: number;
  };
  trendData: {
    date: string;
    users: number;
    sessions: number;
    revenue: number;
  }[];
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const loadAnalyticsRef = useRef<() => void>(() => {});

  useEffect(() => {
    loadAnalyticsRef.current();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<AnalyticsData>(`/admin/analytics?range=${timeRange}`);
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  loadAnalyticsRef.current = loadAnalytics;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return `GH₵ ${amount.toLocaleString()}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-admin-text">Analytics</h1>
          <p className="text-admin-text-secondary">Platform insights and metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-admin-bg-tertiary rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  timeRange === range
                    ? 'bg-admin-accent-cyan text-white'
                    : 'text-admin-text-muted hover:text-admin-text'
                )}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <AdminButton
            variant="secondary"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={loadAnalytics}
            isLoading={isLoading}
          >
            Refresh
          </AdminButton>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-admin-text-secondary">Total Users</p>
              <p className="text-3xl font-display font-bold text-admin-text mt-1">
                {formatNumber(data?.userStats.totalUsers || 0)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {(data?.userStats.userGrowthPercent || 0) >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-admin-accent-emerald" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-admin-accent-rose" />
                )}
                <span className={cn(
                  'text-sm',
                  (data?.userStats.userGrowthPercent || 0) >= 0
                    ? 'text-admin-accent-emerald'
                    : 'text-admin-accent-rose'
                )}>
                  {Math.abs(data?.userStats.userGrowthPercent || 0)}% this month
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/20">
              <Users className="w-6 h-6 text-admin-accent-cyan" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
        </AdminCard>

        <AdminCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-admin-text-secondary">Questions Answered</p>
              <p className="text-3xl font-display font-bold text-admin-text mt-1">
                {formatNumber(data?.engagementStats.totalQuestionsAnswered || 0)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Target className="w-4 h-4 text-admin-accent-emerald" />
                <span className="text-sm text-admin-accent-emerald">
                  {data?.engagementStats.averageAccuracy || 0}% accuracy
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <BookOpen className="w-6 h-6 text-admin-accent-emerald" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        </AdminCard>

        <AdminCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-admin-text-secondary">Avg. Session</p>
              <p className="text-3xl font-display font-bold text-admin-text mt-1">
                {formatDuration(data?.engagementStats.averageSessionDuration || 0)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Activity className="w-4 h-4 text-admin-accent-purple" />
                <span className="text-sm text-admin-text-muted">
                  {data?.engagementStats.dailyActiveUsers || 0} active today
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/20">
              <Clock className="w-6 h-6 text-admin-accent-purple" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
        </AdminCard>

        <AdminCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-admin-text-secondary">Revenue</p>
              <p className="text-3xl font-display font-bold text-admin-text mt-1">
                {formatCurrency(data?.revenueStats.revenueThisMonth || 0)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {(data?.revenueStats.revenueGrowthPercent || 0) >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-admin-accent-emerald" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-admin-accent-rose" />
                )}
                <span className={cn(
                  'text-sm',
                  (data?.revenueStats.revenueGrowthPercent || 0) >= 0
                    ? 'text-admin-accent-emerald'
                    : 'text-admin-accent-rose'
                )}>
                  {Math.abs(data?.revenueStats.revenueGrowthPercent || 0)}% growth
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/20">
              <Award className="w-6 h-6 text-admin-accent-amber" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        </AdminCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <AdminCard>
          <AdminCardHeader
            title="User Distribution"
            subtitle="By role"
            icon={<PieChart className="w-5 h-5" />}
          />
          <div className="space-y-3 mt-4">
            {(data?.userStats.byRole || []).map((item, index) => {
              const colors = ['bg-admin-accent-cyan', 'bg-admin-accent-emerald', 'bg-admin-accent-purple', 'bg-admin-accent-amber'];
              const total = data?.userStats.totalUsers || 1;
              const percent = Math.round((item.count / total) * 100);
              return (
                <div key={item.role}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-admin-text capitalize">{item.role}s</span>
                    <span className="text-admin-text-muted">{item.count} ({percent}%)</span>
                  </div>
                  <div className="h-2 bg-admin-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', colors[index % colors.length])}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!data?.userStats.byRole || data.userStats.byRole.length === 0) && (
              <p className="text-center text-admin-text-muted py-4">No user data available</p>
            )}
          </div>
        </AdminCard>

        {/* School Level Distribution */}
        <AdminCard>
          <AdminCardHeader
            title="Students by Level"
            subtitle="School level distribution"
            icon={<BarChart3 className="w-5 h-5" />}
          />
          <div className="space-y-3 mt-4">
            {(data?.userStats.bySchoolLevel || []).map((item, index) => {
              const colors = ['bg-admin-accent-blue', 'bg-admin-accent-cyan', 'bg-admin-accent-emerald'];
              const maxCount = Math.max(...(data?.userStats.bySchoolLevel || []).map(i => i.count), 1);
              const percent = Math.round((item.count / maxCount) * 100);
              return (
                <div key={item.level}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-admin-text">{item.level}</span>
                    <span className="text-admin-text-muted">{item.count} students</span>
                  </div>
                  <div className="h-2 bg-admin-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', colors[index % colors.length])}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!data?.userStats.bySchoolLevel || data.userStats.bySchoolLevel.length === 0) && (
              <p className="text-center text-admin-text-muted py-4">No school level data available</p>
            )}
          </div>
        </AdminCard>
      </div>

      {/* Engagement Metrics */}
      <AdminCard>
        <AdminCardHeader
          title="Engagement Overview"
          subtitle="User activity metrics"
          icon={<Activity className="w-5 h-5" />}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="text-center p-4 bg-admin-bg-tertiary/50 rounded-xl">
            <p className="text-3xl font-bold text-admin-accent-cyan">
              {data?.engagementStats.dailyActiveUsers || 0}
            </p>
            <p className="text-sm text-admin-text-muted mt-1">Daily Active Users</p>
          </div>
          <div className="text-center p-4 bg-admin-bg-tertiary/50 rounded-xl">
            <p className="text-3xl font-bold text-admin-accent-emerald">
              {data?.engagementStats.weeklyActiveUsers || 0}
            </p>
            <p className="text-sm text-admin-text-muted mt-1">Weekly Active Users</p>
          </div>
          <div className="text-center p-4 bg-admin-bg-tertiary/50 rounded-xl">
            <p className="text-3xl font-bold text-admin-accent-purple">
              {data?.engagementStats.monthlyActiveUsers || 0}
            </p>
            <p className="text-sm text-admin-text-muted mt-1">Monthly Active Users</p>
          </div>
        </div>
      </AdminCard>

      {/* Content Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminCard>
          <AdminCardHeader
            title="Questions by Subject"
            subtitle="Content distribution"
            icon={<BookOpen className="w-5 h-5" />}
          />
          <div className="space-y-3 mt-4">
            {(data?.contentStats.questionsBySubject || []).map((item) => {
              const total = data?.contentStats.totalQuestions || 1;
              const percent = Math.round((item.count / total) * 100);
              return (
                <div key={item.subject}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-admin-text">{item.subject}</span>
                    <span className="text-admin-text-muted">{item.count} ({percent}%)</span>
                  </div>
                  <div className="h-2 bg-admin-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-admin-accent-cyan transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!data?.contentStats.questionsBySubject || data.contentStats.questionsBySubject.length === 0) && (
              <p className="text-center text-admin-text-muted py-4">No content data available</p>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader
            title="Questions by Difficulty"
            subtitle="Difficulty distribution"
            icon={<Target className="w-5 h-5" />}
          />
          <div className="space-y-3 mt-4">
            {(data?.contentStats.questionsByDifficulty || []).map((item) => {
              const total = data?.contentStats.totalQuestions || 1;
              const percent = Math.round((item.count / total) * 100);
              const colors: Record<string, string> = {
                easy: 'bg-admin-accent-emerald',
                medium: 'bg-admin-accent-amber',
                hard: 'bg-admin-accent-rose',
              };
              return (
                <div key={item.difficulty}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-admin-text capitalize">{item.difficulty}</span>
                    <span className="text-admin-text-muted">{item.count} ({percent}%)</span>
                  </div>
                  <div className="h-2 bg-admin-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', colors[item.difficulty] || 'bg-admin-accent-cyan')}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!data?.contentStats.questionsByDifficulty || data.contentStats.questionsByDifficulty.length === 0) && (
              <p className="text-center text-admin-text-muted py-4">No difficulty data available</p>
            )}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}

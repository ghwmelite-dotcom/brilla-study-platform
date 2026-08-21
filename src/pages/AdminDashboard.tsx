import { useEffect, useState } from 'react';
import { useRef } from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  Activity,
  CreditCard,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Database,
  Server,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminCard, AdminCardHeader, AdminButton, AdminBadge } from '@/components/admin';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { cn } from '@/utils';

interface DashboardStats {
  totalUsers: number;
  activeToday: number;
  newThisWeek: number;
  pendingApprovals: number;
  revenue: number;
  trials: number;
}

interface RecentActivity {
  id: string;
  type: 'registration' | 'login' | 'approval' | 'payment' | 'system';
  message: string;
  user?: string;
  timestamp: string;
}

interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  api: 'healthy' | 'degraded' | 'down';
  storage: 'healthy' | 'degraded' | 'down';
}

export default function AdminDashboard() {
  const { pendingCount, loadPendingUsers } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeToday: 0,
    newThisWeek: 0,
    pendingApprovals: 0,
    revenue: 0,
    trials: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    api: 'healthy',
    storage: 'healthy',
  });
  const [isLoading, setIsLoading] = useState(true);
  const loadDashboardDataRef = useRef<() => void>(() => {});

  useEffect(() => {
    loadDashboardDataRef.current();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load pending users count
      await loadPendingUsers();

      // Try to fetch dashboard stats from API
      const statsResponse = await api.get<DashboardStats>('/admin/dashboard/stats');
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      // Try to fetch recent activity
      const activityResponse = await api.get<RecentActivity[]>('/admin/activity/recent');
      if (activityResponse.success && activityResponse.data) {
        setRecentActivity(activityResponse.data);
      }

      // Check system health
      const healthResponse = await api.get<SystemHealth>('/admin/system/health');
      if (healthResponse.success && healthResponse.data) {
        setSystemHealth(healthResponse.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set some mock data for demonstration
      setStats({
        totalUsers: 150,
        activeToday: 45,
        newThisWeek: 12,
        pendingApprovals: pendingCount,
        revenue: 2500,
        trials: 23,
      });
      setRecentActivity([
        { id: '1', type: 'registration', message: 'New student registration', user: 'John Mensah', timestamp: new Date().toISOString() },
        { id: '2', type: 'login', message: 'Admin login', user: 'Admin User', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: '3', type: 'payment', message: 'Subscription payment received', user: 'Kwame Asante', timestamp: new Date(Date.now() - 7200000).toISOString() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  loadDashboardDataRef.current = loadDashboardData;

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      trend: '+12%',
      trendUp: true,
      color: 'cyan',
    },
    {
      title: 'Active Today',
      value: stats.activeToday,
      icon: Activity,
      trend: '+5%',
      trendUp: true,
      color: 'emerald',
    },
    {
      title: 'Pending Approvals',
      value: pendingCount,
      icon: UserCheck,
      trend: pendingCount > 0 ? 'Action needed' : 'All clear',
      trendUp: pendingCount === 0,
      color: pendingCount > 0 ? 'amber' : 'emerald',
      link: '/admin/approvals',
    },
    {
      title: 'Active Trials',
      value: stats.trials,
      icon: Clock,
      trend: 'This month',
      trendUp: true,
      color: 'purple',
    },
  ];

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'registration': return <UserPlus className="w-4 h-4 text-admin-accent-cyan" />;
      case 'login': return <Activity className="w-4 h-4 text-admin-accent-emerald" />;
      case 'approval': return <UserCheck className="w-4 h-4 text-admin-accent-blue" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-admin-accent-purple" />;
      case 'system': return <Zap className="w-4 h-4 text-admin-accent-amber" />;
      default: return <Activity className="w-4 h-4 text-admin-text-muted" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const healthStatusColor = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy': return 'text-admin-accent-emerald';
      case 'degraded': return 'text-admin-accent-amber';
      case 'down': return 'text-admin-accent-rose';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-admin-text">Dashboard</h1>
          <p className="text-admin-text-secondary">Welcome back, Administrator</p>
        </div>
        <AdminButton
          variant="secondary"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={loadDashboardData}
          isLoading={isLoading}
        >
          Refresh
        </AdminButton>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const cardContent = (
            <AdminCard hover className="relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-admin-text-secondary">{stat.title}</p>
                  <p className="text-3xl font-display font-bold text-admin-text mt-1">
                    {stat.value.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trendUp ? (
                      <ArrowUpRight className="w-4 h-4 text-admin-accent-emerald" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-admin-accent-rose" />
                    )}
                    <span className={cn(
                      'text-sm',
                      stat.trendUp ? 'text-admin-accent-emerald' : 'text-admin-accent-rose'
                    )}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
                <div className={cn(
                  'p-3 rounded-xl',
                  stat.color === 'cyan' && 'bg-cyan-500/20',
                  stat.color === 'emerald' && 'bg-emerald-500/20',
                  stat.color === 'amber' && 'bg-amber-500/20',
                  stat.color === 'purple' && 'bg-purple-500/20',
                )}>
                  <Icon className={cn(
                    'w-6 h-6',
                    stat.color === 'cyan' && 'text-admin-accent-cyan',
                    stat.color === 'emerald' && 'text-admin-accent-emerald',
                    stat.color === 'amber' && 'text-admin-accent-amber',
                    stat.color === 'purple' && 'text-admin-accent-purple',
                  )} />
                </div>
              </div>
              {/* Decorative gradient */}
              <div className={cn(
                'absolute bottom-0 left-0 right-0 h-1',
                stat.color === 'cyan' && 'bg-gradient-to-r from-cyan-500 to-blue-500',
                stat.color === 'emerald' && 'bg-gradient-to-r from-emerald-500 to-teal-500',
                stat.color === 'amber' && 'bg-gradient-to-r from-amber-500 to-orange-500',
                stat.color === 'purple' && 'bg-gradient-to-r from-purple-500 to-pink-500',
              )} />
            </AdminCard>
          );

          return stat.link ? (
            <Link key={stat.title} to={stat.link}>{cardContent}</Link>
          ) : (
            <div key={stat.title}>{cardContent}</div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity - Takes 2 columns */}
        <div className="lg:col-span-2">
          <AdminCard padding="none">
            <AdminCardHeader
              title="Recent Activity"
              subtitle="Latest platform events"
              icon={<Activity className="w-5 h-5" />}
              className="px-6 pt-6"
            />
            <div className="px-6 pb-6">
              {recentActivity.length === 0 ? (
                <p className="text-center text-admin-text-muted py-8">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-3 bg-admin-bg-tertiary/50 rounded-lg"
                    >
                      <div className="p-2 bg-admin-bg rounded-lg">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-admin-text truncate">{activity.message}</p>
                        {activity.user && (
                          <p className="text-xs text-admin-text-muted">{activity.user}</p>
                        )}
                      </div>
                      <span className="text-xs text-admin-text-muted whitespace-nowrap">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AdminCard>
        </div>

        {/* System Health - Takes 1 column */}
        <div className="space-y-6">
          <AdminCard>
            <AdminCardHeader
              title="System Health"
              subtitle="Service status"
              icon={<Server className="w-5 h-5" />}
            />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-admin-text-muted" />
                  <span className="text-sm text-admin-text">Database</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', healthStatusColor(systemHealth.database).replace('text-', 'bg-'))} />
                  <span className={cn('text-sm capitalize', healthStatusColor(systemHealth.database))}>
                    {systemHealth.database}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-admin-text-muted" />
                  <span className="text-sm text-admin-text">API</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', healthStatusColor(systemHealth.api).replace('text-', 'bg-'))} />
                  <span className={cn('text-sm capitalize', healthStatusColor(systemHealth.api))}>
                    {systemHealth.api}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Server className="w-5 h-5 text-admin-text-muted" />
                  <span className="text-sm text-admin-text">Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', healthStatusColor(systemHealth.storage).replace('text-', 'bg-'))} />
                  <span className={cn('text-sm capitalize', healthStatusColor(systemHealth.storage))}>
                    {systemHealth.storage}
                  </span>
                </div>
              </div>
            </div>
          </AdminCard>

          {/* Quick Actions */}
          <AdminCard>
            <AdminCardHeader
              title="Quick Actions"
              subtitle="Common tasks"
              icon={<Zap className="w-5 h-5" />}
            />
            <div className="space-y-2">
              <Link to="/admin/users">
                <AdminButton variant="ghost" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </AdminButton>
              </Link>
              <Link to="/admin/approvals">
                <AdminButton variant="ghost" className="w-full justify-start">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Review Approvals
                  {pendingCount > 0 && (
                    <AdminBadge variant="amber" className="ml-auto">{pendingCount}</AdminBadge>
                  )}
                </AdminButton>
              </Link>
              <Link to="/admin/audit">
                <AdminButton variant="ghost" className="w-full justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  View Audit Log
                </AdminButton>
              </Link>
              <Link to="/admin/subscriptions">
                <AdminButton variant="ghost" className="w-full justify-start">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Subscriptions
                </AdminButton>
              </Link>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}

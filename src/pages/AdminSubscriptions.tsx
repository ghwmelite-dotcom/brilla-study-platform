import { useEffect, useState } from 'react';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  DollarSign,
} from 'lucide-react';
import { AdminCard, AdminButton, AdminBadge, AdminInput } from '@/components/admin';
import { api } from '@/lib/api';
import { cn } from '@/utils';

interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialUsers: number;
  expiringSoon: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  growthPercent: number;
  churnRate: number;
  averageLifetimeValue: number;
  conversionRate: number;
}

interface Subscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planName: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

interface Trial {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  startedAt: string;
  expiresAt: string;
  daysRemaining: number;
  tasksCompleted: number;
  status: 'active' | 'expired' | 'converted';
}

export default function AdminSubscriptions() {
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'trials'>('subscriptions');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, subsRes, trialsRes] = await Promise.all([
        api.get<SubscriptionStats>('/admin/subscriptions/stats'),
        api.get<Subscription[]>('/admin/subscriptions/list'),
        api.get<Trial[]>('/admin/subscriptions/trials'),
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (subsRes.success && subsRes.data) setSubscriptions(subsRes.data);
      if (trialsRes.success && trialsRes.data) setTrials(trialsRes.data);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `GH₵ ${amount.toLocaleString()}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'emerald' | 'amber' | 'rose' | 'cyan'> = {
      active: 'emerald',
      trial: 'cyan',
      cancelled: 'rose',
      expired: 'rose',
      converted: 'emerald',
    };
    return <AdminBadge variant={variants[status] || 'amber'}>{status}</AdminBadge>;
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTrials = trials.filter((trial) => {
    const matchesSearch =
      trial.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trial.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trial.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-admin-text">Subscriptions</h1>
          <p className="text-admin-text-secondary">Manage subscriptions and trials</p>
        </div>
        <AdminButton
          variant="secondary"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={loadData}
          isLoading={isLoading}
        >
          Refresh
        </AdminButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-admin-text-secondary">Active Subscriptions</p>
              <p className="text-3xl font-display font-bold text-admin-text mt-1">
                {stats?.activeSubscriptions || 0}
              </p>
              <p className="text-xs text-admin-text-muted mt-2">
                of {stats?.totalSubscriptions || 0} total
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <CheckCircle className="w-6 h-6 text-admin-accent-emerald" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        </AdminCard>

        <AdminCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-admin-text-secondary">Active Trials</p>
              <p className="text-3xl font-display font-bold text-admin-text mt-1">
                {stats?.trialUsers || 0}
              </p>
              <p className="text-xs text-admin-text-muted mt-2">
                {stats?.conversionRate || 0}% conversion rate
              </p>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/20">
              <Clock className="w-6 h-6 text-admin-accent-cyan" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
        </AdminCard>

        <AdminCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-admin-text-secondary">Revenue This Month</p>
              <p className="text-3xl font-display font-bold text-admin-text mt-1">
                {formatCurrency(stats?.revenueThisMonth || 0)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {(stats?.growthPercent || 0) >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-admin-accent-emerald" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-admin-accent-rose" />
                )}
                <span className={cn(
                  'text-xs',
                  (stats?.growthPercent || 0) >= 0 ? 'text-admin-accent-emerald' : 'text-admin-accent-rose'
                )}>
                  {Math.abs(stats?.growthPercent || 0)}% vs last month
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/20">
              <DollarSign className="w-6 h-6 text-admin-accent-amber" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        </AdminCard>

        <AdminCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-admin-text-secondary">Expiring Soon</p>
              <p className="text-3xl font-display font-bold text-admin-text mt-1">
                {stats?.expiringSoon || 0}
              </p>
              <p className="text-xs text-admin-text-muted mt-2">
                in the next 7 days
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/20">
              <AlertTriangle className="w-6 h-6 text-admin-accent-rose" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
        </AdminCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-admin-border">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'subscriptions'
              ? 'border-admin-accent-cyan text-admin-accent-cyan'
              : 'border-transparent text-admin-text-muted hover:text-admin-text'
          )}
        >
          <CreditCard className="w-4 h-4 inline mr-2" />
          Subscriptions ({subscriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('trials')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'trials'
              ? 'border-admin-accent-cyan text-admin-accent-cyan'
              : 'border-transparent text-admin-text-muted hover:text-admin-text'
          )}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Trials ({trials.length})
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <AdminInput
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-admin-bg-tertiary border border-admin-border rounded-lg text-admin-text text-sm focus:outline-none focus:ring-2 focus:ring-admin-accent-cyan"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Content */}
      <AdminCard padding="none">
        {activeTab === 'subscriptions' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-border">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Plan</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Amount</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Period</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-admin-bg-tertiary/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-admin-text">{sub.userName}</p>
                        <p className="text-xs text-admin-text-muted">{sub.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-admin-text">{sub.planName}</p>
                      <p className="text-xs text-admin-text-muted capitalize">{sub.billingCycle}</p>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(sub.status)}</td>
                    <td className="px-6 py-4 text-sm text-admin-text">{formatCurrency(sub.amount)}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-admin-text">{formatDate(sub.startDate)}</p>
                      <p className="text-xs text-admin-text-muted">to {formatDate(sub.endDate)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <AdminButton variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </AdminButton>
                    </td>
                  </tr>
                ))}
                {filteredSubscriptions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-admin-text-muted">
                      No subscriptions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-border">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Started</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Expires</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Days Left</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Tasks</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {filteredTrials.map((trial) => (
                  <tr key={trial.id} className="hover:bg-admin-bg-tertiary/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-admin-text">{trial.userName}</p>
                        <p className="text-xs text-admin-text-muted">{trial.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-admin-text">{formatDate(trial.startedAt)}</td>
                    <td className="px-6 py-4 text-sm text-admin-text">{formatDate(trial.expiresAt)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'text-sm font-medium',
                        trial.daysRemaining <= 3 ? 'text-admin-accent-rose' : 'text-admin-text'
                      )}>
                        {trial.daysRemaining > 0 ? `${trial.daysRemaining} days` : 'Expired'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-admin-text">{trial.tasksCompleted}/5</td>
                    <td className="px-6 py-4">{getStatusBadge(trial.status)}</td>
                  </tr>
                ))}
                {filteredTrials.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-admin-text-muted">
                      No trials found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}

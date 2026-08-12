import { useEffect, useState } from 'react';
import {
  Users,
  DollarSign,
  UserPlus,
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  Eye,
  Ticket,
  Copy,
  X,
} from 'lucide-react';
import { AdminCard, AdminButton, AdminBadge, AdminInput } from '@/components/admin';
import { api } from '@/lib/api';
import { cn } from '@/utils';

interface AffiliateStats {
  totalAffiliates: number;
  activeAffiliates: number;
  totalReferrals: number;
  successfulConversions: number;
  totalEarnings: number;
  pendingPayouts: number;
  conversionRate: number;
  earningsThisMonth: number;
}

interface Affiliate {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  referralCode: string;
  totalReferrals: number;
  conversions: number;
  totalEarnings: number;
  pendingEarnings: number;
  tier: string;
  tierColor: string;
  joinedAt: string;
  status: 'active' | 'inactive';
}

interface Payout {
  id: string;
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  mobileMoneyNumber: string;
  mobileMoneyProvider: string;
  amount: number;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  processedAt?: string;
}

// Raw row shape from GET /admin/referral-code-requests (growth loop Task 5)
interface CodeRequest {
  id: string;
  name: string;
  contact: string;
  school_name: string | null;
  message: string | null;
  status: 'pending' | 'fulfilled' | 'rejected';
  issued_code: string | null;
  created_at: string;
}

export default function AdminAffiliates() {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [codeRequests, setCodeRequests] = useState<CodeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'affiliates' | 'payouts' | 'requests'>('affiliates');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  // Code Requests tab action state
  const [issuingRequestId, setIssuingRequestId] = useState<string | null>(null);
  const [issueCodeInput, setIssueCodeInput] = useState('');
  const [requestActionLoading, setRequestActionLoading] = useState<string | null>(null);
  const [requestActionError, setRequestActionError] = useState<string | null>(null);
  const [issuedCodes, setIssuedCodes] = useState<Record<string, string>>({});
  const [copiedRequestId, setCopiedRequestId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, affiliatesRes, payoutsRes, requestsRes] = await Promise.all([
        api.get<AffiliateStats>('/admin/affiliates/stats'),
        api.get<Affiliate[]>('/admin/affiliates/list'),
        api.get<Payout[]>('/admin/affiliates/payouts'),
        api.get<{ requests: CodeRequest[]; total: number }>('/admin/referral-code-requests'),
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (affiliatesRes.success && affiliatesRes.data) setAffiliates(affiliatesRes.data);
      if (payoutsRes.success && payoutsRes.data) setPayouts(payoutsRes.data);
      if (requestsRes.success && requestsRes.data) setCodeRequests(requestsRes.data.requests);
    } catch (error) {
      console.error('Failed to load affiliate data:', error);
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

  const getTierBadge = (tier: string, _tierColor?: string) => {
    // Map tier names to colors based on affiliate tier system
    const tierColors: Record<string, string> = {
      'Scout': 'bg-green-500/20 text-green-400',
      'Champion': 'bg-blue-500/20 text-blue-400',
      'Ambassador': 'bg-purple-500/20 text-purple-400',
      'Legend': 'bg-amber-500/20 text-amber-400',
      'Elite': 'bg-pink-500/20 text-pink-400',
      // Fallback colors
      'bronze': 'bg-amber-700/20 text-amber-400',
      'silver': 'bg-slate-400/20 text-slate-300',
      'gold': 'bg-yellow-500/20 text-yellow-400',
      'platinum': 'bg-purple-500/20 text-purple-300',
    };
    const colorClass = tierColors[tier] || 'bg-gray-500/20 text-gray-400';
    return (
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', colorClass)}>
        {tier}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'emerald' | 'amber' | 'rose' | 'cyan'> = {
      active: 'emerald',
      inactive: 'amber',
      suspended: 'rose',
      pending: 'amber',
      approved: 'cyan',
      processing: 'cyan',
      completed: 'emerald',
      failed: 'rose',
      fulfilled: 'emerald',
      rejected: 'rose',
    };
    return <AdminBadge variant={variants[status] || 'amber'}>{status}</AdminBadge>;
  };

  const filteredAffiliates = affiliates.filter((aff) => {
    const matchesSearch =
      aff.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      aff.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      aff.referralCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'all' || aff.tier.toLowerCase() === tierFilter.toLowerCase();
    return matchesSearch && matchesTier;
  });

  const filteredPayouts = payouts.filter((payout) => {
    return payout.affiliateName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredCodeRequests = codeRequests.filter((req) => {
    const q = searchQuery.toLowerCase();
    return (
      req.name.toLowerCase().includes(q) ||
      req.contact.toLowerCase().includes(q) ||
      (req.school_name || '').toLowerCase().includes(q)
    );
  });

  const handleApprovePayout = async (payoutId: string) => {
    try {
      await api.post(`/admin/affiliates/payouts/${payoutId}/approve`);
      loadData();
    } catch (error) {
      console.error('Failed to approve payout:', error);
    }
  };

  const handleFulfillRequest = async (requestId: string) => {
    const code = issueCodeInput.trim();
    if (!code) return;
    setRequestActionLoading(requestId);
    setRequestActionError(null);
    const res = await api.post<{ id: string; issuedCode: string }>(
      `/admin/referral-code-requests/${requestId}/fulfill`,
      { code }
    );
    setRequestActionLoading(null);
    if (res.success && res.data) {
      setIssuedCodes((prev) => ({ ...prev, [requestId]: res.data!.issuedCode }));
      setIssuingRequestId(null);
      setIssueCodeInput('');
      loadData();
    } else {
      setRequestActionError(res.error || 'Failed to issue code');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setRequestActionLoading(requestId);
    setRequestActionError(null);
    const res = await api.post(`/admin/referral-code-requests/${requestId}/reject`);
    setRequestActionLoading(null);
    if (res.success) {
      loadData();
    } else {
      setRequestActionError(res.error || 'Failed to reject request');
    }
  };

  const handleCopyCode = async (requestId: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedRequestId(requestId);
      setTimeout(() => setCopiedRequestId(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-admin-text">Affiliates</h1>
          <p className="text-admin-text-secondary">Manage affiliate program and payouts</p>
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
              <p className="text-sm text-admin-text-secondary">Active Affiliates</p>
              <p className="text-3xl font-display font-bold text-admin-text mt-1">
                {stats?.activeAffiliates || 0}
              </p>
              <p className="text-xs text-admin-text-muted mt-2">
                of {stats?.totalAffiliates || 0} total
              </p>
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
              <p className="text-sm text-admin-text-secondary">Total Referrals</p>
              <p className="text-3xl font-display font-bold text-admin-text mt-1">
                {stats?.totalReferrals || 0}
              </p>
              <p className="text-xs text-admin-text-muted mt-2">
                {stats?.successfulConversions || 0} converted ({stats?.conversionRate || 0}%)
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <UserPlus className="w-6 h-6 text-admin-accent-emerald" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        </AdminCard>

        <AdminCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-admin-text-secondary">Total Earnings</p>
              <p className="text-3xl font-display font-bold text-admin-text mt-1">
                {formatCurrency(stats?.totalEarnings || 0)}
              </p>
              <p className="text-xs text-admin-text-muted mt-2">
                This month: {formatCurrency(stats?.earningsThisMonth || 0)}
              </p>
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
              <p className="text-sm text-admin-text-secondary">Pending Payouts</p>
              <p className="text-3xl font-display font-bold text-admin-text mt-1">
                {formatCurrency(stats?.pendingPayouts || 0)}
              </p>
              <p className="text-xs text-admin-text-muted mt-2">
                {payouts.filter(p => p.status === 'pending').length} requests
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/20">
              <Clock className="w-6 h-6 text-admin-accent-purple" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
        </AdminCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-admin-border">
        <button
          onClick={() => setActiveTab('affiliates')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'affiliates'
              ? 'border-admin-accent-cyan text-admin-accent-cyan'
              : 'border-transparent text-admin-text-muted hover:text-admin-text'
          )}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Affiliates ({affiliates.length})
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'payouts'
              ? 'border-admin-accent-cyan text-admin-accent-cyan'
              : 'border-transparent text-admin-text-muted hover:text-admin-text'
          )}
        >
          <DollarSign className="w-4 h-4 inline mr-2" />
          Payouts ({payouts.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'requests'
              ? 'border-admin-accent-cyan text-admin-accent-cyan'
              : 'border-transparent text-admin-text-muted hover:text-admin-text'
          )}
        >
          <Ticket className="w-4 h-4 inline mr-2" />
          Code Requests ({codeRequests.filter((r) => r.status === 'pending').length})
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <AdminInput
            placeholder={
              activeTab === 'affiliates'
                ? 'Search by name, email, or code...'
                : activeTab === 'payouts'
                  ? 'Search payouts...'
                  : 'Search requests by name, contact, or school...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        {activeTab === 'affiliates' && (
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 bg-admin-bg-tertiary border border-admin-border rounded-lg text-admin-text text-sm focus:outline-none focus:ring-2 focus:ring-admin-accent-cyan"
          >
            <option value="all">All Tiers</option>
            <option value="scout">Scout</option>
            <option value="champion">Champion</option>
            <option value="ambassador">Ambassador</option>
            <option value="legend">Legend</option>
            <option value="elite">Elite</option>
          </select>
        )}
      </div>

      {/* Content */}
      <AdminCard padding="none">
        {activeTab === 'affiliates' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-border">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Affiliate</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Code</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Tier</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Referrals</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Earnings</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {filteredAffiliates.map((aff) => (
                  <tr key={aff.id} className="hover:bg-admin-bg-tertiary/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-admin-text">{aff.userName}</p>
                        <p className="text-xs text-admin-text-muted">{aff.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 bg-admin-bg-tertiary rounded text-xs text-admin-accent-cyan">
                        {aff.referralCode}
                      </code>
                    </td>
                    <td className="px-6 py-4">{getTierBadge(aff.tier, aff.tierColor)}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-admin-text">{aff.conversions}/{aff.totalReferrals}</p>
                      <p className="text-xs text-admin-text-muted">converted</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-admin-text">{formatCurrency(aff.totalEarnings)}</p>
                      <p className="text-xs text-admin-text-muted">{formatCurrency(aff.pendingEarnings)} pending</p>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(aff.status)}</td>
                    <td className="px-6 py-4">
                      <AdminButton variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </AdminButton>
                    </td>
                  </tr>
                ))}
                {filteredAffiliates.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-admin-text-muted">
                      No affiliates found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'payouts' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-border">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Affiliate</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Amount</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Mobile Money</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Requested</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-admin-bg-tertiary/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-admin-text">{payout.affiliateName}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-admin-accent-emerald">
                      {formatCurrency(payout.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-admin-text">{payout.mobileMoneyNumber}</p>
                      <p className="text-xs text-admin-text-muted uppercase">{payout.mobileMoneyProvider}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-admin-text">{formatDate(payout.requestedAt)}</td>
                    <td className="px-6 py-4">{getStatusBadge(payout.status)}</td>
                    <td className="px-6 py-4">
                      {payout.status === 'pending' && (
                        <AdminButton
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprovePayout(payout.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </AdminButton>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredPayouts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-admin-text-muted">
                      No payouts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {requestActionError && (
              <p className="px-6 pt-4 text-sm text-admin-accent-rose">{requestActionError}</p>
            )}
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-border">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Contact</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">School</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Message</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Requested</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {filteredCodeRequests.map((req) => {
                  const issuedCode = issuedCodes[req.id] || req.issued_code;
                  return (
                    <tr key={req.id} className="hover:bg-admin-bg-tertiary/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-admin-text">{req.name}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-admin-text">{req.contact}</td>
                      <td className="px-6 py-4 text-sm text-admin-text">{req.school_name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-admin-text-secondary max-w-xs truncate">
                        {req.message || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-admin-text">{formatDate(req.created_at)}</td>
                      <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                      <td className="px-6 py-4">
                        {req.status === 'pending' ? (
                          issuingRequestId === req.id ? (
                            <div className="flex items-center gap-2">
                              <AdminInput
                                placeholder="Ambassador code, e.g. STJOHNS"
                                value={issueCodeInput}
                                onChange={(e) => setIssueCodeInput(e.target.value.toUpperCase())}
                              />
                              <AdminButton
                                variant="primary"
                                size="sm"
                                isLoading={requestActionLoading === req.id}
                                onClick={() => handleFulfillRequest(req.id)}
                              >
                                Issue
                              </AdminButton>
                              <AdminButton
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setIssuingRequestId(null);
                                  setIssueCodeInput('');
                                }}
                              >
                                <X className="w-4 h-4" />
                              </AdminButton>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <AdminButton
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setIssuingRequestId(req.id);
                                  setIssueCodeInput('');
                                  setRequestActionError(null);
                                }}
                              >
                                <Ticket className="w-4 h-4 mr-1" />
                                Issue code
                              </AdminButton>
                              <AdminButton
                                variant="ghost"
                                size="sm"
                                isLoading={requestActionLoading === req.id}
                                onClick={() => handleRejectRequest(req.id)}
                              >
                                Reject
                              </AdminButton>
                            </div>
                          )
                        ) : req.status === 'fulfilled' && issuedCode ? (
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-admin-bg-tertiary rounded text-xs text-admin-accent-cyan">
                              {issuedCode}
                            </code>
                            <AdminButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyCode(req.id, issuedCode)}
                            >
                              {copiedRequestId === req.id ? (
                                <CheckCircle className="w-4 h-4 text-admin-accent-emerald" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </AdminButton>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
                {filteredCodeRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-admin-text-muted">
                      No code requests found
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

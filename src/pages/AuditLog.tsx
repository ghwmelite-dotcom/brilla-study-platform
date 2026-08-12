import { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Activity,
  Lock,
  Database,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, Button, Badge } from '@/components/common';
import { useAuthStore } from '@/stores';
import { fetchWithAuth } from '@/lib/api';
import type {
  AuditLogEntry,
  SecurityEvent,
  LoginAttempt,
  AuditActionCategory,
  AuditDashboardStats,
} from '@/types';

type TabType = 'overview' | 'logs' | 'security' | 'logins' | 'changes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export function AuditLog() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Dashboard stats
  const [stats, setStats] = useState<AuditDashboardStats | null>(null);

  // Audit logs
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logsPagination, setLogsPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [logsFilters, setLogsFilters] = useState({
    category: '',
    status: '',
    search: '',
  });

  // Security events
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securityPagination, setSecurityPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(true);

  // Login attempts
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [loginsPagination, setLoginsPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showFailedOnly, setShowFailedOnly] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/admin/audit/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
    }
  };

  const fetchLogs = async (page = 1) => {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '25' });
      if (logsFilters.category) params.append('category', logsFilters.category);
      if (logsFilters.status) params.append('status', logsFilters.status);
      if (logsFilters.search) params.append('search', logsFilters.search);

      const response = await fetchWithAuth(`${API_URL}/api/admin/audit/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
        setLogsPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
  };

  const fetchSecurityEvents = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        unresolvedOnly: showUnresolvedOnly.toString(),
      });

      const response = await fetchWithAuth(`${API_URL}/api/admin/audit/security-events?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSecurityEvents(data.events);
        setSecurityPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch security events:', error);
    }
  };

  const fetchLoginAttempts = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        failedOnly: showFailedOnly.toString(),
      });

      const response = await fetchWithAuth(`${API_URL}/api/admin/audit/login-attempts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setLoginAttempts(data.attempts);
        setLoginsPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch login attempts:', error);
    }
  };

  const resolveSecurityEvent = async (eventId: string, notes: string) => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/admin/audit/security-events/${eventId}/resolve`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });
      const data = await response.json();
      if (data.success) {
        fetchSecurityEvents(securityPagination.page);
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to resolve security event:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchStats();
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs(1);
    if (activeTab === 'security') fetchSecurityEvents(1);
    if (activeTab === 'logins') fetchLoginAttempts(1);
  }, [activeTab, logsFilters, showUnresolvedOnly, showFailedOnly]);

  const getCategoryColor = (category: AuditActionCategory) => {
    const colors: Record<AuditActionCategory, string> = {
      auth: 'bg-blue-100 text-blue-800',
      user_management: 'bg-purple-100 text-purple-800',
      content: 'bg-green-100 text-green-800',
      practice: 'bg-yellow-100 text-yellow-800',
      parent: 'bg-amber-100 text-amber-800',
      admin: 'bg-red-100 text-red-800',
      settings: 'bg-gray-100 text-gray-800',
      api: 'bg-cyan-100 text-cyan-800',
      security: 'bg-rose-100 text-rose-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-600 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-blue-500 text-white',
    };
    return colors[severity] || 'bg-gray-500 text-white';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Audit Log</h1>
          <p className="text-neutral-600 mt-1">Monitor system activity and investigate issues</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchStats();
            if (activeTab === 'logs') fetchLogs(logsPagination.page);
            if (activeTab === 'security') fetchSecurityEvents(securityPagination.page);
            if (activeTab === 'logins') fetchLoginAttempts(loginsPagination.page);
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'logs', label: 'Activity Logs', icon: FileText },
            { id: 'security', label: 'Security Events', icon: Shield },
            { id: 'logins', label: 'Login Attempts', icon: Lock },
            { id: 'changes', label: 'Data Changes', icon: Database },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'security' && stats && stats.activeSecurityEvents > 0 && (
                <Badge variant="error" size="sm">{stats.activeSecurityEvents}</Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.totalEvents.toLocaleString()}</p>
                  <p className="text-sm text-neutral-500">Total Events</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.todayEvents.toLocaleString()}</p>
                  <p className="text-sm text-neutral-500">Today's Events</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.failedLogins24h}</p>
                  <p className="text-sm text-neutral-500">Failed Logins (24h)</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.activeSecurityEvents}</p>
                  <p className="text-sm text-neutral-500">Active Alerts</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.criticalEvents}</p>
                  <p className="text-sm text-neutral-500">Critical Events</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Security Events */}
          {stats.recentSecurityEvents.length > 0 && (
            <Card className="p-6">
              <CardHeader
                title="Unresolved Security Events"
                subtitle="Events requiring attention"
              />
              <div className="space-y-3 mt-4">
                {stats.recentSecurityEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(event.severity)}`}>
                        {event.severity.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{event.description}</p>
                        <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
                          <span>{event.eventType.replace(/_/g, ' ')}</span>
                          {event.userEmail && <span>- {event.userEmail}</span>}
                          <span>- {formatTimeAgo(event.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const notes = prompt('Resolution notes (optional):');
                        if (notes !== null) {
                          resolveSecurityEvent(event.id, notes);
                        }
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Resolve
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Activity by Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <CardHeader title="Activity by Category" subtitle="Last 7 days" />
              <div className="space-y-3 mt-4">
                {stats.eventsByCategory.map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(item.category as AuditActionCategory)}`}>
                        {item.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-neutral-900 font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <CardHeader title="Top Actions" subtitle="Last 7 days" />
              <div className="space-y-3 mt-4">
                {stats.topActions.slice(0, 8).map((item, index) => (
                  <div key={item.action} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-600">
                        {index + 1}
                      </span>
                      <span className="text-neutral-700">{item.action.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-neutral-900 font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search actions, users, details..."
                    value={logsFilters.search}
                    onChange={(e) => setLogsFilters({ ...logsFilters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <select
                value={logsFilters.category}
                onChange={(e) => setLogsFilters({ ...logsFilters, category: e.target.value })}
                className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Categories</option>
                <option value="auth">Auth</option>
                <option value="user_management">User Management</option>
                <option value="content">Content</option>
                <option value="practice">Practice</option>
                <option value="parent">Parent</option>
                <option value="admin">Admin</option>
                <option value="settings">Settings</option>
                <option value="security">Security</option>
              </select>
              <select
                value={logsFilters.status}
                onChange={(e) => setLogsFilters({ ...logsFilters, status: e.target.value })}
                className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="warning">Warning</option>
              </select>
            </div>
          </Card>

          {/* Logs Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Target</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 text-sm text-neutral-500 whitespace-nowrap">
                        {formatTimeAgo(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-neutral-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{log.userName || 'System'}</p>
                            <p className="text-xs text-neutral-500">{log.userEmail || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-900">
                        {log.action.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(log.actionCategory)}`}>
                          {log.actionCategory.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600 max-w-xs truncate">
                        {log.targetDetails || log.targetType || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {log.status === 'success' && (
                          <Badge variant="success" size="sm">Success</Badge>
                        )}
                        {log.status === 'failure' && (
                          <Badge variant="error" size="sm">Failed</Badge>
                        )}
                        {log.status === 'warning' && (
                          <Badge variant="warning" size="sm">Warning</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500 font-mono">
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
              <p className="text-sm text-neutral-500">
                Showing {logs.length} of {logsPagination.total} entries
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={logsPagination.page === 1}
                  onClick={() => fetchLogs(logsPagination.page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-neutral-600">
                  Page {logsPagination.page} of {logsPagination.pages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={logsPagination.page === logsPagination.pages}
                  onClick={() => fetchLogs(logsPagination.page + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Security Events Tab */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUnresolvedOnly}
                  onChange={(e) => setShowUnresolvedOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-neutral-700">Show unresolved only</span>
              </label>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="divide-y divide-neutral-200">
              {securityEvents.length === 0 ? (
                <div className="p-8 text-center">
                  <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-neutral-600">No security events found</p>
                </div>
              ) : (
                securityEvents.map((event) => (
                  <div key={event.id} className="p-4 hover:bg-neutral-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(event.severity)}`}>
                          {event.severity.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{event.description}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500 mt-1">
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {event.eventType.replace(/_/g, ' ')}
                            </span>
                            {event.userEmail && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {event.userEmail}
                              </span>
                            )}
                            {event.ipAddress && (
                              <span className="font-mono">{event.ipAddress}</span>
                            )}
                            <span>{formatTimeAgo(event.createdAt)}</span>
                          </div>
                          {event.isResolved && (
                            <div className="mt-2 text-sm text-green-600">
                              <CheckCircle2 className="w-4 h-4 inline mr-1" />
                              Resolved by {event.resolvedByName} at {new Date(event.resolvedAt!).toLocaleString()}
                              {event.resolutionNotes && <span className="text-neutral-500"> - {event.resolutionNotes}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      {!event.isResolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const notes = prompt('Resolution notes (optional):');
                            if (notes !== null) {
                              resolveSecurityEvent(event.id, notes);
                            }
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {securityEvents.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
                <p className="text-sm text-neutral-500">
                  Showing {securityEvents.length} of {securityPagination.total} events
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={securityPagination.page === 1}
                    onClick={() => fetchSecurityEvents(securityPagination.page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-neutral-600">
                    Page {securityPagination.page} of {securityPagination.pages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={securityPagination.page === securityPagination.pages}
                    onClick={() => fetchSecurityEvents(securityPagination.page + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Login Attempts Tab */}
      {activeTab === 'logins' && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFailedOnly}
                  onChange={(e) => setShowFailedOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-neutral-700">Show failed attempts only</span>
              </label>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">IP Address</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">User Agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {loginAttempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 text-sm text-neutral-500 whitespace-nowrap">
                        {formatTimeAgo(attempt.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-900 font-medium">
                        {attempt.email}
                      </td>
                      <td className="px-4 py-3">
                        {attempt.success ? (
                          <Badge variant="success" size="sm">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="error" size="sm">
                            <XCircle className="w-3 h-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {attempt.failureReason || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500 font-mono">
                        {attempt.ipAddress || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500 max-w-xs truncate">
                        {attempt.userAgent || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
              <p className="text-sm text-neutral-500">
                Showing {loginAttempts.length} of {loginsPagination.total} attempts
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loginsPagination.page === 1}
                  onClick={() => fetchLoginAttempts(loginsPagination.page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-neutral-600">
                  Page {loginsPagination.page} of {loginsPagination.pages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loginsPagination.page === loginsPagination.pages}
                  onClick={() => fetchLoginAttempts(loginsPagination.page + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Data Changes Tab */}
      {activeTab === 'changes' && (
        <div className="space-y-4">
          <Card className="p-8 text-center">
            <Database className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600">Data change tracking</p>
            <p className="text-sm text-neutral-500 mt-1">
              View detailed change history for compliance and auditing
            </p>
            <Button className="mt-4" variant="outline" onClick={() => setActiveTab('logs')}>
              View Activity Logs
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AuditLog;

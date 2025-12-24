import { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  GraduationCap,
  BookOpen,
  Shield,
  MoreVertical,
  UserCheck,
  UserX,
  Trash2,
  Edit,
  Mail,
  School,
  Clock,
  RefreshCw,
  ChevronDown,
  X,
  AlertTriangle,
  Loader2,
  Calendar,
  Zap,
  CreditCard,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore, type ManagedUser, type UserSubscriptionDetails } from '@/stores/authStore';
import { AddUserModal, EditUserModal, AdminCard, AdminButton, AdminModal, AdminInput } from '@/components/admin';
import { cn } from '@/utils';

type RoleFilter = 'all' | 'student' | 'teacher' | 'admin';
type StatusFilter = 'all' | 'active' | 'inactive';

export default function UserManagement() {
  const {
    user,
    allUsers,
    loadAllUsers,
    getUserStats,
    deactivateUser,
    reactivateUser,
    deleteUser,
    extendUserTrial,
    addUserCredits,
    getUserSubscriptionDetails,
  } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Subscription management state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionUser, setSubscriptionUser] = useState<ManagedUser | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<UserSubscriptionDetails | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [extendDays, setExtendDays] = useState('7');
  const [addCreditsAmount, setAddCreditsAmount] = useState('10');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAllUsers();
  }, [loadAllUsers]);

  const stats = getUserStats();

  // Filter users
  const filteredUsers = allUsers.filter(u => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.schoolName?.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Role filter
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;

    // Status filter
    if (statusFilter === 'active' && !u.isActive) return false;
    if (statusFilter === 'inactive' && u.isActive) return false;

    return true;
  });

  const handleDeactivate = async (userId: string) => {
    setActionLoading(userId);
    try {
      await deactivateUser(userId);
    } catch (error) {
      console.error('Failed to deactivate user:', error);
    } finally {
      setActionLoading(null);
      setOpenDropdown(null);
    }
  };

  const handleReactivate = async (userId: string) => {
    setActionLoading(userId);
    try {
      await reactivateUser(userId);
    } catch (error) {
      console.error('Failed to reactivate user:', error);
    } finally {
      setActionLoading(null);
      setOpenDropdown(null);
    }
  };

  const handleDelete = async (userId: string) => {
    setActionLoading(userId);
    try {
      await deleteUser(userId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Subscription management handlers
  const openSubscriptionModal = async (u: ManagedUser) => {
    setSubscriptionUser(u);
    setShowSubscriptionModal(true);
    setSubscriptionLoading(true);
    setSubscriptionDetails(null);
    setActionSuccess(null);
    setExtendDays('7');
    setAddCreditsAmount('10');
    setOpenDropdown(null);

    try {
      const details = await getUserSubscriptionDetails(u.id);
      setSubscriptionDetails(details);
    } catch (error) {
      console.error('Failed to load subscription details:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleExtendTrial = async () => {
    if (!subscriptionUser) return;
    const days = parseInt(extendDays);
    if (isNaN(days) || days < 1 || days > 90) return;

    setSubscriptionLoading(true);
    try {
      const result = await extendUserTrial(subscriptionUser.id, days);
      setActionSuccess(`Trial extended by ${result.daysAdded} days!`);
      // Refresh subscription details
      const details = await getUserSubscriptionDetails(subscriptionUser.id);
      setSubscriptionDetails(details);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to extend trial:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (!subscriptionUser) return;
    const credits = parseInt(addCreditsAmount);
    if (isNaN(credits) || credits < 1 || credits > 1000) return;

    setSubscriptionLoading(true);
    try {
      const result = await addUserCredits(subscriptionUser.id, credits);
      setActionSuccess(`Added ${result.creditsAdded} credits! New total: ${result.newTotal}`);
      // Refresh subscription details
      const details = await getUserSubscriptionDetails(subscriptionUser.id);
      setSubscriptionDetails(details);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to add credits:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student':
        return <GraduationCap className="w-4 h-4" />;
      case 'teacher':
        return <BookOpen className="w-4 h-4" />;
      case 'admin':
        return <Shield className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'student':
        return 'bg-blue-500/20 text-admin-accent-blue border border-blue-500/30';
      case 'teacher':
        return 'bg-emerald-500/20 text-admin-accent-emerald border border-emerald-500/30';
      case 'admin':
        return 'bg-purple-500/20 text-admin-accent-purple border border-purple-500/30';
      default:
        return 'bg-admin-bg-tertiary text-admin-text-muted';
    }
  };

  const getRoleAvatarClass = (role: string) => {
    switch (role) {
      case 'student':
        return 'bg-blue-500';
      case 'teacher':
        return 'bg-emerald-500';
      case 'admin':
        return 'bg-purple-500';
      default:
        return 'bg-admin-bg-tertiary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const statCards = [
    { label: 'Total Users', value: stats.total, icon: Users, color: 'cyan' },
    { label: 'Students', value: stats.students, icon: GraduationCap, color: 'blue' },
    { label: 'Teachers', value: stats.teachers, icon: BookOpen, color: 'emerald' },
    { label: 'Admins', value: stats.admins, icon: Shield, color: 'purple' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'amber' },
    { label: 'Active Today', value: stats.activeToday, icon: UserCheck, color: 'cyan' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/20">
            <Users className="w-6 h-6 text-admin-accent-cyan" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-admin-text">User Management</h1>
            <p className="text-admin-text-secondary">Manage all platform users</p>
          </div>
        </div>

        <AdminButton
          variant="primary"
          leftIcon={<UserPlus className="w-5 h-5" />}
          onClick={() => setShowAddModal(true)}
        >
          Add User
        </AdminButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <AdminCard key={stat.label} className="!p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  stat.color === 'cyan' && 'bg-cyan-500/20',
                  stat.color === 'blue' && 'bg-blue-500/20',
                  stat.color === 'emerald' && 'bg-emerald-500/20',
                  stat.color === 'purple' && 'bg-purple-500/20',
                  stat.color === 'amber' && 'bg-amber-500/20',
                )}>
                  <Icon className={cn(
                    'w-5 h-5',
                    stat.color === 'cyan' && 'text-admin-accent-cyan',
                    stat.color === 'blue' && 'text-admin-accent-blue',
                    stat.color === 'emerald' && 'text-admin-accent-emerald',
                    stat.color === 'purple' && 'text-admin-accent-purple',
                    stat.color === 'amber' && 'text-admin-accent-amber',
                  )} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-admin-text">{stat.value}</p>
                  <p className="text-xs text-admin-text-muted">{stat.label}</p>
                </div>
              </div>
            </AdminCard>
          );
        })}
      </div>

      {/* Filters & Search */}
      <AdminCard className="!p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-admin-text-muted" />
            <input
              type="text"
              placeholder="Search by name, email, or school..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-input pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-text-muted hover:text-admin-text"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-muted" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              className="admin-input pl-9 pr-8 min-w-[140px] appearance-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-muted pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="admin-input pr-8 min-w-[130px] appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-muted pointer-events-none" />
          </div>

          {/* Refresh */}
          <button
            onClick={() => loadAllUsers()}
            className="p-2.5 text-admin-text-muted hover:text-admin-text hover:bg-admin-bg-tertiary rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </AdminCard>

      {/* Users Table */}
      <AdminCard padding="none">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th className="hidden md:table-cell">School</th>
                <th className="hidden lg:table-cell">Joined</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-admin-text-muted">
                    {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                      ? 'No users match your filters'
                      : 'No users found'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    {/* User */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-white font-medium',
                          getRoleAvatarClass(u.role)
                        )}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-admin-text">{u.name}</p>
                          <p className="text-sm text-admin-text-muted flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td>
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize',
                        getRoleBadgeClass(u.role)
                      )}>
                        {getRoleIcon(u.role)}
                        {u.role}
                      </span>
                    </td>

                    {/* School */}
                    <td className="hidden md:table-cell">
                      {u.schoolName ? (
                        <div className="flex items-center gap-1.5 text-sm text-admin-text-secondary">
                          <School className="w-4 h-4 text-admin-text-muted" />
                          {u.schoolName}
                        </div>
                      ) : (
                        <span className="text-admin-text-muted text-sm">-</span>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="hidden lg:table-cell">
                      <span className="text-sm text-admin-text-secondary">
                        {formatDate(u.createdAt)}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                        u.isActive
                          ? 'bg-emerald-500/20 text-admin-accent-emerald border border-emerald-500/30'
                          : 'bg-admin-bg-tertiary text-admin-text-muted'
                      )}>
                        <span className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          u.isActive ? 'bg-emerald-400' : 'bg-admin-text-muted'
                        )} />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === u.id ? null : u.id)}
                          disabled={actionLoading === u.id}
                          className="p-2 text-admin-text-muted hover:text-admin-text hover:bg-admin-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading === u.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <MoreVertical className="w-5 h-5" />
                          )}
                        </button>

                        {openDropdown === u.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenDropdown(null)}
                            />
                            <div className="absolute right-0 mt-1 w-48 bg-admin-bg-secondary rounded-lg shadow-lg border border-admin-border py-1 z-20">
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setShowEditModal(true);
                                  setOpenDropdown(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-admin-text-secondary hover:text-admin-text hover:bg-admin-bg-tertiary"
                              >
                                <Edit className="w-4 h-4" />
                                Edit User
                              </button>

                              <button
                                onClick={() => openSubscriptionModal(u)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-admin-accent-cyan hover:bg-cyan-500/10"
                              >
                                <CreditCard className="w-4 h-4" />
                                Manage Subscription
                              </button>

                              <hr className="my-1 border-admin-border" />

                              {u.isActive ? (
                                <button
                                  onClick={() => handleDeactivate(u.id)}
                                  disabled={u.id === user?.id}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-admin-accent-amber hover:bg-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <UserX className="w-4 h-4" />
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivate(u.id)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-admin-accent-emerald hover:bg-emerald-500/10"
                                >
                                  <UserCheck className="w-4 h-4" />
                                  Reactivate
                                </button>
                              )}

                              <hr className="my-1 border-admin-border" />

                              <button
                                onClick={() => {
                                  setShowDeleteConfirm(u.id);
                                  setOpenDropdown(null);
                                }}
                                disabled={u.id === user?.id}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-admin-accent-rose hover:bg-rose-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete User
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Results count */}
        {filteredUsers.length > 0 && (
          <div className="px-6 py-3 bg-admin-bg-tertiary/50 border-t border-admin-border text-sm text-admin-text-secondary">
            Showing {filteredUsers.length} of {allUsers.length} users
          </div>
        )}
      </AdminCard>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => loadAllUsers()}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={showEditModal}
        user={selectedUser}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onSuccess={() => loadAllUsers()}
      />

      {/* Delete Confirmation Modal */}
      <AdminModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Delete User"
        subtitle="This action cannot be undone"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-admin-accent-rose/10 border border-admin-accent-rose/30 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-admin-accent-rose flex-shrink-0" />
            <p className="text-admin-text-secondary text-sm">
              Are you sure you want to permanently delete this user? All their data will be lost.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <AdminButton
              variant="secondary"
              onClick={() => setShowDeleteConfirm(null)}
              className="flex-1"
            >
              Cancel
            </AdminButton>
            <AdminButton
              variant="danger"
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
              disabled={!showDeleteConfirm || actionLoading === showDeleteConfirm}
              isLoading={!!showDeleteConfirm && actionLoading === showDeleteConfirm}
              leftIcon={<Trash2 className="w-4 h-4" />}
              className="flex-1"
            >
              Delete
            </AdminButton>
          </div>
        </div>
      </AdminModal>

      {/* Subscription Management Modal */}
      <AdminModal
        isOpen={showSubscriptionModal}
        onClose={() => {
          setShowSubscriptionModal(false);
          setSubscriptionUser(null);
          setSubscriptionDetails(null);
        }}
        title="Manage Subscription"
        subtitle={subscriptionUser?.name || 'User'}
        size="lg"
      >
        <div className="space-y-6">
          {/* Success Message */}
          {actionSuccess && (
            <div className="flex items-center gap-2 p-3 bg-admin-accent-emerald/10 border border-admin-accent-emerald/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-admin-accent-emerald" />
              <span className="text-admin-accent-emerald text-sm">{actionSuccess}</span>
            </div>
          )}

          {subscriptionLoading && !subscriptionDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-admin-accent-cyan" />
            </div>
          ) : (
            <>
              {/* Current Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Trial Status */}
                <div className="p-4 bg-admin-bg-tertiary/50 rounded-lg border border-admin-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-admin-accent-amber" />
                    <span className="text-sm font-medium text-admin-text">Trial Status</span>
                  </div>
                  {subscriptionDetails?.trial ? (
                    <div>
                      <p className={cn(
                        'text-lg font-bold',
                        subscriptionDetails.trial.status === 'active' ? 'text-admin-accent-emerald' : 'text-admin-text-muted'
                      )}>
                        {subscriptionDetails.trial.status === 'active' ? 'Active' : 'Expired'}
                      </p>
                      <p className="text-xs text-admin-text-muted">
                        {subscriptionDetails.trial.daysRemaining > 0
                          ? `${subscriptionDetails.trial.daysRemaining} days remaining`
                          : 'Expired'}
                      </p>
                      <p className="text-xs text-admin-text-muted mt-1">
                        Expires: {new Date(subscriptionDetails.trial.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-admin-text-muted text-sm">No trial</p>
                  )}
                </div>

                {/* Subscription Status */}
                <div className="p-4 bg-admin-bg-tertiary/50 rounded-lg border border-admin-border">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-admin-accent-purple" />
                    <span className="text-sm font-medium text-admin-text">Subscription</span>
                  </div>
                  {subscriptionDetails?.subscription ? (
                    <div>
                      <p className="text-lg font-bold text-admin-accent-purple">
                        {subscriptionDetails.subscription.planName}
                      </p>
                      <p className="text-xs text-admin-text-muted">
                        {subscriptionDetails.subscription.billingCycle}
                      </p>
                      <p className="text-xs text-admin-text-muted mt-1">
                        {subscriptionDetails.subscription.daysRemaining} days remaining
                      </p>
                    </div>
                  ) : (
                    <p className="text-admin-text-muted text-sm">No subscription</p>
                  )}
                </div>

                {/* AI Credits */}
                <div className="p-4 bg-admin-bg-tertiary/50 rounded-lg border border-admin-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-admin-accent-cyan" />
                    <span className="text-sm font-medium text-admin-text">AI Credits</span>
                  </div>
                  <p className="text-lg font-bold text-admin-accent-cyan">
                    {subscriptionDetails?.user?.aiGradingCredits || 0}
                  </p>
                  <p className="text-xs text-admin-text-muted">Available credits</p>
                </div>
              </div>

              {/* Action Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Extend Trial */}
                <div className="p-4 bg-admin-bg rounded-lg border border-admin-border">
                  <h4 className="font-medium text-admin-text mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-admin-accent-amber" />
                    Extend Trial Period
                  </h4>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <AdminInput
                        type="number"
                        value={extendDays}
                        onChange={(e) => setExtendDays(e.target.value)}
                        min={1}
                        max={90}
                        placeholder="Days"
                      />
                    </div>
                    <AdminButton
                      variant="primary"
                      onClick={handleExtendTrial}
                      disabled={subscriptionLoading}
                      isLoading={subscriptionLoading}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Add Days
                    </AdminButton>
                  </div>
                  <p className="text-xs text-admin-text-muted mt-2">
                    Enter 1-90 days to extend or start a trial
                  </p>
                </div>

                {/* Add Credits */}
                <div className="p-4 bg-admin-bg rounded-lg border border-admin-border">
                  <h4 className="font-medium text-admin-text mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-admin-accent-cyan" />
                    Add AI Grading Credits
                  </h4>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <AdminInput
                        type="number"
                        value={addCreditsAmount}
                        onChange={(e) => setAddCreditsAmount(e.target.value)}
                        min={1}
                        max={1000}
                        placeholder="Credits"
                      />
                    </div>
                    <AdminButton
                      variant="primary"
                      onClick={handleAddCredits}
                      disabled={subscriptionLoading}
                      isLoading={subscriptionLoading}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Add Credits
                    </AdminButton>
                  </div>
                  <p className="text-xs text-admin-text-muted mt-2">
                    Enter 1-1000 credits to add
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-admin-border">
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setExtendDays('7');
                    handleExtendTrial();
                  }}
                  disabled={subscriptionLoading}
                >
                  +7 Days Trial
                </AdminButton>
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setExtendDays('14');
                    handleExtendTrial();
                  }}
                  disabled={subscriptionLoading}
                >
                  +14 Days Trial
                </AdminButton>
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setExtendDays('30');
                    handleExtendTrial();
                  }}
                  disabled={subscriptionLoading}
                >
                  +30 Days Trial
                </AdminButton>
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAddCreditsAmount('50');
                    handleAddCredits();
                  }}
                  disabled={subscriptionLoading}
                >
                  +50 Credits
                </AdminButton>
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAddCreditsAmount('100');
                    handleAddCredits();
                  }}
                  disabled={subscriptionLoading}
                >
                  +100 Credits
                </AdminButton>
              </div>
            </>
          )}
        </div>
      </AdminModal>
    </div>
  );
}

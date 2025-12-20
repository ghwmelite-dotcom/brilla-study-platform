import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  GraduationCap,
  BookOpen,
  Shield,
  ArrowLeft,
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
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { AddUserModal } from '@/components/admin';
import { cn } from '@/utils';

type RoleFilter = 'all' | 'student' | 'teacher' | 'admin';
type StatusFilter = 'all' | 'active' | 'inactive';

export default function UserManagement() {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    allUsers,
    loadAllUsers,
    getUserStats,
    deactivateUser,
    reactivateUser,
    deleteUser,
  } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadAllUsers();
  }, [isAuthenticated, isAdmin, navigate, loadAllUsers]);

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
        return 'bg-blue-100 text-blue-700';
      case 'teacher':
        return 'bg-green-100 text-green-700';
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">User Management</h1>
                <p className="text-neutral-600">Manage all platform users</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <UserPlus className="w-5 h-5" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
                <p className="text-xs text-neutral-500">Total Users</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.students}</p>
                <p className="text-xs text-neutral-500">Students</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.teachers}</p>
                <p className="text-xs text-neutral-500">Teachers</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.admins}</p>
                <p className="text-xs text-neutral-500">Admins</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.pending}</p>
                <p className="text-xs text-neutral-500">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.activeToday}</p>
                <p className="text-xs text-neutral-500">Active Today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-neutral-200 mb-6">
          <div className="p-4 flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by name, email, or school..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                className="pl-9 pr-8 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white min-w-[140px]"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Admins</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-4 pr-8 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white min-w-[130px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* Refresh */}
            <button
              onClick={() => loadAllUsers()}
              className="p-2.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">User</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Role</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700 hidden md:table-cell">School</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700 hidden lg:table-cell">Joined</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                      {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                        ? 'No users match your filters'
                        : 'No users found'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center text-white font-medium',
                            u.role === 'student' ? 'bg-blue-500' :
                            u.role === 'teacher' ? 'bg-green-500' : 'bg-purple-500'
                          )}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{u.name}</p>
                            <p className="text-sm text-neutral-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize',
                          getRoleBadgeClass(u.role)
                        )}>
                          {getRoleIcon(u.role)}
                          {u.role}
                        </span>
                      </td>

                      {/* School */}
                      <td className="px-6 py-4 hidden md:table-cell">
                        {u.schoolName ? (
                          <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                            <School className="w-4 h-4 text-neutral-400" />
                            {u.schoolName}
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-sm">-</span>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm text-neutral-600">
                          {formatDate(u.createdAt)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-neutral-100 text-neutral-600'
                        )}>
                          <span className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            u.isActive ? 'bg-emerald-500' : 'bg-neutral-400'
                          )} />
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === u.id ? null : u.id)}
                            disabled={actionLoading === u.id}
                            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
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
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-20">
                                <button
                                  onClick={() => {
                                    // TODO: Open edit modal
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit User
                                </button>

                                {u.isActive ? (
                                  <button
                                    onClick={() => handleDeactivate(u.id)}
                                    disabled={u.id === user?.id}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <UserX className="w-4 h-4" />
                                    Deactivate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleReactivate(u.id)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                    Reactivate
                                  </button>
                                )}

                                <hr className="my-1 border-neutral-200" />

                                <button
                                  onClick={() => {
                                    setShowDeleteConfirm(u.id);
                                    setOpenDropdown(null);
                                  }}
                                  disabled={u.id === user?.id}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 text-sm text-neutral-600">
              Showing {filteredUsers.length} of {allUsers.length} users
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => loadAllUsers()}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Delete User</h3>
                <p className="text-sm text-neutral-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-neutral-600 mb-6">
              Are you sure you want to permanently delete this user? All their data will be lost.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={actionLoading === showDeleteConfirm}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {actionLoading === showDeleteConfirm ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

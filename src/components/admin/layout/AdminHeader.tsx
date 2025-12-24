import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Home,
  ChevronRight,
  Activity,
  Command,
} from 'lucide-react';
import { useAuthStore, useNotificationStore } from '@/stores';
import { cn } from '@/utils';
import { AdminNotificationDropdown } from './AdminNotificationDropdown';

export function AdminHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { unreadCount, toggleNotificationPanel, isNotificationPanelOpen, fetchUnreadCount, closeAllPopups } = useNotificationStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch notification count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Generate breadcrumb items from path
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Admin', path: '/admin' }];

    const labels: Record<string, string> = {
      users: 'Users',
      approvals: 'Approvals',
      audit: 'Audit Log',
      moderation: 'Moderation',
      analytics: 'Analytics',
      subscriptions: 'Subscriptions',
      affiliates: 'Affiliates',
      settings: 'Settings',
      content: 'Content',
    };

    paths.slice(1).forEach((segment, index) => {
      const path = '/' + paths.slice(0, index + 2).join('/');
      breadcrumbs.push({
        label: labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        path,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="h-16 bg-admin-bg-secondary border-b border-admin-border flex items-center justify-between px-6">
      {/* Left - Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Link
          to="/admin"
          className="p-1.5 text-admin-text-muted hover:text-admin-text hover:bg-admin-bg-tertiary rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" />
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-admin-text-muted" />
            {index === breadcrumbs.length - 1 ? (
              <span className="text-sm font-medium text-admin-text">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="text-sm text-admin-text-secondary hover:text-admin-text transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-muted" />
          <input
            type="text"
            placeholder="Search users, logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-20 py-2 bg-admin-bg-tertiary border border-admin-border rounded-lg text-sm text-admin-text placeholder-admin-text-muted focus:outline-none focus:ring-2 focus:ring-admin-accent-cyan/50 focus:border-admin-accent-cyan transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-admin-text-muted">
            <Command className="w-3 h-3" />
            <span className="text-xs">K</span>
          </div>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        {/* System Status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-admin-accent-emerald/10 border border-admin-accent-emerald/30 rounded-lg">
          <Activity className="w-4 h-4 text-admin-accent-emerald" />
          <span className="text-xs font-medium text-admin-accent-emerald">Healthy</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={toggleNotificationPanel}
            className={cn(
              'relative p-2 rounded-lg transition-all',
              isNotificationPanelOpen
                ? 'bg-admin-accent-cyan/20 text-admin-accent-cyan'
                : 'text-admin-text-secondary hover:text-admin-text hover:bg-admin-bg-tertiary'
            )}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-xs font-bold bg-admin-accent-rose text-white rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <AdminNotificationDropdown
            isOpen={isNotificationPanelOpen}
            onClose={closeAllPopups}
          />
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-admin-bg-tertiary transition-colors"
          >
            <div className="w-8 h-8 rounded-full admin-gradient-accent flex items-center justify-center">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-admin-text">{user?.name}</p>
              <p className="text-xs text-admin-text-muted capitalize">{user?.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-admin-text-muted hidden md:block" />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-admin-bg-secondary border border-admin-border rounded-xl shadow-xl z-50 py-2">
                <div className="px-4 py-2 border-b border-admin-border">
                  <p className="font-medium text-admin-text">{user?.name}</p>
                  <p className="text-sm text-admin-text-secondary">{user?.email}</p>
                </div>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-admin-text-secondary hover:text-admin-text hover:bg-admin-bg-tertiary transition-colors"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Link
                  to="/admin/settings"
                  className="flex items-center gap-2 px-4 py-2 text-admin-text-secondary hover:text-admin-text hover:bg-admin-bg-tertiary transition-colors"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-admin-text-secondary hover:text-admin-text hover:bg-admin-bg-tertiary transition-colors"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Home className="w-4 h-4" />
                  Student View
                </Link>
                <hr className="my-2 border-admin-border" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 w-full text-admin-accent-rose hover:bg-admin-accent-rose/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

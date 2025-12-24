import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ScrollText,
  Shield,
  CreditCard,
  UserCog,
  BarChart3,
  Settings,
  BookOpen,
  MessageSquareWarning,
  Activity,
  ChevronDown,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils';
import { useAuthStore } from '@/stores';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  end?: boolean;
}

function NavItem({ to, icon, label, badge, end }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'admin-nav-item',
          isActive && 'admin-nav-item-active'
        )
      }
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="px-2 py-0.5 text-xs font-medium bg-admin-accent-amber/20 text-admin-accent-amber rounded-full">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  );
}

interface NavGroupProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function NavGroup({ label, icon, children, defaultOpen = false }: NavGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2 text-admin-text-muted hover:text-admin-text-secondary transition-colors"
      >
        <span className="w-5 h-5">{icon}</span>
        <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
      {isOpen && <div className="mt-1 space-y-0.5">{children}</div>}
    </div>
  );
}

export function AdminSidebar() {
  const location = useLocation();
  const { pendingCount } = useAuthStore();

  // Determine which group should be open based on current path
  const isDashboardSection = location.pathname === '/admin' || location.pathname.startsWith('/admin/analytics');
  const isUsersSection = location.pathname.startsWith('/admin/users') || location.pathname.startsWith('/admin/approvals');
  const isContentSection = location.pathname.startsWith('/admin/content') || location.pathname.startsWith('/admin/moderation');
  const isSystemSection = location.pathname.startsWith('/admin/audit') || location.pathname.startsWith('/admin/settings');
  const isRevenueSection = location.pathname.startsWith('/admin/subscriptions') || location.pathname.startsWith('/admin/affiliates');

  return (
    <aside className="w-64 h-screen bg-admin-bg-secondary border-r border-admin-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-admin-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl admin-gradient-accent flex items-center justify-center">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-admin-text">Brilla</h1>
            <span className="text-xs admin-badge-purple px-2 py-0.5 rounded">Admin</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto admin-scrollbar p-3 space-y-2">
        {/* Dashboard */}
        <NavGroup label="Dashboard" icon={<LayoutDashboard className="w-4 h-4" />} defaultOpen={isDashboardSection}>
          <NavItem to="/admin" icon={<Activity className="w-4 h-4" />} label="Overview" end />
          <NavItem to="/admin/analytics" icon={<BarChart3 className="w-4 h-4" />} label="Analytics" />
        </NavGroup>

        {/* Users & Access */}
        <NavGroup label="Users & Access" icon={<Users className="w-4 h-4" />} defaultOpen={isUsersSection}>
          <NavItem to="/admin/users" icon={<UserCog className="w-4 h-4" />} label="All Users" />
          <NavItem to="/admin/approvals" icon={<UserCheck className="w-4 h-4" />} label="Approvals" badge={pendingCount} />
        </NavGroup>

        {/* Content */}
        <NavGroup label="Content" icon={<BookOpen className="w-4 h-4" />} defaultOpen={isContentSection}>
          <NavItem to="/admin/content" icon={<ScrollText className="w-4 h-4" />} label="Questions" />
          <NavItem to="/admin/moderation" icon={<MessageSquareWarning className="w-4 h-4" />} label="Moderation" />
        </NavGroup>

        {/* System */}
        <NavGroup label="System" icon={<Shield className="w-4 h-4" />} defaultOpen={isSystemSection}>
          <NavItem to="/admin/audit" icon={<ScrollText className="w-4 h-4" />} label="Audit Log" />
          <NavItem to="/admin/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
        </NavGroup>

        {/* Revenue */}
        <NavGroup label="Revenue" icon={<CreditCard className="w-4 h-4" />} defaultOpen={isRevenueSection}>
          <NavItem to="/admin/subscriptions" icon={<CreditCard className="w-4 h-4" />} label="Subscriptions" />
          <NavItem to="/admin/affiliates" icon={<Users className="w-4 h-4" />} label="Affiliates" />
        </NavGroup>
      </nav>

      {/* Footer - System Status */}
      <div className="p-4 border-t border-admin-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Zap className="w-5 h-5 text-admin-accent-emerald" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-admin-accent-emerald rounded-full animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-admin-text">System Online</p>
            <p className="text-xs text-admin-text-muted">All services running</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

import { NavLink } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  BookOpen,
  Brain,
  Trophy,
  Medal,
  Shield,
  BarChart3,
  Swords,
  User,
  Settings,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuthStore, useExamStore } from '@/stores';
import { SubjectNavigation } from '@/components/subjects';
import { ExamModeSwitcher } from '@/components/exam';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Main navigation (always visible)
const mainNavItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, auth: true },
  { path: '/topics', label: 'Topics', icon: BookOpen },
  { path: '/practice', label: 'Practice', icon: Brain },
];

// Exam-specific navigation items
const examSpecificItems = {
  nsmq: [
    { path: '/battle', label: '1v1 Battle', icon: Swords, auth: true },
    { path: '/competition', label: 'Competition Sim', icon: Trophy },
  ],
  wassce: [
    { path: '/past-papers', label: 'Past Papers', icon: FileText },
    { path: '/practice/essay', label: 'Essay Practice', icon: BookOpen },
  ],
  bece: [
    { path: '/past-papers', label: 'Past Papers', icon: FileText },
  ],
};

// Common items for all modes
const commonItems = [
  { path: '/house-cup', label: 'House Cup', icon: Shield, auth: true },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, auth: true },
  { path: '/leaderboard', label: 'Leaderboard', icon: Medal },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { isAuthenticated } = useAuthStore();
  const { currentExamType } = useExamStore();

  // Get exam-specific navigation items
  const examItems = examSpecificItems[currentExamType] || [];
  const allNavItems = [...mainNavItems, ...examItems, ...commonItems];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-neutral-200 z-40 overflow-y-auto',
          'transform transition-transform duration-200 ease-in-out',
          'lg:translate-x-0 lg:static lg:h-[calc(100vh-4rem)]',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="p-4 space-y-6">
          {/* Mobile Exam Switcher */}
          <div className="lg:hidden">
            <ExamModeSwitcher />
          </div>

          {/* Main Navigation */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Navigation
            </h3>
            <ul className="space-y-1">
              {allNavItems.map((item) => {
                if ('auth' in item && item.auth && !isAuthenticated) return null;

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        )
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Dynamic Subjects */}
          <SubjectNavigation onItemClick={onClose} />

          {/* Quick Stats (if authenticated) */}
          {isAuthenticated && (
            <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-4 text-white">
              <h4 className="font-semibold mb-3">Today's Progress</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="opacity-80">Questions</span>
                  <span className="font-medium">12/20</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-secondary h-2 rounded-full" style={{ width: '60%' }} />
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="opacity-80">Accuracy</span>
                  <span className="font-medium">85%</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Links */}
          <div className="border-t border-neutral-200 pt-4">
            <ul className="space-y-1">
              {isAuthenticated && (
                <>
                  <li>
                    <NavLink
                      to="/profile"
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        )
                      }
                    >
                      <User className="w-5 h-5" />
                      Profile
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/settings"
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        )
                      }
                    >
                      <Settings className="w-5 h-5" />
                      Settings
                    </NavLink>
                  </li>
                </>
              )}
              <li>
                <NavLink
                  to="/help"
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    )
                  }
                >
                  <HelpCircle className="w-5 h-5" />
                  Help & Support
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Platform branding */}
          <div className="text-center text-xs text-neutral-500 pt-4 border-t border-neutral-200">
            <p className="font-medium">Brilla Study Platform</p>
            <p>
              {currentExamType === 'nsmq' && 'NSMQ Competition Prep'}
              {currentExamType === 'wassce' && 'WASSCE Exam Prep'}
              {currentExamType === 'bece' && 'BECE Exam Prep'}
            </p>
          </div>
        </nav>
      </aside>
    </>
  );
}

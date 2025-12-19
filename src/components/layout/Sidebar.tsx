import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  BookOpen,
  Brain,
  Trophy,
  Medal,
  User,
  Settings,
  HelpCircle,
  Calculator,
  Atom,
  FlaskConical,
  Dna,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuthStore } from '@/stores';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNavItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, auth: true },
  { path: '/topics', label: 'Topics', icon: BookOpen },
  { path: '/practice', label: 'Practice', icon: Brain },
  { path: '/competition', label: 'Competition', icon: Trophy },
  { path: '/leaderboard', label: 'Leaderboard', icon: Medal },
];

const subjects = [
  { slug: 'mathematics', label: 'Mathematics', icon: Calculator, color: 'text-blue-500' },
  { slug: 'physics', label: 'Physics', icon: Atom, color: 'text-purple-500' },
  { slug: 'chemistry', label: 'Chemistry', icon: FlaskConical, color: 'text-green-500' },
  { slug: 'biology', label: 'Biology', icon: Dna, color: 'text-amber-500' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

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
          {/* Main Navigation */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Navigation
            </h3>
            <ul className="space-y-1">
              {mainNavItems.map((item) => {
                if (item.auth && !isAuthenticated) return null;

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

          {/* Subjects */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Subjects
            </h3>
            <ul className="space-y-1">
              {subjects.map((subject) => (
                <li key={subject.slug}>
                  <NavLink
                    to={`/topics/${subject.slug}`}
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
                    <subject.icon className={cn('w-5 h-5', subject.color)} />
                    {subject.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

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

          {/* School branding */}
          <div className="text-center text-xs text-neutral-500 pt-4 border-t border-neutral-200">
            <p className="font-medium">St John's Grammar School</p>
            <p>NSMQ Training Platform</p>
          </div>
        </nav>
      </aside>
    </>
  );
}

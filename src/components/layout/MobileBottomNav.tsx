import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, Brain, Trophy, Library } from 'lucide-react';
import { cn } from '@/utils';
import { useAuthStore } from '@/stores';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  auth?: boolean;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/topics', label: 'Topics', icon: BookOpen },
  { path: '/practice', label: 'Practice', icon: Brain, auth: true },
  { path: '/library', label: 'Library', icon: Library },
  { path: '/leaderboard', label: 'Ranks', icon: Trophy },
];

export function MobileBottomNav() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  // Hide on landing page for guests
  if (!isAuthenticated && location.pathname === '/') {
    return null;
  }

  // Hide on auth pages
  if (['/login', '/register', '/set-password'].includes(location.pathname)) {
    return null;
  }

  const visibleItems = navItems.filter(
    (item) => !item.auth || (item.auth && isAuthenticated)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[64px] rounded-lg transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-neutral-500 active:bg-neutral-100'
              )}
            >
              <item.icon
                className={cn(
                  'w-6 h-6 transition-transform',
                  isActive && 'scale-110'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  'text-[10px] font-medium',
                  isActive && 'font-semibold'
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

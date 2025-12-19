import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Flame,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores';
import { Button } from '@/components/common';
import { cn, formatNumber } from '@/utils';

interface HeaderProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

export function Header({ onMenuToggle, isSidebarOpen }: HeaderProps) {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Home';
    if (path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/topics')) return 'Topics';
    if (path.startsWith('/practice')) return 'Practice';
    if (path.startsWith('/competition')) return 'Competition';
    if (path === '/leaderboard') return 'Leaderboard';
    if (path === '/profile') return 'Profile';
    return 'Brilla';
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-ghana flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="hidden sm:block font-display font-bold text-xl text-neutral-900">
              Brilla
            </span>
          </Link>

          {/* Page title (mobile) */}
          <span className="lg:hidden font-semibold text-neutral-900">{getPageTitle()}</span>
        </div>

        {/* Center section - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search topics, questions..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Mobile search button */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {isAuthenticated && user ? (
            <>
              {/* Stats */}
              <div className="hidden sm:flex items-center gap-4 mr-2">
                <div className="flex items-center gap-1 text-sm">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">{user.streakDays}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 text-secondary" />
                  <span className="font-medium">{formatNumber(user.xpPoints)}</span>
                </div>
              </div>

              {/* Notifications */}
              <button
                className="relative p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-neutral-500 hidden sm:block" />
                </button>

                {/* Dropdown menu */}
                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 z-20 py-2">
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="font-medium text-neutral-900">{user.name}</p>
                        <p className="text-sm text-neutral-500">{user.email}</p>
                        <p className="text-xs text-primary mt-1">Level {user.level}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <hr className="my-2 border-neutral-100" />
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      {isSearchOpen && (
        <div className="md:hidden px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search topics, questions..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}

import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  BookOpen,
  Brain,
  Trophy,
  Medal,
  Shield,
  Swords,
  User,
  Settings,
  HelpCircle,
  FileText,
  Upload,
  PenTool,
  GraduationCap,
  Zap,
  ClipboardList,
  Users,
  MessageSquare,
  Hash,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuthStore, useExamStore, useChatStore } from '@/stores';
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
    { path: '/speed-quiz', label: 'Speed Quiz', icon: Zap },
  ],
  wassce: [
    { path: '/past-papers', label: 'Past Papers', icon: FileText },
    { path: '/practice/essay', label: 'Essay Practice', icon: PenTool },
    { path: '/mock-exams', label: 'Mock Exams', icon: ClipboardList },
    { path: '/catalog', label: 'Subject Catalog', icon: GraduationCap },
  ],
  bece: [
    { path: '/past-papers', label: 'Past Papers', icon: FileText },
    { path: '/practice/essay', label: 'Essay Practice', icon: PenTool },
    { path: '/mock-exams', label: 'Mock Exams', icon: ClipboardList },
  ],
};

// Community navigation items
const communityNavItems = [
  { path: '/community', label: 'Community Hub', icon: Users, auth: true },
  { path: '/house-cup', label: 'House Cup', icon: Shield, auth: true },
  { path: '/leaderboard', label: 'Leaderboard', icon: Medal },
];

// Chat quick actions (not routes, but actions)
const chatActions = [
  { id: 'rooms', label: 'Study Rooms', icon: Hash },
  { id: 'chats', label: 'Messages', icon: MessageSquare },
];

// Exam mode descriptions
const examModeInfo = {
  nsmq: {
    title: 'NSMQ Mode',
    description: 'Science & Maths Competition',
    color: 'from-amber-500 to-orange-600',
    textColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  wassce: {
    title: 'WASSCE Mode',
    description: 'Senior Secondary Exam Prep',
    color: 'from-indigo-500 to-purple-600',
    textColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  bece: {
    title: 'BECE Mode',
    description: 'Junior Secondary Exam Prep',
    color: 'from-emerald-500 to-teal-600',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { isAuthenticated, user } = useAuthStore();
  const { currentExamType, initializeExamData } = useExamStore();
  const { openChat, setActiveTab, getUnreadCount } = useChatStore();
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
  const unreadCount = getUnreadCount();

  // Initialize exam data on mount
  useEffect(() => {
    initializeExamData();
  }, [initializeExamData]);

  // Get exam-specific navigation items
  const examItems = examSpecificItems[currentExamType] || [];
  const examInfo = examModeInfo[currentExamType];

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

          {/* Exam Mode Indicator */}
          <div className={cn('rounded-lg p-3', examInfo.bgColor)}>
            <div className="flex items-center gap-2">
              <div className={cn('w-2 h-2 rounded-full bg-gradient-to-r', examInfo.color)} />
              <span className={cn('text-sm font-semibold', examInfo.textColor)}>
                {examInfo.title}
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-1 ml-4">{examInfo.description}</p>
          </div>

          {/* Main Navigation */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              General
            </h3>
            <ul className="space-y-1">
              {mainNavItems.map((item) => {
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

          {/* Exam-Specific Features */}
          {examItems.length > 0 && (
            <div>
              <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                {currentExamType.toUpperCase()} Features
              </h3>
              <ul className="space-y-1">
                {examItems.map((item) => {
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
                              ? cn('bg-gradient-to-r text-white', examInfo.color)
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
          )}

          {/* Community Features */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Community
            </h3>
            <ul className="space-y-1">
              {communityNavItems.map((item) => {
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

              {/* Chat Quick Actions */}
              {isAuthenticated && chatActions.map((action) => (
                <li key={action.id}>
                  <button
                    onClick={() => {
                      setActiveTab(action.id as 'chats' | 'rooms');
                      openChat();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-neutral-700 hover:bg-neutral-100"
                  >
                    <action.icon className="w-5 h-5" />
                    <span className="flex-1 text-left">{action.label}</span>
                    {action.id === 'chats' && unreadCount > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                </li>
              ))}
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
                  {isTeacherOrAdmin && (
                    <li>
                      <NavLink
                        to="/content"
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors',
                            isActive
                              ? 'bg-accent text-white'
                              : 'text-neutral-700 hover:bg-neutral-100'
                          )
                        }
                      >
                        <Upload className="w-5 h-5" />
                        Content Manager
                      </NavLink>
                    </li>
                  )}
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

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
  FlaskConical,
  UserCheck,
  Bell,
  ClipboardCheck,
  FolderOpen,
  Target,
  Library,
  Heart,
  Crown,
  Gift,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuthStore, useExamStore, useChatStore, useProgressStore, useParentStore, useGradingStore } from '@/stores';
import { SubjectNavigation } from '@/components/subjects';
import { ExamModeSwitcher } from '@/components/exam';

// Teacher navigation items - Main
const teacherNavItems = [
  { path: '/teacher', label: 'Teacher Dashboard', icon: LayoutDashboard },
  { path: '/teacher/classes', label: 'My Classes', icon: FolderOpen },
];

// Teacher navigation items - Teaching Tools (for tutoring students)
const teachingToolsItems = [
  { path: '/teacher/whiteboard', label: 'Whiteboard', icon: PenTool },
  { path: '/teacher/assessments', label: 'Assessments', icon: FileText },
  { path: '/teacher/grading', label: 'Grading', icon: ClipboardCheck, badge: true },
];

// Parent navigation items
const parentNavItems = [
  { path: '/parent', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/parent/notifications', label: 'Notifications', icon: Bell },
  { path: '/parent/settings', label: 'Settings', icon: Settings },
];

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
    { path: '/practice?mode=speed', label: 'Speed Quiz', icon: Zap },
  ],
  wassce: [
    { path: '/past-papers', label: 'Past Papers', icon: FileText },
    { path: '/practice/essay', label: 'Essay Practice', icon: PenTool },
    { path: '/mock-exams', label: 'Mock Exams', icon: ClipboardList },
    { path: '/virtual-lab', label: 'Virtual Lab', icon: FlaskConical },
    { path: '/catalog', label: 'Subject Catalog', icon: GraduationCap },
  ],
  bece: [
    { path: '/past-papers', label: 'Past Papers', icon: FileText },
    { path: '/practice/essay', label: 'Essay Practice', icon: PenTool },
    { path: '/mock-exams', label: 'Mock Exams', icon: ClipboardList },
  ],
};

// Learning Resources navigation items
const resourcesNavItems = [
  { path: '/library', label: 'E-Library', icon: Library },
  { path: '/counselor', label: 'AI Counselor', icon: Heart, auth: true },
];

// Community navigation items
const communityNavItems = [
  { path: '/community', label: 'Community Hub', icon: Users, auth: true },
  { path: '/house-cup', label: 'House Cup', icon: Shield, auth: true },
  { path: '/leaderboard', label: 'Leaderboard', icon: Medal },
  { path: '/quests', label: 'Quests', icon: Target, auth: true },
  { path: '/friends', label: 'Friends', icon: UserCheck, auth: true },
  { path: '/study-groups', label: 'Study Groups', icon: Users, auth: true },
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
  const { isAuthenticated, user, pendingCount, loadPendingUsers } = useAuthStore();
  const { currentExamType, initializeExamData } = useExamStore();
  const { openChat, setActiveTab, getUnreadCount } = useChatStore();
  const { totalQuestionsAttempted, overallAccuracy } = useProgressStore();
  const { unreadCount: parentUnreadCount, fetchNotifications } = useParentStore();
  const { pendingCount: gradingPendingCount, fetchGradingQueue } = useGradingStore();
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const isParent = user?.role === 'parent';
  const unreadCount = getUnreadCount();

  // Initialize exam data on mount
  useEffect(() => {
    initializeExamData();
  }, [initializeExamData]);

  // Load pending users for admin
  useEffect(() => {
    if (isAdmin) {
      loadPendingUsers();
    }
  }, [isAdmin, loadPendingUsers]);

  // Load notifications for parent
  useEffect(() => {
    if (isParent) {
      fetchNotifications();
    }
  }, [isParent, fetchNotifications]);

  // Load grading queue for teachers
  useEffect(() => {
    if (isTeacherOrAdmin) {
      fetchGradingQueue();
    }
  }, [isTeacherOrAdmin, fetchGradingQueue]);

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
          'fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-neutral-200 dark:border-slate-700 z-40 overflow-y-auto transition-colors duration-300',
          'transform transition-transform duration-200 ease-in-out',
          'lg:translate-x-0 lg:static lg:h-[calc(100vh-4rem)]',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="p-4 space-y-6">
          {/* Parent-specific sidebar */}
          {isParent && (
            <>
              {/* Parent Header */}
              <div className="rounded-lg p-4 bg-green-50 border border-green-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-semibold text-green-700">Parent Dashboard</span>
                </div>
                <p className="text-xs text-green-600 mt-1 ml-4">Monitor your ward's progress</p>
              </div>

              {/* Parent Navigation */}
              <div>
                <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  Navigation
                </h3>
                <ul className="space-y-1">
                  {parentNavItems.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors',
                            isActive
                              ? 'bg-green-600 text-white'
                              : 'text-neutral-700 hover:bg-neutral-100'
                          )
                        }
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="flex-1">{item.label}</span>
                        {item.path === '/parent/notifications' && parentUnreadCount > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {parentUnreadCount > 99 ? '99+' : parentUnreadCount}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Help Link */}
              <div className="border-t border-neutral-200 pt-4">
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
              </div>

              {/* Parent Branding */}
              <div className="text-center text-xs text-neutral-500 pt-4 border-t border-neutral-200">
                <p className="font-medium">Brilla Prep</p>
                <p>Parent Monitoring Portal</p>
              </div>
            </>
          )}

          {/* Regular sidebar for non-parent users */}
          {!isParent && (
            <>
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
            <h3 className="px-3 text-xs font-semibold text-neutral-500 dark:text-slate-500 uppercase tracking-wider mb-2">
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
                            : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
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
              <h3 className="px-3 text-xs font-semibold text-neutral-500 dark:text-slate-500 uppercase tracking-wider mb-2">
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
                              : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
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

          {/* Learning Resources */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-neutral-500 dark:text-slate-500 uppercase tracking-wider mb-2">
              Resources
            </h3>
            <ul className="space-y-1">
              {resourcesNavItems.map((item) => {
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
                            ? item.path === '/counselor'
                              ? 'bg-green-600 text-white'
                              : 'bg-primary text-white'
                            : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
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

          {/* Community Features */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-neutral-500 dark:text-slate-500 uppercase tracking-wider mb-2">
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
                            : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
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
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800"
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

          {/* Quick Stats (if authenticated and has progress) */}
          {isAuthenticated && totalQuestionsAttempted > 0 && (
            <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-4 text-white">
              <h4 className="font-semibold mb-3">Your Progress</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="opacity-80">Questions</span>
                  <span className="font-medium">{totalQuestionsAttempted}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-secondary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(overallAccuracy, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="opacity-80">Accuracy</span>
                  <span className="font-medium">{overallAccuracy}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Links */}
          <div className="border-t border-neutral-200 dark:border-slate-700 pt-4">
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
                            : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
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
                            : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                        )
                      }
                    >
                      <Settings className="w-5 h-5" />
                      Settings
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/pricing"
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors',
                          isActive
                            ? 'bg-accent text-white'
                            : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                        )
                      }
                    >
                      <Crown className="w-5 h-5" />
                      Premium Plans
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/affiliate"
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors',
                          isActive
                            ? 'bg-gradient-to-r from-primary to-accent text-white'
                            : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                        )
                      }
                    >
                      <Gift className="w-5 h-5" />
                      Earn Rewards
                    </NavLink>
                  </li>
                  {isTeacherOrAdmin && (
                    <>
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
                      {/* Teacher Main Navigation */}
                      {teacherNavItems.map((item) => (
                        <li key={item.path}>
                          <NavLink
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors',
                                isActive
                                  ? 'bg-purple-600 text-white'
                                  : 'text-neutral-700 hover:bg-neutral-100'
                              )
                            }
                          >
                            <item.icon className="w-5 h-5" />
                            <span className="flex-1">{item.label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </>
                  )}

                  {/* Teaching Tools Section - For tutoring students */}
                  {isTeacherOrAdmin && (
                    <li className="pt-4 border-t border-neutral-200 mt-4">
                      <div className="px-3 pb-2">
                        <h3 className="text-xs font-semibold text-teal-600 uppercase tracking-wider flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          Teaching Tools
                        </h3>
                      </div>
                      <ul className="space-y-1">
                        {teachingToolsItems.map((item) => (
                          <li key={item.path}>
                            <NavLink
                              to={item.path}
                              onClick={onClose}
                              className={({ isActive }) =>
                                cn(
                                  'flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors',
                                  isActive
                                    ? 'bg-teal-600 text-white'
                                    : 'text-neutral-700 hover:bg-teal-50 hover:text-teal-700'
                                )
                              }
                            >
                              <item.icon className="w-5 h-5" />
                              <span className="flex-1">{item.label}</span>
                              {item.badge && gradingPendingCount > 0 && (
                                <span className="min-w-[20px] h-5 px-1.5 bg-amber-700 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                  {gradingPendingCount > 99 ? '99+' : gradingPendingCount}
                                </span>
                              )}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </li>
                  )}

                  {isAdmin && (
                    <>
                      <li>
                        <NavLink
                          to="/admin/users"
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors',
                              isActive
                                ? 'bg-indigo-600 text-white'
                                : 'text-neutral-700 hover:bg-neutral-100'
                            )
                          }
                        >
                          <Users className="w-5 h-5" />
                          User Management
                        </NavLink>
                      </li>
                      <li>
                        <NavLink
                          to="/admin/approvals"
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors',
                              isActive
                                ? 'bg-purple-600 text-white'
                                : 'text-neutral-700 hover:bg-neutral-100'
                            )
                          }
                        >
                          <UserCheck className="w-5 h-5" />
                          <span className="flex-1">User Approvals</span>
                          {pendingCount > 0 && (
                            <span className="min-w-[20px] h-5 px-1.5 bg-amber-700 text-white text-xs font-bold rounded-full flex items-center justify-center">
                              {pendingCount > 99 ? '99+' : pendingCount}
                            </span>
                          )}
                        </NavLink>
                      </li>
                      <li>
                        <NavLink
                          to="/admin/audit"
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors',
                              isActive
                                ? 'bg-rose-600 text-white'
                                : 'text-neutral-700 hover:bg-neutral-100'
                            )
                          }
                        >
                          <Shield className="w-5 h-5" />
                          Audit Log
                        </NavLink>
                      </li>
                    </>
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
                        : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
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
          <div className="text-center text-xs text-neutral-500 dark:text-slate-500 pt-4 border-t border-neutral-200 dark:border-slate-700">
            <p className="font-medium">Brilla Prep</p>
            <p>
              {currentExamType === 'nsmq' && 'NSMQ Competition Prep'}
              {currentExamType === 'wassce' && 'WASSCE Exam Prep'}
              {currentExamType === 'bece' && 'BECE Exam Prep'}
            </p>
          </div>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}

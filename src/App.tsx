import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useState } from 'react';
import { Layout } from '@/components/layout';
import { useAuthStore } from '@/stores';
import { OnboardingModal, FeatureTour, OnboardingTrigger } from '@/components/guide';
import { ToastContainer } from '@/components/toast';

// Loading component for lazy-loaded pages
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
}

// Wrapper for lazy-loaded components
function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// Core pages (loaded immediately for fast initial load)
import { HomePage } from '@/pages/Home';
import { DashboardPage } from '@/pages/Dashboard';
import { LandingPage } from '@/pages/Landing';

// Lazy loaded pages (direct imports for true code splitting)
const TopicsPage = lazy(() => import('@/pages/Topics').then(m => ({ default: m.TopicsPage })));
const PracticePage = lazy(() => import('@/pages/Practice').then(m => ({ default: m.PracticePage })));
const CompetitionPage = lazy(() => import('@/pages/Competition').then(m => ({ default: m.CompetitionPage })));
const HouseCupPage = lazy(() => import('@/pages/HouseCup').then(m => ({ default: m.HouseCupPage })));
const AnalyticsPage = lazy(() => import('@/pages/Analytics').then(m => ({ default: m.AnalyticsPage })));
const BattlePage = lazy(() => import('@/pages/Battle').then(m => ({ default: m.BattlePage })));
const PastPapersPage = lazy(() => import('@/pages/PastPapers').then(m => ({ default: m.PastPapers })));
const EssayPracticePage = lazy(() => import('@/pages/EssayPractice').then(m => ({ default: m.EssayPracticePage })));
const ContentManagementPage = lazy(() => import('@/pages/ContentManagement').then(m => ({ default: m.ContentManagementPage })));
const MockExamsPage = lazy(() => import('@/pages/MockExams').then(m => ({ default: m.MockExamsPage })));
const SubjectCatalogPage = lazy(() => import('@/pages/SubjectCatalog').then(m => ({ default: m.SubjectCatalogPage })));
const CommunityPage = lazy(() => import('@/pages/Community').then(m => ({ default: m.CommunityPage })));
const SettingsPage = lazy(() => import('@/pages/Settings'));

const HelpCenter = lazy(() => import('@/pages/HelpCenter'));
const AdminApprovals = lazy(() => import('@/pages/AdminApprovals'));
const UserManagement = lazy(() => import('@/pages/UserManagement'));
const AuditLog = lazy(() => import('@/pages/AuditLog'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminAnalytics = lazy(() => import('@/pages/AdminAnalytics'));
const AdminSubscriptions = lazy(() => import('@/pages/AdminSubscriptions'));
const AdminAffiliates = lazy(() => import('@/pages/AdminAffiliates'));

// Admin layout (lazy loaded)
const AdminLayout = lazy(() => import('@/components/admin/layout/AdminLayout').then(m => ({ default: m.AdminLayout })));
const SetPasswordPage = lazy(() => import('@/pages/SetPasswordPage').then(m => ({ default: m.SetPasswordPage })));
const ParentDashboardPage = lazy(() => import('@/pages/ParentDashboard').then(m => ({ default: m.ParentDashboardPage })));
const ParentSettingsPage = lazy(() => import('@/pages/ParentSettings').then(m => ({ default: m.ParentSettingsPage })));
const ParentReportsPage = lazy(() => import('@/pages/ParentReports').then(m => ({ default: m.ParentReportsPage })));
const ParentNotificationsPage = lazy(() => import('@/pages/ParentNotifications').then(m => ({ default: m.ParentNotificationsPage })));
const VirtualLabPage = lazy(() => import('@/components/lab').then(m => ({ default: m.VirtualLabPage })));

// Teacher pages (lazy loaded)
const TeacherDashboard = lazy(() => import('@/pages/TeacherDashboard'));
const AssessmentList = lazy(() => import('@/pages/AssessmentList'));
const AssessmentBuilder = lazy(() => import('@/pages/AssessmentBuilder'));
const AssessmentGrading = lazy(() => import('@/pages/AssessmentGrading'));
const ClassManagement = lazy(() => import('@/pages/ClassManagement'));

// Student assessment pages (lazy loaded)
const AssignedAssessments = lazy(() => import('@/pages/AssignedAssessments'));
const TakeAssessment = lazy(() => import('@/pages/TakeAssessment'));
const AssessmentResults = lazy(() => import('@/pages/AssessmentResults'));
const QuestsPage = lazy(() => import('@/pages/QuestsPage'));
const FriendsPage = lazy(() => import('@/pages/FriendsPage'));
const StudyGroupsPage = lazy(() => import('@/pages/StudyGroupsPage'));
const LeaderboardPage = lazy(() => import('@/pages/Leaderboard'));
const LibraryPage = lazy(() => import('@/pages/Library').then(m => ({ default: m.LibraryPage })));
const CounselorPage = lazy(() => import('@/pages/Counselor').then(m => ({ default: m.CounselorPage })));
const ModerationDashboard = lazy(() => import('@/pages/ModerationDashboard'));
const PricingPage = lazy(() => import('@/pages/Pricing'));
const AffiliatePage = lazy(() => import('@/pages/Affiliate'));
const PaymentCallbackPage = lazy(() => import('@/pages/PaymentCallback'));

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Login Page (placeholder)
function LoginPage() {
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, login, clearError } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleDemoLogin = async (role: 'student' | 'admin' | 'teacher' | 'parent' = 'student') => {
    const demoCredentials: Record<typeof role, { email: string; password: string }> = {
      student: { email: 'student@brillaprep.org', password: 'Student123!' },
      teacher: { email: 'teacher@brillaprep.org', password: 'Teacher123!' },
      admin: { email: 'admin@brillaprep.org', password: 'Admin123!' },
      parent: { email: 'parent@brillaprep.org', password: 'Parent123!' },
    };

    setIsSubmitting(true);
    clearError();

    try {
      const creds = demoCredentials[role];
      await login(creds.email, creds.password);
      // Redirect based on role
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'parent') {
        navigate('/parent');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Demo login failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-card">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-ghana flex items-center justify-center">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Welcome to Brilla</h1>
          <p className="text-neutral-500">Sign in to continue training</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Demo login buttons */}
        <div className="space-y-4">
          {/* Admin - Primary button */}
          <button
            type="button"
            onClick={() => handleDemoLogin('admin')}
            disabled={isLoading || isSubmitting}
            className="w-full py-3 px-4 bg-accent text-white rounded-lg font-semibold hover:bg-accent-dark active:scale-[0.98] transition-all disabled:opacity-50 shadow-md"
          >
            {isLoading || isSubmitting ? 'Signing in...' : 'Sign In as Admin'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-neutral-400">or continue as</span>
            </div>
          </div>

          {/* Teacher, Student, and Parent buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleDemoLogin('teacher')}
              disabled={isLoading || isSubmitting}
              className="py-3 px-4 bg-secondary text-neutral-900 rounded-lg font-medium hover:bg-secondary-dark active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('student')}
              disabled={isLoading || isSubmitting}
              className="py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('parent')}
              disabled={isLoading || isSubmitting}
              className="py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
            >
              Parent
            </button>
          </div>
        </div>

        {/* Demo credentials info */}
        <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
          <p className="text-xs text-neutral-500 text-center">
            <strong>Demo Mode:</strong> Click any button above to sign in instantly.
            <br />No password required.
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-500">
            Don't have an account?{' '}
            <a href="/register" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Register Page (placeholder)
function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleDemoRegister = () => {
    useAuthStore.setState({
      user: {
        id: `user_${Date.now()}`,
        email: 'new@stjohns.edu.gh',
        name: 'New Student',
        role: 'student',
        status: 'approved',
        house: 'Red House',
        yearGroup: 2,
        xpPoints: 0,
        level: 1,
        streakDays: 0,
        aiGradingCredits: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      token: `new_token_${Date.now()}`,
      isAuthenticated: true,
    });

    // Redirect to dashboard after registration
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-card">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-ghana flex items-center justify-center">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Create Account</h1>
          <p className="text-neutral-500">Join the NSMQ training platform</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="student@stjohns.edu.gh"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">House</label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20">
              <option value="">Select house</option>
              <option value="Blue House">Blue House</option>
              <option value="Red House">Red House</option>
              <option value="Green House">Green House</option>
              <option value="Yellow House">Yellow House</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Year Group</label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20">
              <option value="">Select year</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="••••••••"
            />
          </div>
          <button
            onClick={handleDemoRegister}
            className="w-full py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Create Account (Demo)
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-500">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Profile Page (placeholder)
function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-neutral-900">Profile</h1>
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">{user.name}</h2>
            <p className="text-neutral-500">{user.email}</p>
            <p className="text-sm text-primary">Level {user.level}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-neutral-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-primary">{user.xpPoints}</p>
            <p className="text-sm text-neutral-500">XP Points</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-orange-500">{user.streakDays}</p>
            <p className="text-sm text-neutral-500">Day Streak</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-neutral-900">{user.house || 'N/A'}</p>
            <p className="text-sm text-neutral-500">House</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-neutral-900">Year {user.yearGroup || 'N/A'}</p>
            <p className="text-sm text-neutral-500">Year Group</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Home route - shows landing for guests, home for authenticated users
function HomeRoute() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Redirect admins to admin dashboard
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Redirect parents to parent dashboard
  if (user?.role === 'parent') {
    return <Navigate to="/parent" replace />;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6">
        <HomePage />
      </div>
    </Layout>
  );
}

// Main App component
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page for guests, home for authenticated (no nested layout) */}
        <Route path="/" element={<HomeRoute />} />

        {/* Auth routes (no layout) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/set-password" element={<LazyPage><SetPasswordPage /></LazyPage>} />

        {/* Main app routes (with layout) */}
        <Route element={<Layout />}>
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="topics"
            element={
              <ProtectedRoute>
                <LazyPage><TopicsPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="topics/:subjectSlug"
            element={
              <ProtectedRoute>
                <LazyPage><TopicsPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="topics/:subjectSlug/:topicSlug"
            element={
              <ProtectedRoute>
                <LazyPage><TopicsPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="practice"
            element={
              <ProtectedRoute>
                <LazyPage><PracticePage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="practice/essay"
            element={
              <ProtectedRoute>
                <LazyPage><EssayPracticePage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="competition"
            element={
              <ProtectedRoute>
                <LazyPage><CompetitionPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route path="leaderboard" element={<LazyPage><LeaderboardPage /></LazyPage>} />
          <Route
            path="quests"
            element={
              <ProtectedRoute>
                <LazyPage><QuestsPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="friends"
            element={
              <ProtectedRoute>
                <LazyPage><FriendsPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="study-groups"
            element={
              <ProtectedRoute>
                <LazyPage><StudyGroupsPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="study-groups/:groupId"
            element={
              <ProtectedRoute>
                <LazyPage><StudyGroupsPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="house-cup"
            element={
              <ProtectedRoute>
                <LazyPage><HouseCupPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="analytics"
            element={
              <ProtectedRoute>
                <LazyPage><AnalyticsPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="battle"
            element={
              <ProtectedRoute>
                <LazyPage><BattlePage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="battle/:id"
            element={
              <ProtectedRoute>
                <LazyPage><BattlePage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route path="past-papers" element={<LazyPage><PastPapersPage /></LazyPage>} />
          <Route
            path="past-papers/:paperId"
            element={
              <ProtectedRoute>
                <LazyPage><PastPapersPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route path="mock-exams" element={<LazyPage><MockExamsPage /></LazyPage>} />
          <Route
            path="mock-exams/:examId"
            element={
              <ProtectedRoute>
                <LazyPage><MockExamsPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route path="catalog" element={<LazyPage><SubjectCatalogPage /></LazyPage>} />
          <Route
            path="virtual-lab"
            element={
              <ProtectedRoute>
                <LazyPage><VirtualLabPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="virtual-lab/:experimentSlug"
            element={
              <ProtectedRoute>
                <LazyPage><VirtualLabPage /></LazyPage>
              </ProtectedRoute>
            }
          />

          {/* E-Library routes */}
          <Route path="library" element={<LazyPage><LibraryPage /></LazyPage>} />
          <Route path="library/:resourceId" element={<LazyPage><LibraryPage /></LazyPage>} />
          <Route
            path="library/collections"
            element={
              <ProtectedRoute>
                <LazyPage><LibraryPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="library/collections/:collectionId"
            element={
              <ProtectedRoute>
                <LazyPage><LibraryPage /></LazyPage>
              </ProtectedRoute>
            }
          />

          {/* AI Counselor routes */}
          <Route
            path="counselor"
            element={
              <ProtectedRoute>
                <LazyPage><CounselorPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="counselor/:conversationId"
            element={
              <ProtectedRoute>
                <LazyPage><CounselorPage /></LazyPage>
              </ProtectedRoute>
            }
          />

          <Route
            path="community"
            element={
              <ProtectedRoute>
                <LazyPage><CommunityPage /></LazyPage>
              </ProtectedRoute>
            }
          />

          {/* Pricing and Subscription routes */}
          <Route path="pricing" element={<LazyPage><PricingPage /></LazyPage>} />
          <Route
            path="payment/callback"
            element={
              <ProtectedRoute>
                <LazyPage><PaymentCallbackPage /></LazyPage>
              </ProtectedRoute>
            }
          />

          {/* Affiliate routes */}
          <Route
            path="affiliate"
            element={
              <ProtectedRoute>
                <LazyPage><AffiliatePage /></LazyPage>
              </ProtectedRoute>
            }
          />

          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute>
                <LazyPage><SettingsPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="content"
            element={
              <ProtectedRoute>
                <LazyPage><ContentManagementPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="help"
            element={
              <ProtectedRoute>
                <LazyPage><HelpCenter /></LazyPage>
              </ProtectedRoute>
            }
          />

          {/* Parent routes */}
          <Route
            path="parent"
            element={
              <ProtectedRoute>
                <LazyPage><ParentDashboardPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="parent/notifications"
            element={
              <ProtectedRoute>
                <LazyPage><ParentNotificationsPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="parent/settings"
            element={
              <ProtectedRoute>
                <LazyPage><ParentSettingsPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="parent/reports"
            element={
              <ProtectedRoute>
                <LazyPage><ParentReportsPage /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="parent/reports/:reportId"
            element={
              <ProtectedRoute>
                <LazyPage><ParentReportsPage /></LazyPage>
              </ProtectedRoute>
            }
          />

          {/* Teacher routes */}
          <Route
            path="teacher"
            element={
              <ProtectedRoute>
                <LazyPage><TeacherDashboard /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/assessments"
            element={
              <ProtectedRoute>
                <LazyPage><AssessmentList /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/assessments/new"
            element={
              <ProtectedRoute>
                <LazyPage><AssessmentBuilder /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/assessments/:id/edit"
            element={
              <ProtectedRoute>
                <LazyPage><AssessmentBuilder /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/grading"
            element={
              <ProtectedRoute>
                <LazyPage><AssessmentGrading /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/classes"
            element={
              <ProtectedRoute>
                <LazyPage><ClassManagement /></LazyPage>
              </ProtectedRoute>
            }
          />

          {/* Student assessment routes */}
          <Route
            path="assessments"
            element={
              <ProtectedRoute>
                <LazyPage><AssignedAssessments /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="assessments/:id/take"
            element={
              <ProtectedRoute>
                <LazyPage><TakeAssessment /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="assessments/:id/results"
            element={
              <ProtectedRoute>
                <LazyPage><AssessmentResults /></LazyPage>
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* Admin routes with dedicated dark layout */}
        <Route
          path="admin"
          element={
            <LazyPage>
              <AdminLayout />
            </LazyPage>
          }
        >
          <Route index element={<LazyPage><AdminDashboard /></LazyPage>} />
          <Route path="analytics" element={<LazyPage><AdminAnalytics /></LazyPage>} />
          <Route path="approvals" element={<LazyPage><AdminApprovals /></LazyPage>} />
          <Route path="users" element={<LazyPage><UserManagement /></LazyPage>} />
          <Route path="content" element={<LazyPage><ContentManagementPage /></LazyPage>} />
          <Route path="moderation" element={<LazyPage><ModerationDashboard /></LazyPage>} />
          <Route path="audit" element={<LazyPage><AuditLog /></LazyPage>} />
          <Route path="settings" element={<LazyPage><SettingsPage /></LazyPage>} />
          <Route path="subscriptions" element={<LazyPage><AdminSubscriptions /></LazyPage>} />
          <Route path="affiliates" element={<LazyPage><AdminAffiliates /></LazyPage>} />
        </Route>
      </Routes>

      {/* Global Guide Components */}
      <OnboardingTrigger />
      <OnboardingModal />
      <FeatureTour />

      {/* Global Toast Notifications */}
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;

import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Suspense, useState } from 'react';
import { Layout } from '@/components/layout';
import { useAuthStore } from '@/stores';
import { OnboardingModal, FeatureTour, OnboardingTrigger } from '@/components/guide';
import { ToastContainer } from '@/components/toast';
import { PageLoader, ErrorBoundary } from '@/components/common';
import { GoogleSignInButton } from '@/components/auth';
import { SplashScreen } from '@/components/SplashScreen';
import { lazyWithRetry } from '@/lib/lazyWithRetry';

// Wrapper for lazy-loaded components
function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// Core pages (loaded immediately for fast initial load)
import { HomePage } from '@/pages/Home';
import { DashboardPage } from '@/pages/Dashboard';
import { LandingPage } from '@/pages/Landing';

// Lazy loaded pages (direct imports for true code splitting)
const TopicsPage = lazyWithRetry(() => import('@/pages/Topics').then(m => ({ default: m.TopicsPage })));
const PracticePage = lazyWithRetry(() => import('@/pages/Practice').then(m => ({ default: m.PracticePage })));
const CompetitionPage = lazyWithRetry(() => import('@/pages/Competition').then(m => ({ default: m.CompetitionPage })));
const HouseCupPage = lazyWithRetry(() => import('@/pages/HouseCup').then(m => ({ default: m.HouseCupPage })));
const AnalyticsPage = lazyWithRetry(() => import('@/pages/Analytics').then(m => ({ default: m.AnalyticsPage })));
const BattlePage = lazyWithRetry(() => import('@/pages/Battle').then(m => ({ default: m.BattlePage })));
const PastPapersPage = lazyWithRetry(() => import('@/pages/PastPapers').then(m => ({ default: m.PastPapers })));
const TakePaper = lazyWithRetry(() => import('@/pages/TakePaper'));
const PaperResults = lazyWithRetry(() => import('@/pages/PaperResults'));
const EssayPracticePage = lazyWithRetry(() => import('@/pages/EssayPractice').then(m => ({ default: m.EssayPracticePage })));
const ContentManagementPage = lazyWithRetry(() => import('@/pages/ContentManagement').then(m => ({ default: m.ContentManagementPage })));
const MockExamsPage = lazyWithRetry(() => import('@/pages/MockExams').then(m => ({ default: m.MockExamsPage })));
const SubjectCatalogPage = lazyWithRetry(() => import('@/pages/SubjectCatalog').then(m => ({ default: m.SubjectCatalogPage })));
const CommunityPage = lazyWithRetry(() => import('@/pages/Community').then(m => ({ default: m.CommunityPage })));
const SettingsPage = lazyWithRetry(() => import('@/pages/Settings'));

const HelpCenter = lazyWithRetry(() => import('@/pages/HelpCenter'));
const AdminApprovals = lazyWithRetry(() => import('@/pages/AdminApprovals'));
const UserManagement = lazyWithRetry(() => import('@/pages/UserManagement'));
const AuditLog = lazyWithRetry(() => import('@/pages/AuditLog'));
const AdminDashboard = lazyWithRetry(() => import('@/pages/AdminDashboard'));
const AdminAnalytics = lazyWithRetry(() => import('@/pages/AdminAnalytics'));
const AdminSubscriptions = lazyWithRetry(() => import('@/pages/AdminSubscriptions'));
const AdminAffiliates = lazyWithRetry(() => import('@/pages/AdminAffiliates'));
const AdminTutoringDirectory = lazyWithRetry(() => import('@/pages/admin/AdminTutoringDirectory'));
const AdminTeacherBonuses = lazyWithRetry(() => import('@/pages/admin/AdminTeacherBonuses'));

// Admin layout (lazy loaded)
const AdminLayout = lazyWithRetry(() => import('@/components/admin/layout/AdminLayout').then(m => ({ default: m.AdminLayout })));
const SetPasswordPage = lazyWithRetry(() => import('@/pages/SetPasswordPage').then(m => ({ default: m.SetPasswordPage })));
const ParentDashboardPage = lazyWithRetry(() => import('@/pages/ParentDashboard').then(m => ({ default: m.ParentDashboardPage })));
const ParentSettingsPage = lazyWithRetry(() => import('@/pages/ParentSettings').then(m => ({ default: m.ParentSettingsPage })));
const ParentReportsPage = lazyWithRetry(() => import('@/pages/ParentReports').then(m => ({ default: m.ParentReportsPage })));
const ParentNotificationsPage = lazyWithRetry(() => import('@/pages/ParentNotifications').then(m => ({ default: m.ParentNotificationsPage })));
const VirtualLabPage = lazyWithRetry(() => import('@/components/lab').then(m => ({ default: m.VirtualLabPage })));

// Teacher pages (lazy loaded)
const TeacherDashboard = lazyWithRetry(() => import('@/pages/TeacherDashboard'));
const AssessmentList = lazyWithRetry(() => import('@/pages/AssessmentList'));
const AssessmentBuilder = lazyWithRetry(() => import('@/pages/AssessmentBuilder'));
const AssessmentGrading = lazyWithRetry(() => import('@/pages/AssessmentGrading'));
const ClassManagement = lazyWithRetry(() => import('@/pages/ClassManagement'));
const WhiteboardList = lazyWithRetry(() => import('@/pages/WhiteboardList'));
const WhiteboardEditor = lazyWithRetry(() => import('@/pages/WhiteboardEditor'));
const RecordingViewer = lazyWithRetry(() => import('@/pages/RecordingViewer'));

// Student assessment pages (lazy loaded)
const AssignedAssessments = lazyWithRetry(() => import('@/pages/AssignedAssessments'));
const TakeAssessment = lazyWithRetry(() => import('@/pages/TakeAssessment'));
const AssessmentResults = lazyWithRetry(() => import('@/pages/AssessmentResults'));
const QuestsPage = lazyWithRetry(() => import('@/pages/QuestsPage'));
const FriendsPage = lazyWithRetry(() => import('@/pages/FriendsPage'));
const StudyGroupsPage = lazyWithRetry(() => import('@/pages/StudyGroupsPage'));
const LeaderboardPage = lazyWithRetry(() => import('@/pages/Leaderboard'));
const LibraryPage = lazyWithRetry(() => import('@/pages/Library').then(m => ({ default: m.LibraryPage })));
const CounselorPage = lazyWithRetry(() => import('@/pages/Counselor').then(m => ({ default: m.CounselorPage })));
const ModerationDashboard = lazyWithRetry(() => import('@/pages/ModerationDashboard'));
const PricingPage = lazyWithRetry(() => import('@/pages/Pricing'));
const AffiliatePage = lazyWithRetry(() => import('@/pages/Affiliate'));
const PaymentCallbackPage = lazyWithRetry(() => import('@/pages/PaymentCallback'));
const PrivacyPolicyPage = lazyWithRetry(() => import('@/pages/PrivacyPolicy'));
const TermsOfServicePage = lazyWithRetry(() => import('@/pages/TermsOfService'));

// Tutoring marketplace pages (lazy loaded)
const TeacherDirectory = lazyWithRetry(() => import('@/pages/TeacherDirectory'));
const TeacherPublicProfile = lazyWithRetry(() => import('@/pages/TeacherPublicProfile'));
const TeacherDirectorySetup = lazyWithRetry(() => import('@/pages/TeacherDirectorySetup'));
const TutoringRequests = lazyWithRetry(() => import('@/pages/TutoringRequests'));
const TutoringSessions = lazyWithRetry(() => import('@/pages/TutoringSessions'));
const TeacherTutoringDashboard = lazyWithRetry(() => import('@/pages/TeacherTutoringDashboard'));
const TeacherBonusStatus = lazyWithRetry(() => import('@/pages/TeacherBonusStatus'));
const TutorObservationDashboard = lazyWithRetry(() => import('@/pages/TutorObservationDashboard'));

// Exam mode pages (full-screen distraction-free)
const ExamModePractice = lazyWithRetry(() => import('@/pages/ExamModePractice'));
const ExamModeResults = lazyWithRetry(() => import('@/pages/ExamModeResults'));

// OAuth callback page
const OAuthCallback = lazyWithRetry(() => import('@/pages/OAuthCallback'));

// Exam setup wizard (O-Level / A-Level)
const ExamSetup = lazyWithRetry(() => import('@/pages/ExamSetup'));

// O/A Level Dashboard and Syllabus Browser
const OALevelDashboard = lazyWithRetry(() => import('@/pages/OALevelDashboard'));
const SyllabusBrowser = lazyWithRetry(() => import('@/pages/SyllabusBrowser'));

// AI Revision Classroom
const RevisionClassroom = lazyWithRetry(() => import('@/pages/RevisionClassroom'));

// Multiplayer Study Rooms
const StudyRooms = lazyWithRetry(() => import('@/pages/StudyRooms'));

// Immersive Learning Mode
const ImmersiveLearning = lazyWithRetry(() => import('@/pages/ImmersiveLearning'));

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
  const { isLoading, error, isAuthenticated } = useAuthStore();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50">
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

        {/* Google Sign-In */}
        <div className="mb-6">
          <GoogleSignInButton
            mode="login"
            onError={(err) => console.error('Google login error:', err)}
            disabled={isLoading}
          />
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary underline hover:no-underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

// Register Page - Redirects to landing page with registration modal
function RegisterPage() {
  const { isAuthenticated } = useAuthStore();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect to landing page with register modal, preserving the affiliate
  // referral code (/api/affiliates/ref/:code lands users on /register?ref=CODE)
  const ref = new URLSearchParams(window.location.search).get('ref');
  return <Navigate to={`/?register=true${ref ? `&ref=${encodeURIComponent(ref)}` : ''}`} replace />;
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

// Check if running as installed PWA
function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
         document.referrer.includes('android-app://');
}

// Main App component
function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // For PWA: Show splash on each launch (once per hour to avoid annoyance on quick re-opens)
    // For browser: Show once per session
    if (isPWA()) {
      const lastSplashTime = localStorage.getItem('brilla_splash_time');
      if (lastSplashTime) {
        const hoursSinceLastSplash = (Date.now() - parseInt(lastSplashTime)) / (1000 * 60 * 60);
        return hoursSinceLastSplash >= 1; // Show splash if more than 1 hour since last
      }
      return true; // First time - show splash
    } else {
      // Browser: once per session
      const hasSeenSplash = sessionStorage.getItem('brilla_splash_shown');
      return !hasSeenSplash;
    }
  });

  const handleSplashComplete = () => {
    if (isPWA()) {
      localStorage.setItem('brilla_splash_time', Date.now().toString());
    } else {
      sessionStorage.setItem('brilla_splash_shown', 'true');
    }
    setShowSplash(false);
  };

  // Show only splash screen until complete - prevents PageLoader from rendering behind it
  if (showSplash) {
    return (
      <SplashScreen
        onComplete={handleSplashComplete}
        duration={3500}
      />
    );
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Routes>
        {/* Landing page for guests, home for authenticated (no nested layout) */}
        <Route path="/" element={<HomeRoute />} />

        {/* Auth routes (no layout) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/set-password" element={<LazyPage><SetPasswordPage /></LazyPage>} />
        <Route path="/oauth/callback" element={<LazyPage><OAuthCallback /></LazyPage>} />

        {/* Legal pages (no layout) */}
        <Route path="/privacy" element={<LazyPage><PrivacyPolicyPage /></LazyPage>} />
        <Route path="/terms" element={<LazyPage><TermsOfServicePage /></LazyPage>} />

        {/* Exam mode routes (full-screen, distraction-free, no layout) */}
        <Route
          path="/exam/practice"
          element={
            <ProtectedRoute>
              <LazyPage><ExamModePractice /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam/results"
          element={
            <ProtectedRoute>
              <LazyPage><ExamModeResults /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice/results"
          element={
            <ProtectedRoute>
              <LazyPage><ExamModeResults /></LazyPage>
            </ProtectedRoute>
          }
        />

        {/* AI Revision Classroom - full-screen immersive (no layout) */}
        <Route
          path="/revision-classroom"
          element={
            <ProtectedRoute>
              <LazyPage><RevisionClassroom /></LazyPage>
            </ProtectedRoute>
          }
        />

        {/* Multiplayer Study Rooms - full-screen immersive (no layout) */}
        <Route
          path="/study-rooms"
          element={
            <ProtectedRoute>
              <LazyPage><StudyRooms /></LazyPage>
            </ProtectedRoute>
          }
        />

        {/* Immersive Learning Mode - zero distraction focus mode (no layout) */}
        <Route
          path="/immersive-learning"
          element={
            <ProtectedRoute>
              <LazyPage><ImmersiveLearning /></LazyPage>
            </ProtectedRoute>
          }
        />

        {/* Past Papers & Mock Exams - distraction-free (no layout) */}
        <Route
          path="/past-papers/:paperId"
          element={
            <ProtectedRoute>
              <LazyPage><TakePaper /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mock-exams/:paperId"
          element={
            <ProtectedRoute>
              <LazyPage><TakePaper /></LazyPage>
            </ProtectedRoute>
          }
        />

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
            path="past-papers/results/:attemptId"
            element={
              <ProtectedRoute>
                <LazyPage><PaperResults /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route path="mock-exams" element={<LazyPage><MockExamsPage /></LazyPage>} />
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

          {/* O-Level / A-Level Exam Setup */}
          <Route path="exam-setup" element={<LazyPage><ExamSetup /></LazyPage>} />

          {/* O/A Level Dashboard and Syllabus Browser */}
          <Route
            path="oa-level"
            element={
              <ProtectedRoute>
                <LazyPage><OALevelDashboard /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="oa-level/syllabus/:specificationId"
            element={
              <ProtectedRoute>
                <LazyPage><SyllabusBrowser /></LazyPage>
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

          {/* Tutoring Marketplace routes */}
          <Route path="tutors" element={<LazyPage><TeacherDirectory /></LazyPage>} />
          <Route path="tutors/:id" element={<LazyPage><TeacherPublicProfile /></LazyPage>} />
          <Route
            path="tutoring/requests"
            element={
              <ProtectedRoute>
                <LazyPage><TutoringRequests /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="tutoring/sessions"
            element={
              <ProtectedRoute>
                <LazyPage><TutoringSessions /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="tutor-classroom"
            element={
              <ProtectedRoute>
                <LazyPage><TutorObservationDashboard /></LazyPage>
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
          <Route
            path="teacher/whiteboard"
            element={
              <ProtectedRoute>
                <LazyPage><WhiteboardList /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/whiteboard/new"
            element={
              <ProtectedRoute>
                <LazyPage><WhiteboardEditor /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/whiteboard/:id/edit"
            element={
              <ProtectedRoute>
                <LazyPage><WhiteboardEditor /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/whiteboard/recording/:id"
            element={
              <ProtectedRoute>
                <LazyPage><RecordingViewer /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/directory-profile"
            element={
              <ProtectedRoute>
                <LazyPage><TeacherDirectorySetup /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/tutoring"
            element={
              <ProtectedRoute>
                <LazyPage><TeacherTutoringDashboard /></LazyPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/bonus"
            element={
              <ProtectedRoute>
                <LazyPage><TeacherBonusStatus /></LazyPage>
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
          <Route path="tutoring" element={<LazyPage><AdminTutoringDirectory /></LazyPage>} />
          <Route path="teacher-bonuses" element={<LazyPage><AdminTeacherBonuses /></LazyPage>} />
        </Route>
      </Routes>
      </ErrorBoundary>

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

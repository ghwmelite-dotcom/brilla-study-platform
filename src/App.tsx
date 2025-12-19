import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import {
  HomePage,
  DashboardPage,
  TopicsPage,
  PracticePage,
  CompetitionPage,
  HouseCupPage,
  AnalyticsPage,
  BattlePage,
  PastPapersPage,
  LandingPage,
} from '@/pages';
import { useAuthStore } from '@/stores';

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
  const { isLoading, error, isAuthenticated } = useAuthStore();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleDemoLogin = (role: 'student' | 'admin' | 'teacher' = 'student') => {
    const users = {
      student: {
        id: 'user_demo',
        email: 'demo@stjohns.edu.gh',
        name: 'Demo Student',
        role: 'student' as const,
        house: 'Blue House',
        yearGroup: 3,
        xpPoints: 1500,
        level: 2,
        streakDays: 5,
        aiGradingCredits: 0,
      },
      admin: {
        id: 'user_admin',
        email: 'admin@stjohns.edu.gh',
        name: 'Admin User',
        role: 'admin' as const,
        house: undefined,
        yearGroup: undefined,
        xpPoints: 0,
        level: 10,
        streakDays: 0,
        aiGradingCredits: 100,
      },
      teacher: {
        id: 'user_teacher',
        email: 'teacher@stjohns.edu.gh',
        name: 'Demo Teacher',
        role: 'teacher' as const,
        house: undefined,
        yearGroup: undefined,
        xpPoints: 5000,
        level: 5,
        streakDays: 30,
        aiGradingCredits: 50,
      },
    };

    const selectedUser = users[role];

    useAuthStore.setState({
      user: {
        ...selectedUser,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      token: `${role}_demo_token`,
      isAuthenticated: true,
    });

    // Redirect to dashboard after login
    navigate('/dashboard');
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
            disabled={isLoading}
            className="w-full py-3 px-4 bg-accent text-white rounded-lg font-semibold hover:bg-accent-dark active:scale-[0.98] transition-all disabled:opacity-50 shadow-md"
          >
            {isLoading ? 'Signing in...' : 'Sign In as Admin'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-neutral-400">or continue as</span>
            </div>
          </div>

          {/* Teacher and Student buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleDemoLogin('teacher')}
              disabled={isLoading}
              className="py-3 px-4 bg-secondary text-neutral-900 rounded-lg font-medium hover:bg-secondary-dark active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('student')}
              disabled={isLoading}
              className="py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
            >
              Student
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
        id: 'user_new',
        email: 'new@stjohns.edu.gh',
        name: 'New Student',
        role: 'student',
        house: 'Red House',
        yearGroup: 2,
        xpPoints: 0,
        level: 1,
        streakDays: 0,
        aiGradingCredits: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      token: 'new_token',
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

// Leaderboard Page (placeholder)
function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-neutral-900">Leaderboard</h1>
      <p className="text-neutral-500">Coming soon! Track your ranking against other students.</p>
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
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <LandingPage />;
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
                <TopicsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="topics/:subjectSlug"
            element={
              <ProtectedRoute>
                <TopicsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="topics/:subjectSlug/:topicSlug"
            element={
              <ProtectedRoute>
                <TopicsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="practice"
            element={
              <ProtectedRoute>
                <PracticePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="competition"
            element={
              <ProtectedRoute>
                <CompetitionPage />
              </ProtectedRoute>
            }
          />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route
            path="house-cup"
            element={
              <ProtectedRoute>
                <HouseCupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="battle"
            element={
              <ProtectedRoute>
                <BattlePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="battle/:id"
            element={
              <ProtectedRoute>
                <BattlePage />
              </ProtectedRoute>
            }
          />
          <Route path="past-papers" element={<PastPapersPage />} />
          <Route
            path="past-papers/:paperId"
            element={
              <ProtectedRoute>
                <PastPapersPage />
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

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

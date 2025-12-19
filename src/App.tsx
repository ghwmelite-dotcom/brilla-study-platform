import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import {
  HomePage,
  DashboardPage,
  TopicsPage,
  PracticePage,
  CompetitionPage,
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
  const { isLoading, error } = useAuthStore();

  const handleDemoLogin = async (role: 'student' | 'admin' | 'teacher' = 'student') => {
    try {
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
    } catch (err) {
      console.error('Login failed:', err);
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

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="student@stjohns.edu.gh"
            />
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
            onClick={() => handleDemoLogin('student')}
            disabled={isLoading}
            className="w-full py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In (Demo Student)'}
          </button>
        </div>

        {/* Demo login options */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <p className="text-xs text-neutral-400 text-center mb-3">Demo Accounts</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('admin')}
              disabled={isLoading}
              className="py-2 px-3 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
            >
              Admin Login
            </button>
            <button
              onClick={() => handleDemoLogin('teacher')}
              disabled={isLoading}
              className="py-2 px-3 bg-secondary text-neutral-900 rounded-lg text-sm font-medium hover:bg-secondary-dark transition-colors disabled:opacity-50"
            >
              Teacher Login
            </button>
          </div>
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      token: 'new_token',
      isAuthenticated: true,
    });
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

// Main App component
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes (no layout) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Main app routes (with layout) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
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

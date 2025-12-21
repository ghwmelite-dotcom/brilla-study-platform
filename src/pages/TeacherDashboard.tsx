import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  ClipboardList,
  GraduationCap,
  Users,
  ClipboardCheck,
  Plus,
  ChevronRight,
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAssessmentStore } from '@/stores/assessmentStore';
import { useGradingStore } from '@/stores/gradingStore';
import { cn } from '@/utils';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { assessments, classes, fetchAssessments, fetchClasses, isLoading } =
    useAssessmentStore();
  const {
    pendingCount,
    fetchGradingQueue,
    isLoading: gradingLoading,
  } = useGradingStore();

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (!isTeacher) {
      navigate('/dashboard');
      return;
    }

    fetchAssessments();
    fetchClasses();
    fetchGradingQueue();
  }, [isAuthenticated, isTeacher, navigate, fetchAssessments, fetchClasses, fetchGradingQueue]);

  // Calculate stats
  const stats = {
    totalAssessments: assessments.length,
    publishedAssessments: assessments.filter((a) => a.status === 'published').length,
    draftAssessments: assessments.filter((a) => a.status === 'draft').length,
    totalClasses: classes.length,
    totalStudents: classes.reduce((sum, c) => sum + (c.memberCount || 0), 0),
  };

  // Recent assessments
  const recentAssessments = assessments
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5);

  const quickActions = [
    {
      icon: FileText,
      label: 'Create Quiz',
      description: 'Quick assessment',
      color: 'blue',
      href: '/teacher/assessments/new?type=quiz',
    },
    {
      icon: ClipboardList,
      label: 'Create Homework',
      description: 'Take-home assignment',
      color: 'amber',
      href: '/teacher/assessments/new?type=homework',
    },
    {
      icon: GraduationCap,
      label: 'Create Mock Exam',
      description: 'Timed assessment',
      color: 'purple',
      href: '/teacher/assessments/new?type=mock_exam',
    },
    {
      icon: Users,
      label: 'Add Class',
      description: 'Organize students',
      color: 'emerald',
      href: '/teacher/classes',
    },
  ];

  if (!isTeacher) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">
            Welcome back, {user?.name?.split(' ')[0] || 'Teacher'}
          </h1>
          <p className="text-neutral-600">
            Here's what's happening with your assessments today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats.totalAssessments}
                </p>
                <p className="text-sm text-neutral-500">Assessments</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats.totalClasses}
                </p>
                <p className="text-sm text-neutral-500">Classes</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats.totalStudents}
                </p>
                <p className="text-sm text-neutral-500">Students</p>
              </div>
            </div>
          </div>

          <Link
            to="/teacher/grading"
            className="bg-white rounded-xl p-5 border border-neutral-200 hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  pendingCount > 0 ? 'bg-amber-100' : 'bg-neutral-100'
                )}
              >
                <ClipboardCheck
                  className={cn(
                    'w-6 h-6',
                    pendingCount > 0 ? 'text-amber-600' : 'text-neutral-600'
                  )}
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{pendingCount}</p>
                <p className="text-sm text-neutral-500">To Grade</p>
              </div>
              {pendingCount > 0 && (
                <ChevronRight className="w-5 h-5 text-neutral-400 ml-auto" />
              )}
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className="bg-white rounded-xl p-5 border border-neutral-200 hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <action.icon
                  className={cn(
                    'w-8 h-8 mb-3',
                    action.color === 'blue' && 'text-blue-600',
                    action.color === 'amber' && 'text-amber-600',
                    action.color === 'purple' && 'text-purple-600',
                    action.color === 'emerald' && 'text-emerald-600'
                  )}
                />
                <p className="font-medium text-neutral-900">{action.label}</p>
                <p className="text-sm text-neutral-500">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Assessments */}
          <div className="bg-white rounded-xl border border-neutral-200">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="font-semibold text-neutral-900">Recent Assessments</h2>
              <Link
                to="/teacher/assessments"
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                View All
              </Link>
            </div>

            {isLoading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            ) : recentAssessments.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500">No assessments yet</p>
                <Link
                  to="/teacher/assessments/new"
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Create your first
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {recentAssessments.map((assessment) => (
                  <Link
                    key={assessment.id}
                    to={`/teacher/assessments/${assessment.id}/edit`}
                    className="flex items-center gap-3 p-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        assessment.assessmentType === 'quiz' &&
                          'bg-blue-100 text-blue-600',
                        assessment.assessmentType === 'homework' &&
                          'bg-amber-100 text-amber-600',
                        assessment.assessmentType === 'mock_exam' &&
                          'bg-purple-100 text-purple-600'
                      )}
                    >
                      {assessment.assessmentType === 'quiz' && (
                        <FileText className="w-5 h-5" />
                      )}
                      {assessment.assessmentType === 'homework' && (
                        <ClipboardList className="w-5 h-5" />
                      )}
                      {assessment.assessmentType === 'mock_exam' && (
                        <GraduationCap className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">
                        {assessment.title}
                      </p>
                      <p className="text-sm text-neutral-500 capitalize">
                        {assessment.assessmentType.replace('_', ' ')} •{' '}
                        {assessment.questionCount || 0} questions
                      </p>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        assessment.status === 'published' &&
                          'bg-green-100 text-green-700',
                        assessment.status === 'draft' &&
                          'bg-neutral-100 text-neutral-600',
                        assessment.status === 'archived' &&
                          'bg-neutral-100 text-neutral-500'
                      )}
                    >
                      {assessment.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Classes */}
          <div className="bg-white rounded-xl border border-neutral-200">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="font-semibold text-neutral-900">Your Classes</h2>
              <Link
                to="/teacher/classes"
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Manage
              </Link>
            </div>

            {isLoading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            ) : classes.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500">No classes yet</p>
                <Link
                  to="/teacher/classes"
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Create your first
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {classes.slice(0, 5).map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center gap-3 p-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: (cls.color || '#3B82F6') + '20' }}
                    >
                      <Users className="w-5 h-5" style={{ color: cls.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900">{cls.name}</p>
                      <p className="text-sm text-neutral-500">
                        {cls.memberCount || 0} students
                        {cls.schoolLevel && ` • ${cls.schoolLevel.toUpperCase()}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Grading Alert */}
        {pendingCount > 0 && (
          <Link
            to="/teacher/grading"
            className="mt-8 flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-900">
                You have {pendingCount} submission{pendingCount !== 1 ? 's' : ''} to grade
              </p>
              <p className="text-sm text-amber-700">
                Click here to start grading student work
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-600" />
          </Link>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  GraduationCap,
  BookOpen,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  School,
  BadgeCheck,
  Calendar,
  Briefcase,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils';

type AuthMode = 'login' | 'register';
type UserRole = 'student' | 'teacher' | 'admin';
type SchoolLevel = 'jss' | 'shs';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

interface FormErrors {
  [key: string]: string;
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { setUser, isLoading, clearError } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  // Student-specific fields
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel | ''>('');
  const [yearGroup, setYearGroup] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [house, setHouse] = useState('');

  // Teacher-specific fields
  const [teacherLicenseNumber, setTeacherLicenseNumber] = useState('');
  const [subjectsTaught, setSubjectsTaught] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState('');
  const [qualifications, setQualifications] = useState('');

  // Admin-specific fields
  const [adminCode, setAdminCode] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setSchoolLevel('');
    setYearGroup('');
    setSchoolName('');
    setHouse('');
    setTeacherLicenseNumber('');
    setSubjectsTaught([]);
    setYearsExperience('');
    setQualifications('');
    setAdminCode('');
    setFormErrors({});
    setSelectedRole(null);
    setRegistrationSuccess(false);
    clearError();
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Common validation
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (mode === 'register') {
      if (!name.trim()) {
        errors.name = 'Full name is required';
      }

      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }

      if (!selectedRole) {
        errors.role = 'Please select a role';
        setFormErrors(errors);
        return false;
      }

      // Role-specific validation
      if (selectedRole === 'student') {
        if (!schoolLevel) {
          errors.schoolLevel = 'Please select your school level';
        }
        if (!yearGroup) {
          errors.yearGroup = 'Please select your year/form';
        }
        if (!schoolName.trim()) {
          errors.schoolName = 'School name is required';
        }
      }

      if (selectedRole === 'teacher') {
        if (!teacherLicenseNumber.trim()) {
          errors.teacherLicenseNumber = 'GES License number is required';
        }
        if (!schoolName.trim()) {
          errors.schoolName = 'School name is required';
        }
        if (subjectsTaught.length === 0) {
          errors.subjectsTaught = 'Please select at least one subject';
        }
        if (!yearsExperience) {
          errors.yearsExperience = 'Years of experience is required';
        }
      }

      if (selectedRole === 'admin') {
        if (!adminCode.trim()) {
          errors.adminCode = 'Admin invitation code is required';
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    clearError();

    try {
      if (mode === 'login') {
        // Demo login - in production, this would call the API
        const demoUsers = {
          'admin@brilla.edu.gh': {
            id: 'admin_1',
            email: 'admin@brilla.edu.gh',
            name: 'System Admin',
            role: 'admin' as const,
            xpPoints: 0,
            level: 1,
            streakDays: 0,
            aiGradingCredits: 100,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          'teacher@brilla.edu.gh': {
            id: 'teacher_1',
            email: 'teacher@brilla.edu.gh',
            name: 'Demo Teacher',
            role: 'teacher' as const,
            xpPoints: 0,
            level: 1,
            streakDays: 0,
            aiGradingCredits: 50,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          'student@brilla.edu.gh': {
            id: 'student_1',
            email: 'student@brilla.edu.gh',
            name: 'Demo Student',
            role: 'student' as const,
            house: 'Blue House',
            yearGroup: 2,
            xpPoints: 1500,
            level: 5,
            streakDays: 7,
            aiGradingCredits: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };

        const user = demoUsers[email as keyof typeof demoUsers];
        if (user && password === 'password123') {
          setUser(user);
          onClose();
        } else {
          setFormErrors({ submit: 'Invalid email or password. Try demo accounts with password: password123' });
        }
      } else {
        // Demo registration - create user based on role
        const newUser = {
          id: `${selectedRole}_${Date.now()}`,
          email,
          name,
          role: selectedRole!,
          house: selectedRole === 'student' ? house || undefined : undefined,
          yearGroup: selectedRole === 'student' ? parseInt(yearGroup) : undefined,
          xpPoints: 0,
          level: 1,
          streakDays: 0,
          aiGradingCredits: selectedRole === 'admin' ? 100 : selectedRole === 'teacher' ? 50 : 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Simulate registration delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setRegistrationSuccess(true);
        setTimeout(() => {
          setUser(newUser);
          onClose();
        }, 1500);
      }
    } catch (err) {
      setFormErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    const demoCredentials = {
      student: { email: 'student@brilla.edu.gh', name: 'Demo Student' },
      teacher: { email: 'teacher@brilla.edu.gh', name: 'Demo Teacher' },
      admin: { email: 'admin@brilla.edu.gh', name: 'System Admin' },
    };

    const creds = demoCredentials[role];
    const user = {
      id: `${role}_demo`,
      email: creds.email,
      name: creds.name,
      role,
      house: role === 'student' ? 'Blue House' : undefined,
      yearGroup: role === 'student' ? 2 : undefined,
      xpPoints: role === 'student' ? 1500 : 0,
      level: role === 'student' ? 5 : 1,
      streakDays: role === 'student' ? 7 : 0,
      aiGradingCredits: role === 'admin' ? 100 : role === 'teacher' ? 50 : 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUser(user);
    onClose();
  };

  const subjects = [
    'Mathematics', 'English Language', 'Integrated Science', 'Social Studies',
    'Physics', 'Chemistry', 'Biology', 'Economics', 'Geography', 'History',
    'French', 'ICT', 'Elective Mathematics', 'Government',
  ];

  const toggleSubject = (subject: string) => {
    setSubjectsTaught(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-primary via-primary to-accent text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {mode === 'register' && selectedRole && (
            <button
              onClick={() => setSelectedRole(null)}
              className="absolute top-4 left-4 p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="text-center">
            <h2 className="text-xl font-bold">
              {mode === 'login'
                ? 'Welcome Back!'
                : selectedRole
                  ? `Register as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
                  : 'Create Account'
              }
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {mode === 'login'
                ? 'Sign in to continue your learning journey'
                : selectedRole
                  ? 'Complete your registration'
                  : 'Choose how you want to join Brilla'
              }
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {registrationSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BadgeCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Registration Successful!</h3>
              <p className="text-neutral-600 mt-2">Welcome to Brilla! Redirecting you to the dashboard...</p>
            </div>
          ) : mode === 'register' && !selectedRole ? (
            // Role Selection
            <div className="space-y-4">
              <p className="text-center text-neutral-600 mb-6">I am a...</p>

              <button
                onClick={() => setSelectedRole('student')}
                className="w-full flex items-center gap-4 p-4 border-2 border-neutral-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-neutral-900">Student</h3>
                  <p className="text-sm text-neutral-500">JSS or SHS student preparing for exams</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedRole('teacher')}
                className="w-full flex items-center gap-4 p-4 border-2 border-neutral-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-neutral-900">Teacher</h3>
                  <p className="text-sm text-neutral-500">Educator with GES registration</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedRole('admin')}
                className="w-full flex items-center gap-4 p-4 border-2 border-neutral-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-neutral-900">Administrator</h3>
                  <p className="text-sm text-neutral-500">School admin with invitation code</p>
                </div>
              </button>

              <div className="pt-4 text-center">
                <p className="text-neutral-600 text-sm">
                  Already have an account?{' '}
                  <button
                    onClick={() => handleModeSwitch('login')}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          ) : (
            // Login or Registration Form
            <form onSubmit={handleSubmit} className="space-y-4">
              {formErrors.submit && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formErrors.submit}
                </div>
              )}

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className={cn(
                        'w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20',
                        formErrors.name ? 'border-red-300' : 'border-neutral-300'
                      )}
                    />
                  </div>
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20',
                      formErrors.email ? 'border-red-300' : 'border-neutral-300'
                    )}
                  />
                </div>
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={cn(
                      'w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20',
                      formErrors.password ? 'border-red-300' : 'border-neutral-300'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
              </div>

              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className={cn(
                          'w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20',
                          formErrors.confirmPassword ? 'border-red-300' : 'border-neutral-300'
                        )}
                      />
                    </div>
                    {formErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>}
                  </div>

                  {/* Student-specific fields */}
                  {selectedRole === 'student' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          School Level
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => { setSchoolLevel('jss'); setYearGroup(''); }}
                            className={cn(
                              'p-3 border-2 rounded-lg text-center transition-all',
                              schoolLevel === 'jss'
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-neutral-200 hover:border-neutral-300'
                            )}
                          >
                            <span className="font-medium">JHS</span>
                            <span className="block text-xs text-neutral-500">Junior High School</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSchoolLevel('shs'); setYearGroup(''); }}
                            className={cn(
                              'p-3 border-2 rounded-lg text-center transition-all',
                              schoolLevel === 'shs'
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-neutral-200 hover:border-neutral-300'
                            )}
                          >
                            <span className="font-medium">SHS</span>
                            <span className="block text-xs text-neutral-500">Senior High School</span>
                          </button>
                        </div>
                        {formErrors.schoolLevel && <p className="text-red-500 text-xs mt-1">{formErrors.schoolLevel}</p>}
                      </div>

                      {schoolLevel && (
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            {schoolLevel === 'jss' ? 'Form' : 'Year'}
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <select
                              value={yearGroup}
                              onChange={(e) => setYearGroup(e.target.value)}
                              className={cn(
                                'w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-white',
                                formErrors.yearGroup ? 'border-red-300' : 'border-neutral-300'
                              )}
                            >
                              <option value="">Select {schoolLevel === 'jss' ? 'Form' : 'Year'}</option>
                              {schoolLevel === 'jss' ? (
                                <>
                                  <option value="1">Form 1 (JHS 1)</option>
                                  <option value="2">Form 2 (JHS 2)</option>
                                  <option value="3">Form 3 (JHS 3)</option>
                                </>
                              ) : (
                                <>
                                  <option value="1">Year 1 (SHS 1)</option>
                                  <option value="2">Year 2 (SHS 2)</option>
                                  <option value="3">Year 3 (SHS 3)</option>
                                </>
                              )}
                            </select>
                          </div>
                          {formErrors.yearGroup && <p className="text-red-500 text-xs mt-1">{formErrors.yearGroup}</p>}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          School Name
                        </label>
                        <div className="relative">
                          <School className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                          <input
                            type="text"
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            placeholder="e.g., Achimota School"
                            className={cn(
                              'w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20',
                              formErrors.schoolName ? 'border-red-300' : 'border-neutral-300'
                            )}
                          />
                        </div>
                        {formErrors.schoolName && <p className="text-red-500 text-xs mt-1">{formErrors.schoolName}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          House (Optional)
                        </label>
                        <select
                          value={house}
                          onChange={(e) => setHouse(e.target.value)}
                          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-white"
                        >
                          <option value="">Select House</option>
                          <option value="Blue House">Blue House</option>
                          <option value="Red House">Red House</option>
                          <option value="Green House">Green House</option>
                          <option value="Yellow House">Yellow House</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Teacher-specific fields */}
                  {selectedRole === 'teacher' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          GES License Number
                        </label>
                        <div className="relative">
                          <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                          <input
                            type="text"
                            value={teacherLicenseNumber}
                            onChange={(e) => setTeacherLicenseNumber(e.target.value)}
                            placeholder="e.g., GES/2020/12345"
                            className={cn(
                              'w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20',
                              formErrors.teacherLicenseNumber ? 'border-red-300' : 'border-neutral-300'
                            )}
                          />
                        </div>
                        {formErrors.teacherLicenseNumber && <p className="text-red-500 text-xs mt-1">{formErrors.teacherLicenseNumber}</p>}
                        <p className="text-xs text-neutral-500 mt-1">Your Ghana Education Service registration number</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          School Name
                        </label>
                        <div className="relative">
                          <School className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                          <input
                            type="text"
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            placeholder="e.g., Achimota School"
                            className={cn(
                              'w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20',
                              formErrors.schoolName ? 'border-red-300' : 'border-neutral-300'
                            )}
                          />
                        </div>
                        {formErrors.schoolName && <p className="text-red-500 text-xs mt-1">{formErrors.schoolName}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Subjects Taught
                        </label>
                        <div className="flex flex-wrap gap-2 p-3 border border-neutral-300 rounded-lg max-h-32 overflow-y-auto">
                          {subjects.map((subject) => (
                            <button
                              key={subject}
                              type="button"
                              onClick={() => toggleSubject(subject)}
                              className={cn(
                                'px-2.5 py-1 text-xs rounded-full border transition-all',
                                subjectsTaught.includes(subject)
                                  ? 'bg-primary text-white border-primary'
                                  : 'bg-white text-neutral-600 border-neutral-300 hover:border-primary'
                              )}
                            >
                              {subject}
                            </button>
                          ))}
                        </div>
                        {formErrors.subjectsTaught && <p className="text-red-500 text-xs mt-1">{formErrors.subjectsTaught}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Years of Teaching Experience
                        </label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                          <select
                            value={yearsExperience}
                            onChange={(e) => setYearsExperience(e.target.value)}
                            className={cn(
                              'w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-white',
                              formErrors.yearsExperience ? 'border-red-300' : 'border-neutral-300'
                            )}
                          >
                            <option value="">Select experience</option>
                            <option value="0-2">0-2 years</option>
                            <option value="3-5">3-5 years</option>
                            <option value="6-10">6-10 years</option>
                            <option value="11-20">11-20 years</option>
                            <option value="20+">20+ years</option>
                          </select>
                        </div>
                        {formErrors.yearsExperience && <p className="text-red-500 text-xs mt-1">{formErrors.yearsExperience}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Qualifications (Optional)
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                          <textarea
                            value={qualifications}
                            onChange={(e) => setQualifications(e.target.value)}
                            placeholder="e.g., B.Ed Mathematics, M.A Education"
                            rows={2}
                            className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Admin-specific fields */}
                  {selectedRole === 'admin' && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Admin Invitation Code
                      </label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type="text"
                          value={adminCode}
                          onChange={(e) => setAdminCode(e.target.value)}
                          placeholder="Enter your invitation code"
                          className={cn(
                            'w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20',
                            formErrors.adminCode ? 'border-red-300' : 'border-neutral-300'
                          )}
                        />
                      </div>
                      {formErrors.adminCode && <p className="text-red-500 text-xs mt-1">{formErrors.adminCode}</p>}
                      <p className="text-xs text-neutral-500 mt-1">Contact your school or Brilla support for an admin code</p>
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full py-3 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>

              {mode === 'login' && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-neutral-500">or try demo</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('student')}
                      className="flex flex-col items-center gap-1 p-3 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      <span className="text-xs font-medium">Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('teacher')}
                      className="flex flex-col items-center gap-1 p-3 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <BookOpen className="w-5 h-5 text-green-600" />
                      <span className="text-xs font-medium">Teacher</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('admin')}
                      className="flex flex-col items-center gap-1 p-3 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <Shield className="w-5 h-5 text-purple-600" />
                      <span className="text-xs font-medium">Admin</span>
                    </button>
                  </div>
                </>
              )}

              <div className="text-center pt-2">
                <p className="text-neutral-600 text-sm">
                  {mode === 'login' ? (
                    <>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => handleModeSwitch('register')}
                        className="text-primary font-medium hover:underline"
                      >
                        Sign Up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => handleModeSwitch('login')}
                        className="text-primary font-medium hover:underline"
                      >
                        Sign In
                      </button>
                    </>
                  )}
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

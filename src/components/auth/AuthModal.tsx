import { useState, useEffect } from 'react';
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
  Clock,
  CheckCircle2,
  Users,
  Phone,
  Crown,
  Globe,
  Ticket,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { cn } from '@/utils';
import { PlanSelectionStep } from './PlanSelectionStep';
import { Turnstile, useTurnstile } from '@/components/common/Turnstile';
import { ExamTypeSelector } from './ExamTypeSelector';
import { GoogleSignInButton } from './GoogleSignInButton';

type AuthMode = 'login' | 'register';
type UserRole = 'student' | 'teacher' | 'admin' | 'parent';
type SchoolLevel = 'jss' | 'shs' | 'international';
type RegistrationStatus = 'idle' | 'pending' | 'approved' | 'error';
type RegistrationStep = 'role' | 'schoolLevel' | 'plan' | 'form';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

interface FormErrors {
  [key: string]: string;
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { register, login, isLoading, clearError } = useAuthStore();
  const turnstile = useTurnstile();

  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Sync mode with initialMode when modal opens and reset form when closed
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Delay reset to avoid UI flicker during close animation
      const timer = setTimeout(() => {
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
        setPhoneNumber('');
        setParentInviteCode('');
        setSelectedExamTypes([]);
        setPrimaryExamType('');
        setFormErrors({});
        setSelectedRole(null);
        setSelectedTierId(null);
        setRegistrationStep('role');
        setRegistrationStatus('idle');
        setRegistrationMessage('');
        setShowPassword(false);
        setReferralCode('');
        setReferralValidation('idle');
        setReferralSchoolName(null);
        setInviteModeDetected(false);
        setShowCodeRequest(false);
        setCodeReqName('');
        setCodeReqContact('');
        setCodeReqSchool('');
        setCodeReqSubmitting(false);
        setCodeReqSuccess(false);
        setCodeReqError('');
        turnstile.reset();
        clearError();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, clearError, turnstile]);

  // Prefill the referral code from the ?ref= URL param — affiliate links
  // (/api/affiliates/ref/:code) land users on /register?ref=CODE, which
  // redirects here preserving the param.
  useEffect(() => {
    if (!isOpen) return;
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) {
      const code = ref.trim().toUpperCase();
      setReferralCode(code);
      validateReferralCode(code);
    }
  }, [isOpen]);

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('role');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>('idle');
  const [registrationMessage, setRegistrationMessage] = useState('');

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

  // Parent-specific fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [parentInviteCode, setParentInviteCode] = useState('');

  // Exam type preferences (for students and teachers)
  const [selectedExamTypes, setSelectedExamTypes] = useState<string[]>([]);
  const [primaryExamType, setPrimaryExamType] = useState('');

  // Referral / invite code (growth loop)
  const [referralCode, setReferralCode] = useState('');
  const [referralValidation, setReferralValidation] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [referralSchoolName, setReferralSchoolName] = useState<string | null>(null);
  // Set when the backend rejects a registration with data.codeRequired (invite mode)
  const [inviteModeDetected, setInviteModeDetected] = useState(false);
  // Inline "request a code" form
  const [showCodeRequest, setShowCodeRequest] = useState(false);
  const [codeReqName, setCodeReqName] = useState('');
  const [codeReqContact, setCodeReqContact] = useState('');
  const [codeReqSchool, setCodeReqSchool] = useState('');
  const [codeReqSubmitting, setCodeReqSubmitting] = useState(false);
  const [codeReqSuccess, setCodeReqSuccess] = useState(false);
  const [codeReqError, setCodeReqError] = useState('');

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
    setPhoneNumber('');
    setParentInviteCode('');
    setSelectedExamTypes([]);
    setPrimaryExamType('');
    setFormErrors({});
    setSelectedRole(null);
    setSelectedTierId(null);
    setRegistrationStep('role');
    setRegistrationStatus('idle');
    setRegistrationMessage('');
    setReferralCode('');
    setReferralValidation('idle');
    setReferralSchoolName(null);
    setInviteModeDetected(false);
    setShowCodeRequest(false);
    setCodeReqName('');
    setCodeReqContact('');
    setCodeReqSchool('');
    setCodeReqSubmitting(false);
    setCodeReqSuccess(false);
    setCodeReqError('');
    clearError();
  };

  // Handle role selection - students go to school level, teachers to plan, admin/parent to form
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'student') {
      setRegistrationStep('schoolLevel');
    } else if (role === 'teacher') {
      setRegistrationStep('plan');
    } else {
      // Admin and parent skip plan selection
      setRegistrationStep('form');
    }
  };

  // Handle school level selection for students
  const handleSchoolLevelSelect = (level: SchoolLevel) => {
    setSchoolLevel(level);
    setRegistrationStep('plan');
  };

  // Handle going back in the registration flow
  const handleRegistrationBack = () => {
    if (registrationStep === 'form') {
      if (selectedRole === 'student' || selectedRole === 'teacher') {
        setRegistrationStep('plan');
      } else {
        setSelectedRole(null);
        setRegistrationStep('role');
      }
    } else if (registrationStep === 'plan') {
      if (selectedRole === 'student') {
        // Students go back to school level selection
        setSelectedTierId(null);
        setRegistrationStep('schoolLevel');
      } else {
        // Teachers go back to role selection
        setSelectedRole(null);
        setSelectedTierId(null);
        setRegistrationStep('role');
      }
    } else if (registrationStep === 'schoolLevel') {
      setSelectedRole(null);
      setSchoolLevel('');
      setRegistrationStep('role');
    }
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    resetForm();
    turnstile.reset();
    setMode(newMode);
  };

  // Live-check a referral/invite code against the public validate endpoint.
  // Empty input skips the call and clears the state.
  const validateReferralCode = async (code: string) => {
    const clearReferralError = (prev: FormErrors): FormErrors => {
      if (!prev.referralCode) return prev;
      const next = { ...prev };
      delete next.referralCode;
      return next;
    };
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setReferralValidation('idle');
      setReferralSchoolName(null);
      setFormErrors(clearReferralError);
      return;
    }
    setReferralValidation('checking');
    setReferralSchoolName(null);
    const response = await api.get<{ valid: boolean; schoolName: string | null }>(
      `/affiliates/validate-code/${encodeURIComponent(trimmed)}`
    );
    if (response.success && response.data?.valid) {
      setReferralValidation('valid');
      setReferralSchoolName(response.data.schoolName);
      setFormErrors(clearReferralError);
    } else {
      setReferralValidation('invalid');
      setFormErrors(prev => ({
        ...prev,
        referralCode: response.success ? 'This code is not valid' : (response.error || 'Could not verify the code'),
      }));
    }
  };

  const handleCodeRequestSubmit = async () => {
    if (!codeReqName.trim() || !codeReqContact.trim()) {
      setCodeReqError('Name and contact are required');
      return;
    }
    setCodeReqSubmitting(true);
    setCodeReqError('');
    const response = await api.post('/referral-code-requests', {
      name: codeReqName.trim(),
      contact: codeReqContact.trim(),
      schoolName: codeReqSchool.trim() || undefined,
    });
    setCodeReqSubmitting(false);
    if (response.success) {
      setCodeReqSuccess(true);
    } else {
      // Rate-limit (429) and validation errors surface here
      setCodeReqError(response.error || 'Failed to submit request. Please try again.');
    }
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

      if (selectedRole === 'parent') {
        if (!phoneNumber.trim()) {
          errors.phoneNumber = 'Phone number is required';
        } else if (!/^(\+233|0)\d{9}$/.test(phoneNumber.replace(/\s/g, ''))) {
          errors.phoneNumber = 'Please enter a valid Ghanaian phone number';
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Verify Turnstile is completed
    if (!turnstile.isVerified || !turnstile.token) {
      setFormErrors({ submit: 'Please complete the security check.' });
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      if (mode === 'login') {
        // Store login authenticates against the API (surfaces account status errors)
        await login(email, password, turnstile.token);
        onClose();
      } else {
        // Register user - account will be pending until admin approves
        const result = await register({
          email,
          password,
          name,
          role: selectedRole!,
          schoolLevel: selectedRole === 'student' ? (schoolLevel as 'jss' | 'shs') : undefined,
          yearGroup: selectedRole === 'student' ? parseInt(yearGroup) : undefined,
          schoolName: schoolName || undefined,
          house: selectedRole === 'student' ? house || undefined : undefined,
          teacherLicenseNumber: selectedRole === 'teacher' ? teacherLicenseNumber : undefined,
          subjectsTaught: selectedRole === 'teacher' ? subjectsTaught : undefined,
          yearsExperience: selectedRole === 'teacher' ? yearsExperience : undefined,
          qualifications: selectedRole === 'teacher' ? qualifications : undefined,
          adminCode: selectedRole === 'admin' ? adminCode : undefined,
          phoneNumber: selectedRole === 'parent' ? phoneNumber : undefined,
          inviteCode: selectedRole === 'parent' && parentInviteCode ? parentInviteCode : undefined,
          selectedTierId: selectedTierId || undefined,
          turnstileToken: turnstile.token,
          // Include exam type preferences for students and teachers
          examTypeIds: (selectedRole === 'student' || selectedRole === 'teacher') && selectedExamTypes.length > 0
            ? selectedExamTypes
            : undefined,
          primaryExamTypeId: (selectedRole === 'student' || selectedRole === 'teacher') && primaryExamType
            ? primaryExamType
            : undefined,
          // Affiliate referral/invite code (trimmed, uppercased)
          referralCode: referralCode.trim() ? referralCode.trim().toUpperCase() : undefined,
        });

        // Invite-mode registrations are auto-approved: prompt login instead
        // of the pending-approval copy.
        if (result.status === 'approved') {
          setRegistrationStatus('approved');
        } else {
          setRegistrationStatus('pending');
        }
        setRegistrationMessage(result.message);
      }
    } catch (err) {
      if (mode === 'register') {
        setRegistrationStatus('error');
        // Invite mode: backend rejected with data.codeRequired — surface the
        // request-a-code form automatically (error text renders via formErrors.submit).
        const codeRequired =
          (err as { codeRequired?: boolean })?.codeRequired === true ||
          (err instanceof Error && /invite code is required/i.test(err.message));
        if (codeRequired) {
          setInviteModeDetected(true);
          setShowCodeRequest(true);
        }
      }
      setFormErrors({ submit: err instanceof Error ? err.message : 'An error occurred. Please try again.' });
      // Reset turnstile on error so user can try again
      turnstile.reset();
    } finally {
      setIsSubmitting(false);
    }
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

          {mode === 'register' && registrationStep !== 'role' && (
            <button
              onClick={handleRegistrationBack}
              className="absolute top-4 left-4 p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="text-center">
            <h2 className="text-xl font-bold">
              {mode === 'login'
                ? 'Welcome Back!'
                : registrationStep === 'role'
                  ? 'Create Account'
                  : registrationStep === 'plan'
                    ? 'Choose Your Plan'
                    : `Register as ${selectedRole?.charAt(0).toUpperCase()}${selectedRole?.slice(1)}`
              }
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {mode === 'login'
                ? 'Sign in to continue your learning journey'
                : registrationStep === 'role'
                  ? 'Choose how you want to join Brilla'
                  : registrationStep === 'plan'
                    ? 'Select a plan that works for you'
                    : 'Complete your registration'
              }
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {registrationStatus === 'approved' ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900">Your account is ready — log in</h3>
              <p className="text-neutral-600 mt-3 max-w-sm mx-auto">
                {registrationMessage}
              </p>

              <button
                onClick={() => handleModeSwitch('login')}
                className="mt-6 px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Sign In
              </button>
            </div>
          ) : registrationStatus === 'pending' ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900">Registration Submitted!</h3>
              <p className="text-neutral-600 mt-3 max-w-sm mx-auto">
                {registrationMessage}
              </p>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-700 space-y-2 text-left">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>An administrator will review your application</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>You'll receive a notification once approved</span>
                  </li>
                  {selectedTierId && selectedTierId !== 'tier_free' ? (
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Your 14-day free trial starts automatically upon approval</span>
                    </li>
                  ) : (
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Then you can log in and start learning!</span>
                    </li>
                  )}
                </ul>
              </div>

              <button
                onClick={onClose}
                className="mt-6 px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Got it, thanks!
              </button>
            </div>
          ) : mode === 'register' && registrationStep === 'role' ? (
            // Role Selection
            <div className="space-y-4">
              <p className="text-center text-neutral-600 mb-4">I am a...</p>

              <button
                onClick={() => handleRoleSelect('student')}
                className="w-full flex items-center gap-4 p-4 border-2 border-neutral-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-neutral-900">Student</h3>
                  <p className="text-sm text-neutral-500">JSS or SHS student preparing for exams</p>
                </div>
                <div className="text-xs text-primary font-medium flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Premium available
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('teacher')}
                className="w-full flex items-center gap-4 p-4 border-2 border-neutral-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-neutral-900">Teacher</h3>
                  <p className="text-sm text-neutral-500">Educator with GES registration</p>
                </div>
                <div className="text-xs text-primary font-medium flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Premium available
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('admin')}
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

              <button
                onClick={() => handleRoleSelect('parent')}
                className="w-full flex items-center gap-4 p-4 border-2 border-neutral-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <Users className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-neutral-900">Parent/Guardian</h3>
                  <p className="text-sm text-neutral-500">Monitor your ward's learning progress</p>
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
          ) : mode === 'register' && registrationStep === 'schoolLevel' && selectedRole === 'student' ? (
            // School Level Selection for Students
            <div className="space-y-4">
              <button
                onClick={handleRegistrationBack}
                className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">What's your school level?</h3>
                <p className="text-sm text-neutral-500 mt-1">This helps us show you the right content</p>
              </div>

              <button
                onClick={() => handleSchoolLevelSelect('jss')}
                className="w-full flex items-center gap-4 p-4 border-2 border-neutral-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <School className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-neutral-900">Junior High School (JHS)</h3>
                  <p className="text-sm text-neutral-500">JHS 1, JHS 2, or JHS 3 student</p>
                </div>
              </button>

              <button
                onClick={() => handleSchoolLevelSelect('shs')}
                className="w-full flex items-center gap-4 p-4 border-2 border-neutral-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <GraduationCap className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-neutral-900">Senior High School (SHS)</h3>
                  <p className="text-sm text-neutral-500">SHS 1, SHS 2, or SHS 3 student</p>
                </div>
              </button>

              <button
                onClick={() => handleSchoolLevelSelect('international')}
                className="w-full flex items-center gap-4 p-4 border-2 border-neutral-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-neutral-900">International School</h3>
                  <p className="text-sm text-neutral-500">Cambridge IGCSE or A-Level student</p>
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
          ) : mode === 'register' && registrationStep === 'plan' && selectedRole && (selectedRole === 'student' || selectedRole === 'teacher') ? (
            // Plan Selection Step
            <PlanSelectionStep
              role={selectedRole}
              selectedTierId={selectedTierId}
              onSelectTier={setSelectedTierId}
              onBack={handleRegistrationBack}
              onContinue={() => setRegistrationStep('form')}
            />
          ) : (
            // Login or Registration Form
            <form onSubmit={handleSubmit} className="space-y-4">
              {formErrors.submit && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formErrors.submit}
                </div>
              )}

              {/* Google Sign-In/Sign-Up Button */}
              {mode === 'login' && (
                <>
                  <GoogleSignInButton
                    mode="login"
                    onError={(error) => setFormErrors({ submit: error })}
                    disabled={isLoading}
                  />
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-white text-neutral-500">or continue with email</span>
                    </div>
                  </div>
                </>
              )}

              {/* Google Sign-Up for Registration (after role selection).
                  Hidden once the backend tells us invite mode is on — Google
                  registration would hit the same codeRequired rejection. */}
              {mode === 'register' && selectedRole && selectedRole !== 'admin' && !inviteModeDetected && (
                <>
                  <GoogleSignInButton
                    mode="register"
                    role={selectedRole}
                    registrationData={
                      selectedRole === 'student' && schoolLevel
                        ? { schoolLevel, ...(referralCode.trim() ? { referralCode: referralCode.trim().toUpperCase() } : {}) }
                        : referralCode.trim()
                          ? { referralCode: referralCode.trim().toUpperCase() }
                          : undefined
                    }
                    onError={(error) => {
                      setFormErrors({ submit: error });
                      if (/invite code is required/i.test(error)) {
                        setInviteModeDetected(true);
                        setShowCodeRequest(true);
                      }
                    }}
                    disabled={isLoading}
                  />
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-white text-neutral-500">or register with email</span>
                    </div>
                  </div>
                </>
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

                  {/* Referral / Invite Code (growth loop) */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Referral / Invite Code
                    </label>
                    <div className="relative">
                      <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="text"
                        value={referralCode}
                        onChange={(e) => {
                          setReferralCode(e.target.value.toUpperCase());
                          setReferralValidation('idle');
                          setReferralSchoolName(null);
                        }}
                        onBlur={() => validateReferralCode(referralCode)}
                        placeholder="Enter your invite code"
                        className={cn(
                          'w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase',
                          formErrors.referralCode
                            ? 'border-red-300'
                            : referralValidation === 'valid'
                              ? 'border-green-400'
                              : 'border-neutral-300'
                        )}
                      />
                      {referralValidation === 'checking' && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 animate-spin" />
                      )}
                      {referralValidation === 'valid' && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                      )}
                    </div>
                    {formErrors.referralCode && <p className="text-red-500 text-xs mt-1">{formErrors.referralCode}</p>}
                    {referralValidation === 'valid' && (
                      <p className="text-green-600 text-xs mt-1">
                        Code verified{referralSchoolName ? ` — ${referralSchoolName}` : ''}
                      </p>
                    )}
                    {!showCodeRequest && (
                      <button
                        type="button"
                        onClick={() => setShowCodeRequest(true)}
                        className="text-primary text-xs font-medium mt-1 hover:underline"
                      >
                        Don't have a code? Request one
                      </button>
                    )}
                    {showCodeRequest && (
                      <div className="mt-2 p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
                        {codeReqSuccess ? (
                          <p className="text-sm text-green-700 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            We'll review your request and send a code.
                          </p>
                        ) : (
                          <>
                            <p className="text-xs font-medium text-neutral-700">Request an invite code</p>
                            <input
                              type="text"
                              value={codeReqName}
                              onChange={(e) => setCodeReqName(e.target.value)}
                              placeholder="Your name"
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <input
                              type="text"
                              value={codeReqContact}
                              onChange={(e) => setCodeReqContact(e.target.value)}
                              placeholder="Email or phone number"
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <input
                              type="text"
                              value={codeReqSchool}
                              onChange={(e) => setCodeReqSchool(e.target.value)}
                              placeholder="School name (optional)"
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            {codeReqError && <p className="text-red-500 text-xs">{codeReqError}</p>}
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={handleCodeRequestSubmit}
                                disabled={codeReqSubmitting}
                                className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {codeReqSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                                Submit Request
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowCodeRequest(false)}
                                className="text-neutral-600 text-xs hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Student-specific fields */}
                  {selectedRole === 'student' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          School Level
                        </label>
                        <div className="grid grid-cols-3 gap-2">
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
                            <span className="font-medium text-sm">JHS</span>
                            <span className="block text-xs text-neutral-500">Junior High</span>
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
                            <span className="font-medium text-sm">SHS</span>
                            <span className="block text-xs text-neutral-500">Senior High</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSchoolLevel('international'); setYearGroup(''); }}
                            className={cn(
                              'p-3 border-2 rounded-lg text-center transition-all',
                              schoolLevel === 'international'
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-neutral-200 hover:border-neutral-300'
                            )}
                          >
                            <span className="font-medium text-sm">Int'l</span>
                            <span className="block text-xs text-neutral-500">IGCSE/A-Level</span>
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
                              ) : schoolLevel === 'shs' ? (
                                <>
                                  <option value="1">Year 1 (SHS 1)</option>
                                  <option value="2">Year 2 (SHS 2)</option>
                                  <option value="3">Year 3 (SHS 3)</option>
                                </>
                              ) : (
                                <>
                                  <option value="10">Year 10 (IGCSE)</option>
                                  <option value="11">Year 11 (IGCSE)</option>
                                  <option value="12">Year 12 (A-Level AS)</option>
                                  <option value="13">Year 13 (A-Level A2)</option>
                                </>
                              )}
                            </select>
                          </div>
                          {formErrors.yearGroup && <p className="text-red-500 text-xs mt-1">{formErrors.yearGroup}</p>}
                        </div>
                      )}

                      {/* Exam Type Selection */}
                      {schoolLevel && (
                        <ExamTypeSelector
                          schoolLevel={schoolLevel === 'jss' ? 'jhs' : schoolLevel === 'shs' ? 'shs' : 'international'}
                          selectedExamTypes={selectedExamTypes}
                          primaryExamType={primaryExamType}
                          onChange={(examTypeIds, primaryId) => {
                            setSelectedExamTypes(examTypeIds);
                            setPrimaryExamType(primaryId);
                          }}
                          error={formErrors.examTypes}
                        />
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

                      {/* Exam Types Taught */}
                      <ExamTypeSelector
                        schoolLevel="shs"
                        selectedExamTypes={selectedExamTypes}
                        primaryExamType={primaryExamType}
                        onChange={(examTypeIds, primaryId) => {
                          setSelectedExamTypes(examTypeIds);
                          setPrimaryExamType(primaryId);
                        }}
                        isTeacher={true}
                        error={formErrors.examTypes}
                      />
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

                  {/* Parent-specific fields */}
                  {selectedRole === 'parent' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="e.g., 0244123456 or +233244123456"
                            className={cn(
                              'w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20',
                              formErrors.phoneNumber ? 'border-red-300' : 'border-neutral-300'
                            )}
                          />
                        </div>
                        {formErrors.phoneNumber && <p className="text-red-500 text-xs mt-1">{formErrors.phoneNumber}</p>}
                        <p className="text-xs text-neutral-500 mt-1">We'll use this for important notifications about your ward</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Student Invite Code (Optional)
                        </label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                          <input
                            type="text"
                            value={parentInviteCode}
                            onChange={(e) => setParentInviteCode(e.target.value.toUpperCase())}
                            placeholder="e.g., ABC123"
                            maxLength={6}
                            className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase"
                          />
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          If your child gave you an invite code, enter it here. You can also add it later from settings.
                        </p>
                      </div>

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                          <strong>How it works:</strong> Your child generates an invite code from their account.
                          Once linked, you can view their learning progress, achievements, and study activity.
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Turnstile Security Check */}
              <div className="flex justify-center">
                <Turnstile
                  onVerify={turnstile.handleVerify}
                  onError={turnstile.handleError}
                  onExpire={turnstile.handleExpire}
                  theme="light"
                  size="normal"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading || !turnstile.isVerified}
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

import { useState, useEffect } from 'react';
import {
  X,
  Mail,
  User,
  Users,
  GraduationCap,
  BookOpen,
  Shield,
  School,
  BadgeCheck,
  Calendar,
  Briefcase,
  FileText,
  Loader2,
  Save,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  MailCheck,
} from 'lucide-react';
import { useAuthStore, type ManagedUser } from '@/stores/authStore';
import { cn } from '@/utils';
import type { SchoolLevel } from '@/types';
import { ExamTypeSelector } from '@/components/auth/ExamTypeSelector';
import { examService } from '@/services/api';

interface EditUserModalProps {
  isOpen: boolean;
  user: ManagedUser | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormErrors {
  [key: string]: string;
}

export function EditUserModal({ isOpen, user, onClose, onSuccess }: EditUserModalProps) {
  const { updateUser, resendVerificationEmail } = useAuthStore();

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel | ''>('');
  const [yearGroup, setYearGroup] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [house, setHouse] = useState('');
  const [teacherLicenseNumber, setTeacherLicenseNumber] = useState('');
  const [subjectsTaught, setSubjectsTaught] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState('');
  const [qualifications, setQualifications] = useState('');

  // Exam type preferences (for students and teachers)
  const [selectedExamTypes, setSelectedExamTypes] = useState<string[]>([]);
  const [primaryExamType, setPrimaryExamType] = useState('');
  const [isLoadingExamPrefs, setIsLoadingExamPrefs] = useState(false);

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setSchoolLevel((user.schoolLevel as SchoolLevel) || '');
      setYearGroup(user.yearGroup?.toString() || '');
      setSchoolName(user.schoolName || '');
      setHouse(user.house || '');
      setTeacherLicenseNumber(user.teacherLicenseNumber || '');
      setSubjectsTaught(user.subjectsTaught || []);
      setYearsExperience(user.yearsExperience || '');
      setQualifications(user.qualifications || '');
      setFormErrors({});
      setSuccessMessage('');

      // Load exam preferences for students and teachers
      if (user.role === 'student' || user.role === 'teacher') {
        setIsLoadingExamPrefs(true);
        examService.getUserExamPreferences(user.id)
          .then((data) => {
            const examTypeIds = data.preferences.map(p => p.examTypeId);
            setSelectedExamTypes(examTypeIds);
            setPrimaryExamType(data.primaryExamTypeId || examTypeIds[0] || '');
          })
          .catch((err) => {
            console.error('Failed to load exam preferences:', err);
            // Set defaults if loading fails
            setSelectedExamTypes([]);
            setPrimaryExamType('');
          })
          .finally(() => setIsLoadingExamPrefs(false));
      } else {
        setSelectedExamTypes([]);
        setPrimaryExamType('');
      }
    }
  }, [user]);

  const handleClose = () => {
    setFormErrors({});
    setSuccessMessage('');
    onClose();
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Role-specific validation
    if (user?.role === 'student') {
      if (!schoolLevel) {
        errors.schoolLevel = 'Please select school level';
      }
      if (!yearGroup) {
        errors.yearGroup = 'Please select year/form';
      }
    }

    if (user?.role === 'teacher') {
      if (!schoolName.trim()) {
        errors.schoolName = 'School name is required';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) return;

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const updates: Partial<ManagedUser> = {
        name,
        email,
        schoolName: schoolName || undefined,
      };

      if (user.role === 'student') {
        updates.schoolLevel = schoolLevel as SchoolLevel;
        updates.yearGroup = parseInt(yearGroup);
        updates.house = house || undefined;
      }

      if (user.role === 'teacher') {
        updates.teacherLicenseNumber = teacherLicenseNumber || undefined;
        updates.subjectsTaught = subjectsTaught.length > 0 ? subjectsTaught : undefined;
        updates.yearsExperience = yearsExperience || undefined;
        updates.qualifications = qualifications || undefined;
      }

      await updateUser(user.id, updates);

      // Update exam preferences for students and teachers
      if ((user.role === 'student' || user.role === 'teacher') && selectedExamTypes.length > 0) {
        await examService.setUserExamPreferences(user.id, {
          examTypeIds: selectedExamTypes,
          primaryExamTypeId: primaryExamType || selectedExamTypes[0],
        });
      }

      setSuccessMessage('User updated successfully!');

      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : 'Failed to update user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;

    setIsResendingEmail(true);
    try {
      await resendVerificationEmail(user.id);
      setSuccessMessage('Verification email sent successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setFormErrors({ resend: err instanceof Error ? err.message : 'Failed to send email' });
    } finally {
      setIsResendingEmail(false);
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

  const getRoleBadge = () => {
    if (!user) return null;
    const badges = {
      student: { icon: GraduationCap, color: 'bg-blue-100 text-blue-700', label: 'Student' },
      teacher: { icon: BookOpen, color: 'bg-green-100 text-green-700', label: 'Teacher' },
      admin: { icon: Shield, color: 'bg-purple-100 text-purple-700', label: 'Administrator' },
      parent: { icon: Users, color: 'bg-amber-100 text-amber-700', label: 'Parent' },
    };
    const badge = badges[user.role];
    const Icon = badge.icon;
    return (
      <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium', badge.color)}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">Edit User</h2>
              <p className="text-white/80 text-sm">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {successMessage && !formErrors.submit ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {successMessage}
            </div>
          ) : null}

          {/* User Status Info */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
            {getRoleBadge()}
            <div className="flex items-center gap-2 text-sm">
              {user.emailVerified ? (
                <span className="flex items-center gap-1 text-green-600">
                  <MailCheck className="w-4 h-4" />
                  Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  Pending Setup
                </span>
              )}
            </div>
          </div>

          {/* Resend Verification (if not verified) */}
          {!user.passwordSet && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-amber-800">Password Not Set</p>
                  <p className="text-xs text-amber-600 mt-1">
                    This user hasn't set their password yet. You can resend the verification email.
                  </p>
                </div>
                <button
                  onClick={handleResendVerification}
                  disabled={isResendingEmail}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {isResendingEmail ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Resend
                </button>
              </div>
              {formErrors.resend && (
                <p className="text-red-500 text-xs mt-2">{formErrors.resend}</p>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {formErrors.submit && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formErrors.submit}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                    formErrors.name ? 'border-red-300' : 'border-neutral-300'
                  )}
                />
              </div>
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                    formErrors.email ? 'border-red-300' : 'border-neutral-300'
                  )}
                />
              </div>
              {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
            </div>

            {/* Student-specific fields */}
            {user.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    School Level *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => { setSchoolLevel('jss'); setYearGroup(''); }}
                      className={cn(
                        'p-3 border-2 rounded-lg text-center transition-all',
                        schoolLevel === 'jss'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-neutral-200 hover:border-neutral-300'
                      )}
                    >
                      <span className="font-medium">JHS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSchoolLevel('shs'); setYearGroup(''); }}
                      className={cn(
                        'p-3 border-2 rounded-lg text-center transition-all',
                        schoolLevel === 'shs'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-neutral-200 hover:border-neutral-300'
                      )}
                    >
                      <span className="font-medium">SHS</span>
                    </button>
                  </div>
                  {formErrors.schoolLevel && <p className="text-red-500 text-xs mt-1">{formErrors.schoolLevel}</p>}
                </div>

                {schoolLevel && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      {schoolLevel === 'jss' ? 'Form' : 'Year'} *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <select
                        value={yearGroup}
                        onChange={(e) => setYearGroup(e.target.value)}
                        className={cn(
                          'w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none bg-white',
                          formErrors.yearGroup ? 'border-red-300' : 'border-neutral-300'
                        )}
                      >
                        <option value="">Select {schoolLevel === 'jss' ? 'Form' : 'Year'}</option>
                        {[1, 2, 3].map(n => (
                          <option key={n} value={n}>
                            {schoolLevel === 'jss' ? `Form ${n}` : `Year ${n}`}
                          </option>
                        ))}
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
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    House
                  </label>
                  <select
                    value={house}
                    onChange={(e) => setHouse(e.target.value)}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none bg-white"
                  >
                    <option value="">Select House</option>
                    <option value="Blue House">Blue House</option>
                    <option value="Red House">Red House</option>
                    <option value="Green House">Green House</option>
                    <option value="Yellow House">Yellow House</option>
                  </select>
                </div>

                {/* Exam Type Preferences */}
                <div className="pt-4 border-t border-neutral-100">
                  {isLoadingExamPrefs ? (
                    <div className="flex items-center gap-2 text-neutral-500 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading exam preferences...
                    </div>
                  ) : (
                    <ExamTypeSelector
                      schoolLevel={schoolLevel === 'jss' ? 'jhs' : 'shs'}
                      selectedExamTypes={selectedExamTypes}
                      primaryExamType={primaryExamType}
                      onChange={(examTypeIds, primaryId) => {
                        setSelectedExamTypes(examTypeIds);
                        setPrimaryExamType(primaryId);
                      }}
                      allowAll={true}
                      error={formErrors.examTypes}
                    />
                  )}
                </div>
              </>
            )}

            {/* Teacher-specific fields */}
            {user.role === 'teacher' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    School Name *
                  </label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g., Achimota School"
                      className={cn(
                        'w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                        formErrors.schoolName ? 'border-red-300' : 'border-neutral-300'
                      )}
                    />
                  </div>
                  {formErrors.schoolName && <p className="text-red-500 text-xs mt-1">{formErrors.schoolName}</p>}
                </div>

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
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Subjects Taught
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 border border-neutral-300 rounded-lg max-h-28 overflow-y-auto">
                    {subjects.map((subject) => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => toggleSubject(subject)}
                        className={cn(
                          'px-2.5 py-1 text-xs rounded-full border transition-all',
                          subjectsTaught.includes(subject)
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-neutral-600 border-neutral-300 hover:border-green-500'
                        )}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Years of Experience
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <select
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none bg-white"
                    >
                      <option value="">Select experience</option>
                      <option value="0-2">0-2 years</option>
                      <option value="3-5">3-5 years</option>
                      <option value="6-10">6-10 years</option>
                      <option value="11-20">11-20 years</option>
                      <option value="20+">20+ years</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Qualifications
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                    <textarea
                      value={qualifications}
                      onChange={(e) => setQualifications(e.target.value)}
                      placeholder="e.g., B.Ed Mathematics, M.A Education"
                      rows={2}
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    />
                  </div>
                </div>

                {/* Exam Types Taught */}
                <div className="pt-4 border-t border-neutral-100">
                  {isLoadingExamPrefs ? (
                    <div className="flex items-center gap-2 text-neutral-500 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading exam preferences...
                    </div>
                  ) : (
                    <ExamTypeSelector
                      schoolLevel="shs"
                      selectedExamTypes={selectedExamTypes}
                      primaryExamType={primaryExamType}
                      onChange={(examTypeIds, primaryId) => {
                        setSelectedExamTypes(examTypeIds);
                        setPrimaryExamType(primaryId);
                      }}
                      isTeacher={true}
                      allowAll={true}
                      error={formErrors.examTypes}
                    />
                  )}
                </div>
              </>
            )}

            {/* Admin notice */}
            {user.role === 'admin' && (
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-800">Administrator Account</p>
                    <p className="text-xs text-purple-600 mt-1">
                      This user has full administrative access to the platform.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

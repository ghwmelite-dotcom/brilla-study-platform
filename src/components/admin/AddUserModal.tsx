import { useState } from 'react';
import {
  X,
  Mail,
  User,
  GraduationCap,
  BookOpen,
  Shield,
  School,
  BadgeCheck,
  Calendar,
  Briefcase,
  FileText,
  Loader2,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore, type CreateUserData } from '@/stores/authStore';
import { cn } from '@/utils';
import type { SchoolLevel } from '@/types';

type UserRole = 'student' | 'teacher' | 'admin';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormErrors {
  [key: string]: string;
}

export function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const { createUser } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Common fields
  const [email, setEmail] = useState('');
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

  const resetForm = () => {
    setEmail('');
    setName('');
    setSchoolLevel('');
    setYearGroup('');
    setSchoolName('');
    setHouse('');
    setTeacherLicenseNumber('');
    setSubjectsTaught([]);
    setYearsExperience('');
    setQualifications('');
    setFormErrors({});
    setSelectedRole(null);
    setSuccessMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!selectedRole) {
      errors.role = 'Please select a role';
      setFormErrors(errors);
      return false;
    }

    // Role-specific validation
    if (selectedRole === 'student') {
      if (!schoolLevel) {
        errors.schoolLevel = 'Please select school level';
      }
      if (!yearGroup) {
        errors.yearGroup = 'Please select year/form';
      }
    }

    if (selectedRole === 'teacher') {
      if (!schoolName.trim()) {
        errors.schoolName = 'School name is required';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const userData: CreateUserData = {
        email,
        name,
        role: selectedRole!,
        schoolLevel: selectedRole === 'student' ? (schoolLevel as SchoolLevel) : undefined,
        yearGroup: selectedRole === 'student' ? parseInt(yearGroup) : undefined,
        schoolName: schoolName || undefined,
        house: selectedRole === 'student' ? house || undefined : undefined,
        teacherLicenseNumber: selectedRole === 'teacher' ? teacherLicenseNumber : undefined,
        subjectsTaught: selectedRole === 'teacher' ? subjectsTaught : undefined,
        yearsExperience: selectedRole === 'teacher' ? yearsExperience : undefined,
        qualifications: selectedRole === 'teacher' ? qualifications : undefined,
      };

      await createUser(userData);
      setSuccessMessage(`${name} has been added as a ${selectedRole}!`);

      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : 'Failed to create user' });
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
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Add New User</h2>
              <p className="text-white/80 text-sm">Create a user account directly</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {successMessage ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">User Created!</h3>
              <p className="text-neutral-600 mt-2">{successMessage}</p>
            </div>
          ) : !selectedRole ? (
            // Role Selection
            <div className="space-y-4">
              <p className="text-center text-neutral-600 mb-6">What type of user?</p>

              <button
                onClick={() => setSelectedRole('student')}
                className="w-full flex items-center gap-4 p-4 border-2 border-neutral-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-neutral-900">Student</h3>
                  <p className="text-sm text-neutral-500">JHS or SHS student</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedRole('teacher')}
                className="w-full flex items-center gap-4 p-4 border-2 border-neutral-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-neutral-900">Teacher</h3>
                  <p className="text-sm text-neutral-500">Educator account</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedRole('admin')}
                className="w-full flex items-center gap-4 p-4 border-2 border-neutral-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-neutral-900">Administrator</h3>
                  <p className="text-sm text-neutral-500">Full platform access</p>
                </div>
              </button>
            </div>
          ) : (
            // User Form
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Back button */}
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="text-sm text-neutral-500 hover:text-neutral-700 mb-2"
              >
                ← Change role
              </button>

              {/* Role badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  selectedRole === 'student' ? 'bg-blue-100 text-blue-700' :
                  selectedRole === 'teacher' ? 'bg-green-100 text-green-700' :
                  'bg-purple-100 text-purple-700'
                )}>
                  {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                </span>
              </div>

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
                      'w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20',
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
                      'w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20',
                      formErrors.email ? 'border-red-300' : 'border-neutral-300'
                    )}
                  />
                </div>
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>

              {/* Student-specific fields */}
              {selectedRole === 'student' && (
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
                            'w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none bg-white',
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
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none bg-white"
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
                          'w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20',
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
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none bg-white"
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
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Admin notice */}
              {selectedRole === 'admin' && (
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                  <p className="text-sm text-purple-700">
                    <strong>Note:</strong> This user will have full administrative access to the platform,
                    including user management and content moderation.
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating user...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create User
                  </>
                )}
              </button>

              <p className="text-xs text-neutral-500 text-center mt-2">
                The user will be able to log in with password: <code className="bg-neutral-100 px-1 rounded">password123</code>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

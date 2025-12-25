import { useState, useEffect } from 'react';
import {
  Save,
  Loader2,
  Camera,
  Video,
  MessageCircle,
  PenTool,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import { useTutoringStore } from '@/stores/tutoringStore';
import { useAuthStore } from '@/stores';
import type { SessionType } from '@/types/tutoring';

const sessionTypeConfig: Record<SessionType, { icon: React.ReactNode; label: string; description: string }> = {
  video: {
    icon: <Video className="w-5 h-5" />,
    label: 'Video Call',
    description: 'Live video sessions with screen sharing',
  },
  chat: {
    icon: <MessageCircle className="w-5 h-5" />,
    label: 'Chat',
    description: 'Text-based tutoring sessions',
  },
  whiteboard: {
    icon: <PenTool className="w-5 h-5" />,
    label: 'Whiteboard',
    description: 'Interactive whiteboard sessions',
  },
};

const availableDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Mock subjects - in production, fetch from API
const availableLevels: Array<{ value: 'beginner' | 'intermediate' | 'advanced'; label: string }> = [
  { value: 'beginner', label: 'Beginner (JHS/BECE)' },
  { value: 'intermediate', label: 'Intermediate (SHS 1-2)' },
  { value: 'advanced', label: 'Advanced (SHS 3/WASSCE)' },
];

const availableSubjects = [
  { id: 'math', name: 'Mathematics' },
  { id: 'english', name: 'English Language' },
  { id: 'science', name: 'Integrated Science' },
  { id: 'social', name: 'Social Studies' },
  { id: 'physics', name: 'Physics' },
  { id: 'chemistry', name: 'Chemistry' },
  { id: 'biology', name: 'Biology' },
  { id: 'elective-math', name: 'Elective Mathematics' },
];

interface SubjectSelection {
  subjectId: string;
  subjectName: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export default function TeacherDirectorySetup() {
  const { user } = useAuthStore();
  const { myProfile, isLoadingMyProfile, loadMyProfile, updateMyProfile, submitProfileForApproval } = useTutoringStore();
  const isLoading = isLoadingMyProfile;

  // Simple availability format for the form (will be converted when saving)
  type SimpleAvailability = Record<string, string>;

  const [formData, setFormData] = useState({
    displayName: '',
    tagline: '',
    bio: '',
    profilePhotoUrl: '',
    hourlyRate: 50,
    sessionTypes: [] as SessionType[],
    subjects: [] as SubjectSelection[],
    availability: {} as SimpleAvailability,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // New subject form
  const [newSubject, setNewSubject] = useState<{ subjectId: string; level: 'beginner' | 'intermediate' | 'advanced' | '' }>({ subjectId: '', level: '' });

  useEffect(() => {
    loadMyProfile();
  }, [loadMyProfile]);

  useEffect(() => {
    if (myProfile) {
      // Convert WeeklyAvailability to simple string format for the form
      const simpleAvailability: SimpleAvailability = {};
      if (myProfile.availability) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
        days.forEach(day => {
          const slots = myProfile.availability?.[day];
          if (slots && slots.length > 0) {
            simpleAvailability[day] = slots.map(s => `${s.start} - ${s.end}`).join(', ');
          }
        });
      }

      setFormData({
        displayName: myProfile.displayName || user?.name || '',
        tagline: myProfile.tagline || '',
        bio: myProfile.bio || '',
        profilePhotoUrl: myProfile.profilePhotoUrl || '',
        hourlyRate: myProfile.hourlyRate || 50,
        sessionTypes: myProfile.sessionTypes || [],
        subjects: myProfile.subjects || [],
        availability: simpleAvailability,
      });
    } else if (user) {
      setFormData((prev) => ({
        ...prev,
        displayName: user.name || '',
      }));
    }
  }, [myProfile, user]);

  const handleSessionTypeToggle = (type: SessionType) => {
    setFormData((prev) => ({
      ...prev,
      sessionTypes: prev.sessionTypes.includes(type)
        ? prev.sessionTypes.filter((t) => t !== type)
        : [...prev.sessionTypes, type],
    }));
  };

  const handleAddSubject = () => {
    if (!newSubject.subjectId || !newSubject.level) return;

    const subject = availableSubjects.find((s) => s.id === newSubject.subjectId);
    if (!subject) return;

    const level = newSubject.level as 'beginner' | 'intermediate' | 'advanced';

    // Check if already added
    const exists = formData.subjects.some(
      (s) => s.subjectId === newSubject.subjectId && s.level === level
    );
    if (exists) return;

    setFormData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { subjectId: newSubject.subjectId, subjectName: subject.name, level }],
    }));
    setNewSubject({ subjectId: '', level: '' });
  };

  const handleRemoveSubject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  };

  const handleAvailabilityChange = (day: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      availability: { ...prev.availability, [day]: value },
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.displayName.trim()) return 'Display name is required';
    if (formData.sessionTypes.length === 0) return 'Select at least one session type';
    if (formData.subjects.length === 0) return 'Add at least one subject';
    if (formData.hourlyRate < 10) return 'Hourly rate must be at least GH₵10';
    return null;
  };

  const handleSave = async () => {
    setSaveError('');
    setSaveSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      await updateMyProfile(formData);
      setSaveSuccess('Profile saved successfully');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setSaveError('');

    const validationError = validateForm();
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    if (!formData.bio?.trim()) {
      setSaveError('Please add a bio before submitting for approval');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateMyProfile(formData);
      await submitProfileForApproval();
      setSaveSuccess('Profile submitted for approval! You will be notified once reviewed.');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to submit profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !myProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Tutor Profile Setup</h1>
          <p className="text-neutral-600 mt-1">
            Create your tutor profile to appear in the public directory and receive tutoring requests.
          </p>
        </div>

        {/* Status Banner */}
        {myProfile && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            myProfile.directoryStatus === 'approved'
              ? 'bg-green-50 border border-green-200'
              : myProfile.directoryStatus === 'pending'
              ? 'bg-amber-50 border border-amber-200'
              : myProfile.directoryStatus === 'rejected'
              ? 'bg-red-50 border border-red-200'
              : 'bg-neutral-50 border border-neutral-200'
          }`}>
            {myProfile.directoryStatus === 'approved' ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Profile Approved</p>
                  <p className="text-sm text-green-700">Your profile is visible in the tutor directory.</p>
                </div>
                <a
                  href={`/tutors/${myProfile.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 text-sm text-green-700 hover:text-green-900"
                >
                  <Eye className="w-4 h-4" />
                  View Profile
                </a>
              </>
            ) : myProfile.directoryStatus === 'pending' ? (
              <>
                <Clock className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900">Pending Approval</p>
                  <p className="text-sm text-amber-700">Your profile is being reviewed by our team.</p>
                </div>
              </>
            ) : myProfile.directoryStatus === 'rejected' ? (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Profile Rejected</p>
                  <p className="text-sm text-red-700">{myProfile.rejectionReason || 'Please update your profile and resubmit.'}</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-neutral-500" />
                <div>
                  <p className="font-medium text-neutral-900">Draft Profile</p>
                  <p className="text-sm text-neutral-600">Complete your profile and submit for approval.</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-8">
          {/* Basic Info */}
          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Basic Information</h2>

            {/* Profile Photo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Profile Photo</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-neutral-100 overflow-hidden">
                  {formData.profilePhotoUrl ? (
                    <img src={formData.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="url"
                    placeholder="Enter image URL"
                    value={formData.profilePhotoUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, profilePhotoUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Enter a URL to your profile photo</p>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
                placeholder="How students will see your name"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Tagline */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData((prev) => ({ ...prev, tagline: e.target.value }))}
                placeholder="e.g., &quot;Experienced Math Teacher with 10+ years&quot;"
                maxLength={100}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-neutral-500 mt-1">{formData.tagline.length}/100 characters</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell students about your teaching experience, qualifications, and teaching style..."
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </section>

          {/* Session Types */}
          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Session Types <span className="text-red-500">*</span>
            </h2>
            <p className="text-sm text-neutral-600 mb-4">Select the types of tutoring sessions you offer.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(sessionTypeConfig) as SessionType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleSessionTypeToggle(type)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    formData.sessionTypes.includes(type)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className={`mb-2 ${formData.sessionTypes.includes(type) ? 'text-blue-600' : 'text-neutral-400'}`}>
                    {sessionTypeConfig[type].icon}
                  </div>
                  <p className="font-medium text-neutral-900">{sessionTypeConfig[type].label}</p>
                  <p className="text-xs text-neutral-500 mt-1">{sessionTypeConfig[type].description}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Subjects */}
          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Subjects <span className="text-red-500">*</span>
            </h2>

            {/* Current subjects */}
            {formData.subjects.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {formData.subjects.map((subject, index) => (
                  <span
                    key={`${subject.subjectId}-${subject.level}`}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    {subject.subjectName} ({subject.level})
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(index)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add subject */}
            <div className="flex gap-2">
              <select
                value={newSubject.subjectId}
                onChange={(e) => setNewSubject({ subjectId: e.target.value, level: '' })}
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Subject</option>
                {availableSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <select
                value={newSubject.level}
                onChange={(e) => setNewSubject((prev) => ({ ...prev, level: e.target.value as 'beginner' | 'intermediate' | 'advanced' | '' }))}
                disabled={!newSubject.subjectId}
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">Select Level</option>
                {availableLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddSubject}
                disabled={!newSubject.subjectId || !newSubject.level}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </section>

          {/* Hourly Rate */}
          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Hourly Rate</h2>
            <div className="flex items-center gap-3">
              <span className="text-neutral-600">GH₵</span>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData((prev) => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                min={10}
                max={1000}
                step={5}
                className="w-32 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-neutral-600">per hour</span>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              You keep 85% of each session. Platform fee is 15%.
            </p>
          </section>

          {/* Availability */}
          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Weekly Availability</h2>
            <p className="text-sm text-neutral-600 mb-4">Enter your typical available hours for each day.</p>
            <div className="space-y-3">
              {availableDays.map((day) => (
                <div key={day} className="flex items-center gap-4">
                  <span className="w-24 capitalize text-neutral-700">{day}</span>
                  <input
                    type="text"
                    value={formData.availability[day] || ''}
                    onChange={(e) => handleAvailabilityChange(day, e.target.value)}
                    placeholder="e.g., 9am - 5pm"
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Error/Success Messages */}
          {saveError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {saveSuccess}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-200">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 px-4 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Draft
            </button>
            {(!myProfile || myProfile.directoryStatus !== 'approved') && (
              <button
                onClick={handleSubmitForApproval}
                disabled={isSubmitting || myProfile?.directoryStatus === 'pending'}
                className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : myProfile?.directoryStatus === 'pending' ? (
                  'Awaiting Approval'
                ) : (
                  'Submit for Approval'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

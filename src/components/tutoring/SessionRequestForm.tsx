import { useState, useEffect } from 'react';
import { X, Video, MessageCircle, PenTool, Calendar, Clock, Loader2 } from 'lucide-react';
import type { TeacherDirectoryProfile, SessionType } from '@/types/tutoring';

interface SessionRequestFormProps {
  teacher: TeacherDirectoryProfile;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    teacherProfileId: string;
    subjectId: string;
    topicDescription?: string;
    sessionType: SessionType;
    proposedDatetime: string;
    proposedDuration: number;
    message?: string;
  }) => Promise<void>;
}

const sessionTypeConfig: Record<SessionType, { icon: React.ReactNode; label: string; description: string }> = {
  video: {
    icon: <Video className="w-5 h-5" />,
    label: 'Video Call',
    description: 'Live video session with screen sharing',
  },
  chat: {
    icon: <MessageCircle className="w-5 h-5" />,
    label: 'Chat Session',
    description: 'Text-based tutoring with instant messaging',
  },
  whiteboard: {
    icon: <PenTool className="w-5 h-5" />,
    label: 'Whiteboard',
    description: 'Interactive whiteboard with drawing tools',
  },
};

const durationOptions = [
  { value: 30, label: '30 min', price: 0.5 },
  { value: 60, label: '1 hour', price: 1 },
  { value: 90, label: '1.5 hours', price: 1.5 },
  { value: 120, label: '2 hours', price: 2 },
];

export function SessionRequestForm({ teacher, isOpen, onClose, onSubmit }: SessionRequestFormProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [topicDescription, setTopicDescription] = useState('');
  const [sessionType, setSessionType] = useState<SessionType | ''>('');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedSubject(teacher.subjects[0]?.subjectId || '');
      setSessionType(teacher.sessionTypes[0] || '');
      setError('');
    }
  }, [isOpen, teacher]);

  const estimatedCost = teacher.hourlyRate * (duration / 60);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedSubject || !sessionType || !proposedDate || !proposedTime) {
      setError('Please fill in all required fields');
      return;
    }

    const proposedDatetime = new Date(`${proposedDate}T${proposedTime}`).toISOString();

    // Check if date is in the future
    if (new Date(proposedDatetime) <= new Date()) {
      setError('Please select a future date and time');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        teacherProfileId: teacher.id,
        subjectId: selectedSubject,
        topicDescription: topicDescription || undefined,
        sessionType: sessionType as SessionType,
        proposedDatetime,
        proposedDuration: duration,
        message: message || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Request Tutoring Session</h2>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Teacher info */}
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
              {teacher.profilePhotoUrl ? (
                <img src={teacher.profilePhotoUrl} alt={teacher.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-blue-600 font-bold text-lg">{teacher.displayName.charAt(0)}</span>
              )}
            </div>
            <div>
              <h3 className="font-medium text-neutral-900">{teacher.displayName}</h3>
              <p className="text-sm text-neutral-500">GH₵{teacher.hourlyRate}/hour</p>
            </div>
          </div>

          {/* Subject selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a subject</option>
              {teacher.subjects.map((subject) => (
                <option key={subject.subjectId} value={subject.subjectId}>
                  {subject.subjectName} ({subject.level})
                </option>
              ))}
            </select>
          </div>

          {/* Topic description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              What do you need help with?
            </label>
            <textarea
              value={topicDescription}
              onChange={(e) => setTopicDescription(e.target.value)}
              placeholder="Describe the topics or concepts you'd like to cover..."
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Session type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Session Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {teacher.sessionTypes.map((type) => (
                <label
                  key={type}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    sessionType === type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="sessionType"
                    value={type}
                    checked={sessionType === type}
                    onChange={(e) => setSessionType(e.target.value as SessionType)}
                    className="sr-only"
                  />
                  <div className={`${sessionType === type ? 'text-blue-600' : 'text-neutral-400'}`}>
                    {sessionTypeConfig[type].icon}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{sessionTypeConfig[type].label}</p>
                    <p className="text-sm text-neutral-500">{sessionTypeConfig[type].description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={proposedTime}
                onChange={(e) => setProposedTime(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {durationOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDuration(option.value)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    duration === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Message to Teacher (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce yourself or add any additional notes..."
              rows={2}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Cost summary */}
          <div className="p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Estimated Cost</span>
              <span className="text-xl font-bold text-blue-600">GH₵{estimatedCost.toFixed(2)}</span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Payment will be collected after teacher accepts your request
            </p>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Send Request'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

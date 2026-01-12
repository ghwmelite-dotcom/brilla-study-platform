import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Sparkles,
  PenTool,
  Mic,
  Loader2,
} from 'lucide-react';
import { useTutorClassroomStore } from '@/stores/tutorClassroomStore';
import { cn } from '@/utils';

interface ScheduleSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
  studentName?: string;
  preselectedSubject?: string;
  preselectedTopic?: string;
}

const examTypeOptions = ['WASSCE', 'BECE', 'IGCSE', 'A_LEVEL', 'NSMQ'];

const durationOptions = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

const aiCopilotModes = [
  {
    value: 'assistant',
    label: 'Assistant',
    description: 'AI actively suggests and helps',
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    value: 'silent',
    label: 'Silent',
    description: 'AI only responds when asked',
    icon: <Mic className="w-4 h-4" />,
  },
  {
    value: 'disabled',
    label: 'Disabled',
    description: 'No AI assistance',
    icon: <X className="w-4 h-4" />,
  },
];

export function ScheduleSessionModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  preselectedSubject,
  preselectedTopic,
}: ScheduleSessionModalProps) {
  const { createScheduledSession } = useTutorClassroomStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectName: preselectedSubject || '',
    topicName: preselectedTopic || '',
    examType: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    aiCopilotEnabled: true,
    aiCopilotMode: 'assistant',
    whiteboardEnabled: true,
    voiceEnabled: true,
    objectives: [''],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        subjectName: preselectedSubject || '',
        topicName: preselectedTopic || '',
      }));
      setError('');
    }
  }, [isOpen, preselectedSubject, preselectedTopic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.scheduledDate || !formData.scheduledTime) {
      setError('Please select a date and time');
      return;
    }

    const scheduledDatetime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    if (scheduledDatetime <= new Date()) {
      setError('Please select a future date and time');
      return;
    }

    setIsSubmitting(true);

    try {
      await createScheduledSession({
        studentId: studentId || '',
        title: formData.title || `${formData.subjectName} Session`,
        description: formData.description,
        subjectName: formData.subjectName,
        topicName: formData.topicName,
        examType: formData.examType,
        scheduledDatetime: scheduledDatetime.toISOString(),
        scheduledDurationMinutes: formData.duration,
        aiCopilotEnabled: formData.aiCopilotEnabled,
        aiCopilotMode: formData.aiCopilotMode as 'assistant' | 'silent' | 'disabled',
        whiteboardEnabled: formData.whiteboardEnabled,
        voiceEnabled: formData.voiceEnabled,
        objectives: formData.objectives.filter(o => o.trim()),
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule session');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-900 p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                <Calendar className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Schedule Live Session
                </h2>
                {studentName && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    with {studentName}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Session Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Algebra Review Session"
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Duration
              </label>
              <div className="flex flex-wrap gap-2">
                {durationOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, duration: option.value }))}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                      formData.duration === option.value
                        ? "bg-violet-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject & Exam Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.subjectName}
                  onChange={(e) => setFormData(prev => ({ ...prev, subjectName: e.target.value }))}
                  placeholder="e.g., Mathematics"
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Exam Type
                </label>
                <select
                  value={formData.examType}
                  onChange={(e) => setFormData(prev => ({ ...prev, examType: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                >
                  <option value="">Select exam</option>
                  {examTypeOptions.map(type => (
                    <option key={type} value={type}>{type.replace('_', '-')}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Topic (optional)
              </label>
              <input
                type="text"
                value={formData.topicName}
                onChange={(e) => setFormData(prev => ({ ...prev, topicName: e.target.value }))}
                placeholder="e.g., Quadratic Equations"
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
              />
            </div>

            {/* AI Co-pilot Mode */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                AI Co-pilot Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {aiCopilotModes.map(mode => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      aiCopilotMode: mode.value,
                      aiCopilotEnabled: mode.value !== 'disabled',
                    }))}
                    className={cn(
                      "p-3 rounded-xl border-2 text-center transition-all",
                      formData.aiCopilotMode === mode.value
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center",
                      formData.aiCopilotMode === mode.value
                        ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    )}>
                      {mode.icon}
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {mode.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {mode.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.whiteboardEnabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, whiteboardEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <PenTool className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Whiteboard</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.voiceEnabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, voiceEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <Mic className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Voice</span>
              </label>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of what you'll cover..."
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:outline-none resize-none"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-900 p-6 border-t border-slate-200 dark:border-slate-800">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-70 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  Schedule Session
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ScheduleSessionModal;

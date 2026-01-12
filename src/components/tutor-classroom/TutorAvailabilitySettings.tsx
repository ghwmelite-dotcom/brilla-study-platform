import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  HandHelping,
  Settings,
  GraduationCap,
  Gauge,
  Save,
  Loader2,
  Radio,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from 'lucide-react';
import { useTutorClassroomStore } from '@/stores/tutorClassroomStore';
import { cn } from '@/utils';

interface TutorAvailabilitySettingsProps {
  className?: string;
  compact?: boolean;
}

const examTypeOptions = [
  { value: 'WASSCE', label: 'WASSCE' },
  { value: 'BECE', label: 'BECE' },
  { value: 'IGCSE', label: 'IGCSE' },
  { value: 'A_LEVEL', label: 'A-Level' },
  { value: 'NSMQ', label: 'NSMQ' },
];

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export function TutorAvailabilitySettings({ className, compact = false }: TutorAvailabilitySettingsProps) {
  const {
    availability,
    isUpdatingAvailability,
    fetchAvailability,
    updateAvailability,
    sendHeartbeat,
  } = useTutorClassroomStore();

  const [localSettings, setLocalSettings] = useState({
    acceptingHandoffs: true,
    acceptingObservation: true,
    maxObservedSessions: 5,
    preferredExamTypes: [] as string[],
    preferredDifficultyLevels: [] as string[],
    notifyOnHandoffRequest: true,
    notifyOnHighStruggle: true,
    minStruggleScoreNotify: 70,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load availability on mount
  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Sync local settings with store
  useEffect(() => {
    if (availability) {
      setLocalSettings({
        acceptingHandoffs: availability.acceptingHandoffs,
        acceptingObservation: availability.acceptingObservation,
        maxObservedSessions: availability.maxObservedSessions,
        preferredExamTypes: availability.preferredExamTypes || [],
        preferredDifficultyLevels: availability.preferredDifficultyLevels || [],
        notifyOnHandoffRequest: availability.notifyOnHandoffRequest,
        notifyOnHighStruggle: availability.notifyOnHighStruggle,
        minStruggleScoreNotify: availability.minStruggleScoreNotify,
      });
    }
  }, [availability]);

  // Track changes
  useEffect(() => {
    if (availability) {
      const changed =
        localSettings.acceptingHandoffs !== availability.acceptingHandoffs ||
        localSettings.acceptingObservation !== availability.acceptingObservation ||
        localSettings.maxObservedSessions !== availability.maxObservedSessions ||
        JSON.stringify(localSettings.preferredExamTypes) !== JSON.stringify(availability.preferredExamTypes) ||
        JSON.stringify(localSettings.preferredDifficultyLevels) !== JSON.stringify(availability.preferredDifficultyLevels) ||
        localSettings.notifyOnHandoffRequest !== availability.notifyOnHandoffRequest ||
        localSettings.notifyOnHighStruggle !== availability.notifyOnHighStruggle ||
        localSettings.minStruggleScoreNotify !== availability.minStruggleScoreNotify;
      setHasChanges(changed);
    }
  }, [localSettings, availability]);

  // Periodic heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      if (localSettings.acceptingHandoffs || localSettings.acceptingObservation) {
        sendHeartbeat();
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [localSettings.acceptingHandoffs, localSettings.acceptingObservation, sendHeartbeat]);

  const handleSave = async () => {
    await updateAvailability(localSettings);
    setHasChanges(false);
  };

  const toggleExamType = (type: string) => {
    setLocalSettings(prev => ({
      ...prev,
      preferredExamTypes: prev.preferredExamTypes.includes(type)
        ? prev.preferredExamTypes.filter(t => t !== type)
        : [...prev.preferredExamTypes, type],
    }));
  };

  const toggleDifficulty = (level: string) => {
    setLocalSettings(prev => ({
      ...prev,
      preferredDifficultyLevels: prev.preferredDifficultyLevels.includes(level)
        ? prev.preferredDifficultyLevels.filter(l => l !== level)
        : [...prev.preferredDifficultyLevels, level],
    }));
  };

  const isOnline = availability?.isOnline;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        {/* Online status indicator */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full",
            isOnline ? "bg-green-500 animate-pulse" : "bg-slate-400"
          )} />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Quick toggles */}
        <button
          onClick={() => {
            const newValue = !localSettings.acceptingHandoffs;
            setLocalSettings(prev => ({ ...prev, acceptingHandoffs: newValue }));
            updateAvailability({ acceptingHandoffs: newValue });
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            localSettings.acceptingHandoffs
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          )}
        >
          <HandHelping className="w-4 h-4" />
          Handoffs
        </button>

        <button
          onClick={() => {
            const newValue = !localSettings.acceptingObservation;
            setLocalSettings(prev => ({ ...prev, acceptingObservation: newValue }));
            updateAvailability({ acceptingObservation: newValue });
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            localSettings.acceptingObservation
              ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          )}
        >
          <Eye className="w-4 h-4" />
          Observe
        </button>
      </div>
    );
  }

  return (
    <div className={cn("bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden", className)}>
      {/* Header with status */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
              <Settings className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                AI Classroom Availability
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Control when students can connect with you
              </p>
            </div>
          </div>

          {/* Status indicator */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full",
            isOnline
              ? "bg-green-100 dark:bg-green-900/30"
              : "bg-slate-100 dark:bg-slate-800"
          )}>
            <Radio className={cn(
              "w-4 h-4",
              isOnline ? "text-green-600 dark:text-green-400 animate-pulse" : "text-slate-400"
            )} />
            <span className={cn(
              "text-sm font-medium",
              isOnline ? "text-green-700 dark:text-green-400" : "text-slate-500 dark:text-slate-400"
            )}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Primary toggles */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Accept Handoffs */}
          <div
            onClick={() => setLocalSettings(prev => ({ ...prev, acceptingHandoffs: !prev.acceptingHandoffs }))}
            className={cn(
              "p-4 rounded-xl border-2 cursor-pointer transition-all",
              localSettings.acceptingHandoffs
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                localSettings.acceptingHandoffs
                  ? "bg-emerald-100 dark:bg-emerald-900/40"
                  : "bg-slate-100 dark:bg-slate-800"
              )}>
                <HandHelping className={cn(
                  "w-5 h-5",
                  localSettings.acceptingHandoffs
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400"
                )} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    Accept Handoffs
                  </h4>
                  {localSettings.acceptingHandoffs ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Receive notifications when students need human help
                </p>
              </div>
            </div>
          </div>

          {/* Accept Observation */}
          <div
            onClick={() => setLocalSettings(prev => ({ ...prev, acceptingObservation: !prev.acceptingObservation }))}
            className={cn(
              "p-4 rounded-xl border-2 cursor-pointer transition-all",
              localSettings.acceptingObservation
                ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                localSettings.acceptingObservation
                  ? "bg-violet-100 dark:bg-violet-900/40"
                  : "bg-slate-100 dark:bg-slate-800"
              )}>
                <Eye className={cn(
                  "w-5 h-5",
                  localSettings.acceptingObservation
                    ? "text-violet-600 dark:text-violet-400"
                    : "text-slate-400"
                )} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    Observation Mode
                  </h4>
                  {localSettings.acceptingObservation ? (
                    <CheckCircle2 className="w-5 h-5 text-violet-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Monitor multiple AI classroom sessions at once
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Max observed sessions slider */}
        {localSettings.acceptingObservation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Maximum sessions to observe
              </label>
              <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                {localSettings.maxObservedSessions}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={localSettings.maxObservedSessions}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                maxObservedSessions: parseInt(e.target.value)
              }))}
              className="w-full accent-violet-600"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>1</span>
              <span>10</span>
            </div>
          </motion.div>
        )}

        {/* Preferences section */}
        <div className="space-y-4">
          <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-slate-400" />
            Preferred Exam Types
          </h4>
          <div className="flex flex-wrap gap-2">
            {examTypeOptions.map(type => (
              <button
                key={type.value}
                onClick={() => toggleExamType(type.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  localSettings.preferredExamTypes.includes(type.value)
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
          {localSettings.preferredExamTypes.length === 0 && (
            <p className="text-xs text-slate-400">
              Select exam types to prioritize matching students (leave empty for all)
            </p>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
            <Gauge className="w-4 h-4 text-slate-400" />
            Preferred Difficulty Levels
          </h4>
          <div className="flex flex-wrap gap-2">
            {difficultyOptions.map(level => (
              <button
                key={level.value}
                onClick={() => toggleDifficulty(level.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  localSettings.preferredDifficultyLevels.includes(level.value)
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced settings toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
          Advanced notification settings
        </button>

        {/* Advanced settings */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-2"
            >
              {/* Notification toggles */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.notifyOnHandoffRequest}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      notifyOnHandoffRequest: e.target.checked
                    }))}
                    className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Notify on handoff requests
                    </span>
                    <p className="text-xs text-slate-400">
                      Get notified when a student requests to connect
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.notifyOnHighStruggle}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      notifyOnHighStruggle: e.target.checked
                    }))}
                    className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Alert on high struggle scores
                    </span>
                    <p className="text-xs text-slate-400">
                      Get alerted when a student is struggling significantly
                    </p>
                  </div>
                </label>
              </div>

              {/* Struggle threshold slider */}
              {localSettings.notifyOnHighStruggle && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Minimum struggle score for alerts
                    </label>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {localSettings.minStruggleScoreNotify}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={90}
                    step={10}
                    value={localSettings.minStruggleScoreNotify}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      minStruggleScoreNotify: parseInt(e.target.value)
                    }))}
                    className="w-full accent-amber-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>30% (More alerts)</span>
                    <span>90% (Fewer alerts)</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save button */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
          >
            <button
              onClick={handleSave}
              disabled={isUpdatingAvailability}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-medium rounded-xl transition-colors"
            >
              {isUpdatingAvailability ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TutorAvailabilitySettings;

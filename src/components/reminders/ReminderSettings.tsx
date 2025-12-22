import React, { useEffect, useState } from 'react';
import { useReminderStore } from '@/stores/reminderStore';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export function ReminderSettings() {
  const {
    settings,
    isLoading,
    notificationPermission,
    fetchSettings,
    updateSettings,
    requestNotificationPermission,
    scheduleLocalReminder,
  } = useReminderStore();

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    if (!settings) return;

    setIsSaving(true);
    setSaveMessage(null);

    const success = await updateSettings({ [key]: value });

    setIsSaving(false);
    setSaveMessage(success ? 'Settings saved!' : 'Failed to save settings');

    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleTimeChange = async (time: string) => {
    if (!settings) return;

    setIsSaving(true);
    setSaveMessage(null);

    const success = await updateSettings({ studyTime: time });

    setIsSaving(false);
    setSaveMessage(success ? 'Settings saved!' : 'Failed to save settings');

    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleDaysChange = async (day: number) => {
    if (!settings) return;

    const newDays = settings.daysOfWeek.includes(day)
      ? settings.daysOfWeek.filter(d => d !== day)
      : [...settings.daysOfWeek, day].sort((a, b) => a - b);

    if (newDays.length === 0) return; // At least one day required

    setIsSaving(true);
    setSaveMessage(null);

    const success = await updateSettings({ daysOfWeek: newDays });

    setIsSaving(false);
    setSaveMessage(success ? 'Settings saved!' : 'Failed to save settings');

    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleEnablePush = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      await updateSettings({ pushEnabled: true });

      // Send a test notification
      scheduleLocalReminder(
        'Notifications Enabled!',
        'You will now receive study reminders.',
        1000
      );
    }
  };

  const handleTestReminder = () => {
    if (notificationPermission === 'granted') {
      scheduleLocalReminder(
        'Test Reminder',
        'This is how your study reminders will appear!',
        100
      );
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Study Reminders</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure when and how you receive study reminders
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Master Enable */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Enable Reminders</h3>
            <p className="text-sm text-gray-500">Receive reminders to study</p>
          </div>
          <button
            onClick={() => handleToggle('enabled', !settings.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enabled ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
            disabled={isSaving}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {settings.enabled && (
          <>
            {/* Reminder Types */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Reminder Types</h3>

              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-700">Daily Goal Reminder</span>
                    <p className="text-xs text-gray-500">Remind me to complete my daily practice goal</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.dailyGoalReminder}
                    onChange={() => handleToggle('dailyGoalReminder', !settings.dailyGoalReminder)}
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    disabled={isSaving}
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-700">Streak Reminder</span>
                    <p className="text-xs text-gray-500">Warn me before losing my study streak</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.streakReminder}
                    onChange={() => handleToggle('streakReminder', !settings.streakReminder)}
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    disabled={isSaving}
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-700">Quest Reminder</span>
                    <p className="text-xs text-gray-500">Notify me about expiring quests</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.questReminder}
                    onChange={() => handleToggle('questReminder', !settings.questReminder)}
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    disabled={isSaving}
                  />
                </label>
              </div>
            </div>

            {/* Study Time */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Preferred Study Time</h3>
              <input
                type="time"
                value={settings.studyTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={isSaving}
              />
              <p className="mt-1 text-xs text-gray-500">
                Reminders will be sent around this time
              </p>
            </div>

            {/* Days of Week */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Active Days</h3>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => handleDaysChange(day.value)}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                      settings.daysOfWeek.includes(day.value)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    disabled={isSaving}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Channels */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Notification Channels</h3>

              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-700">Push Notifications</span>
                  <p className="text-xs text-gray-500">Receive notifications in your browser</p>
                </div>
                {notificationPermission === 'granted' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600">Enabled</span>
                    <button
                      onClick={handleTestReminder}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      Test
                    </button>
                  </div>
                ) : notificationPermission === 'denied' ? (
                  <span className="text-xs text-red-600">Blocked in browser settings</span>
                ) : (
                  <button
                    onClick={handleEnablePush}
                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    disabled={isSaving}
                  >
                    Enable
                  </button>
                )}
              </div>

              {/* Email Notifications */}
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-700">Email Notifications</span>
                  <p className="text-xs text-gray-500">Receive reminders via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailEnabled}
                  onChange={() => handleToggle('emailEnabled', !settings.emailEnabled)}
                  className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  disabled={isSaving}
                />
              </label>
            </div>
          </>
        )}

        {/* Save Status */}
        {saveMessage && (
          <div className={`text-sm ${saveMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
            {saveMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReminderSettings;

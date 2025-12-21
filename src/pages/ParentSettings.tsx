import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Mail,
  Users,
  Link as LinkIcon,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, Button, Badge } from '@/components/common';
import { useParentStore, useAuthStore } from '@/stores';
import { cn } from '@/utils';
import type { ParentNotificationPreferences } from '@/types';

// Toggle Switch Component
function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
        checked ? 'bg-primary' : 'bg-neutral-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

// Link Student Modal
function LinkStudentModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { linkStudent, isLoading, error, clearError } = useParentStore();
  const [inviteCode, setInviteCode] = useState('');
  const [relationshipType, setRelationshipType] = useState<'parent' | 'guardian'>('parent');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccess(false);

    try {
      await linkStudent(inviteCode.toUpperCase(), relationshipType);
      setSuccess(true);
      setInviteCode('');
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch {
      // Error is handled by the store
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">
          Link to Student
        </h2>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-green-600 font-medium">Successfully linked!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-neutral-600 mb-4">
              Enter the 6-character invite code provided by your ward to link their account.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="XXXXXX"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-center text-2xl font-mono tracking-widest uppercase"
                maxLength={6}
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Relationship
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="relationship"
                    value="parent"
                    checked={relationshipType === 'parent'}
                    onChange={() => setRelationshipType('parent')}
                    className="text-primary"
                  />
                  <span>Parent</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="relationship"
                    value="guardian"
                    checked={relationshipType === 'guardian'}
                    onChange={() => setRelationshipType('guardian')}
                    className="text-primary"
                  />
                  <span>Guardian</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                fullWidth
                disabled={inviteCode.length !== 6 || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Link Account'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function ParentSettingsPage() {
  const { user } = useAuthStore();
  const {
    linkedStudents,
    preferences,
    fetchLinkedStudents,
    fetchPreferences,
    updatePreferences,
  } = useParentStore();

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLinkedStudents();
    fetchPreferences();
  }, []);

  const handlePreferenceChange = async (
    key: keyof ParentNotificationPreferences,
    value: boolean | number
  ) => {
    setIsSaving(true);
    try {
      await updatePreferences({ [key]: value });
    } catch (error) {
      console.error('Failed to update preference:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || user.role !== 'parent') {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Access denied. Parent account required.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/parent">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">
            Parent Settings
          </h1>
          <p className="text-neutral-500">
            Manage your linked students and notification preferences
          </p>
        </div>
      </div>

      {/* Linked Students */}
      <Card className="p-6">
        <CardHeader
          title="Linked Students"
          subtitle="Manage your linked student accounts"
          action={
            <Button
              size="sm"
              leftIcon={<LinkIcon className="w-4 h-4" />}
              onClick={() => setShowLinkModal(true)}
            >
              Link New Student
            </Button>
          }
        />

        {linkedStudents.length === 0 ? (
          <div className="text-center py-8 bg-neutral-50 rounded-lg">
            <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600 font-medium">No students linked yet</p>
            <p className="text-sm text-neutral-500 mt-1">
              Click "Link New Student" to connect with your ward's account
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {linkedStudents.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="font-bold text-primary">
                      {link.student?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{link.student?.name}</p>
                    <p className="text-sm text-neutral-500">
                      {link.relationshipType === 'guardian' ? 'Guardian' : 'Parent'} -
                      Linked {new Date(link.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant="success" size="sm">Active</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Notification Preferences */}
      <Card className="p-6">
        <CardHeader
          title="Notification Preferences"
          subtitle="Choose what notifications you want to receive"
        />

        <div className="space-y-4">
          {/* Achievement Alerts */}
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Bell className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">Achievement Alerts</p>
                <p className="text-sm text-neutral-500">
                  Get notified when your ward unlocks an achievement
                </p>
              </div>
            </div>
            <Toggle
              checked={preferences?.achievementAlerts ?? true}
              onChange={(checked) => handlePreferenceChange('achievementAlerts', checked)}
              disabled={isSaving}
            />
          </div>

          {/* Streak Alerts */}
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Bell className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">Streak Milestones</p>
                <p className="text-sm text-neutral-500">
                  Get notified when your ward reaches streak milestones (7, 14, 30 days)
                </p>
              </div>
            </div>
            <Toggle
              checked={preferences?.streakAlerts ?? true}
              onChange={(checked) => handlePreferenceChange('streakAlerts', checked)}
              disabled={isSaving}
            />
          </div>

          {/* Low Performance Alerts */}
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">Low Performance Alerts</p>
                <p className="text-sm text-neutral-500">
                  Get notified when accuracy drops below threshold
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Threshold:</span>
                  <select
                    value={preferences?.lowPerformanceThreshold ?? 40}
                    onChange={(e) =>
                      handlePreferenceChange('lowPerformanceThreshold', parseInt(e.target.value))
                    }
                    className="text-sm border border-neutral-300 rounded px-2 py-1"
                    disabled={isSaving}
                  >
                    <option value={30}>30%</option>
                    <option value={40}>40%</option>
                    <option value={50}>50%</option>
                    <option value={60}>60%</option>
                  </select>
                </div>
              </div>
            </div>
            <Toggle
              checked={preferences?.lowPerformanceAlerts ?? true}
              onChange={(checked) => handlePreferenceChange('lowPerformanceAlerts', checked)}
              disabled={isSaving}
            />
          </div>

          {/* Weekly Summary */}
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">Weekly Summary</p>
                <p className="text-sm text-neutral-500">
                  Receive a weekly progress summary every Sunday
                </p>
              </div>
            </div>
            <Toggle
              checked={preferences?.weeklySummary ?? true}
              onChange={(checked) => handlePreferenceChange('weeklySummary', checked)}
              disabled={isSaving}
            />
          </div>
        </div>
      </Card>

      {/* Email Notifications */}
      <Card className="p-6">
        <CardHeader
          title="Email Notifications"
          subtitle="Manage email delivery preferences"
        />

        <div className="flex items-center justify-between py-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-neutral-900">Send Email Notifications</p>
              <p className="text-sm text-neutral-500">
                Receive important alerts via email in addition to in-app notifications
              </p>
            </div>
          </div>
          <Toggle
            checked={preferences?.emailNotifications ?? true}
            onChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
            disabled={isSaving}
          />
        </div>
      </Card>

      {/* Link Student Modal */}
      <LinkStudentModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
      />
    </div>
  );
}

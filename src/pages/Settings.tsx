import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Lock,
  Bell,
  Palette,
  Shield,
  Save,
  Check,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  Sun,
  Moon,
  Monitor,
  Type,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { cn } from '@/utils';

type SettingsTab = 'profile' | 'password' | 'notifications' | 'appearance';

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    schoolName: (user as { schoolName?: string })?.schoolName || '',
    house: user?.house || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    battleInvites: true,
    weeklyProgress: true,
    achievements: true,
  });
  const [notificationsSaving, setNotificationsSaving] = useState(false);
  const [notificationsSuccess, setNotificationsSuccess] = useState(false);

  // Appearance preferences - load from localStorage
  const [appearance, setAppearance] = useState(() => {
    const saved = localStorage.getItem('brilla-appearance');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      theme: 'light' as 'light' | 'dark' | 'system',
      fontSize: 'medium' as 'small' | 'medium' | 'large',
      compactMode: false,
      reduceMotion: false,
    };
  });
  const [appearanceSaving, setAppearanceSaving] = useState(false);
  const [appearanceSuccess, setAppearanceSuccess] = useState(false);

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'password' as const, label: 'Password', icon: Lock },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
  ];

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const response = await api.put('/users/me', profileForm);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update profile');
      }

      // Update local state
      updateProfile({
        name: profileForm.name,
        house: profileForm.house,
      });

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    // Validation
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      setPasswordSaving(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordSaving(false);
      return;
    }

    try {
      const response = await api.post('/users/me/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to change password');
      }

      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleNotificationsSave = async () => {
    setNotificationsSaving(true);
    setNotificationsSuccess(false);

    try {
      // In production, this would save to API
      await new Promise(resolve => setTimeout(resolve, 500));
      setNotificationsSuccess(true);
      setTimeout(() => setNotificationsSuccess(false), 3000);
    } finally {
      setNotificationsSaving(false);
    }
  };

  const handleAppearanceSave = async () => {
    setAppearanceSaving(true);
    setAppearanceSuccess(false);

    try {
      // Save to localStorage
      localStorage.setItem('brilla-appearance', JSON.stringify(appearance));

      // Apply theme to document
      const root = document.documentElement;
      if (appearance.theme === 'dark') {
        root.classList.add('dark');
      } else if (appearance.theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }

      // Apply font size
      root.style.fontSize = appearance.fontSize === 'small' ? '14px' :
                            appearance.fontSize === 'large' ? '18px' : '16px';

      // Apply compact mode
      if (appearance.compactMode) {
        root.classList.add('compact');
      } else {
        root.classList.remove('compact');
      }

      // Apply reduce motion
      if (appearance.reduceMotion) {
        root.classList.add('reduce-motion');
      } else {
        root.classList.remove('reduce-motion');
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      setAppearanceSuccess(true);
      setTimeout(() => setAppearanceSuccess(false), 3000);
    } finally {
      setAppearanceSaving(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
              <p className="text-neutral-600">Manage your account preferences</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="md:w-56 flex-shrink-0">
            <nav className="bg-white rounded-xl border border-neutral-200 p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900 mb-1">Profile Information</h2>
                    <p className="text-sm text-neutral-500">Update your personal details</p>
                  </div>

                  {profileError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {profileError}
                    </div>
                  )}

                  {profileSuccess && (
                    <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Profile updated successfully!
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full px-4 py-2.5 bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-500 cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-neutral-400">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        School Name
                      </label>
                      <input
                        type="text"
                        value={profileForm.schoolName}
                        onChange={(e) => setProfileForm({ ...profileForm, schoolName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    {user.role === 'student' && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          House
                        </label>
                        <select
                          value={profileForm.house}
                          onChange={(e) => setProfileForm({ ...profileForm, house: e.target.value })}
                          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          <option value="">Select house</option>
                          <option value="Red House">Red House</option>
                          <option value="Blue House">Blue House</option>
                          <option value="Green House">Green House</option>
                          <option value="Yellow House">Yellow House</option>
                        </select>
                      </div>
                    )}

                    <div className="flex items-center gap-4 pt-4">
                      <span className="text-sm text-neutral-500">
                        Role: <span className="font-medium capitalize">{user.role}</span>
                      </span>
                      <span className="text-sm text-neutral-500">
                        Level: <span className="font-medium">{user.level}</span>
                      </span>
                      <span className="text-sm text-neutral-500">
                        XP: <span className="font-medium">{user.xpPoints?.toLocaleString()}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-neutral-200">
                    <button
                      onClick={handleProfileSave}
                      disabled={profileSaving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {profileSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900 mb-1">Change Password</h2>
                    <p className="text-sm text-neutral-500">Update your password to keep your account secure</p>
                  </div>

                  {passwordError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Password changed successfully!
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className="w-full px-4 py-2.5 pr-12 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full px-4 py-2.5 pr-12 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-neutral-400">Minimum 8 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full px-4 py-2.5 pr-12 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-neutral-200">
                    <button
                      onClick={handlePasswordChange}
                      disabled={passwordSaving || !passwordForm.currentPassword || !passwordForm.newPassword}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {passwordSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      Change Password
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900 mb-1">Notification Preferences</h2>
                    <p className="text-sm text-neutral-500">Choose what notifications you receive</p>
                  </div>

                  {notificationsSuccess && (
                    <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Preferences saved!
                    </div>
                  )}

                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors">
                      <div>
                        <p className="font-medium text-neutral-900">Email Updates</p>
                        <p className="text-sm text-neutral-500">Get notified about platform updates</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.emailUpdates}
                        onChange={(e) => setNotifications({ ...notifications, emailUpdates: e.target.checked })}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors">
                      <div>
                        <p className="font-medium text-neutral-900">Battle Invites</p>
                        <p className="text-sm text-neutral-500">Receive notifications for battle challenges</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.battleInvites}
                        onChange={(e) => setNotifications({ ...notifications, battleInvites: e.target.checked })}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors">
                      <div>
                        <p className="font-medium text-neutral-900">Weekly Progress</p>
                        <p className="text-sm text-neutral-500">Weekly summary of your learning progress</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.weeklyProgress}
                        onChange={(e) => setNotifications({ ...notifications, weeklyProgress: e.target.checked })}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors">
                      <div>
                        <p className="font-medium text-neutral-900">Achievements</p>
                        <p className="text-sm text-neutral-500">Celebrate when you unlock achievements</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.achievements}
                        onChange={(e) => setNotifications({ ...notifications, achievements: e.target.checked })}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-neutral-200">
                    <button
                      onClick={handleNotificationsSave}
                      disabled={notificationsSaving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {notificationsSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900 mb-1">Appearance</h2>
                    <p className="text-sm text-neutral-500">Customize how Brilla looks for you</p>
                  </div>

                  {appearanceSuccess && (
                    <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Appearance settings saved!
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Theme Selection */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-3">
                        Theme
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setAppearance({ ...appearance, theme: 'light' })}
                          className={cn(
                            'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                            appearance.theme === 'light'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                              : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                          )}
                        >
                          <Sun className="w-6 h-6" />
                          <span className="text-sm font-medium">Light</span>
                        </button>
                        <button
                          onClick={() => setAppearance({ ...appearance, theme: 'dark' })}
                          className={cn(
                            'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                            appearance.theme === 'dark'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                              : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                          )}
                        >
                          <Moon className="w-6 h-6" />
                          <span className="text-sm font-medium">Dark</span>
                        </button>
                        <button
                          onClick={() => setAppearance({ ...appearance, theme: 'system' })}
                          className={cn(
                            'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                            appearance.theme === 'system'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                              : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                          )}
                        >
                          <Monitor className="w-6 h-6" />
                          <span className="text-sm font-medium">System</span>
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-neutral-400">
                        System theme follows your device preference
                      </p>
                    </div>

                    {/* Font Size */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-3">
                        <div className="flex items-center gap-2">
                          <Type className="w-4 h-4" />
                          Font Size
                        </div>
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setAppearance({ ...appearance, fontSize: 'small' })}
                          className={cn(
                            'p-3 rounded-lg border-2 transition-all text-center',
                            appearance.fontSize === 'small'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-neutral-200 hover:border-neutral-300'
                          )}
                        >
                          <span className="text-xs font-medium">Small</span>
                        </button>
                        <button
                          onClick={() => setAppearance({ ...appearance, fontSize: 'medium' })}
                          className={cn(
                            'p-3 rounded-lg border-2 transition-all text-center',
                            appearance.fontSize === 'medium'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-neutral-200 hover:border-neutral-300'
                          )}
                        >
                          <span className="text-sm font-medium">Medium</span>
                        </button>
                        <button
                          onClick={() => setAppearance({ ...appearance, fontSize: 'large' })}
                          className={cn(
                            'p-3 rounded-lg border-2 transition-all text-center',
                            appearance.fontSize === 'large'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-neutral-200 hover:border-neutral-300'
                          )}
                        >
                          <span className="text-base font-medium">Large</span>
                        </button>
                      </div>
                    </div>

                    {/* Display Options */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Display Options
                      </label>

                      <label className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors">
                        <div>
                          <p className="font-medium text-neutral-900">Compact Mode</p>
                          <p className="text-sm text-neutral-500">Show more content with less spacing</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={appearance.compactMode}
                          onChange={(e) => setAppearance({ ...appearance, compactMode: e.target.checked })}
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors">
                        <div>
                          <p className="font-medium text-neutral-900">Reduce Motion</p>
                          <p className="text-sm text-neutral-500">Minimize animations and transitions</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={appearance.reduceMotion}
                          onChange={(e) => setAppearance({ ...appearance, reduceMotion: e.target.checked })}
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-neutral-200">
                    <button
                      onClick={handleAppearanceSave}
                      disabled={appearanceSaving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {appearanceSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

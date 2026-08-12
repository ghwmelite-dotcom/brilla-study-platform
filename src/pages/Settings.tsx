import { useState, useEffect } from 'react';
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
  Camera,
  Trash2,
  Link,
  Unlink,
  Send,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api, fetchWithAuth } from '@/lib/api';
import { cn } from '@/utils';
import { Turnstile, useTurnstile } from '@/components/common/Turnstile';

type SettingsTab = 'profile' | 'password' | 'notifications' | 'appearance';

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const passwordTurnstile = useTurnstile();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    schoolName: (user as { schoolName?: string })?.schoolName || '',
    house: user?.house || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Avatar state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

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

  // Connected accounts state
  const [linkedProviders, setLinkedProviders] = useState<Array<{ provider: string; email: string }>>([]);
  const [hasPassword, setHasPassword] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [unlinkingGoogle, setUnlinkingGoogle] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [accountsSuccess, setAccountsSuccess] = useState<string | null>(null);
  const { getLinkedProviders, unlinkGoogle, initiateGoogleAuth } = useAuthStore();

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    battleInvites: true,
    weeklyProgress: true,
    achievements: true,
  });
  const [notificationsSaving, setNotificationsSaving] = useState(false);
  const [notificationsSuccess, setNotificationsSuccess] = useState(false);

  // Telegram connect state
  const [tg, setTg] = useState<{ linked: boolean; username: string | null; stale: boolean } | null>(null);
  const [tgConnecting, setTgConnecting] = useState(false);
  const [tgError, setTgError] = useState<string | null>(null);

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

  // Load connected accounts when password tab is active
  useEffect(() => {
    if (activeTab === 'password') {
      loadConnectedAccounts();
    }
  }, [activeTab]);

  // Load Telegram link status when notifications tab is active
  useEffect(() => {
    if (activeTab === 'notifications') {
      loadTelegramStatus();
    }
  }, [activeTab]);

  const loadTelegramStatus = async () => {
    try {
      const res = await api.get<{ linked: boolean; username: string | null; stale: boolean }>(
        '/notifications/telegram/status'
      );
      if (res.success && res.data) {
        setTg(res.data);
      }
    } catch (error) {
      console.error('Failed to load Telegram status:', error);
    }
  };

  const handleTelegramConnect = async () => {
    setTgConnecting(true);
    setTgError(null);
    try {
      const res = await api.post<{ startUrl: string; expiresAt: string }>('/notifications/telegram/link');
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to start Telegram linking');
      }
      window.open(res.data.startUrl, '_blank');
      // Poll status once after 15s to pick up the completed handshake
      setTimeout(() => {
        void loadTelegramStatus();
      }, 15000);
    } catch (error) {
      setTgError(error instanceof Error ? error.message : 'Failed to connect Telegram');
    } finally {
      setTgConnecting(false);
    }
  };

  const loadConnectedAccounts = async () => {
    setAccountsLoading(true);
    try {
      const result = await getLinkedProviders();
      setLinkedProviders(result.providers);
      setHasPassword(result.hasPassword);
    } catch (error) {
      console.error('Failed to load connected accounts:', error);
    } finally {
      setAccountsLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setLinkingGoogle(true);
    setAccountsError(null);
    try {
      // This will redirect to Google, so we store a flag to show success on return
      sessionStorage.setItem('linking_google', 'true');
      await initiateGoogleAuth('login', undefined, undefined, undefined);
      // Note: User will be redirected, so this won't execute
    } catch (error) {
      setAccountsError(error instanceof Error ? error.message : 'Failed to link Google account');
      setLinkingGoogle(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    setUnlinkingGoogle(true);
    setAccountsError(null);
    try {
      await unlinkGoogle();
      setAccountsSuccess('Google account unlinked successfully');
      await loadConnectedAccounts();
      setTimeout(() => setAccountsSuccess(null), 3000);
    } catch (error) {
      setAccountsError(error instanceof Error ? error.message : 'Failed to unlink Google account');
    } finally {
      setUnlinkingGoogle(false);
    }
  };

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Please upload a JPEG, PNG, WebP, or GIF image');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setAvatarError('Image must be smaller than 5MB');
      return;
    }

    setAvatarUploading(true);
    setAvatarError(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL || 'https://brilla-api.ghwmelite.workers.dev/api'}/users/me/avatar`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to upload avatar');
      }

      // Update local state
      updateProfile({ avatarUrl: data.data.avatarUrl });
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarUploading(true);
    setAvatarError(null);

    try {
      const response = await api.delete('/users/me/avatar');

      if (!response.success) {
        throw new Error(response.error || 'Failed to remove avatar');
      }

      // Update local state
      updateProfile({ avatarUrl: undefined });
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Failed to remove avatar');
    } finally {
      setAvatarUploading(false);
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

    if (!passwordTurnstile.isVerified || !passwordTurnstile.token) {
      setPasswordError('Please complete the security check');
      setPasswordSaving(false);
      return;
    }

    try {
      const response = await api.post('/users/me/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        turnstileToken: passwordTurnstile.token,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to change password');
      }

      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      passwordTurnstile.reset();
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password');
      passwordTurnstile.reset();
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

                  {/* Avatar Section */}
                  <div className="flex items-center gap-6 pb-6 border-b border-neutral-200">
                    <div className="relative">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-20 h-20 rounded-full object-cover border-2 border-neutral-200"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-neutral-200">
                          <span className="text-2xl font-semibold text-indigo-600">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      {avatarUploading && (
                        <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-medium text-neutral-700">Profile Photo</p>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer">
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors">
                            <Camera className="w-4 h-4" />
                            Upload Photo
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={handleAvatarUpload}
                            disabled={avatarUploading}
                          />
                        </label>
                        {user.avatarUrl && (
                          <button
                            onClick={handleAvatarRemove}
                            disabled={avatarUploading}
                            className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400">JPEG, PNG, WebP or GIF. Max 5MB.</p>
                      {avatarError && (
                        <p className="text-xs text-red-600">{avatarError}</p>
                      )}
                    </div>
                  </div>

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

                  {/* Turnstile Security Check */}
                  <div className="flex justify-center pt-2">
                    <Turnstile
                      onVerify={passwordTurnstile.handleVerify}
                      onError={passwordTurnstile.handleError}
                      onExpire={passwordTurnstile.handleExpire}
                      theme="light"
                      size="normal"
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-neutral-200">
                    <button
                      onClick={handlePasswordChange}
                      disabled={passwordSaving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordTurnstile.isVerified}
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

                  {/* Connected Accounts Section */}
                  <div className="pt-8 mt-8 border-t border-neutral-200">
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-neutral-900 mb-1">Connected Accounts</h2>
                      <p className="text-sm text-neutral-500">Link external accounts for easier sign-in</p>
                    </div>

                    {accountsError && (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {accountsError}
                      </div>
                    )}

                    {accountsSuccess && (
                      <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        {accountsSuccess}
                      </div>
                    )}

                    {accountsLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Google Account */}
                        <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white border border-neutral-200 rounded-lg flex items-center justify-center">
                              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900">Google</p>
                              {linkedProviders.some(p => p.provider === 'google') ? (
                                <p className="text-sm text-neutral-500">
                                  {linkedProviders.find(p => p.provider === 'google')?.email}
                                </p>
                              ) : (
                                <p className="text-sm text-neutral-500">Not connected</p>
                              )}
                            </div>
                          </div>

                          {linkedProviders.some(p => p.provider === 'google') ? (
                            <button
                              onClick={handleUnlinkGoogle}
                              disabled={unlinkingGoogle || (!hasPassword && linkedProviders.length === 1)}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={!hasPassword && linkedProviders.length === 1 ? 'Set a password before unlinking' : undefined}
                            >
                              {unlinkingGoogle ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Unlink className="w-4 h-4" />
                              )}
                              Unlink
                            </button>
                          ) : (
                            <button
                              onClick={handleLinkGoogle}
                              disabled={linkingGoogle}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {linkingGoogle ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Link className="w-4 h-4" />
                              )}
                              Link Account
                            </button>
                          )}
                        </div>

                        {!hasPassword && (
                          <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                            <AlertTriangle className="w-3 h-3" />
                            Set a password above to enable unlinking your Google account
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  {/* Connect Telegram Card */}
                  <div className="bg-white rounded-2xl border border-neutral-200 p-4">
                    {tg === null ? (
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking Telegram connection…
                      </div>
                    ) : tg.linked && !tg.stale ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Send className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">
                              Connected as @{tg.username}
                            </p>
                            <p className="text-sm text-neutral-500">
                              You'll get race alerts and notifications on Telegram
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleTelegramConnect}
                          disabled={tgConnecting}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {tgConnecting ? 'Relinking…' : 'Relink'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Send className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">Connect Telegram</p>
                            <p className="text-sm text-neutral-500">
                              Get 100 XP and race alerts on Telegram
                            </p>
                          </div>
                        </div>
                        {tg.stale && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Telegram disconnected — reconnect to keep receiving alerts
                          </p>
                        )}
                        <div>
                          <button
                            onClick={handleTelegramConnect}
                            disabled={tgConnecting}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            {tgConnecting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            {tg.stale ? 'Reconnect Telegram' : 'Connect Telegram'}
                          </button>
                        </div>
                      </div>
                    )}
                    {tgError && (
                      <p className="text-xs text-red-600 flex items-center gap-1 mt-2">
                        <AlertTriangle className="w-3 h-3" />
                        {tgError}
                      </p>
                    )}
                  </div>

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
                              : 'border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
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
                              : 'border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
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
                              : 'border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
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
                              : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
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
                              : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
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
                              : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
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

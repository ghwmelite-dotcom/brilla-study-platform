import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  GraduationCap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { EMAIL_VERIFICATION_REWARD_XP } from '@/lib/rewardConstants';
import { cn } from '@/utils';
import { Turnstile } from '@/components/common/Turnstile';
import { useTurnstile } from '@/hooks/useTurnstile';

export function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const turnstile = useTurnstile();

  const token = searchParams.get('token');
  const isEmailVerification = searchParams.get('mode') === 'verify-email';

  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const [password, setPasswordValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(0);

  // Password validation
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      return;
    }

    const verifyTokenAsync = async () => {
      const response = await api.verifyToken(token);
      if (response.success && response.data) {
        setIsValid(true);
        setUserName(response.data.name);
        setUserEmail(response.data.email);
      }
      setIsVerifying(false);
    };

    verifyTokenAsync();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEmailVerification) {
      if (!isPasswordValid) {
        setError('Please meet all password requirements.');
        return;
      }

      if (!passwordsMatch) {
        setError('Passwords do not match.');
        return;
      }
    }

    if (!turnstile.isVerified || !turnstile.token) {
      setError('Please complete the security check.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = isEmailVerification
        ? await api.verifyEmail(token!, turnstile.token)
        : await api.setPassword(token!, password, turnstile.token);
      if (response.success) {
        setXpAwarded(response.data?.xpAwarded ?? 0);
        setIsSuccess(true);
      } else {
        setError(response.error || (isEmailVerification ? 'Failed to verify email.' : 'Failed to set password.'));
        turnstile.reset();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEmailVerification
            ? 'Failed to verify email.'
            : 'Failed to set password.',
      );
      turnstile.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Verifying your link...</p>
        </div>
      </div>
    );
  }

  // Invalid or expired token
  if (!token || !isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Invalid or Expired Link
          </h1>
          <p className="text-neutral-600 mb-6">
            {isEmailVerification
              ? 'This email verification link is invalid or has expired. Please contact support to request a new verification email.'
              : 'This password setup link is invalid or has expired. Please contact your administrator to request a new link.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Go to Home
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            {isEmailVerification ? 'Email Verified!' : 'Password Set Successfully!'}
          </h1>
          <p className="text-neutral-600 mb-6">
            {isEmailVerification
              ? 'Your email address is confirmed. You can continue using BrillaPrep.'
              : 'Your password has been set. You can now log in to your account using your email and new password.'}
          </p>
          {xpAwarded > 0 && (
            <div
              role="status"
              className="mb-6 flex items-center justify-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
            >
              <Sparkles className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
              <div className="text-left">
                <p className="font-bold">+{xpAwarded} XP earned</p>
                <p className="text-sm text-amber-700">Your first reward is already in your XP history.</p>
              </div>
            </div>
          )}
          <button
            onClick={() => navigate('/', { state: { openLogin: true } })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            {isEmailVerification ? 'Continue to BrillaPrep' : 'Go to Login'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Password setup form
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-neutral-900">Brilla</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            {isEmailVerification ? 'Verify Your Email' : 'Set Up Your Password'}
          </h1>
          <p className="text-neutral-600">
            Welcome, <span className="font-medium text-neutral-900">{userName}</span>!
          </p>
          <p className="text-sm text-neutral-500 mt-1">{userEmail}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {!isEmailVerification && (
              <>
            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full pl-10 pr-10 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password requirements */}
            <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-medium text-neutral-600 uppercase tracking-wide mb-2">
                Password Requirements
              </p>
              {[
                { key: 'length', label: 'At least 8 characters' },
                { key: 'uppercase', label: 'One uppercase letter' },
                { key: 'lowercase', label: 'One lowercase letter' },
                { key: 'number', label: 'One number' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  {passwordChecks[key as keyof typeof passwordChecks] ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-neutral-300" />
                  )}
                  <span
                    className={cn(
                      passwordChecks[key as keyof typeof passwordChecks]
                        ? 'text-green-700'
                        : 'text-neutral-600'
                    )}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Confirm password field */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={cn(
                    'w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all',
                    confirmPassword && !passwordsMatch
                      ? 'border-red-300 bg-red-50'
                      : confirmPassword && passwordsMatch
                      ? 'border-green-300 bg-green-50'
                      : 'border-neutral-300'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  Passwords do not match
                </p>
              )}
              {confirmPassword && passwordsMatch && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Passwords match
                </p>
              )}
            </div>

              </>
            )}

            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-neutral-700">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900">Earn {EMAIL_VERIFICATION_REWARD_XP} XP</p>
                <p className="mt-1">Confirm your email to secure your account and unlock your first reward.</p>
              </div>
            </div>

            {/* Turnstile Security Check */}
            <div className="flex justify-center">
              <Turnstile
                onVerify={turnstile.handleVerify}
                onError={turnstile.handleError}
                onExpire={turnstile.handleExpire}
                theme="light"
                size="normal"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !turnstile.isVerified || (!isEmailVerification && (!isPasswordValid || !passwordsMatch))}
              className={cn(
                'w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                isSubmitting || !turnstile.isVerified || (!isEmailVerification && (!isPasswordValid || !passwordsMatch))
                  ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isEmailVerification ? 'Verifying Email...' : 'Setting Password...'}
                </>
              ) : (
                <>
                  {isEmailVerification
                    ? `Verify Email & Earn ${EMAIL_VERIFICATION_REWARD_XP} XP`
                    : `Set Password & Earn ${EMAIL_VERIFICATION_REWARD_XP} XP`}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-500 mt-6">
          Having trouble?{' '}
          <a href="mailto:support@brilla.edu.gh" className="text-primary hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}

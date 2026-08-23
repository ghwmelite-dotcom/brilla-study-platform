import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  XCircle,
} from 'lucide-react';
import { Turnstile } from '@/components/common/Turnstile';
import { useTurnstile } from '@/hooks/useTurnstile';
import { api } from '@/lib/api';
import { cn } from '@/utils';

const PASSWORD_MAX_LENGTH = 128;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const turnstile = useTurnstile();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordChecks = {
    length: password.length >= 8 && password.length <= PASSWORD_MAX_LENGTH,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError('This reset link is invalid. Please request a new password reset email.');
      return;
    }
    if (!isPasswordValid) {
      setError('Please meet all password requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }
    if (!turnstile.isVerified || !turnstile.token) {
      setError('Please complete the security check.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.resetPassword(token, password, turnstile.token);
      if (response.success) {
        setIsSuccess(true);
      } else {
        setError(response.error || 'Failed to reset password. Please request a new link and try again.');
        turnstile.reset();
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Failed to reset password. Please request a new link and try again.',
      );
      turnstile.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <PageShell>
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-neutral-900">Invalid Reset Link</h1>
          <p className="mb-6 text-neutral-600">
            This link is missing its secure reset token. Request a new password reset email and use the latest link.
          </p>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Return to BrillaPrep
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </PageShell>
    );
  }

  if (isSuccess) {
    return (
      <PageShell>
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl" role="status">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" aria-hidden="true" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-neutral-900">Password Reset Successfully</h1>
          <p className="mb-6 text-neutral-600">
            Your password has been changed and existing sessions have been signed out. You can now log in with your new password.
          </p>
          <button
            type="button"
            onClick={() => navigate('/', { state: { openLogin: true } })}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Go to Login
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark">
            <GraduationCap className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <span className="text-2xl font-bold text-neutral-900">BrillaPrep</span>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-neutral-900">Reset Your Password</h1>
        <p className="text-neutral-600">Create a strong new password for your account.</p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <PasswordField
            id="reset-password"
            name="password"
            label="New Password"
            value={password}
            show={showPassword}
            onChange={setPassword}
            onToggle={() => setShowPassword((current) => !current)}
            autoFocus
          />

          <div className="space-y-2 rounded-lg bg-neutral-50 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-600">Password requirements</p>
            {[
              { key: 'length', label: 'Between 8 and 128 characters' },
              { key: 'uppercase', label: 'One uppercase letter' },
              { key: 'lowercase', label: 'One lowercase letter' },
              { key: 'number', label: 'One number' },
            ].map(({ key, label }) => {
              const passed = passwordChecks[key as keyof typeof passwordChecks];
              return (
                <div key={key} className="flex items-center gap-2 text-sm">
                  {passed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border-2 border-neutral-300" aria-hidden="true" />
                  )}
                  <span className={passed ? 'text-green-700' : 'text-neutral-600'}>{label}</span>
                </div>
              );
            })}
          </div>

          <PasswordField
            id="confirm-reset-password"
            name="confirmPassword"
            label="Confirm Password"
            value={confirmPassword}
            show={showConfirmPassword}
            onChange={setConfirmPassword}
            onToggle={() => setShowConfirmPassword((current) => !current)}
            invalid={confirmPassword.length > 0 && !passwordsMatch}
          />
          {confirmPassword && (
            <p className={cn('flex items-center gap-1 text-xs', passwordsMatch ? 'text-green-600' : 'text-red-600')}>
              {passwordsMatch ? (
                <CheckCircle className="h-3 w-3" aria-hidden="true" />
              ) : (
                <XCircle className="h-3 w-3" aria-hidden="true" />
              )}
              {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
            </p>
          )}

          <div className="flex justify-center">
            <Turnstile
              onVerify={turnstile.handleVerify}
              onError={turnstile.handleError}
              onExpire={turnstile.handleExpire}
              theme="light"
              size="normal"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !turnstile.isVerified || !isPasswordValid || !passwordsMatch}
            className={cn(
              'flex min-h-12 w-full items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              isSubmitting || !turnstile.isVerified || !isPasswordValid || !passwordsMatch
                ? 'cursor-not-allowed bg-neutral-200 text-neutral-500'
                : 'bg-primary text-white hover:bg-primary-dark',
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Resetting Password...
              </>
            ) : (
              <>
                Reset Password
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      </div>
    </PageShell>
  );
}

interface PasswordFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  show: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  autoFocus?: boolean;
  invalid?: boolean;
}

function PasswordField({
  id,
  name,
  label,
  value,
  show,
  onChange,
  onToggle,
  autoFocus = false,
  invalid = false,
}: PasswordFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-neutral-700">
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
        <input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          autoFocus={autoFocus}
          maxLength={PASSWORD_MAX_LENGTH}
          aria-invalid={invalid}
          required
          className={cn(
            'min-h-12 w-full rounded-lg border py-2.5 pl-10 pr-12 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary',
            invalid ? 'border-red-300 bg-red-50' : 'border-neutral-300',
          )}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-neutral-500 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {show ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-secondary/5 p-4">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}

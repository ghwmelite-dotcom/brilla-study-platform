import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

type CallbackStatus = 'processing' | 'success' | 'error' | 'needs_registration' | 'pending_approval';

interface CallbackError {
  message: string;
  code?: string;
}

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeGoogleAuth } = useAuthStore();

  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [error, setError] = useState<CallbackError | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('Your registration is awaiting administrator approval.');
  const hasExchanged = useRef(false);

  useEffect(() => {
    if (hasExchanged.current) return;
    hasExchanged.current = true;

    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      // Check for OAuth errors from Google
      if (errorParam) {
        const errorDesc = searchParams.get('error_description') || 'Authentication was cancelled';
        setStatus('error');
        setError({ message: errorDesc, code: errorParam });
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        setStatus('error');
        setError({ message: 'Invalid callback. Missing required parameters.' });
        return;
      }

      // Verify state matches what we stored
      const storedState = sessionStorage.getItem('oauth_state');
      if (!storedState || storedState !== state) {
        setStatus('error');
        setError({ message: 'Security verification failed. Please try again.', code: 'STATE_MISMATCH' });
        return;
      }

      try {
        const result = await completeGoogleAuth(code, state);

        if (result.success) {
          setIsNewUser(result.isNewUser || false);

          // Clear stored state once the one-time callback is consumed.
          sessionStorage.removeItem('oauth_state');

          if (result.requiresApproval) {
            setPendingMessage(result.message || 'Your registration is awaiting administrator approval.');
            setStatus('pending_approval');
            return;
          }

          setStatus('success');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1500);
        } else {
          // Handle specific error cases
          if (result.code === 'NO_ACCOUNT') {
            setStatus('needs_registration');
            setError({ message: result.error || 'No account found', code: result.code });
          } else {
            setStatus('error');
            setError({ message: result.error || 'Authentication failed', code: result.code });
          }
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setError({
          message: err instanceof Error ? err.message : 'An unexpected error occurred',
        });
      }
    };

    handleCallback();
  }, [searchParams, completeGoogleAuth, navigate]);

  const handleRetry = () => {
    sessionStorage.removeItem('oauth_state');
    navigate('/', { replace: true });
  };

  const handleGoToRegister = () => {
    sessionStorage.removeItem('oauth_state');
    navigate('/?register=true', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Signing you in...
            </h1>
            <p className="text-gray-600">
              Please wait while we complete your authentication with Google.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isNewUser ? 'Welcome to Brilla Prep!' : 'Welcome back!'}
            </h1>
            <p className="text-gray-600">
              {isNewUser
                ? 'Your account has been created successfully.'
                : 'You have been signed in successfully.'}
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to dashboard...
            </p>
          </>
        )}

        {status === 'pending_approval' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Registration received
            </h1>
            <p className="text-gray-600 mb-6">{pendingMessage}</p>
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="w-full min-h-12 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-colors"
            >
              Return home
            </button>
          </>
        )}

        {status === 'needs_registration' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              No Account Found
            </h1>
            <p className="text-gray-600 mb-6">
              We couldn't find an account with this Google email. Would you like to create one?
            </p>
            <div className="space-y-3">
              <button
                onClick={handleGoToRegister}
                className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg
                         hover:bg-blue-700 transition-colors"
              >
                Create an Account
              </button>
              <button
                onClick={handleRetry}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg
                         hover:bg-gray-200 transition-colors"
              >
                Try Different Account
              </button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Failed
            </h1>
            <p className="text-gray-600 mb-6">
              {error?.message || 'Something went wrong during authentication.'}
            </p>
            {error?.code && (
              <p className="text-xs text-gray-400 mb-4">
                Error code: {error.code}
              </p>
            )}
            <button
              onClick={handleRetry}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg
                       hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default OAuthCallback;

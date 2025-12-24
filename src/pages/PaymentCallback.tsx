import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight, Home } from 'lucide-react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

type PaymentStatus = 'verifying' | 'success' | 'failed';

export default function PaymentCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyPayment } = useSubscriptionStore();

  const [status, setStatus] = useState<PaymentStatus>('verifying');
  const [planName, setPlanName] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');

    if (!reference) {
      setStatus('failed');
      setErrorMessage('No payment reference found');
      return;
    }

    const verify = async () => {
      try {
        const result = await verifyPayment(reference);

        if (result.success) {
          setStatus('success');
          setPlanName(result.planId || 'Premium');
          setExpiresAt(result.expiresAt || '');
        } else {
          setStatus('failed');
          setErrorMessage('Payment verification failed. Please contact support if you were charged.');
        }
      } catch {
        setStatus('failed');
        setErrorMessage('An error occurred while verifying your payment.');
      }
    };

    verify();
  }, [searchParams, verifyPayment]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {status === 'verifying' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Verifying Payment
            </h1>
            <p className="text-neutral-600">
              Please wait while we confirm your payment...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-neutral-600 mb-6">
              Welcome to Brilla Premium! Your subscription is now active.
            </p>

            <div className="bg-neutral-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-neutral-500">Plan</span>
                <span className="font-semibold text-neutral-900">{planName}</span>
              </div>
              {expiresAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-500">Valid Until</span>
                  <span className="font-semibold text-neutral-900">{formatDate(expiresAt)}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/affiliate')}
                className="w-full py-3 px-4 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors"
              >
                Start Earning with Affiliates
              </button>
            </div>

            <p className="text-xs text-neutral-500 mt-6">
              A confirmation email has been sent to your registered email address.
            </p>
          </div>
        )}

        {status === 'failed' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Payment Failed
            </h1>
            <p className="text-neutral-600 mb-6">
              {errorMessage}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/pricing')}
                className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 px-4 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            <p className="text-xs text-neutral-500 mt-6">
              If you believe this is an error, please contact support at support@brillaprep.org
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

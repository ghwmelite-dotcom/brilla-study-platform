import { useEffect, useRef, useCallback, useState } from 'react';
import { ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

// Cloudflare Turnstile site key
const TURNSTILE_SITE_KEY = '0x4AAAAAACI3PQNt3LlgVfOJ';

// Declare Turnstile types
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: TurnstileOptions
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  tabindex?: number;
  'response-field'?: boolean;
  'response-field-name'?: string;
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

export function Turnstile({
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  className = '',
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Use refs for callbacks to prevent re-renders
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onErrorRef.current = onError;
    onExpireRef.current = onExpire;
  }, [onVerify, onError, onExpire]);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile) {
      return;
    }

    // Remove existing widget if any
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      } catch {
        // Widget might already be removed
      }
    }

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => {
          setStatus('ready');
          onVerifyRef.current(token);
        },
        'error-callback': () => {
          console.error('Turnstile: error callback triggered');
          setStatus('error');
          onErrorRef.current?.();
        },
        'expired-callback': () => {
          onExpireRef.current?.();
        },
        theme,
        size,
      });
      setStatus('ready');
    } catch (err) {
      console.error('Turnstile render error:', err);
      setStatus('error');
      onErrorRef.current?.();
    }
  }, [theme, size]);

  const handleRetry = useCallback(() => {
    setStatus('loading');
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        renderWidget();
      }
    } else {
      renderWidget();
    }
  }, [renderWidget]);

  useEffect(() => {
    let mounted = true;

    const initTurnstile = () => {
      if (!mounted) return;

      // Give the DOM a moment to be ready
      requestAnimationFrame(() => {
        if (mounted && containerRef.current) {
          renderWidget();
        }
      });
    };

    // Check if script is already loaded and turnstile is available
    if (window.turnstile) {
      initTurnstile();
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(
      'script[src*="challenges.cloudflare.com/turnstile"]'
    );

    if (existingScript) {
      // Script exists, wait for it to load
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval);
          initTurnstile();
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.turnstile && mounted) {
          setStatus('error');
        }
      }, 10000);

      return () => {
        mounted = false;
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }

    // Load the Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';
    script.async = true;

    // Set up the callback
    window.onTurnstileLoad = () => {
      if (mounted) {
        initTurnstile();
      }
    };

    script.onerror = () => {
      console.error('Turnstile: Failed to load script');
      if (mounted) {
        setStatus('error');
        onErrorRef.current?.();
      }
    };

    document.head.appendChild(script);

    return () => {
      mounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore
        }
      }
    };
  }, [renderWidget]);

  return (
    <div className={`relative ${className}`}>
      {/* Always render the container for Turnstile to use */}
      <div
        ref={containerRef}
        className={status === 'loading' ? 'min-h-[65px]' : ''}
      />

      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-900/80">
          <div className="flex items-center gap-2 text-neutral-500">
            <ShieldCheck className="w-5 h-5 animate-pulse" />
            <span className="text-sm">Loading security check...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">Security check failed</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

// Hook for managing Turnstile token state
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = useCallback((newToken: string) => {
    setToken(newToken);
    setIsVerified(true);
  }, []);

  const handleError = useCallback(() => {
    setToken(null);
    setIsVerified(false);
  }, []);

  const handleExpire = useCallback(() => {
    setToken(null);
    setIsVerified(false);
  }, []);

  const reset = useCallback(() => {
    setToken(null);
    setIsVerified(false);
  }, []);

  return {
    token,
    isVerified,
    handleVerify,
    handleError,
    handleExpire,
    reset,
  };
}

export default Turnstile;

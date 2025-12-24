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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return;

    // Remove existing widget if any
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Widget might already be removed
      }
    }

    setIsLoading(false);
    setHasError(false);

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => {
          onVerify(token);
        },
        'error-callback': () => {
          setHasError(true);
          onError?.();
        },
        'expired-callback': () => {
          onExpire?.();
        },
        theme,
        size,
      });
    } catch {
      setHasError(true);
      onError?.();
    }
  }, [onVerify, onError, onExpire, theme, size]);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    renderWidget();
  };

  useEffect(() => {
    // Check if script is already loaded
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Check if script is being loaded
    const existingScript = document.querySelector(
      'script[src*="challenges.cloudflare.com/turnstile"]'
    );

    if (existingScript) {
      // Wait for existing script to load
      const checkTurnstile = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkTurnstile);
          renderWidget();
        }
      }, 100);

      return () => clearInterval(checkTurnstile);
    }

    // Load the Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Small delay to ensure turnstile is fully initialized
      setTimeout(renderWidget, 100);
    };

    script.onerror = () => {
      setIsLoading(false);
      setHasError(true);
      onError?.();
    };

    document.head.appendChild(script);

    // Cleanup
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Widget might already be removed
        }
      }
    };
  }, [renderWidget, onError]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-4 ${className}`}>
        <div className="flex items-center gap-2 text-neutral-500">
          <ShieldCheck className="w-5 h-5 animate-pulse" />
          <span className="text-sm">Loading security check...</span>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`flex flex-col items-center gap-2 py-4 ${className}`}>
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
    );
  }

  return <div ref={containerRef} className={className} />;
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

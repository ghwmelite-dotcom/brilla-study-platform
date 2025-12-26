import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  /** Whether to show the full-screen version or inline version */
  fullScreen?: boolean;
  /** Custom message to display */
  message?: string;
  /** Minimum display time in ms (prevents flash) */
  minDisplayTime?: number;
}

export function LoadingScreen({
  fullScreen = true,
  message,
  minDisplayTime = 0
}: LoadingScreenProps) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (minDisplayTime > 0) {
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setVisible(false), 500);
      }, minDisplayTime);
      return () => clearTimeout(timer);
    }
  }, [minDisplayTime]);

  if (!visible) return null;

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-[9999]'
    : 'relative min-h-[400px]';

  return (
    <div
      className={`${containerClasses} flex items-center justify-center overflow-hidden transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1e3a8a 50%, #0d2447 100%)' }}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-conic from-indigo-500 via-emerald-500 to-indigo-500 animate-spin-slow blur-3xl"
             style={{ animationDuration: '20s' }} />
      </div>

      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full blur-xl animate-float"
            style={{
              width: `${80 + i * 40}px`,
              height: `${80 + i * 40}px`,
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              background: i % 2 === 0
                ? 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${4 + i}s`,
            }}
          />
        ))}
      </div>

      {/* Central loading animation */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Orbital rings */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-spin-slow"
               style={{ animationDuration: '8s' }}>
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
          </div>

          {/* Middle ring */}
          <div className="absolute inset-4 rounded-full border-2 border-indigo-400/30 animate-spin-slow"
               style={{ animationDuration: '6s', animationDirection: 'reverse' }}>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/50" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
          </div>

          {/* Inner ring */}
          <div className="absolute inset-8 rounded-full border border-white/20 animate-spin-slow"
               style={{ animationDuration: '4s' }}>
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50" />
          </div>

          {/* Pulsing center glow */}
          <div className="absolute inset-12 rounded-full bg-gradient-to-br from-indigo-600 to-emerald-600 opacity-20 animate-pulse blur-xl" />

          {/* Central logo container */}
          <div className="absolute inset-12 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl flex items-center justify-center border border-white/10">
            {/* Animated B logo */}
            <div className="relative">
              <span
                className="text-5xl sm:text-6xl font-bold bg-gradient-to-br from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent animate-pulse"
                style={{ fontFamily: 'Poppins, sans-serif', animationDuration: '2s' }}
              >
                B
              </span>
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer" />
            </div>
          </div>

          {/* Floating particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white animate-twinkle"
              style={{
                left: `${50 + 45 * Math.cos((i * 30 * Math.PI) / 180)}%`,
                top: `${50 + 45 * Math.sin((i * 30 * Math.PI) / 180)}%`,
                animationDelay: `${i * 0.2}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>

        {/* Loading text with wave effect */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1">
            {'BRILLA'.split('').map((letter, i) => (
              <span
                key={i}
                className="text-lg sm:text-xl font-bold text-white/90 animate-wave"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  animationDelay: `${i * 0.1}s`,
                  textShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
                }}
              >
                {letter}
              </span>
            ))}
          </div>

          {message && (
            <p className="text-sm text-white/60 animate-pulse">
              {message}
            </p>
          )}

          {/* Animated loading bar */}
          <div className="w-48 h-1 mt-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 animate-loading-bar" />
          </div>
        </div>
      </div>

      {/* Bottom decorative wave */}
      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden opacity-30">
        <svg className="absolute bottom-0 w-full h-32" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path
            className="animate-wave-path"
            fill="url(#wave-gradient)"
            d="M0,64 C288,96 576,32 864,64 C1152,96 1296,32 1440,64 L1440,120 L0,120 Z"
          />
          <defs>
            <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-200%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes wave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }

        @keyframes wave-path {
          0%, 100% { d: path('M0,64 C288,96 576,32 864,64 C1152,96 1296,32 1440,64 L1440,120 L0,120 Z'); }
          50% { d: path('M0,64 C288,32 576,96 864,64 C1152,32 1296,96 1440,64 L1440,120 L0,120 Z'); }
        }

        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 3s ease-in-out infinite; }
        .animate-twinkle { animation: twinkle 2s ease-in-out infinite; }
        .animate-wave { animation: wave 1.5s ease-in-out infinite; }
        .animate-loading-bar { animation: loading-bar 2s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 8s linear infinite; }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Simpler inline loader for page transitions
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="relative">
        {/* Orbital loader */}
        <div className="w-16 h-16 relative">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 border-r-emerald-500/50 animate-spin" />

          {/* Inner ring */}
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-indigo-500 border-l-indigo-500/50 animate-spin"
               style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />

          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-indigo-500 animate-pulse" />
          </div>
        </div>

        {/* Floating particles */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400/60"
            style={{
              left: `${50 + 35 * Math.cos((i * 90 * Math.PI) / 180)}%`,
              top: `${50 + 35 * Math.sin((i * 90 * Math.PI) / 180)}%`,
              transform: 'translate(-50%, -50%)',
              animation: `twinkle 1.5s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
        }
      `}</style>
    </div>
  );
}

export default LoadingScreen;

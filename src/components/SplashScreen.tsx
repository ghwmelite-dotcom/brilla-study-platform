import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

/**
 * Brilla brand splash — the in-app beat of the launch sequence
 * (PWA splash image → index.html initial loader → this → app).
 * Light paper surface, the Brilla orb, one continuous gradient language.
 * Delight comes from restraint: a springy orb entrance, a slow shine
 * sweep across the mark, and a letter-staggered wordmark. No starfields.
 */
export function SplashScreen({ onComplete, duration = 1800 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 100 : prev + 2));
    }, duration / 50);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete?.(), 500);
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration, onComplete]);

  const wordmark = 'Brilla Prep';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="brilla-splash"
        >
          <style>{`
            .brilla-splash {
              position: fixed;
              inset: 0;
              z-index: 99999;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background:
                radial-gradient(circle at 50% 40%, rgba(246, 209, 35, 0.10) 0%, transparent 55%),
                #FFFDF7;
              overflow: hidden;
              font-family: 'Poppins', 'Inter', system-ui, sans-serif;
            }

            /* Soft brand blooms drifting almost imperceptibly */
            .brilla-splash .bloom {
              position: absolute;
              border-radius: 50%;
              filter: blur(46px);
              animation: bloomDrift 9s ease-in-out infinite;
            }
            @keyframes bloomDrift {
              0%, 100% { transform: translate(0, 0); }
              50% { transform: translate(14px, -18px); }
            }

            /* Gradient ring sweeping around the orb */
            .brilla-splash .ring {
              position: absolute;
              inset: 0;
              border-radius: 50%;
              background: conic-gradient(from 0deg, #3FAE4A, #8DC63F, #F6D123, #F9A825, #F5871F, rgba(245, 135, 31, 0));
              -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px));
              mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px));
              animation: ringSpin 1.6s linear infinite;
            }
            @keyframes ringSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }

            /* Shine sweeping across the orb once it lands */
            .brilla-splash .orb-shine {
              position: absolute;
              inset: 0;
              border-radius: 50%;
              overflow: hidden;
            }
            .brilla-splash .orb-shine::after {
              content: '';
              position: absolute;
              top: -20%;
              bottom: -20%;
              width: 45%;
              left: -60%;
              background: linear-gradient(105deg, transparent, rgba(255, 255, 255, 0.45), transparent);
              transform: skewX(-18deg);
              animation: shineSweep 2.4s ease-in-out 0.55s infinite;
            }
            @keyframes shineSweep {
              0% { left: -60%; }
              55%, 100% { left: 125%; }
            }

            .brilla-splash .tagline {
              font-family: 'Inter', system-ui, sans-serif;
              font-size: 13px;
              letter-spacing: 2.5px;
              color: #6B7F74;
            }
          `}</style>

          {/* Ambient blooms */}
          <div className="bloom" style={{ width: 260, height: 260, left: '8%', top: '14%', background: 'rgba(63, 174, 74, 0.10)' }} />
          <div className="bloom" style={{ width: 210, height: 210, right: '10%', top: '32%', background: 'rgba(246, 209, 35, 0.12)', animationDelay: '1.2s' }} />
          <div className="bloom" style={{ width: 230, height: 230, left: '16%', bottom: '12%', background: 'rgba(245, 135, 31, 0.09)', animationDelay: '2.1s' }} />

          {/* Orb + ring */}
          <div style={{ position: 'relative', width: 148, height: 148 }}>
            <div className="ring" />
            <motion.div
              initial={{ scale: 0.55, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 210, damping: 17, delay: 0.1 }}
              style={{ position: 'absolute', inset: 15 }}
            >
              <div className="orb-shine">
                <svg viewBox="0 0 512 512" style={{ width: '100%', height: '100%', display: 'block' }}>
                  <defs>
                    <linearGradient id="splashOrb" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3FAE4A" />
                      <stop offset="30%" stopColor="#8DC63F" />
                      <stop offset="55%" stopColor="#F6D123" />
                      <stop offset="80%" stopColor="#F9A825" />
                      <stop offset="100%" stopColor="#F5871F" />
                    </linearGradient>
                    <radialGradient id="splashSheen" cx="32%" cy="26%" r="65%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
                      <stop offset="60%" stopColor="#ffffff" stopOpacity="0.06" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <circle cx="256" cy="256" r="256" fill="url(#splashOrb)" />
                  <circle cx="256" cy="256" r="256" fill="url(#splashSheen)" />
                  <text x="256" y="348" fontFamily="Poppins, Arial, Helvetica, sans-serif" fontSize="300" fontWeight="800" fill="#ffffff" textAnchor="middle">B</text>
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Wordmark — letter stagger */}
          <div style={{ display: 'flex', marginTop: 30, gap: 1 }}>
            {wordmark.split('').map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.035, duration: 0.35, ease: 'easeOut' }}
                style={{
                  fontSize: 27,
                  fontWeight: 800,
                  color: '#14532D',
                  letterSpacing: 1,
                  whiteSpace: 'pre',
                }}
              >
                {ch}
              </motion.span>
            ))}
          </div>

          {/* Tagline */}
          <motion.p
            className="tagline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.5 }}
            style={{ marginTop: 10 }}
          >
            LEARN. PRACTICE. SHINE.
          </motion.p>

          {/* Progress bar */}
          <div style={{ width: 132, height: 5, background: 'rgba(20, 83, 45, 0.08)', borderRadius: 9999, overflow: 'hidden', marginTop: 22 }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #3FAE4A, #F6D123, #F5871F)',
                borderRadius: 9999,
                transition: 'width 60ms linear',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SplashScreen;

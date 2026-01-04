import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 3500 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
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

  // Generate orbital particles with Ghana colors (green, gold, red)
  const particles = Array.from({ length: 45 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    orbitRadius: 80 + Math.random() * 180,
    duration: 8 + Math.random() * 12,
    delay: Math.random() * -20,
    opacity: Math.random() * 0.6 + 0.4,
    colorType: i % 3 === 0 ? 'gold' : i % 3 === 1 ? 'green' : 'red',
  }));

  // Generate background stars
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 2,
  }));

  // Adinkra-inspired geometric shapes
  const adinkraElements = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    rotation: i * 60,
    scale: 0.8 + Math.random() * 0.4,
  }));

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="splash-screen"
        >
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');

            .splash-screen {
              position: fixed;
              inset: 0;
              z-index: 99999;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background:
                radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 107, 63, 0.12) 0%, transparent 50%),
                radial-gradient(ellipse 60% 40% at 80% 100%, rgba(206, 17, 38, 0.08) 0%, transparent 50%),
                radial-gradient(ellipse 50% 30% at 10% 60%, rgba(252, 209, 22, 0.06) 0%, transparent 50%),
                radial-gradient(ellipse 40% 40% at 50% 50%, rgba(0, 107, 63, 0.05) 0%, transparent 60%),
                linear-gradient(180deg, #020805 0%, #040a08 30%, #080d0a 70%, #050807 100%);
              overflow: hidden;
              font-family: 'Cinzel', serif;
            }

            /* Animated cosmic dust overlay with Ghana colors */
            .splash-screen::before {
              content: '';
              position: absolute;
              inset: 0;
              background-image:
                radial-gradient(1.5px 1.5px at 20px 30px, rgba(0, 107, 63, 0.5), transparent),
                radial-gradient(1px 1px at 40px 70px, rgba(252, 209, 22, 0.4), transparent),
                radial-gradient(1.5px 1.5px at 90px 40px, rgba(252, 209, 22, 0.5), transparent),
                radial-gradient(1px 1px at 130px 80px, rgba(206, 17, 38, 0.4), transparent),
                radial-gradient(1.2px 1.2px at 160px 120px, rgba(0, 107, 63, 0.4), transparent),
                radial-gradient(1px 1px at 180px 160px, rgba(252, 209, 22, 0.3), transparent);
              background-size: 200px 200px;
              animation: cosmicDrift 60s linear infinite;
              opacity: 0.7;
            }

            @keyframes cosmicDrift {
              from { transform: translateY(0) translateX(0); }
              to { transform: translateY(-200px) translateX(100px); }
            }

            /* Noise texture overlay */
            .splash-screen::after {
              content: '';
              position: absolute;
              inset: 0;
              background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
              opacity: 0.03;
              pointer-events: none;
            }

            .stars-container {
              position: absolute;
              inset: 0;
              overflow: hidden;
            }

            .star {
              position: absolute;
              border-radius: 50%;
              background: white;
              animation: twinkle var(--duration) ease-in-out infinite;
              animation-delay: var(--delay);
            }

            @keyframes twinkle {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.2); }
            }

            .central-glow {
              position: absolute;
              width: 600px;
              height: 600px;
              border-radius: 50%;
              background:
                radial-gradient(circle at 30% 30%, rgba(0, 107, 63, 0.12) 0%, transparent 40%),
                radial-gradient(circle at 70% 70%, rgba(206, 17, 38, 0.10) 0%, transparent 40%),
                radial-gradient(circle, rgba(252, 209, 22, 0.15) 0%, rgba(252, 209, 22, 0.08) 30%, transparent 60%);
              filter: blur(40px);
              animation: centralPulse 4s ease-in-out infinite;
            }

            @keyframes centralPulse {
              0%, 100% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.15); opacity: 1; }
            }

            .orbit-container {
              position: absolute;
              width: 400px;
              height: 400px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .orbital-particle {
              position: absolute;
              border-radius: 50%;
              animation: orbit var(--duration) linear infinite;
              animation-delay: var(--delay);
              box-shadow: 0 0 10px currentColor;
            }

            .orbital-particle.gold {
              background: linear-gradient(135deg, #fcd116, #f59e0b);
              box-shadow: 0 0 15px rgba(252, 209, 22, 0.7);
            }

            .orbital-particle.green {
              background: linear-gradient(135deg, #00a854, #006b3f);
              box-shadow: 0 0 15px rgba(0, 168, 84, 0.6);
            }

            .orbital-particle.red {
              background: linear-gradient(135deg, #ef4444, #ce1126);
              box-shadow: 0 0 15px rgba(206, 17, 38, 0.6);
            }

            @keyframes orbit {
              from { transform: rotate(0deg) translateX(var(--radius)) rotate(0deg); }
              to { transform: rotate(360deg) translateX(var(--radius)) rotate(-360deg); }
            }

            .adinkra-ring {
              position: absolute;
              width: 320px;
              height: 320px;
              border: 1px solid rgba(0, 107, 63, 0.2);
              border-radius: 50%;
              animation: adinkraRotate 30s linear infinite;
            }

            .adinkra-ring:nth-child(2) {
              width: 380px;
              height: 380px;
              border-color: rgba(252, 209, 22, 0.15);
              animation-direction: reverse;
              animation-duration: 40s;
            }

            .adinkra-ring:nth-child(3) {
              width: 440px;
              height: 440px;
              border-color: rgba(206, 17, 38, 0.12);
              animation-duration: 50s;
            }

            @keyframes adinkraRotate {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }

            .adinkra-symbol {
              position: absolute;
              width: 20px;
              height: 20px;
              border: 1.5px solid rgba(252, 209, 22, 0.4);
              transform: rotate(var(--rotation)) translateY(-160px);
            }

            .adinkra-symbol:nth-child(odd) {
              border-color: rgba(0, 107, 63, 0.4);
            }

            .adinkra-symbol:nth-child(3n) {
              border-color: rgba(206, 17, 38, 0.35);
            }

            .adinkra-symbol::before,
            .adinkra-symbol::after {
              content: '';
              position: absolute;
              background: rgba(252, 209, 22, 0.4);
            }

            .adinkra-symbol:nth-child(odd)::before,
            .adinkra-symbol:nth-child(odd)::after {
              background: rgba(0, 107, 63, 0.4);
            }

            .adinkra-symbol:nth-child(3n)::before,
            .adinkra-symbol:nth-child(3n)::after {
              background: rgba(206, 17, 38, 0.35);
            }

            .adinkra-symbol::before {
              width: 100%;
              height: 1.5px;
              top: 50%;
              transform: translateY(-50%);
            }

            .adinkra-symbol::after {
              width: 1.5px;
              height: 100%;
              left: 50%;
              transform: translateX(-50%);
            }

            .logo-container {
              position: relative;
              z-index: 10;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 2rem;
            }

            .star-logo {
              position: relative;
              width: 120px;
              height: 120px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .star-logo svg {
              width: 100%;
              height: 100%;
              filter: drop-shadow(0 0 30px rgba(252, 209, 22, 0.6))
                      drop-shadow(0 0 50px rgba(0, 107, 63, 0.3))
                      drop-shadow(0 0 70px rgba(206, 17, 38, 0.2));
              animation: starBreath 3s ease-in-out infinite;
            }

            @keyframes starBreath {
              0%, 100% {
                transform: scale(1) rotate(0deg);
                filter: drop-shadow(0 0 30px rgba(252, 209, 22, 0.6))
                        drop-shadow(0 0 50px rgba(0, 107, 63, 0.3))
                        drop-shadow(0 0 70px rgba(206, 17, 38, 0.2));
              }
              50% {
                transform: scale(1.08) rotate(3deg);
                filter: drop-shadow(0 0 40px rgba(252, 209, 22, 0.8))
                        drop-shadow(0 0 60px rgba(0, 107, 63, 0.4))
                        drop-shadow(0 0 80px rgba(206, 17, 38, 0.3));
              }
            }

            .star-inner-glow {
              position: absolute;
              width: 60px;
              height: 60px;
              background: radial-gradient(circle, rgba(252, 209, 22, 0.9) 0%, rgba(0, 107, 63, 0.3) 50%, transparent 70%);
              border-radius: 50%;
              filter: blur(10px);
              animation: innerGlow 2s ease-in-out infinite;
            }

            @keyframes innerGlow {
              0%, 100% { opacity: 0.6; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.3); }
            }

            .brand-text {
              text-align: center;
            }

            .brand-name {
              font-family: 'Cinzel', serif;
              font-size: 3.5rem;
              font-weight: 700;
              letter-spacing: 0.4em;
              text-transform: uppercase;
              background: linear-gradient(
                90deg,
                #ce1126 0%,
                #fcd116 20%,
                #006b3f 40%,
                #fcd116 60%,
                #ce1126 80%,
                #fcd116 100%
              );
              background-size: 300% auto;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              animation: shimmer 5s linear infinite;
              text-shadow: none;
              margin: 0;
              padding-right: -0.4em;
            }

            @keyframes shimmer {
              from { background-position: 200% center; }
              to { background-position: -200% center; }
            }

            .brand-suffix {
              font-family: 'Cormorant Garamond', serif;
              font-size: 1.1rem;
              font-weight: 400;
              letter-spacing: 0.5em;
              text-transform: uppercase;
              color: rgba(252, 209, 22, 0.9);
              margin-top: 0.5rem;
              font-style: italic;
            }

            .tagline {
              font-family: 'Cormorant Garamond', serif;
              font-size: 1.25rem;
              font-weight: 400;
              letter-spacing: 0.2em;
              color: rgba(255, 255, 255, 0.75);
              margin-top: 1rem;
              font-style: italic;
            }

            .tagline span {
              display: inline-block;
              animation: fadeInUp 0.5s ease-out forwards;
              opacity: 0;
            }

            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .progress-container {
              position: absolute;
              bottom: 80px;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 1rem;
              z-index: 10;
            }

            .progress-bar {
              width: 200px;
              height: 3px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 3px;
              overflow: hidden;
              position: relative;
            }

            .progress-fill {
              height: 100%;
              background: linear-gradient(90deg, #006b3f, #fcd116, #ce1126);
              border-radius: 3px;
              transition: width 0.1s ease-out;
              box-shadow: 0 0 20px rgba(252, 209, 22, 0.5);
            }

            .progress-text {
              font-family: 'Cormorant Garamond', serif;
              font-size: 0.85rem;
              letter-spacing: 0.3em;
              color: rgba(255, 255, 255, 0.5);
              text-transform: uppercase;
            }

            .corner-accent {
              position: absolute;
              width: 80px;
              height: 80px;
              border: 1.5px solid rgba(252, 209, 22, 0.25);
            }

            .corner-accent.top-left {
              top: 40px;
              left: 40px;
              border-right: none;
              border-bottom: none;
              border-color: rgba(0, 107, 63, 0.3);
            }

            .corner-accent.top-right {
              top: 40px;
              right: 40px;
              border-left: none;
              border-bottom: none;
              border-color: rgba(252, 209, 22, 0.3);
            }

            .corner-accent.bottom-left {
              bottom: 40px;
              left: 40px;
              border-right: none;
              border-top: none;
              border-color: rgba(252, 209, 22, 0.3);
            }

            .corner-accent.bottom-right {
              bottom: 40px;
              right: 40px;
              border-left: none;
              border-top: none;
              border-color: rgba(206, 17, 38, 0.3);
            }

            @media (max-width: 640px) {
              .brand-name {
                font-size: 2rem;
                letter-spacing: 0.3em;
              }

              .star-logo {
                width: 80px;
                height: 80px;
              }

              .central-glow {
                width: 300px;
                height: 300px;
              }

              .orbit-container {
                width: 250px;
                height: 250px;
              }

              .adinkra-ring {
                width: 200px;
                height: 200px;
              }

              .adinkra-ring:nth-child(2) {
                width: 240px;
                height: 240px;
              }

              .corner-accent {
                width: 40px;
                height: 40px;
              }

              .corner-accent.top-left,
              .corner-accent.top-right {
                top: 20px;
              }

              .corner-accent.bottom-left,
              .corner-accent.bottom-right {
                bottom: 20px;
              }

              .corner-accent.top-left,
              .corner-accent.bottom-left {
                left: 20px;
              }

              .corner-accent.top-right,
              .corner-accent.bottom-right {
                right: 20px;
              }
            }
          `}</style>

          {/* Background stars */}
          <div className="stars-container">
            {stars.map(star => (
              <div
                key={star.id}
                className="star"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  '--duration': `${star.duration}s`,
                  '--delay': `${star.delay}s`,
                } as React.CSSProperties}
              />
            ))}
          </div>

          {/* Corner accents */}
          <motion.div
            className="corner-accent top-left"
            initial={{ opacity: 0, x: -20, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
          <motion.div
            className="corner-accent top-right"
            initial={{ opacity: 0, x: 20, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          />
          <motion.div
            className="corner-accent bottom-left"
            initial={{ opacity: 0, x: -20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
          />
          <motion.div
            className="corner-accent bottom-right"
            initial={{ opacity: 0, x: 20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
          />

          {/* Central glow */}
          <motion.div
            className="central-glow"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />

          {/* Adinkra rings - Ghana flag colors */}
          <div className="adinkra-ring">
            {adinkraElements.map(el => (
              <div
                key={el.id}
                className="adinkra-symbol"
                style={{ '--rotation': `${el.rotation}deg` } as React.CSSProperties}
              />
            ))}
          </div>
          <div className="adinkra-ring" />
          <div className="adinkra-ring" />

          {/* Orbital particles */}
          <div className="orbit-container">
            {particles.map(particle => (
              <div
                key={particle.id}
                className={`orbital-particle ${particle.colorType}`}
                style={{
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  '--radius': `${particle.orbitRadius}px`,
                  '--duration': `${particle.duration}s`,
                  '--delay': `${particle.delay}s`,
                  opacity: particle.opacity,
                } as React.CSSProperties}
              />
            ))}
          </div>

          {/* Logo and text */}
          <motion.div
            className="logo-container"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div className="star-logo">
              <div className="star-inner-glow" />
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  {/* Gold gradient for main star - Ghana's Black Star */}
                  <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fcd116" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#fcd116" />
                  </linearGradient>
                  {/* Green accent gradient */}
                  <linearGradient id="starGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00a854" />
                    <stop offset="100%" stopColor="#006b3f" />
                  </linearGradient>
                  {/* Red accent gradient */}
                  <linearGradient id="starGradient3" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ce1126" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                {/* Outer star shape - Golden */}
                <path
                  d="M50 5 L61 35 L95 35 L68 55 L79 90 L50 70 L21 90 L32 55 L5 35 L39 35 Z"
                  fill="url(#starGradient)"
                  filter="url(#glow)"
                />
                {/* Inner green accent - left side */}
                <path
                  d="M50 20 L44 38 L25 38 L40 50 L34 70 L50 58"
                  fill="url(#starGradient2)"
                  opacity="0.7"
                />
                {/* Inner red accent - right side */}
                <path
                  d="M50 20 L56 38 L75 38 L60 50 L66 70 L50 58"
                  fill="url(#starGradient3)"
                  opacity="0.7"
                />
                {/* Center circle - bright gold */}
                <circle cx="50" cy="45" r="8" fill="#fcd116" opacity="0.95" />
                <circle cx="50" cy="45" r="4" fill="#ffffff" opacity="0.8" />
              </svg>
            </div>

            <div className="brand-text">
              <motion.h1
                className="brand-name"
                initial={{ opacity: 0, letterSpacing: '0.8em' }}
                animate={{ opacity: 1, letterSpacing: '0.4em' }}
                transition={{ duration: 1.2, delay: 0.5 }}
              >
                Brilla
              </motion.h1>
              <motion.p
                className="brand-suffix"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                Prep
              </motion.p>
              <motion.p
                className="tagline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.3 }}
              >
                {'Ignite Your Brilliance'.split('').map((char, i) => (
                  <span
                    key={i}
                    style={{ animationDelay: `${1.5 + i * 0.05}s` }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </motion.p>
            </div>
          </motion.div>

          {/* Progress indicator */}
          <motion.div
            className="progress-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.8 }}
          >
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-text">Preparing Excellence</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SplashScreen;

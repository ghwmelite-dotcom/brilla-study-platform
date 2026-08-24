import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Brain,
  Trophy,
  Zap,
  Target,
  Users,
  ArrowRight,
  Star,
  CheckCircle2,
  GraduationCap,
  Award,
  TrendingUp,
  Clock,
  Shield,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Quote,
  Menu,
  X,
  Download,
  Smartphone,
  Heart,
  FileText,
  Video,
  Headphones,
  BarChart3,
  Flame,
  Swords,
  Library,
  PenTool,
  MessageCircle,
  Crown,
  Gift,
  DollarSign,
  Coins,
  Rocket,
  BadgeCheck,
  PartyPopper,
  VideoIcon,
  Presentation,
  Calendar,
  Wallet,
  Percent,
  Search,
  Play,
  Mic,
  Focus,
  Volume2,
  UsersRound,
  Maximize,
  Headset,
  Layers,
} from 'lucide-react';
import { cn } from '@/utils';
import { AuthModal } from '@/components/auth';
import {
  SITE_CONFIG,
  TRIAL_CONFIG,
  PRICING_CONFIG,
  AFFILIATE_CONFIG,
  ANIMATION_CONFIG,
  formatRefRange,
  formatCommissionRate,
} from '@/config/landing';

// ============================================
// HOOKS
// ============================================

// Consolidated scroll state hook - single listener for all scroll-dependent state
function useScrollState() {
  const [state, setState] = useState({
    isHeaderScrolled: false,  // scrollY > 50
    showFloatingCTA: false,   // scrollY > 500
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setState({
        isHeaderScrolled: scrollY > 50,
        showFloatingCTA: scrollY > 500,
      });
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return state;
}

// Intersection observer hook for scroll animations
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// Mouse parallax hook with throttling for performance
function useMouseParallax(intensity = 0.02) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const lastUpdate = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      // Throttle to max 60fps (16ms between updates)
      if (now - lastUpdate.current < 16) return;

      // Use requestAnimationFrame for smooth updates
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      rafId.current = requestAnimationFrame(() => {
        const x = (e.clientX - window.innerWidth / 2) * intensity;
        const y = (e.clientY - window.innerHeight / 2) * intensity;
        setPosition({ x, y });
        lastUpdate.current = now;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [intensity]);

  return position;
}

// PWA Install prompt hook
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    setDeferredPrompt(null);
    return outcome === 'accepted';
  }, [deferredPrompt]);

  return { isInstallable, isInstalled, install };
}

// ============================================
// COMPONENTS
// ============================================

// Animated gradient orb
function GradientOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div
      className={cn(
        'absolute rounded-full blur-3xl opacity-50 animate-morph',
        className
      )}
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

// Floating particle
function Particle({ style, size = 4 }: { style?: React.CSSProperties; size?: number }) {
  return (
    <div
      className="absolute rounded-full bg-white/20 animate-float-particle"
      style={{
        width: size,
        height: size,
        ...style,
      }}
    />
  );
}

// 3D Card component with tilt effect
function Card3D({ children, className }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  return (
    <div
      ref={cardRef}
      className={cn('transition-transform duration-300 ease-out', className)}
      style={{ transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

// Typewriter effect component using refs to avoid closure issues
function TypewriterText({ texts }: { texts: string[] }) {
  const [displayText, setDisplayText] = useState('');

  // Use refs to track mutable state without triggering re-renders
  const stateRef = useRef({
    wordIndex: 0,
    charIndex: 0,
    isDeleting: false,
    isPaused: false
  });

  useEffect(() => {
    const tick = () => {
      const state = stateRef.current;
      const currentWord = texts[state.wordIndex];

      const { typewriter } = ANIMATION_CONFIG;

      if (state.isPaused) {
        // After pause, start deleting
        state.isPaused = false;
        state.isDeleting = true;
        return 200;
      }

      if (!state.isDeleting) {
        // Typing forward
        state.charIndex++;
        setDisplayText(currentWord.slice(0, state.charIndex));

        if (state.charIndex >= currentWord.length) {
          // Finished typing, pause to let user read
          state.isPaused = true;
          return typewriter.pauseAfterWord;
        }
        // Human-like typing speed with slight variation
        const { min, max } = typewriter.typingSpeed;
        return min + Math.random() * (max - min);
      } else {
        // Deleting backward
        state.charIndex--;
        setDisplayText(currentWord.slice(0, state.charIndex));

        if (state.charIndex <= 0) {
          // Finished deleting, move to next word
          state.isDeleting = false;
          state.wordIndex = (state.wordIndex + 1) % texts.length;
          return typewriter.pauseBeforeNextWord;
        }
        return typewriter.deletingSpeed;
      }
    };

    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const delay = tick();
      timeoutId = setTimeout(scheduleNext, delay);
    };

    // Start the animation
    timeoutId = setTimeout(scheduleNext, 100);

    return () => clearTimeout(timeoutId);
  }, [texts]);

  return (
    <>
      {displayText}
      <span
        className="animate-blink"
        style={{ color: '#FFD700', WebkitTextFillColor: '#FFD700' }}
      >
        |
      </span>
    </>
  );
}

// Stat item component
function StatItem({ stat, index, inView }: { stat: typeof stats[0]; index: number; inView: boolean }) {
  return (
    <div
      className={cn(
        'relative group',
        inView ? 'animate-scale-in' : 'opacity-0'
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
      <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 text-center hover:border-white/20 transition-all h-full flex flex-col items-center justify-center">
        <div className="inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
          <stat.icon className="w-5 h-5 sm:w-7 sm:h-7 text-secondary" />
        </div>
        <div className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1 leading-tight">
          {stat.text}
        </div>
        <div className="text-white/70 text-xs sm:text-sm leading-tight">{stat.label}</div>
      </div>
    </div>
  );
}

// Landing Header Component
interface LandingHeaderProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  isScrolled: boolean;
}

function LandingHeader({ onOpenAuth, isScrolled }: LandingHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isInstallable, install } = usePWAInstall();

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled
          ? 'bg-slate-900/80 backdrop-blur-xl border-b border-white/10 py-3'
          : 'bg-transparent py-6'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative w-11 h-11 bg-gradient-to-br from-primary via-primary-dark to-secondary rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">B</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-2xl text-white leading-tight">
              Brilla Prep
            </span>
            <span className="text-[10px] text-white/60 tracking-wider">Prepare. Excel. Succeed.</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-2">
          {/* PWA Install Button */}
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white transition-colors mr-4"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Install App</span>
            </button>
          )}

          {/* Sign In Button */}
          <button
            onClick={() => onOpenAuth('login')}
            className="flex items-center gap-2 px-5 py-2.5 text-white/80 hover:text-white font-medium transition-colors"
          >
            Sign In
          </button>

          {/* Get Started Button */}
          <button
            onClick={() => onOpenAuth('register')}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-secondary to-yellow-400 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-secondary to-yellow-400 rounded-full font-semibold text-slate-900 hover:shadow-xl hover:shadow-secondary/30 transition-all">
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 text-white/80 hover:text-white transition-colors"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        'lg:hidden absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 transition-all duration-300 overflow-hidden',
        isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="p-4 space-y-3">
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition-all"
            >
              <Download className="w-5 h-5" />
              <span>Install App</span>
            </button>
          )}
          <button
            onClick={() => { setIsMobileMenuOpen(false); onOpenAuth('login'); }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white/10 text-white font-medium transition-all hover:bg-white/20"
          >
            <Shield className="w-5 h-5" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => { setIsMobileMenuOpen(false); onOpenAuth('register'); }}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-secondary to-yellow-400 text-slate-900 font-semibold"
          >
            Create Account
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

// Promotional Popup Component
function PromoPopup({ onOpenAuth }: { onOpenAuth: (mode: 'login' | 'register') => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed before
    const dismissed = sessionStorage.getItem('brilla_promo_dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show popup after 8 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('brilla_promo_dismissed', 'true');
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleDismiss}
      />

      {/* Popup */}
      <div className="relative w-full max-w-md sm:max-w-lg animate-scale-in">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 rounded-3xl blur-2xl opacity-30 animate-pulse-glow" />

        <div className="relative bg-slate-900 rounded-3xl overflow-hidden border border-white/10">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close promotional popup"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" aria-hidden="true" />
          </button>

          {/* Header with split gradient */}
          <div className="relative h-24 sm:h-28 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 flex items-center justify-center overflow-hidden">
            {/* Animated particles */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/30 animate-float"
                style={{
                  left: `${10 + i * 12}%`,
                  top: `${20 + (i % 3) * 25}%`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
            <div className="relative text-center">
              <p className="text-white/90 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Start Learning Today</p>
              <p className="text-white text-xl sm:text-2xl font-bold">Free Forever + Premium Trial</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {/* Two-column comparison */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-5">
              {/* Free Column */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 sm:p-3">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-emerald-400 font-bold text-xs sm:text-sm">FREE</span>
                </div>
                <ul className="space-y-1 sm:space-y-1.5">
                  {['10 questions/day', '4 core subjects', 'Full E-Library', 'Community'].map((item) => (
                    <li key={item} className="flex items-center gap-1 sm:gap-1.5 text-white/70 text-[10px] sm:text-xs">
                      <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Premium Column */}
              <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-xl p-2.5 sm:p-3 relative">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <span className="px-1.5 sm:px-2 py-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full text-white text-[8px] sm:text-[10px] font-bold">
                    7 DAYS FREE
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 mt-1">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                  </div>
                  <span className="text-purple-400 font-bold text-xs sm:text-sm">PREMIUM</span>
                </div>
                <ul className="space-y-1 sm:space-y-1.5">
                  {['Unlimited questions', 'All 9+ subjects', 'AI Essay Grading', 'Priority AI'].map((item) => (
                    <li key={item} className="flex items-center gap-1 sm:gap-1.5 text-white/70 text-[10px] sm:text-xs">
                      <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2 sm:space-y-2.5">
              <button
                onClick={() => { handleDismiss(); onOpenAuth('register'); }}
                className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl font-semibold text-white text-sm sm:text-base hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 group"
              >
                <Rocket className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
                Start 7-Day Premium Trial
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => { handleDismiss(); onOpenAuth('register'); }}
                className="w-full py-2.5 sm:py-3 border border-emerald-500/30 text-emerald-400 rounded-xl font-medium text-xs sm:text-sm hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-1.5 sm:gap-2"
              >
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Or Start Free Forever
              </button>
              <button
                onClick={handleDismiss}
                className="w-full py-2 text-white/40 hover:text-white/60 transition-colors text-xs sm:text-sm"
              >
                Maybe later
              </button>
            </div>

            {/* Affiliate teaser */}
            <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/10">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
                <span className="text-white/50">
                  Earn up to <span className="text-amber-400 font-semibold">{AFFILIATE_CONFIG.maxCommission}%</span> as an affiliate!
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Floating CTA Button (appears after scrolling)
interface FloatingCTAProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  isVisible: boolean;
}

function FloatingCTA({ onOpenAuth, isVisible }: FloatingCTAProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <button
        onClick={() => onOpenAuth('register')}
        className="group relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-secondary to-pink-500 rounded-full blur-lg opacity-60 group-hover:opacity-80 transition-all" />
        <div className="relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-secondary via-pink-500 to-purple-500 rounded-full font-semibold text-white shadow-2xl hover:scale-105 transition-all">
          <Sparkles className="w-5 h-5" />
          <span>Start {TRIAL_CONFIG.label}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>
    </div>
  );
}

// PWA Install Banner
function PWAInstallBanner() {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isInstallable || isDismissed || isInstalled) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-50 animate-slide-up">
      <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 shadow-2xl border border-white/10">
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-3 right-3 p-1 text-white/50 hover:text-white transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-white font-semibold mb-1">Install Brilla Prep</h4>
            <p className="text-white/60 text-sm mb-3">
              Get the full experience with offline access and faster loading.
            </p>
            <button
              onClick={install}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-secondary to-yellow-400 rounded-lg text-slate-900 font-medium text-sm hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              Install Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DATA
// ============================================

const stats = [
  { text: '4,000+', label: 'Practice Questions', icon: BookOpen },
  { text: '5 Exams', label: 'NSMQ, WASSCE, BECE, IGCSE, A-Level', icon: Target },
  { text: '50+', label: 'Subjects Covered', icon: TrendingUp },
  { text: 'AI-Powered', label: 'Learning & Tutoring', icon: Brain },
];

const examModes = [
  {
    id: 'nsmq',
    name: 'NSMQ',
    fullName: 'National Science & Maths Quiz',
    description: 'Compete like a champion with full competition simulation featuring all 5 rounds',
    icon: Trophy,
    color: 'from-amber-500 via-orange-500 to-red-500',
    bgImage: 'radial-gradient(circle at 30% 50%, rgba(251, 191, 36, 0.15) 0%, transparent 50%)',
    features: ['5 Competition Rounds', '1v1 Live Battles', 'Speed Training', 'Riddles & Problem Solving'],
  },
  {
    id: 'wassce',
    name: 'WASSCE',
    fullName: 'West African Senior School Certificate',
    description: '50+ subjects with comprehensive past papers and AI-powered essay grading',
    icon: GraduationCap,
    color: 'from-blue-500 via-indigo-500 to-purple-500',
    bgImage: 'radial-gradient(circle at 70% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
    features: ['Past Papers (2015-2024)', 'AI Essay Grading', 'Theory & Objectives', 'Marking Schemes'],
  },
  {
    id: 'bece',
    name: 'BECE',
    fullName: 'Basic Education Certificate',
    description: 'Build a strong foundation for academic success with JHS curriculum coverage',
    icon: BookOpen,
    color: 'from-emerald-500 via-teal-500 to-cyan-500',
    bgImage: 'radial-gradient(circle at 50% 70%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)',
    features: ['Full JHS Curriculum', 'All 9 Subjects', 'Practice Tests', 'Progress Tracking'],
  },
];

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Tutoring',
    description: 'Get instant explanations and personalized guidance from our intelligent AI tutor.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: BookOpen,
    title: 'E-Library',
    description: 'Access thousands of PDFs, videos, audio lessons, and interactive learning materials.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Users,
    title: 'AI Student Counselor',
    description: 'Get academic guidance, career advice, and wellbeing support from AI counselors.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Trophy,
    title: 'NSMQ Competition Mode',
    description: 'Full 5-round simulation with live 1v1 battles and speed training.',
    gradient: 'from-amber-500 to-red-500',
  },
  {
    icon: Target,
    title: 'Smart Practice',
    description: 'Adaptive questions that evolve with your skill level for maximum learning.',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    icon: TrendingUp,
    title: 'Advanced Analytics',
    description: 'Detailed insights into your progress with performance predictions.',
    gradient: 'from-rose-500 to-orange-500',
  },
];

const platformCapabilities = [
  {
    category: 'Learning Resources',
    items: [
      { name: 'E-Library', description: 'PDFs, videos, audio, interactive content' },
      { name: 'Flashcards', description: 'Spaced repetition memory system' },
      { name: 'Past Papers', description: 'WASSCE & BECE with marking schemes' },
      { name: 'Practice Questions', description: '4,000+ questions across subjects' },
    ],
  },
  {
    category: 'AI Features',
    items: [
      { name: 'AI Tutor', description: 'Instant explanations & guidance' },
      { name: 'AI Counselor', description: 'Academic, career & wellness support' },
      { name: 'Essay Grading', description: 'Instant AI feedback on essays' },
      { name: 'Revision Classroom', description: 'AI-led interactive lessons' },
    ],
  },
  {
    category: 'Competition & Games',
    items: [
      { name: 'NSMQ Simulation', description: 'All 5 rounds recreated' },
      { name: '1v1 & 3v3 Battles', description: 'Real-time solo & team fights' },
      { name: 'House Cup', description: 'Compete for your school house' },
      { name: 'Leaderboards', description: 'National & school rankings' },
    ],
  },
  {
    category: 'Progress & Motivation',
    items: [
      { name: 'Daily Quests', description: 'Challenges with XP rewards' },
      { name: 'Streak System', description: 'Build study habits with streaks' },
      { name: 'Achievements', description: 'Unlock badges & milestones' },
      { name: 'Analytics Dashboard', description: 'Track every metric' },
    ],
  },
];

const testimonials = [
  {
    quote: "Brilla Prep completely transformed how I prepare for NSMQ. The speed rounds are incredibly effective!",
    author: "Kwame Asante",
    role: "SHS 3, Presec Legon",
    avatar: "K",
    rating: 5,
  },
  {
    quote: "The AI essay grading gave me instant feedback that helped me improve my WASSCE writing skills.",
    author: "Abena Mensah",
    role: "SHS 2, Wesley Girls",
    avatar: "A",
    rating: 5,
  },
  {
    quote: "Our school's NSMQ team uses Brilla Prep daily. It's become essential to our training regimen.",
    author: "Mr. Samuel Osei",
    role: "Science Teacher, Mfantsipim",
    avatar: "S",
    rating: 5,
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

type PreviewMode = 'chat' | 'whiteboard' | 'voice' | 'focus';
const PREVIEW_MODES: PreviewMode[] = ['chat', 'whiteboard', 'voice', 'focus'];

export function LandingPage() {
  const mousePosition = useMouseParallax(0.02);
  const scrollState = useScrollState();
  const heroRef = useInView(0.1);
  const statsRef = useInView(0.3);
  const modesRef = useInView(0.2);
  const featuresRef = useInView(0.2);
  const testimonialsRef = useInView(0.2);
  const ctaRef = useInView(0.3);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // AI Classroom preview mode toggle with auto-cycle
  const [aiPreviewMode, setAiPreviewMode] = useState<PreviewMode>('chat');
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-cycle between all preview modes
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setAiPreviewMode(prev => {
        const currentIndex = PREVIEW_MODES.indexOf(prev);
        return PREVIEW_MODES[(currentIndex + 1) % PREVIEW_MODES.length];
      });
    }, 4000); // Switch every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Handle manual toggle - pause auto-play briefly then resume
  const handlePreviewModeChange = (mode: PreviewMode) => {
    setAiPreviewMode(mode);
    setIsAutoPlaying(false);

    // Clear any existing timeout
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
    }

    // Resume auto-play after 10 seconds of inactivity
    autoPlayTimeoutRef.current = setTimeout(() => {
      setIsAutoPlaying(true);
    }, 10000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
    };
  }, []);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Open the auth modal for deep links: /register redirects to
  // /?register=true (preserving ?ref= for affiliate referrals) and the
  // OAuth callback lands on /?register=true for register intent.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wantsRegister = params.get('register') === 'true';
    const wantsLogin = params.get('login') === 'true';
    if (!wantsRegister && !wantsLogin) return;

    handleOpenAuth(wantsRegister ? 'register' : 'login');

    // Strip only the intent params so a refresh doesn't reopen the modal;
    // keep ?ref= so AuthModal can still prefill the referral code on open.
    params.delete('register');
    params.delete('login');
    const qs = params.toString();
    window.history.replaceState(
      null,
      '',
      window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash
    );
  }, []);

  // Generate particles (memoized to prevent recreation on every render)
  const particles = useMemo(() => {
    const { count, sizeRange, durationRange } = ANIMATION_CONFIG.particles;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * (sizeRange.max - sizeRange.min) + sizeRange.min,
      delay: Math.random() * 5,
      duration: Math.random() * (durationRange.max - durationRange.min) + durationRange.min,
    }));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Custom Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-3deg); }
        }
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
        }
        @keyframes morph {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          50% { border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; }
          75% { border-radius: 60% 40% 60% 30% / 70% 30% 50% 60%; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(60px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes border-dance {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-particle { animation: float-particle var(--duration, 15s) linear infinite; animation-delay: var(--delay, 0s); }
        .animate-morph { animation: morph 15s ease-in-out infinite; }
        .animate-gradient { background-size: 200% 200%; animation: gradient-shift 3s ease infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.6s ease-out forwards; }
        .animate-blink { animation: blink 1s infinite; }
        .animate-shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }
        .animate-spin-slow { animation: spin-slow 30s linear infinite; }
        .animate-border-dance { background-size: 300% 300%; animation: border-dance 4s ease infinite; }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .glass { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .glass-hover:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); }
        .text-gradient { background: linear-gradient(135deg, #FFD700, #FFA500, #FF6B35); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .glow-text { text-shadow: 0 0 40px rgba(255, 215, 0, 0.5), 0 0 80px rgba(255, 165, 0, 0.3); }
      `}</style>

      {/* Header */}
      <LandingHeader onOpenAuth={handleOpenAuth} isScrolled={scrollState.isHeaderScrolled} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

      {/* Hero Section */}
      <section
        ref={heroRef.ref}
        className="relative min-h-screen flex items-center justify-center pt-24 pb-32 px-4 overflow-hidden"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

        {/* Gradient Mesh */}
        <div className="absolute inset-0 opacity-30">
          <GradientOrb className="w-[600px] h-[600px] bg-gradient-to-r from-primary/50 to-purple-500/50 top-0 -left-48" delay={0} />
          <GradientOrb className="w-[500px] h-[500px] bg-gradient-to-r from-secondary/50 to-orange-500/50 top-1/4 -right-32" delay={2} />
          <GradientOrb className="w-[400px] h-[400px] bg-gradient-to-r from-emerald-500/50 to-cyan-500/50 bottom-0 left-1/4" delay={4} />
        </div>

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating Particles */}
        {particles.map((particle) => (
          <Particle
            key={particle.id}
            size={particle.size}
            style={{
              left: particle.left,
              top: particle.top,
              '--delay': `${particle.delay}s`,
              '--duration': `${particle.duration}s`,
            } as React.CSSProperties}
          />
        ))}

        {/* Decorative Ring */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full animate-spin-slow"
          style={{ transform: `translate(-50%, -50%) translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full animate-spin-slow"
          style={{ animationDirection: 'reverse', transform: `translate(-50%, -50%) translate(${mousePosition.x * 1.5}px, ${mousePosition.y * 1.5}px)` }}
        />

        {/* Floating Icons */}
        <div
          className="absolute top-32 left-[15%] hidden lg:block animate-float"
          style={{ transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)` }}
        >
          <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center">
            <Brain className="w-8 h-8 text-secondary" />
          </div>
        </div>
        <div
          className="absolute top-48 right-[10%] hidden lg:block animate-float-slow"
          style={{ transform: `translate(${mousePosition.x * 3}px, ${mousePosition.y * 3}px)` }}
        >
          <div className="w-14 h-14 glass rounded-xl flex items-center justify-center">
            <Trophy className="w-7 h-7 text-amber-400" />
          </div>
        </div>
        <div
          className="absolute bottom-48 left-[12%] hidden lg:block animate-float"
          style={{ animationDelay: '1s', transform: `translate(${mousePosition.x * 2.5}px, ${mousePosition.y * 2.5}px)` }}
        >
          <div className="w-12 h-12 glass rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-yellow-400" />
          </div>
        </div>
        <div
          className="absolute bottom-32 right-[15%] hidden lg:block animate-float-slow"
          style={{ animationDelay: '2s', transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)` }}
        >
          <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        {/* Hero Content */}
        <div className={cn(
          'relative z-10 max-w-5xl mx-auto text-center',
          heroRef.inView ? 'animate-slide-up' : 'opacity-0'
        )}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 glass rounded-full mb-8 animate-pulse-glow">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-sm text-white/90 font-medium">Ghana's #1 Exam Prep Platform</span>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-8 leading-[1.1]">
            Master Your
            <br />
            <span className="text-gradient glow-text">
              <TypewriterText texts={['NSMQ', 'WASSCE', 'BECE', 'IGCSE', 'A-Level']} />
            </span>
            <br />
            <span className="text-white">with </span>
            <span className="relative">
              <span className="text-gradient">Brilla Prep</span>
              <Sparkles className="absolute -top-2 -right-8 w-6 h-6 text-secondary animate-pulse hidden sm:block" />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-12 leading-relaxed">
            Master your exams with AI-powered practice, comprehensive past papers,
            and realistic competition simulations.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button onClick={() => handleOpenAuth('register')} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-secondary via-yellow-400 to-orange-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-all" />
              <div className="relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-secondary via-yellow-400 to-orange-400 rounded-full font-semibold text-slate-900 text-lg shadow-2xl shadow-secondary/25 hover:shadow-secondary/40 transition-all hover:scale-105">
                <span>Start Learning Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
            <button onClick={() => handleOpenAuth('login')} className="group flex items-center gap-3 px-8 py-4 glass rounded-full font-medium text-white hover:bg-white/10 transition-all">
              <span>Sign In</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-white/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span>Free to Start</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span>No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span>Trusted by Schools</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-8 h-14 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-gradient-to-b from-white to-transparent rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        ref={statsRef.ref}
        className="relative py-24 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        <GradientOrb className="w-[400px] h-[400px] bg-primary/30 -left-48 top-0" />
        <GradientOrb className="w-[300px] h-[300px] bg-secondary/30 -right-32 bottom-0" delay={2} />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <StatItem
                key={stat.label}
                stat={stat}
                index={index}
                inView={statsRef.inView}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Mini Promo Banner - Strategic placement after stats */}
      <section className="relative py-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 via-pink-500/10 to-purple-500/10" />
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-6 px-8 glass rounded-2xl border border-secondary/20">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-bold border-2 border-slate-900">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-amber-400 flex items-center justify-center text-white font-bold border-2 border-slate-900">
                  <Crown className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold border-2 border-slate-900">
                  <Coins className="w-5 h-5" />
                </div>
              </div>
              <div className="text-center md:text-left">
                <p className="text-white font-semibold text-sm sm:text-base">
                  <span className="text-emerald-400">{TRIAL_CONFIG.label}</span>
                  <span className="hidden sm:inline">{' '}+ Earn up to{' '}</span>
                  <span className="block sm:hidden text-xs text-white/60 mt-0.5">+ Earn up to </span>
                  <span className="text-secondary">{AFFILIATE_CONFIG.maxCommission}% Commission</span>
                </p>
                <p className="text-white/60 text-xs sm:text-sm">No credit card required. Start learning today.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => handleOpenAuth('register')}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-secondary to-amber-400 rounded-xl font-semibold text-slate-900 hover:shadow-lg hover:shadow-secondary/30 transition-all whitespace-nowrap"
              >
                Start Free Trial
              </button>
              <Link
                to="/affiliate"
                className="w-full sm:w-auto px-6 py-3 glass rounded-xl font-medium text-white hover:bg-white/10 transition-all whitespace-nowrap text-center"
              >
                Become an Affiliate
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AI Revision Classroom Showcase - Our Trump Card */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-violet-950/30 to-slate-950" />
        <GradientOrb className="w-[600px] h-[600px] bg-violet-500/20 -left-64 top-0" />
        <GradientOrb className="w-[500px] h-[500px] bg-purple-500/20 -right-48 bottom-0" delay={1} />
        <GradientOrb className="w-[300px] h-[300px] bg-fuchsia-500/15 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" delay={2} />

        <div className="relative max-w-7xl mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 rounded-full border border-violet-400/20 mb-6">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-violet-300">Revolutionary AI Learning</span>
              <span className="px-2 py-0.5 bg-violet-500 text-white text-xs font-bold rounded-full animate-pulse">NEW</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
              Meet Your Personal{' '}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                AI Teacher
              </span>
            </h2>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              Unlike other AI tutors that only answer questions, our <strong className="text-white">AI Revision Classroom</strong> proactively
              teaches you — explaining concepts, checking your understanding, and adapting to your learning pace.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left side - Interactive Preview */}
            <div className="relative order-2 lg:order-1">
              {/* Floating glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 blur-3xl scale-110" />

              {/* Preview card */}
              <div className="relative glass rounded-2xl border border-violet-400/20 shadow-2xl overflow-hidden">
                {/* Header with mode toggle */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        {aiPreviewMode === 'chat' ? (
                          <Brain className="w-5 h-5 text-white" />
                        ) : (
                          <Presentation className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">Brilla AI Teacher</p>
                        <p className="text-xs text-white/70">
                          {aiPreviewMode === 'chat' && 'Teaching Phase: Explain'}
                          {aiPreviewMode === 'whiteboard' && 'Visual Whiteboard Mode'}
                          {aiPreviewMode === 'voice' && 'Voice Conversation Mode'}
                          {aiPreviewMode === 'focus' && 'Immersive Focus Mode'}
                        </p>
                      </div>
                    </div>
                    {/* Mode Toggle */}
                    <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
                      {[
                        { mode: 'chat' as const, icon: MessageCircle, label: 'Chat' },
                        { mode: 'whiteboard' as const, icon: PenTool, label: 'Draw' },
                        { mode: 'voice' as const, icon: Mic, label: 'Voice' },
                        { mode: 'focus' as const, icon: Focus, label: 'Focus' },
                      ].map(({ mode, icon: Icon, label }) => (
                        <button
                          key={mode}
                          onClick={() => handlePreviewModeChange(mode)}
                          className={cn(
                            "px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1",
                            aiPreviewMode === mode
                              ? "bg-white text-violet-600"
                              : "text-white/70 hover:text-white"
                          )}
                        >
                          <Icon className="w-3 h-3" />
                          <span className="hidden sm:inline">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chat Mode Preview */}
                {aiPreviewMode === 'chat' && (
                  <>
                    <div className="p-3 sm:p-4 space-y-3 min-h-[280px] sm:min-h-[320px] bg-slate-900/80">
                      {/* AI Message 1 */}
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                        </div>
                        <div className="glass rounded-xl rounded-tl-sm p-3 max-w-[85%] border border-white/10">
                          <p className="text-sm text-white/90">Let me ask you something interesting... Have you ever wondered why ice floats on water?</p>
                        </div>
                      </div>

                      {/* AI Message 2 */}
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                        </div>
                        <div className="glass rounded-xl rounded-tl-sm p-3 max-w-[85%] border border-white/10">
                          <p className="text-sm text-white/90">Most substances become denser when they solidify, but water is special! This is because of <strong className="text-violet-300">hydrogen bonding</strong>...</p>
                        </div>
                      </div>

                      {/* User response */}
                      <div className="flex gap-2 justify-end">
                        <div className="bg-violet-600 text-white rounded-xl rounded-tr-sm p-3 max-w-[80%]">
                          <p className="text-sm">That's fascinating! So the hydrogen bonds create a crystal structure?</p>
                        </div>
                      </div>

                      {/* Typing indicator */}
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                        </div>
                        <div className="glass rounded-xl rounded-tl-sm px-4 py-3 border border-white/10">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Input area */}
                    <div className="p-3 border-t border-white/10 bg-slate-900/50">
                      <div className="flex gap-2">
                        <div className="flex-1 glass rounded-lg px-3 py-2 text-white/40 text-sm border border-white/10">
                          Type your answer or ask a question...
                        </div>
                        <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-sm font-medium transition-colors">
                          Continue →
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Whiteboard Mode Preview */}
                {aiPreviewMode === 'whiteboard' && (
                  <>
                    <div className="relative min-h-[320px] sm:min-h-[380px] bg-slate-900/90">
                      {/* Whiteboard Canvas Area */}
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
                        {/* Grid pattern */}
                        <div
                          className="absolute inset-0 opacity-20"
                          style={{
                            backgroundImage: `
                              linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
                            `,
                            backgroundSize: '30px 30px'
                          }}
                        />

                        {/* Animated math equation being drawn */}
                        <div className="absolute top-4 left-4 right-4">
                          <div className="text-xs sm:text-sm font-medium text-violet-400 mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            Step 2: Apply the Quadratic Formula
                          </div>
                        </div>

                        {/* Visual equation */}
                        <div className="absolute top-14 sm:top-16 left-1/2 transform -translate-x-1/2 w-full px-4">
                          <div className="text-center space-y-4 sm:space-y-5">
                            {/* Formula box */}
                            <div className="inline-block glass rounded-xl p-4 border border-violet-400/30 animate-fade-in">
                              <div className="text-lg sm:text-2xl text-white font-mono">
                                x = <span className="text-violet-400">−b</span> ± √<span className="border-t-2 border-white inline-block px-1">b² − 4ac</span>
                              </div>
                              <div className="border-t border-white/30 mt-2 pt-2 text-base sm:text-xl text-white font-mono">
                                <span className="text-violet-400">2a</span>
                              </div>
                            </div>

                            {/* Substitution step */}
                            <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
                              <div className="inline-block glass rounded-xl p-3 border border-emerald-400/30">
                                <div className="text-xs sm:text-base text-emerald-300 font-mono">
                                  x = <span className="text-amber-400">−(−3)</span> ± √<span className="border-t border-white inline-block px-1">(−3)² − 4(1)(2)</span>
                                </div>
                                <div className="border-t border-white/30 mt-1 pt-1 text-xs sm:text-base text-white font-mono">
                                  2(1)
                                </div>
                              </div>
                            </div>

                            {/* Arrow indicator */}
                            <div className="animate-bounce" style={{ animationDuration: '1.5s' }}>
                              <ChevronRight className="w-6 h-6 text-violet-400 mx-auto rotate-90" />
                            </div>

                            {/* Result with highlighting */}
                            <div className="animate-slide-up" style={{ animationDelay: '1s' }}>
                              <div className="inline-flex items-center gap-2 glass rounded-xl px-4 py-3 border-2 border-fuchsia-400/40 shadow-lg shadow-fuchsia-500/20">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                <span className="text-white font-bold text-base sm:text-lg">x = 2 or x = 1</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Drawing cursor indicator */}
                        <div className="absolute bottom-16 right-4 sm:right-10 animate-pulse">
                          <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full border border-violet-400/30">
                            <div className="w-3 h-3 rounded-full bg-violet-500 animate-ping" style={{ animationDuration: '2s' }} />
                            <span className="text-xs text-violet-300">AI drawing...</span>
                          </div>
                        </div>
                      </div>

                      {/* Step navigation */}
                      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
                        <button className="w-9 h-9 glass rounded-full flex items-center justify-center text-white/50 hover:text-white border border-white/10 hover:border-violet-400/30 transition-colors">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((step) => (
                            <div
                              key={step}
                              className={cn(
                                "h-2 rounded-full transition-all",
                                step === 2 ? "w-8 bg-violet-500" : step < 2 ? "w-2 bg-violet-400" : "w-2 bg-white/30"
                              )}
                            />
                          ))}
                        </div>
                        <button className="w-9 h-9 glass rounded-full flex items-center justify-center text-white/50 hover:text-white border border-white/10 hover:border-violet-400/30 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Whiteboard controls footer */}
                    <div className="p-3 border-t border-white/10 bg-slate-900/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button className="w-8 h-8 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-400 transition-colors">
                            <Play className="w-4 h-4" />
                          </button>
                          <div className="text-xs text-white/50">0:45 / 2:30</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/50 hidden sm:inline">Voice narration</span>
                          <div className="flex gap-1">
                            <div className="w-1 h-3 bg-violet-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                            <div className="w-1 h-4 bg-violet-400 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                            <div className="w-1 h-2 bg-violet-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                            <div className="w-1 h-5 bg-violet-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Voice Mode Preview */}
                {aiPreviewMode === 'voice' && (
                  <>
                    <div className="relative min-h-[320px] sm:min-h-[380px] bg-slate-900/90 flex flex-col items-center justify-center">
                      {/* Ambient background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/50 via-slate-900 to-violet-950/50" />

                      {/* Central voice orb */}
                      <div className="relative z-10 flex flex-col items-center">
                        {/* Pulsing rings - responsive sizes */}
                        <div className="relative">
                          <div className="absolute inset-0 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-cyan-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                          <div className="absolute inset-2 w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-cyan-500/30 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
                          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-cyan-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-cyan-400/20 to-transparent" />
                            <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-pulse" />
                          </div>
                        </div>

                        {/* Voice visualization - fewer bars on mobile */}
                        <div className="flex items-end gap-0.5 sm:gap-1 mt-4 sm:mt-6 h-6 sm:h-8">
                          {[...Array(8)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 sm:w-1.5 bg-gradient-to-t from-cyan-500 to-violet-400 rounded-full animate-pulse"
                              style={{
                                height: `${Math.random() * 20 + 6}px`,
                                animationDelay: `${i * 100}ms`,
                                animationDuration: '0.5s'
                              }}
                            />
                          ))}
                        </div>

                        {/* Status text */}
                        <p className="mt-4 sm:mt-6 text-base sm:text-lg text-white font-medium">Listening...</p>
                        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-white/60 px-4 text-center">"Explain photosynthesis step by step"</p>
                      </div>

                      {/* AI Response bubble */}
                      <div className="absolute bottom-12 sm:bottom-16 left-3 right-3 sm:left-4 sm:right-4 animate-slide-up" style={{ animationDelay: '0.5s' }}>
                        <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-cyan-400/20 max-w-sm mx-auto">
                          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                            <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 animate-pulse" />
                            <span className="text-[10px] sm:text-xs text-cyan-300 font-medium">AI Speaking</span>
                          </div>
                          <p className="text-xs sm:text-sm text-white/80">"Photosynthesis is how plants convert sunlight into energy..."</p>
                        </div>
                      </div>
                    </div>

                    {/* Voice controls footer */}
                    <div className="p-3 border-t border-white/10 bg-slate-900/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button className="w-10 h-10 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center text-red-400 transition-colors ring-2 ring-red-500/50">
                            <Mic className="w-5 h-5" />
                          </button>
                          <span className="text-sm text-white/70">Tap to speak</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Headset className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs text-white/50">Natural voice AI</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Focus Mode Preview */}
                {aiPreviewMode === 'focus' && (
                  <>
                    <div className="relative min-h-[320px] sm:min-h-[380px] bg-slate-950">
                      {/* Immersive dark background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950" />

                      {/* Subtle grid */}
                      <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                          backgroundImage: `
                            linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)
                          `,
                          backgroundSize: '40px 40px'
                        }}
                      />

                      {/* Central content */}
                      <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 sm:p-6">
                        {/* Breathing AI orb */}
                        <div className="relative mb-4 sm:mb-6">
                          <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-violet-500/20 animate-pulse" style={{ animationDuration: '3s' }} />
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 backdrop-blur-xl flex items-center justify-center border border-violet-400/20">
                            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-violet-300" />
                          </div>
                        </div>

                        {/* Focus content */}
                        <div className="text-center max-w-md px-2">
                          <h3 className="text-lg sm:text-xl font-semibold text-white mb-1.5 sm:mb-2">Zero Distractions</h3>
                          <p className="text-white/50 text-xs sm:text-sm mb-4 sm:mb-6">Fullscreen immersive learning with ambient sounds</p>

                          {/* Feature pills - 2x2 grid on mobile, row on desktop */}
                          <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-1.5 sm:gap-2">
                            {[
                              { icon: Maximize, label: 'Fullscreen' },
                              { icon: Headphones, label: 'Lo-fi beats' },
                              { icon: PenTool, label: 'Draw notes' },
                              { icon: Mic, label: 'Voice chat' },
                            ].map(({ icon: Icon, label }) => (
                              <div key={label} className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 glass rounded-full border border-white/10 text-[10px] sm:text-xs text-white/70">
                                <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-violet-400" />
                                {label}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Session stats preview - responsive spacing */}
                        <div className="absolute bottom-3 sm:bottom-4 left-2 right-2 sm:left-4 sm:right-4">
                          <div className="flex justify-center gap-4 sm:gap-6 text-center">
                            <div>
                              <p className="text-xl sm:text-2xl font-bold text-white">45</p>
                              <p className="text-[10px] sm:text-xs text-white/40">minutes</p>
                            </div>
                            <div className="w-px bg-white/10" />
                            <div>
                              <p className="text-xl sm:text-2xl font-bold text-emerald-400">12</p>
                              <p className="text-[10px] sm:text-xs text-white/40">concepts</p>
                            </div>
                            <div className="w-px bg-white/10" />
                            <div>
                              <p className="text-xl sm:text-2xl font-bold text-violet-400">3</p>
                              <p className="text-[10px] sm:text-xs text-white/40">questions</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Focus mode footer */}
                    <div className="p-3 border-t border-white/10 bg-slate-900/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-sm text-white/70">Focus session active</span>
                        </div>
                        <button className="px-4 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 rounded-lg text-violet-300 text-xs font-medium transition-colors border border-violet-500/20">
                          End Session
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-white text-xs font-semibold shadow-lg animate-bounce" style={{ animationDuration: '2s' }}>
                <div className="flex items-center gap-1">
                  <Mic className="w-3 h-3" />
                  <span>Voice Enabled</span>
                </div>
              </div>

              <div className="absolute -bottom-3 -left-3 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full text-white text-xs font-semibold shadow-lg animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2s' }}>
                <div className="flex items-center gap-1">
                  <Focus className="w-3 h-3" />
                  <span>Focus Mode</span>
                </div>
              </div>

              <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full text-white text-xs font-semibold shadow-lg animate-bounce" style={{ animationDelay: '1s', animationDuration: '2s' }}>
                <div className="flex items-center gap-1">
                  <UsersRound className="w-3 h-3" />
                  <span>Study Rooms</span>
                </div>
              </div>
            </div>

            {/* Right side - Features */}
            <div className="order-1 lg:order-2">
              <div className="space-y-4">
                {/* Key differentiators */}
                {[
                  {
                    icon: Mic,
                    title: 'Voice Conversations',
                    desc: 'Talk naturally with your AI teacher. Ask questions, get explanations, and learn through real conversation — hands-free',
                    color: 'from-cyan-500 to-blue-500',
                    badge: 'NEW'
                  },
                  {
                    icon: Focus,
                    title: 'Immersive Focus Mode',
                    desc: 'Zero-distraction fullscreen learning with ambient sounds, auto-hiding UI, and session tracking for deep focus',
                    color: 'from-violet-500 to-purple-500',
                    badge: 'NEW'
                  },
                  {
                    icon: PenTool,
                    title: 'Interactive Whiteboard',
                    desc: 'Draw, annotate, and collaborate while AI explains. Circle anything to ask questions — just like a real classroom',
                    color: 'from-fuchsia-500 to-pink-500',
                    badge: 'NEW'
                  },
                  {
                    icon: UsersRound,
                    title: 'AI Study Rooms',
                    desc: 'Invite friends to study together with a shared AI tutor. Real-time collaboration with multiplayer whiteboards',
                    color: 'from-emerald-500 to-green-500',
                    badge: 'NEW'
                  },
                  {
                    icon: Brain,
                    title: '6-Phase Teaching',
                    desc: 'AI leads lessons through Hook → Explain → Check → Practice → Confirm → Connect for complete mastery',
                    color: 'from-amber-500 to-orange-500'
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="group relative flex items-start gap-4 p-4 rounded-xl glass border border-white/10 hover:border-violet-400/30 transition-all"
                  >
                    {'badge' in feature && feature.badge && (
                      <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[10px] font-bold rounded-full shadow-lg">
                        {feature.badge}
                      </span>
                    )}
                    <div className={cn(
                      "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform",
                      feature.color
                    )}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-0.5 text-sm">{feature.title}</h3>
                      <p className="text-xs text-white/60 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={() => handleOpenAuth('register')}
                  className="group relative px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-105 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Try AI Classroom Free
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <Link
                  to="/revision-classroom"
                  className="px-6 py-3 glass rounded-xl font-medium text-violet-200 hover:bg-violet-500/10 border border-violet-400/20 hover:border-violet-400/40 transition-all flex items-center gap-2"
                >
                  Learn More
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom stats */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: '4', label: 'Learning Modes', icon: Sparkles, color: 'text-violet-400' },
                { value: '∞', label: 'Voice Conversations', icon: Mic, color: 'text-cyan-400' },
                { value: '100%', label: 'Immersive Focus', icon: Focus, color: 'text-fuchsia-400' },
                { value: '24/7', label: 'Always Available', icon: Zap, color: 'text-amber-400' },
              ].map((stat, i) => (
                <div key={i} className="group">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <stat.icon className={cn("w-5 h-5 group-hover:scale-110 transition-transform", stat.color)} />
                    <span className="text-3xl md:text-4xl font-bold text-white">{stat.value}</span>
                  </div>
                  <p className="text-sm text-white/50">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Exam Modes Section */}
      <section
        ref={modesRef.ref}
        className="relative py-32 overflow-hidden"
      >
        <div className="absolute inset-0 bg-slate-950" />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className={cn(
            'text-center mb-20',
            modesRef.inView ? 'animate-slide-up' : 'opacity-0'
          )}>
            <span className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm font-medium text-white/80 mb-6">
              <Target className="w-4 h-4 text-secondary" />
              Choose Your Path
            </span>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
              One Platform.{' '}
              <span className="text-gradient">Every Exam.</span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Whether you're preparing for NSMQ, WASSCE, BECE, or international exams like IGCSE and A-Level, we've got you covered.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {examModes.map((mode, index) => (
              <Card3D key={mode.id}>
                <div
                  className={cn(
                    'relative h-full glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 overflow-hidden group cursor-pointer transition-all duration-500',
                    modesRef.inView ? 'animate-slide-up' : 'opacity-0'
                  )}
                  style={{
                    animationDelay: `${index * 0.15}s`,
                    background: mode.bgImage,
                  }}
                >
                  {/* Gradient Border Effect */}
                  <div className={cn(
                    'absolute inset-0 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                    'bg-gradient-to-r p-[1px]',
                    mode.color
                  )}>
                    <div className="w-full h-full bg-slate-950 rounded-2xl sm:rounded-3xl" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={cn(
                      'w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 sm:mb-6 lg:mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl',
                      mode.color
                    )}>
                      <mode.icon className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">{mode.name}</h3>
                    <p className="text-white/50 text-xs sm:text-sm mb-2 sm:mb-4">{mode.fullName}</p>
                    <p className="text-white/70 text-sm sm:text-base mb-4 sm:mb-6 lg:mb-8 line-clamp-3">{mode.description}</p>

                    {/* Features */}
                    <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 lg:mb-8">
                      {mode.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 sm:gap-3 text-white/80 text-sm sm:text-base">
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <button
                      onClick={() => handleOpenAuth('register')}
                      className={cn(
                        'inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-white text-sm sm:text-base bg-gradient-to-r transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 group/btn',
                        mode.color
                      )}
                    >
                      Get Started
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </Card3D>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* TEAM BATTLES & MULTIPLAYER SECTION */}
      {/* ========================================== */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-rose-950/20 to-slate-950" />
        <GradientOrb className="w-[500px] h-[500px] bg-rose-500/20 -right-48 top-1/4" delay={0} />
        <GradientOrb className="w-[400px] h-[400px] bg-orange-500/20 -left-32 bottom-1/4" delay={2} />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-rose-500/20 to-orange-500/20 border border-rose-500/30 rounded-full text-rose-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Multiplayer Competition
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-display font-bold text-white mb-4 sm:mb-6">
              Battle Solo or{' '}
              <span className="bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                Team Up
              </span>
            </h2>
            <p className="text-sm sm:text-base lg:text-xl text-white/60 max-w-3xl mx-auto">
              Challenge friends to 1v1 duels or form teams for epic 3v3 school battles. Real-time competition with live leaderboards.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
            {/* 1v1 Battle Card */}
            <Card3D>
              <div className="relative glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 h-full overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">1v1 Battles</h3>
                      <p className="text-white/50 text-sm sm:text-base">Quick Fire Duels</p>
                    </div>
                  </div>

                  <p className="text-white/70 text-sm sm:text-base mb-6 leading-relaxed">
                    Challenge any student to a real-time quiz battle. Answer faster and more accurately to claim victory and climb the rankings.
                  </p>

                  {/* Battle Preview */}
                  <div className="relative glass rounded-xl p-4 mb-6 border border-amber-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold">Y</div>
                        <div>
                          <p className="text-white font-medium text-sm">You</p>
                          <p className="text-emerald-400 text-xs font-bold">850 pts</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <Swords className="w-6 h-6 text-amber-400 mb-1" />
                        <span className="text-white/50 text-xs">VS</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-white font-medium text-sm">Opponent</p>
                          <p className="text-rose-400 text-xs font-bold">720 pts</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-bold">K</div>
                      </div>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-[54%] bg-gradient-to-r from-emerald-500 to-green-400 rounded-full" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>30-second rounds</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>Ranked matchmaking</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <Flame className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>Win streaks bonus</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <Star className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>XP rewards</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card3D>

            {/* 3v3 Team Battle Card */}
            <Card3D>
              <div className="relative glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 h-full overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* NEW Badge */}
                <div className="absolute -top-0 -right-0">
                  <div className="px-3 py-1 bg-gradient-to-r from-rose-500 to-pink-500 rounded-bl-xl rounded-tr-2xl text-white text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    POPULAR
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Users className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">3v3 Team Battles</h3>
                      <p className="text-white/50 text-sm sm:text-base">School vs School</p>
                    </div>
                  </div>

                  <p className="text-white/70 text-sm sm:text-base mb-6 leading-relaxed">
                    Form a team of 3 and compete against other schools in NSMQ-style battles. Coordinate roles and dominate the leaderboards together.
                  </p>

                  {/* Team Preview */}
                  <div className="relative glass rounded-xl p-4 mb-6 border border-rose-500/20">
                    <div className="flex items-center justify-between">
                      {/* Your Team */}
                      <div className="flex-1">
                        <p className="text-emerald-400 text-xs font-bold mb-2 text-center">Your Team</p>
                        <div className="flex justify-center -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-900">C1</div>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-900">C2</div>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-900">R</div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center px-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center border border-rose-500/30">
                          <Swords className="w-5 h-5 text-rose-400" />
                        </div>
                        <span className="text-white/50 text-xs mt-1">3v3</span>
                      </div>

                      {/* Opponent Team */}
                      <div className="flex-1">
                        <p className="text-rose-400 text-xs font-bold mb-2 text-center">Opponents</p>
                        <div className="flex justify-center -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-900">C1</div>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-900">C2</div>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-900">R</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-center gap-4 text-xs text-white/50">
                      <span>C1 = Contestant 1</span>
                      <span>C2 = Contestant 2</span>
                      <span>R = Reserve</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <Users className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>Team coordination</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <GraduationCap className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>School rankings</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <MessageCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>Team chat</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <Trophy className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>Seasonal leagues</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card3D>
          </div>

          {/* Battle Stats */}
          <div className="glass rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-1">Real-time</div>
                <div className="text-white/60 text-xs sm:text-sm">Live Battles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent mb-1">3v3</div>
                <div className="text-white/60 text-xs sm:text-sm">Team Mode</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-1">5 Rounds</div>
                <div className="text-white/60 text-xs sm:text-sm">NSMQ Format</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-1">Ranked</div>
                <div className="text-white/60 text-xs sm:text-sm">Matchmaking</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* International Exams Section - Cambridge IGCSE & A-Level */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950" />

        {/* Animated accent orbs */}
        <GradientOrb className="w-[500px] h-[500px] bg-gradient-to-r from-indigo-500/30 to-purple-500/30 -left-64 top-0" delay={0} />
        <GradientOrb className="w-[400px] h-[400px] bg-gradient-to-r from-cyan-500/30 to-blue-500/30 -right-48 bottom-0" delay={2} />

        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative max-w-7xl mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
              <Award className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-300">Cambridge International</span>
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-4 sm:mb-6">
              Go{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                International
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto">
              Prepare for Cambridge IGCSE and A-Level examinations with our comprehensive question bank and expert-aligned content.
            </p>
          </div>

          {/* International Exams Cards */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mb-12 sm:mb-16">
            {/* IGCSE Card */}
            <Card3D>
              <div className="relative h-full rounded-2xl sm:rounded-3xl overflow-hidden group">
                {/* Animated border gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-border-dance" />
                <div className="absolute inset-[1px] rounded-2xl sm:rounded-3xl bg-slate-950" />

                {/* Content */}
                <div className="relative p-6 sm:p-8 lg:p-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6 sm:mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 flex items-center justify-center shadow-xl shadow-cyan-500/25 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-cyan-500/20 text-cyan-400 rounded-full">O-LEVEL</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">IGCSE</h3>
                        <p className="text-white/50 text-sm sm:text-base">International GCSE</p>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">160</span>
                      <span className="text-white/50 text-xs sm:text-sm">Questions</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-white/70 text-sm sm:text-base mb-6 leading-relaxed">
                    Explore our growing Cambridge IGCSE practice banks with live availability shown for each subject. Designed for students aged 14-16 preparing for international qualifications.
                  </p>

                  {/* Subjects Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm sm:text-base">Physics</p>
                        <p className="text-white/50 text-xs">40 Questions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm sm:text-base">Chemistry</p>
                        <p className="text-white/50 text-xs">40 Questions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm sm:text-base">Biology</p>
                        <p className="text-white/50 text-xs">40 Questions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm sm:text-base">Mathematics</p>
                        <p className="text-white/50 text-xs">40 Questions</p>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                    <span className="px-3 py-1.5 text-xs sm:text-sm rounded-full bg-white/5 text-white/70 border border-white/10">
                      Cambridge Aligned
                    </span>
                    <span className="px-3 py-1.5 text-xs sm:text-sm rounded-full bg-white/5 text-white/70 border border-white/10">
                      Detailed Explanations
                    </span>
                    <span className="px-3 py-1.5 text-xs sm:text-sm rounded-full bg-white/5 text-white/70 border border-white/10">
                      Exam-Style Questions
                    </span>
                  </div>

                  {/* CTA */}
                  <Link
                    to="/exam-setup"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-lg hover:shadow-cyan-500/25 transition-all group/btn"
                  >
                    Start IGCSE Practice
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </Card3D>

            {/* A-Level Card */}
            <Card3D>
              <div className="relative h-full rounded-2xl sm:rounded-3xl overflow-hidden group">
                {/* Animated border gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-border-dance" />
                <div className="absolute inset-[1px] rounded-2xl sm:rounded-3xl bg-slate-950" />

                {/* Premium badge */}
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
                  <div className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                    <Crown className="w-3 h-3" />
                    Advanced
                  </div>
                </div>

                {/* Content */}
                <div className="relative p-6 sm:p-8 lg:p-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6 sm:mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center shadow-xl shadow-purple-500/25 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-purple-500/20 text-purple-400 rounded-full">ADVANCED</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">A-Level</h3>
                        <p className="text-white/50 text-sm sm:text-base">Advanced Level</p>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">160</span>
                      <span className="text-white/50 text-xs sm:text-sm">Questions</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-white/70 text-sm sm:text-base mb-6 leading-relaxed">
                    Challenge yourself with university-prep content. Our A-Level questions cover advanced topics in depth, preparing you for top universities worldwide.
                  </p>

                  {/* Subjects Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm sm:text-base">Physics</p>
                        <p className="text-white/50 text-xs">40 Questions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/30 hover:bg-pink-500/5 transition-all">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm sm:text-base">Chemistry</p>
                        <p className="text-white/50 text-xs">40 Questions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center flex-shrink-0">
                        <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm sm:text-base">Biology</p>
                        <p className="text-white/50 text-xs">40 Questions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm sm:text-base">Mathematics</p>
                        <p className="text-white/50 text-xs">40 Questions</p>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Topics */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                    <span className="px-3 py-1.5 text-xs sm:text-sm rounded-full bg-white/5 text-white/70 border border-white/10">
                      Calculus & Vectors
                    </span>
                    <span className="px-3 py-1.5 text-xs sm:text-sm rounded-full bg-white/5 text-white/70 border border-white/10">
                      Organic Chemistry
                    </span>
                    <span className="px-3 py-1.5 text-xs sm:text-sm rounded-full bg-white/5 text-white/70 border border-white/10">
                      Quantum Physics
                    </span>
                  </div>

                  {/* CTA */}
                  <Link
                    to="/exam-setup"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/25 transition-all group/btn"
                  >
                    Start A-Level Practice
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </Card3D>
          </div>

          {/* Bottom Stats Bar */}
          <div className="glass rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-1">320</div>
                <div className="text-white/60 text-xs sm:text-sm">Total Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">8</div>
                <div className="text-white/60 text-xs sm:text-sm">Subject Areas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-1">100%</div>
                <div className="text-white/60 text-xs sm:text-sm">Cambridge Aligned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-1">24/7</div>
                <div className="text-white/60 text-xs sm:text-sm">AI Tutor Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* MOCK EXAM SIMULATION SECTION */}
      {/* ========================================== */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950" />
        <GradientOrb className="w-[500px] h-[500px] bg-blue-500/20 -left-48 top-1/4" delay={0} />
        <GradientOrb className="w-[400px] h-[400px] bg-indigo-500/20 -right-32 bottom-1/4" delay={2} />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-full text-blue-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Exam Simulation
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-display font-bold text-white mb-4 sm:mb-6">
              Experience{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Real Exam Conditions
              </span>
            </h2>
            <p className="text-sm sm:text-base lg:text-xl text-white/60 max-w-3xl mx-auto">
              Take full-length mock exams with strict timing, realistic question formats, and detailed performance analysis to prepare for the real thing.
            </p>
          </div>

          {/* Mock Exam Interface Preview */}
          <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
            <Card3D>
              <div className="relative glass rounded-2xl sm:rounded-3xl overflow-hidden">
                {/* Exam Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/20 flex items-center justify-center">
                        <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-white">WASSCE Mathematics 2024</h3>
                        <p className="text-white/70 text-sm">Paper 2 - Essay & Structured Questions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-2 text-white">
                          <Clock className="w-5 h-5" />
                          <span className="text-xl sm:text-2xl font-bold font-mono">1:45:30</span>
                        </div>
                        <p className="text-white/60 text-xs">Time Remaining</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <span className="text-xl sm:text-2xl font-bold text-white">12/50</span>
                        <p className="text-white/60 text-xs">Questions</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exam Content Preview */}
                <div className="p-4 sm:p-6 bg-slate-900/80">
                  {/* Question */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">Question 12</span>
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium">5 marks</span>
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium">Algebra</span>
                    </div>
                    <p className="text-white/90 text-sm sm:text-base leading-relaxed">
                      Solve the simultaneous equations:
                    </p>
                    <div className="mt-3 p-4 bg-white/5 rounded-xl border border-white/10 font-mono text-center">
                      <p className="text-white text-lg sm:text-xl mb-2">3x + 2y = 12</p>
                      <p className="text-white text-lg sm:text-xl">x - y = 1</p>
                    </div>
                  </div>

                  {/* Answer Area */}
                  <div className="glass rounded-xl p-4 border border-white/10 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/70 text-sm">Your Answer</span>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-lg bg-white/5 text-white/70 text-xs hover:bg-white/10 transition-colors">
                          Clear
                        </button>
                        <button className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30 transition-colors flex items-center gap-1">
                          <PenTool className="w-3 h-3" />
                          Draw
                        </button>
                      </div>
                    </div>
                    <div className="h-24 bg-white/5 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-white/30 text-sm">
                      Type your solution or use the drawing tool...
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white/70 text-sm hover:bg-white/10 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <div className="flex gap-1.5">
                      {[10, 11, 12, 13, 14].map((num) => (
                        <button
                          key={num}
                          className={cn(
                            "w-8 h-8 rounded-lg text-xs font-medium transition-colors",
                            num === 12
                              ? "bg-blue-500 text-white"
                              : num < 12
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-white/5 text-white/50 hover:bg-white/10"
                          )}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors">
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card3D>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
            {[
              {
                icon: Clock,
                title: 'Strict Timing',
                desc: 'Real exam time limits with countdown and automatic submission',
                color: 'from-blue-500 to-indigo-500'
              },
              {
                icon: FileText,
                title: 'Authentic Papers',
                desc: 'Questions modeled after actual WASSCE, BECE & NSMQ exams',
                color: 'from-purple-500 to-pink-500'
              },
              {
                icon: BarChart3,
                title: 'Instant Analysis',
                desc: 'Detailed breakdown by topic, question type, and time spent',
                color: 'from-emerald-500 to-green-500'
              },
              {
                icon: Target,
                title: 'Score Prediction',
                desc: 'AI-powered grade prediction based on your performance',
                color: 'from-amber-500 to-orange-500'
              }
            ].map((feature, i) => (
              <div key={i} className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 text-center hover:bg-white/10 transition-all group">
                <div className={cn(
                  "w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform",
                  feature.color
                )}>
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Results Preview */}
          <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-8">After Your Mock Exam</h3>
            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-4 border-emerald-500/30 flex items-center justify-center">
                  <div>
                    <span className="text-3xl sm:text-4xl font-bold text-emerald-400">78%</span>
                    <p className="text-white/50 text-xs mt-1">Score</p>
                  </div>
                </div>
                <h4 className="text-white font-semibold mb-1">Overall Score</h4>
                <p className="text-white/50 text-sm">Grade: B2 (Predicted)</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-4 border-blue-500/30 flex items-center justify-center">
                  <div>
                    <span className="text-3xl sm:text-4xl font-bold text-blue-400">42</span>
                    <span className="text-blue-400 text-lg">/50</span>
                    <p className="text-white/50 text-xs mt-1">Correct</p>
                  </div>
                </div>
                <h4 className="text-white font-semibold mb-1">Questions Answered</h4>
                <p className="text-white/50 text-sm">8 incorrect, 0 skipped</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-4 border-amber-500/30 flex items-center justify-center">
                  <div>
                    <span className="text-3xl sm:text-4xl font-bold text-amber-400">1:52</span>
                    <p className="text-white/50 text-xs mt-1">Avg/Question</p>
                  </div>
                </div>
                <h4 className="text-white font-semibold mb-1">Time Management</h4>
                <p className="text-white/50 text-sm">Finished 8 mins early</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresRef.ref}
        className="relative py-32 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        <GradientOrb className="w-[500px] h-[500px] bg-purple-500/20 -right-64 top-1/4" delay={1} />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className={cn(
            'text-center mb-20',
            featuresRef.inView ? 'animate-slide-up' : 'opacity-0'
          )}>
            <span className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm font-medium text-white/80 mb-6">
              <Sparkles className="w-4 h-4 text-secondary" />
              Powerful Features
            </span>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
              Everything You Need to{' '}
              <span className="text-gradient">Excel</span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Comprehensive tools designed to maximize your learning potential and exam performance.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={cn(
                  'group glass rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 hover:bg-white/10 transition-all duration-300 cursor-pointer',
                  featuresRef.inView ? 'animate-slide-up' : 'opacity-0'
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={cn(
                  'w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 sm:mb-4 lg:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg',
                  feature.gradient
                )}>
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <h3 className="text-sm sm:text-base lg:text-xl font-bold text-white mb-1 sm:mb-2 lg:mb-3 leading-tight">{feature.title}</h3>
                <p className="text-white/60 text-xs sm:text-sm lg:text-base leading-relaxed line-clamp-3">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Capabilities Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950" />
        <GradientOrb className="w-[400px] h-[400px] bg-emerald-500/20 -left-48 top-1/4" delay={1} />
        <GradientOrb className="w-[300px] h-[300px] bg-blue-500/20 -right-32 bottom-1/4" delay={3} />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm font-medium text-white/80 mb-6">
              <Library className="w-4 h-4 text-secondary" />
              Complete Platform
            </span>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
              Everything in{' '}
              <span className="text-gradient">One Place</span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              From learning resources to AI-powered tools, we've built everything you need to excel.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {platformCapabilities.map((category, catIndex) => (
              <div
                key={category.category}
                className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 hover:bg-white/10 transition-all duration-300"
              >
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  {catIndex === 0 && <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />}
                  {catIndex === 1 && <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />}
                  {catIndex === 2 && <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" />}
                  {catIndex === 3 && <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 flex-shrink-0" />}
                  <span className="leading-tight">{category.category}</span>
                </h3>
                <ul className="space-y-2 sm:space-y-3">
                  {category.items.map((item) => (
                    <li key={item.name} className="flex items-start gap-1.5 sm:gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white font-medium text-xs sm:text-sm leading-tight">{item.name}</p>
                        <p className="text-white/50 text-[10px] sm:text-xs leading-tight hidden sm:block">{item.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* E-Library & AI Counselor Highlight */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-primary-dark/10 to-slate-950" />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* E-Library Card */}
            <Card3D>
              <div className="glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 h-full group cursor-pointer hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform flex-shrink-0">
                    <Library className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">E-Library</h3>
                    <p className="text-white/50 text-xs sm:text-sm">Digital Learning Hub</p>
                  </div>
                </div>
                <p className="text-white/70 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                  Access PDF textbooks, video lessons, audio lectures, and interactive content. Upload and track your progress.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 text-white/80">
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">PDF Documents</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Video Lessons</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Audio Content</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Progress Tracking</span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenAuth('register')}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-white text-sm sm:text-base bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg transition-all"
                >
                  Explore Library
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </Card3D>

            {/* AI Counselor Card */}
            <Card3D>
              <div className="glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 h-full group cursor-pointer hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform flex-shrink-0">
                    <Heart className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">AI Student Counselor</h3>
                    <p className="text-white/50 text-xs sm:text-sm">Your Personal Guide</p>
                  </div>
                </div>
                <p className="text-white/70 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                  Get personalized support from AI counselors for academics, career guidance, and wellbeing. Available 24/7.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 text-white/80">
                    <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Academic Advice</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Career Guidance</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Wellbeing Support</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">24/7 Available</span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenAuth('register')}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-white text-sm sm:text-base bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg transition-all"
                >
                  Talk to Counselor
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </Card3D>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* FLASHCARDS & SPACED REPETITION SECTION */}
      {/* ========================================== */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-amber-950/20 to-slate-950" />
        <GradientOrb className="w-[500px] h-[500px] bg-amber-500/20 -right-48 top-1/4" delay={0} />
        <GradientOrb className="w-[400px] h-[400px] bg-yellow-500/20 -left-32 bottom-1/4" delay={2} />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-full text-amber-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Memory System
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-display font-bold text-white mb-4 sm:mb-6">
              Master Content with{' '}
              <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Smart Flashcards
              </span>
            </h2>
            <p className="text-sm sm:text-base lg:text-xl text-white/60 max-w-3xl mx-auto">
              Create custom flashcards or use our pre-made decks. Our spaced repetition algorithm ensures you remember what you learn, forever.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            {/* Flashcard Demo */}
            <div className="order-2 lg:order-1">
              <Card3D>
                <div className="relative">
                  {/* Stack of cards effect */}
                  <div className="absolute inset-0 glass rounded-2xl sm:rounded-3xl transform rotate-3 translate-y-2 opacity-30" />
                  <div className="absolute inset-0 glass rounded-2xl sm:rounded-3xl transform -rotate-2 translate-y-1 opacity-50" />

                  {/* Main card */}
                  <div className="relative glass rounded-2xl sm:rounded-3xl overflow-hidden">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-amber-600 to-yellow-600 p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-semibold">Physics Formulas</p>
                            <p className="text-white/70 text-sm">Card 15 of 42</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">Mechanics</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 sm:p-8 bg-slate-900/80 min-h-[280px] flex flex-col">
                      {/* Question Side */}
                      <div className="flex-1 flex flex-col items-center justify-center text-center mb-6">
                        <p className="text-white/50 text-sm mb-4">What is the formula for?</p>
                        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Kinetic Energy</h3>
                        <p className="text-white/50 text-sm">(Tap to reveal answer)</p>
                      </div>

                      {/* Answer Preview (faded) */}
                      <div className="glass rounded-xl p-4 border border-amber-500/30 bg-amber-500/5">
                        <div className="flex items-center justify-center gap-4">
                          <div className="text-center">
                            <p className="text-amber-400 font-mono text-2xl sm:text-3xl font-bold">KE = ½mv²</p>
                            <p className="text-white/50 text-xs mt-2">m = mass, v = velocity</p>
                          </div>
                        </div>
                      </div>

                      {/* Rating Buttons */}
                      <div className="flex items-center justify-center gap-3 mt-6">
                        <button className="flex-1 py-3 px-4 rounded-xl bg-rose-500/20 text-rose-400 text-sm font-medium hover:bg-rose-500/30 transition-colors">
                          Hard
                        </button>
                        <button className="flex-1 py-3 px-4 rounded-xl bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors">
                          Good
                        </button>
                        <button className="flex-1 py-3 px-4 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors">
                          Easy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card3D>
            </div>

            {/* Features List */}
            <div className="order-1 lg:order-2 space-y-6">
              <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:bg-white/10 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Spaced Repetition</h3>
                    <p className="text-white/60 text-sm sm:text-base">
                      Our algorithm shows cards at optimal intervals. You'll review difficult cards more often and easy cards less frequently.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:bg-white/10 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Layers className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Pre-made & Custom Decks</h3>
                    <p className="text-white/60 text-sm sm:text-base">
                      Use our curated decks for WASSCE, BECE, and NSMQ topics, or create your own cards for personalized study.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:bg-white/10 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Study Statistics</h3>
                    <p className="text-white/60 text-sm sm:text-base">
                      Track your retention rate, cards mastered, and study streaks. See which topics need more attention.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass rounded-xl p-4 text-center">
                  <span className="text-2xl sm:text-3xl font-bold text-amber-400">500+</span>
                  <p className="text-white/50 text-xs sm:text-sm mt-1">Pre-made Cards</p>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <span className="text-2xl sm:text-3xl font-bold text-blue-400">95%</span>
                  <p className="text-white/50 text-xs sm:text-sm mt-1">Retention Rate</p>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <span className="text-2xl sm:text-3xl font-bold text-purple-400">∞</span>
                  <p className="text-white/50 text-xs sm:text-sm mt-1">Custom Cards</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Schools & Parents Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950" />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass rounded-full text-xs sm:text-sm font-medium text-white/80 mb-4 sm:mb-6">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary" />
              For Everyone
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-display font-bold text-white mb-4 sm:mb-6">
              Built for{' '}
              <span className="text-gradient block sm:inline">Students, Teachers & Parents</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Students */}
            <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 text-center hover:bg-white/10 transition-all">
              <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-secondary to-orange-500 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-4">Students</h3>
              <p className="text-white/60 text-sm sm:text-base mb-4 sm:mb-6">
                Practice with AI tutoring, compete in battles, and access the E-Library.
              </p>
              <ul className="text-left space-y-1.5 sm:space-y-2 text-white/70 text-sm sm:text-base">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                  <span>Unlimited practice questions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                  <span>AI tutor & counselor access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                  <span>Competition & leaderboards</span>
                </li>
              </ul>
            </div>

            {/* Teachers */}
            <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 text-center hover:bg-white/10 transition-all">
              <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <PenTool className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-4">Teachers</h3>
              <p className="text-white/60 text-sm sm:text-base mb-4 sm:mb-6">
                Manage classes, create assessments, and monitor student performance.
              </p>
              <ul className="text-left space-y-1.5 sm:space-y-2 text-white/70 text-sm sm:text-base">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                  <span>Class management tools</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                  <span>Assessment builder</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                  <span>E-Library uploads</span>
                </li>
              </ul>
            </div>

            {/* Parents */}
            <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 text-center hover:bg-white/10 transition-all sm:col-span-2 lg:col-span-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Shield className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-4">Parents</h3>
              <p className="text-white/60 text-sm sm:text-base mb-4 sm:mb-6">
                Monitor your child's progress and stay connected with their learning.
              </p>
              <ul className="text-left space-y-1.5 sm:space-y-2 text-white/70 text-sm sm:text-base sm:max-w-xs sm:mx-auto lg:max-w-none">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                  <span>Progress monitoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                  <span>Weekly reports</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                  <span>Study time insights</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* ANALYTICS DASHBOARD SECTION */}
      {/* ========================================== */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-teal-950/20 to-slate-950" />
        <GradientOrb className="w-[500px] h-[500px] bg-teal-500/20 -right-48 top-1/4" delay={0} />
        <GradientOrb className="w-[400px] h-[400px] bg-cyan-500/20 -left-32 bottom-1/4" delay={2} />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30 rounded-full text-teal-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Deep Insights
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-display font-bold text-white mb-4 sm:mb-6">
              Track Every{' '}
              <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Detail of Progress
              </span>
            </h2>
            <p className="text-sm sm:text-base lg:text-xl text-white/60 max-w-3xl mx-auto">
              Comprehensive analytics dashboard with study heatmaps, predicted scores, weakness identification, and personalized recommendations.
            </p>
          </div>

          {/* Analytics Dashboard Preview */}
          <div className="max-w-5xl mx-auto mb-12 sm:mb-16">
            <Card3D>
              <div className="relative glass rounded-2xl sm:rounded-3xl overflow-hidden">
                {/* Dashboard Header */}
                <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/20 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-white">Your Analytics Dashboard</h3>
                        <p className="text-white/70 text-sm">Last 30 days performance</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" />
                        +12% this week
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-4 sm:p-6 bg-slate-900/80">
                  <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Left Column - Stats Cards */}
                    <div className="space-y-4">
                      {/* Predicted Score Card */}
                      <div className="glass rounded-xl p-4 border border-teal-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white/70 text-sm">Predicted WASSCE Grade</span>
                          <Target className="w-4 h-4 text-teal-400" />
                        </div>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl sm:text-4xl font-bold text-teal-400">B2</span>
                          <span className="text-emerald-400 text-sm mb-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Up from B3
                          </span>
                        </div>
                        <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full w-[72%] bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full" />
                        </div>
                        <p className="text-white/50 text-xs mt-2">72% confidence based on 234 questions</p>
                      </div>

                      {/* Study Streak */}
                      <div className="glass rounded-xl p-4 border border-amber-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white/70 text-sm">Study Streak</span>
                          <Flame className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl sm:text-4xl font-bold text-amber-400">14</span>
                          <span className="text-white/70 text-sm">days in a row</span>
                        </div>
                        <div className="flex gap-1 mt-3">
                          {[...Array(7)].map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "flex-1 h-6 rounded",
                                i < 7 ? "bg-amber-500/30" : "bg-white/10"
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-white/50 text-xs mt-2">Best streak: 21 days</p>
                      </div>

                      {/* Questions Practiced */}
                      <div className="glass rounded-xl p-4 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white/70 text-sm">Questions This Week</span>
                          <BookOpen className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl sm:text-4xl font-bold text-purple-400">347</span>
                          <span className="text-white/50 text-sm mb-1">/ 500 goal</span>
                        </div>
                        <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full w-[69%] bg-gradient-to-r from-purple-500 to-pink-400 rounded-full" />
                        </div>
                      </div>
                    </div>

                    {/* Middle Column - Study Heatmap */}
                    <div className="lg:col-span-2 space-y-4">
                      {/* Heatmap */}
                      <div className="glass rounded-xl p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-white font-medium">Study Activity Heatmap</span>
                          <span className="text-white/50 text-xs">Last 12 weeks</span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                          {[...Array(84)].map((_, i) => {
                            const intensity = Math.random();
                            return (
                              <div
                                key={i}
                                className={cn(
                                  "aspect-square rounded-sm",
                                  intensity > 0.8 ? "bg-teal-400" :
                                  intensity > 0.6 ? "bg-teal-500/70" :
                                  intensity > 0.4 ? "bg-teal-600/50" :
                                  intensity > 0.2 ? "bg-teal-700/30" :
                                  "bg-white/5"
                                )}
                              />
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-3 text-xs text-white/50">
                          <span>Less</span>
                          <div className="flex gap-0.5">
                            <div className="w-3 h-3 rounded-sm bg-white/5" />
                            <div className="w-3 h-3 rounded-sm bg-teal-700/30" />
                            <div className="w-3 h-3 rounded-sm bg-teal-600/50" />
                            <div className="w-3 h-3 rounded-sm bg-teal-500/70" />
                            <div className="w-3 h-3 rounded-sm bg-teal-400" />
                          </div>
                          <span>More</span>
                        </div>
                      </div>

                      {/* Subject Performance */}
                      <div className="glass rounded-xl p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-white font-medium">Subject Strengths & Weaknesses</span>
                        </div>
                        <div className="space-y-3">
                          {[
                            { subject: 'Mathematics', score: 85, color: 'from-emerald-500 to-green-400', trend: 'up' },
                            { subject: 'Physics', score: 72, color: 'from-blue-500 to-indigo-400', trend: 'up' },
                            { subject: 'Chemistry', score: 68, color: 'from-purple-500 to-pink-400', trend: 'stable' },
                            { subject: 'Biology', score: 54, color: 'from-rose-500 to-red-400', trend: 'down' },
                          ].map((item) => (
                            <div key={item.subject} className="flex items-center gap-4">
                              <span className="text-white/70 text-sm w-24 flex-shrink-0">{item.subject}</span>
                              <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className={cn("h-full bg-gradient-to-r rounded-full", item.color)}
                                  style={{ width: `${item.score}%` }}
                                />
                              </div>
                              <span className={cn(
                                "text-sm font-medium w-12 text-right",
                                item.score >= 70 ? "text-emerald-400" :
                                item.score >= 50 ? "text-amber-400" :
                                "text-rose-400"
                              )}>
                                {item.score}%
                              </span>
                              {item.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                              {item.trend === 'down' && <TrendingUp className="w-4 h-4 text-rose-400 rotate-180" />}
                              {item.trend === 'stable' && <div className="w-4 h-0.5 bg-white/30 rounded" />}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                          <div className="flex items-start gap-2">
                            <Target className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-rose-400 text-sm font-medium">Focus Area: Biology</p>
                              <p className="text-white/50 text-xs">Practice more Cell Biology and Genetics to improve</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card3D>
          </div>

          {/* Analytics Features */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                icon: BarChart3,
                title: 'Study Heatmaps',
                desc: 'Visualize your study patterns and consistency over time',
                color: 'from-teal-500 to-cyan-500'
              },
              {
                icon: Target,
                title: 'Score Prediction',
                desc: 'AI-powered grade predictions based on your performance',
                color: 'from-purple-500 to-pink-500'
              },
              {
                icon: TrendingUp,
                title: 'Progress Tracking',
                desc: 'See improvement trends across all subjects and topics',
                color: 'from-emerald-500 to-green-500'
              },
              {
                icon: Brain,
                title: 'Smart Recommendations',
                desc: 'Personalized study suggestions to target weak areas',
                color: 'from-amber-500 to-orange-500'
              }
            ].map((feature, i) => (
              <div key={i} className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 text-center hover:bg-white/10 transition-all group">
                <div className={cn(
                  "w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform",
                  feature.color
                )}>
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* TUTORING MARKETPLACE SECTION */}
      {/* ========================================== */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-cyan-950/20 to-slate-950" />
        <GradientOrb className="w-[500px] h-[500px] bg-cyan-500/20 -right-48 top-1/4" delay={0} />
        <GradientOrb className="w-[400px] h-[400px] bg-teal-500/20 -left-32 bottom-1/4" delay={2} />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-full text-cyan-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Private Tutoring
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-display font-bold text-white mb-4 sm:mb-6">
              Find Your{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Perfect Tutor
              </span>
            </h2>
            <p className="text-sm sm:text-base lg:text-xl text-white/60 max-w-3xl mx-auto">
              Connect with expert teachers for personalized 1-on-1 tutoring sessions via video call, chat, or interactive whiteboard.
            </p>
          </div>

          {/* Session Types */}
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
            <Card3D>
              <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 text-center hover:bg-white/10 transition-all h-full">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <VideoIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Video Calls</h3>
                <p className="text-white/60 text-sm sm:text-base">
                  Face-to-face sessions with screen sharing for interactive learning
                </p>
              </div>
            </Card3D>

            <Card3D>
              <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 text-center hover:bg-white/10 transition-all h-full">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Live Chat</h3>
                <p className="text-white/60 text-sm sm:text-base">
                  Quick text-based tutoring for homework help and questions
                </p>
              </div>
            </Card3D>

            <Card3D>
              <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 text-center hover:bg-white/10 transition-all h-full sm:col-span-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Presentation className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Whiteboard</h3>
                <p className="text-white/60 text-sm sm:text-base">
                  Interactive whiteboard for math and science problem solving
                </p>
              </div>
            </Card3D>
          </div>

          {/* How It Works */}
          <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 mb-12 sm:mb-16">
            <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-8 sm:mb-10">
              How It Works
            </h3>
            <div className="grid sm:grid-cols-4 gap-6 sm:gap-4">
              {[
                { step: '1', icon: Search, title: 'Browse Tutors', desc: 'Explore verified teachers by subject and rating' },
                { step: '2', icon: Calendar, title: 'Book Session', desc: 'Request a session at your preferred time' },
                { step: '3', icon: VideoIcon, title: 'Learn Together', desc: 'Connect via video, chat, or whiteboard' },
                { step: '4', icon: Star, title: 'Rate & Review', desc: 'Share feedback to help others find great tutors' },
              ].map((item, i) => (
                <div key={item.step} className="relative text-center">
                  {i < 3 && (
                    <div className="hidden sm:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-cyan-500/50 to-transparent" />
                  )}
                  <div className="relative z-10">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border-2 border-cyan-500/30 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">{item.title}</h3>
                    <p className="text-white/50 text-xs sm:text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              to="/tutors"
              className="group relative inline-flex items-center gap-2 sm:gap-3"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-all" />
              <div className="relative flex items-center gap-2 sm:gap-3 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full font-semibold text-white text-sm sm:text-base lg:text-lg shadow-2xl hover:shadow-cyan-500/40 transition-all hover:scale-105">
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                Browse Tutors
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <p className="mt-3 sm:mt-4 text-white/50 text-sm sm:text-base">
              Verified teachers with ratings and reviews
            </p>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* SOCIAL & COMMUNITY SECTION */}
      {/* ========================================== */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-violet-950/20 to-slate-950" />
        <GradientOrb className="w-[500px] h-[500px] bg-violet-500/20 -left-48 top-1/4" delay={0} />
        <GradientOrb className="w-[400px] h-[400px] bg-purple-500/20 -right-32 bottom-1/4" delay={2} />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 rounded-full text-violet-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Study Together
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-display font-bold text-white mb-4 sm:mb-6">
              Learn Better{' '}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Together
              </span>
            </h2>
            <p className="text-sm sm:text-base lg:text-xl text-white/60 max-w-3xl mx-auto">
              Connect with classmates, form study groups, and chat with students across Ghana. Learning is more fun when you're not alone.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
            {/* Friends & Connections */}
            <Card3D>
              <div className="relative glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 h-full overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">Friends</h3>
                      <p className="text-white/50 text-sm sm:text-base">Connect & Compete</p>
                    </div>
                  </div>

                  <p className="text-white/70 text-sm sm:text-base mb-6 leading-relaxed">
                    Add friends, see their activity, and challenge them to battles. Track each other's progress and celebrate wins together.
                  </p>

                  {/* Friends Preview */}
                  <div className="space-y-3 mb-6">
                    {[
                      { name: 'Kwame A.', status: 'Studying Physics', online: true, streak: 14 },
                      { name: 'Ama S.', status: 'Just won a battle!', online: true, streak: 7 },
                      { name: 'Kofi M.', status: 'Last seen 2h ago', online: false, streak: 21 },
                    ].map((friend, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {friend.name.charAt(0)}
                          </div>
                          {friend.online && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{friend.name}</p>
                          <p className="text-white/50 text-xs truncate">{friend.status}</p>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400 text-xs">
                          <Flame className="w-3 h-3" />
                          {friend.streak}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">12 friends online</span>
                    <button className="text-violet-400 hover:text-violet-300 font-medium">Find Friends</button>
                  </div>
                </div>
              </div>
            </Card3D>

            {/* Study Groups */}
            <Card3D>
              <div className="relative glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 h-full overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Users className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">Study Groups</h3>
                      <p className="text-white/50 text-sm sm:text-base">Learn as a Team</p>
                    </div>
                  </div>

                  <p className="text-white/70 text-sm sm:text-base mb-6 leading-relaxed">
                    Create or join study groups for your subjects. Share resources, discuss topics, and prepare for exams together.
                  </p>

                  {/* Groups Preview */}
                  <div className="space-y-3 mb-6">
                    {[
                      { name: 'WASSCE Maths 2025', members: 24, icon: '📐', color: 'from-blue-500 to-indigo-500' },
                      { name: 'Physics Study Squad', members: 18, icon: '⚡', color: 'from-purple-500 to-pink-500' },
                      { name: 'Biology Champions', members: 31, icon: '🧬', color: 'from-emerald-500 to-green-500' },
                    ].map((group, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                        <div className={cn(
                          "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-lg",
                          group.color
                        )}>
                          {group.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{group.name}</p>
                          <p className="text-white/50 text-xs">{group.members} members</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/30" />
                      </div>
                    ))}
                  </div>

                  <button className="w-full py-2.5 px-4 rounded-xl bg-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2">
                    <Users className="w-4 h-4" />
                    Create New Group
                  </button>
                </div>
              </div>
            </Card3D>

            {/* Chat Rooms */}
            <Card3D>
              <div className="relative glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 h-full overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">Chat Rooms</h3>
                      <p className="text-white/50 text-sm sm:text-base">Real-time Discussion</p>
                    </div>
                  </div>

                  <p className="text-white/70 text-sm sm:text-base mb-6 leading-relaxed">
                    Join subject-specific chat rooms, ask questions, share tips, and help fellow students. DM friends privately.
                  </p>

                  {/* Chat Preview */}
                  <div className="glass rounded-xl p-4 border border-pink-500/20 mb-6">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-xs">📚</div>
                      <span className="text-white text-sm font-medium">General Maths</span>
                      <span className="text-emerald-400 text-xs ml-auto flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        142 online
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs flex-shrink-0">K</div>
                        <div>
                          <span className="text-blue-400 text-xs">Kwame</span>
                          <p className="text-white/70 text-xs">Can someone explain completing the square?</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-xs flex-shrink-0">A</div>
                        <div>
                          <span className="text-emerald-400 text-xs">Ama</span>
                          <p className="text-white/70 text-xs">Sure! First, move the constant to the right...</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Type a message..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-pink-500/50"
                          disabled
                        />
                        <button className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center text-white">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-white/5">
                      <span className="text-pink-400 font-bold text-lg">50+</span>
                      <p className="text-white/50 text-xs">Chat Rooms</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                      <span className="text-pink-400 font-bold text-lg">DMs</span>
                      <p className="text-white/50 text-xs">Private Chat</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                      <span className="text-pink-400 font-bold text-lg">24/7</span>
                      <p className="text-white/50 text-xs">Moderated</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card3D>
          </div>

          {/* Community Stats */}
          <div className="glass rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent mb-1">10K+</div>
                <div className="text-white/60 text-xs sm:text-sm">Active Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-1">500+</div>
                <div className="text-white/60 text-xs sm:text-sm">Study Groups</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent mb-1">50+</div>
                <div className="text-white/60 text-xs sm:text-sm">Subject Chats</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-1">Safe</div>
                <div className="text-white/60 text-xs sm:text-sm">Moderated 24/7</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        ref={testimonialsRef.ref}
        className="relative py-16 sm:py-24 lg:py-32 overflow-hidden"
      >
        <div className="absolute inset-0 bg-slate-950" />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className={cn(
            'text-center mb-10 sm:mb-16 lg:mb-20',
            testimonialsRef.inView ? 'animate-slide-up' : 'opacity-0'
          )}>
            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass rounded-full text-xs sm:text-sm font-medium text-white/80 mb-4 sm:mb-6">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary" />
              Student Stories
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-4 sm:mb-6">
              Loved by{' '}
              <span className="text-gradient">Students</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-white/60 max-w-2xl mx-auto">
              Join thousands of students who've transformed their exam preparation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.author}
                className={cn(
                  'relative glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 hover:bg-white/10 transition-all duration-300',
                  testimonialsRef.inView ? 'animate-slide-up' : 'opacity-0'
                )}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Stars */}
                <div className="flex gap-0.5 sm:gap-1 mb-4 sm:mb-6">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-secondary fill-secondary" />
                  ))}
                </div>

                <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-white/10 mb-3 sm:mb-4" />
                <p className="text-white/80 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 leading-relaxed">"{testimonial.quote}"</p>

                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm sm:text-lg flex-shrink-0">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm sm:text-base">{testimonial.author}</p>
                    <p className="text-xs sm:text-sm text-white/50">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* FREE TRIAL SECTION */}
      {/* ========================================== */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-emerald-950/30 to-slate-950" />
        <GradientOrb className="w-[500px] h-[500px] bg-emerald-500/30 -left-32 top-0" delay={0} />
        <GradientOrb className="w-[400px] h-[400px] bg-cyan-500/30 -right-32 bottom-0" delay={2} />

        {/* Animated confetti-like particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#10B981', '#06B6D4', '#8B5CF6', '#F59E0B'][i % 4],
                opacity: 0.3,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-6xl mx-auto px-4">
          <div className="relative glass rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 overflow-hidden">
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 opacity-20" />
            <div className="absolute inset-[1px] rounded-2xl sm:rounded-3xl bg-slate-900/95" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 sm:gap-10 lg:gap-12">
              {/* Left side - Content */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                  <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Limited Time Offer
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4 sm:mb-6">
                  Start Your{' '}
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent block sm:inline">
                    {TRIAL_CONFIG.label}
                  </span>
                </h2>

                <p className="text-sm sm:text-base lg:text-xl text-white/70 mb-6 sm:mb-8 leading-relaxed">
                  Experience all premium features absolutely free. No credit card required.
                  Cancel anytime.
                </p>

                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6 sm:mb-8">
                  {[
                    { icon: Brain, text: 'AI Tutoring' },
                    { icon: PenTool, text: 'Essay Grading' },
                    { icon: Library, text: 'Full E-Library' },
                    { icon: Trophy, text: 'Competitions' },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-1.5 sm:gap-2 text-white/80 text-xs sm:text-sm lg:text-base">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                      </div>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleOpenAuth('register')}
                  className="group relative inline-flex items-center gap-2 sm:gap-3"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-all" />
                  <div className="relative flex items-center gap-2 sm:gap-3 px-5 sm:px-6 lg:px-8 py-3 sm:py-3.5 lg:py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full font-semibold text-white text-sm sm:text-base lg:text-lg shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-105">
                    <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Right side - Visual */}
              <div className="flex-shrink-0 relative">
                <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80">
                  {/* Rotating ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/30 animate-spin-slow" />
                  <div className="absolute inset-3 sm:inset-4 rounded-full border-2 border-dashed border-cyan-500/30 animate-spin-slow" style={{ animationDirection: 'reverse' }} />

                  {/* Center content */}
                  <div className="absolute inset-6 sm:inset-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 backdrop-blur-xl flex flex-col items-center justify-center">
                    <div className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                      7
                    </div>
                    <div className="text-base sm:text-lg md:text-xl text-white/80 font-medium">Days Free</div>
                    <div className="text-xs sm:text-sm text-white/50 mt-0.5 sm:mt-1">Full Access</div>
                  </div>

                  {/* Floating badges */}
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 px-2.5 sm:px-4 py-1 sm:py-2 bg-amber-700 rounded-full text-white text-xs sm:text-sm font-semibold shadow-lg animate-bounce whitespace-nowrap">
                    No Credit Card!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* PRICING PREVIEW SECTION */}
      {/* ========================================== */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950" />
        <GradientOrb className="w-[400px] h-[400px] bg-purple-500/20 -right-32 top-1/4" delay={1} />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass rounded-full text-xs sm:text-sm font-medium text-white/80 mb-4 sm:mb-6">
              <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary" />
              Simple Pricing
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-display font-bold text-white mb-4 sm:mb-6">
              Affordable Plans for{' '}
              <span className="text-gradient block sm:inline">Everyone</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-xl text-white/60 max-w-2xl mx-auto">
              Start free, upgrade when ready. Plans designed for Ghanaian students and teachers.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 hover:bg-white/10 transition-all group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Free</h3>
              <p className="text-white/50 text-sm sm:text-base mb-4 sm:mb-6">Practice daily, forever free</p>
              <div className="flex items-baseline mb-4 sm:mb-8">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">{PRICING_CONFIG.plans.free.monthlyPrice}</span>
                <span className="text-lg sm:text-xl text-white/50 ml-2">{PRICING_CONFIG.currency}</span>
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-8">
                {['10 questions daily', '4 core subjects', 'Full E-Library', 'Community access'].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-white/70 text-sm sm:text-base">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleOpenAuth('register')}
                className="w-full py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl border border-emerald-500/30 text-emerald-400 font-medium text-sm sm:text-base hover:bg-emerald-500/10 transition-all"
              >
                Start Free
              </button>
            </div>

            {/* Student Premium */}
            <div className="relative glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 border-2 border-secondary/50 hover:border-secondary transition-all group sm:col-span-2 lg:col-span-1">
              <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r from-secondary to-amber-400 rounded-full text-slate-900 text-xs sm:text-sm font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                  Most Popular
                </span>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-secondary/30 to-amber-500/30 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-secondary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Student</h3>
              <p className="text-white/50 text-sm sm:text-base mb-4 sm:mb-6">Full access for students</p>
              <div className="flex items-baseline mb-1 sm:mb-2">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">{PRICING_CONFIG.plans.student.monthlyPrice}</span>
                <span className="text-lg sm:text-xl text-white/50 ml-2">{PRICING_CONFIG.currency}/mo</span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-400 mb-4 sm:mb-8">or {PRICING_CONFIG.plans.student.yearlyPrice} {PRICING_CONFIG.currency}/year (save {PRICING_CONFIG.plans.student.yearlyDiscount}%)</p>
              <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-8">
                {['Unlimited questions', 'All 9+ subjects', 'AI essay grading', 'Priority AI tutoring', 'Advanced analytics'].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-white/70 text-sm sm:text-base">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-secondary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleOpenAuth('register')}
                className="w-full py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-secondary to-amber-400 text-slate-900 font-semibold text-sm sm:text-base hover:shadow-lg hover:shadow-secondary/30 transition-all"
              >
                Start Free Trial
              </button>
            </div>

            {/* Teacher Premium */}
            <div className="glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 hover:bg-white/10 transition-all group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Teacher</h3>
              <p className="text-white/50 text-sm sm:text-base mb-4 sm:mb-6">Complete teaching toolkit</p>
              <div className="flex items-baseline mb-1 sm:mb-2">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">{PRICING_CONFIG.plans.teacher.monthlyPrice}</span>
                <span className="text-lg sm:text-xl text-white/50 ml-2">{PRICING_CONFIG.currency}/mo</span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-400 mb-4 sm:mb-8">or {PRICING_CONFIG.plans.teacher.yearlyPrice} {PRICING_CONFIG.currency}/year (save {PRICING_CONFIG.plans.teacher.yearlyDiscount}%)</p>
              <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-8">
                {['Everything in Student', 'Class management', 'Assessment builder', 'Student analytics', 'Bulk grading'].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-white/70 text-sm sm:text-base">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleOpenAuth('register')}
                className="w-full py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-sm sm:text-base hover:shadow-lg hover:shadow-blue-500/30 transition-all"
              >
                Start Free Trial
              </button>
            </div>
          </div>

          <div className="text-center mt-8 sm:mt-10 lg:mt-12">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-1.5 sm:gap-2 text-secondary hover:text-secondary/80 font-medium text-sm sm:text-base transition-colors"
            >
              View full pricing details
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* TEACH & EARN SECTION (For Teachers) */}
      {/* ========================================== */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-amber-950/20 to-slate-950" />
        <GradientOrb className="w-[500px] h-[500px] bg-amber-500/20 -left-48 top-0" delay={0} />
        <GradientOrb className="w-[400px] h-[400px] bg-orange-500/20 -right-32 bottom-0" delay={2} />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full text-amber-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              For Teachers
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-display font-bold text-white mb-4 sm:mb-6">
              Teach & Earn{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Extra Income
              </span>
            </h2>
            <p className="text-sm sm:text-base lg:text-xl text-white/60 max-w-3xl mx-auto">
              Join Brilla's tutoring marketplace and year-end bonus program to earn while you teach.
            </p>
          </div>

          {/* Two Earning Paths */}
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
            {/* Private Tutoring */}
            <Card3D>
              <div className="relative glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 h-full overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-xl">
                      <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">Private Tutoring</h3>
                      <p className="text-white/50 text-sm sm:text-base">Tutoring Marketplace</p>
                    </div>
                  </div>

                  <p className="text-white/70 text-sm sm:text-base mb-6 leading-relaxed">
                    List your profile in our tutor directory and connect with students seeking personalized help in your subjects.
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-white/80">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Percent className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-sm sm:text-base">Keep <span className="text-emerald-400 font-semibold">85%</span> of session fees</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <VideoIcon className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-sm sm:text-base">Video, chat, or whiteboard sessions</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-sm sm:text-base">Set your own schedule & rates</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Star className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="text-sm sm:text-base">Build reputation with reviews</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20">
                    <p className="text-center">
                      <span className="text-2xl sm:text-3xl font-bold text-cyan-400">GHS 50-200</span>
                      <span className="text-white/60 text-sm sm:text-base"> /hour typical</span>
                    </p>
                  </div>
                </div>
              </div>
            </Card3D>

            {/* Year-End Bonus */}
            <Card3D>
              <div className="relative glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 h-full overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Hot badge */}
                <div className="absolute -top-0 -right-0">
                  <div className="px-3 py-1 bg-gradient-to-r from-rose-500 to-pink-500 rounded-bl-xl rounded-tr-2xl text-white text-xs font-semibold flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    NEW
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-xl">
                      <Gift className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">Year-End Bonus</h3>
                      <p className="text-white/50 text-sm sm:text-base">Student Referral Program</p>
                    </div>
                  </div>

                  <p className="text-white/70 text-sm sm:text-base mb-6 leading-relaxed">
                    Refer your students to Brilla Prep and earn a percentage of their annual subscription payments at year-end.
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-white/80">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="text-sm sm:text-base">Earn <span className="text-amber-400 font-semibold">15-35%</span> based on referrals</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-sm sm:text-base">Higher tier = higher bonus rate</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-sm sm:text-base">5+ active students to qualify</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-4 h-4 text-rose-400" />
                      </div>
                      <span className="text-sm sm:text-base">Paid via Mobile Money</span>
                    </div>
                  </div>

                  {/* Tier preview */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center">
                      {[
                        { refs: '5-10', rate: '15%' },
                        { refs: '11-20', rate: '20%' },
                        { refs: '21-35', rate: '25%' },
                        { refs: '36-50', rate: '30%' },
                        { refs: '51+', rate: '35%' },
                      ].map((tier) => (
                        <div key={tier.refs}>
                          <div className="text-amber-400 font-bold text-xs sm:text-sm">{tier.rate}</div>
                          <div className="text-white/40 text-[10px] sm:text-xs">{tier.refs}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card3D>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={() => handleOpenAuth('register')}
              className="group relative inline-flex items-center gap-2 sm:gap-3"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-all" />
              <div className="relative flex items-center gap-2 sm:gap-3 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full font-semibold text-white text-sm sm:text-base lg:text-lg shadow-2xl hover:shadow-amber-500/40 transition-all hover:scale-105">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                Join as Teacher
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
            <p className="mt-3 sm:mt-4 text-white/50 text-sm sm:text-base">
              Start earning today with Brilla's teacher programs
            </p>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* AFFILIATE PROGRAM SECTION */}
      {/* ========================================== */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-pink-950/20 to-slate-950" />
        <GradientOrb className="w-[500px] h-[500px] bg-pink-500/30 -left-48 top-1/4" delay={0} />
        <GradientOrb className="w-[400px] h-[400px] bg-purple-500/30 -right-32 bottom-1/4" delay={2} />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-full text-pink-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Earn While You Learn
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-display font-bold text-white mb-4 sm:mb-6">
              Join the{' '}
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent block sm:inline">
                Brilla Ambassador
              </span>
              <span className="block sm:inline">{' '}Program</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-xl text-white/60 max-w-3xl mx-auto">
              Share Brilla Prep with friends and earn up to {AFFILIATE_CONFIG.maxCommission}% commission on every subscription.
            </p>
          </div>

          {/* Commission Tiers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-12 sm:mb-16">
            {AFFILIATE_CONFIG.tiers.map((tier, index) => (
              <Card3D key={tier.rank}>
                <div
                  className={cn(
                    'relative glass rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 text-center group cursor-pointer transition-all duration-500',
                    index === 4 && 'col-span-2 sm:col-span-1'
                  )}
                >
                  <div className={cn(
                    'absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br',
                    tier.color
                  )} style={{ padding: '1px' }}>
                    <div className="w-full h-full bg-slate-900 rounded-xl sm:rounded-2xl" />
                  </div>

                  <div className="relative z-10">
                    <div className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3">{tier.icon}</div>
                    <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white mb-0.5 sm:mb-1">{tier.rank}</h3>
                    <p className="text-white/50 text-xs sm:text-sm mb-2 sm:mb-3">{formatRefRange(tier.minRefs, tier.maxRefs)} refs</p>
                    <div className={cn(
                      'inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r font-bold text-white text-xs sm:text-sm',
                      tier.color
                    )}>
                      {formatCommissionRate(tier.rate, tier.bonus)}
                    </div>
                  </div>
                </div>
              </Card3D>
            ))}
          </div>

          {/* Benefits Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
            <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 text-center hover:bg-white/10 transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-2 sm:mb-3">Instant Mobile Money</h3>
              <p className="text-white/60 text-sm sm:text-base">
                Get paid directly to MTN MoMo, Vodafone Cash, or AirtelTigo Money!
              </p>
            </div>

            <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 text-center hover:bg-white/10 transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Trophy className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-2 sm:mb-3">Leaderboards & Prizes</h3>
              <p className="text-white/60 text-sm sm:text-base">
                Compete on leaderboards. Top affiliates win monthly cash prizes!
              </p>
            </div>

            <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 text-center hover:bg-white/10 transition-all sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-2 sm:mb-3">XP & Achievements</h3>
              <p className="text-white/60 text-sm sm:text-base">
                Earn XP, unlock badges, and level up your affiliate rank!
              </p>
            </div>
          </div>

          {/* Teacher Bonus Banner */}
          <div className="relative glass rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 mb-8 sm:mb-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full text-amber-400 text-xs sm:text-sm font-medium mb-2">
                    <BadgeCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                    Teacher Bonus
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Teachers get 1.5x faster tier progression!</h3>
                  <p className="text-white/60 text-sm sm:text-base">Refer students and climb the ranks 50% faster.</p>
                </div>
              </div>
              <button
                onClick={() => handleOpenAuth('register')}
                className="w-full sm:w-auto flex-shrink-0 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg sm:rounded-xl font-semibold text-white text-sm sm:text-base hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                Join as Teacher
              </button>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={() => handleOpenAuth('register')}
              className="group relative inline-flex items-center gap-2 sm:gap-3"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-all" />
              <div className="relative flex items-center gap-2 sm:gap-3 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full font-semibold text-white text-sm sm:text-base lg:text-lg shadow-2xl hover:shadow-purple-500/40 transition-all hover:scale-105">
                <PartyPopper className="w-4 h-4 sm:w-5 sm:h-5" />
                Start Earning Today
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
            <p className="mt-3 sm:mt-4 text-white/50 text-sm sm:text-base">
              Join thousands of students and teachers earning with Brilla
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        ref={ctaRef.ref}
        className="relative py-32 overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-primary-dark/20 to-slate-950" />
        <GradientOrb className="w-[600px] h-[600px] bg-primary/40 left-1/2 -translate-x-1/2 top-0" />
        <GradientOrb className="w-[400px] h-[400px] bg-secondary/40 left-1/4 bottom-0" delay={2} />

        {/* Content */}
        <div className={cn(
          'relative z-10 max-w-4xl mx-auto text-center px-4',
          ctaRef.inView ? 'animate-scale-in' : 'opacity-0'
        )}>
          <div className="w-20 h-20 glass rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Award className="w-10 h-10 text-secondary" />
          </div>

          <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-8">
            Ready to{' '}
            <span className="text-gradient glow-text">Shine?</span>
          </h2>

          <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join students preparing smarter with Brilla Prep.
            Your journey to academic excellence starts here.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => handleOpenAuth('register')} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-secondary to-yellow-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-all" />
              <div className="relative flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-secondary to-yellow-400 rounded-full font-semibold text-slate-900 text-lg shadow-2xl hover:shadow-secondary/40 transition-all hover:scale-105">
                Create Free Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          <p className="mt-8 text-white/50 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Takes less than 2 minutes to get started
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-950 border-t border-white/5 py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12 mb-8 sm:mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg sm:text-xl">B</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-xl sm:text-2xl text-white leading-tight">Brilla Prep</span>
                  <span className="text-[9px] sm:text-[10px] text-white/50 tracking-wider">Prepare. Excel. Succeed.</span>
                </div>
              </div>
              <p className="text-white/50 text-sm sm:text-base leading-relaxed">
                Ace your BECE, WASSCE, and NSMQ. Master Mathematics, Physics, Chemistry, and Biology with confidence.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold text-white text-sm sm:text-base mb-3 sm:mb-4">Platform</h3>
              <ul className="space-y-2 sm:space-y-3 text-white/50 text-sm sm:text-base">
                <li><Link to="/topics" className="hover:text-white transition">Topics</Link></li>
                <li><Link to="/practice" className="hover:text-white transition">Practice</Link></li>
                <li><Link to="/past-papers" className="hover:text-white transition">Past Papers</Link></li>
                <li><Link to="/tutors" className="hover:text-white transition">Find a Tutor</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white text-sm sm:text-base mb-3 sm:mb-4">Exams & More</h3>
              <ul className="space-y-2 sm:space-y-3 text-white/50 text-sm sm:text-base">
                <li><Link to="/competition" className="hover:text-white transition">NSMQ Prep</Link></li>
                <li><Link to="/past-papers" className="hover:text-white transition">WASSCE Prep</Link></li>
                <li><Link to="/past-papers" className="hover:text-white transition">BECE Prep</Link></li>
                <li><Link to="/affiliate" className="hover:text-white transition">Earn as Affiliate</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white text-sm sm:text-base mb-3 sm:mb-4">Support</h3>
              <ul className="space-y-2 sm:space-y-3 text-white/50 text-sm sm:text-base">
                <li><Link to="/help" className="hover:text-white transition">Help Center</Link></li>
                <li><a href={`mailto:${SITE_CONFIG.supportEmail}`} className="hover:text-white transition cursor-pointer">Contact Us</a></li>
                <li><Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 sm:pt-8 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-white/60 text-xs sm:text-sm text-center md:text-left">
              &copy; {new Date().getFullYear()} Brilla Prep. All rights reserved.
            </p>
            <p className="text-white/60 text-xs sm:text-sm flex items-center gap-1">
              Empowering champions <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent fill-accent" aria-hidden="true" /> one question at a time
            </p>
          </div>
        </div>
      </footer>

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Promotional Popup */}
      <PromoPopup onOpenAuth={handleOpenAuth} />

      {/* Floating CTA */}
      <FloatingCTA onOpenAuth={handleOpenAuth} isVisible={scrollState.showFloatingCTA} />
    </div>
  );
}

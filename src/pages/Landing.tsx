import { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import { cn } from '@/utils';
import { AuthModal } from '@/components/auth';

// ============================================
// HOOKS
// ============================================

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

// Mouse parallax hook
function useMouseParallax(intensity = 0.02) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) * intensity;
      const y = (e.clientY - window.innerHeight / 2) * intensity;
      setPosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
          return 3000;
        }
        // Human-like typing speed with slight variation
        return 180 + Math.random() * 80; // 180-260ms per character
      } else {
        // Deleting backward
        state.charIndex--;
        setDisplayText(currentWord.slice(0, state.charIndex));

        if (state.charIndex <= 0) {
          // Finished deleting, move to next word
          state.isDeleting = false;
          state.wordIndex = (state.wordIndex + 1) % texts.length;
          return 600; // Pause before next word
        }
        return 100; // Deleting speed
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
      <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:border-white/20 transition-all">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-4 group-hover:scale-110 transition-transform">
          <stat.icon className="w-7 h-7 text-secondary" />
        </div>
        <div className="text-2xl md:text-3xl font-bold text-white mb-1">
          {stat.text}
        </div>
        <div className="text-white/70 text-sm">{stat.label}</div>
      </div>
    </div>
  );
}

// Landing Header Component
interface LandingHeaderProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

function LandingHeader({ onOpenAuth }: LandingHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isInstallable, install } = usePWAInstall();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
      <div className="relative w-full max-w-lg animate-scale-in">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-pink-500 to-purple-500 rounded-3xl blur-2xl opacity-30 animate-pulse-glow" />

        <div className="relative bg-slate-900 rounded-3xl overflow-hidden border border-white/10">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>

          {/* Header with gradient */}
          <div className="relative h-32 bg-gradient-to-r from-secondary via-pink-500 to-purple-500 flex items-center justify-center overflow-hidden">
            {/* Animated particles */}
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-white/30 animate-float"
                style={{
                  left: `${10 + i * 10}%`,
                  top: `${20 + (i % 3) * 20}%`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
            <div className="relative flex items-center gap-3">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white/80 text-sm font-medium">Limited Time</p>
                <p className="text-white text-2xl font-bold">14 Days FREE!</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-2xl font-bold text-white text-center mb-2">
              Start Your Free Trial Today
            </h3>
            <p className="text-white/60 text-center mb-6">
              Get full access to all premium features. No credit card needed!
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { icon: Brain, text: 'AI Tutoring', color: 'text-purple-400' },
                { icon: PenTool, text: 'Essay Grading', color: 'text-pink-400' },
                { icon: Trophy, text: 'Competitions', color: 'text-amber-400' },
                { icon: Library, text: 'E-Library', color: 'text-blue-400' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-white/80 text-sm">{item.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => { handleDismiss(); onOpenAuth('register'); }}
                className="w-full py-4 bg-gradient-to-r from-secondary via-pink-500 to-purple-500 rounded-xl font-semibold text-white text-lg hover:shadow-lg hover:shadow-secondary/30 transition-all flex items-center justify-center gap-2"
              >
                <Rocket className="w-5 h-5" />
                Start Free Trial
              </button>
              <button
                onClick={handleDismiss}
                className="w-full py-3 text-white/50 hover:text-white/70 transition-colors text-sm"
              >
                Maybe later
              </button>
            </div>

            {/* Affiliate teaser */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-center gap-2 text-sm">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-white/60">
                  Earn up to <span className="text-amber-400 font-semibold">50% commission</span> as an affiliate!
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
function FloatingCTA({ onOpenAuth }: { onOpenAuth: (mode: 'login' | 'register') => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past 500px
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          <span>Start 14-Day Free Trial</span>
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
        >
          <X className="w-5 h-5" />
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
  { text: 'Growing Community', label: 'Join Learners Across Ghana', icon: Users },
  { text: 'Comprehensive', label: 'Question Bank', icon: BookOpen },
  { text: 'Built For', label: 'NSMQ, WASSCE & BECE Success', icon: TrendingUp },
  { text: 'Trusted By', label: 'Schools Nationwide', icon: GraduationCap },
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
      { name: 'Past Papers', description: 'WASSCE & BECE with marking schemes' },
      { name: 'Topic Notes', description: 'Comprehensive study materials' },
      { name: 'Practice Questions', description: 'Comprehensive question bank' },
    ],
  },
  {
    category: 'AI Features',
    items: [
      { name: 'AI Tutor', description: 'Instant explanations & guidance' },
      { name: 'AI Counselor', description: 'Academic, career & wellness support' },
      { name: 'Essay Grading', description: 'Instant AI feedback on essays' },
      { name: 'Adaptive Learning', description: 'Personalized question difficulty' },
    ],
  },
  {
    category: 'Competition & Games',
    items: [
      { name: 'NSMQ Simulation', description: 'All 5 rounds recreated' },
      { name: 'Live Battles', description: 'Real-time 1v1 competitions' },
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

export function LandingPage() {
  const mousePosition = useMouseParallax(0.02);
  const heroRef = useInView(0.1);
  const statsRef = useInView(0.3);
  const modesRef = useInView(0.2);
  const featuresRef = useInView(0.2);
  const testimonialsRef = useInView(0.2);
  const ctaRef = useInView(0.3);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Generate particles
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 10,
  }));

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
      <LandingHeader onOpenAuth={handleOpenAuth} />

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
              <TypewriterText texts={['NSMQ', 'WASSCE', 'BECE']} />
            </span>
            <br />
            <span className="text-white">with </span>
            <span className="relative">
              <span className="text-gradient">Brilla Prep</span>
              <Sparkles className="absolute -top-2 -right-8 w-6 h-6 text-secondary animate-pulse" />
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
              <div>
                <p className="text-white font-semibold">
                  <span className="text-emerald-400">14-Day Free Trial</span>
                  {' '}+ Earn up to{' '}
                  <span className="text-secondary">50% Commission</span>
                  {' '}as an Affiliate!
                </p>
                <p className="text-white/60 text-sm">No credit card required. Start learning and earning today.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOpenAuth('register')}
                className="px-6 py-3 bg-gradient-to-r from-secondary to-amber-400 rounded-xl font-semibold text-slate-900 hover:shadow-lg hover:shadow-secondary/30 transition-all whitespace-nowrap"
              >
                Start Free Trial
              </button>
              <Link
                to="/affiliate"
                className="px-6 py-3 glass rounded-xl font-medium text-white hover:bg-white/10 transition-all whitespace-nowrap"
              >
                Learn More
              </Link>
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
              <span className="text-gradient">Three Exams.</span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Whether you're preparing for NSMQ, WASSCE, or BECE, we've got the tools you need to succeed.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {examModes.map((mode, index) => (
              <Card3D key={mode.id}>
                <div
                  className={cn(
                    'relative h-full glass rounded-3xl p-8 overflow-hidden group cursor-pointer transition-all duration-500',
                    modesRef.inView ? 'animate-slide-up' : 'opacity-0'
                  )}
                  style={{
                    animationDelay: `${index * 0.15}s`,
                    background: mode.bgImage,
                  }}
                >
                  {/* Gradient Border Effect */}
                  <div className={cn(
                    'absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                    'bg-gradient-to-r p-[1px]',
                    mode.color
                  )}>
                    <div className="w-full h-full bg-slate-950 rounded-3xl" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={cn(
                      'w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl',
                      mode.color
                    )}>
                      <mode.icon className="w-10 h-10 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-3xl font-bold text-white mb-2">{mode.name}</h3>
                    <p className="text-white/50 text-sm mb-4">{mode.fullName}</p>
                    <p className="text-white/70 mb-8">{mode.description}</p>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {mode.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-white/80">
                          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <button
                      onClick={() => handleOpenAuth('register')}
                      className={cn(
                        'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 group/btn',
                        mode.color
                      )}
                    >
                      Get Started
                      <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </Card3D>
            ))}
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={cn(
                  'group glass rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 cursor-pointer',
                  featuresRef.inView ? 'animate-slide-up' : 'opacity-0'
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={cn(
                  'w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg',
                  feature.gradient
                )}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed">{feature.description}</p>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformCapabilities.map((category, catIndex) => (
              <div
                key={category.category}
                className="glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  {catIndex === 0 && <FileText className="w-5 h-5 text-blue-400" />}
                  {catIndex === 1 && <Brain className="w-5 h-5 text-purple-400" />}
                  {catIndex === 2 && <Swords className="w-5 h-5 text-amber-400" />}
                  {catIndex === 3 && <Flame className="w-5 h-5 text-orange-400" />}
                  {category.category}
                </h3>
                <ul className="space-y-3">
                  {category.items.map((item) => (
                    <li key={item.name} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white font-medium text-sm">{item.name}</p>
                        <p className="text-white/50 text-xs">{item.description}</p>
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
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-primary-dark/10 to-slate-950" />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* E-Library Card */}
            <Card3D>
              <div className="glass rounded-3xl p-8 h-full group cursor-pointer hover:bg-white/10 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Library className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">E-Library</h3>
                    <p className="text-white/50">Digital Learning Hub</p>
                  </div>
                </div>
                <p className="text-white/70 mb-6 leading-relaxed">
                  Access a rich collection of educational resources including PDF textbooks, video lessons,
                  audio lectures, and interactive content. Upload, organize, and track your learning progress.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-white/80">
                    <FileText className="w-4 h-4 text-red-400" />
                    <span className="text-sm">PDF Documents</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <Video className="w-4 h-4 text-purple-400" />
                    <span className="text-sm">Video Lessons</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <Headphones className="w-4 h-4 text-green-400" />
                    <span className="text-sm">Audio Content</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    <span className="text-sm">Progress Tracking</span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenAuth('register')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg transition-all"
                >
                  Explore Library
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </Card3D>

            {/* AI Counselor Card */}
            <Card3D>
              <div className="glass rounded-3xl p-8 h-full group cursor-pointer hover:bg-white/10 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">AI Student Counselor</h3>
                    <p className="text-white/50">Your Personal Guide</p>
                  </div>
                </div>
                <p className="text-white/70 mb-6 leading-relaxed">
                  Get personalized support from AI counselors specialized in academics, career guidance,
                  and student wellbeing. Available 24/7 to help you navigate your educational journey.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-white/80">
                    <GraduationCap className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">Academic Advice</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-sm">Career Guidance</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span className="text-sm">Wellbeing Support</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <MessageCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm">24/7 Available</span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenAuth('register')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg transition-all"
                >
                  Talk to Counselor
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </Card3D>
          </div>
        </div>
      </section>

      {/* For Schools & Parents Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950" />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm font-medium text-white/80 mb-6">
              <Users className="w-4 h-4 text-secondary" />
              For Everyone
            </span>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
              Built for{' '}
              <span className="text-gradient">Students, Teachers & Parents</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Students */}
            <div className="glass rounded-2xl p-8 text-center hover:bg-white/10 transition-all">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-orange-500 flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Students</h3>
              <p className="text-white/60 mb-6">
                Practice with AI tutoring, compete in battles, track your progress, and access the E-Library.
              </p>
              <ul className="text-left space-y-2 text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Unlimited practice questions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  AI tutor & counselor access
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Competition & leaderboards
                </li>
              </ul>
            </div>

            {/* Teachers */}
            <div className="glass rounded-2xl p-8 text-center hover:bg-white/10 transition-all">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-6">
                <PenTool className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Teachers</h3>
              <p className="text-white/60 mb-6">
                Manage classes, create assessments, upload resources, and monitor student performance.
              </p>
              <ul className="text-left space-y-2 text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Class management tools
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Assessment builder
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  E-Library uploads
                </li>
              </ul>
            </div>

            {/* Parents */}
            <div className="glass rounded-2xl p-8 text-center hover:bg-white/10 transition-all">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Parents</h3>
              <p className="text-white/60 mb-6">
                Monitor your child's progress, receive reports, and stay connected with their learning journey.
              </p>
              <ul className="text-left space-y-2 text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Progress monitoring
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Weekly reports
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Study time insights
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        ref={testimonialsRef.ref}
        className="relative py-32 overflow-hidden"
      >
        <div className="absolute inset-0 bg-slate-950" />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className={cn(
            'text-center mb-20',
            testimonialsRef.inView ? 'animate-slide-up' : 'opacity-0'
          )}>
            <span className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm font-medium text-white/80 mb-6">
              <Star className="w-4 h-4 text-secondary" />
              Student Stories
            </span>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
              Loved by{' '}
              <span className="text-gradient">Students</span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Join thousands of students who've transformed their exam preparation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.author}
                className={cn(
                  'relative glass rounded-2xl p-8 hover:bg-white/10 transition-all duration-300',
                  testimonialsRef.inView ? 'animate-slide-up' : 'opacity-0'
                )}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-secondary fill-secondary" />
                  ))}
                </div>

                <Quote className="w-10 h-10 text-white/10 mb-4" />
                <p className="text-white/80 text-lg mb-8 leading-relaxed">"{testimonial.quote}"</p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.author}</p>
                    <p className="text-sm text-white/50">{testimonial.role}</p>
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
      <section className="relative py-32 overflow-hidden">
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
          <div className="relative glass rounded-3xl p-8 md:p-12 overflow-hidden">
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 opacity-20" />
            <div className="absolute inset-[1px] rounded-3xl bg-slate-900/95" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
              {/* Left side - Content */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-medium mb-6">
                  <Gift className="w-4 h-4" />
                  Limited Time Offer
                </div>

                <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                  Start Your{' '}
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    14-Day Free Trial
                  </span>
                </h2>

                <p className="text-xl text-white/70 mb-8 leading-relaxed">
                  Experience all premium features absolutely free. No credit card required.
                  Cancel anytime. Your success journey starts here!
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    { icon: Brain, text: 'AI Tutoring' },
                    { icon: PenTool, text: 'Essay Grading' },
                    { icon: Library, text: 'Full E-Library' },
                    { icon: Trophy, text: 'Competitions' },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-2 text-white/80">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleOpenAuth('register')}
                  className="group relative inline-flex items-center gap-3"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-all" />
                  <div className="relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full font-semibold text-white text-lg shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-105">
                    <Rocket className="w-5 h-5" />
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Right side - Visual */}
              <div className="flex-shrink-0 relative">
                <div className="relative w-64 h-64 md:w-80 md:h-80">
                  {/* Rotating ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/30 animate-spin-slow" />
                  <div className="absolute inset-4 rounded-full border-2 border-dashed border-cyan-500/30 animate-spin-slow" style={{ animationDirection: 'reverse' }} />

                  {/* Center content */}
                  <div className="absolute inset-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 backdrop-blur-xl flex flex-col items-center justify-center">
                    <div className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                      14
                    </div>
                    <div className="text-xl text-white/80 font-medium">Days Free</div>
                    <div className="text-sm text-white/50 mt-1">Full Access</div>
                  </div>

                  {/* Floating badges */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-500 rounded-full text-white text-sm font-semibold shadow-lg animate-bounce">
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
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950" />
        <GradientOrb className="w-[400px] h-[400px] bg-purple-500/20 -right-32 top-1/4" delay={1} />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm font-medium text-white/80 mb-6">
              <Crown className="w-4 h-4 text-secondary" />
              Simple Pricing
            </span>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
              Affordable Plans for{' '}
              <span className="text-gradient">Everyone</span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Start free, upgrade when ready. Plans designed for Ghanaian students and teachers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="glass rounded-3xl p-8 hover:bg-white/10 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-neutral-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-neutral-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <p className="text-white/50 mb-6">Get started with basics</p>
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-bold text-white">0</span>
                <span className="text-xl text-white/50 ml-2">GHS</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Unlimited questions', 'Model answers', 'Basic analytics', 'Community access'].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-white/70">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleOpenAuth('register')}
                className="w-full py-3 px-4 rounded-xl border border-white/20 text-white font-medium hover:bg-white/10 transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Student Premium */}
            <div className="relative glass rounded-3xl p-8 border-2 border-secondary/50 hover:border-secondary transition-all group">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1.5 bg-gradient-to-r from-secondary to-amber-400 rounded-full text-slate-900 text-sm font-semibold flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  Most Popular
                </span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary/30 to-amber-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Crown className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Student</h3>
              <p className="text-white/50 mb-6">Full access for students</p>
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-bold text-white">50</span>
                <span className="text-xl text-white/50 ml-2">GHS/mo</span>
              </div>
              <p className="text-sm text-emerald-400 mb-8">or 480 GHS/year (save 20%)</p>
              <ul className="space-y-3 mb-8">
                {['Everything in Free', 'AI essay grading', 'Full past papers', 'Advanced analytics', 'Priority support'].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-white/70">
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleOpenAuth('register')}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-secondary to-amber-400 text-slate-900 font-semibold hover:shadow-lg hover:shadow-secondary/30 transition-all"
              >
                Start Free Trial
              </button>
            </div>

            {/* Teacher Premium */}
            <div className="glass rounded-3xl p-8 hover:bg-white/10 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Teacher</h3>
              <p className="text-white/50 mb-6">Complete teaching toolkit</p>
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-bold text-white">75</span>
                <span className="text-xl text-white/50 ml-2">GHS/mo</span>
              </div>
              <p className="text-sm text-emerald-400 mb-8">or 720 GHS/year (save 20%)</p>
              <ul className="space-y-3 mb-8">
                {['Everything in Student', 'Class management', 'Assessment builder', 'Student analytics', 'Bulk grading'].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-white/70">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleOpenAuth('register')}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
              >
                Start Free Trial
              </button>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 text-secondary hover:text-secondary/80 font-medium transition-colors"
            >
              View full pricing details
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* AFFILIATE PROGRAM SECTION */}
      {/* ========================================== */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-pink-950/20 to-slate-950" />
        <GradientOrb className="w-[500px] h-[500px] bg-pink-500/30 -left-48 top-1/4" delay={0} />
        <GradientOrb className="w-[400px] h-[400px] bg-purple-500/30 -right-32 bottom-1/4" delay={2} />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-full text-pink-400 text-sm font-medium mb-6">
              <Coins className="w-4 h-4" />
              Earn While You Learn
            </span>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
              Join the{' '}
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Brilla Ambassador
              </span>
              {' '}Program
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Share Brilla Prep with friends and earn up to 50% commission on every subscription.
              The more you share, the more you earn!
            </p>
          </div>

          {/* Commission Tiers */}
          <div className="grid md:grid-cols-5 gap-4 mb-16">
            {[
              { rank: 'Scout', icon: '🔰', refs: '1-5', rate: '25%', color: 'from-emerald-500 to-green-600' },
              { rank: 'Champion', icon: '⚔️', refs: '6-15', rate: '30%', color: 'from-blue-500 to-indigo-600' },
              { rank: 'Ambassador', icon: '🛡️', refs: '16-30', rate: '40%', color: 'from-purple-500 to-violet-600' },
              { rank: 'Legend', icon: '👑', refs: '31-50', rate: '50%', color: 'from-amber-500 to-orange-600' },
              { rank: 'Elite', icon: '💎', refs: '51+', rate: '50%+', color: 'from-pink-500 to-rose-600' },
            ].map((tier, index) => (
              <Card3D key={tier.rank}>
                <div
                  className={cn(
                    'relative glass rounded-2xl p-6 text-center group cursor-pointer transition-all duration-500',
                    index === 4 && 'md:col-span-1'
                  )}
                >
                  <div className={cn(
                    'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br',
                    tier.color
                  )} style={{ padding: '1px' }}>
                    <div className="w-full h-full bg-slate-900 rounded-2xl" />
                  </div>

                  <div className="relative z-10">
                    <div className="text-4xl mb-3">{tier.icon}</div>
                    <h4 className="text-lg font-bold text-white mb-1">{tier.rank}</h4>
                    <p className="text-white/50 text-sm mb-3">{tier.refs} referrals</p>
                    <div className={cn(
                      'inline-block px-4 py-2 rounded-full bg-gradient-to-r font-bold text-white',
                      tier.color
                    )}>
                      {tier.rate}
                    </div>
                  </div>
                </div>
              </Card3D>
            ))}
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="glass rounded-2xl p-8 text-center hover:bg-white/10 transition-all">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Mobile Money</h3>
              <p className="text-white/60">
                Get paid directly to your MTN MoMo, Vodafone Cash, or AirtelTigo Money. Fast and hassle-free!
              </p>
            </div>

            <div className="glass rounded-2xl p-8 text-center hover:bg-white/10 transition-all">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Leaderboards & Prizes</h3>
              <p className="text-white/60">
                Compete on individual and school leaderboards. Top affiliates win monthly cash prizes!
              </p>
            </div>

            <div className="glass rounded-2xl p-8 text-center hover:bg-white/10 transition-all">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">XP & Achievements</h3>
              <p className="text-white/60">
                Earn XP, unlock badges, complete challenges, and level up your affiliate rank!
              </p>
            </div>
          </div>

          {/* Teacher Bonus Banner */}
          <div className="relative glass rounded-2xl p-8 mb-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full text-amber-400 text-sm font-medium mb-2">
                    <BadgeCheck className="w-4 h-4" />
                    Teacher Bonus
                  </div>
                  <h3 className="text-2xl font-bold text-white">Teachers get 1.5x faster tier progression!</h3>
                  <p className="text-white/60">Refer students and climb the ranks 50% faster than everyone else.</p>
                </div>
              </div>
              <button
                onClick={() => handleOpenAuth('register')}
                className="flex-shrink-0 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                Join as Teacher
              </button>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={() => handleOpenAuth('register')}
              className="group relative inline-flex items-center gap-3"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-all" />
              <div className="relative flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full font-semibold text-white text-lg shadow-2xl hover:shadow-purple-500/40 transition-all hover:scale-105">
                <PartyPopper className="w-5 h-5" />
                Start Earning Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
            <p className="mt-4 text-white/50">
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
      <footer className="relative bg-slate-950 border-t border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-white font-bold text-xl">B</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-2xl text-white leading-tight">Brilla Prep</span>
                  <span className="text-[10px] text-white/50 tracking-wider">Prepare. Excel. Succeed.</span>
                </div>
              </div>
              <p className="text-white/50 leading-relaxed">
                Ace your BECE, WASSCE, and NSMQ. Master Mathematics, Physics, Chemistry, and Biology with confidence.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-3 text-white/50">
                <li><Link to="/topics" className="hover:text-white transition">Topics</Link></li>
                <li><Link to="/practice" className="hover:text-white transition">Practice</Link></li>
                <li><Link to="/past-papers" className="hover:text-white transition">Past Papers</Link></li>
                <li><Link to="/leaderboard" className="hover:text-white transition">Leaderboard</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Exams</h4>
              <ul className="space-y-3 text-white/50">
                <li><a href="#" className="hover:text-white transition">NSMQ Prep</a></li>
                <li><a href="#" className="hover:text-white transition">WASSCE Prep</a></li>
                <li><a href="#" className="hover:text-white transition">BECE Prep</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-3 text-white/50">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40">
              &copy; {new Date().getFullYear()} Brilla Prep. All rights reserved.
            </p>
            <p className="text-white/40 flex items-center gap-1">
              Empowering champions <Heart className="w-4 h-4 text-accent fill-accent" /> one question at a time
            </p>
          </div>
        </div>
      </footer>

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Promotional Popup */}
      <PromoPopup onOpenAuth={handleOpenAuth} />

      {/* Floating CTA */}
      <FloatingCTA onOpenAuth={handleOpenAuth} />
    </div>
  );
}

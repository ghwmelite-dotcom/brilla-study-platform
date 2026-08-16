import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Shield,
  Users,
  Zap,
  BookOpen,
  Trophy,
  MessageCircle,
  Globe,
  Copy,
  Check,
  ChevronRight,
  Star,
  Heart,
  Rocket,
  Target,
  BarChart3,
  Lock,
  Clock,
  GraduationCap,
  Brain,
  Wallet,
  Repeat,
  Gift,
  Flame,
  ExternalLink,
  Twitter,
  MessageSquare,
  Send,
} from 'lucide-react';

/* ───────────────────────────────
   Token Constants
   ─────────────────────────────── */
const TOKEN_CA = 'TBA';
const TICKER = '$BRIIE';
const TOKEN_NAME = 'BRIIE';
const TOTAL_SUPPLY = '1,000,000,000';

/* ───────────────────────────────
   Utility Data
   ─────────────────────────────── */
const utilities = [
  {
    icon: GraduationCap,
    title: 'Premium Access',
    description:
      'Hold ' + TICKER + ' to unlock unlimited AI tutoring, advanced analytics, and exclusive exam content on Brilla Prep.',
    color: 'from-emerald-500 to-green-400',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Brain,
    title: 'AI Counselor Priority',
    description:
      'Get priority access to Briie, your AI student counselor, for personalized academic and career guidance.',
    color: 'from-violet-500 to-purple-400',
    bgColor: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    icon: Trophy,
    title: 'Competition Rewards',
    description:
      'Earn ' + TICKER + ' tokens by winning battles, topping leaderboards, and completing study streaks.',
    color: 'from-amber-500 to-yellow-400',
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    icon: Users,
    title: 'Governance Rights',
    description:
      'Vote on platform features, new subject additions, and community initiatives. Your voice shapes Brilla Prep.',
    color: 'from-blue-500 to-cyan-400',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    icon: Gift,
    title: 'Referral Boosts',
    description:
      'Ambassadors earn bonus ' + TICKER + ' tokens on top of cash commissions for every student referred.',
    color: 'from-rose-500 to-pink-400',
    bgColor: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
  {
    icon: Zap,
    title: 'Staking Rewards',
    description:
      'Stake ' + TICKER + ' to earn yield while supporting the Brilla Prep ecosystem and educational mission.',
    color: 'from-orange-500 to-red-400',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
];

/* ───────────────────────────────
   Tokenomics Data
   ─────────────────────────────── */
const tokenomics = [
  { label: 'Community & Ecosystem', value: 40, color: '#006B3F', desc: 'Rewards, competitions, staking' },
  { label: 'Team & Advisors', value: 20, color: '#00A86B', desc: 'Vested 24-month linear unlock' },
  { label: 'Treasury & Growth', value: 20, color: '#FCD116', desc: 'Partnerships, marketing, grants' },
  { label: 'Liquidity Pool', value: 15, color: '#CE1126', desc: 'DEX liquidity and market making' },
  { label: 'Public Sale', value: 5, color: '#3b82f6', desc: 'Fair launch on Solana' },
];

/* ───────────────────────────────
   Roadmap Data
   ─────────────────────────────── */
const roadmap = [
  {
    phase: 'Phase 1',
    title: 'Genesis',
    status: 'completed',
    items: [
      'Token concept & whitepaper',
      'Smart contract development',
      'Community building & socials',
      'Partnership with Brilla Prep',
    ],
  },
  {
    phase: 'Phase 2',
    title: 'Launch',
    status: 'in_progress',
    items: [
      'Fair launch on Solana',
      'DEX listing & liquidity',
      'Platform integration begins',
      'Ambassador program v1',
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Utility',
    status: 'upcoming',
    items: [
      'Full Brilla Prep integration',
      'Staking dashboard live',
      'Governance voting portal',
      'Mobile wallet support',
    ],
  },
  {
    phase: 'Phase 4',
    title: 'Scale',
    status: 'upcoming',
    items: [
      'CEX listings',
      'Cross-chain bridges',
      'Global education partnerships',
      'Scholarship fund launch',
    ],
  },
];

/* ───────────────────────────────
   Floating particles hook
   ─────────────────────────────── */
function useParticles(count: number) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; duration: number; delay: number }>>([]);
  useEffect(() => {
    setParticles(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 15 + 10,
        delay: Math.random() * 10,
      }))
    );
  }, [count]);
  return particles;
}

/* ───────────────────────────────
   Animated counter
   ─────────────────────────────── */
function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ───────────────────────────────
   Main Page Component
   ─────────────────────────────── */
export default function BriieTokenPage() {
  const [copied, setCopied] = useState(false);
  const particles = useParticles(30);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyCA = () => {
    navigator.clipboard.writeText(TOKEN_CA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans overflow-x-hidden">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-neutral-900">
                Brilla<span className="text-primary">Prep</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <a href="#about" className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors">About</a>
              <a href="#utility" className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors">Utility</a>
              <a href="#tokenomics" className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors">Tokenomics</a>
              <a href="#roadmap" className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors">Roadmap</a>
              <Link
                to="/"
                className="text-sm font-medium px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                Launch App
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.02] rounded-full" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-primary/20"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Powered by Solana
            </div>

            {/* Main heading */}
            <h1 className="font-display text-5xl md:text-7xl font-bold text-neutral-900 mb-6 leading-tight">
              Meet{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-primary">{TOKEN_NAME}</span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-secondary/40 -z-0 rounded-sm" />
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-neutral-600 mb-4 font-display">
              The utility token that powers Ghana's #1 exam prep platform
            </p>

            <p className="text-lg text-neutral-500 mb-10 max-w-2xl mx-auto">
              {TICKER} connects the Brilla Prep ecosystem — rewarding students, empowering teachers, 
              and funding the future of education in Africa.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <a
                href="#about"
                className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-white font-semibold text-lg hover:bg-primary-dark transition-all shadow-card hover:shadow-card-hover"
              >
                Explore {TICKER}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="https://x.com/brillaprep"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-neutral-100 text-neutral-700 font-semibold text-lg hover:bg-neutral-200 transition-colors"
              >
                <Twitter className="w-5 h-5" />
                Follow on X
              </a>
            </div>

            {/* Contract Address */}
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="text-sm text-neutral-500">Contract:</span>
              <code className="text-sm font-mono text-neutral-700">{TOKEN_CA}</code>
              <button
                onClick={handleCopyCA}
                className="p-1.5 rounded-lg hover:bg-neutral-200 transition-colors"
                title="Copy contract address"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-neutral-500" />}
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 rounded-full border-2 border-neutral-300 flex items-start justify-center p-2">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="py-12 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 1000000000, suffix: '', label: 'Total Supply', icon: BarChart3 },
              { value: 100000, suffix: '+', label: 'Community Goal', icon: Users },
              { value: 50, suffix: '+', label: 'Countries Target', icon: Globe },
              { value: 24, suffix: '/7', label: 'Support', icon: Clock },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-6 h-6 text-primary-light mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-display font-bold mb-1">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-neutral-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Section ── */}
      <section id="about" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/20 text-secondary-dark text-sm font-medium mb-6">
                <Heart className="w-4 h-4" />
                Built with purpose
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
                More than a memecoin.
                <br />
                <span className="text-primary">A movement.</span>
              </h2>
              <p className="text-lg text-neutral-600 mb-6 leading-relaxed">
                {TICKER} was born from a simple belief: every student deserves world-class preparation 
                for their exams. Brilla Prep has already helped thousands of Ghanaian students master 
                WASSCE, BECE, and NSMQ. Now, {TICKER} supercharges that mission.
              </p>
              <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
                By holding {TICKER}, you're not just investing in a token — you're investing in 
                education, in ambition, and in the next generation of African leaders. A portion of 
                every transaction supports our scholarship fund for underprivileged students.
              </p>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  Audited Contract
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
                  <Lock className="w-4 h-4" />
                  LP Burned
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium">
                  <Flame className="w-4 h-4" />
                  Deflationary
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 rounded-3xl rotate-3" />
              <div className="relative bg-white rounded-3xl shadow-card-hover p-8 border border-neutral-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-neutral-900">{TOKEN_NAME}</h3>
                    <p className="text-sm text-neutral-500">Solana SPL Token</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Token Standard', value: 'SPL' },
                    { label: 'Blockchain', value: 'Solana' },
                    { label: 'Total Supply', value: TOTAL_SUPPLY },
                    { label: 'Tax', value: '0% Buy / 0% Sell' },
                    { label: 'Mint', value: 'Revoked' },
                    { label: 'Freeze', value: 'Revoked' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                      <span className="text-sm text-neutral-500">{item.label}</span>
                      <span className="text-sm font-semibold text-neutral-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Utility Section ── */}
      <section id="utility" className="py-20 lg:py-32 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Real Utility
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
              What can you do with {TICKER}?
            </h2>
            <p className="text-lg text-neutral-600">
              Unlike typical memecoins, {TICKER} has real utility within the Brilla Prep platform 
              and beyond. Here's how holders benefit:
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {utilities.map((u) => (
              <div
                key={u.title}
                className="group relative bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-neutral-100 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl ${u.bgColor} flex items-center justify-center mb-4`}>
                  <u.icon className={`w-6 h-6 ${u.iconColor}`} />
                </div>
                <h3 className="font-display font-bold text-lg text-neutral-900 mb-2">{u.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{u.description}</p>
                <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl bg-gradient-to-r ${u.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tokenomics Section ── */}
      <section id="tokenomics" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/20 text-secondary-dark text-sm font-medium mb-6">
              <TrendingUp className="w-4 h-4" />
              Distribution
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
              Fair & Transparent
            </h2>
            <p className="text-lg text-neutral-600">
              No hidden allocations. No insider dumps. Just a community-first token designed for 
              long-term sustainability.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Donut Chart (CSS) */}
            <div className="flex items-center justify-center">
              <div className="relative w-72 h-72 md:w-96 md:h-96">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {tokenomics.reduce(
                    (acc, slice, i) => {
                      const startAngle = acc.offset;
                      const sweep = (slice.value / 100) * 360;
                      const endAngle = startAngle + sweep;
                      const largeArc = sweep > 180 ? 1 : 0;

                      const x1 = 50 + 40 * Math.cos((Math.PI * startAngle) / 180);
                      const y1 = 50 + 40 * Math.sin((Math.PI * startAngle) / 180);
                      const x2 = 50 + 40 * Math.cos((Math.PI * endAngle) / 180);
                      const y2 = 50 + 40 * Math.sin((Math.PI * endAngle) / 180);

                      acc.slices.push(
                        <path
                          key={i}
                          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={slice.color}
                          className="hover:opacity-80 transition-opacity"
                        />
                      );
                      acc.offset = endAngle;
                      return acc;
                    },
                    { slices: [] as JSX.Element[], offset: 0 }
                  ).slices}
                  <circle cx="50" cy="50" r="24" fill="white" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-display font-bold text-neutral-900">{TOTAL_SUPPLY}</div>
                    <div className="text-sm text-neutral-500">Total Supply</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-4">
              {tokenomics.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors"
                >
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-neutral-900">{item.label}</span>
                      <span className="font-bold text-primary">{item.value}%</span>
                    </div>
                    <p className="text-sm text-neutral-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Roadmap Section ── */}
      <section id="roadmap" className="py-20 lg:py-32 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary-light text-sm font-medium mb-6">
              <Rocket className="w-4 h-4" />
              Our Journey
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Roadmap to the Moon
            </h2>
            <p className="text-lg text-neutral-400">
              Big dreams need a solid plan. Here's how we're building {TICKER} step by step.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roadmap.map((phase, i) => (
              <div
                key={phase.phase}
                className={`relative rounded-2xl p-6 border transition-all duration-300 ${
                  phase.status === 'completed'
                    ? 'bg-primary/10 border-primary/30'
                    : phase.status === 'in_progress'
                    ? 'bg-secondary/10 border-secondary/30 scale-105 shadow-glow-amber'
                    : 'bg-neutral-800/50 border-neutral-700'
                }`}
              >
                {/* Status indicator */}
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      phase.status === 'completed'
                        ? 'bg-emerald-400'
                        : phase.status === 'in_progress'
                        ? 'bg-secondary animate-pulse'
                        : 'bg-neutral-600'
                    }`}
                  />
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      phase.status === 'completed'
                        ? 'text-emerald-400'
                        : phase.status === 'in_progress'
                        ? 'text-secondary'
                        : 'text-neutral-500'
                    }`}
                  >
                    {phase.status === 'completed'
                      ? 'Done'
                      : phase.status === 'in_progress'
                      ? 'In Progress'
                      : 'Upcoming'}
                  </span>
                </div>

                <div className="text-sm text-neutral-400 mb-2">{phase.phase}</div>
                <h3 className="font-display font-bold text-xl mb-4">{phase.title}</h3>

                <ul className="space-y-2">
                  {phase.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-neutral-300">
                      <ChevronRight className="w-4 h-4 text-primary-light shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                {phase.status === 'in_progress' && (
                  <div className="absolute -top-3 -right-3">
                    <div className="bg-secondary text-secondary-dark text-xs font-bold px-3 py-1 rounded-full">
                      NOW
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community / CTA Section ── */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 lg:px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
            Join the {TOKEN_NAME} Community
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Be part of something bigger. Connect with fellow holders, get early updates, 
            and help shape the future of education finance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a
              href="https://x.com/brillaprep"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-neutral-900 font-semibold hover:bg-neutral-100 transition-colors"
            >
              <Twitter className="w-5 h-5" />
              Follow on X
            </a>
            <a
              href="#"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors border border-white/20"
            >
              <MessageSquare className="w-5 h-5" />
              Discord (Coming Soon)
            </a>
            <a
              href="#"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors border border-white/20"
            >
              <Send className="w-5 h-5" />
              Telegram (Coming Soon)
            </a>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-white/20 border-2 border-primary flex items-center justify-center text-xs font-bold text-white"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span>Join thousands of early supporters</span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 bg-neutral-900 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-lg text-white">
                  Brilla<span className="text-primary-light">Prep</span>
                </span>
              </Link>
              <p className="text-neutral-400 text-sm max-w-sm">
                Ghana's #1 AI-powered exam preparation platform. Now powered by {TICKER} on Solana.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Token</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#utility" className="hover:text-white transition-colors">Utility</a></li>
                <li><a href="#tokenomics" className="hover:text-white transition-colors">Tokenomics</a></li>
                <li><a href="#roadmap" className="hover:text-white transition-colors">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link to="/" className="hover:text-white transition-colors">Brilla Prep</Link></li>
                <li><Link to="/counselor" className="hover:text-white transition-colors">AI Counselor</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/affiliate" className="hover:text-white transition-colors">Affiliate</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-neutral-500">
              © {new Date().getFullYear()} Brilla Prep. {TICKER} is a community token with no guaranteed financial return.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">Privacy</Link>
              <Link to="/terms" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Global float animation keyframes (injected via style tag) */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
          50% { transform: translateY(-10px) translateX(-10px); opacity: 0.4; }
          75% { transform: translateY(-30px) translateX(5px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

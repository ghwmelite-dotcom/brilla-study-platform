import { useState, useEffect, useRef } from 'react';
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
  Play,
  GraduationCap,
  Award,
  TrendingUp,
  Clock,
  Shield,
  Sparkles,
  ChevronRight,
  Quote,
} from 'lucide-react';
import { Button } from '@/components/common';
import { cn } from '@/utils';

// Animated counter hook
function useCounter(end: number, duration: number = 2000, start: boolean = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, start]);

  return count;
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

// Floating animation component
function FloatingElement({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div
      className={cn('animate-float', className)}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

// Stat item component with its own counter hook
function StatItem({ stat, index, inView }: { stat: typeof stats[0]; index: number; inView: boolean }) {
  const count = useCounter(stat.value, 2000, inView);

  return (
    <div
      className={cn(
        'text-center',
        inView ? 'animate-scale-in' : 'opacity-0'
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
        <stat.icon className="w-8 h-8 text-secondary" />
      </div>
      <div className="text-4xl md:text-5xl font-bold text-white mb-2">
        {count}{stat.suffix}
      </div>
      <div className="text-white/60">{stat.label}</div>
    </div>
  );
}

// Typewriter effect component
function TypewriterText({ texts, className = '' }: { texts: string[]; className?: string }) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentFullText = texts[currentTextIndex];
    const timeout = isDeleting ? 50 : 100;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentFullText.length) {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % texts.length);
        }
      }
    }, timeout);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentTextIndex, texts]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-blink">|</span>
    </span>
  );
}

const stats = [
  { value: 50000, suffix: '+', label: 'Active Students', icon: Users },
  { value: 10000, suffix: '+', label: 'Practice Questions', icon: BookOpen },
  { value: 95, suffix: '%', label: 'Pass Rate', icon: TrendingUp },
  { value: 4, suffix: '.8', label: 'Student Rating', icon: Star },
];

const examModes = [
  {
    id: 'nsmq',
    name: 'NSMQ',
    fullName: 'National Science & Maths Quiz',
    description: 'Compete like a champion with full competition simulation',
    icon: Trophy,
    color: 'from-amber-500 to-orange-500',
    features: ['5 Competition Rounds', '1v1 Battles', 'Speed Training'],
  },
  {
    id: 'wassce',
    name: 'WASSCE',
    fullName: 'West African Senior School Certificate',
    description: '50+ subjects with comprehensive past papers',
    icon: GraduationCap,
    color: 'from-blue-500 to-indigo-500',
    features: ['Past Papers', 'Essay Grading', 'Theory & Objectives'],
  },
  {
    id: 'bece',
    name: 'BECE',
    fullName: 'Basic Education Certificate',
    description: 'Build a strong foundation for academic success',
    icon: BookOpen,
    color: 'from-emerald-500 to-teal-500',
    features: ['JHS Curriculum', 'All Subjects', 'Practice Tests'],
  },
];

const features = [
  {
    icon: Brain,
    title: 'Adaptive Learning',
    description: 'Our AI-powered system adapts to your learning style and identifies areas for improvement.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Zap,
    title: 'Speed Training',
    description: 'Master the art of quick thinking with our speed rounds and time-bound challenges.',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Target,
    title: 'Topic Mastery',
    description: 'Deep dive into specific topics with comprehensive theory, formulas, and practice questions.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Trophy,
    title: 'Competition Mode',
    description: 'Experience the thrill of real competitions with our NSMQ simulation feature.',
    gradient: 'from-amber-500 to-red-500',
  },
  {
    icon: TrendingUp,
    title: 'Progress Analytics',
    description: 'Track your improvement with detailed analytics and performance insights.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Shield,
    title: 'House System',
    description: 'Compete with your school house and climb the leaderboard together.',
    gradient: 'from-indigo-500 to-purple-500',
  },
];

const testimonials = [
  {
    quote: "Brilla helped me prepare for NSMQ like nothing else. The speed rounds really sharpened my quick thinking!",
    author: "Kwame Asante",
    role: "SHS 3 Student, Presec Legon",
    avatar: "K",
  },
  {
    quote: "The past papers and AI grading for essays are game-changers. My WASSCE prep has never been this effective.",
    author: "Abena Mensah",
    role: "SHS 2 Student, Wesley Girls",
    avatar: "A",
  },
  {
    quote: "Our school's NSMQ team uses Brilla daily. It's become an essential part of our training.",
    author: "Mr. Samuel Osei",
    role: "Science Teacher, Mfantsipim",
    avatar: "S",
  },
];

export function LandingPage() {
  const heroRef = useInView(0.1);
  const statsRef = useInView(0.3);
  const modesRef = useInView(0.2);
  const featuresRef = useInView(0.2);
  const testimonialsRef = useInView(0.2);
  const ctaRef = useInView(0.3);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Custom Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.8); }
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
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
        .animate-slide-in-left { animation: slide-in-left 0.8s ease-out forwards; }
        .animate-slide-in-right { animation: slide-in-right 0.8s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.6s ease-out forwards; }
        .animate-blink { animation: blink 1s infinite; }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .animate-rotate-slow { animation: rotate-slow 20s linear infinite; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-800 { animation-delay: 0.8s; }
      `}</style>

      {/* Hero Section */}
      <section
        ref={heroRef.ref}
        className="relative min-h-screen flex items-center justify-center pt-16 pb-32 px-4 overflow-hidden"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary-dark to-slate-900" />

        {/* Animated Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl animate-pulse" />

        {/* Floating Icons */}
        <FloatingElement delay={0} className="absolute top-32 left-[15%] hidden lg:block">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
            <Brain className="w-8 h-8 text-secondary" />
          </div>
        </FloatingElement>
        <FloatingElement delay={1} className="absolute top-48 right-[10%] hidden lg:block">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
            <Trophy className="w-7 h-7 text-amber-400" />
          </div>
        </FloatingElement>
        <FloatingElement delay={2} className="absolute bottom-48 left-[20%] hidden lg:block">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
            <Zap className="w-6 h-6 text-yellow-400" />
          </div>
        </FloatingElement>
        <FloatingElement delay={1.5} className="absolute bottom-32 right-[15%] hidden lg:block">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
            <GraduationCap className="w-8 h-8 text-blue-400" />
          </div>
        </FloatingElement>

        {/* Hero Content */}
        <div className={cn(
          'relative z-10 max-w-5xl mx-auto text-center',
          heroRef.inView ? 'animate-slide-up' : 'opacity-0'
        )}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-sm text-white/90">Ghana's #1 Exam Prep Platform</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-6 leading-tight">
            Master Your
            <br />
            <span className="bg-gradient-to-r from-secondary via-yellow-400 to-accent bg-clip-text text-transparent animate-gradient">
              <TypewriterText texts={['NSMQ', 'WASSCE', 'BECE']} />
            </span>
            <br />
            with <span className="text-secondary">Brilla</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-10">
            Join over 50,000 students preparing smarter with AI-powered practice,
            past papers, and competition simulations.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/register">
              <Button
                size="lg"
                className="group relative overflow-hidden bg-gradient-to-r from-secondary to-yellow-400 hover:from-yellow-400 hover:to-secondary text-slate-900 font-semibold px-8 py-6 text-lg rounded-xl shadow-2xl shadow-secondary/30 transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Learning Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 animate-shimmer" />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl backdrop-blur-sm"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
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
              <span>Used by 100+ Schools</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        ref={statsRef.ref}
        className="relative py-20 bg-gradient-to-b from-slate-900 to-slate-800"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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

      {/* Exam Modes Section */}
      <section
        ref={modesRef.ref}
        className="py-24 bg-gradient-to-b from-slate-800 to-white"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className={cn(
            'text-center mb-16',
            modesRef.inView ? 'animate-slide-up' : 'opacity-0'
          )}>
            <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              Choose Your Path
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-4">
              One Platform, Three Exams
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Whether you're preparing for NSMQ, WASSCE, or BECE, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {examModes.map((mode, index) => (
              <div
                key={mode.id}
                className={cn(
                  'group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-slate-100 overflow-hidden',
                  modesRef.inView ? 'animate-slide-up' : 'opacity-0'
                )}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Gradient Background on Hover */}
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500',
                  mode.color
                )} />

                {/* Icon */}
                <div className={cn(
                  'relative w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300',
                  mode.color
                )}>
                  <mode.icon className="w-10 h-10 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{mode.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{mode.fullName}</p>
                <p className="text-slate-600 mb-6">{mode.description}</p>

                {/* Features */}
                <ul className="space-y-2 mb-8">
                  {mode.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-slate-600">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  to="/register"
                  className={cn(
                    'inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl font-medium bg-gradient-to-r transition-all duration-300 hover:shadow-lg',
                    mode.color
                  )}
                >
                  Get Started
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresRef.ref}
        className="py-24 bg-slate-50"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className={cn(
            'text-center mb-16',
            featuresRef.inView ? 'animate-slide-up' : 'opacity-0'
          )}>
            <span className="inline-block px-4 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">
              Powerful Features
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Comprehensive tools designed to maximize your learning potential.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={cn(
                  'group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1',
                  featuresRef.inView ? 'animate-slide-up' : 'opacity-0'
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={cn(
                  'w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-6 group-hover:scale-110 transition-transform',
                  feature.gradient
                )}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        ref={testimonialsRef.ref}
        className="py-24 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className={cn(
            'text-center mb-16',
            testimonialsRef.inView ? 'animate-slide-up' : 'opacity-0'
          )}>
            <span className="inline-block px-4 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium mb-4">
              Student Stories
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-4">
              Loved by Students
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Join thousands of students who've transformed their exam preparation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.author}
                className={cn(
                  'relative bg-gradient-to-br from-slate-50 to-white rounded-2xl p-8 border border-slate-100',
                  testimonialsRef.inView ? 'animate-slide-up' : 'opacity-0'
                )}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <Quote className="w-10 h-10 text-primary/20 mb-4" />
                <p className="text-slate-700 mb-6 text-lg italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.author}</p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        ref={ctaRef.ref}
        className="relative py-32 overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-slate-900" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-secondary/50 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/50 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className={cn(
          'relative z-10 max-w-4xl mx-auto text-center px-4',
          ctaRef.inView ? 'animate-scale-in' : 'opacity-0'
        )}>
          <Award className="w-16 h-16 text-secondary mx-auto mb-8" />
          <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
            Ready to Shine?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join the thousands of students already preparing smarter with Brilla.
            Your journey to academic excellence starts here.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-neutral-100 px-10 py-6 text-lg rounded-xl font-semibold shadow-2xl hover:scale-105 transition-transform"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          <p className="mt-8 text-white/60 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Takes less than 2 minutes to get started
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-white font-bold text-xl">B</span>
                </div>
                <span className="font-display font-bold text-2xl">Brilla</span>
              </div>
              <p className="text-slate-400">
                Ghana's leading exam preparation platform for NSMQ, WASSCE, and BECE.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/topics" className="hover:text-white transition">Topics</Link></li>
                <li><Link to="/practice" className="hover:text-white transition">Practice</Link></li>
                <li><Link to="/past-papers" className="hover:text-white transition">Past Papers</Link></li>
                <li><Link to="/leaderboard" className="hover:text-white transition">Leaderboard</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Exams</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">NSMQ Prep</a></li>
                <li><a href="#" className="hover:text-white transition">WASSCE Prep</a></li>
                <li><a href="#" className="hover:text-white transition">BECE Prep</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500">
              &copy; {new Date().getFullYear()} Brilla Study Platform. Made with love in Ghana.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Designed for </span>
              <span className="text-xl">🇬🇭</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

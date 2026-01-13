import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Flame,
  Star,
  Medal,
  Trophy,
  ArrowRight,
  Brain,
  Sparkles,
  Target,
  MessageCircle,
  CheckCircle2,
  Lightbulb,
  GraduationCap,
  Zap,
  Play,
  BookOpen,
  TrendingUp,
  X,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/common';
import { useAuthStore } from '@/stores';
import { useExamStore } from '@/stores/examStore';
import { getExamConfig, getExamGradient } from '@/config';
import { cn } from '@/utils';

// Icon mapping for subjects
import * as Icons from 'lucide-react';

// AI Revision Classroom Showcase Component
function AIRevisionShowcase() {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const phases = ['Hook', 'Explain', 'Check', 'Practice', 'Confirm', 'Connect'];

  const demoMessages = [
    { type: 'ai', text: "Let me ask you something interesting... Have you ever wondered why ice floats on water? 🤔" },
    { type: 'ai', text: "Most substances become denser when they solidify, but water is special! This is because of hydrogen bonding..." },
    { type: 'user', text: "That's fascinating! So the hydrogen bonds create a crystal structure?" },
    { type: 'ai', text: "Exactly right! ✨ You're connecting the dots perfectly. Now, let me check your understanding with a quick question..." },
  ];

  useEffect(() => {
    const phaseInterval = setInterval(() => {
      setCurrentPhase((prev) => (prev + 1) % phases.length);
    }, 2000);

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % demoMessages.length);
    }, 3000);

    return () => {
      clearInterval(phaseInterval);
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950 p-1">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Inner content with glass effect */}
      <div className="relative rounded-[1.4rem] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-8 md:p-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left side - Content */}
          <div className="relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full border border-violet-400/30 mb-6">
              <Sparkles className="w-4 h-4 text-violet-300" />
              <span className="text-sm font-medium text-violet-200">Revolutionary AI Learning</span>
              <span className="px-2 py-0.5 bg-violet-500 text-white text-xs font-bold rounded-full">NEW</span>
            </div>

            {/* Main heading */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4 leading-tight">
              Meet Your Personal{' '}
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                  AI Teacher
                </span>
                <span className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 blur-lg" />
              </span>
            </h2>

            <p className="text-lg text-violet-100/80 mb-8 leading-relaxed">
              Unlike other AI tutors that only answer questions, our <strong className="text-white">AI Revision Classroom</strong> proactively
              teaches you — explaining concepts, checking your understanding, and adapting to your pace.
              Just like having a world-class tutor by your side.
            </p>

            {/* Key differentiators */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: Lightbulb, text: 'Proactive Teaching', desc: 'AI initiates lessons' },
                { icon: Target, text: 'Exam-Focused', desc: 'Aligned to your syllabus' },
                { icon: MessageCircle, text: 'Interactive', desc: 'Ask questions anytime' },
                { icon: TrendingUp, text: 'Tracks Mastery', desc: 'Personalized progress' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-violet-300" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{item.text}</p>
                    <p className="text-xs text-violet-300/70">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link to="/revision-classroom">
                <button className="group relative px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-105 overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Start Learning Now
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </Link>
              <button
                onClick={() => setShowHowItWorks(true)}
                className="px-6 py-3 border-2 border-violet-400/30 rounded-xl font-semibold text-violet-200 hover:bg-violet-500/10 hover:border-violet-400/50 transition-all duration-300 flex items-center gap-2"
              >
                <HelpCircle className="w-5 h-5" />
                See How It Works
              </button>
            </div>
          </div>

          {/* Right side - Interactive Preview */}
          <div className="relative">
            {/* Floating glow behind the card */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 blur-3xl scale-110" />

            {/* Preview card */}
            <div className="relative bg-gradient-to-br from-neutral-900/90 to-neutral-800/90 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Brilla AI Teacher</p>
                      <p className="text-xs text-white/70">Teaching Phase: {phases[currentPhase]}</p>
                    </div>
                  </div>
                  {/* Phase indicators */}
                  <div className="flex gap-1">
                    {phases.map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all duration-500",
                          i === currentPhase ? "w-5 bg-white" : i < currentPhase ? "bg-white/70" : "bg-white/30"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat area */}
              <div className="p-4 space-y-3 min-h-[200px] bg-neutral-900/50">
                {/* AI Message */}
                <div className="flex gap-2 animate-fade-in" key={messageIndex}>
                  <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <div className="bg-neutral-800 rounded-xl rounded-tl-sm p-3 max-w-[85%] border border-neutral-700">
                    <p className="text-sm text-neutral-200">{demoMessages[messageIndex].text}</p>
                  </div>
                </div>

                {/* User response (shows for certain messages) */}
                {messageIndex === 2 && (
                  <div className="flex gap-2 justify-end animate-fade-in">
                    <div className="bg-violet-600 text-white rounded-xl rounded-tr-sm p-3 max-w-[80%]">
                      <p className="text-sm">{demoMessages[2].text}</p>
                    </div>
                  </div>
                )}

                {/* Typing indicator */}
                <div className="flex gap-2 opacity-60">
                  <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                  </div>
                  <div className="bg-neutral-800 rounded-xl rounded-tl-sm px-4 py-3 border border-neutral-700">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Input area */}
              <div className="p-3 border-t border-neutral-800 bg-neutral-900/50">
                <div className="flex gap-2">
                  <div className="flex-1 bg-neutral-800 rounded-lg px-3 py-2 text-neutral-400 text-sm border border-neutral-700">
                    Type your answer or ask a question...
                  </div>
                  <button className="px-4 py-2 bg-violet-600 rounded-lg text-white text-sm font-medium">
                    Continue →
                  </button>
                </div>
              </div>
            </div>

            {/* Floating feature badges */}
            <div className="absolute -top-4 -right-4 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full text-white text-xs font-semibold shadow-lg animate-bounce-slow">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>6-Phase Teaching</span>
              </div>
            </div>

            <div className="absolute -bottom-3 -left-3 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-white text-xs font-semibold shadow-lg animate-bounce-slow" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                <span>Exam Board Aligned</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom stats bar */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '6', label: 'Teaching Phases', icon: BookOpen },
              { value: '∞', label: 'Ask Questions', icon: MessageCircle },
              { value: '100%', label: 'Personalized', icon: Target },
              { value: '24/7', label: 'Available', icon: Zap },
            ].map((stat, i) => (
              <div key={i} className="group">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <stat.icon className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" />
                  <span className="text-2xl md:text-3xl font-bold text-white">{stat.value}</span>
                </div>
                <p className="text-sm text-violet-300/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Modal */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowHowItWorks(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-neutral-900 via-violet-950/50 to-neutral-900 rounded-2xl border border-violet-500/20 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setShowHowItWorks(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">How Your AI Teacher Works</h3>
                  <p className="text-violet-200">The 6-Phase Teaching Method</p>
                </div>
              </div>
              <p className="text-white/80 mt-4">
                Unlike traditional AI chatbots that only respond to questions, our AI Teacher proactively guides you through concepts using a proven 6-phase pedagogical approach.
              </p>
            </div>

            {/* Phases Grid */}
            <div className="p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {[
                  {
                    phase: 1,
                    name: 'Hook',
                    icon: Lightbulb,
                    color: 'from-amber-500 to-orange-500',
                    description: 'Captures your attention with an intriguing question or real-world scenario that relates to what you\'re about to learn.',
                    example: '"Have you ever wondered why ice floats on water when most solids sink?"'
                  },
                  {
                    phase: 2,
                    name: 'Explain',
                    icon: BookOpen,
                    color: 'from-blue-500 to-cyan-500',
                    description: 'Breaks down the concept into digestible pieces, using analogies and examples tailored to your level.',
                    example: 'Clear explanations with diagrams, analogies, and step-by-step breakdowns of complex ideas.'
                  },
                  {
                    phase: 3,
                    name: 'Check',
                    icon: HelpCircle,
                    color: 'from-violet-500 to-purple-500',
                    description: 'Verifies your understanding with targeted questions before moving forward.',
                    example: '"Can you explain in your own words why hydrogen bonds make ice less dense?"'
                  },
                  {
                    phase: 4,
                    name: 'Practice',
                    icon: Target,
                    color: 'from-green-500 to-emerald-500',
                    description: 'Provides practice problems that reinforce the concept and build your confidence.',
                    example: 'Interactive exercises, worked examples, and problems of increasing difficulty.'
                  },
                  {
                    phase: 5,
                    name: 'Confirm',
                    icon: CheckCircle2,
                    color: 'from-teal-500 to-cyan-500',
                    description: 'Ensures you\'ve truly mastered the topic before marking it complete.',
                    example: 'Summary questions and self-assessment to verify deep understanding.'
                  },
                  {
                    phase: 6,
                    name: 'Connect',
                    icon: Sparkles,
                    color: 'from-pink-500 to-rose-500',
                    description: 'Links new knowledge to what you already know and previews related topics.',
                    example: '"This connects to what you learned about molecular structure. Next, we\'ll explore..."'
                  },
                ].map((item) => (
                  <div
                    key={item.phase}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                        item.color
                      )}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-violet-400">PHASE {item.phase}</span>
                        </div>
                        <h4 className="font-semibold text-white text-lg">{item.name}</h4>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-300 mb-2">{item.description}</p>
                    <p className="text-xs text-violet-300/70 italic">"{item.example}"</p>
                  </div>
                ))}
              </div>

              {/* Key Benefits */}
              <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl p-6 border border-violet-500/20 mb-6">
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-violet-400" />
                  Why This Approach Works
                </h4>
                <ul className="space-y-3">
                  {[
                    'Active learning through questioning, not passive reading',
                    'Personalized pacing - move faster or slower based on your understanding',
                    'Immediate feedback on your answers and misconceptions',
                    'Exam-aligned content designed for WASSCE/BECE success',
                    'Available 24/7 - study whenever works best for you',
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                      <ChevronRight className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/revision-classroom">
                  <button className="group relative px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-105">
                    <span className="flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Start Learning Now
                    </span>
                  </button>
                </Link>
                <button
                  onClick={() => setShowHowItWorks(false)}
                  className="px-6 py-3 border-2 border-violet-400/30 rounded-xl font-semibold text-violet-200 hover:bg-violet-500/10 transition-all duration-300"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function getSubjectIcon(iconName?: string) {
  if (!iconName) return Icons.BookOpen;
  const Icon = (Icons as Record<string, unknown>)[iconName];
  return (Icon as typeof Icons.BookOpen) || Icons.BookOpen;
}

export function HomePage() {
  const { user } = useAuthStore();
  const { currentExamType, subjects } = useExamStore();
  const config = getExamConfig(currentExamType);
  const gradient = getExamGradient(currentExamType);

  // Get first 4 subjects to display
  const displaySubjects = subjects.slice(0, 4);

  // Get the primary practice mode icon
  const PrimaryModeIcon = config.practiceModes[0].icon;

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br text-white p-8 md:p-12",
        gradient,
        "to-neutral-900"
      )}>
        <div className="relative z-10 max-w-2xl">
          <Badge variant="secondary" className="mb-4">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            {config.heroTitle.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="text-secondary">{config.heroTitle.split(' ').slice(-1)}</span>
          </h1>
          <p className="text-lg text-white/80 mb-6">
            {user?.streakDays && user.streakDays > 0
              ? `You're on a ${user.streakDays} day streak! ${config.heroSubtitle}`
              : config.heroSubtitle
            }
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/practice">
              <Button variant="secondary" size="lg">
                <PrimaryModeIcon className="w-5 h-5 mr-2" />
                Start Practice
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" size="lg" className="border-2 border-white !text-white hover:!bg-white hover:!text-primary">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-20 w-48 h-48 bg-accent/20 rounded-full blur-3xl" />
      </section>

      {/* Quick Stats for logged in users */}
      {user && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-900">{user.streakDays || 0}</p>
            <p className="text-sm text-neutral-500">{config.statsLabels.streak}</p>
          </Card>
          <Card className="p-4 text-center">
            <Star className="w-8 h-8 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-900">{user.xpPoints || 0}</p>
            <p className="text-sm text-neutral-500">{config.statsLabels.xp}</p>
          </Card>
          <Card className="p-4 text-center">
            <Medal className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-900">Level {user.level || 1}</p>
            <p className="text-sm text-neutral-500">{config.statsLabels.level}</p>
          </Card>
          <Card className="p-4 text-center">
            <Trophy className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-900">#--</p>
            <p className="text-sm text-neutral-500">Leaderboard</p>
          </Card>
        </section>
      )}

      {/* AI Revision Classroom Showcase - Our Trump Card! */}
      <AIRevisionShowcase />

      {/* Subjects */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-neutral-900">
              {config.subjectsTitle}
            </h2>
            <p className="text-neutral-500">
              {config.subjectsSubtitle}
            </p>
          </div>
          <Link to="/topics">
            <Button variant="ghost">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {displaySubjects.map((subject) => {
            const SubjectIcon = getSubjectIcon(subject.icon);
            return (
              <Link key={subject.id} to={`/topics?subject=${subject.slug}`}>
                <Card hoverable className="p-6 h-full">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4"
                    style={{ backgroundColor: subject.color }}
                  >
                    <SubjectIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                    {subject.name}
                  </h3>
                  <p className="text-sm text-neutral-500 mb-3 line-clamp-2">
                    {subject.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                    <span>{subject.topicCount || 0} topics</span>
                    <span>•</span>
                    <span>{subject.questionCount || 0} questions</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {displaySubjects.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-neutral-500">
              Subjects for {config.shortName} are being loaded...
            </p>
          </Card>
        )}
      </section>

      {/* Practice Modes */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {config.practiceModes.map((mode) => {
          const ModeIcon = mode.icon;
          return (
            <Link key={mode.id} to={mode.link} className="block">
              <Card hoverable className={cn("p-6 h-full border-l-4", mode.borderColor)}>
                <ModeIcon className={cn("w-10 h-10 mb-4", mode.color)} />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {mode.name}
                </h3>
                <p className="text-neutral-500 text-sm">
                  {mode.description}
                </p>
              </Card>
            </Link>
          );
        })}
      </section>

      {/* Features */}
      <section className="bg-neutral-100 -mx-4 px-4 py-12 lg:-mx-6 lg:px-6 rounded-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
            Everything You Need to Excel
          </h2>
          <p className="text-neutral-500 max-w-2xl mx-auto">
            Our platform is designed to help you prepare for {config.name} with comprehensive tools and resources.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {config.features.map((feature, index) => {
            const FeatureIcon = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-14 h-14 rounded-xl bg-white shadow-card flex items-center justify-center mx-auto mb-4">
                  <FeatureIcon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-500">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Exam-specific CTA */}
      <section className={cn(
        "rounded-2xl p-8 text-center bg-gradient-to-r",
        gradient
      )}>
        <h2 className="text-2xl font-display font-bold text-white mb-3">
          Ready to start your {config.shortName} journey?
        </h2>
        <p className="text-white/80 mb-6 max-w-xl mx-auto">
          {config.description}. {config.tagline}
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/practice">
            <Button variant="secondary" size="lg">
              Start Practicing
            </Button>
          </Link>
          <Link to="/topics">
            <Button variant="ghost" size="lg" className="border-2 border-white !text-white hover:!bg-white/20">
              Browse Topics
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

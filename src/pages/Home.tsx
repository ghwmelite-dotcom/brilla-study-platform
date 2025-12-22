import { Link } from 'react-router-dom';
import {
  BookOpen,
  Brain,
  Trophy,
  Flame,
  Target,
  Zap,
  Medal,
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  ArrowRight,
  Star,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/common';
import { useAuthStore } from '@/stores';
import { cn } from '@/utils';

const subjects = [
  {
    id: 'nsmq-mathematics',
    name: 'Mathematics',
    icon: Calculator,
    color: 'bg-blue-500',
    description: 'Algebra, Geometry, Calculus & more',
    topics: 6,
    questions: 120,
  },
  {
    id: 'nsmq-physics',
    name: 'Physics',
    icon: Atom,
    color: 'bg-purple-500',
    description: 'Mechanics, Waves, Electricity & more',
    topics: 6,
    questions: 100,
  },
  {
    id: 'nsmq-chemistry',
    name: 'Chemistry',
    icon: FlaskConical,
    color: 'bg-green-500',
    description: 'Organic, Inorganic, Physical Chemistry',
    topics: 6,
    questions: 95,
  },
  {
    id: 'nsmq-biology',
    name: 'Biology',
    icon: Dna,
    color: 'bg-amber-500',
    description: 'Cell Biology, Genetics, Ecology & more',
    topics: 5,
    questions: 85,
  },
];

const features = [
  {
    icon: BookOpen,
    title: 'Topic Library',
    description: 'Comprehensive coverage of NSMQ subjects with theory and formulas',
  },
  {
    icon: Brain,
    title: 'Smart Practice',
    description: 'Adaptive drills, speed rounds, and flashcard sessions',
  },
  {
    icon: Trophy,
    title: 'Competition Mode',
    description: 'Full NSMQ simulation with all 5 rounds',
  },
  {
    icon: Target,
    title: 'Progress Tracking',
    description: 'Track your mastery, identify weaknesses, and improve',
  },
];

export function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-dark to-neutral-900 text-white p-8 md:p-12">
        <div className="relative z-10 max-w-2xl">
          <Badge variant="secondary" className="mb-4">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Continue your journey with{' '}
            <span className="text-secondary">Brilla</span>
          </h1>
          <p className="text-lg text-white/80 mb-6">
            You're on a {user?.streakDays || 0} day streak! Keep the momentum going.
            Practice, compete, and achieve your goals.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/practice">
              <Button variant="secondary" size="lg">
                <Zap className="w-5 h-5 mr-2" />
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
            <p className="text-2xl font-bold text-neutral-900">{user.streakDays}</p>
            <p className="text-sm text-neutral-500">Day Streak</p>
          </Card>
          <Card className="p-4 text-center">
            <Star className="w-8 h-8 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-900">{user.xpPoints}</p>
            <p className="text-sm text-neutral-500">XP Points</p>
          </Card>
          <Card className="p-4 text-center">
            <Medal className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-900">Level {user.level}</p>
            <p className="text-sm text-neutral-500">Current Level</p>
          </Card>
          <Card className="p-4 text-center">
            <Trophy className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-900">#12</p>
            <p className="text-sm text-neutral-500">Leaderboard</p>
          </Card>
        </section>
      )}

      {/* Subjects */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-neutral-900">
              Browse Subjects
            </h2>
            <p className="text-neutral-500">
              Explore topics across all NSMQ subjects
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
          {subjects.map((subject) => (
            <Link key={subject.id} to={`/topics/${subject.id}`}>
              <Card hoverable className="p-6 h-full">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4',
                  subject.color
                )}>
                  <subject.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                  {subject.name}
                </h3>
                <p className="text-sm text-neutral-500 mb-3">
                  {subject.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-neutral-400">
                  <span>{subject.topics} topics</span>
                  <span>•</span>
                  <span>{subject.questions} questions</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Practice Modes */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/practice?mode=drill" className="block">
          <Card hoverable className="p-6 h-full border-l-4 border-l-primary">
            <Brain className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Topic Drill
            </h3>
            <p className="text-neutral-500 text-sm">
              Focus on specific topics with timed questions and instant feedback.
            </p>
          </Card>
        </Link>

        <Link to="/practice?mode=speed" className="block">
          <Card hoverable className="p-6 h-full border-l-4 border-l-secondary">
            <Zap className="w-10 h-10 text-secondary mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Speed Race
            </h3>
            <p className="text-neutral-500 text-sm">
              Race against the clock! Quick-fire questions to test your speed.
            </p>
          </Card>
        </Link>

        <Link to="/competition" className="block">
          <Card hoverable className="p-6 h-full border-l-4 border-l-accent">
            <Trophy className="w-10 h-10 text-accent mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Full Competition
            </h3>
            <p className="text-neutral-500 text-sm">
              Simulate the complete NSMQ experience with all 5 rounds.
            </p>
          </Card>
        </Link>
      </section>

      {/* Features */}
      <section className="bg-neutral-100 -mx-4 px-4 py-12 lg:-mx-6 lg:px-6 rounded-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
            Everything You Need to Excel
          </h2>
          <p className="text-neutral-500 max-w-2xl mx-auto">
            Our platform is designed to help you prepare for the National Science & Maths Quiz
            with comprehensive tools and resources.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="w-14 h-14 rounded-xl bg-white shadow-card flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-neutral-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

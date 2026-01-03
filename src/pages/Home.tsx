import { Link } from 'react-router-dom';
import {
  Flame,
  Star,
  Medal,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/common';
import { useAuthStore } from '@/stores';
import { useExamStore } from '@/stores/examStore';
import { getExamConfig, getExamGradient } from '@/config';
import { cn } from '@/utils';

// Icon mapping for subjects
import * as Icons from 'lucide-react';

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

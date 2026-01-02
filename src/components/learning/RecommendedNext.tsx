import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Target,
  AlertCircle,
  Clock,
  ChevronRight,
  Sparkles,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/utils';
import { Card, Button } from '@/components/common';
import { useLearningPathStore, type RecommendedTopic, type RecommendationPriority } from '@/stores/learningPathStore';

const priorityConfig: Record<RecommendationPriority, { bg: string; text: string; border: string; label: string }> = {
  critical: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    label: 'Critical',
  },
  high: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    label: 'High Priority',
  },
  medium: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'Medium',
  },
  low: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    label: 'Review',
  },
};

const reasonIcons: Record<string, React.ElementType> = {
  weak_area: AlertCircle,
  not_started: BookOpen,
  review_needed: RefreshCw,
  exam_focus: Target,
  streak_building: TrendingUp,
  trending_topic: Sparkles,
};

interface RecommendedNextProps {
  className?: string;
  maxItems?: number;
}

export function RecommendedNext({ className, maxItems = 5 }: RecommendedNextProps) {
  const { recommendedTopics, isLoading, generateRecommendations } = useLearningPathStore();

  useEffect(() => {
    if (recommendedTopics.length === 0) {
      generateRecommendations();
    }
  }, [recommendedTopics.length, generateRecommendations]);

  const displayTopics = recommendedTopics.slice(0, maxItems);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="p-4 bg-gradient-to-r from-primary to-primary-dark text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">What to Study Next</h3>
              <p className="text-white/70 text-sm">Personalized for you</p>
            </div>
          </div>

          <button
            onClick={() => generateRecommendations()}
            disabled={isLoading}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Refresh recommendations"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      <div className="divide-y divide-neutral-100">
        {isLoading && displayTopics.length === 0 ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-neutral-300 mx-auto mb-2 animate-spin" />
            <p className="text-neutral-500 text-sm">Generating recommendations...</p>
          </div>
        ) : displayTopics.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 font-medium">No recommendations yet</p>
            <p className="text-sm text-neutral-400 mt-1">Start practicing to get personalized suggestions</p>
            <Link to="/practice" className="inline-block mt-4">
              <Button size="sm">Start Practice</Button>
            </Link>
          </div>
        ) : (
          displayTopics.map((topic, index) => (
            <TopicItem key={`${topic.subjectId}_${topic.topicId}`} topic={topic} index={index} />
          ))
        )}
      </div>

      {displayTopics.length > 0 && (
        <div className="p-4 bg-neutral-50 border-t border-neutral-100">
          <Link to="/practice">
            <Button variant="outline" fullWidth rightIcon={<ChevronRight className="w-4 h-4" />}>
              View All Topics
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}

function TopicItem({ topic, index }: { topic: RecommendedTopic; index: number }) {
  const config = priorityConfig[topic.priority];
  const ReasonIcon = reasonIcons[topic.reason] || BookOpen;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/practice?subject=${topic.subjectId}&topic=${topic.topicId}`}
        className="block p-4 hover:bg-neutral-50 transition-colors group"
      >
        <div className="flex items-start gap-3">
          {/* Priority indicator */}
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
              config.bg
            )}
          >
            <ReasonIcon className={cn('w-5 h-5', config.text)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-neutral-900 truncate">{topic.topicName}</h4>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                  config.bg,
                  config.text
                )}
              >
                {config.label}
              </span>
            </div>

            <p className="text-sm text-neutral-500 mb-2">{topic.subjectName}</p>

            <div className="flex items-center gap-4 text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {topic.mastery}% mastery
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                ~{topic.estimatedTime} min
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {topic.questionCount} questions
              </span>
            </div>

            <p className="text-xs text-neutral-400 mt-2 italic">{topic.reasonText}</p>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-primary transition-colors flex-shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
}

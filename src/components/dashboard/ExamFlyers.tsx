import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Lightbulb } from 'lucide-react';
import { Card } from '@/components/common';
import { useExamStore } from '@/stores/examStore';
import { getExamConfig } from '@/config';
import { cn } from '@/utils';
import { useState, useEffect } from 'react';

interface ExamFlyersProps {
  className?: string;
}

export function ExamFlyers({ className }: ExamFlyersProps) {
  const { currentExamType } = useExamStore();
  const config = getExamConfig(currentExamType);
  const { dashboard } = config;

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
      {dashboard.flyers.map((flyer, index) => (
        <motion.div
          key={flyer.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link to={flyer.ctaLink} className="block h-full">
            <div
              className={cn(
                'relative overflow-hidden rounded-xl p-5 h-full',
                `bg-gradient-to-br ${flyer.gradient}`,
                'hover:shadow-lg transition-shadow cursor-pointer group'
              )}
            >
              {/* Background decoration */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full blur-xl" />

              <div className="relative z-10">
                {/* Icon */}
                <motion.span
                  className="text-4xl block mb-3"
                  whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  {flyer.icon}
                </motion.span>

                {/* Content */}
                <h3 className={cn('text-lg font-bold mb-2', flyer.textColor)}>
                  {flyer.title}
                </h3>
                <p className={cn('text-sm mb-4 opacity-90', flyer.textColor)}>
                  {flyer.description}
                </p>

                {/* CTA */}
                <div className="flex items-center gap-2 text-sm font-medium text-white group-hover:gap-3 transition-all">
                  <span>{flyer.ctaText}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

// Daily Tip Component
interface DailyTipProps {
  className?: string;
}

export function DailyTip({ className }: DailyTipProps) {
  const { currentExamType } = useExamStore();
  const config = getExamConfig(currentExamType);
  const { dashboard } = config;
  const [tipIndex, setTipIndex] = useState(0);

  // Rotate tips daily based on date
  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );
    setTipIndex(dayOfYear % dashboard.tips.length);
  }, [dashboard.tips.length]);

  const currentTip = dashboard.tips[tipIndex];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200',
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
        <Lightbulb className="w-5 h-5 text-amber-600" />
      </div>
      <div>
        <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1">
          Daily Tip
        </p>
        <p className="text-sm text-amber-900">{currentTip}</p>
      </div>
    </motion.div>
  );
}

// Featured Stats Component
interface FeaturedStatsProps {
  className?: string;
}

export function FeaturedStats({ className }: FeaturedStatsProps) {
  const { currentExamType } = useExamStore();
  const config = getExamConfig(currentExamType);
  const { dashboard } = config;

  return (
    <Card className={cn('p-4', className)}>
      <h4 className="text-sm font-semibold text-neutral-900 mb-4">
        {dashboard.featuredTitle}
      </h4>
      <div className="grid grid-cols-2 gap-3">
        {dashboard.featuredItems.map((item, index) => {
          const ItemIcon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50"
            >
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <ItemIcon className={cn('w-4 h-4', item.color)} />
              </div>
              <div>
                <p className="text-lg font-bold text-neutral-900">{item.value}</p>
                <p className="text-xs text-neutral-500">{item.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

// Quick Actions Bar (alternative horizontal layout)
interface QuickActionsBarProps {
  className?: string;
}

export function QuickActionsBar({ className }: QuickActionsBarProps) {
  const { currentExamType } = useExamStore();
  const config = getExamConfig(currentExamType);
  const { dashboard } = config;

  return (
    <div className={cn('flex gap-3 overflow-x-auto pb-2 scrollbar-hide', className)}>
      {dashboard.quickActions.map((action, index) => {
        const ActionIcon = action.icon;
        return (
          <Link key={action.id} to={action.link}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all whitespace-nowrap"
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', action.bgColor)}>
                <ActionIcon className={cn('w-5 h-5', action.color)} />
              </div>
              <div>
                <p className="font-medium text-neutral-900">{action.label}</p>
                <p className="text-xs text-neutral-500">{action.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}

export default ExamFlyers;

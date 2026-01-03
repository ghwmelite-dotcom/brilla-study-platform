import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/common';
import { useExamStore } from '@/stores/examStore';
import { getExamConfig, getExamGradient } from '@/config';
import { cn } from '@/utils';

interface DashboardHeroProps {
  userName?: string;
  className?: string;
}

export function DashboardHero({ className }: DashboardHeroProps) {
  const { currentExamType } = useExamStore();
  const config = getExamConfig(currentExamType);
  const gradient = getExamGradient(currentExamType);
  const { dashboard } = config;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 md:p-8',
        `bg-gradient-to-br ${gradient}`,
        className
      )}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10">
        {/* Welcome message */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white/90 text-sm mb-4"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {config.shortName} Mode Active
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-3xl font-display font-bold text-white mb-2"
            >
              {dashboard.heroBanner.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/80 text-sm md:text-base mb-6"
            >
              {dashboard.heroBanner.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-3"
            >
              <Link to={dashboard.heroBanner.ctaLink}>
                <Button
                  variant="secondary"
                  className="bg-white text-neutral-900 hover:bg-white/90 shadow-lg"
                >
                  {dashboard.heroBanner.ctaText}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to={dashboard.heroBanner.secondaryCtaLink}>
                <Button
                  variant="ghost"
                  className="border-2 border-white/50 text-white hover:bg-white/20"
                >
                  {dashboard.heroBanner.secondaryCtaText}
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Quick Actions Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-3"
          >
            {dashboard.quickActions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <Link key={action.id} to={action.link}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white/20 backdrop-blur-sm rounded-xl p-3 hover:bg-white/30 transition-colors cursor-pointer"
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', action.bgColor)}>
                      <ActionIcon className={cn('w-4 h-4', action.color)} />
                    </div>
                    <p className="text-white font-medium text-sm">{action.label}</p>
                    <p className="text-white/60 text-xs">{action.description}</p>
                  </motion.div>
                </Link>
              );
            })}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default DashboardHero;

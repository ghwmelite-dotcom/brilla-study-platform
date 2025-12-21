import { useState } from 'react';
import {
  MessageCircle,
  X,
  GraduationCap,
  Briefcase,
  Heart,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/utils';
import { useCounselorStore } from '@/stores';
import type { CounselorType } from '@/types';

interface CounselorButtonProps {
  className?: string;
}

const counselorOptions: { type: CounselorType; icon: React.ElementType; label: string; color: string }[] = [
  { type: 'academic', icon: GraduationCap, label: 'Academic', color: '#3B82F6' },
  { type: 'career', icon: Briefcase, label: 'Career', color: '#8B5CF6' },
  { type: 'wellbeing', icon: Heart, label: 'Wellbeing', color: '#22C55E' },
  { type: 'general', icon: MessageSquare, label: 'General', color: '#F59E0B' },
];

export function CounselorButton({ className }: CounselorButtonProps) {
  const { isOpen, openCounselor } = useCounselorStore();
  const [showOptions, setShowOptions] = useState(false);

  if (isOpen) return null;

  const handleOptionClick = (type: CounselorType) => {
    setShowOptions(false);
    openCounselor(type);
  };

  return (
    <div className={cn('fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40', className)}>
      {/* Options Menu */}
      {showOptions && (
        <div className="absolute bottom-16 right-0 bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden animate-scale-in">
          <div className="p-3 border-b border-neutral-100">
            <p className="text-sm font-medium text-neutral-900">Talk to a Counselor</p>
            <p className="text-xs text-neutral-500">Choose what you need help with</p>
          </div>
          <div className="p-2">
            {counselorOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.type}
                  onClick={() => handleOptionClick(option.type)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${option.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: option.color }} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-neutral-900">{option.label}</p>
                    <p className="text-xs text-neutral-500">
                      {option.type === 'academic' && 'Study help & exam prep'}
                      {option.type === 'career' && 'Career guidance'}
                      {option.type === 'wellbeing' && 'Stress & wellness'}
                      {option.type === 'general' && 'General chat'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        className={cn(
          'w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all',
          showOptions
            ? 'bg-neutral-100 text-neutral-600'
            : 'bg-gradient-to-br from-primary via-secondary to-accent text-white hover:shadow-xl hover:scale-105'
        )}
      >
        {showOptions ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Pulse animation when closed */}
      {!showOptions && (
        <span className="absolute -inset-1 rounded-full bg-primary/30 animate-ping pointer-events-none" />
      )}
    </div>
  );
}

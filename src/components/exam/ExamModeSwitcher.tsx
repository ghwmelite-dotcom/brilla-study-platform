import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Trophy, GraduationCap, BookOpen, Check } from 'lucide-react';
import { useExamStore } from '@/stores/examStore';
import type { ExamTypeSlug } from '@/types';

const EXAM_CONFIG: Record<ExamTypeSlug, { name: string; shortName: string; icon: typeof Trophy; color: string; bgColor: string }> = {
  nsmq: {
    name: 'National Science & Maths Quiz',
    shortName: 'NSMQ',
    icon: Trophy,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  wassce: {
    name: 'WASSCE',
    shortName: 'WASSCE',
    icon: GraduationCap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  bece: {
    name: 'BECE',
    shortName: 'BECE',
    icon: BookOpen,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
};

export function ExamModeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentExamType, examTypes, setExamType, fetchExamTypes, isLoading } = useExamStore();

  useEffect(() => {
    if (examTypes.length === 0) {
      fetchExamTypes();
    }
  }, [examTypes.length, fetchExamTypes]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentConfig = EXAM_CONFIG[currentExamType];
  const CurrentIcon = currentConfig.icon;

  const handleSelect = async (examType: ExamTypeSlug) => {
    if (examType !== currentExamType) {
      await setExamType(examType);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200
          hover:bg-neutral-50 transition-colors
          ${isLoading ? 'opacity-70 cursor-wait' : ''}
        `}
      >
        <div className={`p-1 rounded ${currentConfig.bgColor}`}>
          <CurrentIcon className={`w-4 h-4 ${currentConfig.color}`} />
        </div>
        <span className="font-medium text-sm text-neutral-700">
          {currentConfig.shortName}
        </span>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-neutral-200 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 border-b border-neutral-100">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Select Exam Mode
            </p>
          </div>

          {Object.entries(EXAM_CONFIG).map(([slug, config]) => {
            const Icon = config.icon;
            const isSelected = currentExamType === slug;

            return (
              <button
                key={slug}
                onClick={() => handleSelect(slug as ExamTypeSlug)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 text-left
                  hover:bg-neutral-50 transition-colors
                  ${isSelected ? 'bg-neutral-50' : ''}
                `}
              >
                <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 text-sm">{config.shortName}</p>
                  <p className="text-xs text-neutral-500 truncate">{config.name}</p>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </button>
            );
          })}

          <div className="px-3 py-2 mt-1 border-t border-neutral-100">
            <p className="text-xs text-neutral-500">
              {currentExamType === 'nsmq' && 'Competition prep for SHS students'}
              {currentExamType === 'wassce' && '50+ subjects for SHS final exams'}
              {currentExamType === 'bece' && 'JHS exam preparation'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

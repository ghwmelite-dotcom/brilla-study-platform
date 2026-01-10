import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Trophy, GraduationCap, BookOpen, Check } from 'lucide-react';
import { useExamStore } from '@/stores/examStore';
import { useExamPreferencesStore } from '@/stores/examPreferencesStore';
import type { ExamTypeSlug, GhanaExamTypeSlug } from '@/types';
import { isGhanaExam } from '@/types';

// Exam config interface
interface ExamConfigItem {
  name: string;
  shortName: string;
  icon: typeof Trophy;
  color: string;
  bgColor: string;
}

// Ghana exam types for the mode switcher (international exams use a separate system)
const EXAM_CONFIG: Record<GhanaExamTypeSlug, ExamConfigItem> = {
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

// Map exam type IDs to slugs (only Ghana exams)
const EXAM_ID_TO_SLUG: Record<string, GhanaExamTypeSlug> = {
  'exam_bece': 'bece',
  'exam_wassce': 'wassce',
  'exam_nsmq': 'nsmq',
};

// Get config for an exam type with fallback
const getExamSwitcherConfig = (examType: ExamTypeSlug): ExamConfigItem => {
  if (isGhanaExam(examType)) {
    return EXAM_CONFIG[examType];
  }
  // Default to NSMQ config for international exams (they don't use this switcher)
  return EXAM_CONFIG.nsmq;
};

export function ExamModeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentExamType, setExamType, isLoading } = useExamStore();
  const { preferences, setActiveExamType } = useExamPreferencesStore();

  // Get user's available exam type slugs from preferences
  const userExamSlugs = preferences
    .map(p => EXAM_ID_TO_SLUG[p.examTypeId])
    .filter(Boolean) as ExamTypeSlug[];

  // If user has preferences, filter to only show their exam types
  // Otherwise show all exam types (for admins, new users without preferences, etc.)
  const availableExamTypes = userExamSlugs.length > 0
    ? userExamSlugs
    : (Object.keys(EXAM_CONFIG) as ExamTypeSlug[]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentConfig = getExamSwitcherConfig(currentExamType);
  const CurrentIcon = currentConfig.icon;

  const handleSelect = async (examType: ExamTypeSlug) => {
    if (examType !== currentExamType) {
      await setExamType(examType);
      // Also update the preferences store active exam type
      const examTypeId = Object.entries(EXAM_ID_TO_SLUG).find(([_, slug]) => slug === examType)?.[0];
      if (examTypeId) {
        setActiveExamType(examTypeId);
      }
    }
    setIsOpen(false);
  };

  // If user only has one exam type, show as static badge (no dropdown)
  if (availableExamTypes.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50">
        <div className={`p-1 rounded ${currentConfig.bgColor}`}>
          <CurrentIcon className={`w-4 h-4 ${currentConfig.color}`} />
        </div>
        <span className="font-medium text-sm text-neutral-700">
          {currentConfig.shortName}
        </span>
      </div>
    );
  }

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
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-neutral-200 z-[100] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 border-b border-neutral-100">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Select Exam Mode
            </p>
          </div>

          {availableExamTypes.map((slug) => {
            const config = getExamSwitcherConfig(slug);
            const Icon = config.icon;
            const isSelected = currentExamType === slug;

            return (
              <button
                key={slug}
                onClick={() => handleSelect(slug)}
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

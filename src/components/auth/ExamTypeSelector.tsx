import { useEffect, useState } from 'react';
import { Trophy, GraduationCap, BookOpen, Check, Star, Globe, Award } from 'lucide-react';

// Exam type configuration with icons and colors
const EXAM_TYPE_CONFIG = {
  exam_bece: {
    id: 'exam_bece',
    name: 'BECE',
    fullName: 'Basic Education Certificate Examination',
    description: 'For Junior High School students (JHS 1-3)',
    icon: BookOpen,
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    iconColor: 'text-emerald-600',
    selectedBg: 'bg-emerald-100',
    selectedBorder: 'border-emerald-500',
  },
  exam_wassce: {
    id: 'exam_wassce',
    name: 'WASSCE',
    fullName: 'West African Senior School Certificate Examination',
    description: 'For Senior High School students (SHS 1-3)',
    icon: GraduationCap,
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    iconColor: 'text-blue-600',
    selectedBg: 'bg-blue-100',
    selectedBorder: 'border-blue-500',
  },
  exam_nsmq: {
    id: 'exam_nsmq',
    name: 'NSMQ',
    fullName: 'National Science & Maths Quiz',
    description: 'Competition prep (speed-based, team-oriented)',
    icon: Trophy,
    color: 'amber',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    iconColor: 'text-amber-600',
    selectedBg: 'bg-amber-100',
    selectedBorder: 'border-amber-500',
  },
  igcse: {
    id: 'igcse',
    name: 'IGCSE',
    fullName: 'International General Certificate of Secondary Education',
    description: 'Cambridge O-Level for international students',
    icon: Globe,
    color: 'cyan',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-700',
    iconColor: 'text-cyan-600',
    selectedBg: 'bg-cyan-100',
    selectedBorder: 'border-cyan-500',
  },
  cambridge_a2: {
    id: 'cambridge_a2',
    name: 'A-Level',
    fullName: 'Cambridge Advanced Level',
    description: 'Cambridge A-Level for pre-university students',
    icon: Award,
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    iconColor: 'text-purple-600',
    selectedBg: 'bg-purple-100',
    selectedBorder: 'border-purple-500',
  },
};

interface ExamTypeSelectorProps {
  schoolLevel: 'jhs' | 'shs' | 'international' | null;
  selectedExamTypes: string[];
  primaryExamType: string;
  onChange: (examTypeIds: string[], primaryId: string) => void;
  isTeacher?: boolean;
  allowAll?: boolean; // For admin to assign any exam type
  error?: string;
}

export function ExamTypeSelector({
  schoolLevel,
  selectedExamTypes,
  primaryExamType,
  onChange,
  isTeacher = false,
  allowAll = false,
  error,
}: ExamTypeSelectorProps) {
  const [availableExamTypes, setAvailableExamTypes] = useState<string[]>([]);

  // Determine which exam types to show based on school level
  useEffect(() => {
    if (allowAll || isTeacher) {
      // Teachers and admins can see all exam types
      setAvailableExamTypes(['exam_bece', 'exam_wassce', 'exam_nsmq', 'igcse', 'cambridge_a2']);
    } else if (schoolLevel === 'jhs') {
      // JHS students only see BECE
      setAvailableExamTypes(['exam_bece']);
      // Auto-select BECE for JHS
      if (selectedExamTypes.length === 0) {
        onChange(['exam_bece'], 'exam_bece');
      }
    } else if (schoolLevel === 'shs') {
      // SHS students see WASSCE and NSMQ
      setAvailableExamTypes(['exam_wassce', 'exam_nsmq']);
      // Auto-select WASSCE for SHS if nothing selected
      if (selectedExamTypes.length === 0) {
        onChange(['exam_wassce'], 'exam_wassce');
      }
    } else if (schoolLevel === 'international') {
      // International students see IGCSE and A-Level
      setAvailableExamTypes(['igcse', 'cambridge_a2']);
      // Auto-select IGCSE for international if nothing selected
      if (selectedExamTypes.length === 0) {
        onChange(['igcse'], 'igcse');
      }
    } else {
      setAvailableExamTypes([]);
    }
  }, [schoolLevel, isTeacher, allowAll]);

  const handleToggleExamType = (examTypeId: string) => {
    const isSelected = selectedExamTypes.includes(examTypeId);

    if (isSelected) {
      // Don't allow deselecting if it's the only one
      if (selectedExamTypes.length === 1) return;

      const newSelected = selectedExamTypes.filter(id => id !== examTypeId);
      // If removing the primary, set the first remaining as primary
      const newPrimary = examTypeId === primaryExamType ? newSelected[0] : primaryExamType;
      onChange(newSelected, newPrimary);
    } else {
      const newSelected = [...selectedExamTypes, examTypeId];
      // Keep current primary unless none selected
      const newPrimary = primaryExamType || examTypeId;
      onChange(newSelected, newPrimary);
    }
  };

  const handleSetPrimary = (examTypeId: string) => {
    if (selectedExamTypes.includes(examTypeId)) {
      onChange(selectedExamTypes, examTypeId);
    }
  };

  // For JHS students, show read-only BECE card
  if (schoolLevel === 'jhs' && !isTeacher && !allowAll) {
    const config = EXAM_TYPE_CONFIG.exam_bece;
    const Icon = config.icon;

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700">
          Exam Type
        </label>
        <div className={`p-4 rounded-lg border-2 ${config.selectedBg} ${config.selectedBorder}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${config.textColor}`}>{config.name}</span>
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm text-neutral-500">{config.description}</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          JHS students prepare for the Basic Education Certificate Examination
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-neutral-700">
        {isTeacher ? 'Exam Types You Teach' : 'Select Your Exam Type(s)'}
        {!isTeacher && selectedExamTypes.length > 1 && (
          <span className="ml-2 text-xs text-neutral-500">(Click star to set primary)</span>
        )}
      </label>

      <div className="space-y-2">
        {availableExamTypes.map((examTypeId) => {
          const config = EXAM_TYPE_CONFIG[examTypeId as keyof typeof EXAM_TYPE_CONFIG];
          if (!config) return null;

          const Icon = config.icon;
          const isSelected = selectedExamTypes.includes(examTypeId);
          const isPrimary = primaryExamType === examTypeId;

          return (
            <div
              key={examTypeId}
              onClick={() => handleToggleExamType(examTypeId)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? `${config.selectedBg} ${config.selectedBorder}`
                  : `bg-white ${config.borderColor} hover:${config.bgColor}`
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.bgColor}`}>
                  <Icon className={`w-6 h-6 ${config.iconColor}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${config.textColor}`}>{config.name}</span>
                    <span className="text-xs text-neutral-400">{config.fullName}</span>
                  </div>
                  <p className="text-sm text-neutral-500">{config.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isSelected && !isTeacher && selectedExamTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(examTypeId);
                      }}
                      className={`p-1.5 rounded-full transition-colors ${
                        isPrimary
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-neutral-100 text-neutral-400 hover:bg-amber-50 hover:text-amber-500'
                      }`}
                      title={isPrimary ? 'Primary exam' : 'Set as primary'}
                    >
                      <Star className={`w-4 h-4 ${isPrimary ? 'fill-current' : ''}`} />
                    </button>
                  )}
                  {isSelected && (
                    <div className={`p-1 rounded-full ${config.selectedBg}`}>
                      <Check className={`w-4 h-4 ${config.iconColor}`} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!isTeacher && selectedExamTypes.length > 1 && (
        <p className="text-xs text-neutral-500">
          Your primary exam ({EXAM_TYPE_CONFIG[primaryExamType as keyof typeof EXAM_TYPE_CONFIG]?.name || 'None'}) will be shown by default on your dashboard.
          You can switch between exams anytime.
        </p>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Target,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Award,
  Calendar,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useExamBoardStore } from '@/stores/examBoardStore';
import { useAuthStore } from '@/stores/authStore';
import type { ExamBoard } from '@/types';

// Step configuration
const STEPS = [
  { id: 1, title: 'Exam Board', description: 'Choose your examination board' },
  { id: 2, title: 'Level', description: 'Select O-Level or A-Level' },
  { id: 3, title: 'Subjects', description: 'Pick your subjects' },
  { id: 4, title: 'Targets', description: 'Set your grade goals' },
];

// Grade options for target setting
const GRADE_OPTIONS = {
  'A*-G': ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G'],
  '9-1': ['9', '8', '7', '6', '5', '4', '3', '2', '1'],
  'A*-E': ['A*', 'A', 'B', 'C', 'D', 'E'],
};

// Session options
const EXAM_SESSIONS = [
  { value: 'June 2024', label: 'June 2024' },
  { value: 'November 2024', label: 'November 2024' },
  { value: 'June 2025', label: 'June 2025' },
  { value: 'November 2025', label: 'November 2025' },
];

interface SelectedSubject {
  specificationId: string;
  targetGrade: string;
  examSession: string;
}

export default function ExamSetupWizard() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    examBoards,
    specifications,
    isLoading,
    isLoadingSpecifications,
    isSaving,
    error,
    fetchExamBoards,
    fetchSpecifications,
    selectSpecification,
    setTargetGrade,
    completeSetup,
    clearError,
  } = useExamBoardStore();

  // Local state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedBoard, setSelectedBoard] = useState<ExamBoard | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<'igcse' | 'as' | 'a-level' | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<SelectedSubject[]>([]);
  const [defaultSession, setDefaultSession] = useState('June 2025');

  // Clear any stale errors and fetch exam boards on mount
  useEffect(() => {
    clearError();
    fetchExamBoards();
  }, [fetchExamBoards, clearError]);

  // Fetch specifications when board and level are selected
  useEffect(() => {
    if (selectedBoard && selectedLevel) {
      // Map level to exam type ID
      const examTypeId = getExamTypeId(selectedBoard.code, selectedLevel);
      if (examTypeId) {
        fetchSpecifications(selectedBoard.id, examTypeId);
      }
    }
  }, [selectedBoard, selectedLevel, fetchSpecifications]);

  // Get exam type ID based on board and level
  const getExamTypeId = (boardCode: string, level: string): string | null => {
    const mapping: Record<string, Record<string, string>> = {
      CAIE: {
        igcse: 'igcse',
        as: 'cambridge_as',
        'a-level': 'cambridge_a2',
      },
      EDEXCEL: {
        igcse: 'edexcel_igcse',
        as: 'edexcel_as',
        'a-level': 'edexcel_a2',
      },
    };
    return mapping[boardCode]?.[level] || null;
  };

  // Get available exam types for selected board
  const getAvailableLevels = () => {
    if (!selectedBoard) return [];

    const levels = [
      {
        id: 'igcse',
        name: selectedBoard.code === 'CAIE' ? 'IGCSE (O-Level)' : 'International GCSE',
        description: 'For students aged 14-16, preparing for secondary education certification',
        icon: GraduationCap,
        color: 'from-blue-500 to-blue-600',
      },
      {
        id: 'as',
        name: 'AS Level',
        description: 'First year of A-Level, can be standalone qualification',
        icon: BookOpen,
        color: 'from-purple-500 to-purple-600',
      },
      {
        id: 'a-level',
        name: 'A Level',
        description: 'Full A-Level qualification for university preparation',
        icon: Award,
        color: 'from-amber-500 to-amber-600',
      },
    ];

    return levels;
  };

  // Get grading scale for current selection
  const getGradingScale = (): 'A*-G' | '9-1' | 'A*-E' => {
    if (!selectedBoard || !selectedLevel) return 'A*-G';

    if (selectedLevel === 'igcse') {
      return selectedBoard.code === 'EDEXCEL' ? '9-1' : 'A*-G';
    }
    return 'A*-E';
  };

  // Handle subject selection toggle
  const toggleSubject = (specificationId: string) => {
    setSelectedSubjects((prev) => {
      const existing = prev.find((s) => s.specificationId === specificationId);
      if (existing) {
        return prev.filter((s) => s.specificationId !== specificationId);
      }
      return [
        ...prev,
        {
          specificationId,
          targetGrade: getGradingScale() === '9-1' ? '7' : 'B',
          examSession: defaultSession,
        },
      ];
    });
  };

  // Update target grade for a subject
  const updateTargetGrade = (specificationId: string, grade: string) => {
    setSelectedSubjects((prev) =>
      prev.map((s) =>
        s.specificationId === specificationId ? { ...s, targetGrade: grade } : s
      )
    );
  };

  // Update exam session for a subject
  const updateExamSession = (specificationId: string, session: string) => {
    setSelectedSubjects((prev) =>
      prev.map((s) =>
        s.specificationId === specificationId ? { ...s, examSession: session } : s
      )
    );
  };

  // Handle step navigation
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedBoard !== null;
      case 2:
        return selectedLevel !== null;
      case 3:
        return selectedSubjects.length > 0;
      case 4:
        return selectedSubjects.every((s) => s.targetGrade && s.examSession);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle final submission
  const handleComplete = async () => {
    if (!isAuthenticated) {
      // Store selections in localStorage for after login
      localStorage.setItem(
        'pendingExamSetup',
        JSON.stringify({
          boardId: selectedBoard?.id,
          level: selectedLevel,
          subjects: selectedSubjects,
        })
      );
      navigate('/register?setup=exam');
      return;
    }

    // Save each selected specification and target grade
    for (const subject of selectedSubjects) {
      await selectSpecification(subject.specificationId);
      await setTargetGrade(
        subject.specificationId,
        subject.targetGrade,
        subject.examSession
      );
    }

    completeSetup();
    navigate('/dashboard');
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={`
              flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm
              transition-all duration-300
              ${
                currentStep === step.id
                  ? 'bg-primary text-white scale-110'
                  : currentStep > step.id
                  ? 'bg-green-500 text-white'
                  : 'bg-neutral-200 text-neutral-500'
              }
            `}
          >
            {currentStep > step.id ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              step.id
            )}
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={`w-16 h-1 mx-2 rounded-full transition-colors duration-300 ${
                currentStep > step.id ? 'bg-green-500' : 'bg-neutral-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // Render board selection (Step 1)
  const renderBoardSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Choose Your Examination Board
        </h2>
        <p className="text-neutral-600">
          Select the exam board you&apos;re preparing for
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {examBoards.map((board) => (
            <button
              key={board.id}
              onClick={() => setSelectedBoard(board)}
              className={`
                relative p-6 rounded-2xl border-2 transition-all duration-300
                ${
                  selectedBoard?.id === board.id
                    ? 'border-primary bg-primary-50 shadow-lg scale-[1.02]'
                    : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
                }
              `}
            >
              {selectedBoard?.id === board.id && (
                <div className="absolute top-4 right-4">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
              )}

              <div className="flex items-start gap-4">
                <div
                  className={`
                    w-16 h-16 rounded-xl flex items-center justify-center
                    ${
                      board.code === 'CAIE'
                        ? 'bg-gradient-to-br from-red-500 to-red-600'
                        : 'bg-gradient-to-br from-purple-500 to-purple-600'
                    }
                  `}
                >
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>

                <div className="flex-1 text-left">
                  <h3 className="text-lg font-bold text-neutral-900">
                    {board.name}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    {board.fullName}
                  </p>
                  <p className="text-xs text-neutral-400 mt-2">
                    {board.region}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Render level selection (Step 2)
  const renderLevelSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Select Your Qualification Level
        </h2>
        <p className="text-neutral-600">
          Choose between O-Level (IGCSE) or A-Level qualifications
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {getAvailableLevels().map((level) => {
          const Icon = level.icon;
          const isSelected = selectedLevel === level.id;

          return (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level.id as 'igcse' | 'as' | 'a-level')}
              className={`
                relative p-6 rounded-2xl border-2 transition-all duration-300 text-left
                ${
                  isSelected
                    ? 'border-primary bg-primary-50 shadow-lg scale-[1.02]'
                    : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
              )}

              <div
                className={`
                  w-14 h-14 rounded-xl bg-gradient-to-br ${level.color}
                  flex items-center justify-center mb-4
                `}
              >
                <Icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-lg font-bold text-neutral-900 mb-2">
                {level.name}
              </h3>
              <p className="text-sm text-neutral-600">{level.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Render subject selection (Step 3)
  const renderSubjectSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Choose Your Subjects
        </h2>
        <p className="text-neutral-600">
          Select the subjects you&apos;re preparing for (minimum 1)
        </p>
      </div>

      {isLoadingSpecifications ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      ) : specifications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-neutral-500">
            No subjects available for this selection yet. More subjects coming soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {specifications.map((spec) => {
            const isSelected = selectedSubjects.some(
              (s) => s.specificationId === spec.id
            );

            return (
              <button
                key={spec.id}
                onClick={() => toggleSubject(spec.id)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-300 text-left
                  ${
                    isSelected
                      ? 'border-primary bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${isSelected ? 'bg-primary' : 'bg-neutral-100'}
                    `}
                  >
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <BookOpen
                        className={`w-5 h-5 ${
                          isSelected ? 'text-white' : 'text-neutral-400'
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-neutral-900 truncate">
                      {spec.syllabusName}
                    </h4>
                    <p className="text-xs text-neutral-500">
                      Code: {spec.syllabusCode}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedSubjects.length > 0 && (
        <div className="flex justify-center mt-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {selectedSubjects.length} subject{selectedSubjects.length > 1 ? 's' : ''} selected
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // Render target grade setting (Step 4)
  const renderTargetGrades = () => {
    const grades = GRADE_OPTIONS[getGradingScale()];

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Set Your Target Grades
          </h2>
          <p className="text-neutral-600">
            What grades are you aiming for? We&apos;ll help you get there!
          </p>
        </div>

        {/* Default exam session */}
        <div className="max-w-md mx-auto mb-8">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Default Exam Session
          </label>
          <select
            value={defaultSession}
            onChange={(e) => {
              setDefaultSession(e.target.value);
              setSelectedSubjects((prev) =>
                prev.map((s) => ({ ...s, examSession: e.target.value }))
              );
            }}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary-100"
          >
            {EXAM_SESSIONS.map((session) => (
              <option key={session.value} value={session.value}>
                {session.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          {selectedSubjects.map((subject) => {
            const spec = specifications.find((s) => s.id === subject.specificationId);
            if (!spec) return null;

            return (
              <div
                key={subject.specificationId}
                className="p-4 rounded-xl border border-neutral-200 bg-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900">
                        {spec.syllabusName}
                      </h4>
                      <p className="text-xs text-neutral-500">
                        {spec.syllabusCode}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Target Grade */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-2">
                      Target Grade
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {grades.slice(0, 5).map((grade) => (
                        <button
                          key={grade}
                          onClick={() =>
                            updateTargetGrade(subject.specificationId, grade)
                          }
                          className={`
                            px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                            ${
                              subject.targetGrade === grade
                                ? 'bg-primary text-white'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            }
                          `}
                        >
                          {grade}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exam Session */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-2">
                      Exam Session
                    </label>
                    <select
                      value={subject.examSession}
                      onChange={(e) =>
                        updateExamSession(subject.specificationId, e.target.value)
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 text-sm"
                    >
                      {EXAM_SESSIONS.map((session) => (
                        <option key={session.value} value={session.value}>
                          {session.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info box */}
        <div className="max-w-2xl mx-auto mt-6">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Your targets help us personalize your learning</p>
              <p className="text-blue-600">
                We&apos;ll recommend topics, track your progress, and predict your grades
                based on these targets.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBoardSelection();
      case 2:
        return renderLevelSelection();
      case 3:
        return renderSubjectSelection();
      case 4:
        return renderTargetGrades();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Set Up Your O/A Level Preparation
          </h1>
          <p className="text-neutral-600">
            Let&apos;s customize your learning experience
          </p>
        </div>

        {/* Step indicator */}
        {renderStepIndicator()}

        {/* Current step info */}
        <div className="text-center mb-6">
          <p className="text-sm text-neutral-500">
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].description}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
            <button
              onClick={clearError}
              className="ml-2 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
              ${
                currentStep === 1
                  ? 'text-neutral-300 cursor-not-allowed'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }
            `}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          {currentStep < STEPS.length ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
                ${
                  canProceed()
                    ? 'bg-primary text-white hover:bg-primary-600'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }
              `}
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!canProceed() || isSaving}
              className={`
                flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all
                ${
                  canProceed() && !isSaving
                    ? 'bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }
              `}
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

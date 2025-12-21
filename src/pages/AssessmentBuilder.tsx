import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Clock,
  HelpCircle,
  Settings,
  Users,
  Eye,
  Loader2,
  Save,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAssessmentStore } from '@/stores/assessmentStore';
import type { AssessmentType, AssessmentDraft } from '@/types';
import {
  BasicInfoStep,
  TimingStep,
  QuestionsStep,
  SettingsStep,
  AssignStep,
  ReviewStep,
} from '@/components/assessment';
import { cn } from '@/utils';

const STEPS = [
  { id: 'basic', title: 'Basic Info', icon: FileText },
  { id: 'timing', title: 'Timing', icon: Clock },
  { id: 'questions', title: 'Questions', icon: HelpCircle },
  { id: 'settings', title: 'Settings', icon: Settings },
  { id: 'assign', title: 'Assign', icon: Users },
  { id: 'review', title: 'Review', icon: Eye },
] as const;

type StepId = (typeof STEPS)[number]['id'];

export default function AssessmentBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const {
    draft,
    isLoading,
    isSaving,
    error,
    initDraft,
    updateDraft,
    saveDraft,
    publishAssessment,
    clearDraft,
    clearError,
  } = useAssessmentStore();

  const [currentStep, setCurrentStep] = useState<StepId>('basic');
  const [isPublishing, setIsPublishing] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const assessmentType = searchParams.get('type') as AssessmentType | null;

  // Redirect if not teacher
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (!isTeacher) {
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, isTeacher, navigate]);

  // Initialize draft
  useEffect(() => {
    if (!draft) {
      initDraft(assessmentType || 'quiz');
    }
  }, [draft, initDraft, assessmentType]);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const canProceed = () => {
    if (!draft) return false;

    switch (currentStep) {
      case 'basic':
        return draft.title.trim().length >= 3;
      case 'timing':
        return true; // Timing is optional
      case 'questions':
        return draft.questions.length > 0;
      case 'settings':
        return true; // Settings have defaults
      case 'assign':
        return draft.assignments.length > 0;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const handleStepClick = (stepId: StepId) => {
    const targetIndex = STEPS.findIndex((s) => s.id === stepId);
    // Can only go to completed steps or the next available step
    if (targetIndex <= currentStepIndex + 1) {
      setCurrentStep(stepId);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await saveDraft();
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const handlePublish = async () => {
    if (!draft) return;

    setIsPublishing(true);
    try {
      const assessment = await publishAssessment();
      if (assessment) {
        clearDraft();
        navigate('/teacher/assessments');
      }
    } catch (error) {
      console.error('Failed to publish:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleExit = () => {
    if (draft && (draft.title || draft.questions.length > 0)) {
      setShowExitConfirm(true);
    } else {
      clearDraft();
      navigate('/teacher/assessments');
    }
  };

  const confirmExit = (save: boolean) => {
    if (save) {
      saveDraft().then(() => {
        navigate('/teacher/assessments');
      });
    } else {
      clearDraft();
      navigate('/teacher/assessments');
    }
  };

  const getStepStatus = (stepId: StepId) => {
    const stepIndex = STEPS.findIndex((s) => s.id === stepId);
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'upcoming';
  };

  const renderStep = () => {
    if (!draft) return null;

    switch (currentStep) {
      case 'basic':
        return <BasicInfoStep draft={draft} onUpdate={updateDraft} />;
      case 'timing':
        return <TimingStep draft={draft} onUpdate={updateDraft} />;
      case 'questions':
        return <QuestionsStep draft={draft} onUpdate={updateDraft} />;
      case 'settings':
        return <SettingsStep draft={draft} onUpdate={updateDraft} />;
      case 'assign':
        return <AssignStep draft={draft} onUpdate={updateDraft} />;
      case 'review':
        return <ReviewStep draft={draft} onPublish={handlePublish} isPublishing={isPublishing} />;
      default:
        return null;
    }
  };

  if (!isTeacher) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleExit}
                className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-semibold text-neutral-900">
                  {draft?.id ? 'Edit Assessment' : 'Create Assessment'}
                </h1>
                <p className="text-sm text-neutral-500">
                  {draft?.assessmentType === 'quiz' && 'Quick Quiz'}
                  {draft?.assessmentType === 'homework' && 'Homework Assignment'}
                  {draft?.assessmentType === 'mock_exam' && 'Mock Exam'}
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">Save Draft</span>
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="max-w-5xl mx-auto px-4 pb-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const status = getStepStatus(step.id);
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => handleStepClick(step.id)}
                    disabled={status === 'upcoming' && index > currentStepIndex + 1}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                      status === 'current' && 'bg-indigo-50 text-indigo-700',
                      status === 'completed' && 'text-emerald-600 hover:bg-emerald-50',
                      status === 'upcoming' && 'text-neutral-400'
                    )}
                  >
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium',
                        status === 'current' && 'bg-indigo-600 text-white',
                        status === 'completed' && 'bg-emerald-100 text-emerald-600',
                        status === 'upcoming' && 'bg-neutral-200 text-neutral-500'
                      )}
                    >
                      {status === 'completed' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      {step.title}
                    </span>
                  </button>

                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'w-8 h-0.5 mx-1',
                        index < currentStepIndex ? 'bg-emerald-400' : 'bg-neutral-200'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <p className="text-red-700">{error}</p>
            <button onClick={clearError} className="text-red-500 hover:text-red-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {isLoading && !draft ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            {renderStep()}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      {currentStep !== 'review' && (
        <div className="bg-white border-t border-neutral-200 sticky bottom-0">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors',
                  currentStepIndex === 0
                    ? 'text-neutral-400 cursor-not-allowed'
                    : 'text-neutral-700 hover:bg-neutral-100'
                )}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors',
                  canProceed()
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                )}
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowExitConfirm(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Save your changes?
            </h3>
            <p className="text-neutral-600 mb-6">
              You have unsaved changes. Would you like to save them as a draft before leaving?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => confirmExit(false)}
                className="flex-1 px-4 py-2.5 text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors font-medium"
              >
                Discard
              </button>
              <button
                onClick={() => confirmExit(true)}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Save Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

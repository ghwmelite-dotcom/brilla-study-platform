import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useExamStore } from '@/stores/examStore';
import { useGuidanceStore } from '@/stores/guidanceStore';
import {
  getGuidanceSubjects,
  isBrieDismissalCoolingDown,
  toGuidanceExamType,
} from '@/lib/guidanceExamCatalog';
import { shouldAutoLaunchBrie } from './triggerPolicy';

function isCounselorBrieEnabled(): boolean {
  return import.meta.env.VITE_COUNSELOR_BRIE_ENABLED === 'true';
}

/** Student-only automatic launcher. Existing goals are probed so active sessions resume. */
export function CounselorBrieTrigger() {
  const { isAuthenticated, user } = useAuthStore();
  const currentExamType = useExamStore((state) => state.currentExamType);
  const { wizardOpen, fetchGoals, startAssessment, openWizard } = useGuidanceStore();
  const { pathname } = useLocation();
  const attemptedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const student = user;
    if (!student || !shouldAutoLaunchBrie({
      enabled: isCounselorBrieEnabled(),
      isAuthenticated,
      role: student.role,
      wizardOpen,
      coolingDown: false,
      pathname,
    })) {
      return;
    }

    const examType = toGuidanceExamType(currentExamType);
    const key = `${student.id}:${examType}`;
    if (attemptedKeyRef.current === key) return;
    attemptedKeyRef.current = key;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const goals = await fetchGoals();
      if (cancelled || useGuidanceStore.getState().error) return;

      const currentGoal = goals.find((goal) => goal.examType === examType);
      const subjectId = currentGoal?.subjectId ?? getGuidanceSubjects(currentExamType)[0]?.id;
      if (!subjectId || !shouldAutoLaunchBrie({
        enabled: true,
        isAuthenticated: true,
        role: student.role,
        wizardOpen: false,
        coolingDown: isBrieDismissalCoolingDown(student.id, examType, subjectId),
        pathname,
      })) {
        return;
      }

      if (!currentGoal) {
        openWizard();
        return;
      }

      // The start endpoint resumes the one active user/exam/subject session. This
      // probe intentionally runs even though the goal was already saved.
      const result = await startAssessment(examType, subjectId);
      if (!cancelled && result === 'quiz') openWizard();
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [currentExamType, fetchGoals, isAuthenticated, openWizard, pathname, startAssessment, user, wizardOpen]);

  return null;
}

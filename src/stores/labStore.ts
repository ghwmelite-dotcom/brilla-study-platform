import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Experiment,
  LabSession,
  LabMode,
  Apparatus,
  ApparatusInstance,
  Connection,
  Position,
  Measurement,
  Observation,
  PerformedAction,
  CanvasState,
  GradingResult,
} from '@/types';

// Clear old cached data on load
const STORE_VERSION = 1;
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('brilla-lab');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (!parsed.version || parsed.version < STORE_VERSION) {
        localStorage.removeItem('brilla-lab');
      }
    }
  } catch {
    localStorage.removeItem('brilla-lab');
  }
}

// Helper to get current user from auth store
const getCurrentUser = () => {
  try {
    const authState = JSON.parse(localStorage.getItem('brilla-auth') || '{}');
    return authState?.state?.user || null;
  } catch {
    return null;
  }
};

interface LabState {
  // Current session
  currentSession: LabSession | null;
  currentExperiment: Experiment | null;
  mode: LabMode;

  // Apparatus state
  activeApparatus: ApparatusInstance[];
  selectedApparatus: string | null;
  connections: Connection[];

  // Data collection
  measurements: Measurement[];
  observations: Observation[];

  // Step tracking
  currentStepIndex: number;
  stepCompletionStatus: boolean[];

  // Canvas state
  canvasState: CanvasState;

  // Timer
  timeSpent: number;
  isTimerRunning: boolean;

  // UI state
  isProcedurePanelOpen: boolean;
  isDataTableOpen: boolean;
  showHints: boolean;

  // Results
  lastAttemptResult: GradingResult | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  startSession: (experiment: Experiment, mode: LabMode) => void;
  endSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;

  // Apparatus actions
  addApparatus: (apparatus: Apparatus, position: Position) => void;
  removeApparatus: (instanceId: string) => void;
  moveApparatus: (instanceId: string, position: Position) => void;
  rotateApparatus: (instanceId: string, rotation: number) => void;
  selectApparatus: (instanceId: string | null) => void;
  connectApparatus: (fromId: string, toId: string, fromPoint: string, toPoint: string) => void;
  disconnectApparatus: (connectionId: string) => void;
  adjustApparatus: (instanceId: string, value: number) => void;

  // Measurement actions
  recordMeasurement: (apparatusId: string, value: number, unit: string) => void;
  deleteMeasurement: (measurementId: string) => void;
  updateMeasurement: (measurementId: string, value: number) => void;

  // Observation actions
  addObservation: (text: string) => void;
  updateObservation: (id: string, text: string) => void;
  deleteObservation: (id: string) => void;

  // Step navigation
  goToStep: (stepIndex: number) => void;
  completeStep: () => void;
  nextStep: () => void;
  previousStep: () => void;
  recordAction: (action: PerformedAction) => void;

  // Timer
  incrementTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;

  // UI toggles
  toggleProcedurePanel: () => void;
  toggleDataTable: () => void;
  toggleHints: () => void;

  // Canvas
  updateCanvasState: (state: Partial<CanvasState>) => void;

  // Session management
  saveSession: () => void;
  submitExperiment: () => Promise<GradingResult>;

  // Utility
  clearError: () => void;
  reset: () => void;
}

const initialCanvasState: CanvasState = {
  width: 800,
  height: 600,
  zoom: 1,
  panX: 0,
  panY: 0,
};

const initialState = {
  currentSession: null,
  currentExperiment: null,
  mode: 'guided' as LabMode,
  activeApparatus: [],
  selectedApparatus: null,
  connections: [],
  measurements: [],
  observations: [],
  currentStepIndex: 0,
  stepCompletionStatus: [],
  canvasState: initialCanvasState,
  timeSpent: 0,
  isTimerRunning: false,
  isProcedurePanelOpen: true,
  isDataTableOpen: false,
  showHints: false,
  lastAttemptResult: null,
  isLoading: false,
  error: null,
};

export const useLabStore = create<LabState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Session Actions
      startSession: (experiment, mode) => {
        const user = getCurrentUser();
        const userId = user?.id || 'anonymous';

        const session: LabSession = {
          id: `lab_${Date.now()}`,
          userId,
          experimentId: experiment.id,
          mode,
          status: 'in_progress',
          currentStepIndex: 0,
          startedAt: new Date().toISOString(),
          timeSpent: 0,
          stepProgress: experiment.procedure.map((step) => ({
            stepNumber: step.stepNumber,
            isCompleted: false,
            actionsPerformed: [],
            marksEarned: 0,
          })),
          measurements: [],
          observations: [],
        };

        set({
          currentSession: session,
          currentExperiment: experiment,
          mode,
          currentStepIndex: 0,
          stepCompletionStatus: new Array(experiment.procedure.length).fill(false),
          activeApparatus: [],
          connections: [],
          measurements: [],
          observations: [],
          timeSpent: 0,
          isTimerRunning: true,
          isProcedurePanelOpen: true,
          lastAttemptResult: null,
        });
      },

      endSession: () => {
        const { currentSession } = get();
        if (currentSession) {
          set({
            currentSession: { ...currentSession, status: 'abandoned' },
            isTimerRunning: false,
          });
        }
        // Reset to initial state
        set(initialState);
      },

      pauseSession: () => {
        set({ isTimerRunning: false });
      },

      resumeSession: () => {
        set({ isTimerRunning: true });
      },

      // Apparatus Actions
      addApparatus: (apparatus, position) => {
        const instance: ApparatusInstance = {
          instanceId: `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          apparatusId: apparatus.id,
          apparatus,
          position,
          rotation: 0,
          currentValue: apparatus.properties.defaultValue,
          isActive: true,
        };

        set((state) => ({
          activeApparatus: [...state.activeApparatus, instance],
        }));
      },

      removeApparatus: (instanceId) => {
        set((state) => ({
          activeApparatus: state.activeApparatus.filter((a) => a.instanceId !== instanceId),
          connections: state.connections.filter(
            (c) => c.fromInstanceId !== instanceId && c.toInstanceId !== instanceId
          ),
          selectedApparatus: state.selectedApparatus === instanceId ? null : state.selectedApparatus,
        }));
      },

      moveApparatus: (instanceId, position) => {
        set((state) => ({
          activeApparatus: state.activeApparatus.map((a) =>
            a.instanceId === instanceId ? { ...a, position } : a
          ),
        }));
      },

      rotateApparatus: (instanceId, rotation) => {
        set((state) => ({
          activeApparatus: state.activeApparatus.map((a) =>
            a.instanceId === instanceId ? { ...a, rotation } : a
          ),
        }));
      },

      selectApparatus: (instanceId) => {
        set({ selectedApparatus: instanceId });
      },

      connectApparatus: (fromId, toId, fromPoint, toPoint) => {
        const connection: Connection = {
          id: `conn_${Date.now()}`,
          fromInstanceId: fromId,
          fromPoint,
          toInstanceId: toId,
          toPoint,
        };

        set((state) => ({
          connections: [...state.connections, connection],
        }));
      },

      disconnectApparatus: (connectionId) => {
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== connectionId),
        }));
      },

      adjustApparatus: (instanceId, value) => {
        set((state) => ({
          activeApparatus: state.activeApparatus.map((a) =>
            a.instanceId === instanceId ? { ...a, currentValue: value } : a
          ),
        }));
      },

      // Measurement Actions
      recordMeasurement: (apparatusId, value, unit) => {
        const { currentStepIndex } = get();
        const measurement: Measurement = {
          id: `meas_${Date.now()}`,
          apparatusId,
          value,
          unit,
          timestamp: new Date().toISOString(),
          stepNumber: currentStepIndex + 1,
        };

        set((state) => ({
          measurements: [...state.measurements, measurement],
        }));
      },

      deleteMeasurement: (measurementId) => {
        set((state) => ({
          measurements: state.measurements.filter((m) => m.id !== measurementId),
        }));
      },

      updateMeasurement: (measurementId, value) => {
        set((state) => ({
          measurements: state.measurements.map((m) =>
            m.id === measurementId ? { ...m, value } : m
          ),
        }));
      },

      // Observation Actions
      addObservation: (text) => {
        const { currentStepIndex } = get();
        const observation: Observation = {
          id: `obs_${Date.now()}`,
          stepNumber: currentStepIndex + 1,
          text,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          observations: [...state.observations, observation],
        }));
      },

      updateObservation: (id, text) => {
        set((state) => ({
          observations: state.observations.map((o) =>
            o.id === id ? { ...o, text } : o
          ),
        }));
      },

      deleteObservation: (id) => {
        set((state) => ({
          observations: state.observations.filter((o) => o.id !== id),
        }));
      },

      // Step Navigation
      goToStep: (stepIndex) => {
        const { currentExperiment } = get();
        if (!currentExperiment) return;

        if (stepIndex >= 0 && stepIndex < currentExperiment.procedure.length) {
          set({ currentStepIndex: stepIndex });
        }
      },

      completeStep: () => {
        const { currentStepIndex, stepCompletionStatus, currentSession } = get();

        const newStatus = [...stepCompletionStatus];
        newStatus[currentStepIndex] = true;

        // Update session step progress
        if (currentSession) {
          const updatedProgress = [...currentSession.stepProgress];
          updatedProgress[currentStepIndex] = {
            ...updatedProgress[currentStepIndex],
            isCompleted: true,
            completedAt: new Date().toISOString(),
          };

          set({
            stepCompletionStatus: newStatus,
            currentSession: {
              ...currentSession,
              stepProgress: updatedProgress,
            },
          });
        } else {
          set({ stepCompletionStatus: newStatus });
        }
      },

      nextStep: () => {
        const { currentStepIndex, currentExperiment } = get();
        if (!currentExperiment) return;

        if (currentStepIndex < currentExperiment.procedure.length - 1) {
          set({ currentStepIndex: currentStepIndex + 1 });
        }
      },

      previousStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex > 0) {
          set({ currentStepIndex: currentStepIndex - 1 });
        }
      },

      recordAction: (action) => {
        const { currentSession, currentStepIndex } = get();
        if (!currentSession) return;

        const updatedProgress = [...currentSession.stepProgress];
        updatedProgress[currentStepIndex] = {
          ...updatedProgress[currentStepIndex],
          actionsPerformed: [
            ...updatedProgress[currentStepIndex].actionsPerformed,
            action,
          ],
        };

        set({
          currentSession: {
            ...currentSession,
            stepProgress: updatedProgress,
          },
        });
      },

      // Timer
      incrementTimer: () => {
        const { isTimerRunning } = get();
        if (!isTimerRunning) return;

        set((state) => ({
          timeSpent: state.timeSpent + 1,
          currentSession: state.currentSession
            ? { ...state.currentSession, timeSpent: state.timeSpent + 1 }
            : null,
        }));
      },

      pauseTimer: () => {
        set({ isTimerRunning: false });
      },

      resumeTimer: () => {
        set({ isTimerRunning: true });
      },

      // UI Toggles
      toggleProcedurePanel: () => {
        set((state) => ({ isProcedurePanelOpen: !state.isProcedurePanelOpen }));
      },

      toggleDataTable: () => {
        set((state) => ({ isDataTableOpen: !state.isDataTableOpen }));
      },

      toggleHints: () => {
        set((state) => ({ showHints: !state.showHints }));
      },

      // Canvas
      updateCanvasState: (newState) => {
        set((state) => ({
          canvasState: { ...state.canvasState, ...newState },
        }));
      },

      // Session Management
      saveSession: () => {
        const { currentSession, measurements, observations, activeApparatus, connections } = get();
        if (!currentSession) return;

        // Session is automatically saved via persist middleware
        set({
          currentSession: {
            ...currentSession,
            measurements,
            observations,
            canvasState: JSON.stringify({ activeApparatus, connections }),
          },
        });
      },

      submitExperiment: async () => {
        const { currentSession, currentExperiment, measurements, stepCompletionStatus, timeSpent } =
          get();

        if (!currentSession || !currentExperiment) {
          throw new Error('No active session');
        }

        set({ isLoading: true });

        try {
          // Calculate grading result
          // TODO: Replace with API call when backend is ready
          const completedSteps = stepCompletionStatus.filter(Boolean).length;
          const totalSteps = currentExperiment.procedure.length;
          const procedureAccuracy = Math.round((completedSteps / totalSteps) * 100);

          // Calculate measurement accuracy (simplified)
          const measurementAccuracy = measurements.length > 0 ? 70 : 0; // Placeholder

          // Calculate total score
          const maxScore = currentExperiment.procedure.reduce((sum, step) => sum + step.maxMarks, 0);
          const totalScore = Math.round((procedureAccuracy / 100) * maxScore);
          const percentageScore = Math.round((totalScore / maxScore) * 100);

          const result: GradingResult = {
            totalScore,
            maxScore,
            percentageScore,
            criteriaScores: currentExperiment.assessmentCriteria.map((criterion) => ({
              criterionId: criterion.id,
              criterionName: criterion.name,
              score: Math.round((procedureAccuracy / 100) * criterion.maxMarks),
              maxScore: criterion.maxMarks,
              feedback: procedureAccuracy >= 70 ? 'Good work!' : 'Needs improvement',
            })),
            procedureAccuracy,
            measurementAccuracy,
            feedback: {
              overall:
                percentageScore >= 70
                  ? 'Excellent work! You demonstrated strong practical skills.'
                  : percentageScore >= 50
                    ? 'Good effort! With more practice, you can improve further.'
                    : 'More practice needed. Review the procedure and try again.',
              strengths: procedureAccuracy >= 70 ? ['Procedure execution'] : [],
              improvements: procedureAccuracy < 70 ? ['Procedure accuracy'] : [],
            },
          };

          // Update session as completed
          set({
            currentSession: {
              ...currentSession,
              status: 'completed',
              completedAt: new Date().toISOString(),
              timeSpent,
            },
            lastAttemptResult: result,
            isTimerRunning: false,
            isLoading: false,
          });

          return result;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to submit experiment',
            isLoading: false,
          });
          throw error;
        }
      },

      // Utility
      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'brilla-lab',
      version: STORE_VERSION,
      partialize: (state) => ({
        currentSession: state.currentSession,
        currentExperiment: state.currentExperiment,
        mode: state.mode,
        activeApparatus: state.activeApparatus,
        connections: state.connections,
        measurements: state.measurements,
        observations: state.observations,
        currentStepIndex: state.currentStepIndex,
        stepCompletionStatus: state.stepCompletionStatus,
        timeSpent: state.timeSpent,
      }),
    }
  )
);

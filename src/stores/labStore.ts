import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
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
  CanvasState,
  GradingResult,
  LabEventInput,
  LabActionType,
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

const FLUSH_BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 15_000;
const RETRY_DELAYS_MS = [15_000, 30_000, 60_000];

let flushTimer: ReturnType<typeof setInterval> | null = null;
let retryCount = 0;

const stopFlushTimer = () => {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
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

  // Server sync
  serverSessionId: string | null;
  eventQueue: LabEventInput[];
  syncStatus: 'idle' | 'syncing' | 'retry_scheduled';
  submitPending: boolean;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  startSession: (experiment: Experiment, mode: LabMode) => Promise<void>;
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
  recordMeasurement: (value: number, unit: string, label: string, condition?: string, apparatusId?: string) => void;
  deleteMeasurement: (measurementId: string) => void;
  updateMeasurement: (measurementId: string, value: number) => void;

  // Event queue
  enqueueEvent: (eventType: LabEventInput['eventType'], payload: LabEventInput['payload']) => void;
  flushEventQueue: () => Promise<void>;

  // Observation actions
  addObservation: (text: string) => void;
  recordObservation: (text: string) => void;
  updateObservation: (id: string, text: string) => void;
  deleteObservation: (id: string) => void;

  // Step navigation
  goToStep: (stepIndex: number) => void;
  completeStep: () => void;
  nextStep: () => void;
  previousStep: () => void;
  recordAction: (actionType: LabActionType, targetApparatus: string, value?: number) => void;

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
  finishPractice: () => Promise<void>;

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
  serverSessionId: null,
  eventQueue: [],
  syncStatus: 'idle' as const,
  submitPending: false,
  isLoading: false,
  error: null,
};

export const useLabStore = create<LabState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Session Actions
      startSession: async (experiment, mode) => {
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
          serverSessionId: null,
          eventQueue: [],
          submitPending: false,
          error: null,
        });

        // Start the periodic flush for this session.
        stopFlushTimer();
        retryCount = 0;
        flushTimer = setInterval(() => {
          void get().flushEventQueue();
        }, FLUSH_INTERVAL_MS);

        const res = await api.startLabSession(experiment.slug, mode);
        if (!res.success || !res.data) {
          stopFlushTimer();
          set({ ...initialState, error: res.code ?? res.error ?? 'Failed to start lab session' });
          return;
        }
        set({ serverSessionId: res.data.sessionId });
      },

      endSession: () => {
        const { currentSession } = get();
        stopFlushTimer();
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
      recordMeasurement: (value, unit, label, condition, apparatusId) => {
        const { currentStepIndex } = get();
        const measurement: Measurement = {
          id: `meas_${Date.now()}`,
          apparatusId: apparatusId ?? 'app_generic',
          value,
          unit,
          timestamp: new Date().toISOString(),
          stepNumber: currentStepIndex + 1,
        };
        set((state) => ({ measurements: [...state.measurements, measurement] }));
        get().enqueueEvent('measurement', {
          value, unit, label, condition, apparatusId, stepNumber: currentStepIndex + 1,
        });
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

      // Event Queue
      enqueueEvent: (eventType, payload) => {
        const event: LabEventInput = {
          clientEventId: crypto.randomUUID(),
          eventType,
          payload,
        };
        set((state) => ({ eventQueue: [...state.eventQueue, event] }));
        if (get().eventQueue.length >= FLUSH_BATCH_SIZE) {
          void get().flushEventQueue();
        }
      },

      flushEventQueue: async () => {
        const { eventQueue, serverSessionId, syncStatus } = get();
        if (!serverSessionId || eventQueue.length === 0 || syncStatus === 'syncing') return;

        const batch = eventQueue.slice(0, 200);
        set({ syncStatus: 'syncing' });
        try {
          const res = await api.appendLabEvents(serverSessionId, batch);
          if (!res.success) throw new Error(res.error ?? 'flush failed');
          // Only drop events the server accepted or explicitly deduped.
          const acknowledged = (res.data?.accepted ?? 0) + (res.data?.duplicates ?? 0);
          set((state) => ({
            eventQueue: state.eventQueue.slice(acknowledged),
            syncStatus: 'idle',
          }));
          retryCount = 0;
        } catch {
          // Offline resilience: the queue persists in localStorage and retries
          // with backoff; server-side idempotency makes re-sends safe.
          retryCount = Math.min(retryCount + 1, RETRY_DELAYS_MS.length);
          set({ syncStatus: 'retry_scheduled' });
          setTimeout(() => {
            set({ syncStatus: 'idle' });
            void get().flushEventQueue();
          }, RETRY_DELAYS_MS[retryCount - 1]);
        }
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
        get().enqueueEvent('observation', { text, stepNumber: currentStepIndex + 1 });
      },

      recordObservation: (text) => {
        get().addObservation(text); // keeps the observations panel working
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
        get().enqueueEvent('step_complete', { stepNumber: currentStepIndex + 1 });
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

      recordAction: (actionType, targetApparatus, value) => {
        const { currentSession, currentStepIndex } = get();
        const stepNumber = currentStepIndex + 1;
        if (currentSession) {
          const updatedProgress = [...currentSession.stepProgress];
          updatedProgress[currentStepIndex] = {
            ...updatedProgress[currentStepIndex],
            actionsPerformed: [
              ...updatedProgress[currentStepIndex].actionsPerformed,
              { actionType, apparatusId: targetApparatus, value, timestamp: new Date().toISOString(), isCorrect: true },
            ],
          };
          set({ currentSession: { ...currentSession, stepProgress: updatedProgress } });
        }
        get().enqueueEvent('action', { actionType, targetApparatus, value, stepNumber });
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
        const { currentSession, currentExperiment, serverSessionId } = get();

        if (!currentSession || !currentExperiment) {
          throw new Error('No active session');
        }
        if (currentExperiment.simulationType === 'phet') {
          throw new Error('Practice sessions are not graded — use finishPractice()');
        }

        set({ isLoading: true, submitPending: false });

        try {
          // Best-effort flush so the grader sees all recorded evidence.
          await get().flushEventQueue();

          if (!serverSessionId) throw new Error('Session has not synced to the server yet');
          const res = await api.submitLabSession(serverSessionId);
          if (!res.success || !res.data || res.data.graded !== true) {
            throw new Error(res.error ?? 'Grading is pending');
          }

          const result = res.data.grading;
          stopFlushTimer();
          set({
            currentSession: {
              ...currentSession,
              status: 'completed',
              completedAt: new Date().toISOString(),
            },
            lastAttemptResult: result,
            isTimerRunning: false,
            isLoading: false,
          });
          return result;
        } catch (error) {
          // Honest degradation: no locally-fabricated score. The student is
          // told grading is pending; the result appears in history on sync.
          set({
            submitPending: true,
            error: error instanceof Error ? error.message : 'Failed to submit experiment',
            isLoading: false,
          });
          throw error;
        }
      },

      finishPractice: async () => {
        const { currentSession, currentExperiment, serverSessionId } = get();
        if (!currentSession || !currentExperiment) return;
        if (currentExperiment.simulationType !== 'phet') return;

        if (serverSessionId) {
          await api.submitLabSession(serverSessionId).catch(() => undefined);
        }
        stopFlushTimer();
        set({
          currentSession: { ...currentSession, status: 'completed', completedAt: new Date().toISOString() },
          isTimerRunning: false,
        });
      },

      // Utility
      clearError: () => set({ error: null }),

      reset: () => {
        stopFlushTimer();
        set(initialState);
      },
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
        serverSessionId: state.serverSessionId,
        eventQueue: state.eventQueue,
      }),
    }
  )
);

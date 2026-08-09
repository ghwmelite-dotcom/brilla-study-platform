import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  WhiteboardToolType,
  WhiteboardSettings,
  SavedWhiteboard,
  CanvasHistoryState,
} from '@/types/whiteboard';
import { DEFAULT_SETTINGS } from '@/types/whiteboard';
import { whiteboardsService, type WhiteboardData } from '@/lib/services';

interface WhiteboardState {
  // Current session
  currentWhiteboardId: string | null;
  isEditing: boolean;

  // Tool state
  activeTool: WhiteboardToolType;
  settings: WhiteboardSettings;
  showGrid: boolean;
  zoom: number;

  // History for undo/redo
  history: CanvasHistoryState[];
  historyIndex: number;
  maxHistorySize: number;

  // Saved whiteboards (from cloud)
  savedWhiteboards: SavedWhiteboard[];
  isLoadingWhiteboards: boolean;
  whiteboardsError: string | null;

  // UI state
  isSaving: boolean;
  lastSaved: string | null;
  hasUnsavedChanges: boolean;

  // Tool actions
  setActiveTool: (tool: WhiteboardToolType) => void;
  updateSettings: (settings: Partial<WhiteboardSettings>) => void;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFillColor: (color: string) => void;
  toggleGrid: () => void;
  setZoom: (zoom: number) => void;

  // History actions
  addToHistory: (json: string) => void;
  undo: () => CanvasHistoryState | null;
  redo: () => CanvasHistoryState | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // Whiteboard management (async - cloud-backed)
  fetchWhiteboards: () => Promise<void>;
  saveWhiteboard: (whiteboard: Omit<SavedWhiteboard, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<SavedWhiteboard>;
  loadWhiteboard: (id: string) => Promise<SavedWhiteboard | null>;
  deleteWhiteboard: (id: string) => Promise<void>;
  duplicateWhiteboard: (id: string) => Promise<SavedWhiteboard | null>;
  updateWhiteboardMetadata: (id: string, updates: Partial<Pick<SavedWhiteboard, 'title' | 'description' | 'subjectId' | 'topicId'>>) => Promise<void>;

  // Session actions
  startNewWhiteboard: () => void;
  setCurrentWhiteboard: (id: string | null) => void;
  markUnsavedChanges: (hasChanges: boolean) => void;
  resetStore: () => void;
}

// Convert API response to SavedWhiteboard format
function apiToSavedWhiteboard(data: WhiteboardData): SavedWhiteboard {
  return {
    id: data.id,
    title: data.title,
    description: data.description || undefined,
    canvasJSON: data.canvasJSON,
    thumbnail: data.thumbnail || undefined,
    canvasWidth: data.canvasWidth,
    canvasHeight: data.canvasHeight,
    subjectId: data.subjectId || undefined,
    topicId: data.topicId || undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

const initialState = {
  currentWhiteboardId: null,
  isEditing: false,
  activeTool: 'pen' as WhiteboardToolType,
  settings: { ...DEFAULT_SETTINGS },
  showGrid: false,
  zoom: 1,
  history: [] as CanvasHistoryState[],
  historyIndex: -1,
  maxHistorySize: 50,
  savedWhiteboards: [] as SavedWhiteboard[],
  isLoadingWhiteboards: false,
  whiteboardsError: null,
  isSaving: false,
  lastSaved: null,
  hasUnsavedChanges: false,
};

export const useWhiteboardStore = create<WhiteboardState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========== TOOL ACTIONS ==========

      setActiveTool: (tool) => {
        set({ activeTool: tool });
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      setStrokeColor: (color) => {
        set((state) => ({
          settings: { ...state.settings, strokeColor: color },
        }));
      },

      setStrokeWidth: (width) => {
        set((state) => ({
          settings: { ...state.settings, strokeWidth: width },
        }));
      },

      setFillColor: (color) => {
        set((state) => ({
          settings: { ...state.settings, fillColor: color },
        }));
      },

      toggleGrid: () => {
        set((state) => ({ showGrid: !state.showGrid }));
      },

      setZoom: (zoom) => {
        set({ zoom: Math.max(0.25, Math.min(3, zoom)) });
      },

      // ========== HISTORY ACTIONS ==========

      addToHistory: (json) => {
        const { history, historyIndex, maxHistorySize } = get();

        // Remove any redo states
        const newHistory = history.slice(0, historyIndex + 1);

        // Add new state
        newHistory.push({
          json,
          timestamp: Date.now(),
        });

        // Trim to max size
        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
        }

        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
          hasUnsavedChanges: true,
        });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          set({ historyIndex: newIndex, hasUnsavedChanges: true });
          return history[newIndex];
        }
        return null;
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          set({ historyIndex: newIndex, hasUnsavedChanges: true });
          return history[newIndex];
        }
        return null;
      },

      canUndo: () => {
        const { historyIndex } = get();
        return historyIndex > 0;
      },

      canRedo: () => {
        const { history, historyIndex } = get();
        return historyIndex < history.length - 1;
      },

      clearHistory: () => {
        set({ history: [], historyIndex: -1 });
      },

      // ========== WHITEBOARD MANAGEMENT (CLOUD-BACKED) ==========

      fetchWhiteboards: async () => {
        set({ isLoadingWhiteboards: true, whiteboardsError: null });
        try {
          const response = await whiteboardsService.list();
          const whiteboards = response.whiteboards.map(apiToSavedWhiteboard);
          set({ savedWhiteboards: whiteboards, isLoadingWhiteboards: false });
        } catch (error) {
          console.error('Failed to fetch whiteboards:', error);
          set({
            whiteboardsError: error instanceof Error ? error.message : 'Failed to load whiteboards',
            isLoadingWhiteboards: false,
          });
        }
      },

      saveWhiteboard: async (whiteboardData) => {
        const { savedWhiteboards } = get();
        const now = new Date().toISOString();

        set({ isSaving: true });

        try {
          const isUpdate = whiteboardData.id && savedWhiteboards.some((w) => w.id === whiteboardData.id);

          if (isUpdate) {
            // Update existing whiteboard in cloud
            const response = await whiteboardsService.update(whiteboardData.id!, {
              title: whiteboardData.title,
              description: whiteboardData.description,
              canvasJSON: whiteboardData.canvasJSON,
              thumbnail: whiteboardData.thumbnail,
              canvasWidth: whiteboardData.canvasWidth,
              canvasHeight: whiteboardData.canvasHeight,
              subjectId: whiteboardData.subjectId,
              topicId: whiteboardData.topicId,
            });

            const updatedWhiteboard = apiToSavedWhiteboard(response);

            set({
              savedWhiteboards: savedWhiteboards.map((w) =>
                w.id === whiteboardData.id ? updatedWhiteboard : w
              ),
              hasUnsavedChanges: false,
              lastSaved: now,
              isSaving: false,
            });

            return updatedWhiteboard;
          } else {
            // Create new whiteboard in cloud
            const response = await whiteboardsService.create({
              title: whiteboardData.title,
              description: whiteboardData.description,
              canvasJSON: whiteboardData.canvasJSON,
              thumbnail: whiteboardData.thumbnail,
              canvasWidth: whiteboardData.canvasWidth,
              canvasHeight: whiteboardData.canvasHeight,
              subjectId: whiteboardData.subjectId,
              topicId: whiteboardData.topicId,
            });

            const newWhiteboard = apiToSavedWhiteboard(response);

            set({
              savedWhiteboards: [newWhiteboard, ...savedWhiteboards],
              currentWhiteboardId: newWhiteboard.id,
              hasUnsavedChanges: false,
              lastSaved: now,
              isSaving: false,
            });

            return newWhiteboard;
          }
        } catch (error) {
          console.error('Failed to save whiteboard:', error);
          set({ isSaving: false });
          throw error;
        }
      },

      loadWhiteboard: async (id) => {
        try {
          const response = await whiteboardsService.get(id);
          const whiteboard = apiToSavedWhiteboard(response);

          set({
            currentWhiteboardId: id,
            isEditing: true,
            hasUnsavedChanges: false,
          });

          return whiteboard;
        } catch (error) {
          console.error('Failed to load whiteboard:', error);
          return null;
        }
      },

      deleteWhiteboard: async (id) => {
        const { savedWhiteboards, currentWhiteboardId } = get();

        try {
          await whiteboardsService.delete(id);

          set({
            savedWhiteboards: savedWhiteboards.filter((w) => w.id !== id),
            currentWhiteboardId: currentWhiteboardId === id ? null : currentWhiteboardId,
          });
        } catch (error) {
          console.error('Failed to delete whiteboard:', error);
          throw error;
        }
      },

      duplicateWhiteboard: async (id) => {
        const { savedWhiteboards } = get();

        try {
          const response = await whiteboardsService.duplicate(id);
          const duplicate = apiToSavedWhiteboard(response);

          set({
            savedWhiteboards: [duplicate, ...savedWhiteboards],
          });

          return duplicate;
        } catch (error) {
          console.error('Failed to duplicate whiteboard:', error);
          return null;
        }
      },

      updateWhiteboardMetadata: async (id, updates) => {
        const { savedWhiteboards } = get();

        try {
          const response = await whiteboardsService.update(id, {
            title: updates.title,
            description: updates.description,
            subjectId: updates.subjectId,
            topicId: updates.topicId,
          });

          const updated = apiToSavedWhiteboard(response);

          set({
            savedWhiteboards: savedWhiteboards.map((w) =>
              w.id === id ? updated : w
            ),
          });
        } catch (error) {
          console.error('Failed to update whiteboard metadata:', error);
          throw error;
        }
      },

      // ========== SESSION ACTIONS ==========

      startNewWhiteboard: () => {
        set({
          currentWhiteboardId: null,
          isEditing: false,
          history: [],
          historyIndex: -1,
          hasUnsavedChanges: false,
          activeTool: 'pen',
          settings: { ...DEFAULT_SETTINGS },
          zoom: 1,
        });
      },

      setCurrentWhiteboard: (id) => {
        set({ currentWhiteboardId: id });
      },

      markUnsavedChanges: (hasChanges) => {
        set({ hasUnsavedChanges: hasChanges });
      },

      resetStore: () => {
        set({
          ...initialState,
          savedWhiteboards: get().savedWhiteboards, // Keep saved whiteboards
        });
      },
    }),
    {
      name: 'brilla-whiteboard',
      // Only persist user preferences, not whiteboards (those are in cloud)
      partialize: (state) => ({
        settings: state.settings,
        showGrid: state.showGrid,
      }),
    }
  )
);

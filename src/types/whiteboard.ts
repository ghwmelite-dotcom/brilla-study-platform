// Whiteboard Types for Teacher Portal

export type WhiteboardToolType =
  | 'select'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'text';

export interface WhiteboardSettings {
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  fontSize: number;
  fontFamily: string;
  opacity: number;
}

export interface SavedWhiteboard {
  id: string;
  title: string;
  description?: string;
  canvasJSON: string;
  thumbnail?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  subjectId?: string;
  topicId?: string;
  teacherId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhiteboardDraft {
  id?: string;
  title: string;
  description: string;
  subjectId?: string;
  topicId?: string;
}

export interface CanvasHistoryState {
  json: string;
  timestamp: number;
}

export const DEFAULT_COLORS = [
  '#000000', // Black
  '#374151', // Gray
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#FFFFFF', // White
] as const;

export const HIGHLIGHTER_COLORS = [
  '#FEF08A', // Yellow highlight
  '#BBF7D0', // Green highlight
  '#BFDBFE', // Blue highlight
  '#FBCFE8', // Pink highlight
  '#FED7AA', // Orange highlight
] as const;

export const STROKE_WIDTHS = [2, 4, 6, 8, 12, 16] as const;

export const DEFAULT_SETTINGS: WhiteboardSettings = {
  strokeColor: '#000000',
  strokeWidth: 4,
  fillColor: 'transparent',
  fontSize: 24,
  fontFamily: 'Inter, sans-serif',
  opacity: 1,
};

// ========== RECORDING TYPES ==========

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'ended';

export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

export interface CanvasEvent {
  timestamp: number; // milliseconds from recording start
  type: 'add' | 'modify' | 'remove' | 'clear' | 'path' | 'tool-change';
  objectJSON?: string; // Fabric.js serialized object
  objectId?: string;
  toolType?: WhiteboardToolType;
  settings?: Partial<WhiteboardSettings>;
}

export interface WhiteboardRecording {
  id: string;
  title: string;
  description: string;
  duration: number; // milliseconds
  teacherId: string;
  teacherName?: string;

  // Recording assets (URLs - can be R2 or local blob URLs)
  canvasEventsUrl: string; // JSON file with canvas events
  audioUrl?: string; // WebM audio
  webcamUrl?: string; // WebM video
  thumbnailUrl?: string; // Preview image

  // Canvas metadata
  canvasWidth: number;
  canvasHeight: number;
  initialCanvasJSON?: string; // Starting state of canvas

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface RecordingSession {
  id: string;
  startTime: number;
  events: CanvasEvent[];
  audioBlob?: Blob;
  webcamBlob?: Blob;
  duration: number;
}

export interface WebcamSettings {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size: 'small' | 'medium' | 'large';
  mirrored: boolean;
}

export const DEFAULT_WEBCAM_SETTINGS: WebcamSettings = {
  enabled: true,
  position: 'bottom-right',
  size: 'medium',
  mirrored: true,
};

export const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

import { useState, useRef, useCallback, useEffect } from 'react';
import * as fabric from 'fabric';
import type {
  RecordingState,
  CanvasEvent,
  RecordingSession,
  WebcamSettings,
} from '@/types/whiteboard';
import { DEFAULT_WEBCAM_SETTINGS } from '@/types/whiteboard';

// Extend FabricObject to include custom properties
declare module 'fabric' {
  interface FabricObject {
    id?: string;
    data?: { isGrid?: boolean };
  }
}

interface UseWhiteboardRecorderOptions {
  canvas: fabric.Canvas | null;
  enableAudio?: boolean;
  enableWebcam?: boolean;
  webcamSettings?: WebcamSettings;
}

interface UseWhiteboardRecorderReturn {
  // State
  recordingState: RecordingState;
  duration: number;
  events: CanvasEvent[];

  // Media streams
  audioStream: MediaStream | null;
  webcamStream: MediaStream | null;
  audioLevel: number;

  // Controls
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<RecordingSession>;

  // Permissions
  requestPermissions: () => Promise<boolean>;
  hasAudioPermission: boolean;
  hasWebcamPermission: boolean;

  // Errors
  error: string | null;
}

const generateId = () => `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export function useWhiteboardRecorder({
  canvas,
  enableAudio = true,
  enableWebcam = true,
  webcamSettings = DEFAULT_WEBCAM_SETTINGS,
}: UseWhiteboardRecorderOptions): UseWhiteboardRecorderReturn {
  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [events, setEvents] = useState<CanvasEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Permissions state
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [hasWebcamPermission, setHasWebcamPermission] = useState(false);

  // Media streams
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs for recording
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const pauseStartRef = useRef<number>(0);
  const eventsRef = useRef<CanvasEvent[]>([]);
  const recordingIdRef = useRef<string>('');

  // MediaRecorder refs
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const webcamRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const webcamChunksRef = useRef<Blob[]>([]);

  // Audio analyzer for level meter
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Request media permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      if (enableAudio) {
        const audio = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(audio);
        setHasAudioPermission(true);

        // Set up audio analyzer for level meter
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaStreamSource(audio);
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 256;
        source.connect(analyzerRef.current);
      }

      if (enableWebcam && webcamSettings.enabled) {
        const video = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user',
          },
        });
        setWebcamStream(video);
        setHasWebcamPermission(true);
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get media permissions';
      setError(message);
      return false;
    }
  }, [enableAudio, enableWebcam, webcamSettings.enabled]);

  // Update audio level meter
  const updateAudioLevel = useCallback(() => {
    if (!analyzerRef.current) return;

    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(dataArray);

    // Calculate average level
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(average / 255); // Normalize to 0-1

    if (recordingState === 'recording') {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [recordingState]);

  // Add canvas event listener
  const addCanvasEvent = useCallback(
    (type: CanvasEvent['type'], objectJSON?: string, objectId?: string) => {
      if (recordingState !== 'recording') return;

      const elapsed = Date.now() - startTimeRef.current - pausedDurationRef.current;
      const event: CanvasEvent = {
        timestamp: elapsed,
        type,
        objectJSON,
        objectId,
      };

      eventsRef.current.push(event);
      setEvents([...eventsRef.current]);
    },
    [recordingState]
  );

  // Set up canvas event listeners
  useEffect(() => {
    if (!canvas || recordingState !== 'recording') return;

    const handleObjectAdded = (e: { target?: fabric.FabricObject }) => {
      const target = e.target;
      if (target && !target.data?.isGrid) {
        addCanvasEvent('add', JSON.stringify(target.toJSON()), target.id);
      }
    };

    const handleObjectModified = (e: { target?: fabric.FabricObject }) => {
      const target = e.target;
      if (target && !target.data?.isGrid) {
        addCanvasEvent('modify', JSON.stringify(target.toJSON()), target.id);
      }
    };

    const handleObjectRemoved = (e: { target?: fabric.FabricObject }) => {
      const target = e.target;
      if (target && !target.data?.isGrid) {
        addCanvasEvent('remove', undefined, target.id);
      }
    };

    const handlePathCreated = (e: { path?: fabric.FabricObject }) => {
      if (e.path) {
        addCanvasEvent('path', JSON.stringify(e.path.toJSON()));
      }
    };

    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:removed', handleObjectRemoved);
    canvas.on('path:created', handlePathCreated);

    return () => {
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:removed', handleObjectRemoved);
      canvas.off('path:created', handlePathCreated);
    };
  }, [canvas, recordingState, addCanvasEvent]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!canvas) {
      setError('Canvas not ready');
      return;
    }

    try {
      setError(null);

      // Request permissions if not already granted
      if (enableAudio && !hasAudioPermission) {
        const granted = await requestPermissions();
        if (!granted) return;
      }

      // Initialize recording state
      recordingIdRef.current = generateId();
      startTimeRef.current = Date.now();
      pausedDurationRef.current = 0;
      eventsRef.current = [];
      audioChunksRef.current = [];
      webcamChunksRef.current = [];

      // Start audio recording
      if (audioStream) {
        audioRecorderRef.current = new MediaRecorder(audioStream, {
          mimeType: 'audio/webm;codecs=opus',
        });
        audioRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        audioRecorderRef.current.start(1000); // Collect data every second
      }

      // Start webcam recording
      if (webcamStream) {
        webcamRecorderRef.current = new MediaRecorder(webcamStream, {
          mimeType: 'video/webm;codecs=vp9',
        });
        webcamRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            webcamChunksRef.current.push(e.data);
          }
        };
        webcamRecorderRef.current.start(1000);
      }

      // Start duration timer
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current - pausedDurationRef.current;
        setDuration(elapsed);
      }, 100);

      // Start audio level monitoring
      if (analyzerRef.current) {
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      }

      setRecordingState('recording');
      setEvents([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
    }
  }, [canvas, audioStream, webcamStream, enableAudio, hasAudioPermission, requestPermissions, updateAudioLevel]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (recordingState !== 'recording') return;

    pauseStartRef.current = Date.now();

    // Pause media recorders
    if (audioRecorderRef.current?.state === 'recording') {
      audioRecorderRef.current.pause();
    }
    if (webcamRecorderRef.current?.state === 'recording') {
      webcamRecorderRef.current.pause();
    }

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Stop audio level monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setRecordingState('paused');
  }, [recordingState]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (recordingState !== 'paused') return;

    // Calculate paused duration
    pausedDurationRef.current += Date.now() - pauseStartRef.current;

    // Resume media recorders
    if (audioRecorderRef.current?.state === 'paused') {
      audioRecorderRef.current.resume();
    }
    if (webcamRecorderRef.current?.state === 'paused') {
      webcamRecorderRef.current.resume();
    }

    // Resume timer
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current - pausedDurationRef.current;
      setDuration(elapsed);
    }, 100);

    // Resume audio level monitoring
    if (analyzerRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }

    setRecordingState('recording');
  }, [recordingState, updateAudioLevel]);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<RecordingSession> => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop audio level monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Calculate final duration
    const finalDuration = Date.now() - startTimeRef.current - pausedDurationRef.current;

    // Stop and finalize audio recording
    let audioBlob: Blob | undefined;
    if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        audioRecorderRef.current!.onstop = () => resolve();
        audioRecorderRef.current!.stop();
      });
      if (audioChunksRef.current.length > 0) {
        audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      }
    }

    // Stop and finalize webcam recording
    let webcamBlob: Blob | undefined;
    if (webcamRecorderRef.current && webcamRecorderRef.current.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        webcamRecorderRef.current!.onstop = () => resolve();
        webcamRecorderRef.current!.stop();
      });
      if (webcamChunksRef.current.length > 0) {
        webcamBlob = new Blob(webcamChunksRef.current, { type: 'video/webm' });
      }
    }

    setRecordingState('stopped');
    setDuration(finalDuration);

    const session: RecordingSession = {
      id: recordingIdRef.current,
      startTime: startTimeRef.current,
      events: [...eventsRef.current],
      audioBlob,
      webcamBlob,
      duration: finalDuration,
    };

    return session;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Stop animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Stop media streams
      audioStream?.getTracks().forEach((track) => track.stop());
      webcamStream?.getTracks().forEach((track) => track.stop());

      // Close audio context
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, [audioStream, webcamStream]);

  return {
    recordingState,
    duration,
    events,
    audioStream,
    webcamStream,
    audioLevel,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    requestPermissions,
    hasAudioPermission,
    hasWebcamPermission,
    error,
  };
}

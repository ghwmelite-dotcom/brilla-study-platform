import { useState, useRef, useCallback, useEffect } from 'react';
import * as fabric from 'fabric';
import type {
  PlaybackState,
  PlaybackSpeed,
  CanvasEvent,
  WhiteboardRecording,
} from '@/types/whiteboard';

interface UseWhiteboardPlayerOptions {
  canvas: fabric.Canvas | null;
  recording: WhiteboardRecording | null;
}

interface UseWhiteboardPlayerReturn {
  // State
  playbackState: PlaybackState;
  currentTime: number;
  duration: number;
  speed: PlaybackSpeed;

  // Controls
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;

  // Loading
  loadRecording: (recording: WhiteboardRecording) => Promise<void>;
  isLoading: boolean;
  error: string | null;

  // Audio/Video elements
  audioRef: React.RefObject<HTMLAudioElement>;
  webcamRef: React.RefObject<HTMLVideoElement>;
}

export function useWhiteboardPlayer({
  canvas,
  recording,
}: UseWhiteboardPlayerOptions): UseWhiteboardPlayerReturn {
  // Playback state
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Canvas events
  const eventsRef = useRef<CanvasEvent[]>([]);
  const eventIndexRef = useRef(0);

  // Timing refs
  const playbackStartTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);
  const animationFrameRef = useRef<number>(0);

  // Media refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);

  // Initial canvas state
  const initialCanvasJSONRef = useRef<string>('');

  // Load recording data
  const loadRecording = useCallback(async (rec: WhiteboardRecording) => {
    if (!canvas) {
      setError('Canvas not ready');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch canvas events
      const eventsResponse = await fetch(rec.canvasEventsUrl);
      if (!eventsResponse.ok) {
        throw new Error('Failed to load canvas events');
      }
      const eventsData = await eventsResponse.json();
      eventsRef.current = eventsData.events || eventsData;

      // Store initial canvas state
      initialCanvasJSONRef.current = rec.initialCanvasJSON || '{"version":"6.0.0","objects":[]}';

      // Load initial canvas state
      const initialJSON = JSON.parse(initialCanvasJSONRef.current);
      await canvas.loadFromJSON(initialJSON);
      canvas.renderAll();

      // Set duration
      setDuration(rec.duration);
      setCurrentTime(0);
      eventIndexRef.current = 0;
      setPlaybackState('idle');

      // Set audio source
      if (audioRef.current && rec.audioUrl) {
        audioRef.current.src = rec.audioUrl;
        audioRef.current.load();
      }

      // Set webcam source
      if (webcamRef.current && rec.webcamUrl) {
        webcamRef.current.src = rec.webcamUrl;
        webcamRef.current.load();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load recording';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [canvas]);

  // Replay a single canvas event
  const replayEvent = useCallback(async (event: CanvasEvent) => {
    if (!canvas) return;

    switch (event.type) {
      case 'add':
      case 'path':
        if (event.objectJSON) {
          try {
            const objectData = JSON.parse(event.objectJSON);
            const objects = await fabric.util.enlivenObjects([objectData]);
            objects.forEach((obj) => {
              if (event.objectId) {
                (obj as any).id = event.objectId;
              }
              canvas.add(obj as fabric.FabricObject);
            });
            canvas.renderAll();
          } catch (err) {
            console.error('Failed to replay add event:', err);
          }
        }
        break;

      case 'modify':
        if (event.objectJSON && event.objectId) {
          const existingObj = canvas.getObjects().find((obj) => (obj as any).id === event.objectId);
          if (existingObj) {
            try {
              const newProps = JSON.parse(event.objectJSON);
              existingObj.set(newProps);
              existingObj.setCoords();
              canvas.renderAll();
            } catch (err) {
              console.error('Failed to replay modify event:', err);
            }
          }
        }
        break;

      case 'remove':
        if (event.objectId) {
          const objToRemove = canvas.getObjects().find((obj) => (obj as any).id === event.objectId);
          if (objToRemove) {
            canvas.remove(objToRemove);
            canvas.renderAll();
          }
        }
        break;

      case 'clear':
        canvas.clear();
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
        break;
    }
  }, [canvas]);

  // Main playback loop
  const playbackLoop = useCallback(() => {
    if (playbackState !== 'playing') return;

    const elapsed = (Date.now() - playbackStartTimeRef.current) * speed;
    const newTime = pausedTimeRef.current + elapsed;
    setCurrentTime(Math.min(newTime, duration));

    // Replay events up to current time
    while (
      eventIndexRef.current < eventsRef.current.length &&
      eventsRef.current[eventIndexRef.current].timestamp <= newTime
    ) {
      replayEvent(eventsRef.current[eventIndexRef.current]);
      eventIndexRef.current++;
    }

    // Check if playback ended
    if (newTime >= duration) {
      setPlaybackState('ended');
      pausedTimeRef.current = duration;

      // Pause media
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (webcamRef.current) {
        webcamRef.current.pause();
      }
      return;
    }

    animationFrameRef.current = requestAnimationFrame(playbackLoop);
  }, [playbackState, speed, duration, replayEvent]);

  // Start playback loop when playing
  useEffect(() => {
    if (playbackState === 'playing') {
      animationFrameRef.current = requestAnimationFrame(playbackLoop);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playbackState, playbackLoop]);

  // Play
  const play = useCallback(() => {
    if (playbackState === 'ended') {
      // Restart from beginning
      seek(0);
    }

    playbackStartTimeRef.current = Date.now();
    setPlaybackState('playing');

    // Play audio
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.playbackRate = speed;
      audioRef.current.currentTime = pausedTimeRef.current / 1000;
      audioRef.current.play().catch(() => {});
    }

    // Play webcam video
    if (webcamRef.current && webcamRef.current.src) {
      webcamRef.current.playbackRate = speed;
      webcamRef.current.currentTime = pausedTimeRef.current / 1000;
      webcamRef.current.play().catch(() => {});
    }
  }, [playbackState, speed]);

  // Pause
  const pause = useCallback(() => {
    if (playbackState !== 'playing') return;

    const elapsed = (Date.now() - playbackStartTimeRef.current) * speed;
    pausedTimeRef.current = pausedTimeRef.current + elapsed;
    setPlaybackState('paused');

    // Pause audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Pause webcam video
    if (webcamRef.current) {
      webcamRef.current.pause();
    }

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [playbackState, speed]);

  // Seek to specific time
  const seek = useCallback(async (time: number) => {
    if (!canvas) return;

    const wasPlaying = playbackState === 'playing';

    // Pause if playing
    if (wasPlaying) {
      pause();
    }

    // Reset canvas to initial state
    try {
      const initialJSON = JSON.parse(initialCanvasJSONRef.current);
      await canvas.loadFromJSON(initialJSON);
      canvas.renderAll();
    } catch (err) {
      console.error('Failed to reset canvas:', err);
    }

    // Find event index for the target time
    eventIndexRef.current = 0;

    // Replay all events up to target time
    for (let i = 0; i < eventsRef.current.length; i++) {
      if (eventsRef.current[i].timestamp <= time) {
        await replayEvent(eventsRef.current[i]);
        eventIndexRef.current = i + 1;
      } else {
        break;
      }
    }

    // Update time state
    pausedTimeRef.current = time;
    setCurrentTime(time);

    // Seek audio
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.currentTime = time / 1000;
    }

    // Seek webcam video
    if (webcamRef.current && webcamRef.current.src) {
      webcamRef.current.currentTime = time / 1000;
    }

    // Resume if was playing
    if (wasPlaying) {
      play();
    }
  }, [canvas, playbackState, pause, play, replayEvent]);

  // Set playback speed
  const setSpeed = useCallback((newSpeed: PlaybackSpeed) => {
    const wasPlaying = playbackState === 'playing';

    if (wasPlaying) {
      // Calculate elapsed time at current speed
      const elapsed = (Date.now() - playbackStartTimeRef.current) * speed;
      pausedTimeRef.current = pausedTimeRef.current + elapsed;
    }

    setSpeedState(newSpeed);

    if (wasPlaying) {
      playbackStartTimeRef.current = Date.now();

      // Update media playback rate
      if (audioRef.current) {
        audioRef.current.playbackRate = newSpeed;
      }
      if (webcamRef.current) {
        webcamRef.current.playbackRate = newSpeed;
      }
    }
  }, [playbackState, speed]);

  // Load recording when it changes
  useEffect(() => {
    if (recording) {
      loadRecording(recording);
    }
  }, [recording?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    playbackState,
    currentTime,
    duration,
    speed,
    play,
    pause,
    seek,
    setSpeed,
    loadRecording,
    isLoading,
    error,
    audioRef,
    webcamRef,
  };
}

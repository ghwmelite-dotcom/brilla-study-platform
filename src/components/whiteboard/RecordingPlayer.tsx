import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as fabric from 'fabric';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { WhiteboardRecording, PlaybackSpeed } from '@/types/whiteboard';
import { PLAYBACK_SPEEDS } from '@/types/whiteboard';
import { useWhiteboardPlayer } from '@/hooks/useWhiteboardPlayer';

interface RecordingPlayerProps {
  recording: WhiteboardRecording;
  className?: string;
  autoPlay?: boolean;
}

export interface RecordingPlayerRef {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
}

export const RecordingPlayer = forwardRef<RecordingPlayerRef, RecordingPlayerProps>(
  ({ recording, className = '', autoPlay = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Fabric canvas
    useEffect(() => {
      if (!canvasRef.current || fabricCanvas) return;

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: recording.canvasWidth || 1200,
        height: recording.canvasHeight || 800,
        backgroundColor: '#ffffff',
        selection: false,
        interactive: false,
      });

      setFabricCanvas(canvas);

      return () => {
        canvas.dispose();
      };
    }, [recording.canvasWidth, recording.canvasHeight]);

    const {
      playbackState,
      currentTime,
      duration,
      speed,
      play,
      pause,
      seek,
      setSpeed,
      isLoading,
      error,
      audioRef,
      webcamRef,
    } = useWhiteboardPlayer({
      canvas: fabricCanvas,
      recording,
    });

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      play,
      pause,
      seek,
    }));

    // Auto-play
    useEffect(() => {
      if (autoPlay && !isLoading && playbackState === 'idle') {
        play();
      }
    }, [autoPlay, isLoading, playbackState, play]);

    // Handle audio muting
    useEffect(() => {
      if (audioRef.current) {
        audioRef.current.muted = isMuted;
      }
    }, [isMuted, audioRef]);

    // Fullscreen handling
    useEffect(() => {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
      if (!containerRef.current) return;

      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    };

    // Auto-hide controls
    const resetControlsTimeout = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (playbackState === 'playing') {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    // Format time display
    const formatTime = (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Handle seek from progress bar
    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      seek(newTime);
    };

    // Toggle play/pause
    const togglePlayPause = () => {
      if (playbackState === 'playing') {
        pause();
      } else {
        play();
      }
    };

    // Restart from beginning
    const restart = () => {
      seek(0);
      play();
    };

    if (error) {
      return (
        <div className={`flex items-center justify-center bg-neutral-100 rounded-lg p-8 ${className}`}>
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">Failed to load recording</p>
            <p className="text-sm text-neutral-500 mt-1">{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={`relative bg-black rounded-lg overflow-hidden ${className}`}
        onMouseMove={resetControlsTimeout}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => playbackState === 'playing' && setShowControls(false)}
      >
        {/* Canvas */}
        <div className="relative flex items-center justify-center bg-neutral-50">
          <canvas ref={canvasRef} className="max-w-full max-h-full" />

          {/* Webcam PIP */}
          {recording.webcamUrl && (
            <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden shadow-lg border-2 border-white bg-black">
              <video
                ref={webcamRef as React.RefObject<HTMLVideoElement>}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
          )}

          {/* Play button overlay (when paused) */}
          {!isLoading && playbackState !== 'playing' && (
            <button
              onClick={togglePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
            >
              <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-10 h-10 text-neutral-800 ml-1" />
              </div>
            </button>
          )}
        </div>

        {/* Hidden audio element */}
        {recording.audioUrl && (
          <audio ref={audioRef as React.RefObject<HTMLAudioElement>} preload="auto" />
        )}

        {/* Controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-4 px-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress bar */}
          <div
            className="w-full h-2 bg-white/30 rounded-full cursor-pointer mb-4 group"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-teal-500 rounded-full relative"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={togglePlayPause}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                {playbackState === 'playing' ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>

              {/* Restart */}
              <button
                onClick={restart}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                title="Restart"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Mute */}
              {recording.audioUrl && (
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
              )}

              {/* Time display */}
              <span className="text-white text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Speed selector */}
              <select
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value) as PlaybackSpeed)}
                className="bg-white/20 text-white text-sm rounded-lg px-2 py-1 border-none focus:ring-2 focus:ring-teal-500"
              >
                {PLAYBACK_SPEEDS.map((s) => (
                  <option key={s} value={s} className="text-neutral-900">
                    {s}x
                  </option>
                ))}
              </select>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

RecordingPlayer.displayName = 'RecordingPlayer';

import { useState } from 'react';
import {
  Circle,
  Square,
  Pause,
  Play,
  Mic,
  MicOff,
  Video,
  VideoOff,
  AlertCircle,
} from 'lucide-react';
import type { RecordingState } from '@/types/whiteboard';

interface RecordingControlsProps {
  recordingState: RecordingState;
  duration: number;
  audioLevel: number;
  hasAudioPermission: boolean;
  hasWebcamPermission: boolean;
  error: string | null;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
  onRequestPermissions: () => void;
}

export function RecordingControls({
  recordingState,
  duration,
  audioLevel,
  hasAudioPermission,
  hasWebcamPermission,
  error,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  onRequestPermissions,
}: RecordingControlsProps) {
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStartClick = () => {
    if (!hasAudioPermission && !hasWebcamPermission) {
      setShowPermissionPrompt(true);
    } else {
      onStartRecording();
    }
  };

  const handleGrantPermissions = async () => {
    onRequestPermissions();
    setShowPermissionPrompt(false);
  };

  // Not recording - show start button
  if (recordingState === 'idle' || recordingState === 'stopped') {
    return (
      <div className="relative">
        <button
          onClick={handleStartClick}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Circle className="w-4 h-4 fill-current" />
          <span className="font-medium">Record</span>
        </button>

        {/* Permission prompt */}
        {showPermissionPrompt && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPermissionPrompt(false)}
            />
            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-neutral-200 p-4 z-50">
              <h4 className="font-semibold text-neutral-900 mb-2">
                Enable Recording
              </h4>
              <p className="text-sm text-neutral-600 mb-4">
                To record lessons, we need access to your microphone and camera.
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  {hasAudioPermission ? (
                    <Mic className="w-4 h-4 text-green-500" />
                  ) : (
                    <MicOff className="w-4 h-4 text-neutral-400" />
                  )}
                  <span className={hasAudioPermission ? 'text-green-600' : 'text-neutral-600'}>
                    Microphone {hasAudioPermission ? 'enabled' : 'required'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {hasWebcamPermission ? (
                    <Video className="w-4 h-4 text-green-500" />
                  ) : (
                    <VideoOff className="w-4 h-4 text-neutral-400" />
                  )}
                  <span className={hasWebcamPermission ? 'text-green-600' : 'text-neutral-600'}>
                    Camera {hasWebcamPermission ? 'enabled' : 'optional'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowPermissionPrompt(false)}
                  className="flex-1 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGrantPermissions}
                  className="flex-1 px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Enable
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Recording or paused - show controls
  return (
    <div className="flex items-center gap-3 bg-neutral-100 rounded-lg px-3 py-2">
      {/* Recording indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            recordingState === 'recording'
              ? 'bg-red-500 animate-pulse'
              : 'bg-amber-500'
          }`}
        />
        <span className="text-sm font-mono font-medium text-neutral-700 min-w-[60px]">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Audio level meter */}
      {hasAudioPermission && (
        <div className="flex items-center gap-1.5">
          <Mic className="w-4 h-4 text-neutral-500" />
          <div className="w-16 h-2 bg-neutral-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-100"
              style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Webcam indicator */}
      {hasWebcamPermission && (
        <Video className="w-4 h-4 text-green-500" />
      )}

      {/* Pause/Resume button */}
      {recordingState === 'recording' ? (
        <button
          onClick={onPauseRecording}
          className="p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors"
          title="Pause"
        >
          <Pause className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={onResumeRecording}
          className="p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors"
          title="Resume"
        >
          <Play className="w-5 h-5" />
        </button>
      )}

      {/* Stop button */}
      <button
        onClick={onStopRecording}
        className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        title="Stop Recording"
      >
        <Square className="w-4 h-4 fill-current" />
        <span className="text-sm font-medium">Stop</span>
      </button>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-1 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

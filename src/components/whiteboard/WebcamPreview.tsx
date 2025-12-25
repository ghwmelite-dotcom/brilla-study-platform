import { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2, FlipHorizontal, Move } from 'lucide-react';
import type { WebcamSettings } from '@/types/whiteboard';

interface WebcamPreviewProps {
  stream: MediaStream | null;
  settings: WebcamSettings;
  onSettingsChange: (settings: Partial<WebcamSettings>) => void;
  onClose?: () => void;
  isRecording?: boolean;
}

const POSITION_CLASSES = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
};

const SIZE_CLASSES = {
  small: 'w-32 h-24',
  medium: 'w-48 h-36',
  large: 'w-64 h-48',
};

export function WebcamPreview({
  stream,
  settings,
  onSettingsChange,
  onClose,
  isRecording = false,
}: WebcamPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showControls, setShowControls] = useState(false);

  // Connect stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream || !settings.enabled) return null;

  const cyclePosition = () => {
    const positions: WebcamSettings['position'][] = [
      'top-left',
      'top-right',
      'bottom-right',
      'bottom-left',
    ];
    const currentIndex = positions.indexOf(settings.position);
    const nextIndex = (currentIndex + 1) % positions.length;
    onSettingsChange({ position: positions[nextIndex] });
  };

  const cycleSize = () => {
    const sizes: WebcamSettings['size'][] = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(settings.size);
    const nextIndex = (currentIndex + 1) % sizes.length;
    onSettingsChange({ size: sizes[nextIndex] });
  };

  const toggleMirror = () => {
    onSettingsChange({ mirrored: !settings.mirrored });
  };

  return (
    <div
      className={`absolute ${POSITION_CLASSES[settings.position]} z-30 transition-all duration-300`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div
        className={`relative ${SIZE_CLASSES[settings.size]} rounded-xl overflow-hidden shadow-lg border-2 ${
          isRecording ? 'border-red-500' : 'border-neutral-300'
        } bg-black`}
      >
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${settings.mirrored ? 'scale-x-[-1]' : ''}`}
        />

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            REC
          </div>
        )}

        {/* Control overlay */}
        {showControls && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity">
            {/* Move/Position button */}
            <button
              onClick={cyclePosition}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              title="Change position"
            >
              <Move className="w-4 h-4" />
            </button>

            {/* Size toggle */}
            <button
              onClick={cycleSize}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              title={`Size: ${settings.size}`}
            >
              {settings.size === 'large' ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Mirror toggle */}
            <button
              onClick={toggleMirror}
              className={`p-2 rounded-full text-white transition-colors ${
                settings.mirrored ? 'bg-teal-500/50' : 'bg-white/20 hover:bg-white/30'
              }`}
              title={settings.mirrored ? 'Mirrored' : 'Not mirrored'}
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-red-500/50 rounded-full text-white transition-colors"
                title="Hide webcam"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Position indicator */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-neutral-500 whitespace-nowrap">
        {settings.position.replace('-', ' ')}
      </div>
    </div>
  );
}

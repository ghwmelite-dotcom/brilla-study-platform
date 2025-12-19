import { useState, useEffect } from 'react';
import { Mic, MicOff, X, Check, Loader2 } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks';
import type { VoiceStatus } from '@/hooks';
import { cn } from '@/utils';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onSubmit?: (text: string) => void;
  placeholder?: string;
  autoSubmit?: boolean;
  disabled?: boolean;
  className?: string;
}

const statusConfig: Record<VoiceStatus, { color: string; pulse: boolean; icon: React.ComponentType<{ className?: string }> }> = {
  idle: { color: 'bg-neutral-500', pulse: false, icon: Mic },
  listening: { color: 'bg-red-500', pulse: true, icon: Mic },
  processing: { color: 'bg-yellow-500', pulse: false, icon: Loader2 },
  success: { color: 'bg-green-500', pulse: false, icon: Check },
  error: { color: 'bg-red-600', pulse: false, icon: MicOff },
};

export function VoiceInput({
  onTranscript,
  onSubmit,
  placeholder = 'Tap the mic to speak your answer...',
  autoSubmit = false,
  disabled = false,
  className,
}: VoiceInputProps) {
  const [manualText, setManualText] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const {
    isSupported,
    isListening,
    status,
    fullTranscript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({
    onResult: (result) => {
      if (result.isFinal) {
        onTranscript(result.transcript);
        if (autoSubmit && onSubmit) {
          onSubmit(result.transcript);
        }
      }
    },
  });

  // Update manual text when transcript changes
  useEffect(() => {
    if (fullTranscript) {
      setManualText(fullTranscript);
      onTranscript(fullTranscript);
    }
  }, [fullTranscript, onTranscript]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setManualText('');
      startListening();
    }
  };

  const handleSubmit = () => {
    if (manualText.trim() && onSubmit) {
      onSubmit(manualText.trim());
    }
  };

  const handleClear = () => {
    resetTranscript();
    setManualText('');
    onTranscript('');
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualText(e.target.value);
    onTranscript(e.target.value);
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  // If not supported, show fallback text input
  if (!isSupported) {
    return (
      <div className={cn('flex gap-2', className)}>
        <input
          type="text"
          value={manualText}
          onChange={handleManualChange}
          placeholder="Type your answer..."
          disabled={disabled}
          className="flex-1 px-4 py-3 rounded-lg border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-neutral-100"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSubmit) {
              handleSubmit();
            }
          }}
        />
        {onSubmit && (
          <button
            onClick={handleSubmit}
            disabled={!manualText.trim() || disabled}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            Submit
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Voice input area */}
      <div className="relative">
        <div
          className={cn(
            'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
            isListening ? 'border-red-500 bg-red-50' : 'border-neutral-200 bg-white',
            disabled && 'opacity-50 pointer-events-none'
          )}
        >
          {/* Microphone button */}
          <button
            onClick={handleMicClick}
            disabled={disabled}
            className="relative flex-shrink-0"
          >
            {/* Pulse animation when listening */}
            {config.pulse && (
              <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-75" />
            )}
            <div
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center transition-all',
                config.color,
                'text-white shadow-lg',
                isListening && 'scale-110'
              )}
            >
              <StatusIcon className={cn('w-6 h-6', status === 'processing' && 'animate-spin')} />
            </div>
          </button>

          {/* Transcript display */}
          <div className="flex-1 min-w-0">
            {showManualInput ? (
              <input
                type="text"
                value={manualText}
                onChange={handleManualChange}
                placeholder="Type your answer..."
                className="w-full px-2 py-1 bg-transparent border-none focus:outline-none text-lg"
                autoFocus
              />
            ) : (
              <div className="min-h-[28px]">
                {fullTranscript || manualText ? (
                  <p className="text-lg text-neutral-900">{fullTranscript || manualText}</p>
                ) : isListening ? (
                  <p className="text-neutral-500 animate-pulse">Listening...</p>
                ) : (
                  <p className="text-neutral-400">{placeholder}</p>
                )}
              </div>
            )}

            {/* Confidence indicator */}
            {confidence > 0 && !isListening && (
              <p className="text-xs text-neutral-500 mt-1">
                Confidence: {Math.round(confidence)}%
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {(fullTranscript || manualText) && !isListening && (
              <button
                onClick={handleClear}
                className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                title="Clear"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Toggle manual input */}
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-full transition-colors',
                showManualInput
                  ? 'bg-primary text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              {showManualInput ? 'Voice' : 'Type'}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Submit button */}
      {onSubmit && (
        <button
          onClick={handleSubmit}
          disabled={!(fullTranscript || manualText).trim() || disabled || isListening}
          className={cn(
            'w-full py-3 rounded-lg font-semibold transition-all',
            (fullTranscript || manualText).trim() && !isListening
              ? 'bg-primary text-white hover:bg-primary-dark'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          )}
        >
          Submit Answer
        </button>
      )}

      {/* Voice tips */}
      <div className="flex items-center justify-center gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          Tap to start
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          Tap again to stop
        </span>
      </div>
    </div>
  );
}

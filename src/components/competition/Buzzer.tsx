import { useState, useCallback, useEffect } from 'react';
import { Zap, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/utils';

interface BuzzerProps {
  isEnabled: boolean;
  onBuzz: () => void;
  buzzedSchool?: string;
  schoolColor?: string;
  disabled?: boolean;
  className?: string;
}

export function Buzzer({
  isEnabled,
  onBuzz,
  buzzedSchool,
  schoolColor,
  disabled = false,
  className,
}: BuzzerProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleBuzz = useCallback(() => {
    if (!isEnabled || disabled || buzzedSchool) return;

    setIsPressed(true);

    // Play buzz sound
    if (soundEnabled) {
      const audio = new Audio('/sounds/buzz.mp3');
      audio.play().catch(() => {}); // Ignore if sound fails
    }

    onBuzz();

    setTimeout(() => setIsPressed(false), 200);
  }, [isEnabled, disabled, buzzedSchool, soundEnabled, onBuzz]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleBuzz();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBuzz]);

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Buzzer button */}
      <button
        onClick={handleBuzz}
        disabled={!isEnabled || disabled || !!buzzedSchool}
        className={cn(
          'relative w-40 h-40 rounded-full transition-all duration-150',
          'focus:outline-none focus:ring-4 focus:ring-offset-4',
          isEnabled && !buzzedSchool && !disabled && [
            'bg-red-500 hover:bg-red-600 active:bg-red-700',
            'shadow-[0_8px_0_0_#b91c1c,0_15px_20px_-5px_rgba(0,0,0,0.3)]',
            'hover:shadow-[0_6px_0_0_#b91c1c,0_12px_15px_-5px_rgba(0,0,0,0.3)]',
            'active:shadow-[0_2px_0_0_#b91c1c,0_5px_10px_-5px_rgba(0,0,0,0.3)]',
            'active:translate-y-1.5',
            'focus:ring-red-300',
          ],
          (!isEnabled || disabled) && [
            'bg-neutral-300 cursor-not-allowed',
            'shadow-[0_4px_0_0_#9ca3af]',
          ],
          buzzedSchool && [
            'cursor-not-allowed',
            'shadow-[0_2px_0_0_#374151]',
          ],
          isPressed && 'translate-y-1.5'
        )}
        style={buzzedSchool ? { backgroundColor: schoolColor || '#6b7280' } : undefined}
      >
        <span className="absolute inset-0 flex items-center justify-center">
          <Zap
            className={cn(
              'w-16 h-16',
              isEnabled && !buzzedSchool && !disabled ? 'text-white' : 'text-neutral-500'
            )}
          />
        </span>

        {/* Pulse animation when enabled */}
        {isEnabled && !buzzedSchool && !disabled && (
          <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
        )}
      </button>

      {/* Status text */}
      <div className="text-center">
        {buzzedSchool ? (
          <p className="text-lg font-bold text-neutral-900">
            {buzzedSchool} buzzed!
          </p>
        ) : isEnabled ? (
          <p className="text-sm text-neutral-600">
            Press <kbd className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-mono">Space</kbd> or click to buzz
          </p>
        ) : (
          <p className="text-sm text-neutral-400">
            Waiting for question...
          </p>
        )}
      </div>

      {/* Sound toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="p-2 text-neutral-400 hover:text-neutral-600"
        aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
      >
        {soundEnabled ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}

// Multiple school buzzers for simulation
interface MultiBuzzerProps {
  schools: { id: string; name: string; color: string }[];
  isEnabled: boolean;
  onBuzz: (schoolId: string) => void;
  buzzedOrder: string[];
  className?: string;
}

export function MultiBuzzer({
  schools,
  isEnabled,
  onBuzz,
  buzzedOrder,
  className,
}: MultiBuzzerProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-4', className)}>
      {schools.map((school) => {
        const buzzPosition = buzzedOrder.indexOf(school.id);
        const hasBuzzed = buzzPosition !== -1;

        return (
          <div key={school.id} className="text-center">
            <button
              onClick={() => onBuzz(school.id)}
              disabled={!isEnabled || hasBuzzed}
              className={cn(
                'w-24 h-24 rounded-full transition-all duration-150 border-4',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                isEnabled && !hasBuzzed && [
                  'hover:scale-105 active:scale-95',
                  'shadow-lg hover:shadow-xl',
                ],
                !isEnabled && 'opacity-50 cursor-not-allowed',
                hasBuzzed && 'cursor-default'
              )}
              style={{
                backgroundColor: hasBuzzed ? school.color : '#f3f4f6',
                borderColor: school.color,
              }}
            >
              {hasBuzzed && (
                <span className="text-white text-2xl font-bold">
                  {buzzPosition + 1}
                </span>
              )}
            </button>
            <p className="mt-2 text-sm font-medium text-neutral-700">
              {school.name}
            </p>
            {hasBuzzed && (
              <p className="text-xs text-neutral-500">
                {buzzPosition === 0 ? '1st' : buzzPosition === 1 ? '2nd' : '3rd'}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

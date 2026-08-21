import { useCallback, useEffect, useState } from 'react';

export function useCountdown(
  initialTime: number,
  onComplete?: () => void,
): {
  time: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setTime: (time: number) => void;
} {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || time <= 0) return;

    const interval = setInterval(() => {
      setTime((previousTime) => {
        if (previousTime <= 1) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return previousTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, time, onComplete]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setTime(initialTime);
    setIsRunning(false);
  }, [initialTime]);

  return { time, isRunning, start, pause, reset, setTime };
}

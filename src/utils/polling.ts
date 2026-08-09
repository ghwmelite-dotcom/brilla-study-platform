export interface Poller {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
}

/**
 * Visibility-aware interval poller.
 * - start() is idempotent: calling it twice never creates two intervals.
 * - Pauses while document.hidden (saves battery/CPU on low-end devices).
 * - On return to visible, fires one immediate tick then resumes the interval.
 */
export function createPoller(
  callback: () => void | Promise<void>,
  intervalMs: number
): Poller {
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const tick = () => {
    // Fire-and-forget; callbacks handle their own errors
    void callback();
  };

  const arm = () => {
    if (intervalId === null) {
      intervalId = setInterval(tick, intervalMs);
    }
  };

  const disarm = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const onVisibilityChange = () => {
    if (intervalId === null && !started) return;
    if (document.hidden) {
      disarm();
    } else {
      tick(); // catch up immediately
      arm();
    }
  };

  let started = false;

  return {
    start() {
      if (started) return; // dedupe double-start
      started = true;
      document.addEventListener('visibilitychange', onVisibilityChange);
      if (!document.hidden) arm();
    },
    stop() {
      started = false;
      disarm();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    },
    isRunning() {
      return started;
    },
  };
}

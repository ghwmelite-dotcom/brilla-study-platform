import { useEffect, useRef } from 'react';
import { createPoller } from '../utils/polling';

/**
 * usePolling(callback, intervalMs, active)
 * Runs `callback` every `intervalMs` while `active` and the tab is visible.
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  active = true
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!active) return;
    const poller = createPoller(() => callbackRef.current(), intervalMs);
    poller.start();
    return () => poller.stop();
  }, [intervalMs, active]);
}

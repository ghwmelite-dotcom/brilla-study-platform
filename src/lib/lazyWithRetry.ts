import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const RELOAD_FLAG = 'brilla_chunk_reload_attempted';

/**
 * Wraps React.lazy: retries the dynamic import once, and if the chunk
 * still fails (stale deploy), force one full reload to pick up new
 * assets — guarded by sessionStorage so we never reload-loop.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (firstError) {
      try {
        return await factory();
      } catch {
        const alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG);
        if (!alreadyReloaded) {
          sessionStorage.setItem(RELOAD_FLAG, '1');
          window.location.reload();
          // Never resolves; page is reloading anyway
          return new Promise<{ default: T }>(() => {});
        }
        sessionStorage.removeItem(RELOAD_FLAG);
        throw firstError;
      }
    }
  });
}

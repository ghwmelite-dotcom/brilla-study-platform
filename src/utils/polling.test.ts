// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPoller } from './polling';

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { value: hidden, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('createPoller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setHidden(false);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ticks on the interval', () => {
    const cb = vi.fn();
    const p = createPoller(cb, 1000);
    p.start();
    vi.advanceTimersByTime(3000);
    expect(cb).toHaveBeenCalledTimes(3);
    p.stop();
  });

  it('start() is idempotent (no double interval)', () => {
    const cb = vi.fn();
    const p = createPoller(cb, 1000);
    p.start();
    p.start();
    p.start();
    vi.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(1);
    p.stop();
  });

  it('pauses while hidden and resumes with an immediate tick', () => {
    const cb = vi.fn();
    const p = createPoller(cb, 1000);
    p.start();
    vi.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(1);

    setHidden(true);
    vi.advanceTimersByTime(5000);
    expect(cb).toHaveBeenCalledTimes(1); // paused

    setHidden(false);
    expect(cb).toHaveBeenCalledTimes(2); // immediate catch-up tick
    vi.advanceTimersByTime(2000);
    expect(cb).toHaveBeenCalledTimes(4);
    p.stop();
  });

  it('stop() prevents further ticks and removes the listener', () => {
    const cb = vi.fn();
    const p = createPoller(cb, 1000);
    p.start();
    p.stop();
    vi.advanceTimersByTime(5000);
    expect(cb).not.toHaveBeenCalled();
    expect(p.isRunning()).toBe(false);
  });
});

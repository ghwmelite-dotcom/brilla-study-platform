// @vitest-environment jsdom
// Fabric object construction needs `document`; animation timing is driven by
// rAF, which vi.useFakeTimers() stubs. The canvas is a minimal stub — the
// animator only ever calls requestRenderAll() on it.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fabric from 'fabric';
import {
  animateObjectIn,
  animateStep,
  cancelAnimations,
  stepAnimationMs,
  setMotionEnabled,
} from '../whiteboardAnimator';

const stubCanvas = { requestRenderAll: () => {} } as unknown as fabric.Canvas;

function makeLine(): fabric.Line {
  return new fabric.Line([0, 0, 100, 0], { stroke: '#000', strokeWidth: 2 });
}

function makeText(): fabric.Text {
  return new fabric.Text('hello', { left: 10, top: 20, fontSize: 24 });
}

function makeRect(): fabric.Rect {
  return new fabric.Rect({ left: 50, top: 50, width: 100, height: 60, stroke: '#000' });
}

function makeArrowGroup(): fabric.Group {
  const line = new fabric.Line([0, 0, 80, 0], { stroke: '#000', strokeWidth: 2 });
  const head = new fabric.Triangle({ left: 80, top: 0, width: 15, height: 15, fill: '#000' });
  return new fabric.Group([line, head]);
}

beforeEach(() => {
  // fabric's animation loop runs on requestAnimationFrame, which vitest does
  // not fake by default — include it explicitly.
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
      'Date',
    ],
  });
  setMotionEnabled(true);
});

afterEach(() => {
  cancelAnimations();
  vi.useRealTimers();
});

describe('stepAnimationMs pacing', () => {
  it('distributes step duration across objects (n/(n+1) of the step)', () => {
    // 1 object: 600/2 = 300ms
    expect(stepAnimationMs(1, 600)).toBe(300);
    // 3 objects: 4000/4 = 1000ms each -> 3000 total
    expect(stepAnimationMs(3, 4000)).toBe(3000);
  });

  it('clamps per-object time to [150, 1200] ms', () => {
    // 2 objects: 6000/3 = 2000 -> clamped to 1200 each
    expect(stepAnimationMs(2, 6000)).toBe(2400);
    // 10 objects: 1000/11 ≈ 91 -> clamped to 150 each
    expect(stepAnimationMs(10, 1000)).toBe(1500);
  });

  it('returns 0 for no objects or when motion is disabled', () => {
    expect(stepAnimationMs(0, 5000)).toBe(0);
    setMotionEnabled(false);
    expect(stepAnimationMs(3, 5000)).toBe(0);
  });
});

describe('animateObjectIn', () => {
  it('draws a line on via strokeDashOffset and restores final state', async () => {
    const line = makeLine();
    const promise = animateObjectIn(line, stubCanvas, { durationMs: 500 });

    expect(line.strokeDashOffset).toBe(100); // hidden at start

    await vi.advanceTimersByTimeAsync(250);
    expect(line.strokeDashOffset).toBeGreaterThan(0);
    expect(line.strokeDashOffset).toBeLessThan(100);

    await vi.advanceTimersByTimeAsync(500);
    await promise;
    expect(line.strokeDashOffset).toBe(0);
    expect(line.strokeDashArray).toBeNull(); // fabric default, restored
  });

  it('fades text up from 12px below and lands on its final frame', async () => {
    const text = makeText();
    const promise = animateObjectIn(text, stubCanvas, { durationMs: 500 });

    expect(text.opacity).toBe(0);
    expect(text.top).toBe(32); // 20 + 12

    await vi.advanceTimersByTimeAsync(600);
    await promise;
    expect(text.opacity).toBe(1);
    expect(text.top).toBe(20);
  });

  it('scales shapes in from their center and restores origin/position', async () => {
    const rect = makeRect();
    const leftBefore = rect.left;
    const topBefore = rect.top;
    const originXBefore = rect.originX; // fabric 7 defaults to center/center
    const originYBefore = rect.originY;
    const promise = animateObjectIn(rect, stubCanvas, { durationMs: 500 });

    expect(rect.scaleX).toBeCloseTo(0.6);
    expect(rect.opacity).toBe(0);

    await vi.advanceTimersByTimeAsync(600);
    await promise;
    expect(rect.scaleX).toBe(1);
    expect(rect.scaleY).toBe(1);
    expect(rect.opacity).toBe(1);
    expect(rect.originX).toBe(originXBefore);
    expect(rect.originY).toBe(originYBefore);
    expect(rect.left).toBeCloseTo(leftBefore, 5);
    expect(rect.top).toBeCloseTo(topBefore, 5);
  });

  it('animates arrow groups: line child draws on, head fades in', async () => {
    const group = makeArrowGroup();
    const [line, head] = group.getObjects() as [fabric.Line, fabric.Triangle];
    const promise = animateObjectIn(group, stubCanvas, { durationMs: 500 });

    expect(line.strokeDashOffset).toBeGreaterThan(0);
    expect(head.opacity).toBe(0);

    await vi.advanceTimersByTimeAsync(600);
    await promise;
    expect(line.strokeDashOffset).toBe(0);
    expect(line.strokeDashArray).toBeNull();
    expect(head.opacity).toBe(1);
  });

  it('resolves instantly at final state when motion is disabled', async () => {
    setMotionEnabled(false);
    const text = makeText();
    await animateObjectIn(text, stubCanvas, { durationMs: 500 });
    expect(text.opacity).toBe(1);
    expect(text.top).toBe(20);
  });
});

describe('animateStep', () => {
  it('animates objects sequentially and resolves to the total pacing time', async () => {
    const objects = [makeLine(), makeText(), makeRect()];
    // 3 objects, 3000ms step -> 750ms each -> 2250 total
    const promise = animateStep(objects, stubCanvas, 3000);

    // While the first object is mid-flight, later objects are untouched.
    await vi.advanceTimersByTimeAsync(300);
    expect(objects[0].strokeDashOffset).toBeLessThan(100);
    expect(objects[1].opacity).toBe(1); // not started yet

    const totalMs = await vi.advanceTimersByTimeAsync(3000).then(() => promise);
    expect(totalMs).toBe(2250);

    // All objects reached their final state.
    expect(objects[0].strokeDashOffset).toBe(0);
    expect(objects[1].opacity).toBe(1);
    expect(objects[1].top).toBe(20);
    expect(objects[2].scaleX).toBe(1);
    expect(objects[2].opacity).toBe(1);
  });

  it('resolves immediately with 0 when motion is disabled', async () => {
    setMotionEnabled(false);
    const text = makeText();
    const totalMs = await animateStep([text], stubCanvas, 3000);
    expect(totalMs).toBe(0);
    expect(text.opacity).toBe(1);
    expect(text.top).toBe(20);
  });
});

describe('cancelAnimations', () => {
  it('jumps an in-flight object to its final state and resolves its promise', async () => {
    const text = makeText();
    const promise = animateObjectIn(text, stubCanvas, { durationMs: 500 });

    await vi.advanceTimersByTimeAsync(200);
    expect(text.opacity).toBeGreaterThan(0);
    expect(text.opacity).toBeLessThan(1);

    cancelAnimations();
    await promise;

    expect(text.opacity).toBe(1);
    expect(text.top).toBe(20);
  });

  it('stops a mid-sequence animateStep; remaining objects stay final', async () => {
    const line = makeLine();
    const text = makeText();
    const promise = animateStep([line, text], stubCanvas, 2000);

    await vi.advanceTimersByTimeAsync(150);
    expect(line.strokeDashOffset).toBeLessThan(100);
    expect(line.strokeDashOffset).toBeGreaterThan(0);

    cancelAnimations();
    const totalMs = await promise;

    // In-flight line finalized; untouched text was already final.
    expect(line.strokeDashOffset).toBe(0);
    expect(line.strokeDashArray).toBeNull();
    expect(text.opacity).toBe(1);
    expect(text.top).toBe(20);
    expect(totalMs).toBeCloseTo((2000 / 3) * 2, 5); // pacing is reported regardless of cancel

    // Nothing leaks: a later animation runs unaffected.
    const rect = makeRect();
    const followUp = animateObjectIn(rect, stubCanvas, { durationMs: 200 });
    await vi.advanceTimersByTimeAsync(300);
    await followUp;
    expect(rect.opacity).toBe(1);
  });
});

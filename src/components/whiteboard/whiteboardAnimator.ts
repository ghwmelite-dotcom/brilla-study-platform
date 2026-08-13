import * as fabric from 'fabric';

// Entrance animations for whiteboard objects during lesson playback.
// Lines/arrows draw on stroke-by-stroke (animated strokeDashOffset), text
// fades up, everything else scales in from its center. Honors
// `prefers-reduced-motion`: when the user opts out of motion, every entry
// point short-circuits to an instant, already-final render.

const MIN_OBJECT_MS = 150;
const MAX_OBJECT_MS = 1200;
const TEXT_RISE_PX = 12;
const SCALE_FROM = 0.6;

let motionEnabled = true;

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionEnabled = !mediaQuery.matches;
  mediaQuery.addEventListener?.('change', (event) => {
    motionEnabled = !event.matches;
  });
}

export function isMotionEnabled(): boolean {
  return motionEnabled;
}

// Manual/test override (e.g. a settings toggle). The media-query listener
// above keeps working and may overwrite this on system changes.
export function setMotionEnabled(enabled: boolean): void {
  motionEnabled = enabled;
}

// ---------------------------------------------------------------------------
// Final-state capture / restore
// ---------------------------------------------------------------------------

type AnimationStyle = 'line' | 'group' | 'text' | 'shape';

interface ChildFinalState {
  obj: fabric.Object;
  opacity: number;
  strokeDashArray: number[] | null | undefined;
  strokeDashOffset: number;
  // > 0 for line children (dash draw-on), 0 for everything else (fade).
  dashLen: number;
}

interface FinalState {
  style: AnimationStyle;
  opacity: number;
  top: number;
  scaleX: number;
  scaleY: number;
  strokeDashArray: number[] | null | undefined;
  strokeDashOffset: number;
  dashLen: number;
  // Shape scale-in borrows a center origin for the duration of the
  // animation; these restore the original frame afterwards.
  originX: fabric.Object['originX'];
  originY: fabric.Object['originY'];
  centerX: number;
  centerY: number;
  children: ChildFinalState[];
}

function lineLength(line: fabric.Line): number {
  const dx = ((line.x2 ?? 0) - (line.x1 ?? 0)) * (line.scaleX || 1);
  const dy = ((line.y2 ?? 0) - (line.y1 ?? 0)) * (line.scaleY || 1);
  return Math.max(Math.hypot(dx, dy), 1);
}

function captureFinalState(obj: fabric.Object): FinalState {
  const center = obj.getCenterPoint();
  const state: FinalState = {
    style: 'shape',
    opacity: obj.opacity ?? 1,
    top: obj.top ?? 0,
    scaleX: obj.scaleX ?? 1,
    scaleY: obj.scaleY ?? 1,
    strokeDashArray: obj.strokeDashArray,
    strokeDashOffset: obj.strokeDashOffset ?? 0,
    dashLen: 0,
    originX: obj.originX,
    originY: obj.originY,
    centerX: center.x,
    centerY: center.y,
    children: [],
  };

  if (obj instanceof fabric.Line) {
    state.style = 'line';
    state.dashLen = lineLength(obj);
  } else if (obj instanceof fabric.Group) {
    // Arrow groups: lines draw on, heads/other parts fade in with them.
    state.style = 'group';
    state.children = obj.getObjects().map((child) => ({
      obj: child,
      opacity: child.opacity ?? 1,
      strokeDashArray: child.strokeDashArray,
      strokeDashOffset: child.strokeDashOffset ?? 0,
      dashLen: child instanceof fabric.Line ? lineLength(child) : 0,
    }));
  } else if (obj instanceof fabric.Text) {
    state.style = 'text';
  }

  return state;
}

function applyStartState(obj: fabric.Object, state: FinalState): void {
  switch (state.style) {
    case 'line':
      obj.set({ strokeDashArray: [state.dashLen], strokeDashOffset: state.dashLen });
      break;
    case 'group':
      state.children.forEach((child) => {
        if (child.dashLen > 0) {
          child.obj.set({ strokeDashArray: [child.dashLen], strokeDashOffset: child.dashLen });
        } else {
          child.obj.set('opacity', 0);
        }
      });
      break;
    case 'text':
      obj.set({ opacity: 0, top: state.top + TEXT_RISE_PX });
      break;
    case 'shape':
      // Re-origin to the visual center so the scale-in grows from the
      // middle instead of a corner.
      obj.set({ originX: 'center', originY: 'center' });
      obj.setPositionByOrigin(new fabric.Point(state.centerX, state.centerY), 'center', 'center');
      obj.set({
        scaleX: state.scaleX * SCALE_FROM,
        scaleY: state.scaleY * SCALE_FROM,
        opacity: 0,
      });
      break;
  }
}

function applyProgress(obj: fabric.Object, state: FinalState, t: number): void {
  switch (state.style) {
    case 'line':
      obj.set('strokeDashOffset', state.dashLen * (1 - t));
      break;
    case 'group':
      state.children.forEach((child) => {
        if (child.dashLen > 0) {
          child.obj.set('strokeDashOffset', child.dashLen * (1 - t));
        } else {
          child.obj.set('opacity', child.opacity * t);
        }
      });
      break;
    case 'text':
      obj.set({ opacity: state.opacity * t, top: state.top + TEXT_RISE_PX * (1 - t) });
      break;
    case 'shape':
      obj.set({
        scaleX: state.scaleX * (SCALE_FROM + (1 - SCALE_FROM) * t),
        scaleY: state.scaleY * (SCALE_FROM + (1 - SCALE_FROM) * t),
        opacity: state.opacity * t,
      });
      break;
  }
}

function applyFinalState(obj: fabric.Object, state: FinalState): void {
  switch (state.style) {
    case 'line':
      obj.set({ strokeDashArray: state.strokeDashArray, strokeDashOffset: state.strokeDashOffset });
      break;
    case 'group':
      state.children.forEach((child) => {
        child.obj.set({
          opacity: child.opacity,
          strokeDashArray: child.strokeDashArray,
          strokeDashOffset: child.strokeDashOffset,
        });
      });
      break;
    case 'text':
      obj.set({ opacity: state.opacity, top: state.top });
      break;
    case 'shape':
      obj.set({
        scaleX: state.scaleX,
        scaleY: state.scaleY,
        opacity: state.opacity,
        originX: state.originX,
        originY: state.originY,
      });
      obj.setPositionByOrigin(new fabric.Point(state.centerX, state.centerY), 'center', 'center');
      break;
  }
  obj.setCoords();
}

// ---------------------------------------------------------------------------
// Cancellation
// ---------------------------------------------------------------------------

interface ActiveAnimation {
  abort: () => void;
  finalize: () => void;
}

const activeAnimations = new Set<ActiveAnimation>();
// Bumped on every cancelAnimations() so a mid-sequence animateStep stops
// animating its remaining objects.
let animationGeneration = 0;

// Cancel every in-flight entrance animation and jump the affected objects to
// their final state. Called on pause, manual navigation, unmount, and before
// a new step's sequence begins.
export function cancelAnimations(): void {
  animationGeneration++;
  const pending = [...activeAnimations];
  activeAnimations.clear();
  pending.forEach((entry) => {
    entry.abort();
    entry.finalize();
  });
}

// ---------------------------------------------------------------------------
// Pacing
// ---------------------------------------------------------------------------

function perObjectMs(objectCount: number, stepDurationMs: number): number {
  return Math.min(MAX_OBJECT_MS, Math.max(MIN_OBJECT_MS, stepDurationMs / (objectCount + 1)));
}

// Total wall-clock time animateStep will spend on `objectCount` objects.
// The auto-advance timer uses this so a step never advances mid-animation.
export function stepAnimationMs(objectCount: number, stepDurationMs: number): number {
  if (!motionEnabled || objectCount <= 0) return 0;
  return perObjectMs(objectCount, stepDurationMs) * objectCount;
}

// ---------------------------------------------------------------------------
// Animation entry points
// ---------------------------------------------------------------------------

function clampDuration(durationMs: number): number {
  return Math.min(MAX_OBJECT_MS, Math.max(MIN_OBJECT_MS, durationMs));
}

// Animate a single object onto the canvas. The object must already be added
// to the canvas; this drives it from its entrance state to its final state.
// Resolves when the animation completes (or immediately when motion is off).
export function animateObjectIn(
  obj: fabric.Object,
  canvas: fabric.Canvas,
  opts?: { durationMs?: number }
): Promise<void> {
  const state = captureFinalState(obj);

  if (!motionEnabled) {
    applyFinalState(obj, state);
    canvas.requestRenderAll();
    return Promise.resolve();
  }

  applyStartState(obj, state);
  canvas.requestRenderAll();

  return new Promise<void>((resolve) => {
    let settled = false;
    let animation: fabric.util.TAnimation<number> | null = null;

    const done = () => {
      if (settled) return;
      settled = true;
      activeAnimations.delete(record);
      canvas.requestRenderAll();
      resolve();
    };

    const record: ActiveAnimation = {
      abort: () => {
        animation?.abort();
        done();
      },
      finalize: () => {
        applyFinalState(obj, state);
        canvas.requestRenderAll();
      },
    };
    activeAnimations.add(record);

    animation = fabric.util.animate({
      startValue: 0,
      endValue: 1,
      duration: clampDuration(opts?.durationMs ?? 400),
      easing: fabric.util.ease.easeOutCubic,
      onChange: (t) => {
        applyProgress(obj, state, t);
        canvas.requestRenderAll();
      },
      onComplete: () => {
        applyFinalState(obj, state);
        done();
      },
    });
  });
}

// Animate a step's objects in sequence, distributing the step duration across
// them (each gets stepDurationMs / (n + 1), clamped to [150, 1200] ms).
// Resolves to the total planned animation time in ms (0 when motion is off).
// If cancelAnimations() runs mid-sequence, the in-flight object jumps to its
// final state and the remaining objects (never touched, so already final) are
// skipped.
export async function animateStep(
  objects: fabric.Object[],
  canvas: fabric.Canvas,
  stepDurationMs: number
): Promise<number> {
  // A new sequence supersedes whatever is still in flight.
  cancelAnimations();

  const totalMs = stepAnimationMs(objects.length, stepDurationMs);
  if (totalMs === 0) return 0;

  const generation = animationGeneration;
  const durationMs = perObjectMs(objects.length, stepDurationMs);
  for (const obj of objects) {
    if (generation !== animationGeneration || !motionEnabled) break;
    await animateObjectIn(obj, canvas, { durationMs });
  }
  return totalMs;
}

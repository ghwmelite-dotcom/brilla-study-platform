// @vitest-environment jsdom
// jsdom is backed by the installed `canvas` (node-canvas) package, so real
// fabric canvases — including free-draw brush rendering, toJSON and
// toDataURL — work here. Strokes are simulated by dispatching the mouse
// events fabric v7 listens for (mousedown/mousemove on the upper canvas,
// mouseup on the document).
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { StudentInkLayer, type StudentInkLayerProps } from '../StudentInkLayer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type StepKey = string | number;

interface Harness {
  container: HTMLDivElement;
  saved: Map<StepKey, string>;
  onStrokesChange: ReturnType<typeof vi.fn>;
  getSnapshotFn: () => (() => string) | null;
  getClearFn: () => (() => void) | null;
  render: (overrides?: Partial<StudentInkLayerProps>) => Promise<void>;
  unmount: () => Promise<void>;
}

function createHarness(): Harness {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  const saved = new Map<StepKey, string>();
  const onStrokesChange = vi.fn((key: StepKey, json: string) => {
    saved.set(key, json);
  });
  let snapshotFn: (() => string) | null = null;
  let clearFn: (() => void) | null = null;

  // Stand-in for the lesson canvas element the parent passes in.
  const lessonEl = document.createElement('canvas');
  lessonEl.width = 1200;
  lessonEl.height = 800;
  const lessonCtx = lessonEl.getContext('2d');
  lessonCtx?.fillRect(0, 0, 1200, 800);
  const lessonCanvasRef = { current: lessonEl };

  const baseProps: StudentInkLayerProps = {
    width: 1200,
    height: 800,
    zoom: 1,
    stepKey: 0,
    enabled: true,
    strokes: null,
    lessonCanvasRef,
    onStrokesChange,
    registerSnapshotFn: (fn) => {
      snapshotFn = fn;
    },
    registerClearFn: (fn) => {
      clearFn = fn;
    },
  };

  return {
    container,
    saved,
    onStrokesChange,
    getSnapshotFn: () => snapshotFn,
    getClearFn: () => clearFn,
    render: async (overrides = {}) => {
      await act(async () => {
        root.render(createElement(StudentInkLayer, { ...baseProps, ...overrides }));
      });
    },
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
}

// Simulates one free-draw stroke through fabric's own mouse listeners.
async function drawStroke(
  container: HTMLElement,
  from = { x: 100, y: 100 },
  to = { x: 300, y: 260 }
) {
  const upper = container.querySelector('.upper-canvas');
  expect(upper).toBeTruthy();
  const base = { bubbles: true, cancelable: true };
  await act(async () => {
    upper!.dispatchEvent(
      new MouseEvent('mousedown', { ...base, clientX: from.x, clientY: from.y, button: 0, buttons: 1 })
    );
    upper!.dispatchEvent(
      new MouseEvent('mousemove', {
        ...base,
        clientX: (from.x + to.x) / 2,
        clientY: (from.y + to.y) / 2,
        button: 0,
        buttons: 1,
      })
    );
    upper!.dispatchEvent(
      new MouseEvent('mousemove', { ...base, clientX: to.x, clientY: to.y, button: 0, buttons: 1 })
    );
    document.dispatchEvent(
      new MouseEvent('mouseup', { ...base, clientX: to.x, clientY: to.y, button: 0, buttons: 0 })
    );
  });
}

function strokeCount(json: string): number {
  return (JSON.parse(json).objects as unknown[]).length;
}

const harnesses: Harness[] = [];
function harness() {
  const h = createHarness();
  harnesses.push(h);
  return h;
}

afterEach(async () => {
  while (harnesses.length > 0) {
    await harnesses.pop()!.unmount();
  }
  vi.restoreAllMocks();
});

describe('StudentInkLayer', () => {
  it('reports each drawn stroke via onStrokesChange', async () => {
    const h = harness();
    await h.render();

    await drawStroke(h.container);

    expect(h.onStrokesChange).toHaveBeenCalled();
    const [key, json] = h.onStrokesChange.mock.calls.at(-1)! as [StepKey, string];
    expect(key).toBe(0);
    expect(strokeCount(json)).toBe(1);
  });

  it('saves outgoing strokes and restores them per step (round-trip)', async () => {
    const h = harness();
    await h.render({ stepKey: 0 });

    await drawStroke(h.container, { x: 50, y: 50 }, { x: 150, y: 150 });
    await drawStroke(h.container, { x: 200, y: 50 }, { x: 300, y: 150 });
    expect(strokeCount(h.saved.get(0)!)).toBe(2);

    // Move to step 1: outgoing step 0 must be saved; step 1 starts empty.
    await h.render({ stepKey: 1, strokes: h.saved.get(1) ?? null });
    await drawStroke(h.container, { x: 400, y: 400 }, { x: 500, y: 500 });
    expect(strokeCount(h.saved.get(1)!)).toBe(1);

    // Back to step 0 with its saved JSON, then away again — the save on the
    // way out proves the two original strokes were restored onto the canvas.
    await h.render({ stepKey: 0, strokes: h.saved.get(0) ?? null });
    await h.render({ stepKey: 1, strokes: h.saved.get(1) ?? null });

    const savesForStep0 = h.onStrokesChange.mock.calls.filter(
      ([key]: [StepKey, string]) => key === 0
    );
    const lastSave = savesForStep0.at(-1)! as [StepKey, string];
    expect(strokeCount(lastSave[1])).toBe(2);
  });

  it('undo removes exactly one stroke', async () => {
    const h = harness();
    await h.render();

    await drawStroke(h.container, { x: 50, y: 50 }, { x: 150, y: 150 });
    await drawStroke(h.container, { x: 200, y: 50 }, { x: 300, y: 150 });
    expect(strokeCount(h.saved.get(0)!)).toBe(2);

    const undoBtn = h.container.querySelector<HTMLButtonElement>('button[title="Undo last stroke"]');
    expect(undoBtn).toBeTruthy();
    await act(async () => {
      undoBtn!.click();
    });

    const [, json] = h.onStrokesChange.mock.calls.at(-1)! as [StepKey, string];
    expect(strokeCount(json)).toBe(1);
  });

  it('clear empties the canvas after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const h = harness();
    await h.render();

    await drawStroke(h.container);
    expect(strokeCount(h.saved.get(0)!)).toBe(1);

    const clearBtn = h.container.querySelector<HTMLButtonElement>('button[title="Clear all ink"]');
    expect(clearBtn).toBeTruthy();
    await act(async () => {
      clearBtn!.click();
    });

    const [, json] = h.onStrokesChange.mock.calls.at(-1)! as [StepKey, string];
    expect(strokeCount(json)).toBe(0);
  });

  it('registered clear function empties without confirmation', async () => {
    const h = harness();
    await h.render();
    await drawStroke(h.container);
    expect(strokeCount(h.saved.get(0)!)).toBe(1);

    await act(async () => {
      h.getClearFn()!();
    });

    const [, json] = h.onStrokesChange.mock.calls.at(-1)! as [StepKey, string];
    expect(strokeCount(json)).toBe(0);
  });

  it('snapshot returns a non-empty base64 PNG without the data: prefix', async () => {
    const h = harness();
    await h.render();
    await drawStroke(h.container);

    const snapshot = h.getSnapshotFn();
    expect(snapshot).toBeTruthy();
    const base64 = snapshot!();

    expect(base64.length).toBeGreaterThan(100);
    expect(base64.startsWith('data:')).toBe(false);
    expect(base64).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
  });

  it('does not intercept pointer events or show the toolbar when disabled', async () => {
    const h = harness();
    await h.render({ enabled: false });

    const layer = h.container.querySelector('[data-testid="student-ink-layer"]');
    expect(layer).toBeTruthy();
    // The drawing surface itself must not swallow clicks meant for what is
    // underneath it.
    const surface = layer!.querySelector(':scope > div');
    expect(surface!.className).toContain('pointer-events-none');
    expect(h.container.querySelector('button[title="Eraser"]')).toBeNull();

    await h.render({ enabled: true });
    expect(h.container.querySelector('button[title="Eraser"]')).toBeTruthy();
  });
});

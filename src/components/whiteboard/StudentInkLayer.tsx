import { useState, useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import { Eraser, Trash2, Undo2 } from 'lucide-react';

// Local cn — the '@/utils' barrel re-exports pdfExtractor (react-pdf), which
// crashes under jsdom; this component must stay import-clean for tests.
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface StudentInkLayerProps {
  width: number;
  height: number;
  zoom: number;
  // Identifies the lesson step the ink belongs to; changing it triggers
  // save-outgoing + load-incoming.
  stepKey: string | number;
  enabled: boolean;
  // Fabric JSON for the incoming step; null starts the step empty.
  strokes: string | null;
  // The lesson canvas element underneath (composited into snapshots).
  lessonCanvasRef: { current: HTMLCanvasElement | null };
  onStrokesChange?: (stepKey: string | number, json: string) => void;
  registerSnapshotFn?: (fn: () => string) => void;
  registerClearFn?: (fn: () => void) => void;
}

const PEN_WIDTH = 3;
const ERASER_WIDTH = 24;
// Eraser is a background-colored pen — the board is white, so the visual
// result is identical to a true eraser without the fabric eraser addon.
const ERASER_COLOR = '#ffffff';
const PEN_COLORS = [
  { name: 'Black', value: '#1e293b' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Red', value: '#dc2626' },
];

export function StudentInkLayer({
  width,
  height,
  zoom,
  stepKey,
  enabled,
  strokes,
  lessonCanvasRef,
  onStrokesChange,
  registerSnapshotFn,
  registerClearFn,
}: StudentInkLayerProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const inkCanvasRef = useRef<fabric.Canvas | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [penColor, setPenColor] = useState(PEN_COLORS[0].value);

  // Latest props, read by fabric event handlers that are bound once at
  // canvas creation time.
  const latestRef = useRef({ width, height, stepKey, lessonCanvasRef, onStrokesChange });
  latestRef.current = { width, height, stepKey, lessonCanvasRef, onStrokesChange };

  // Report the current ink JSON for the given step.
  const report = useCallback((key: string | number) => {
    const canvas = inkCanvasRef.current;
    if (!canvas) return;
    latestRef.current.onStrokesChange?.(key, JSON.stringify(canvas.toJSON()));
  }, []);

  // Create the fabric canvas once.
  useEffect(() => {
    const el = canvasElRef.current;
    if (!el) return;
    const canvas = new fabric.Canvas(el, {
      width: latestRef.current.width,
      height: latestRef.current.height,
      backgroundColor: 'transparent',
      selection: false,
      isDrawingMode: true,
      renderOnAddRemove: true,
    });
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = PEN_COLORS[0].value;
    canvas.freeDrawingBrush.width = PEN_WIDTH;
    canvas.on('path:created', () => report(latestRef.current.stepKey));
    inkCanvasRef.current = canvas;
    return () => {
      canvas.dispose();
      inkCanvasRef.current = null;
    };
  }, [report]);

  // Geometry: track the lesson canvas size/zoom (same math as the parent's
  // reflowCanvas, so the ink layer stays pixel-aligned with it).
  useEffect(() => {
    const canvas = inkCanvasRef.current;
    if (!canvas) return;
    canvas.setZoom(zoom);
    canvas.setDimensions({ width: width * zoom, height: height * zoom });
    canvas.renderAll();
  }, [width, height, zoom]);

  // Tool / enabled state -> brush config.
  useEffect(() => {
    const canvas = inkCanvasRef.current;
    const brush = canvas?.freeDrawingBrush;
    if (!canvas || !brush) return;
    canvas.isDrawingMode = enabled;
    brush.color = tool === 'eraser' ? ERASER_COLOR : penColor;
    brush.width = tool === 'eraser' ? ERASER_WIDTH : PEN_WIDTH;
  }, [enabled, tool, penColor]);

  // Per-step persistence: save the outgoing step's ink, then load the
  // incoming step's. Serialized through pendingLoadRef so a save never runs
  // before a previous restore has settled (round-trip integrity).
  const loadedStepRef = useRef(stepKey);
  const pendingLoadRef = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    const canvas = inkCanvasRef.current;
    if (!canvas) return;
    const outgoingKey = loadedStepRef.current;
    const keyChanged = outgoingKey !== stepKey;
    const incoming = strokes;
    pendingLoadRef.current = pendingLoadRef.current.then(async () => {
      if (!inkCanvasRef.current) return;
      if (keyChanged) {
        report(outgoingKey);
        loadedStepRef.current = stepKey;
      }
      canvas.clear();
      if (incoming) {
        await canvas.loadFromJSON(incoming);
      }
      canvas.renderAll();
    });
  }, [stepKey, strokes, report]);

  // Clear without confirmation (also the handle the parent registers).
  const clearInk = useCallback(() => {
    const canvas = inkCanvasRef.current;
    if (!canvas) return;
    canvas.clear();
    canvas.renderAll();
    report(latestRef.current.stepKey);
  }, [report]);

  const handleClearClick = useCallback(() => {
    if (window.confirm('Clear all your ink on this step?')) clearInk();
  }, [clearInk]);

  const handleUndo = useCallback(() => {
    const canvas = inkCanvasRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects();
    const last = objects[objects.length - 1];
    if (!last) return;
    canvas.remove(last);
    canvas.renderAll();
    report(latestRef.current.stepKey);
  }, [report]);

  // Composite snapshot: lesson canvas + ink canvas at full canvas size,
  // returned as raw base64 (no data: prefix) — the worker expects raw base64.
  const snapshotComposite = useCallback(() => {
    const canvas = inkCanvasRef.current;
    if (!canvas) return '';
    const { width: w, height: h, lessonCanvasRef: lessonRef } = latestRef.current;
    const composite = document.createElement('canvas');
    composite.width = w;
    composite.height = h;
    const ctx = composite.getContext('2d');
    if (!ctx) return '';
    const lessonEl = lessonRef.current;
    if (lessonEl) ctx.drawImage(lessonEl, 0, 0, w, h);
    ctx.drawImage(canvas.lowerCanvasEl, 0, 0, w, h);
    return composite.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
  }, []);

  // Hand the parent live snapshot/clear handles.
  useEffect(() => {
    registerSnapshotFn?.(snapshotComposite);
    registerClearFn?.(clearInk);
  }, [registerSnapshotFn, registerClearFn, snapshotComposite, clearInk]);

  return (
    <div
      data-testid="student-ink-layer"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div
        className={cn(enabled ? 'pointer-events-auto' : 'pointer-events-none')}
        style={{ width: width * zoom, height: height * zoom }}
      >
        <canvas ref={canvasElRef} />
      </div>
      {enabled && (
        <div className="pointer-events-auto absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/95 px-2 py-1 shadow-lg dark:bg-gray-900/95">
          {PEN_COLORS.map((color) => (
            <button
              key={color.value}
              title={`Pen: ${color.name}`}
              onClick={() => {
                setTool('pen');
                setPenColor(color.value);
              }}
              className={cn(
                'rounded-full p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800',
                tool === 'pen' && penColor === color.value && 'ring-2 ring-violet-500'
              )}
            >
              <span className="block h-4 w-4 rounded-full" style={{ backgroundColor: color.value }} />
            </button>
          ))}
          <button
            title="Eraser"
            onClick={() => setTool('eraser')}
            className={cn(
              'rounded-full p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800',
              tool === 'eraser' && 'bg-violet-100 dark:bg-violet-900'
            )}
          >
            <Eraser className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            title="Undo last stroke"
            onClick={handleUndo}
            className="rounded-full p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Undo2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            title="Clear all ink"
            onClick={handleClearClick}
            className="rounded-full p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Trash2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      )}
    </div>
  );
}

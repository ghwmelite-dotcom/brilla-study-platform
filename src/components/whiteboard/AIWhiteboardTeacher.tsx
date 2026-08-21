import { useState, useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Presentation,
  PenTool,
  PenLine,
  ClipboardCheck,
  HelpCircle,
  Camera,
  Calculator,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/utils';
import { renderPrimitive } from './whiteboardPrimitives';
import { validateLatex, renderLatex } from './mathUtils';
import { animateStep, cancelAnimations, stepAnimationMs } from './whiteboardAnimator';
import { prefetchTtsAudio, playTtsAudio, releaseTtsAudioCache } from '@/utils/whiteboardTts';
import { StudentInkLayer } from './StudentInkLayer';
import { downscalePhoto, type DownscaledPhoto } from './photoDownscale';

// Types matching the backend
interface WhiteboardDrawCommand {
  type: 'rect' | 'circle' | 'line' | 'arrow' | 'text' | 'path' | 'polygon' | 'group' | 'primitive' | 'math';
  id: string;
  props: {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    radius?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    path?: string;
    points?: { x: number; y: number }[];
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    textAlign?: string;
    color?: string;
    angle?: number;
    scaleX?: number;
    scaleY?: number;
    // Primitive / math commands
    name?: string;
    params?: Record<string, unknown>;
    latex?: string;
  };
}

interface WhiteboardStep {
  stepNumber: number;
  explanation: string;
  voiceOver?: string;
  duration: number;
  commands: WhiteboardDrawCommand[];
  highlights?: string[];
  clearPrevious?: boolean;
}

type LessonType = 'diagram' | 'step-by-step' | 'problem-solving' | 'concept-map';

// Phase C "Check my work": vision grading result from the worker. Annotations
// are ordinary validated draw commands with server-prefixed `annot-` ids,
// rendered as a transient layer over the lesson canvas.
interface CheckWorkAnnotation {
  type: 'circle' | 'arrow' | 'text' | 'rect';
  id: string;
  props: Record<string, unknown>;
}

interface CheckWorkResult {
  verdict: 'correct' | 'partial' | 'incorrect' | 'unknown';
  explanation: string;
  voiceOver: string;
  annotations: CheckWorkAnnotation[];
}

// Phase C "Point-and-ask": the vision answer about the tapped spot. The
// optional annotation is a circle highlighting the spot (transient layer,
// rendered as a pulsing highlight for a few seconds).
interface AskAboutResult {
  answer: string;
  annotation: CheckWorkAnnotation | null;
}

// The progressive protocol renders every lesson on the worker's fixed canvas.
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const CANVAS_BACKGROUND = '#ffffff';

// fabric objects created here carry their command id for highlight lookup
type FabricObjectWithId = fabric.Object & { customId?: string };

// Matches fabric's TextAlign union (not re-exported from the package root)
type TextAlign = 'left' | 'center' | 'right' | 'justify' | 'justify-left' | 'justify-center' | 'justify-right';

interface AIWhiteboardTeacherProps {
  // Lesson outline (step titles); null until the outline request returns.
  outline?: string[] | null;
  // Steps generated so far — steps[i] may be missing while it generates.
  steps?: WhiteboardStep[];
  totalSteps?: number;
  isLoading?: boolean;
  // True while a follow-up step is being generated in the background.
  stepLoading?: boolean;
  // Set when a step fetch failed (after the one automatic retry) — shows a
  // Retry button in the waiting state.
  stepError?: string | null;
  onRequestContent?: (lessonType: LessonType) => void;
  // Called when the renderer needs a step it doesn't have yet (prefetch).
  onNeedStep?: (stepIndex: number) => void;
  fallback?: boolean;
  // Phase C "Check my work": the parent passes the store action; the
  // component supplies the composite ink snapshot and current step index.
  onCheckWork?: (imageBase64: string, stepIndex: number) => void;
  checkWorkResult?: CheckWorkResult | null;
  checkWorkLoading?: boolean;
  // Phase C "Point-and-ask": the component supplies the composite snapshot
  // and the tapped point in 1200x800 canvas coordinates.
  onAskAboutPoint?: (imageBase64: string, x: number, y: number) => void;
  askAboutResult?: AskAboutResult | null;
  askAboutLoading?: boolean;
  // Phase C "Photo-of-paper work": the component supplies the downscaled
  // JPEG and its pixel dims (annotations come back in that space).
  onPhotoCheckWork?: (imageBase64: string, imageWidth: number, imageHeight: number, stepIndex: number) => void;
  // Clears a stale check-work result (used when a photo flow starts/ends).
  onClearCheckWork?: () => void;
  className?: string;
}

const LESSON_TYPE_INFO = {
  diagram: {
    name: 'Labeled Diagram',
    icon: Presentation,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
  },
  'step-by-step': {
    name: 'Step-by-Step',
    icon: PenTool,
    color: 'text-green-500',
    bgColor: 'bg-green-50 hover:bg-green-100',
  },
  'problem-solving': {
    name: 'Worked Example',
    icon: Calculator,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
  },
  'concept-map': {
    name: 'Concept Map',
    icon: GitBranch,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
  },
};

// Verdict banner styling for "Check my work" results. 'unknown' is the honest
// fallback (unreadable work) and stays neutral — never dressed up as a verdict.
const CHECK_WORK_BANNER: Record<CheckWorkResult['verdict'], { label: string; classes: string }> = {
  correct: {
    label: 'Correct — great work!',
    classes: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
  },
  partial: {
    label: 'Almost there',
    classes: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
  },
  incorrect: {
    label: "Let's look at this again",
    classes: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
  },
  unknown: {
    label: "Couldn't check your work",
    classes: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300',
  },
};

// Photo result annotations are in the photo's pixel space; they render as SVG
// over the preview <img> (viewBox = photo dims), not on the lesson canvas.
const annNum = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const annStr = (v: unknown, d: string) => (typeof v === 'string' && v.length > 0 ? v : d);

function PhotoAnnotationOverlay({ annotations }: { annotations: CheckWorkAnnotation[] }) {
  return (
    <>
      {annotations.map((ann) => {
        const p = ann.props;
        switch (ann.type) {
          case 'circle':
            return (
              <circle
                key={ann.id}
                cx={annNum(p.left)}
                cy={annNum(p.top)}
                r={annNum(p.radius)}
                fill="none"
                stroke={annStr(p.stroke, '#dc2626')}
                strokeWidth={5}
              />
            );
          case 'rect':
            return (
              <rect
                key={ann.id}
                x={annNum(p.left)}
                y={annNum(p.top)}
                width={annNum(p.width)}
                height={annNum(p.height)}
                fill="none"
                stroke={annStr(p.stroke, '#dc2626')}
                strokeWidth={5}
              />
            );
          case 'arrow':
            return (
              <line
                key={ann.id}
                x1={annNum(p.x1)}
                y1={annNum(p.y1)}
                x2={annNum(p.x2)}
                y2={annNum(p.y2)}
                stroke={annStr(p.stroke, '#dc2626')}
                strokeWidth={5}
                markerEnd="url(#photo-arrowhead)"
              />
            );
          case 'text':
            return (
              <text
                key={ann.id}
                x={annNum(p.left)}
                y={annNum(p.top)}
                fontSize={annNum(p.fontSize, 32)}
                fill={annStr(p.fill, '#dc2626')}
              >
                {annStr(p.text, '')}
              </text>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

export function AIWhiteboardTeacher({
  outline = null,
  steps = [],
  totalSteps = 0,
  isLoading = false,
  stepLoading = false,
  stepError = null,
  onRequestContent,
  onNeedStep,
  fallback = false,
  onCheckWork,
  checkWorkResult = null,
  checkWorkLoading = false,
  onAskAboutPoint,
  askAboutResult = null,
  askAboutLoading = false,
  onPhotoCheckWork,
  onClearCheckWork,
  className,
}: AIWhiteboardTeacherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // KaTeX math overlay: an HTML layer over the canvas (math doesn't render
  // well as fabric objects). Parallel to drawnObjectsRef, keyed by command id.
  const overlayRef = useRef<HTMLDivElement>(null);
  const overlayObjectsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);

  // Phase C: student ink layer. Ink JSON is kept per step in a ref (drawing
  // shouldn't re-render the teacher); canvasZoom mirrors the scale computed
  // by reflowCanvas so the ink layer re-syncs on every resize/fullscreen.
  // inkSnapshotRef/inkClearRef are consumed by the Phase C vision tasks.
  const [inkEnabled, setInkEnabled] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const inkByStepRef = useRef<Map<string | number, string>>(new Map());
  const inkSnapshotRef = useRef<(() => string) | null>(null);
  const inkClearRef = useRef<(() => void) | null>(null);
  // Phase C "Point-and-ask": when armed, the next tap on the canvas asks the
  // vision model about that spot; the tool disarms after one use.
  const [askArmed, setAskArmed] = useState(false);
  // Phase C "Photo-of-paper work": the downscaled photo awaiting confirmation
  // or being marked; non-null while the photo modal is open.
  const [photo, setPhoto] = useState<DownscaledPhoto | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const handleInkStrokesChange = useCallback((key: string | number, json: string) => {
    inkByStepRef.current.set(key, json);
  }, []);

  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  // Server TTS audio currently playing (null while speechSynthesis is the
  // active voice). voiceGenRef discards stale async TTS plays when the step
  // changes before the fetch resolves; isMutedRef mirrors isMuted for async
  // callbacks.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceGenRef = useRef(0);
  const isMutedRef = useRef(isMuted);
  const playTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const drawnObjectsRef = useRef<Map<string, fabric.Object>>(new Map());
  // Guards against re-speaking/re-timing a step when a prefetched future
  // step lands mid-playback (which changes the `steps` prop identity).
  const spokenStepRef = useRef(-1);
  const stepStartedAtRef = useRef(Date.now());
  // Planned entrance-animation time (ms) for the step currently on screen.
  // The auto-advance timer never fires before this elapses, so a step can't
  // advance mid-animation. animatedForStepRef guards against a stale value
  // leaking into the next step when it draws nothing new (e.g. it was
  // already drawn instantly by goToStep).
  const stepAnimMsRef = useRef(0);
  const animatedForStepRef = useRef(-1);

  // Remove all math overlay divs (mirrors canvas.clear()).
  const clearOverlay = useCallback(() => {
    overlayObjectsRef.current.forEach((el) => el.remove());
    overlayObjectsRef.current = new Map();
  }, []);

  // Re-position every math overlay div to match the canvas viewport (zoom
  // from resize/fullscreen). Runs on canvas 'after:render'.
  const syncOverlay = useCallback(() => {
    const canvas = fabricRef.current;
    const layer = overlayRef.current;
    if (!canvas || !layer || overlayObjectsRef.current.size === 0) return;

    const vpt = canvas.viewportTransform ?? [1, 0, 0, 1, 0, 0];
    const scale = vpt[0];
    const canvasRect = canvas.getElement().getBoundingClientRect();
    const layerRect = layer.getBoundingClientRect();
    const offsetX = canvasRect.left - layerRect.left;
    const offsetY = canvasRect.top - layerRect.top;

    overlayObjectsRef.current.forEach((el) => {
      const left = Number(el.dataset.left ?? 0);
      const top = Number(el.dataset.top ?? 0);
      el.style.transform = `translate(${offsetX + left * scale + vpt[4]}px, ${offsetY + top * scale + vpt[5]}px) scale(${scale})`;
    });
  }, []);

  // Render a valid `math` command into the HTML overlay layer. Returns false
  // when overlay rendering isn't possible (no layer yet, missing/invalid
  // latex) so the caller degrades to the fabric.Text fallback instead.
  const drawMath = useCallback((command: WhiteboardDrawCommand): boolean => {
    const layer = overlayRef.current;
    const latex = command.props.latex;
    if (!layer || !latex || !validateLatex(latex)) return false;

    const el = document.createElement('div');
    el.innerHTML = renderLatex(latex);
    el.style.position = 'absolute';
    el.style.left = '0';
    el.style.top = '0';
    el.style.transformOrigin = '0 0';
    el.style.pointerEvents = 'none';
    el.style.whiteSpace = 'nowrap';
    el.style.fontSize = `${command.props.fontSize ?? 28}px`;
    el.style.color = command.props.color ?? command.props.fill ?? '#000000';
    el.dataset.left = String(command.props.left ?? 0);
    el.dataset.top = String(command.props.top ?? 0);
    layer.appendChild(el);
    overlayObjectsRef.current.set(command.id, el);
    syncOverlay();
    return true;
  }, [syncOverlay]);

  // Fit the canvas to the container (zoom + dimensions). renderAll triggers
  // 'after:render', which re-syncs the math overlay positions.
  const reflowCanvas = useCallback(() => {
    if (!containerRef.current || !fabricRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight - 120; // Leave room for controls

    const scaleX = containerWidth / CANVAS_WIDTH;
    const scaleY = containerHeight / CANVAS_HEIGHT;
    const scale = Math.min(scaleX, scaleY, 1);

    fabricRef.current.setZoom(scale);
    fabricRef.current.setDimensions({
      width: CANVAS_WIDTH * scale,
      height: CANVAS_HEIGHT * scale,
    });
    fabricRef.current.renderAll();
    // Keep the student ink layer's geometry in lockstep with the canvas.
    setCanvasZoom(scale);
  }, []);

  // Initialize (or re-bind) the fabric canvas. The canvas element only exists
  // once a lesson has content — the selector and loading views return different
  // JSX — so this effect MUST re-run when content arrives; a mount-only effect
  // returns early on the selector view and leaves fabricRef null forever.
  useEffect(() => {
    const el = canvasRef.current;
    const existing = fabricRef.current;
    if (existing) {
      if (!el || existing.getElement() === el) return;
      // A view switch replaced the canvas element — re-bind to the live one.
      existing.dispose();
      fabricRef.current = null;
    }
    if (!el) return;

    const canvas = new fabric.Canvas(el, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: CANVAS_BACKGROUND,
      selection: false,
      renderOnAddRemove: true,
    });

    fabricRef.current = canvas;
    canvas.on('after:render', syncOverlay);
    reflowCanvas();
  }, [syncOverlay, reflowCanvas, steps.length, isLoading]);

  // Dispose only on unmount — the re-runs above must never wipe the canvas.
  useEffect(() => {
    return () => {
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Resize canvas to fit container
  useEffect(() => {
    reflowCanvas();
    window.addEventListener('resize', reflowCanvas);
    return () => window.removeEventListener('resize', reflowCanvas);
  }, [reflowCanvas]);

  // Keep isFullscreen in sync with the browser (covers Esc-exit, which fires
  // no resize event and would otherwise leave stale state) and reflow after
  // every transition — window resize doesn't reliably fire on all browsers
  // when entering/leaving fullscreen, so reflow explicitly (now + next frame,
  // once the fullscreen layout has settled).
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      reflowCanvas();
      requestAnimationFrame(reflowCanvas);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [reflowCanvas]);

  // Create fabric object(s) from command. Most command types produce exactly
  // one object; a `primitive` command expands into a group of objects via the
  // primitives engine. Returns an empty array when nothing should be drawn
  // (unknown/invalid command). Valid `math` commands never reach here — they
  // render in the HTML overlay via drawMath; only invalid LaTeX falls through
  // to the plain-text fallback below.
  const createObject = useCallback((command: WhiteboardDrawCommand): fabric.Object[] => {
    const { type, id, props } = command;

    if (type === 'primitive') {
      // The first object carries the bare command id so applyHighlights (exact
      // string match) still lights up the group; the rest get suffixed ids.
      const objs = renderPrimitive(props.name ?? '', props.params ?? {});
      objs.forEach((obj, i) => {
        obj.set('selectable', false);
        obj.set('evented', false);
        (obj as FabricObjectWithId).customId = i === 0 ? id : `${id}-p${i}`;
      });
      return objs;
    }

    let obj: fabric.Object | null = null;

    switch (type) {
      case 'rect':
        obj = new fabric.Rect({
          left: props.left || 0,
          top: props.top || 0,
          width: props.width || 100,
          height: props.height || 100,
          fill: props.fill || 'transparent',
          stroke: props.stroke || '#000000',
          strokeWidth: props.strokeWidth || 2,
          opacity: props.opacity || 1,
          angle: props.angle || 0,
          scaleX: props.scaleX || 1,
          scaleY: props.scaleY || 1,
        });
        break;

      case 'circle':
        obj = new fabric.Circle({
          left: props.left || 0,
          top: props.top || 0,
          radius: props.radius || 50,
          fill: props.fill || 'transparent',
          stroke: props.stroke || '#000000',
          strokeWidth: props.strokeWidth || 2,
          opacity: props.opacity || 1,
        });
        break;

      case 'line':
        obj = new fabric.Line(
          [props.x1 || 0, props.y1 || 0, props.x2 || 100, props.y2 || 100],
          {
            stroke: props.stroke || '#000000',
            strokeWidth: props.strokeWidth || 2,
            opacity: props.opacity || 1,
          }
        );
        break;

      case 'arrow': {
        // Create arrow with arrowhead
        const x1 = props.x1 || 0;
        const y1 = props.y1 || 0;
        const x2 = props.x2 || 100;
        const y2 = props.y2 || 100;
        const headlen = 15;
        const angle = Math.atan2(y2 - y1, x2 - x1);

        const line = new fabric.Line([x1, y1, x2, y2], {
          stroke: props.stroke || '#000000',
          strokeWidth: props.strokeWidth || 2,
        });

        const head = new fabric.Triangle({
          left: x2,
          top: y2,
          originX: 'center',
          originY: 'center',
          angle: (angle * 180) / Math.PI + 90,
          width: headlen,
          height: headlen,
          fill: props.stroke || '#000000',
        });

        obj = new fabric.Group([line, head], {
          opacity: props.opacity || 1,
        });
        break;
      }

      case 'text':
        obj = new fabric.Text(props.text || '', {
          left: props.left || 0,
          top: props.top || 0,
          fontSize: props.fontSize || 24,
          fontFamily: props.fontFamily || 'Inter, sans-serif',
          fontWeight: props.fontWeight || 'normal',
          fill: props.fill || '#000000',
          textAlign: (props.textAlign || 'left') as TextAlign,
          opacity: props.opacity || 1,
        });
        break;

      case 'math':
        // Fallback only: drawMath intercepts valid LaTeX before createObject
        // runs. Reaching here means invalid/missing LaTeX — degrade to plain
        // text (never crash).
        obj = new fabric.Text(props.latex || '', {
          left: props.left || 0,
          top: props.top || 0,
          fontSize: props.fontSize || 24,
          fontFamily: props.fontFamily || 'Inter, sans-serif',
          fill: props.color || props.fill || '#000000',
          opacity: props.opacity || 1,
        });
        break;

      case 'polygon':
        if (props.points && props.points.length > 0) {
          obj = new fabric.Polygon(props.points, {
            left: props.left || 0,
            top: props.top || 0,
            fill: props.fill || 'transparent',
            stroke: props.stroke || '#000000',
            strokeWidth: props.strokeWidth || 2,
            opacity: props.opacity || 1,
          });
        }
        break;

      case 'path':
        if (props.path) {
          obj = new fabric.Path(props.path, {
            left: props.left || 0,
            top: props.top || 0,
            fill: props.fill || 'transparent',
            stroke: props.stroke || '#000000',
            strokeWidth: props.strokeWidth || 2,
            opacity: props.opacity || 1,
          });
        }
        break;
    }

    if (obj) {
      obj.set('selectable', false);
      obj.set('evented', false);
      (obj as FabricObjectWithId).customId = id;
      return [obj];
    }

    return [];
  }, []);

  // Apply a step's highlight glow, clearing highlights from other objects.
  const applyHighlights = useCallback((step: WhiteboardStep) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.getObjects().forEach((obj: fabric.Object) => {
      const customId = (obj as FabricObjectWithId).customId;
      if (customId && step.highlights && step.highlights.includes(customId)) {
        obj.set('shadow', new fabric.Shadow({
          color: 'rgba(59, 130, 246, 0.5)',
          blur: 20,
          offsetX: 0,
          offsetY: 0,
        }));
      } else {
        obj.set('shadow', null);
      }
    });
  }, []);

  // Draw one command idempotently: each command id is drawn at most once,
  // whether it lands on the canvas or in the math overlay. Valid `math` goes
  // to the HTML overlay; everything else (incl. invalid math) becomes fabric
  // object(s). Returns the newly created fabric objects (empty when the
  // command was already drawn, went to the overlay, or produced nothing).
  const drawCommand = useCallback((command: WhiteboardDrawCommand): fabric.Object[] => {
    if (drawnObjectsRef.current.has(command.id) || overlayObjectsRef.current.has(command.id)) return [];
    if (command.type === 'math' && drawMath(command)) return [];
    const canvas = fabricRef.current;
    if (!canvas) return [];
    const objs = createObject(command);
    if (objs.length > 0) {
      objs.forEach((obj) => canvas.add(obj));
      drawnObjectsRef.current.set(command.id, objs[0]);
    }
    return objs;
  }, [createObject, drawMath]);

  // Remove the transient check-work annotation layer (all `annot-` prefixed
  // objects) from the lesson canvas. Annotations live in drawnObjectsRef like
  // any other command, so they must be evicted there too.
  const clearAnnotations = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    let removed = false;
    drawnObjectsRef.current.forEach((obj, id) => {
      if (id.startsWith('annot-')) {
        canvas.remove(obj);
        drawnObjectsRef.current.delete(id);
        removed = true;
      }
    });
    if (removed) canvas.renderAll();
  }, []);

  // Draw a step — idempotent: each command id is added at most once. The
  // server prefixes ids per step, so ids never collide across steps.
  // `animate` (playback only) runs the draw-on entrance animation for newly
  // created objects; manual navigation via goToStep stays instant.
  const drawStep = useCallback((stepIndex: number, opts?: { animate?: boolean }) => {
    if (!fabricRef.current) return;

    const step = steps[stepIndex];
    if (!step) return;

    const canvas = fabricRef.current;

    if (step.clearPrevious) {
      canvas.clear();
      canvas.backgroundColor = CANVAS_BACKGROUND;
      drawnObjectsRef.current = new Map();
      clearOverlay();
    }

    const newObjects: fabric.Object[] = [];
    step.commands.forEach((command) => {
      newObjects.push(...drawCommand(command));
    });

    applyHighlights(step);
    canvas.renderAll();

    if (opts?.animate) {
      if (newObjects.length > 0) {
        animatedForStepRef.current = stepIndex;
        const totalMs = stepAnimationMs(newObjects.length, step.duration * 1000);
        stepAnimMsRef.current = totalMs;
        if (totalMs > 0) {
          // Fire-and-forget: the auto-advance timer accounts for this time
          // via stepAnimMsRef, and cancelAnimations covers pause/skip/unmount.
          void animateStep(newObjects, canvas, step.duration * 1000);
        }
      } else if (animatedForStepRef.current !== stepIndex) {
        // Nothing new to draw for a step we haven't animated (e.g. goToStep
        // already drew it instantly) — no animation time to account for.
        animatedForStepRef.current = stepIndex;
        stepAnimMsRef.current = 0;
      }
      // Otherwise: idempotent re-draw of the step currently animating (a
      // prefetch landed mid-playback) — keep its pacing intact.
    }
  }, [steps, drawCommand, clearOverlay, applyHighlights]);

  // Speak the voiceover (browser fallback voice)
  const speak = useCallback((text: string) => {
    if (isMuted || !text || typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  // Speak a step's voiceover: prefer the server TTS voice (Aura 2), fall
  // back to speechSynthesis on ANY failure (non-200, network error, play()
  // rejection). Stale async plays (step changed mid-fetch) are discarded via
  // voiceGenRef.
  const speakStep = useCallback((text: string) => {
    if (isMuted || !text) return;
    const gen = ++voiceGenRef.current;
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    void (async () => {
      const audio = await playTtsAudio(text);
      if (voiceGenRef.current !== gen) {
        audio?.pause();
        return;
      }
      if (audio) {
        audioRef.current = audio;
        if (isMutedRef.current) audio.pause();
      } else {
        speak(text);
      }
    })();
  }, [isMuted, speak]);

  // Mute pauses whichever voice is active (server audio or speechSynthesis).
  useEffect(() => {
    isMutedRef.current = isMuted;
    if (isMuted) {
      audioRef.current?.pause();
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    }
  }, [isMuted]);

  // Go to a specific step. Targets beyond the generated steps are requested
  // via onNeedStep and drawn as soon as they arrive.
  const goToStep = useCallback((stepIndex: number) => {
    if (totalSteps <= 0) return;

    // Manual navigation is instant — kill any in-flight entrance animation.
    cancelAnimations();

    const clampedIndex = Math.max(0, Math.min(stepIndex, totalSteps - 1));
    if (clampedIndex >= steps.length) {
      onNeedStep?.(clampedIndex);
    }
    setCurrentStep(clampedIndex);
    stepStartedAtRef.current = Date.now();

    // Clear and redraw all generated steps up to this one
    const lastDrawable = Math.min(clampedIndex, steps.length - 1);
    if (fabricRef.current && lastDrawable >= 0) {
      fabricRef.current.clear();
      fabricRef.current.backgroundColor = CANVAS_BACKGROUND;
      drawnObjectsRef.current = new Map();
      clearOverlay();

      for (let i = 0; i <= lastDrawable; i++) {
        const step = steps[i];
        if (!step) continue;
        if (step.clearPrevious && i < lastDrawable) {
          fabricRef.current.clear();
          fabricRef.current.backgroundColor = CANVAS_BACKGROUND;
          drawnObjectsRef.current = new Map();
          clearOverlay();
        }
        step.commands.forEach(drawCommand);
      }
      applyHighlights(steps[lastDrawable]);
      fabricRef.current.renderAll();
    }

    // Speak current step
    const step = steps[clampedIndex];
    if (step?.voiceOver) {
      spokenStepRef.current = clampedIndex;
      speakStep(step.voiceOver);
      // Warm the TTS cache for the next step (fire-and-forget).
      prefetchTtsAudio(steps[clampedIndex + 1]?.voiceOver);
    }

    // Update progress
    setProgress(((clampedIndex + 1) / totalSteps) * 100);
  }, [steps, totalSteps, drawCommand, clearOverlay, applyHighlights, speakStep, onNeedStep]);

  // Phase C "Check my work": render the grading annotations onto the lesson
  // canvas as a transient layer (ordinary validated commands, `annot-` ids)
  // and speak the verdict through the same TTS path as step voiceOvers.
  // Photo results are the exception: their annotations are in photo pixel
  // space and render on the photo modal's SVG overlay instead.
  useEffect(() => {
    clearAnnotations();
    if (!checkWorkResult) return;
    if (!photo) {
      checkWorkResult.annotations.forEach((ann) => {
        drawCommand({
          ...ann,
          id: ann.id.startsWith('annot-') ? ann.id : `annot-${ann.id}`,
        } as WhiteboardDrawCommand);
      });
      fabricRef.current?.renderAll();
    }
    if (checkWorkResult.voiceOver) speakStep(checkWorkResult.voiceOver);
  }, [checkWorkResult, photo, clearAnnotations, drawCommand, speakStep]);

  // Annotations never survive a step change — they mark work on THIS step.
  useEffect(() => {
    clearAnnotations();
  }, [currentStep, clearAnnotations]);

  // Snapshot the composite (lesson + ink) canvas and hand it to the store
  // action via the parent. Disabled while a check is in flight.
  const handleCheckWork = useCallback(() => {
    const snapshot = inkSnapshotRef.current?.();
    if (!snapshot || checkWorkLoading) return;
    onCheckWork?.(snapshot, currentStep);
  }, [onCheckWork, checkWorkLoading, currentStep]);

  // Phase C "Point-and-ask": a tap on the armed canvas converts the click to
  // 1200x800 canvas coordinates (the inverse viewportTransform accounts for
  // the resize/fullscreen zoom), snapshots the composite and asks the store.
  const handleAskTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = fabricRef.current;
    if (!canvas || askAboutLoading) return;
    setAskArmed(false);
    const snapshot = inkSnapshotRef.current?.();
    if (!snapshot) return;
    const vpt = canvas.viewportTransform ?? [1, 0, 0, 1, 0, 0];
    const inv = fabric.util.invertTransform(vpt);
    const rect = canvas.getElement().getBoundingClientRect();
    const point = fabric.util.transformPoint(
      new fabric.Point(e.clientX - rect.left, e.clientY - rect.top),
      inv
    );
    const x = Math.min(CANVAS_WIDTH, Math.max(0, Math.round(point.x)));
    const y = Math.min(CANVAS_HEIGHT, Math.max(0, Math.round(point.y)));
    onAskAboutPoint?.(snapshot, x, y);
  }, [onAskAboutPoint, askAboutLoading]);

  // Point-and-ask highlight: the annotation (if any) renders as a pulsing
  // circle on the transient annot- layer for ~3s, then auto-clears.
  useEffect(() => {
    const ann = askAboutResult?.annotation;
    if (!ann) return;
    clearAnnotations();
    const objects = drawCommand({
      ...ann,
      id: ann.id.startsWith('annot-') ? ann.id : `annot-${ann.id}`,
    } as WhiteboardDrawCommand);
    const canvas = fabricRef.current;
    canvas?.renderAll();

    let cancelled = false;
    if (canvas && objects.length > 0) {
      const pulse = (to: number) => {
        if (cancelled) return;
        objects.forEach((obj) =>
          obj.animate({ opacity: to }, {
            duration: 450,
            easing: fabric.util.ease.easeInOutSine,
            onChange: () => canvas.renderAll(),
            onComplete: () => pulse(to === 1 ? 0.25 : 1),
          })
        );
      };
      pulse(0.25);
    }

    const timer = setTimeout(() => {
      cancelled = true;
      clearAnnotations();
    }, 3000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [askAboutResult, clearAnnotations, drawCommand]);

  // Phase C "Photo-of-paper work": read the picked file, downscale it
  // client-side (longest edge ≤1600, JPEG), and open the preview modal. Any
  // stale check-work result is cleared so its annotations never land on the
  // new photo.
  const handlePhotoFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    onClearCheckWork?.();
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          setPhoto(downscalePhoto(img, img.naturalWidth, img.naturalHeight));
        } catch {
          // Undecodable image — the user can pick another.
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }, [onClearCheckWork]);

  const handleUsePhoto = useCallback(() => {
    if (!photo || checkWorkLoading) return;
    onPhotoCheckWork?.(photo.base64, photo.width, photo.height, currentStep);
  }, [photo, checkWorkLoading, onPhotoCheckWork, currentStep]);

  const handleClosePhoto = useCallback(() => {
    setPhoto(null);
    onClearCheckWork?.();
  }, [onClearCheckWork]);

  const handleRetakePhoto = useCallback(() => {
    handleClosePhoto();
    photoInputRef.current?.click();
  }, [handleClosePhoto]);

  // Play animation
  const play = useCallback(() => {
    if (totalSteps === 0) return;
    if (currentStep >= totalSteps - 1) {
      goToStep(0);
    }
    setIsPlaying(true);
  }, [totalSteps, currentStep, goToStep]);

  // Pause animation
  const pause = useCallback(() => {
    setIsPlaying(false);
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
    }
    // Freeze mid-entrance objects at their final state.
    cancelAnimations();
    audioRef.current?.pause();
    if (speechRef.current) {
      window.speechSynthesis?.cancel();
    }
  }, []);

  // Draw the current step whenever it is (or becomes) available. Idempotent,
  // so prefetched steps landing mid-playback cause no visual churn. Entrance
  // animation runs only during playback; manual navigation stays instant.
  useEffect(() => {
    const step = steps[currentStep];
    if (!step) return;
    drawStep(currentStep, { animate: isPlaying });
    if (isPlaying && step.voiceOver && spokenStepRef.current !== currentStep) {
      spokenStepRef.current = currentStep;
      speakStep(step.voiceOver);
      // Warm the TTS cache for the next step (fire-and-forget).
      prefetchTtsAudio(steps[currentStep + 1]?.voiceOver);
    }
  }, [isPlaying, currentStep, steps, drawStep, speakStep]);

  // Auto-advance steps when playing. The remaining time is computed from
  // when the step started, so a prefetched step arriving mid-playback does
  // not restart the current step's timer. The step's entrance animation time
  // extends the wait so playback never advances mid-animation.
  useEffect(() => {
    if (!isPlaying) return;

    const step = steps[currentStep];
    if (!step) {
      // Waiting for this step to be generated.
      if (currentStep < totalSteps) onNeedStep?.(currentStep);
      return;
    }

    const elapsed = Date.now() - stepStartedAtRef.current;
    const stepMs = Math.max(step.duration * 1000, stepAnimMsRef.current);
    const remaining = Math.max(0, stepMs - elapsed);

    playTimeoutRef.current = setTimeout(() => {
      if (currentStep < totalSteps - 1) {
        const next = currentStep + 1;
        if (next < steps.length) {
          stepStartedAtRef.current = Date.now();
          setCurrentStep(next);
          setProgress(((next + 1) / totalSteps) * 100);
        } else {
          // Next step not ready yet — request it; when it lands this
          // effect re-runs (steps changed) and advances.
          onNeedStep?.(next);
        }
      } else {
        setIsPlaying(false);
      }
    }, remaining);

    return () => {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
    };
  }, [isPlaying, currentStep, steps, totalSteps, onNeedStep]);

  // Client-driven prefetch: always keep the next step in flight.
  useEffect(() => {
    if (steps.length > 0 && steps.length < totalSteps) {
      onNeedStep?.(steps.length);
    }
  }, [steps.length, totalSteps, onNeedStep]);

  // Cancel speech and timers on unmount (e.g. toggling back to Chat mid-sentence)
  useEffect(() => {
    const voiceGenerationRef = voiceGenRef;
    return () => {
      voiceGenerationRef.current++;
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
      cancelAnimations();
      audioRef.current?.pause();
      audioRef.current = null;
      releaseTtsAudioCache();
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    };
  }, []);

  // Toggle fullscreen. State is driven by the fullscreenchange listener (not
  // set optimistically), so a rejected/unavailable requestFullscreen leaves
  // isFullscreen untouched and the layout class never applies falsely.
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.()?.catch(() => {});
    } else {
      document.exitFullscreen?.()?.catch(() => {});
    }
  }, []);

  // Reset to beginning
  const reset = useCallback(() => {
    pause();
    goToStep(0);
  }, [pause, goToStep]);

  // A new outline means a new lesson — restart from step 0. Steps arriving
  // for the CURRENT outline must not reset playback.
  useEffect(() => {
    if (outline && steps.length > 0) {
      spokenStepRef.current = -1;
      // New lesson — previous lesson's ink is meaningless.
      inkByStepRef.current = new Map();
      goToStep(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outline]);

  const hasContent = steps.length > 0;
  const step = steps[currentStep];
  // Honest partial-lesson state: the step the user is on hasn't arrived yet.
  const waitingForStep = hasContent && (!step || stepLoading);

  // Show lesson type selector if no content
  if (!hasContent && !isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8', className)}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            AI Whiteboard Teacher
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Choose a lesson type and watch as AI creates visual explanations step-by-step
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
          {(Object.entries(LESSON_TYPE_INFO) as [LessonType, typeof LESSON_TYPE_INFO['diagram']][]).map(
            ([type, info]) => (
              <button
                key={type}
                onClick={() => onRequestContent?.(type)}
                className={cn(
                  'flex flex-col items-center p-4 rounded-xl border-2 border-transparent transition-all',
                  info.bgColor,
                  'dark:bg-gray-800 dark:hover:bg-gray-700'
                )}
              >
                <info.icon className={cn('w-8 h-8 mb-2', info.color)} />
                <span className="font-medium text-gray-900 dark:text-white">{info.name}</span>
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8', className)}>
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-violet-200 dark:border-violet-900" />
          <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
          <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-violet-500 animate-pulse" />
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400 animate-pulse">
          AI is creating your visual lesson...
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg',
        isFullscreen && 'fixed inset-0 z-50 rounded-none',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">{outline?.[currentStep] || 'AI Whiteboard Lesson'}</h3>
            <p className="text-sm text-violet-200">Step {currentStep + 1} of {totalSteps}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setInkEnabled((v) => !v);
            setAskArmed(false);
          }}
          className={cn(
            'p-2 hover:bg-white/20 rounded-lg transition-colors',
            inkEnabled && 'bg-white/30'
          )}
          title={inkEnabled ? 'Hide ink tools' : 'Draw on the whiteboard'}
        >
          <PenLine className="w-5 h-5" />
        </button>
        {inkEnabled && onCheckWork && (
          <button
            onClick={handleCheckWork}
            disabled={checkWorkLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            title="Have the AI teacher mark the work you drew"
          >
            {checkWorkLoading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <ClipboardCheck className="w-4 h-4" />
            )}
            <span>{checkWorkLoading ? 'Checking…' : 'Check my work'}</span>
          </button>
        )}
        {inkEnabled && onAskAboutPoint && (
          <button
            onClick={() => setAskArmed((v) => !v)}
            disabled={askAboutLoading}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed',
              askArmed && 'bg-white/40 ring-2 ring-white/70'
            )}
            title={askArmed ? 'Tap a spot on the whiteboard to ask about it' : 'Ask about a spot on the whiteboard'}
          >
            {askAboutLoading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <HelpCircle className="w-4 h-4" />
            )}
            <span>{askAboutLoading ? 'Asking…' : askArmed ? 'Tap a spot…' : 'Ask about this'}</span>
          </button>
        )}
        {onPhotoCheckWork && (
          <button
            onClick={() => photoInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
            title="Photograph your paper work for the AI teacher to mark"
          >
            <Camera className="w-4 h-4" />
            <span>Snap your work</span>
          </button>
        )}
        <button
          onClick={toggleFullscreen}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {fallback && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Custom visual unavailable for this lesson — showing a generic overview instead.
          </p>
        </div>
      )}

      {checkWorkResult && (
        <div className={cn('px-4 py-2 border-b', CHECK_WORK_BANNER[checkWorkResult.verdict].classes)}>
          <p className="text-sm font-medium">
            {CHECK_WORK_BANNER[checkWorkResult.verdict].label}
          </p>
        </div>
      )}

      {/* Canvas area */}
      <div className="relative flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-4 overflow-hidden">
        <canvas ref={canvasRef} className="shadow-lg rounded-lg" />
        {/* KaTeX math overlay: empty, absolutely positioned and pointer-events-none,
            so zero footprint when a lesson has no math commands. */}
        <div ref={overlayRef} className="absolute inset-0 pointer-events-none overflow-hidden" />
        {/* Student ink layer (Phase C): absolutely over the lesson canvas at
            the same effective CSS size; re-syncs via canvasZoom whenever
            reflowCanvas runs (resize/fullscreen). Only mounted in the content
            view, so ink is inert while the selector/loading views show. */}
        <StudentInkLayer
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          zoom={canvasZoom}
          stepKey={currentStep}
          enabled={inkEnabled}
          strokes={inkByStepRef.current.get(currentStep) ?? null}
          lessonCanvasRef={canvasRef}
          onStrokesChange={handleInkStrokesChange}
          registerSnapshotFn={(fn) => {
            inkSnapshotRef.current = fn;
          }}
          registerClearFn={(fn) => {
            inkClearRef.current = fn;
          }}
        />
        {/* Point-and-ask tap catcher: sits above the ink layer only while the
            "?" tool is armed, so one tap asks instead of drawing ink. */}
        {askArmed && (
          <div
            className="absolute inset-0 z-10 cursor-help"
            onClick={handleAskTap}
          />
        )}
        {waitingForStep && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {stepError && !stepLoading ? (
              <div className="flex items-center gap-3 px-4 py-2 bg-white/95 dark:bg-gray-900/95 rounded-full shadow-lg pointer-events-auto">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Couldn't prepare the next step
                </span>
                <button
                  onClick={() => onNeedStep?.(currentStep)}
                  className="text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 px-3 py-1 rounded-full transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-gray-900/90 rounded-full shadow-lg">
                <div className="w-4 h-4 rounded-full border-2 border-violet-200 dark:border-violet-900 border-t-violet-500 animate-spin" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Preparing next step…</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explanation panel */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <p className="text-gray-700 dark:text-gray-300 text-sm min-h-[2.5rem]">
          {askAboutResult?.answer ||
            checkWorkResult?.explanation ||
            step?.explanation ||
            (waitingForStep
              ? stepError && !stepLoading
                ? "Couldn't prepare the next step — tap Retry to try again."
                : 'Preparing next step…'
              : 'Loading...')}
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => goToStep(currentStep - 1)}
            disabled={currentStep === 0}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <button
            onClick={isPlaying ? pause : play}
            className="p-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 rounded-full text-white transition-all shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => goToStep(currentStep + 1)}
            disabled={currentStep >= totalSteps - 1}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => goToStep(0)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Go to start"
          >
            <SkipBack className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => goToStep(steps.length - 1)}
            disabled={steps.length <= 1}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Go to end"
          >
            <SkipForward className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Photo-of-paper work: hidden picker (camera on phones) + preview modal */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoFile}
      />
      {photo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-full overflow-auto p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Your photo</h4>
            <div className="relative">
              <img src={photo.dataUrl} alt="Your handwritten work" className="w-full rounded-lg" />
              {checkWorkResult && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox={`0 0 ${photo.width} ${photo.height}`}
                  preserveAspectRatio="none"
                >
                  <defs>
                    <marker
                      id="photo-arrowhead"
                      markerWidth="10"
                      markerHeight="10"
                      refX="8"
                      refY="3"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0,0 L0,6 L9,3 z" fill="#dc2626" />
                    </marker>
                  </defs>
                  <PhotoAnnotationOverlay annotations={checkWorkResult.annotations} />
                </svg>
              )}
            </div>

            {checkWorkLoading ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <div className="w-4 h-4 rounded-full border-2 border-violet-200 dark:border-violet-900 border-t-violet-500 animate-spin" />
                <span className="text-sm text-gray-600 dark:text-gray-300">The AI teacher is marking your photo…</span>
              </div>
            ) : checkWorkResult ? (
              <div className="mt-3">
                <div className={cn('px-3 py-2 rounded-lg border', CHECK_WORK_BANNER[checkWorkResult.verdict].classes)}>
                  <p className="text-sm font-medium">{CHECK_WORK_BANNER[checkWorkResult.verdict].label}</p>
                </div>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{checkWorkResult.explanation}</p>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={handleRetakePhoto}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Retake
                  </button>
                  <button
                    onClick={handleClosePhoto}
                    className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleRetakePhoto}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Retake
                </button>
                <button
                  onClick={handleUsePhoto}
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                >
                  Use this photo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AIWhiteboardTeacher;

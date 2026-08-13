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
  Calculator,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/utils';

// Types matching the backend
interface WhiteboardDrawCommand {
  type: 'rect' | 'circle' | 'line' | 'arrow' | 'text' | 'path' | 'polygon' | 'group';
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
    angle?: number;
    scaleX?: number;
    scaleY?: number;
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
  className,
}: AIWhiteboardTeacherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);

  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const playTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const drawnObjectsRef = useRef<Map<string, fabric.Object>>(new Map());
  // Guards against re-speaking/re-timing a step when a prefetched future
  // step lands mid-playback (which changes the `steps` prop identity).
  const spokenStepRef = useRef(-1);
  const stepStartedAtRef = useRef(Date.now());

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: CANVAS_BACKGROUND,
      selection: false,
      renderOnAddRemove: true,
    });

    fabricRef.current = canvas;

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Resize canvas to fit container
  useEffect(() => {
    const handleResize = () => {
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
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Create fabric object from command
  const createObject = useCallback((command: WhiteboardDrawCommand): fabric.Object | null => {
    const { type, id, props } = command;

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
    }

    return obj;
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

  // Draw a step — idempotent: each command id is added at most once. The
  // server prefixes ids per step, so ids never collide across steps.
  const drawStep = useCallback((stepIndex: number) => {
    if (!fabricRef.current) return;

    const step = steps[stepIndex];
    if (!step) return;

    const canvas = fabricRef.current;

    if (step.clearPrevious) {
      canvas.clear();
      canvas.backgroundColor = CANVAS_BACKGROUND;
      drawnObjectsRef.current = new Map();
    }

    step.commands.forEach((command) => {
      if (drawnObjectsRef.current.has(command.id)) return;
      const obj = createObject(command);
      if (obj) {
        canvas.add(obj);
        drawnObjectsRef.current.set(command.id, obj);
      }
    });

    applyHighlights(step);
    canvas.renderAll();
  }, [steps, createObject, applyHighlights]);

  // Speak the voiceover
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

  // Go to a specific step. Targets beyond the generated steps are requested
  // via onNeedStep and drawn as soon as they arrive.
  const goToStep = useCallback((stepIndex: number) => {
    if (totalSteps <= 0) return;

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

      for (let i = 0; i <= lastDrawable; i++) {
        const step = steps[i];
        if (!step) continue;
        if (step.clearPrevious && i < lastDrawable) {
          fabricRef.current.clear();
          fabricRef.current.backgroundColor = CANVAS_BACKGROUND;
          drawnObjectsRef.current = new Map();
        }
        step.commands.forEach((command) => {
          const obj = createObject(command);
          if (obj) {
            fabricRef.current!.add(obj);
            drawnObjectsRef.current.set(command.id, obj);
          }
        });
      }
      applyHighlights(steps[lastDrawable]);
      fabricRef.current.renderAll();
    }

    // Speak current step
    const step = steps[clampedIndex];
    if (step?.voiceOver) {
      spokenStepRef.current = clampedIndex;
      speak(step.voiceOver);
    }

    // Update progress
    setProgress(((clampedIndex + 1) / totalSteps) * 100);
  }, [steps, totalSteps, createObject, applyHighlights, speak, onNeedStep]);

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
    if (speechRef.current) {
      window.speechSynthesis?.cancel();
    }
  }, []);

  // Draw the current step whenever it is (or becomes) available. Idempotent,
  // so prefetched steps landing mid-playback cause no visual churn.
  useEffect(() => {
    const step = steps[currentStep];
    if (!step) return;
    drawStep(currentStep);
    if (isPlaying && step.voiceOver && spokenStepRef.current !== currentStep) {
      spokenStepRef.current = currentStep;
      speak(step.voiceOver);
    }
  }, [isPlaying, currentStep, steps, drawStep, speak]);

  // Auto-advance steps when playing. The remaining time is computed from
  // when the step started, so a prefetched step arriving mid-playback does
  // not restart the current step's timer.
  useEffect(() => {
    if (!isPlaying) return;

    const step = steps[currentStep];
    if (!step) {
      // Waiting for this step to be generated.
      if (currentStep < totalSteps) onNeedStep?.(currentStep);
      return;
    }

    const elapsed = Date.now() - stepStartedAtRef.current;
    const remaining = Math.max(0, step.duration * 1000 - elapsed);

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
    return () => {
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    };
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

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

      {/* Canvas area */}
      <div className="relative flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-4 overflow-hidden">
        <canvas ref={canvasRef} className="shadow-lg rounded-lg" />
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
          {step?.explanation ||
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
    </div>
  );
}

export default AIWhiteboardTeacher;

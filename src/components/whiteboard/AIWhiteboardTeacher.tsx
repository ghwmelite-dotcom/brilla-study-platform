import { useState, useEffect, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
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
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Presentation,
  PenTool,
  Calculator,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface WhiteboardTeachingContent {
  title: string;
  topic: string;
  totalDuration: number;
  canvasSize: { width: number; height: number };
  backgroundColor: string;
  steps: WhiteboardStep[];
  summary: string;
}

type LessonType = 'diagram' | 'step-by-step' | 'problem-solving' | 'concept-map';

interface AIWhiteboardTeacherProps {
  content?: WhiteboardTeachingContent;
  isLoading?: boolean;
  onRequestContent?: (lessonType: LessonType) => void;
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
  content,
  isLoading = false,
  onRequestContent,
  className,
}: AIWhiteboardTeacherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawnObjects, setDrawnObjects] = useState<Map<string, fabric.Object>>(new Map());
  const [progress, setProgress] = useState(0);

  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const playTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: content?.canvasSize.width || 1200,
      height: content?.canvasSize.height || 800,
      backgroundColor: content?.backgroundColor || '#ffffff',
      selection: false,
      renderOnAddRemove: true,
    });

    fabricRef.current = canvas;

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [content?.canvasSize, content?.backgroundColor]);

  // Resize canvas to fit container
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !fabricRef.current || !content) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight - 120; // Leave room for controls

      const scaleX = containerWidth / content.canvasSize.width;
      const scaleY = containerHeight / content.canvasSize.height;
      const scale = Math.min(scaleX, scaleY, 1);

      fabricRef.current.setZoom(scale);
      fabricRef.current.setWidth(content.canvasSize.width * scale);
      fabricRef.current.setHeight(content.canvasSize.height * scale);
      fabricRef.current.renderAll();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [content]);

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
          fontWeight: props.fontWeight as any || 'normal',
          fill: props.fill || '#000000',
          textAlign: props.textAlign as any || 'left',
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
      (obj as any).customId = id;
    }

    return obj;
  }, []);

  // Draw a step
  const drawStep = useCallback((stepIndex: number) => {
    if (!fabricRef.current || !content) return;

    const step = content.steps[stepIndex];
    if (!step) return;

    const canvas = fabricRef.current;

    // Clear canvas if needed
    if (step.clearPrevious) {
      canvas.clear();
      canvas.backgroundColor = content.backgroundColor;
      setDrawnObjects(new Map());
    }

    // Draw commands
    const newObjects = new Map(drawnObjects);
    step.commands.forEach((command) => {
      const obj = createObject(command);
      if (obj) {
        canvas.add(obj);
        newObjects.set(command.id, obj);
      }
    });
    setDrawnObjects(newObjects);

    // Highlight objects
    if (step.highlights && step.highlights.length > 0) {
      canvas.getObjects().forEach((obj) => {
        const customId = (obj as any).customId;
        if (step.highlights!.includes(customId)) {
          // Add glow effect
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
    }

    canvas.renderAll();
  }, [content, drawnObjects, createObject]);

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

  // Go to a specific step
  const goToStep = useCallback((stepIndex: number) => {
    if (!content) return;

    const clampedIndex = Math.max(0, Math.min(stepIndex, content.steps.length - 1));
    setCurrentStep(clampedIndex);

    // Clear and redraw all steps up to this one
    if (fabricRef.current) {
      fabricRef.current.clear();
      fabricRef.current.backgroundColor = content.backgroundColor;
      setDrawnObjects(new Map());

      for (let i = 0; i <= clampedIndex; i++) {
        const step = content.steps[i];
        if (step.clearPrevious && i < clampedIndex) {
          fabricRef.current.clear();
          fabricRef.current.backgroundColor = content.backgroundColor;
        }
        step.commands.forEach((command) => {
          const obj = createObject(command);
          if (obj) {
            fabricRef.current!.add(obj);
          }
        });
      }
      fabricRef.current.renderAll();
    }

    // Speak current step
    const step = content.steps[clampedIndex];
    if (step?.voiceOver) {
      speak(step.voiceOver);
    }

    // Update progress
    setProgress(((clampedIndex + 1) / content.steps.length) * 100);
  }, [content, createObject, speak]);

  // Play animation
  const play = useCallback(() => {
    if (!content || currentStep >= content.steps.length - 1) {
      if (currentStep >= content!.steps.length - 1) {
        goToStep(0);
      }
    }
    setIsPlaying(true);
  }, [content, currentStep, goToStep]);

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

  // Auto-advance steps when playing
  useEffect(() => {
    if (!isPlaying || !content) return;

    const step = content.steps[currentStep];
    if (!step) {
      setIsPlaying(false);
      return;
    }

    // Draw current step
    drawStep(currentStep);
    if (step.voiceOver) {
      speak(step.voiceOver);
    }

    // Schedule next step
    playTimeoutRef.current = setTimeout(() => {
      if (currentStep < content.steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
        setProgress(((currentStep + 2) / content.steps.length) * 100);
      } else {
        setIsPlaying(false);
      }
    }, step.duration * 1000);

    return () => {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
    };
  }, [isPlaying, currentStep, content, drawStep, speak]);

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

  // Initial draw when content changes
  useEffect(() => {
    if (content && content.steps.length > 0) {
      goToStep(0);
    }
  }, [content]);

  // Show lesson type selector if no content
  if (!content && !isLoading) {
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

  const step = content?.steps[currentStep];

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
            <h3 className="font-semibold">{content?.title}</h3>
            <p className="text-sm text-violet-200">Step {currentStep + 1} of {content?.steps.length}</p>
          </div>
        </div>
        <button
          onClick={toggleFullscreen}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-4 overflow-hidden">
        <canvas ref={canvasRef} className="shadow-lg rounded-lg" />
      </div>

      {/* Explanation panel */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <p className="text-gray-700 dark:text-gray-300 text-sm min-h-[2.5rem]">
          {step?.explanation || 'Loading...'}
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
            disabled={currentStep >= (content?.steps.length || 1) - 1}
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
            onClick={() => goToStep((content?.steps.length || 1) - 1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Go to end"
          >
            <SkipForward className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Summary (shown at end) */}
      {currentStep === (content?.steps.length || 1) - 1 && !isPlaying && content?.summary && (
        <div className="px-4 py-3 bg-violet-50 dark:bg-violet-900/20 border-t border-violet-200 dark:border-violet-800">
          <p className="text-sm text-violet-700 dark:text-violet-300">
            <strong>Summary:</strong> {content.summary}
          </p>
        </div>
      )}
    </div>
  );
}

export default AIWhiteboardTeacher;

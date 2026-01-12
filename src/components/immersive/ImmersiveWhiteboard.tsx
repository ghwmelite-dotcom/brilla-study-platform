import { useState, useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';

interface DrawingObject {
  id: string;
  type: 'path' | 'circle' | 'rect' | 'text' | 'question' | 'checkmark' | 'xmark' | 'highlight';
  objectData: string;
  timestamp: number;
}

interface ImmersiveWhiteboardProps {
  // AI Content
  aiContent?: string;
  aiDrawings?: string; // Serialized canvas state
  isAiDrawing?: boolean;

  // Student drawings
  onDrawingAdd?: (drawing: DrawingObject) => void;
  onQuestionMark?: () => void;

  className?: string;
}

// Gesture detection for special symbols
function detectGesture(path: fabric.Path): 'question' | 'checkmark' | 'xmark' | 'circle' | null {
  const pathData = path.path;
  if (!pathData || pathData.length < 3) return null;

  // Simple heuristic detection based on path characteristics
  const bounds = path.getBoundingRect();
  const aspectRatio = bounds.width / bounds.height;

  // Circle detection - aspect ratio close to 1 and closed path
  if (aspectRatio > 0.8 && aspectRatio < 1.2 && pathData.length > 10) {
    const firstPoint = pathData[0];
    const lastPoint = pathData[pathData.length - 1];
    if (firstPoint && lastPoint) {
      // Check if path is roughly circular
      return 'circle';
    }
  }

  return null;
}

export function ImmersiveWhiteboard({
  aiDrawings,
  isAiDrawing,
  onDrawingAdd,
  onQuestionMark,
  className,
}: ImmersiveWhiteboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aiCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const aiFabricRef = useRef<fabric.Canvas | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'draw' | 'highlight' | 'question' | 'check' | 'x'>('draw');
  const [showToolHint, setShowToolHint] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);

  // Colors
  const studentColor = '#10b981'; // Emerald for student
  const highlightColor = 'rgba(250, 204, 21, 0.4)'; // Yellow highlight

  // Initialize canvases
  useEffect(() => {
    if (!canvasRef.current || !aiCanvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // AI Canvas (background layer - read only)
    const aiCanvas = new fabric.Canvas(aiCanvasRef.current, {
      width,
      height,
      backgroundColor: 'transparent',
      selection: false,
      interactive: false,
    });
    aiFabricRef.current = aiCanvas;

    // Student Canvas (interactive layer)
    const studentCanvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: 'transparent',
      isDrawingMode: true,
      selection: false,
    });

    // Configure drawing brush
    studentCanvas.freeDrawingBrush = new fabric.PencilBrush(studentCanvas);
    studentCanvas.freeDrawingBrush.color = studentColor;
    studentCanvas.freeDrawingBrush.width = 3;

    fabricRef.current = studentCanvas;

    // Handle drawing complete
    studentCanvas.on('path:created', (opt) => {
      const path = opt.path as fabric.Path;
      if (!path) return;

      // Detect if this is a special gesture
      const gesture = detectGesture(path);

      if (gesture === 'circle') {
        // User drew a circle - might be highlighting something
        // Trigger question mark for AI explanation
        if (onQuestionMark) {
          onQuestionMark();
        }
      }

      // Notify parent of new drawing
      if (onDrawingAdd) {
        onDrawingAdd({
          id: crypto.randomUUID(),
          type: 'path',
          objectData: JSON.stringify(path.toJSON()),
          timestamp: Date.now(),
        });
      }
    });

    // Handle mouse events for tool hints
    studentCanvas.on('mouse:down', () => {
      setIsDrawing(true);
      setShowToolHint(false);
    });

    studentCanvas.on('mouse:up', () => {
      setIsDrawing(false);
    });

    // Handle resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      studentCanvas.setDimensions({ width: newWidth, height: newHeight });
      aiCanvas.setDimensions({ width: newWidth, height: newHeight });
      studentCanvas.renderAll();
      aiCanvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      studentCanvas.dispose();
      aiCanvas.dispose();
    };
  }, []);

  // Update brush when tool changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !canvas.freeDrawingBrush) return;

    switch (currentTool) {
      case 'draw':
        canvas.freeDrawingBrush.color = studentColor;
        canvas.freeDrawingBrush.width = 3;
        break;
      case 'highlight':
        canvas.freeDrawingBrush.color = highlightColor;
        canvas.freeDrawingBrush.width = 20;
        break;
      default:
        canvas.freeDrawingBrush.color = studentColor;
        canvas.freeDrawingBrush.width = 3;
    }
  }, [currentTool]);

  // Load AI drawings when they change
  useEffect(() => {
    const aiCanvas = aiFabricRef.current;
    if (!aiCanvas || !aiDrawings) return;

    try {
      aiCanvas.loadFromJSON(aiDrawings, () => {
        aiCanvas.renderAll();
      });
    } catch (err) {
      console.error('Failed to load AI drawings:', err);
    }
  }, [aiDrawings]);

  // Handle double-tap to add question mark
  const handleDoubleTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapTime < 300) {
      // Double tap detected - add question mark
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      let x, y;
      if ('touches' in e) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }

      addQuestionMark(x, y);
    }
    setLastTapTime(now);
  }, [lastTapTime]);

  // Add question mark at position
  const addQuestionMark = useCallback((x: number, y: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const questionMark = new fabric.Text('?', {
      left: x - 15,
      top: y - 25,
      fontSize: 48,
      fill: '#f59e0b',
      fontWeight: 'bold',
      fontFamily: 'sans-serif',
      selectable: false,
    });

    canvas.add(questionMark);
    canvas.renderAll();

    // Animate it with a simple transition
    questionMark.set('top', y - 35);
    canvas.renderAll();

    // Notify parent
    if (onQuestionMark) {
      onQuestionMark();
    }

    if (onDrawingAdd) {
      onDrawingAdd({
        id: crypto.randomUUID(),
        type: 'question',
        objectData: JSON.stringify({ x, y }),
        timestamp: Date.now(),
      });
    }
  }, [onQuestionMark, onDrawingAdd]);

  // Swipe gesture detection for tool switching
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      // Detect horizontal swipe from edge (tool switch)
      if (Math.abs(diffX) > 100 && Math.abs(diffY) < 50) {
        if (touchStartX < 50) {
          // Swipe from left edge - show tools
          setShowToolHint(true);
          setTimeout(() => setShowToolHint(false), 2000);
        }
      }

      // Detect two-finger tap (question mark)
      if (e.changedTouches.length === 2) {
        const centerX = (e.changedTouches[0].clientX + e.changedTouches[1].clientX) / 2;
        const centerY = (e.changedTouches[0].clientY + e.changedTouches[1].clientY) / 2;
        addQuestionMark(centerX, centerY);
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [addQuestionMark]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full", className)}
      onDoubleClick={handleDoubleTap as any}
      onTouchEnd={handleDoubleTap as any}
    >
      {/* AI Canvas Layer (background) */}
      <canvas
        ref={aiCanvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Student Canvas Layer (interactive) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ zIndex: 2 }}
      />

      {/* AI Drawing Indicator */}
      <AnimatePresence>
        {isAiDrawing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-violet-500/20 backdrop-blur-sm rounded-full border border-violet-400/30"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-violet-400"
            />
            <span className="text-sm text-violet-300">AI is drawing...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tool Hint Overlay */}
      <AnimatePresence>
        {showToolHint && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20"
          >
            {[
              { id: 'draw', label: 'Draw', icon: '✏️' },
              { id: 'highlight', label: 'Highlight', icon: '🖍️' },
              { id: 'question', label: 'Question', icon: '❓' },
              { id: 'check', label: 'Got it', icon: '✓' },
            ].map((tool) => (
              <button
                key={tool.id}
                onClick={() => setCurrentTool(tool.id as any)}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all",
                  currentTool === tool.id
                    ? "bg-white/20 scale-110"
                    : "bg-white/5 hover:bg-white/10"
                )}
              >
                {tool.icon}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gesture hints (shown briefly on first use) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: isDrawing ? 0 : 0.3 }}
          className="text-white/40 text-sm"
        >
          Draw anywhere • Double-tap for question • Swipe left edge for tools
        </motion.p>
      </div>
    </div>
  );
}

export default ImmersiveWhiteboard;

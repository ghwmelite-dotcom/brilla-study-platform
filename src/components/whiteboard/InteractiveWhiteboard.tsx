import { useState, useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import {
  Pencil,
  Highlighter,
  Circle,
  Square,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Hand,
  MousePointer,
  HelpCircle,
  CheckCircle,
  XCircle,
  Minus,
  Plus,
  Eye,
  EyeOff,
  Users,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/utils';

// Types
type ToolType = 'select' | 'pan' | 'pencil' | 'highlighter' | 'rectangle' | 'circle' | 'text' | 'eraser' | 'question' | 'checkmark' | 'xmark';

interface DrawingObject {
  id: string;
  userId: string;
  userName?: string;
  objectData: string; // Serialized Fabric.js object
  timestamp: number;
}

interface Participant {
  id: string;
  name: string;
  color: string;
  cursorX?: number;
  cursorY?: number;
  isDrawing?: boolean;
}

interface InteractiveWhiteboardProps {
  // AI Content (background layer)
  aiCanvasState?: string; // JSON serialized Fabric.js canvas
  aiDrawings?: DrawingObject[];

  // Collaboration
  participants?: Participant[];
  onDrawingAdd?: (drawing: DrawingObject) => void;
  onDrawingUpdate?: (drawing: DrawingObject) => void;
  onDrawingDelete?: (drawingId: string) => void;
  onCursorMove?: (x: number, y: number) => void;

  // User info
  userId: string;
  userName?: string;
  userColor?: string;

  // Settings
  readOnly?: boolean;
  showParticipantCursors?: boolean;
  className?: string;
}

const COLORS = [
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#ffffff', // White
];

const HIGHLIGHTER_COLORS = [
  'rgba(255, 255, 0, 0.4)', // Yellow
  'rgba(0, 255, 0, 0.4)',   // Green
  'rgba(0, 255, 255, 0.4)', // Cyan
  'rgba(255, 0, 255, 0.4)', // Magenta
  'rgba(255, 165, 0, 0.4)', // Orange
];

const STROKE_WIDTHS = [2, 4, 8, 12, 20];

export function InteractiveWhiteboard({
  aiCanvasState,
  participants = [],
  onDrawingAdd,
  onDrawingDelete,
  onCursorMove,
  userId,
  userName = 'You',
  userColor = '#8b5cf6',
  readOnly = false,
  showParticipantCursors = true,
  className,
}: InteractiveWhiteboardProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  // State
  const [activeTool, setActiveTool] = useState<ToolType>('pencil');
  const [activeColor, setActiveColor] = useState(userColor);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [showAiLayer, setShowAiLayer] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);

  // Initialize canvases
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create main canvas for student drawings
    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: 'transparent',
      selection: activeTool === 'select',
      isDrawingMode: activeTool === 'pencil' || activeTool === 'highlighter',
    });

    fabricRef.current = canvas;

    // Set up drawing brush
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = strokeWidth;
    }

    // Save state to history on object added/modified
    const saveHistory = () => {
      const json = JSON.stringify(canvas.toJSON());
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(json);
        return newHistory;
      });
      setHistoryIndex(prev => prev + 1);
    };

    canvas.on('object:added', saveHistory);
    canvas.on('object:modified', saveHistory);

    // Track cursor for collaboration
    canvas.on('mouse:move', (opt) => {
      if (opt.e && onCursorMove && opt.scenePoint) {
        onCursorMove(opt.scenePoint.x, opt.scenePoint.y);
      }
    });

    // Handle resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      canvas.setDimensions({ width: newWidth, height: newHeight });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  // Update canvas settings when tool changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === 'pencil' || activeTool === 'highlighter';
    canvas.selection = activeTool === 'select';

    if (canvas.freeDrawingBrush) {
      if (activeTool === 'highlighter') {
        canvas.freeDrawingBrush.color = HIGHLIGHTER_COLORS[0];
        canvas.freeDrawingBrush.width = 20;
      } else {
        canvas.freeDrawingBrush.color = activeColor;
        canvas.freeDrawingBrush.width = strokeWidth;
      }
    }
  }, [activeTool, activeColor, strokeWidth]);

  // Add shape to canvas
  const addShape = useCallback((type: 'rectangle' | 'circle' | 'question' | 'checkmark' | 'xmark' | 'text') => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const center = canvas.getVpCenter();
    let obj: fabric.Object | null = null;

    switch (type) {
      case 'rectangle':
        obj = new fabric.Rect({
          left: center.x - 50,
          top: center.y - 30,
          width: 100,
          height: 60,
          fill: 'transparent',
          stroke: activeColor,
          strokeWidth: strokeWidth,
        });
        break;

      case 'circle':
        obj = new fabric.Circle({
          left: center.x - 40,
          top: center.y - 40,
          radius: 40,
          fill: 'transparent',
          stroke: activeColor,
          strokeWidth: strokeWidth,
        });
        break;

      case 'question':
        obj = new fabric.Text('?', {
          left: center.x - 15,
          top: center.y - 25,
          fontSize: 48,
          fill: '#f59e0b',
          fontWeight: 'bold',
        });
        break;

      case 'checkmark':
        obj = new fabric.Path('M 5 15 L 15 25 L 35 5', {
          left: center.x - 20,
          top: center.y - 15,
          fill: 'transparent',
          stroke: '#10b981',
          strokeWidth: 4,
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
        });
        break;

      case 'xmark':
        obj = new fabric.Group([
          new fabric.Line([0, 0, 30, 30], { stroke: '#ef4444', strokeWidth: 4 }),
          new fabric.Line([30, 0, 0, 30], { stroke: '#ef4444', strokeWidth: 4 }),
        ], {
          left: center.x - 15,
          top: center.y - 15,
        });
        break;

      case 'text':
        const text = prompt('Enter text:');
        if (text) {
          obj = new fabric.IText(text, {
            left: center.x - 50,
            top: center.y - 15,
            fontSize: 24,
            fill: activeColor,
          });
        }
        break;
    }

    if (obj) {
      // Tag with user info
      (obj as any).userId = userId;
      (obj as any).userName = userName;
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.renderAll();

      // Notify parent
      if (onDrawingAdd) {
        onDrawingAdd({
          id: (obj as any).id || Math.random().toString(36).substr(2, 9),
          userId,
          userName,
          objectData: JSON.stringify(obj.toJSON()),
          timestamp: Date.now(),
        });
      }
    }

    setActiveTool('select');
  }, [activeColor, strokeWidth, userId, userName, onDrawingAdd]);

  // Handle tool click
  const handleToolClick = (tool: ToolType) => {
    if (readOnly) return;

    if (tool === 'rectangle' || tool === 'circle' || tool === 'question' || tool === 'checkmark' || tool === 'xmark' || tool === 'text') {
      addShape(tool);
    } else if (tool === 'eraser') {
      const canvas = fabricRef.current;
      if (canvas) {
        const activeObj = canvas.getActiveObject();
        if (activeObj) {
          canvas.remove(activeObj);
          canvas.renderAll();
          if (onDrawingDelete && (activeObj as any).id) {
            onDrawingDelete((activeObj as any).id);
          }
        }
      }
      setActiveTool('select');
    } else {
      setActiveTool(tool);
    }
  };

  // Undo
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const canvas = fabricRef.current;
    if (!canvas) return;

    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    canvas.loadFromJSON(history[newIndex], () => {
      canvas.renderAll();
    });
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const canvas = fabricRef.current;
    if (!canvas) return;

    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    canvas.loadFromJSON(history[newIndex], () => {
      canvas.renderAll();
    });
  }, [history, historyIndex]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (confirm('Clear all your drawings?')) {
      canvas.clear();
      canvas.backgroundColor = 'transparent';
      canvas.renderAll();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const ToolButton = ({ tool, icon: Icon, label }: { tool: ToolType; icon: any; label: string }) => (
    <button
      onClick={() => handleToolClick(tool)}
      disabled={readOnly}
      title={label}
      className={cn(
        "p-2 rounded-lg transition-all",
        activeTool === tool
          ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
          : "bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white",
        readOnly && "opacity-50 cursor-not-allowed"
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className={cn("relative flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-white/10 bg-slate-900/90 backdrop-blur-sm">
        {/* Left tools */}
        <div className="flex items-center gap-1">
          <ToolButton tool="select" icon={MousePointer} label="Select (V)" />
          <ToolButton tool="pan" icon={Hand} label="Pan" />
          <div className="w-px h-6 bg-white/10 mx-1" />
          <ToolButton tool="pencil" icon={Pencil} label="Draw (D)" />
          <ToolButton tool="highlighter" icon={Highlighter} label="Highlight (H)" />
          <div className="w-px h-6 bg-white/10 mx-1" />
          <ToolButton tool="rectangle" icon={Square} label="Rectangle" />
          <ToolButton tool="circle" icon={Circle} label="Circle" />
          <ToolButton tool="text" icon={Type} label="Text (T)" />
          <div className="w-px h-6 bg-white/10 mx-1" />
          <ToolButton tool="question" icon={HelpCircle} label="Question mark" />
          <ToolButton tool="checkmark" icon={CheckCircle} label="Check mark" />
          <ToolButton tool="xmark" icon={XCircle} label="X mark" />
        </div>

        {/* Center tools */}
        <div className="flex items-center gap-1">
          {/* Color picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors"
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-white/30"
                style={{ backgroundColor: activeColor }}
              />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-slate-800 rounded-lg shadow-xl border border-white/10 flex gap-1 z-50">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => {
                      setActiveColor(color);
                      setShowColorPicker(false);
                    }}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                      activeColor === color ? "border-white" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stroke width */}
          <div className="relative">
            <button
              onClick={() => setShowStrokePicker(!showStrokePicker)}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors flex items-center gap-1"
            >
              <Minus className="w-3 h-3 text-slate-400" />
              <div className="w-4 h-1 rounded-full bg-white" style={{ height: `${Math.min(strokeWidth / 2, 8)}px` }} />
              <Plus className="w-3 h-3 text-slate-400" />
            </button>
            {showStrokePicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-slate-800 rounded-lg shadow-xl border border-white/10 flex gap-2 z-50">
                {STROKE_WIDTHS.map(width => (
                  <button
                    key={width}
                    onClick={() => {
                      setStrokeWidth(width);
                      setShowStrokePicker(false);
                    }}
                    className={cn(
                      "p-2 rounded hover:bg-slate-700 transition-colors",
                      strokeWidth === width && "bg-violet-500/30"
                    )}
                  >
                    <div
                      className="w-6 rounded-full bg-white"
                      style={{ height: `${width}px` }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <ToolButton tool="eraser" icon={Eraser} label="Eraser" />
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-lg bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-lg bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 rounded-lg bg-slate-800/80 text-slate-400 hover:bg-red-500/20 hover:text-red-400"
            title="Clear canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button
            onClick={() => setShowAiLayer(!showAiLayer)}
            className={cn(
              "p-2 rounded-lg transition-colors flex items-center gap-1",
              showAiLayer
                ? "bg-violet-500/20 text-violet-400"
                : "bg-slate-800/80 text-slate-400 hover:bg-slate-700"
            )}
            title={showAiLayer ? "Hide AI layer" : "Show AI layer"}
          >
            {showAiLayer ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <Sparkles className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Canvas container */}
      <div ref={containerRef} className="flex-1 relative">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />

        {/* AI Layer (background) */}
        {showAiLayer && aiCanvasState && (
          <div className="absolute inset-0 opacity-90 pointer-events-none">
            {/* Render AI content here */}
          </div>
        )}

        {/* Student drawing canvas */}
        <canvas ref={canvasRef} className="absolute inset-0" />

        {/* Participant cursors */}
        {showParticipantCursors && participants.map(p => (
          p.cursorX !== undefined && p.cursorY !== undefined && p.id !== userId && (
            <div
              key={p.id}
              className="absolute pointer-events-none transition-all duration-75"
              style={{
                left: p.cursorX,
                top: p.cursorY,
                transform: 'translate(-2px, -2px)'
              }}
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: p.color }}
              />
              <div
                className="absolute top-4 left-2 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
                style={{ backgroundColor: p.color }}
              >
                {p.name}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Participants bar */}
      {participants.length > 0 && (
        <div className="flex items-center gap-2 p-2 border-t border-white/10 bg-slate-900/90">
          <Users className="w-4 h-4 text-slate-400" />
          <div className="flex -space-x-2">
            {participants.slice(0, 5).map(p => (
              <div
                key={p.id}
                className="w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: p.color }}
                title={p.name}
              >
                {p.name[0].toUpperCase()}
              </div>
            ))}
            {participants.length > 5 && (
              <div className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs text-white">
                +{participants.length - 5}
              </div>
            )}
          </div>
          <span className="text-xs text-slate-400 ml-2">
            {participants.length} {participants.length === 1 ? 'person' : 'people'} drawing
          </span>
        </div>
      )}
    </div>
  );
}

export default InteractiveWhiteboard;

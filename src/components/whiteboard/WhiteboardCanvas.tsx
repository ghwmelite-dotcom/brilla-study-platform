import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as fabric from 'fabric';
import { useWhiteboardStore } from '@/stores/whiteboardStore';
import type { WhiteboardToolType } from '@/types/whiteboard';

// Extend FabricObject to include custom data property
declare module 'fabric' {
  interface FabricObject {
    data?: { isGrid?: boolean };
  }
}

export interface WhiteboardCanvasRef {
  getCanvas: () => fabric.Canvas | null;
  toJSON: () => string;
  loadFromJSON: (json: string) => Promise<void>;
  toDataURL: (options?: { format?: string; quality?: number }) => string;
  clear: () => void;
  addText: (text: string, options?: Partial<fabric.IText>) => void;
}

interface WhiteboardCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  onCanvasReady?: (canvas: fabric.Canvas) => void;
  onObjectModified?: () => void;
}

const GRID_SIZE = 20;

export const WhiteboardCanvas = forwardRef<WhiteboardCanvasRef, WhiteboardCanvasProps>(
  ({ width = 1200, height = 800, className = '', onCanvasReady, onObjectModified }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const isDrawingShape = useRef(false);
    const shapeStartPoint = useRef<{ x: number; y: number } | null>(null);
    const currentShape = useRef<fabric.FabricObject | null>(null);

    const {
      activeTool,
      settings,
      showGrid,
      addToHistory,
    } = useWhiteboardStore();

    // Initialize Fabric.js canvas
    useEffect(() => {
      if (!canvasRef.current || fabricCanvasRef.current) return;

      const canvas = new fabric.Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
      });

      fabricCanvasRef.current = canvas;

      // Set default object properties
      fabric.FabricObject.prototype.transparentCorners = false;
      fabric.FabricObject.prototype.cornerColor = '#0d9488';
      fabric.FabricObject.prototype.cornerStyle = 'circle';
      fabric.FabricObject.prototype.cornerSize = 10;
      fabric.FabricObject.prototype.borderColor = '#0d9488';
      fabric.FabricObject.prototype.borderScaleFactor = 2;

      // Save initial state to history
      addToHistory(JSON.stringify(canvas.toJSON()));

      // Canvas event listeners
      canvas.on('object:modified', () => {
        addToHistory(JSON.stringify(canvas.toJSON()));
        onObjectModified?.();
      });

      canvas.on('object:added', () => {
        if (!isDrawingShape.current) {
          addToHistory(JSON.stringify(canvas.toJSON()));
          onObjectModified?.();
        }
      });

      canvas.on('path:created', () => {
        addToHistory(JSON.stringify(canvas.toJSON()));
        onObjectModified?.();
      });

      onCanvasReady?.(canvas);

      return () => {
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    }, []);

    // Handle tool changes
    useEffect(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      // Reset canvas mode
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';

      // Remove shape drawing listeners
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:up');

      switch (activeTool) {
        case 'pen':
          canvas.isDrawingMode = true;
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
          canvas.freeDrawingBrush.color = settings.strokeColor;
          canvas.freeDrawingBrush.width = settings.strokeWidth;
          break;

        case 'highlighter':
          canvas.isDrawingMode = true;
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
          canvas.freeDrawingBrush.color = settings.strokeColor + '80'; // 50% opacity
          canvas.freeDrawingBrush.width = settings.strokeWidth * 3;
          break;

        case 'eraser':
          canvas.isDrawingMode = false;
          canvas.selection = false;
          canvas.defaultCursor = 'crosshair';
          canvas.hoverCursor = 'crosshair';
          setupEraserMode(canvas);
          break;

        case 'select':
          canvas.selection = true;
          canvas.defaultCursor = 'default';
          break;

        case 'rectangle':
        case 'circle':
        case 'line':
        case 'arrow':
          canvas.selection = false;
          canvas.defaultCursor = 'crosshair';
          setupShapeDrawing(canvas, activeTool);
          break;

        case 'text':
          canvas.selection = false;
          canvas.defaultCursor = 'text';
          setupTextMode(canvas);
          break;
      }
    }, [activeTool, settings.strokeColor, settings.strokeWidth]);

    // Update brush settings when they change
    useEffect(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || !canvas.freeDrawingBrush) return;

      if (activeTool === 'pen') {
        canvas.freeDrawingBrush.color = settings.strokeColor;
        canvas.freeDrawingBrush.width = settings.strokeWidth;
      } else if (activeTool === 'highlighter') {
        canvas.freeDrawingBrush.color = settings.strokeColor + '80';
        canvas.freeDrawingBrush.width = settings.strokeWidth * 3;
      }
    }, [settings.strokeColor, settings.strokeWidth, activeTool]);

    // Draw grid when enabled
    useEffect(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      // Remove existing grid
      const existingGrid = canvas.getObjects().filter((obj) => obj.data?.isGrid);
      existingGrid.forEach((obj) => canvas.remove(obj));

      if (showGrid) {
        drawGrid(canvas, width, height);
      }

      canvas.renderAll();
    }, [showGrid, width, height]);

    const drawGrid = (canvas: fabric.Canvas, w: number, h: number) => {
      const gridLines: fabric.Line[] = [];

      // Vertical lines
      for (let i = 0; i <= w; i += GRID_SIZE) {
        const line = new fabric.Line([i, 0, i, h], {
          stroke: '#e5e7eb',
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        line.data = { isGrid: true };
        gridLines.push(line);
      }

      // Horizontal lines
      for (let i = 0; i <= h; i += GRID_SIZE) {
        const line = new fabric.Line([0, i, w, i], {
          stroke: '#e5e7eb',
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        line.data = { isGrid: true };
        gridLines.push(line);
      }

      // Add grid lines and send to back
      gridLines.forEach((line) => {
        canvas.add(line);
        canvas.sendObjectToBack(line);
      });
    };

    const setupEraserMode = (canvas: fabric.Canvas) => {
      canvas.on('mouse:down', (opt) => {
        const target = canvas.findTarget(opt.e) as unknown as fabric.FabricObject | undefined;
        if (target && !target.data?.isGrid) {
          canvas.remove(target);
          addToHistory(JSON.stringify(canvas.toJSON()));
          onObjectModified?.();
        }
      });
    };

    const setupShapeDrawing = (canvas: fabric.Canvas, tool: WhiteboardToolType) => {
      canvas.on('mouse:down', (opt) => {
        isDrawingShape.current = true;
        const pointer = canvas.getScenePoint(opt.e);
        shapeStartPoint.current = { x: pointer.x, y: pointer.y };

        let shape: fabric.FabricObject | null = null;

        switch (tool) {
          case 'rectangle':
            shape = new fabric.Rect({
              left: pointer.x,
              top: pointer.y,
              width: 0,
              height: 0,
              fill: settings.fillColor === 'transparent' ? '' : settings.fillColor,
              stroke: settings.strokeColor,
              strokeWidth: settings.strokeWidth,
              strokeUniform: true,
            });
            break;

          case 'circle':
            shape = new fabric.Ellipse({
              left: pointer.x,
              top: pointer.y,
              rx: 0,
              ry: 0,
              fill: settings.fillColor === 'transparent' ? '' : settings.fillColor,
              stroke: settings.strokeColor,
              strokeWidth: settings.strokeWidth,
              strokeUniform: true,
            });
            break;

          case 'line':
          case 'arrow':
            shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
              stroke: settings.strokeColor,
              strokeWidth: settings.strokeWidth,
              strokeUniform: true,
            });
            break;
        }

        if (shape) {
          currentShape.current = shape;
          canvas.add(shape);
        }
      });

      canvas.on('mouse:move', (opt) => {
        if (!isDrawingShape.current || !shapeStartPoint.current || !currentShape.current) return;

        const pointer = canvas.getScenePoint(opt.e);
        const startX = shapeStartPoint.current.x;
        const startY = shapeStartPoint.current.y;

        switch (tool) {
          case 'rectangle': {
            const rect = currentShape.current as fabric.Rect;
            const rectWidth = Math.abs(pointer.x - startX);
            const rectHeight = Math.abs(pointer.y - startY);
            rect.set({
              left: Math.min(startX, pointer.x),
              top: Math.min(startY, pointer.y),
              width: rectWidth,
              height: rectHeight,
            });
            break;
          }

          case 'circle': {
            const ellipse = currentShape.current as fabric.Ellipse;
            const rx = Math.abs(pointer.x - startX) / 2;
            const ry = Math.abs(pointer.y - startY) / 2;
            ellipse.set({
              left: Math.min(startX, pointer.x),
              top: Math.min(startY, pointer.y),
              rx,
              ry,
            });
            break;
          }

          case 'line':
          case 'arrow': {
            const line = currentShape.current as fabric.Line;
            line.set({
              x2: pointer.x,
              y2: pointer.y,
            });
            break;
          }
        }

        canvas.renderAll();
      });

      canvas.on('mouse:up', () => {
        if (isDrawingShape.current && currentShape.current) {
          // For arrows, add arrowhead
          if (tool === 'arrow' && currentShape.current instanceof fabric.Line) {
            addArrowhead(canvas, currentShape.current as fabric.Line);
          }

          currentShape.current.setCoords();
          addToHistory(JSON.stringify(canvas.toJSON()));
          onObjectModified?.();
        }

        isDrawingShape.current = false;
        shapeStartPoint.current = null;
        currentShape.current = null;
      });
    };

    const addArrowhead = (canvas: fabric.Canvas, line: fabric.Line) => {
      const x1 = line.x1 ?? 0;
      const y1 = line.y1 ?? 0;
      const x2 = line.x2 ?? 0;
      const y2 = line.y2 ?? 0;

      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLength = 15;
      const headAngle = Math.PI / 6;

      const arrowHead = new fabric.Polygon(
        [
          { x: x2, y: y2 },
          {
            x: x2 - headLength * Math.cos(angle - headAngle),
            y: y2 - headLength * Math.sin(angle - headAngle),
          },
          {
            x: x2 - headLength * Math.cos(angle + headAngle),
            y: y2 - headLength * Math.sin(angle + headAngle),
          },
        ],
        {
          fill: settings.strokeColor,
          stroke: settings.strokeColor,
          strokeWidth: 1,
          selectable: false,
          evented: false,
        }
      );

      // Group line and arrowhead
      const group = new fabric.Group([line, arrowHead], {
        stroke: settings.strokeColor,
        strokeWidth: settings.strokeWidth,
      });

      canvas.remove(line);
      canvas.add(group);
    };

    const setupTextMode = (canvas: fabric.Canvas) => {
      canvas.on('mouse:down', (opt) => {
        const pointer = canvas.getScenePoint(opt.e);

        const text = new fabric.IText('Type here...', {
          left: pointer.x,
          top: pointer.y,
          fontSize: settings.fontSize,
          fontFamily: settings.fontFamily,
          fill: settings.strokeColor,
          editable: true,
        });

        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();

        addToHistory(JSON.stringify(canvas.toJSON()));
        onObjectModified?.();

        // Remove listener after adding text to prevent multiple texts
        canvas.off('mouse:down');
      });
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getCanvas: () => fabricCanvasRef.current,

      toJSON: () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return '{}';

        // Filter out grid lines from JSON
        const json = canvas.toJSON();
        json.objects = json.objects?.filter((obj: { data?: { isGrid?: boolean } }) => !obj.data?.isGrid) || [];
        return JSON.stringify(json);
      },

      loadFromJSON: async (json: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        try {
          const parsed = JSON.parse(json);
          await canvas.loadFromJSON(parsed);
          canvas.renderAll();

          // Redraw grid if enabled
          if (showGrid) {
            drawGrid(canvas, width, height);
          }
        } catch (err) {
          console.error('Failed to load canvas from JSON:', err);
        }
      },

      toDataURL: (options = {}) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return '';

        // Temporarily hide grid for export
        const gridObjects = canvas.getObjects().filter((obj) => obj.data?.isGrid);
        gridObjects.forEach((obj) => (obj.visible = false));

        const dataURL = canvas.toDataURL({
          format: (options.format as 'png' | 'jpeg') || 'png',
          quality: options.quality || 1,
          multiplier: 2,
        });

        // Restore grid visibility
        gridObjects.forEach((obj) => (obj.visible = true));
        canvas.renderAll();

        return dataURL;
      },

      clear: () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        // Keep grid lines, remove everything else
        const nonGridObjects = canvas.getObjects().filter((obj) => !obj.data?.isGrid);
        nonGridObjects.forEach((obj) => canvas.remove(obj));

        addToHistory(JSON.stringify(canvas.toJSON()));
        onObjectModified?.();
      },

      addText: (text: string, options = {}) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const textObj = new fabric.IText(text, {
          left: width / 2,
          top: height / 2,
          fontSize: settings.fontSize,
          fontFamily: settings.fontFamily,
          fill: settings.strokeColor,
          originX: 'center',
          originY: 'center',
          ...options,
        });

        canvas.add(textObj);
        canvas.setActiveObject(textObj);
        addToHistory(JSON.stringify(canvas.toJSON()));
        onObjectModified?.();
      },
    }));

    // Keyboard shortcuts
    useEffect(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        // Delete selected objects
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const activeObjects = canvas.getActiveObjects();
          if (activeObjects.length > 0) {
            activeObjects.forEach((obj) => {
              if (!obj.data?.isGrid) {
                canvas.remove(obj);
              }
            });
            canvas.discardActiveObject();
            addToHistory(JSON.stringify(canvas.toJSON()));
            onObjectModified?.();
          }
        }

        // Ctrl+A: Select all
        if (e.ctrlKey && e.key === 'a') {
          e.preventDefault();
          const objects = canvas.getObjects().filter((obj) => !obj.data?.isGrid);
          const selection = new fabric.ActiveSelection(objects, { canvas });
          canvas.setActiveObject(selection);
          canvas.renderAll();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
      <div className={`relative overflow-hidden rounded-lg border border-neutral-200 bg-white ${className}`}>
        <canvas ref={canvasRef} />
      </div>
    );
  }
);

WhiteboardCanvas.displayName = 'WhiteboardCanvas';

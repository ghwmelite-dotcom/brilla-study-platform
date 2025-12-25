import {
  MousePointer2,
  Pencil,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Minus,
  MoveRight,
  Type,
  Undo2,
  Redo2,
  Trash2,
  Grid3X3,
  Download,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useWhiteboardStore } from '@/stores/whiteboardStore';
import type { WhiteboardToolType } from '@/types/whiteboard';
import { DEFAULT_COLORS, HIGHLIGHTER_COLORS, STROKE_WIDTHS } from '@/types/whiteboard';

interface WhiteboardToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface ToolButtonProps {
  tool: WhiteboardToolType;
  icon: React.ReactNode;
  label: string;
}

export function WhiteboardToolbar({
  onUndo,
  onRedo,
  onClear,
  onExport,
  onZoomIn,
  onZoomOut,
  canUndo,
  canRedo,
}: WhiteboardToolbarProps) {
  const {
    activeTool,
    setActiveTool,
    settings,
    setStrokeColor,
    setStrokeWidth,
    showGrid,
    toggleGrid,
    zoom,
  } = useWhiteboardStore();

  const ToolButton = ({ tool, icon, label }: ToolButtonProps) => (
    <button
      onClick={() => setActiveTool(tool)}
      className={`p-2.5 rounded-lg transition-all ${
        activeTool === tool
          ? 'bg-teal-100 text-teal-700 shadow-sm'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
      }`}
      title={label}
    >
      {icon}
    </button>
  );

  const ActionButton = ({
    onClick,
    icon,
    label,
    disabled = false,
    variant = 'default',
  }: {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
    variant?: 'default' | 'danger';
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2.5 rounded-lg transition-all ${
        disabled
          ? 'text-neutral-300 cursor-not-allowed'
          : variant === 'danger'
          ? 'text-neutral-600 hover:bg-red-50 hover:text-red-600'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
      }`}
      title={label}
    >
      {icon}
    </button>
  );

  const colors = activeTool === 'highlighter' ? HIGHLIGHTER_COLORS : DEFAULT_COLORS;

  return (
    <div className="bg-white border-b border-neutral-200 px-4 py-2">
      <div className="flex items-center gap-1 flex-wrap">
        {/* Selection & Drawing Tools */}
        <div className="flex items-center gap-0.5 border-r border-neutral-200 pr-3 mr-2">
          <ToolButton tool="select" icon={<MousePointer2 className="w-5 h-5" />} label="Select (V)" />
          <ToolButton tool="pen" icon={<Pencil className="w-5 h-5" />} label="Pen (P)" />
          <ToolButton tool="highlighter" icon={<Highlighter className="w-5 h-5" />} label="Highlighter (H)" />
          <ToolButton tool="eraser" icon={<Eraser className="w-5 h-5" />} label="Eraser (E)" />
        </div>

        {/* Shape Tools */}
        <div className="flex items-center gap-0.5 border-r border-neutral-200 pr-3 mr-2">
          <ToolButton tool="rectangle" icon={<Square className="w-5 h-5" />} label="Rectangle (R)" />
          <ToolButton tool="circle" icon={<Circle className="w-5 h-5" />} label="Circle (C)" />
          <ToolButton tool="line" icon={<Minus className="w-5 h-5" />} label="Line (L)" />
          <ToolButton tool="arrow" icon={<MoveRight className="w-5 h-5" />} label="Arrow (A)" />
          <ToolButton tool="text" icon={<Type className="w-5 h-5" />} label="Text (T)" />
        </div>

        {/* Color Picker */}
        <div className="flex items-center gap-1 border-r border-neutral-200 pr-3 mr-2">
          <div className="flex items-center gap-1">
            {colors.slice(0, 6).map((color) => (
              <button
                key={color}
                onClick={() => setStrokeColor(color)}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  settings.strokeColor === color
                    ? 'border-teal-500 scale-110'
                    : 'border-neutral-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            {/* More colors dropdown */}
            <div className="relative group">
              <button
                className="w-6 h-6 rounded-full border-2 border-neutral-300 bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500 hover:scale-110 transition-transform"
                title="More colors"
              />
              <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-lg border border-neutral-200 hidden group-hover:grid grid-cols-5 gap-1 z-50">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setStrokeColor(color)}
                    className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${
                      settings.strokeColor === color
                        ? 'border-teal-500 ring-2 ring-teal-200'
                        : 'border-neutral-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stroke Width */}
        <div className="flex items-center gap-1 border-r border-neutral-200 pr-3 mr-2">
          {STROKE_WIDTHS.slice(0, 4).map((width) => (
            <button
              key={width}
              onClick={() => setStrokeWidth(width)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                settings.strokeWidth === width
                  ? 'bg-teal-100 text-teal-700'
                  : 'hover:bg-neutral-100'
              }`}
              title={`${width}px`}
            >
              <div
                className="rounded-full bg-current"
                style={{ width: Math.min(width + 2, 16), height: Math.min(width + 2, 16) }}
              />
            </button>
          ))}
        </div>

        {/* Grid Toggle */}
        <div className="flex items-center gap-0.5 border-r border-neutral-200 pr-3 mr-2">
          <button
            onClick={toggleGrid}
            className={`p-2.5 rounded-lg transition-all ${
              showGrid
                ? 'bg-teal-100 text-teal-700'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
            title={showGrid ? 'Hide Grid' : 'Show Grid'}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5 border-r border-neutral-200 pr-3 mr-2">
          <ActionButton
            onClick={onUndo}
            icon={<Undo2 className="w-5 h-5" />}
            label="Undo (Ctrl+Z)"
            disabled={!canUndo}
          />
          <ActionButton
            onClick={onRedo}
            icon={<Redo2 className="w-5 h-5" />}
            label="Redo (Ctrl+Y)"
            disabled={!canRedo}
          />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5 border-r border-neutral-200 pr-3 mr-2">
          <ActionButton
            onClick={onZoomOut}
            icon={<ZoomOut className="w-5 h-5" />}
            label="Zoom Out"
          />
          <span className="px-2 text-sm text-neutral-600 font-medium min-w-[48px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <ActionButton
            onClick={onZoomIn}
            icon={<ZoomIn className="w-5 h-5" />}
            label="Zoom In"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 ml-auto">
          <ActionButton
            onClick={onClear}
            icon={<Trash2 className="w-5 h-5" />}
            label="Clear Canvas"
            variant="danger"
          />
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}

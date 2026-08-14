import { useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Undo,
  Redo,
  Type,
} from 'lucide-react';
import { cn } from '@/utils';
import { sanitizeRichTextHtml } from '@/utils/richText';

interface EssayEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minWords?: number;
  maxWords?: number;
  wordCount: number;
  disabled?: boolean;
  className?: string;
}

interface ToolbarButtonProps {
  icon: React.ElementType;
  command: string;
  value?: string;
  active?: boolean;
  disabled?: boolean;
  title: string;
}

function ToolbarButton({ icon: Icon, command, value, active, disabled, title }: ToolbarButtonProps) {
  const handleClick = () => {
    document.execCommand(command, false, value);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-2 rounded-lg transition-colors',
        active
          ? 'bg-primary text-white'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

export function EssayEditor({
  value,
  onChange,
  placeholder = 'Start writing your essay here...',
  minWords = 0,
  maxWords = 0,
  wordCount,
  disabled = false,
  className,
}: EssayEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync value to editor
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      const sanitized = sanitizeRichTextHtml(value);
      if (editorRef.current.innerHTML !== sanitized) {
        editorRef.current.innerHTML = sanitized;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  // Handle input changes
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      const sanitized = sanitizeRichTextHtml(editorRef.current.innerHTML);
      if (editorRef.current.innerHTML !== sanitized) editorRef.current.innerHTML = sanitized;
      onChange(sanitized);
    }
  }, [onChange]);

  // Handle paste - strip formatting optionally
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  // Word count status
  const getWordCountStatus = () => {
    if (maxWords > 0 && wordCount > maxWords) {
      return 'over';
    }
    if (minWords > 0 && wordCount < minWords) {
      return 'under';
    }
    return 'ok';
  };

  const wordCountStatus = getWordCountStatus();

  return (
    <div className={cn('border border-slate-200 rounded-xl overflow-hidden bg-white', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-slate-50 flex-wrap">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
          <ToolbarButton icon={Bold} command="bold" title="Bold (Ctrl+B)" disabled={disabled} />
          <ToolbarButton icon={Italic} command="italic" title="Italic (Ctrl+I)" disabled={disabled} />
          <ToolbarButton icon={Underline} command="underline" title="Underline (Ctrl+U)" disabled={disabled} />
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 px-2 border-r border-slate-200">
          <ToolbarButton icon={AlignLeft} command="justifyLeft" title="Align Left" disabled={disabled} />
          <ToolbarButton icon={AlignCenter} command="justifyCenter" title="Align Center" disabled={disabled} />
          <ToolbarButton icon={AlignRight} command="justifyRight" title="Align Right" disabled={disabled} />
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 px-2 border-r border-slate-200">
          <ToolbarButton icon={List} command="insertUnorderedList" title="Bullet List" disabled={disabled} />
          <ToolbarButton icon={ListOrdered} command="insertOrderedList" title="Numbered List" disabled={disabled} />
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 px-2">
          <ToolbarButton icon={Undo} command="undo" title="Undo (Ctrl+Z)" disabled={disabled} />
          <ToolbarButton icon={Redo} command="redo" title="Redo (Ctrl+Y)" disabled={disabled} />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Word Count */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200">
          <Type className="w-4 h-4 text-slate-400" />
          <span
            className={cn(
              'text-sm font-medium tabular-nums',
              wordCountStatus === 'over' && 'text-red-600',
              wordCountStatus === 'under' && 'text-amber-600',
              wordCountStatus === 'ok' && 'text-slate-600'
            )}
          >
            {wordCount} words
          </span>
          {(minWords > 0 || maxWords > 0) && (
            <span className="text-xs text-slate-400">
              {minWords > 0 && maxWords > 0
                ? `(${minWords}-${maxWords})`
                : minWords > 0
                ? `(min ${minWords})`
                : `(max ${maxWords})`}
            </span>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        className={cn(
          'min-h-[400px] max-h-[600px] overflow-y-auto p-6 outline-none',
          'prose prose-slate max-w-none',
          'focus:ring-2 focus:ring-primary/20',
          disabled && 'bg-slate-50 cursor-not-allowed opacity-75',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400'
        )}
        data-placeholder={placeholder}
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        }}
      />

      {/* Status Bar */}
      {(minWords > 0 || maxWords > 0) && (
        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
          {wordCountStatus === 'under' && (
            <p className="text-sm text-amber-600">
              You need at least {minWords - wordCount} more words to meet the minimum requirement.
            </p>
          )}
          {wordCountStatus === 'over' && (
            <p className="text-sm text-red-600">
              You are {wordCount - maxWords} words over the maximum limit.
            </p>
          )}
          {wordCountStatus === 'ok' && minWords > 0 && (
            <p className="text-sm text-green-600">
              Word count is within the required range.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

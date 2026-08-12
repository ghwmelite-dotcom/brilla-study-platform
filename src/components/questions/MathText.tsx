import { useMemo } from 'react';
import katex from 'katex';
import { hasLatex, extractLatex } from '@/utils';
import { escapeHtml } from '@/utils/html';

interface MathTextProps {
  text: string;
  className?: string;
  displayMode?: boolean;
}

export function MathText({ text, className = '', displayMode = false }: MathTextProps) {
  const renderedContent = useMemo(() => {
    if (!hasLatex(text)) {
      return <span className={className}>{text}</span>;
    }

    const parts = extractLatex(text);

    return (
      <span className={className}>
        {parts.map((part, index) => {
          if (!part.isLatex) {
            return <span key={index}>{part.text}</span>;
          }

          // Remove the $ delimiters
          let latex = part.text;
          const isDisplay = latex.startsWith('\\[') || latex.startsWith('$$');

          if (latex.startsWith('$') && latex.endsWith('$')) {
            latex = latex.slice(1, -1);
          } else if (latex.startsWith('\\(') && latex.endsWith('\\)')) {
            latex = latex.slice(2, -2);
          } else if (latex.startsWith('\\[') && latex.endsWith('\\]')) {
            latex = latex.slice(2, -2);
          } else if (latex.startsWith('$$') && latex.endsWith('$$')) {
            latex = latex.slice(2, -2);
          }

          try {
            const html = katex.renderToString(latex, {
              throwOnError: false,
              displayMode: isDisplay || displayMode,
              strict: false,
            });

            return (
              <span
                key={index}
                dangerouslySetInnerHTML={{ __html: html }}
                className={isDisplay ? 'block my-2' : 'inline'}
              />
            );
          } catch (error) {
            console.error('KaTeX error:', error);
            return <span key={index} className="text-red-500">{part.text}</span>;
          }
        })}
      </span>
    );
  }, [text, className, displayMode]);

  return renderedContent;
}

// Formula display component
interface FormulaProps {
  formula: string;
  className?: string;
}

// KaTeX error fallback: the formula is escaped before interpolation so a
// malformed/handler-bearing formula can never inject markup.
export function formulaFallbackHtml(formula: string): string {
  return `<span class="text-red-500">${escapeHtml(formula)}</span>`;
}

export function Formula({ formula, className = '' }: FormulaProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(formula, {
        throwOnError: false,
        displayMode: true,
        strict: false,
      });
    } catch (error) {
      console.error('KaTeX error:', error);
      return formulaFallbackHtml(formula);
    }
  }, [formula]);

  return (
    <div
      className={`overflow-x-auto py-2 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Formula list component
interface FormulaListProps {
  formulas: string[];
  className?: string;
}

export function FormulaList({ formulas, className = '' }: FormulaListProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {formulas.map((formula, index) => (
        <div
          key={index}
          className="p-3 bg-neutral-50 rounded-lg border border-neutral-200"
        >
          <Formula formula={formula} />
        </div>
      ))}
    </div>
  );
}

import { useState } from 'react';
import {
  Eye,
  EyeOff,
  BookOpen,
  Award,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/common';
import { cn } from '@/utils';

interface ModelAnswerProps {
  modelAnswer: string;
  isPremiumRequired?: boolean;
  isLocked?: boolean;
  onUnlock?: () => void;
  className?: string;
}

export function ModelAnswer({
  modelAnswer,
  isPremiumRequired = false,
  isLocked = false,
  onUnlock,
  className,
}: ModelAnswerProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(modelAnswer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isLocked && isPremiumRequired) {
    return (
      <Card className={cn('p-6 bg-gradient-to-br from-amber-50 to-orange-50', className)}>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
            <Award className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Premium Feature</h3>
          <p className="text-slate-600 mb-6 max-w-sm mx-auto">
            Upgrade to Premium to access model answers and learn from expert-written responses.
          </p>
          <Button variant="accent" onClick={onUnlock}>
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-slate-900">Model Answer</h3>
          <Badge variant="success" size="sm">
            <Award className="w-3 h-3 mr-1" />
            Expert
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {isRevealed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-slate-500"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-green-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          )}
          <Button
            variant={isRevealed ? 'outline' : 'primary'}
            size="sm"
            onClick={() => setIsRevealed(!isRevealed)}
          >
            {isRevealed ? (
              <>
                <EyeOff className="w-4 h-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1" />
                Reveal
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Warning */}
      {!isRevealed && (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900 mb-1">Before You Reveal</h4>
              <p className="text-sm text-amber-800">
                Try to write your own answer first! Viewing the model answer before attempting
                reduces the learning benefit. Use this as a reference after you've submitted.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Model Answer Content */}
      <div
        className={cn(
          'relative rounded-xl border border-slate-200 overflow-hidden transition-all duration-300',
          !isRevealed && 'max-h-32'
        )}
      >
        {/* Blur overlay when hidden */}
        {!isRevealed && (
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/95 to-white flex items-center justify-center z-10">
            <Button variant="primary" onClick={() => setIsRevealed(true)}>
              <Eye className="w-4 h-4 mr-2" />
              Click to Reveal Model Answer
            </Button>
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            'p-6 prose prose-slate max-w-none',
            !isRevealed && 'blur-sm select-none'
          )}
        >
          <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
            {modelAnswer}
          </div>
        </div>
      </div>

      {/* Tips when revealed */}
      {isRevealed && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="font-medium text-blue-900 mb-2">Study Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Compare your answer structure with the model answer</li>
            <li>• Note the key points and how they are developed</li>
            <li>• Pay attention to the introduction and conclusion techniques</li>
            <li>• Identify vocabulary and phrasing you can use in future essays</li>
          </ul>
        </div>
      )}
    </Card>
  );
}

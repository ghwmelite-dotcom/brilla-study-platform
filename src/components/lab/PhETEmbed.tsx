import { useState } from 'react';
import { Maximize2, Minimize2, ExternalLink, HelpCircle } from 'lucide-react';
import { Button, Card } from '@/components/common';
import { cn } from '@/utils';

interface PhETEmbedProps {
  simUrl: string;
  title: string;
  guidanceNotes?: string[];
}

export function PhETEmbed({ simUrl, title, guidanceNotes }: PhETEmbedProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGuidance, setShowGuidance] = useState(true);

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={cn(
      'flex flex-col',
      isFullscreen && 'fixed inset-0 z-50 bg-white'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-neutral-100 border-b">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-900">{title}</span>
          <span className="text-xs text-neutral-500">PhET Interactive Simulation</span>
        </div>
        <div className="flex items-center gap-2">
          {guidanceNotes && guidanceNotes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGuidance(!showGuidance)}
              className={cn(showGuidance && 'bg-blue-100')}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(simUrl, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Simulation Iframe */}
        <div className={cn(
          'flex-1 relative bg-black',
          isFullscreen ? 'h-screen' : 'h-[500px]'
        )}>
          <iframe
            src={simUrl}
            title={title}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>

        {/* Guidance Panel */}
        {showGuidance && guidanceNotes && guidanceNotes.length > 0 && (
          <Card className={cn(
            'w-64 shrink-0 border-l rounded-none overflow-y-auto',
            isFullscreen ? 'h-screen' : 'h-[500px]'
          )}>
            <div className="p-4">
              <h4 className="font-semibold text-neutral-900 mb-3">Guidance</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                {guidanceNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 bg-neutral-50 border-t text-center">
        <p className="text-xs text-neutral-500">
          Simulation provided by{' '}
          <a
            href="https://phet.colorado.edu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            PhET Interactive Simulations
          </a>
          , University of Colorado Boulder
        </p>
      </div>
    </div>
  );
}

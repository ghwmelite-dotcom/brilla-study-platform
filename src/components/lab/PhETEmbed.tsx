import { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, ExternalLink, HelpCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/common';
import { cn } from '@/utils';

interface PhETEmbedProps {
  simUrl: string;
  title: string;
  guidanceNotes?: string[];
}

export function PhETEmbed({ simUrl, title, guidanceNotes }: PhETEmbedProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false); // Start collapsed
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFullscreen = () => {
    if (!isFullscreen && containerRef.current) {
      // Enter browser fullscreen
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col h-full bg-white',
        isFullscreen && 'fixed inset-0 z-50'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-neutral-100 border-b shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-neutral-900 truncate text-sm">{title}</span>
          <span className="text-xs text-neutral-500 hidden sm:inline">PhET Simulation</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
            Practice mode — ungraded
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {guidanceNotes && guidanceNotes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGuidance(!showGuidance)}
              className={cn('p-1.5', showGuidance && 'bg-blue-100')}
              title="Toggle guidance notes"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(simUrl, '_blank')}
            className="p-1.5"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFullscreen}
            className="p-1.5"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
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
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Simulation Iframe */}
        <div className="flex-1 relative bg-neutral-900">
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
          <div className="w-56 lg:w-64 shrink-0 border-l bg-white overflow-y-auto">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-neutral-900 text-sm">Safety & Guidance</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGuidance(false)}
                  className="p-1 -mr-1"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <ul className="space-y-2 text-sm text-neutral-600">
                {guidanceNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                      {idx + 1}
                    </span>
                    <span className="text-xs leading-relaxed">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 bg-neutral-50 border-t text-center shrink-0">
        <p className="text-xs text-neutral-500">
          Powered by{' '}
          <a
            href="https://phet.colorado.edu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            PhET Interactive Simulations
          </a>
          {' '}© University of Colorado Boulder
        </p>
      </div>
    </div>
  );
}

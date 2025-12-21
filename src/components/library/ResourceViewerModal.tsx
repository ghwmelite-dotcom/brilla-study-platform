import { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Video,
  Headphones,
  File,
  Gamepad2,
  ExternalLink,
  Star,
  Download,
  Share2,
  BookmarkPlus,
  BookmarkCheck,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from '@/utils';
import { Button } from '@/components/common';
import { PDFViewer } from './PDFViewer';
import type { LibraryResource, ResourceType } from '@/types';

interface ResourceViewerModalProps {
  resource: LibraryResource | null;
  isOpen: boolean;
  onClose: () => void;
  onBookmark?: (resource: LibraryResource) => void;
  onRate?: (resource: LibraryResource, rating: number) => void;
  onDownload?: (resource: LibraryResource) => void;
}

const typeIcons: Record<ResourceType, React.ElementType> = {
  pdf: FileText,
  video: Video,
  audio: Headphones,
  document: File,
  interactive: Gamepad2,
  link: ExternalLink,
};

const typeColors: Record<ResourceType, string> = {
  pdf: 'bg-red-100 text-red-600 border-red-200',
  video: 'bg-purple-100 text-purple-600 border-purple-200',
  audio: 'bg-green-100 text-green-600 border-green-200',
  document: 'bg-blue-100 text-blue-600 border-blue-200',
  interactive: 'bg-amber-100 text-amber-600 border-amber-200',
  link: 'bg-gray-100 text-gray-600 border-gray-200',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}min`;
}

export function ResourceViewerModal({
  resource,
  isOpen,
  onClose,
  onBookmark,
  onRate,
  onDownload,
}: ResourceViewerModalProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (resource) {
      setIsBookmarked(resource.isBookmarked || false);
    }
  }, [resource]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, isFullscreen, onClose]);

  if (!isOpen || !resource) return null;

  const Icon = typeIcons[resource.resourceType];
  const typeColor = typeColors[resource.resourceType];

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.(resource);
  };

  const handleRate = (rating: number) => {
    setUserRating(rating);
    onRate?.(resource, rating);
  };

  const handleDownload = () => {
    onDownload?.(resource);
    // Open in new tab for download
    window.open(resource.contentUrl, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: resource.title,
        text: resource.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const renderContent = () => {
    switch (resource.resourceType) {
      case 'pdf':
        return (
          <div className={cn('flex-1 overflow-hidden', isFullscreen ? 'fixed inset-0 z-50 bg-black' : '')}>
            <PDFViewer
              url={resource.contentUrl}
              title={resource.title}
              onProgress={setProgress}
              onDownload={handleDownload}
              className="h-full"
            />
          </div>
        );

      case 'video':
        return (
          <div className={cn('flex-1 bg-black flex items-center justify-center', isFullscreen && 'fixed inset-0 z-50')}>
            <video
              src={resource.contentUrl}
              controls
              className="max-w-full max-h-full"
              onTimeUpdate={(e) => {
                const video = e.target as HTMLVideoElement;
                if (video.duration) {
                  setProgress((video.currentTime / video.duration) * 100);
                }
              }}
            >
              Your browser does not support video playback.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-8">
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-2xl mb-8">
              <Headphones className="w-24 h-24 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">{resource.title}</h3>
            <audio
              src={resource.contentUrl}
              controls
              className="w-full max-w-md"
              onTimeUpdate={(e) => {
                const audio = e.target as HTMLAudioElement;
                if (audio.duration) {
                  setProgress((audio.currentTime / audio.duration) * 100);
                }
              }}
            >
              Your browser does not support audio playback.
            </audio>
          </div>
        );

      case 'interactive':
        return (
          <div className={cn('flex-1', isFullscreen && 'fixed inset-0 z-50 bg-white')}>
            <iframe
              src={resource.contentUrl}
              title={resource.title}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        );

      case 'link':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <ExternalLink className="w-24 h-24 text-neutral-300 mb-6" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">External Resource</h3>
            <p className="text-neutral-500 mb-6 text-center max-w-md">{resource.description}</p>
            <Button onClick={() => window.open(resource.contentUrl, '_blank')}>
              Open Link
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <File className="w-24 h-24 text-neutral-300 mb-6" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">{resource.title}</h3>
            <p className="text-neutral-500 mb-6 text-center max-w-md">{resource.description}</p>
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download File
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden',
          'w-[95vw] h-[90vh] max-w-7xl',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white">
          <div className="flex items-center gap-4">
            <div className={cn('p-2 rounded-lg border', typeColor)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 line-clamp-1">
                {resource.title}
              </h2>
              <div className="flex items-center gap-3 text-sm text-neutral-500">
                {resource.subject && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${resource.subject.color}15`,
                      color: resource.subject.color,
                    }}
                  >
                    {resource.subject.name}
                  </span>
                )}
                {resource.fileSize && (
                  <span>{formatFileSize(resource.fileSize)}</span>
                )}
                {resource.duration && (
                  <span>{formatDuration(resource.duration)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Rating */}
            <div className="flex items-center gap-1 mr-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 hover:scale-110 transition-transform"
                >
                  <Star
                    className={cn(
                      'w-5 h-5 transition-colors',
                      (hoverRating || userRating) >= star
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-neutral-300'
                    )}
                  />
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              className={isBookmarked ? 'text-primary' : ''}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-5 h-5" />
              ) : (
                <BookmarkPlus className="w-5 h-5" />
              )}
            </Button>

            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </Button>

            {(resource.resourceType === 'pdf' || resource.resourceType === 'document') && (
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="w-5 h-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </Button>

            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Viewer */}
          <div className="flex-1 flex flex-col">
            {renderContent()}

            {/* Progress bar */}
            {progress > 0 && (
              <div className="h-1 bg-neutral-200">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

          {/* Sidebar with details */}
          <div className="w-80 border-l border-neutral-200 bg-neutral-50 p-6 overflow-y-auto hidden lg:block">
            <h3 className="font-semibold text-neutral-900 mb-3">About this resource</h3>
            <p className="text-sm text-neutral-600 mb-6">{resource.description}</p>

            <div className="space-y-4">
              {/* Stats */}
              <div className="bg-white rounded-lg p-4 border border-neutral-200">
                <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
                  Statistics
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500">Views</p>
                    <p className="font-semibold text-neutral-900">{resource.views.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Downloads</p>
                    <p className="font-semibold text-neutral-900">{resource.downloads.toLocaleString()}</p>
                  </div>
                  {resource.rating && (
                    <div>
                      <p className="text-neutral-500">Rating</p>
                      <p className="font-semibold text-neutral-900 flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        {resource.rating.toFixed(1)}
                      </p>
                    </div>
                  )}
                  {resource.ratingCount && (
                    <div>
                      <p className="text-neutral-500">Reviews</p>
                      <p className="font-semibold text-neutral-900">{resource.ratingCount}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {resource.tags && resource.tags.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-neutral-200">
                  <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Access Level */}
              <div className="bg-white rounded-lg p-4 border border-neutral-200">
                <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
                  Access
                </h4>
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    resource.accessLevel === 'free'
                      ? 'bg-green-100 text-green-700'
                      : resource.accessLevel === 'basic'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  )}
                >
                  {resource.accessLevel === 'free'
                    ? 'Free'
                    : resource.accessLevel === 'basic'
                    ? 'Basic'
                    : 'Premium'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

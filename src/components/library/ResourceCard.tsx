import { useState } from 'react';
import {
  FileText,
  Video,
  Headphones,
  File,
  Gamepad2,
  ExternalLink,
  Star,
  Eye,
  Download,
  BookmarkPlus,
  BookmarkCheck,
  Play,
} from 'lucide-react';
import { cn } from '@/utils';
import type { LibraryResource, ResourceType } from '@/types';

interface ResourceCardProps {
  resource: LibraryResource;
  onSelect?: (resource: LibraryResource) => void;
  onBookmark?: (resource: LibraryResource) => void;
  className?: string;
  compact?: boolean;
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
  pdf: 'bg-red-100 text-red-600',
  video: 'bg-purple-100 text-purple-600',
  audio: 'bg-green-100 text-green-600',
  document: 'bg-blue-100 text-blue-600',
  interactive: 'bg-amber-100 text-amber-600',
  link: 'bg-gray-100 text-gray-600',
};

const typeLabels: Record<ResourceType, string> = {
  pdf: 'PDF',
  video: 'Video',
  audio: 'Audio',
  document: 'Document',
  interactive: 'Interactive',
  link: 'Link',
};

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResourceCard({
  resource,
  onSelect,
  onBookmark,
  className,
  compact = false,
}: ResourceCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(resource.isBookmarked || false);
  const [imageError, setImageError] = useState(false);

  const Icon = typeIcons[resource.resourceType];
  const typeColor = typeColors[resource.resourceType];
  const typeLabel = typeLabels[resource.resourceType];

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    onBookmark?.(resource);
  };

  if (compact) {
    return (
      <div
        onClick={() => onSelect?.(resource)}
        className={cn(
          'flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200',
          'hover:border-primary hover:shadow-sm cursor-pointer transition-all',
          className
        )}
      >
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', typeColor)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-neutral-900 truncate">{resource.title}</h4>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>{typeLabel}</span>
            {resource.subject && (
              <>
                <span>•</span>
                <span>{resource.subject.name}</span>
              </>
            )}
          </div>
        </div>
        {resource.rating && (
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-xs font-medium">{resource.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect?.(resource)}
      className={cn(
        'group bg-white rounded-xl border border-neutral-200 overflow-hidden',
        'hover:border-primary hover:shadow-lg cursor-pointer transition-all',
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-neutral-100">
        {resource.thumbnailUrl && !imageError ? (
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="w-12 h-12 text-neutral-300" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {(resource.resourceType === 'video' || resource.resourceType === 'audio') && (
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-primary fill-current" />
            </div>
          )}
        </div>

        {/* Type Badge */}
        <div className={cn('absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium', typeColor)}>
          {typeLabel}
        </div>

        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          className={cn(
            'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all',
            isBookmarked
              ? 'bg-primary text-white'
              : 'bg-white/80 text-neutral-600 opacity-0 group-hover:opacity-100'
          )}
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-4 h-4" />
          ) : (
            <BookmarkPlus className="w-4 h-4" />
          )}
        </button>

        {/* Duration/Size */}
        {(resource.duration || resource.fileSize) && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs">
            {resource.duration
              ? formatDuration(resource.duration)
              : formatFileSize(resource.fileSize!)}
          </div>
        )}

        {/* Progress Bar */}
        {resource.userProgress !== undefined && resource.userProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${resource.userProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-neutral-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {resource.title}
        </h3>

        {resource.description && (
          <p className="text-sm text-neutral-500 line-clamp-2 mb-3">{resource.description}</p>
        )}

        {/* Subject Tag */}
        {resource.subject && (
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${resource.subject.color}15`,
                color: resource.subject.color,
              }}
            >
              {resource.subject.name}
            </span>
            {resource.accessLevel === 'premium' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                Premium
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {(resource.views ?? 0).toLocaleString()}
            </span>
            {(resource.downloads ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                {(resource.downloads ?? 0).toLocaleString()}
              </span>
            )}
          </div>

          {resource.rating && resource.ratingCount && (
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-3 h-3 fill-current" />
              <span className="font-medium">{resource.rating.toFixed(1)}</span>
              <span className="text-neutral-400">({resource.ratingCount})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

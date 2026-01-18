import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  aspectRatio?: '1/1' | '4/3' | '16/9' | '3/2' | 'auto';
  priority?: boolean;
  blur?: boolean;
  onLoadComplete?: () => void;
}

/**
 * OptimizedImage - Performance-optimized image component
 *
 * Features:
 * - Native lazy loading for off-screen images
 * - Eager loading for priority/above-the-fold images
 * - Intersection Observer for precise loading control
 * - Blur placeholder effect while loading
 * - Fallback image support
 * - Proper aspect ratio handling to prevent CLS
 * - Decoding async for non-blocking rendering
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.svg',
  aspectRatio = 'auto',
  priority = false,
  blur = true,
  className,
  onLoadComplete,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoadComplete?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const aspectRatioClass = {
    '1/1': 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-video',
    '3/2': 'aspect-[3/2]',
    'auto': '',
  }[aspectRatio];

  const imageSrc = hasError ? fallbackSrc : src;

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden',
        aspectRatioClass,
        className
      )}
    >
      {/* Blur placeholder */}
      {blur && !isLoaded && (
        <div
          className="absolute inset-0 bg-neutral-200 dark:bg-slate-700 animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Actual image - only render src when in view */}
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}
    </div>
  );
}

/**
 * Avatar - Optimized circular avatar image
 */
interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallbackInitials?: string;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

export function Avatar({
  src,
  alt,
  size = 'md',
  fallbackInitials,
  className,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const showFallback = !src || hasError;

  const initials = fallbackInitials || alt.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden flex-shrink-0',
        sizeClasses[size],
        className
      )}
      role="img"
      aria-label={alt}
    >
      {showFallback ? (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center',
            'bg-primary text-white font-medium'
          )}
          aria-hidden="true"
        >
          {initials}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}

/**
 * BackgroundImage - Optimized background image with lazy loading
 */
interface BackgroundImageProps {
  src: string;
  alt: string;
  children?: React.ReactNode;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
}

export function BackgroundImage({
  src,
  alt,
  children,
  className,
  overlay = true,
  overlayOpacity = 0.5,
}: BackgroundImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.01 }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
  }, [isInView, src]);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      role="img"
      aria-label={alt}
    >
      {/* Background */}
      <div
        className={cn(
          'absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        style={isInView ? { backgroundImage: `url(${src})` } : undefined}
        aria-hidden="true"
      />

      {/* Placeholder */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-neutral-200 dark:bg-slate-700 animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Overlay */}
      {overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

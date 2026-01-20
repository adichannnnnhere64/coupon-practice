import React, { useState, useEffect, useRef, useCallback } from 'react';

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  quality?: number;
  loading?: 'lazy' | 'eager';
  placeholder?: 'blurhash' | 'color' | 'none';
  forceContainerStyle?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 400,
  height = 300,
  quality = 80,
  loading = 'lazy',
  className = '',
  placeholder = 'color',
  forceContainerStyle = false,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isTauri, setIsTauri] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Better Tauri detection with multiple checks and retry
  useEffect(() => {
    const detectTauri = () => {
      // Multiple ways to detect Tauri
      const tauriDetected =
        typeof window !== 'undefined' &&
        ((window as any).__TAURI__ ||
          (window as any).__TAURI_INTERNALS__ ||
          (window as any).tauri);

      console.log('🔍 Tauri detection check:', {
        __TAURI__: (window as any).__TAURI__,
        __TAURI_INTERNALS__: (window as any).__TAURI_INTERNALS__,
        tauri: (window as any).tauri,
        userAgent: navigator.userAgent,
      });

      return !!tauriDetected;
    };

    // Initial check
    if (detectTauri()) {
      setIsTauri(true);
      console.log('✅ Tauri detected on initial check');
      return;
    }

    // If not detected initially, try again after a short delay
    // Tauri might still be initializing
    const timeoutId = setTimeout(() => {
      if (detectTauri()) {
        setIsTauri(true);
        console.log('✅ Tauri detected on delayed check');
      } else {
        console.log('❌ Tauri not detected');
        setIsTauri(false);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  // Container style - only apply in Tauri or when forced
  const containerStyle: React.CSSProperties =
    isTauri || forceContainerStyle
      ? {
          aspectRatio: `${width} / ${height}`,
          minHeight: height,
        }
      : {};

  useEffect(() => {
    console.log('🔄 useEffect running with isTauri:', isTauri);

    if (!src) {
      console.log('❌ No src provided');
      setImageSrc(null);
      setError(true);
      return;
    }

    let optimizedSrc = src;

    // 🔧 Tauri environment support
    if (isTauri) {
      console.log('🔧 Processing URL for Tauri environment');
      if (
        src.startsWith('/') ||
        src.startsWith('./') ||
        src.startsWith('../')
      ) {
        optimizedSrc = `https://asset.localhost${
          src.startsWith('/') ? src : `/${src}`
        }`;
        console.log('🔄 Converted local path to Tauri URL:', optimizedSrc);
      } else if (src.startsWith('http://') || src.startsWith('https://')) {
        console.log('🌐 Keeping HTTP/HTTPS URL as-is:', optimizedSrc);
      } else {
        console.log('❓ Unknown URL format:', src);
      }
    } else {
      console.log('🌐 Web environment - using src as-is:', src);
    }

    setImageSrc(optimizedSrc);
    setError(false);
    setLoaded(false);
  }, [src, width, height, quality, isTauri]);

  // Rest of your component remains the same...
  const handleLoad = useCallback(() => {
    console.log('✅ Image loaded successfully:', imageSrc);
    setLoaded(true);
    setError(false);
  }, [imageSrc]);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      console.error('❌ Image failed to load:', imageSrc, e);
      setError(true);
      setLoaded(true);
    },
    [imageSrc]
  );

  // 🔥 Error State
  if (error) {
    return (
      <div
        className={`
          w-full h-full bg-gradient-to-br from-gray-100 to-gray-200
          rounded-lg flex items-center justify-center ${className}
        `}
        style={containerStyle}
      >
        <div className="text-center">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0-2-2H6a2 2 0-2 2v12a2 2 0-2 2z"
            />
          </svg>
          <p className="text-sm text-gray-500 mt-2">Failed to load image</p>
        </div>
      </div>
    );
  }

  // ⏳ Loading state (no src yet)
  if (!imageSrc) {
    return (
      <div
        className={`
          w-full h-full bg-gradient-to-br from-blue-50 via-white to-indigo-100
          rounded-lg flex items-center justify-center ${className}
        `}
        style={containerStyle}
      >
        <div className="animate-pulse text-center">
          <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        relative w-full overflow-hidden rounded-lg ${className}
      `}
      style={containerStyle}
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-blue-50 via-white to-indigo-100 z-10" />
      )}

      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        loading={loading}
        className={`
          w-full h-full object-cover transition-opacity duration-300
          ${loaded ? 'opacity-100' : 'opacity-0'} relative z-20
        `}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};

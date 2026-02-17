import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  alt: string;
}

/**
 * Image Component with Fallback
 * 
 * Displays a placeholder if image fails to load
 */
const ImageWithFallback = ({ 
  src, 
  fallbackSrc, 
  alt, 
  className,
  ...props 
}: ImageWithFallbackProps) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      if (fallbackSrc) {
        setImgSrc(fallbackSrc);
      } else {
        setImgSrc(undefined);
      }
    }
  };

  if (!imgSrc && hasError) {
    return (
      <div 
        className={cn(
          "bg-muted flex items-center justify-center",
          className
        )}
        {...props}
      >
        <ImageOff className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={handleError}
      className={className}
      {...props}
    />
  );
};

export default ImageWithFallback;








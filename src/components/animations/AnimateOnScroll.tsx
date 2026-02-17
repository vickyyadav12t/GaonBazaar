import { useEffect, useRef, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimateOnScrollProps {
  children: ReactNode;
  animation?: 'fade-in' | 'slide-up' | 'slide-in-right' | 'slide-in-left' | 'scale-in' | 'zoom-in';
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
  once?: boolean; // Only animate once when it enters viewport
}

/**
 * AnimateOnScroll Component
 * 
 * Animates children when they enter the viewport
 * Perfect for scroll-triggered animations
 */
const AnimateOnScroll = ({
  children,
  animation = 'fade-in',
  delay = 0,
  duration = 0.5,
  className,
  threshold = 0.1,
  once = true,
}: AnimateOnScrollProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            setHasAnimated(true);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, once]);

  const animationClasses = {
    'fade-in': 'animate-fade-in',
    'slide-up': 'animate-slide-up',
    'slide-in-right': 'animate-slide-in-right',
    'slide-in-left': 'animate-slide-in-left',
    'scale-in': 'animate-scale-in',
    'zoom-in': 'animate-zoom-in',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'transition-opacity',
        isVisible || hasAnimated ? animationClasses[animation] : 'opacity-0',
        className
      )}
      style={{
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
};

export default AnimateOnScroll;






import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number; // Delay between each child (in seconds)
  animation?: 'fade-in' | 'slide-up' | 'slide-in-right' | 'scale-in';
  className?: string;
  /** When true, each child wrapper is h-full so grid/flex rows can equalize card heights */
  stretchGridItems?: boolean;
}

/**
 * StaggerContainer Component
 * 
 * Applies staggered animations to children
 * Perfect for lists, grids, and card layouts
 */
const StaggerContainer = ({
  children,
  staggerDelay = 0.1,
  animation = 'fade-in',
  className,
  stretchGridItems = false,
}: StaggerContainerProps) => {
  const animationClasses = {
    'fade-in': 'animate-fade-in',
    'slide-up': 'animate-slide-up',
    'slide-in-right': 'animate-slide-in-right',
    'scale-in': 'animate-scale-in',
  };

  const childrenArray = Array.isArray(children) ? children : [children];

  return (
    <div className={cn('contents', className)}>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          className={cn(animationClasses[animation], stretchGridItems && 'h-full min-h-0')}
          style={{
            animationDelay: `${index * staggerDelay}s`,
            animationFillMode: 'both',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default StaggerContainer;






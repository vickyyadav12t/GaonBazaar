import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number; // Delay between each child (in seconds)
  animation?: 'fade-in' | 'slide-up' | 'slide-in-right' | 'scale-in';
  className?: string;
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
          className={animationClasses[animation]}
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






import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * PageTransition Component
 * 
 * Provides smooth page transitions when navigating between routes
 */
const PageTransition = ({ children, className }: PageTransitionProps) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'entering' | 'entered'>('entering');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('entering');
      // Small delay to trigger exit animation
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('entered');
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div
      className={cn(
        'min-h-screen',
        transitionStage === 'entering' ? 'animate-fade-out' : 'animate-fade-in',
        className
      )}
      style={{
        animationDuration: '0.2s',
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
};

export default PageTransition;






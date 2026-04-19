import { useLayoutEffect, useState } from 'react';

const MAX = 384;
const MIN = 220;

/**
 * Pixel width for @react-oauth/google `GoogleLogin` so it fits narrow viewports
 * without horizontal scroll (the library requires an explicit width).
 */
export function useGoogleOAuthButtonWidth(sidePadding = 40) {
  const [width, setWidth] = useState(MAX);

  useLayoutEffect(() => {
    const clamp = () => {
      setWidth(Math.min(MAX, Math.max(MIN, window.innerWidth - sidePadding)));
    };
    clamp();
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  }, [sidePadding]);

  return width;
}

import { useEffect, useRef } from 'react';

/**
 * When the page is scrolled to the top, a downward touch gesture past `thresholdPx` calls `onRefresh`.
 * Uses window scroll; intended for mobile dashboards (no passive:false touchmove).
 */
export function usePullToRefresh(
  onRefresh: () => void | Promise<void>,
  { enabled = true, thresholdPx = 88 }: { enabled?: boolean; thresholdPx?: number } = {}
) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const state = { y0: 0, armed: false };

    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 6) return;
      state.y0 = e.touches[0].clientY;
      state.armed = true;
    };

    const onEnd = (e: TouchEvent) => {
      if (!state.armed) return;
      state.armed = false;
      if (window.scrollY > 6) return;
      const dy = e.changedTouches[0].clientY - state.y0;
      if (dy > thresholdPx) void onRefreshRef.current();
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
    };
  }, [enabled, thresholdPx]);
}

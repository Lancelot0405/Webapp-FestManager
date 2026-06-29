import { useRef, useState, useCallback, type TouchEvent } from 'react';

const THRESHOLD = 80;
const MAX_PULL = 120;

interface Options {
  onRefresh: () => void | Promise<unknown>;
  disabled?: boolean;
}

/**
 * Touch pull-to-refresh. Only triggers when scroll container at top.
 * Returns handlers to spread on the scrollable element + UI state.
 */
export function usePullToRefresh({ onRefresh, disabled }: Options) {
  const startY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    const el = e.currentTarget as HTMLElement;
    if (el.scrollTop <= 0) startY.current = e.touches[0].clientY;
  }, [disabled, isRefreshing]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      // dampen
      setPullDistance(Math.min(MAX_PULL, delta * 0.5));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (startY.current === null) return;
    const shouldRefresh = pullDistance >= THRESHOLD;
    startY.current = null;
    if (shouldRefresh) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  return {
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
    pullDistance,
    isRefreshing,
    threshold: THRESHOLD,
  };
}

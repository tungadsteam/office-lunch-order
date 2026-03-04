'use client';

import { useState, useRef, useCallback } from 'react';

interface PullToRefreshProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Pull-to-refresh wrapper for mobile.
 * Reloads the current page data when user pulls down from the top.
 */
export default function PullToRefresh({ children, className }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pullDistance = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!containerRef.current || containerRef.current.scrollTop > 0 || refreshing) return;

    const currentY = e.touches[0].clientY;
    pullDistance.current = currentY - startY.current;

    if (pullDistance.current > 10) {
      setPulling(true);
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance.current > THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPulling(false);

      // Trigger page reload to refresh all data
      window.location.reload();
    } else {
      setPulling(false);
    }
    pullDistance.current = 0;
    startY.current = 0;
  }, [refreshing]);

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {(pulling || refreshing) && (
        <div className="flex justify-center py-3 text-sm text-gray-500">
          {refreshing ? '🔄 Đang tải lại...' : '↓ Kéo xuống để tải lại'}
        </div>
      )}
      {children}
    </div>
  );
}

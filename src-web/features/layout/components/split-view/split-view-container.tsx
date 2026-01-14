'use client';

import type { Pane, PaneId } from '~/features/layout/stores/tabs-store';
import { useCallback, useRef, useState } from 'react';

import { useDragStore } from '~/features/layout/stores/drag-store';
import { useTabsStore } from '~/features/layout/stores/tabs-store';
import { HapticFeedbackPattern, useHaptics } from '~/hooks/use-haptics';

import { cn } from '~/lib/utils';

interface SplitViewContainerProps {
  children: React.ReactNode[];
  paneId: PaneId;
  pane: Extract<Pane, { type: 'split' }>;
  onPaneClick?: (paneIndex: 0 | 1) => void;
  className?: string;
  onSizesChange?: (sizes: [number, number]) => void;
}

const SNAP_THRESHOLD = 3; // the threshold for snapping to 50%
const MIN_PANE_SIZE = 15; // 15%

export function SplitViewContainer({
  children,
  paneId,
  pane,
  onPaneClick,
  className,
  onSizesChange,
}: SplitViewContainerProps) {
  const setSplitSizes = useTabsStore(s => s.setSplitSizes);
  const isDragging = useDragStore(s => s.isDragging);

  const setSizes = useCallback(
    (sizes: [number, number]) => {
      if (onSizesChange) {
        onSizesChange(sizes);
        return;
      }

      setSplitSizes(paneId, sizes);
    },
    [onSizesChange, paneId, setSplitSizes],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  const { perform: performHaptic } = useHaptics();

  const { orientation, sizes } = pane;

  const handleMouseDown = useCallback(
    (ev: React.MouseEvent) => {
      ev.preventDefault();
      setIsResizing(true);

      const container = containerRef.current;
      if (!container) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const isVertical = orientation === 'vertical';

      let lastSnappedTo50 = false;

      const handleMouseMove = (moveEv: MouseEvent) => {
        const position = isVertical
          ? moveEv.clientX - rect.left
          : moveEv.clientY - rect.top;

        const totalSize = isVertical ? rect.width : rect.height;
        let percentage = (position / totalSize) * 100;

        percentage = Math.max(MIN_PANE_SIZE, Math.min(100 - MIN_PANE_SIZE, percentage));

        const distanceFrom50 = Math.abs(percentage - 50);
        if (distanceFrom50 < SNAP_THRESHOLD) {
          if (!lastSnappedTo50) {
            lastSnappedTo50 = true;
            performHaptic(HapticFeedbackPattern.Alignment);
          }
          percentage = 50;
        }
        else {
          lastSnappedTo50 = false;
        }

        setSizes([percentage, 100 - percentage]);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [orientation, setSizes, performHaptic],
  );

  if (children.length < 2) {
    return (
      <div className={cn('flex flex-1 min-h-0', className)}>
        {children[0]}
      </div>
    );
  }

  const isVertical = orientation === 'vertical';

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-1 min-h-0',
        isVertical ? 'flex-row' : 'flex-col',
        className,
      )}
    >
      {/* Pane 0 (left/top) */}
      <div
        className="relative min-h-0 min-w-0 overflow-hidden"
        style={{
          [isVertical ? 'width' : 'height']: `${sizes[0]}%`,
        }}
        onClick={() => onPaneClick?.(0)}
      >
        {children[0]}
      </div>

      {/* Resize Handle */}
      <div
        role="separator"
        aria-orientation={isVertical ? 'vertical' : 'horizontal'}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHoveringHandle(true)}
        onMouseLeave={() => setIsHoveringHandle(false)}
        onKeyDown={(ev) => {
          const step = ev.shiftKey ? 10 : 2;
          if (
            (isVertical && ev.key === 'ArrowLeft')
            || (!isVertical && ev.key === 'ArrowUp')
          ) {
            ev.preventDefault();
            const newSize = Math.max(MIN_PANE_SIZE, sizes[0] - step);
            setSizes([newSize, 100 - newSize]);
          }
          else if (
            (isVertical && ev.key === 'ArrowRight')
            || (!isVertical && ev.key === 'ArrowDown')
          ) {
            ev.preventDefault();
            const newSize = Math.min(100 - MIN_PANE_SIZE, sizes[0] + step);
            setSizes([newSize, 100 - newSize]);
          }
        }}
        className={cn(
          'relative shrink-0 transition-all duration-200',
          isVertical
            ? 'w-1.5 cursor-col-resize hover:w-2'
            : 'h-1.5 cursor-row-resize hover:h-2',
          'bg-border/30',
          (isHoveringHandle || isResizing) && [
            'bg-primary/40',
            isVertical ? 'w-2' : 'h-2',
          ],
          isDragging && 'opacity-0 pointer-events-none',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none',
        )}
      >
        {/* Visual indicator line */}
        <div
          className={cn(
            'absolute transition-all duration-200',
            isVertical
              ? 'left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full'
              : 'top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full',
            'bg-muted-foreground/30',
            (isHoveringHandle || isResizing) && 'bg-primary/60',
          )}
        />
      </div>

      {/* Pane 1 (right/bottom) */}
      <div
        className="relative min-h-0 min-w-0 overflow-hidden"
        style={{
          [isVertical ? 'width' : 'height']: `${sizes[1]}%`,
        }}
        onClick={() => onPaneClick?.(1)}
      >
        {children[1]}
      </div>
    </div>
  );
}

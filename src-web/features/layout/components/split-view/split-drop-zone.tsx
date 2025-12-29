'use client';

import type { SplitDropZone } from '../../types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '~/lib/utils';

interface SplitDropZoneProps {
  isActive: boolean;
  draggedNoteId: string | null;
  wasCancelled?: boolean;
  onZoneChange: (zone: SplitDropZone | null) => void;
  onDrop: (zone: SplitDropZone, noteId: string) => void;
  className?: string;
}

const EDGE_THRESHOLD = 80; // distance from edge to trigger zone (in pixels)

export function SplitDropZoneOverlay({
  isActive,
  draggedNoteId,
  wasCancelled = false,
  onZoneChange,
  onDrop,
  className,
}: SplitDropZoneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeZone, setActiveZone] = useState<SplitDropZone | null>(null);
  const activeZoneRef = useRef<SplitDropZone | null>(null);
  const capturedNoteIdRef = useRef<string | null>(null);
  const wasCancelledRef = useRef(false);

  useEffect(() => {
    wasCancelledRef.current = wasCancelled;
  }, [wasCancelled]);

  const detectZone = useCallback(
    (clientX: number, clientY: number): SplitDropZone | null => {
      const container = containerRef.current;
      if (!container)
        return null;

      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Check if inside container
      if (x < 0 || x > rect.width || y < 0 || y > rect.height)
        return null;

      // Check edges in order of priority
      if (x < EDGE_THRESHOLD)
        return 'left';
      if (x > rect.width - EDGE_THRESHOLD)
        return 'right';
      if (y < EDGE_THRESHOLD)
        return 'top';
      if (y > rect.height - EDGE_THRESHOLD)
        return 'bottom';

      return 'center';
    },
    [],
  );

  const wasActiveRef = useRef(false);

  // Track mouse position during drag
  useEffect(() => {
    if (wasActiveRef.current && !isActive) {
      const zone = activeZoneRef.current;
      const noteId = capturedNoteIdRef.current;

      if (zone && noteId && !wasCancelledRef.current) {
        onDrop(zone, noteId);
      }

      setActiveZone(null);
      activeZoneRef.current = null;
      capturedNoteIdRef.current = null;
      onZoneChange(null);
    }

    wasActiveRef.current = isActive;

    if (!isActive)
      return;
    if (draggedNoteId && !capturedNoteIdRef.current)
      capturedNoteIdRef.current = draggedNoteId;

    const handleMouseMove = (ev: MouseEvent) => {
      const zone = detectZone(ev.clientX, ev.clientY);
      if (zone !== activeZoneRef.current) {
        activeZoneRef.current = zone;
        setActiveZone(zone);
        onZoneChange(zone);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isActive, draggedNoteId, detectZone, onZoneChange, onDrop]);

  if (!isActive)
    return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute inset-0 z-40 pointer-events-none',
        className,
      )}
    >
      <ZoneIndicator zone="left" activeZone={activeZone} />
      <ZoneIndicator zone="right" activeZone={activeZone} />
      <ZoneIndicator zone="top" activeZone={activeZone} />
      <ZoneIndicator zone="bottom" activeZone={activeZone} />
      <ZoneIndicator zone="center" activeZone={activeZone} />
    </div>
  );
}

interface ZoneIndicatorProps {
  zone: SplitDropZone;
  activeZone: SplitDropZone | null;
}

function ZoneIndicator({ zone, activeZone }: ZoneIndicatorProps) {
  const isActive = activeZone === zone;

  const baseClasses = cn(
    'absolute pointer-events-none transition-all duration-200 ease-out',
    'rounded-lg overflow-hidden',
  );

  const activeClasses = isActive
    ? cn(
        'bg-gradient-to-br from-primary/10 to-primary/20',
        'border-2 border-dashed border-primary/50',
        'shadow-[inset_0_0_40px_hsl(var(--primary)/0.1),0_0_20px_hsl(var(--primary)/0.15)]',
        'backdrop-blur-[2px]',
        'scale-100 opacity-100',
      )
    : 'scale-95 opacity-0';

  const positionClasses = getPositionClasses(zone);

  return (
    <div className={cn(baseClasses, positionClasses, activeClasses)}>
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="px-3 py-1.5 rounded-md bg-primary/90 text-primary-foreground text-sm font-medium shadow-lg animate-in fade-in zoom-in-95 duration-200">
            {getZoneLabel(zone)}
          </span>
        </div>
      )}

      {isActive && zone !== 'center' && <SplitPreviewLine zone={zone} />}
    </div>
  );
}

function getPositionClasses(zone: SplitDropZone): string {
  switch (zone) {
    case 'left':
      return 'left-2 top-2 bottom-2 w-[calc(50%-8px)]';
    case 'right':
      return 'right-2 top-2 bottom-2 w-[calc(50%-8px)]';
    case 'top':
      return 'top-2 left-2 right-2 h-[calc(50%-8px)]';
    case 'bottom':
      return 'bottom-2 left-2 right-2 h-[calc(50%-8px)]';
    case 'center':
      return 'inset-4';
  }
}

function getZoneLabel(zone: SplitDropZone): string {
  switch (zone) {
    case 'left':
      return 'Split Left';
    case 'right':
      return 'Split Right';
    case 'top':
      return 'Split Top';
    case 'bottom':
      return 'Split Bottom';
    case 'center':
      return 'Replace';
  }
}

function SplitPreviewLine({ zone }: { zone: SplitDropZone }) {
  const isVertical = zone === 'left' || zone === 'right';

  return (
    <div
      className={cn(
        'absolute',
        isVertical
          ? 'right-0 top-4 bottom-4 w-0.75'
          : 'bottom-0 left-4 right-4 h-0.75',
        zone === 'left' && 'right-0 left-auto',
        zone === 'right' && 'left-0 right-auto',
        zone === 'top' && 'bottom-0 top-auto',
        zone === 'bottom' && 'top-0 bottom-auto',
      )}
    >
    </div>
  );
}

import type { PropsWithChildren } from 'react';
import type { SplitDropZone } from '~/features/layout/types';
import { createContext, use, useCallback, useState } from 'react';

interface DragState {
  isDragging: boolean;
  draggedNoteId: string | null;
  source: 'sidebar' | 'tabs' | null;
  splitDropTarget: SplitDropZone | null;
  wasCancelled: boolean;
  isOutsideSidebar: boolean;
}

interface DragContextValue extends DragState {
  startDrag: (noteId: string, source: 'sidebar' | 'tabs') => void;
  endDrag: (cancelled?: boolean) => void;
  setSplitDropTarget: (zone: SplitDropZone | null) => void;
  setIsOutsideSidebar: (isOutside: boolean) => void;
}

const DragContext = createContext<DragContextValue | null>(null);

export function useDragContext() {
  const context = use(DragContext);
  if (!context)
    throw new Error('useDragContext must be used within a DragProvider');

  return context;
}

type DragProviderProps = PropsWithChildren;

export function DragProvider({ children }: DragProviderProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedNoteId: null,
    source: null,
    splitDropTarget: null,
    wasCancelled: false,
    isOutsideSidebar: false,
  });

  const startDrag = useCallback(
    (noteId: string, source: 'sidebar' | 'tabs') => {
      setDragState({
        isDragging: true,
        draggedNoteId: noteId,
        source,
        splitDropTarget: null,
        wasCancelled: false,
        isOutsideSidebar: false,
      });
    },
    [],
  );

  const endDrag = useCallback((cancelled = false) => {
    setDragState({
      isDragging: false,
      draggedNoteId: null,
      source: null,
      splitDropTarget: null,
      wasCancelled: cancelled,
      isOutsideSidebar: false,
    });
  }, []);

  const setSplitDropTarget = useCallback((zone: SplitDropZone | null) => {
    setDragState(prev => ({ ...prev, splitDropTarget: zone }));
  }, []);

  const setIsOutsideSidebar = useCallback((isOutside: boolean) => {
    setDragState(prev => ({ ...prev, isOutsideSidebar: isOutside }));
  }, []);

  return (
    <DragContext
      value={{
        ...dragState,
        startDrag,
        endDrag,
        setSplitDropTarget,
        setIsOutsideSidebar,
      }}
    >
      {children}
    </DragContext>
  );
}

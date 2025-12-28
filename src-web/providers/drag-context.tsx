import type { PropsWithChildren } from 'react';
import { createContext, use, useCallback, useState } from 'react';
import type { SplitDropZone } from '~/features/layout/types';

interface DragState {
  isDragging: boolean;
  draggedNoteId: string | null;
  source: 'sidebar' | 'tabs' | null;
  splitDropTarget: SplitDropZone | null;
}

interface DragContextValue extends DragState {
  startDrag: (noteId: string, source: 'sidebar' | 'tabs') => void;
  endDrag: () => void;
  setSplitDropTarget: (zone: SplitDropZone | null) => void;
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
  });

  const startDrag = useCallback(
    (noteId: string, source: 'sidebar' | 'tabs') => {
      setDragState({
        isDragging: true,
        draggedNoteId: noteId,
        source,
        splitDropTarget: null,
      });
    },
    [],
  );

  const endDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedNoteId: null,
      source: null,
      splitDropTarget: null,
    });
  }, []);

  const setSplitDropTarget = useCallback((zone: SplitDropZone | null) => {
    setDragState((prev) => ({ ...prev, splitDropTarget: zone }));
  }, []);

  return (
    <DragContext
      value={{
        ...dragState,
        startDrag,
        endDrag,
        setSplitDropTarget,
      }}
    >
      {children}
    </DragContext>
  );
}


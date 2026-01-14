import type { SplitDropZone } from '~/features/layout/types';
import { create } from 'zustand';

interface DragState {
  isDragging: boolean;
  draggedNoteId: string | null;
  source: 'sidebar' | 'tabs' | null;
  splitDropTarget: SplitDropZone | null;
  wasCancelled: boolean;
  isOutsideSidebar: boolean;
}

interface DragActions {
  startDrag: (noteId: string, source: 'sidebar' | 'tabs') => void;
  endDrag: (cancelled?: boolean) => void;
  setSplitDropTarget: (zone: SplitDropZone | null) => void;
  setIsOutsideSidebar: (isOutside: boolean) => void;
}

export const useDragStore = create<DragState & DragActions>(set => ({
  isDragging: false,
  draggedNoteId: null,
  source: null,
  splitDropTarget: null,
  wasCancelled: false,
  isOutsideSidebar: false,

  startDrag: (noteId, source) =>
    set({
      isDragging: true,
      draggedNoteId: noteId,
      source,
      splitDropTarget: null,
      wasCancelled: false,
      isOutsideSidebar: false,
    }),

  endDrag: (cancelled = false) =>
    set({
      isDragging: false,
      draggedNoteId: null,
      source: null,
      splitDropTarget: null,
      wasCancelled: cancelled,
      isOutsideSidebar: false,
    }),

  setSplitDropTarget: zone => set({ splitDropTarget: zone }),
  setIsOutsideSidebar: isOutside => set({ isOutsideSidebar: isOutside }),
}));

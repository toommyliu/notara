import { nanoid } from 'nanoid';
import { create } from 'zustand';

export interface Pane {
  id: string;
  noteId: string | null;
}

interface SplitViewState {
  panes: Pane[];
  activePaneId: string;
  orientation: 'horizontal' | 'vertical';
}

interface SplitViewActions {
  /** Open a note in a specific pane */
  openInPane: (paneId: string, noteId: string) => void;
  /** Add a new pane at position with optional note */
  addPane: (
    position: 'left' | 'right' | 'top' | 'bottom',
    noteId?: string,
  ) => void;
  /** Remove a pane by ID, collapsing split if only one remains */
  removePane: (paneId: string) => void;
  /** Set which pane is currently active/focused */
  setActivePane: (paneId: string) => void;
  /** Set the layout orientation */
  setOrientation: (orientation: 'horizontal' | 'vertical') => void;
  /** Open note in the currently active pane */
  openInActivePane: (noteId: string) => void;
  /** Reset to single-pane view */
  resetToSinglePane: () => void;
  /** Swap the contents of the two panes */
  swapPanes: () => void;
  /** Set all panes at once */
  setPanes: (panes: Pane[], activePaneId?: string) => void;
  /** Set to a single pane with a specific note */
  setSinglePane: (noteId: string) => void;
  /** Cycle focus to the next/previous pane. direction: 1 = forward, -1 = backward */
  cyclePane: (direction: 1 | -1) => void;
}

function createDefaultPane(): Pane {
  return {
    id: nanoid(8),
    noteId: null,
  };
}

const initialPane = createDefaultPane();

export const useSplitViewStore = create<SplitViewState & SplitViewActions>()(
  (set, get) => ({
    panes: [initialPane],
    activePaneId: initialPane.id,
    orientation: 'vertical',

    openInPane: (paneId, noteId) =>
      set((s) => ({
        panes: s.panes.map((p) => (p.id === paneId ? { ...p, noteId } : p)),
        activePaneId: paneId,
      })),

    addPane: (position, noteId) =>
      set((s) => {
        // Max two panes
        if (s.panes.length >= 2) return s;

        const newPane: Pane = {
          id: nanoid(8),
          noteId: noteId ?? null,
        };

        const isVertical = position === 'top' || position === 'bottom';
        const newPanes =
          position === 'left' || position === 'top'
            ? [newPane, ...s.panes]
            : [...s.panes, newPane];

        return {
          panes: newPanes,
          activePaneId: newPane.id,
          orientation: isVertical ? 'vertical' : 'horizontal',
        };
      }),

    removePane: (paneId) =>
      set((s) => {
        // Don't remove if it's the only pane
        if (s.panes.length <= 1) return s;

        const remainingPanes = s.panes.filter((p) => p.id !== paneId);
        const wasActive = s.activePaneId === paneId;

        return {
          panes: remainingPanes,
          activePaneId: wasActive
            ? (remainingPanes[0]?.id ?? s.activePaneId)
            : s.activePaneId,
        };
      }),

    setActivePane: (paneId) => set({ activePaneId: paneId }),

    setOrientation: (orientation) => set({ orientation }),

    openInActivePane: (noteId) => {
      const { activePaneId } = get();
      set((s) => ({
        panes: s.panes.map((p) =>
          p.id === activePaneId ? { ...p, noteId } : p,
        ),
      }));
    },

    resetToSinglePane: () => {
      const newPane = createDefaultPane();
      set({
        panes: [newPane],
        activePaneId: newPane.id,
      });
    },
    swapPanes: () =>
      set((s) => {
        if (s.panes.length !== 2) return s;

        const [p1, p2] = s.panes;

        // Swap noteIds but keep IDs and active status (or preserve active pane focus logic)
        // We'll keep the same pane IDs in the same order, just swap content
        return {
          panes: [
            { ...p1, noteId: p2.noteId },
            { ...p2, noteId: p1.noteId },
          ],
          // Keep the same active pane ID, effectively keeping focus on the "side" not the content
          activePaneId: s.activePaneId,
        };
      }),

    setPanes: (panes, activePaneId) =>
      set({
        panes,
        activePaneId: activePaneId ?? panes[0]?.id ?? '',
      }),

    setSinglePane: (noteId) => {
      const pane = createDefaultPane();
      pane.noteId = noteId;
      set({
        panes: [pane],
        activePaneId: pane.id,
      });
    },

    cyclePane: (direction) => {
      const { panes, activePaneId } = get();
      if (panes.length <= 1) return;

      const currentIndex = panes.findIndex((p) => p.id === activePaneId);
      const nextIndex =
        (currentIndex + direction + panes.length) % panes.length;
      set({ activePaneId: panes[nextIndex].id });
    },
  }),
);

export function useActivePaneNoteId() {
  return useSplitViewStore((s) => {
    const activePane = s.panes.find((p) => p.id === s.activePaneId);
    return activePane?.noteId ?? null;
  });
}

export function useIsSplitView() {
  return useSplitViewStore((s) => s.panes.length > 1);
}

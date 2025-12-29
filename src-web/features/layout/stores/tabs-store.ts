import type { SplitOrientation } from '../types';
import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { useNotesStore } from '~/features/notes/store';

export type NoteId = string;
export type PaneId = string;

export type SplitPlacement = 'first' | 'second';

export type Pane
  = | { type: 'single'; noteId: NoteId }
    | {
      type: 'split';
      orientation: SplitOrientation;
      left: NoteId;
      right: NoteId;
      sizes: [number, number];
      activeSide: 'left' | 'right';
    };

interface TabsState {
  panes: Map<PaneId, Pane>;
  paneOrder: PaneId[];
  pinnedPaneIds: Set<PaneId>;
  activePaneId: PaneId | null;
  isTabBarVisible: boolean;
}

interface TabsActions {
  // Pane lifecycle
  openNote: (noteId: NoteId) => void;
  closePane: (paneId: PaneId) => void;
  closeNoteInPane: (paneId: PaneId, noteId: NoteId) => void;

  // Split operations
  splitPane: (
    paneId: PaneId,
    secondNoteId: NoteId,
    orientation: SplitOrientation,
    placement?: SplitPlacement,
  ) => void;
  unsplitPane: (paneId: PaneId) => void;

  // Navigation
  setActivePane: (paneId: PaneId) => void;
  setActiveSide: (side: 'left' | 'right') => void;
  cyclePane: (direction: 1 | -1) => void;
  cycleSide: (direction: 1 | -1) => void;

  // Split-specific
  swapSides: (paneId: PaneId) => void;
  toggleOrientation: (paneId: PaneId) => void;
  setSplitSizes: (paneId: PaneId, sizes: [number, number]) => void;

  // Tab bar management
  reorderPanes: (fromId: PaneId, toId: PaneId) => void;
  pinPane: (paneId: PaneId) => void;
  unpinPane: (paneId: PaneId) => void;

  // UI
  toggleTabBar: () => void;
}

// Generate a unique pane ID
const generatePaneId = (): PaneId => crypto.randomUUID();

// Get all note IDs from a pane
export function getPaneNoteIds(pane: Pane): NoteId[] {
  return pane.type === 'single' ? [pane.noteId] : [pane.left, pane.right];
}

// Get the "active" note ID from a pane
export function getActiveNoteFromPane(pane: Pane): NoteId {
  return pane.type === 'single' ? pane.noteId : pane.activeSide === 'left' ? pane.left : pane.right;
}

// Find which pane contains a specific note
function findPaneByNoteId(panes: Map<PaneId, Pane>, noteId: NoteId): PaneId | null {
  for (const [paneId, pane] of panes) {
    if (pane.type === 'single' && pane.noteId === noteId)
      return paneId;
    if (pane.type === 'split' && (pane.left === noteId || pane.right === noteId))
      return paneId;
  }
  return null;
}

// Reorder array by moving element from one position to another
function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(from, 1);
  if (removed !== undefined) {
    result.splice(to, 0, removed);
  }
  return result;
}

export const useTabsStore = create<TabsState & TabsActions>()(
  persist(
    (set, get) => ({
      panes: new Map(),
      paneOrder: [],
      pinnedPaneIds: new Set(),
      activePaneId: null,
      isTabBarVisible: true,

      openNote: noteId =>
        set((s) => {
          // Check if note is already open in any pane
          const existingPaneId = findPaneByNoteId(s.panes, noteId);

          if (existingPaneId) {
            // Already open - just activate it
            const pane = s.panes.get(existingPaneId);
            if (!pane)
              return s;

            // If it's a split, set the correct side as active
            if (pane.type === 'split') {
              const activeSide = pane.left === noteId ? 'left' : 'right';
              const newPanes = new Map(s.panes);
              newPanes.set(existingPaneId, { ...pane, activeSide });
              return { panes: newPanes, activePaneId: existingPaneId };
            }

            return { activePaneId: existingPaneId };
          }

          // Create new single pane
          const newPaneId = generatePaneId();
          const newPane: Pane = { type: 'single', noteId };
          const newPanes = new Map(s.panes);
          newPanes.set(newPaneId, newPane);

          return {
            panes: newPanes,
            paneOrder: [...s.paneOrder, newPaneId],
            activePaneId: newPaneId,
          };
        }),

      closePane: paneId =>
        set((s) => {
          if (!s.panes.has(paneId))
            return s;

          const newPanes = new Map(s.panes);
          newPanes.delete(paneId);

          const newPaneOrder = s.paneOrder.filter(id => id !== paneId);
          const newPinnedPaneIds = new Set(s.pinnedPaneIds);
          newPinnedPaneIds.delete(paneId);

          // If we closed the active pane, select adjacent one
          let newActivePaneId = s.activePaneId;
          if (s.activePaneId === paneId) {
            const oldIndex = s.paneOrder.indexOf(paneId);
            newActivePaneId
              = newPaneOrder.length > 0
                ? (newPaneOrder[Math.min(oldIndex, newPaneOrder.length - 1)] ?? null)
                : null;
          }

          return {
            panes: newPanes,
            paneOrder: newPaneOrder,
            pinnedPaneIds: newPinnedPaneIds,
            activePaneId: newActivePaneId,
          };
        }),

      closeNoteInPane: (paneId, noteId) =>
        set((s) => {
          const pane = s.panes.get(paneId);
          if (!pane)
            return s;

          if (pane.type === 'single') {
            // Closing the only note in a single pane = close the pane
            return get().closePane(paneId), s;
          }

          // Split pane - convert to single
          const keepNoteId = pane.left === noteId ? pane.right : pane.left;
          const newPanes = new Map(s.panes);
          newPanes.set(paneId, { type: 'single', noteId: keepNoteId });

          return { panes: newPanes };
        }),

      splitPane: (paneId, secondNoteId, orientation, placement = 'second') =>
        set((s) => {
          const pane = s.panes.get(paneId);
          if (!pane)
            return s;

          const baseNoteId = pane.type === 'single' ? pane.noteId : getActiveNoteFromPane(pane);

          if (baseNoteId === secondNoteId)
            return s;

          const newPanes = new Map(s.panes);

          // Remove any existing pane that contains secondNoteId as a single pane
          const existingPaneId = findPaneByNoteId(s.panes, secondNoteId);
          let newPaneOrder = s.paneOrder;
          let newPinnedPaneIds = s.pinnedPaneIds;

          if (existingPaneId && existingPaneId !== paneId) {
            const existingPane = s.panes.get(existingPaneId);
            if (existingPane?.type === 'single') {
              newPanes.delete(existingPaneId);
              newPaneOrder = s.paneOrder.filter(id => id !== existingPaneId);
              if (s.pinnedPaneIds.has(existingPaneId)) {
                newPinnedPaneIds = new Set(s.pinnedPaneIds);
                newPinnedPaneIds.delete(existingPaneId);
              }
            }
          }

          const isSecondNoteFirst = placement === 'first';
          const firstNoteId = isSecondNoteFirst ? secondNoteId : baseNoteId;
          const secondNoteIdInSplit = isSecondNoteFirst ? baseNoteId : secondNoteId;
          const activeSide = isSecondNoteFirst ? 'left' : 'right';

          newPanes.set(paneId, {
            type: 'split',
            orientation,
            left: firstNoteId,
            right: secondNoteIdInSplit,
            sizes: [50, 50],
            activeSide,
          });

          return {
            panes: newPanes,
            paneOrder: newPaneOrder,
            pinnedPaneIds: newPinnedPaneIds,
          };
        }),

      unsplitPane: paneId =>
        set((s) => {
          const pane = s.panes.get(paneId);
          if (!pane || pane.type !== 'split')
            return s;

          const leftNoteId = pane.left;
          const rightNoteId = pane.right;

          const newPanes = new Map(s.panes);
          const newPaneOrder = [...s.paneOrder];

          newPanes.set(paneId, { type: 'single', noteId: leftNoteId });

          const rightPaneId = generatePaneId();
          newPanes.set(rightPaneId, { type: 'single', noteId: rightNoteId });

          const splitPaneIndex = newPaneOrder.indexOf(paneId);
          if (splitPaneIndex !== -1) {
            newPaneOrder.splice(splitPaneIndex + 1, 0, rightPaneId);
          }
          else {
            newPaneOrder.push(rightPaneId);
          }

          return {
            panes: newPanes,
            paneOrder: newPaneOrder,
          };
        }),

      setActivePane: paneId =>
        set((s) => {
          if (!s.panes.has(paneId))
            return s;
          return { activePaneId: paneId };
        }),

      setActiveSide: side =>
        set((s) => {
          if (!s.activePaneId)
            return s;
          const pane = s.panes.get(s.activePaneId);
          if (!pane || pane.type !== 'split')
            return s;

          const newPanes = new Map(s.panes);
          newPanes.set(s.activePaneId, { ...pane, activeSide: side });
          return { panes: newPanes };
        }),

      cyclePane: direction =>
        set((s) => {
          if (s.paneOrder.length === 0)
            return s;

          if (!s.activePaneId) {
            const newActiveId
              = direction === 1 ? s.paneOrder[0] : s.paneOrder[s.paneOrder.length - 1];
            return { activePaneId: newActiveId ?? null };
          }

          const currentIndex = s.paneOrder.indexOf(s.activePaneId);
          if (currentIndex === -1)
            return s;

          const nextIndex = (currentIndex + direction + s.paneOrder.length) % s.paneOrder.length;
          return { activePaneId: s.paneOrder[nextIndex] ?? null };
        }),

      cycleSide: _direction =>
        set((s) => {
          if (!s.activePaneId)
            return s;
          const pane = s.panes.get(s.activePaneId);
          if (!pane || pane.type !== 'split')
            return s;

          const newSide = pane.activeSide === 'left' ? 'right' : 'left';
          const newPanes = new Map(s.panes);
          newPanes.set(s.activePaneId, { ...pane, activeSide: newSide });
          return { panes: newPanes };
        }),

      swapSides: paneId =>
        set((s) => {
          const pane = s.panes.get(paneId);
          if (!pane || pane.type !== 'split')
            return s;

          const newPanes = new Map(s.panes);
          newPanes.set(paneId, {
            ...pane,
            left: pane.right,
            right: pane.left,
            sizes: [pane.sizes[1], pane.sizes[0]],
          });
          return { panes: newPanes };
        }),

      toggleOrientation: paneId =>
        set((s) => {
          const pane = s.panes.get(paneId);
          if (!pane || pane.type !== 'split')
            return s;

          const newPanes = new Map(s.panes);
          newPanes.set(paneId, {
            ...pane,
            orientation: pane.orientation === 'horizontal' ? 'vertical' : 'horizontal',
          });
          return { panes: newPanes };
        }),

      setSplitSizes: (paneId, sizes) =>
        set((s) => {
          const pane = s.panes.get(paneId);
          if (!pane || pane.type !== 'split')
            return s;

          const newPanes = new Map(s.panes);
          newPanes.set(paneId, { ...pane, sizes });
          return { panes: newPanes };
        }),

      reorderPanes: (fromId, toId) =>
        set((s) => {
          const fromIndex = s.paneOrder.indexOf(fromId);
          const toIndex = s.paneOrder.indexOf(toId);
          if (fromIndex === -1 || toIndex === -1)
            return s;

          return { paneOrder: arrayMove(s.paneOrder, fromIndex, toIndex) };
        }),

      pinPane: paneId =>
        set((s) => {
          if (!s.panes.has(paneId) || s.pinnedPaneIds.has(paneId))
            return s;

          const newPinnedPaneIds = new Set(s.pinnedPaneIds);
          newPinnedPaneIds.add(paneId);

          // Move to front of order (pinned panes come first)
          const currentIndex = s.paneOrder.indexOf(paneId);
          if (currentIndex === -1)
            return s;

          const pinnedCount = [...s.pinnedPaneIds].filter(id => s.paneOrder.includes(id)).length;
          const newPaneOrder = arrayMove(s.paneOrder, currentIndex, pinnedCount);

          return { pinnedPaneIds: newPinnedPaneIds, paneOrder: newPaneOrder };
        }),

      unpinPane: paneId =>
        set((s) => {
          if (!s.pinnedPaneIds.has(paneId))
            return s;

          const newPinnedPaneIds = new Set(s.pinnedPaneIds);
          newPinnedPaneIds.delete(paneId);

          // Move to end of pinned section
          const currentIndex = s.paneOrder.indexOf(paneId);
          if (currentIndex === -1)
            return s;

          const newPinnedCount = newPinnedPaneIds.size;
          const newPaneOrder = arrayMove(s.paneOrder, currentIndex, newPinnedCount);

          return { pinnedPaneIds: newPinnedPaneIds, paneOrder: newPaneOrder };
        }),

      toggleTabBar: () => set(s => ({ isTabBarVisible: !s.isTabBarVisible })),
    }),
    {
      name: 'notara:tabs:v2',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str)
            return null;

          const parsed = JSON.parse(str);
          // Rehydrate Map and Set from serializable form
          return {
            ...parsed,
            state: {
              ...parsed.state,
              panes: new Map(parsed.state.panes ?? []),
              pinnedPaneIds: new Set(parsed.state.pinnedPaneIds ?? []),
            },
          };
        },
        setItem: (name, value) => {
          const serializable = {
            ...value,
            state: {
              ...value.state,
              panes: [...value.state.panes],
              pinnedPaneIds: [...value.state.pinnedPaneIds],
            },
          };
          localStorage.setItem(name, JSON.stringify(serializable));
        },
        removeItem: name => localStorage.removeItem(name),
      },
      onRehydrateStorage: () => (state) => {
        if (!state)
          return;

        const { notes } = useNotesStore.getState();

        // Validate panes - remove any with invalid note IDs
        const validPanes = new Map<PaneId, Pane>();
        const validPaneOrder: PaneId[] = [];

        for (const paneId of state.paneOrder) {
          const pane = state.panes.get(paneId);
          if (!pane)
            continue;

          if (pane.type === 'single') {
            if (notes.has(pane.noteId)) {
              validPanes.set(paneId, pane);
              validPaneOrder.push(paneId);
            }
          }
          else {
            const leftValid = notes.has(pane.left);
            const rightValid = notes.has(pane.right);

            if (leftValid && rightValid) {
              validPanes.set(paneId, pane);
              validPaneOrder.push(paneId);
            }
            else if (leftValid) {
              validPanes.set(paneId, { type: 'single', noteId: pane.left });
              validPaneOrder.push(paneId);
            }
            else if (rightValid) {
              validPanes.set(paneId, { type: 'single', noteId: pane.right });
              validPaneOrder.push(paneId);
            }
          }
        }

        state.panes = validPanes;
        state.paneOrder = validPaneOrder;

        // Validate pinned panes
        state.pinnedPaneIds = new Set(
          [...state.pinnedPaneIds].filter(id => validPanes.has(id)),
        );

        // Validate active pane
        if (state.activePaneId && !validPanes.has(state.activePaneId)) {
          state.activePaneId = validPaneOrder[0] ?? null;
        }
      },
    },
  ),
);

// Selector hooks for common access patterns
export function useActiveNoteId(): NoteId | null {
  return useTabsStore((s) => {
    if (!s.activePaneId)
      return null;
    const pane = s.panes.get(s.activePaneId);
    if (!pane)
      return null;
    return getActiveNoteFromPane(pane);
  });
}

// Selector for active pane ID - primitive, no issues
export function useActivePaneId(): PaneId | null {
  return useTabsStore(s => s.activePaneId);
}

// Computed selector for active pane object
// Note: This returns a new object reference on state change, use carefully
export function useActivePane(): Pane | null {
  const activePaneId = useActivePaneId();
  const pane = useTabsStore(s => (activePaneId ? s.panes.get(activePaneId) : null));
  return pane ?? null;
}

export function usePaneByNoteId(noteId: NoteId): PaneId | null {
  return useTabsStore(s => findPaneByNoteId(s.panes, noteId));
}

// Use primitive selector to get pane order, then derive in consumer
export function usePaneOrder(): PaneId[] {
  return useTabsStore(s => s.paneOrder);
}

export function usePinnedPaneIds(): Set<PaneId> {
  return useTabsStore(s => s.pinnedPaneIds);
}

export function usePanesMap(): Map<PaneId, Pane> {
  return useTabsStore(s => s.panes);
}

export interface OrderedPane {
  id: PaneId;
  pane: Pane;
  isPinned: boolean;
}

// This hook simply returns the raw values - consumers should memoize the derived data
export function useOrderedPanes(): OrderedPane[] {
  const paneOrder = usePaneOrder();
  const panes = usePanesMap();
  const pinnedPaneIds = usePinnedPaneIds();

  return useMemo(() => {
    return paneOrder
      .map((id) => {
        const pane = panes.get(id);
        if (!pane)
          return null;
        return { id, pane, isPinned: pinnedPaneIds.has(id) };
      })
      .filter((p): p is OrderedPane => p !== null);
  }, [paneOrder, panes, pinnedPaneIds]);
}

// Simple primitive selector for all open note IDs
export function useAllOpenNoteIds(): NoteId[] {
  const panes = usePanesMap();

  return useMemo(() => {
    const noteIds: NoteId[] = [];
    for (const pane of panes.values()) {
      noteIds.push(...getPaneNoteIds(pane));
    }
    return noteIds;
  }, [panes]);
}

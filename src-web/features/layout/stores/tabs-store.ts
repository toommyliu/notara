import type { SplitOrientation } from '../types';
import { arrayMove } from '@dnd-kit/sortable';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useNotesStore } from '~/features/notes/store';

interface SplitViewState {
  enabled: boolean;
  orientation: SplitOrientation;
  panes: [string] | [string, string];
  sizes: [number, number];
  splitPair: [string, string] | null;
  activePaneIndex: 0 | 1;
}

interface TabsState {
  pinnedTabs: string[];
  openTabs: string[];
  tabGroups: string[][];
  activeTabId: string | null;
  isTabBarVisible: boolean;
  splitView: SplitViewState;
}

interface TabsActions {
  openTab: (noteId: string) => void;
  closeTab: (noteId: string) => void;
  pinTab: (noteId: string) => void;
  unpinTab: (noteId: string) => void;
  reorderTabs: (
    activeId: string,
    overId: string,
    section: 'pinned' | 'open',
  ) => void;
  setActiveTab: (noteId: string) => void;
  cycleTab: (direction: 1 | -1) => void;
  cyclePane: (direction: 1 | -1) => void;
  toggleTabBar: () => void;

  addToGroup: (targetId: string, anchorId: string) => void;
  removeFromGroup: (id: string) => void;

  // Split view actions
  createSplit: (
    targetNoteId: string,
    orientation: SplitOrientation,
    draggedFirst?: boolean,
  ) => void;
  closeSplit: (paneIndex: 0 | 1) => void;
  closeSplitPair: () => void;
  setSplitSizes: (sizes: [number, number]) => void;
  swapPanes: () => void;
  toggleOrientation: () => void;
  replacePaneContent: (paneIndex: 0 | 1, noteId: string) => void;
}

export const useTabsStore = create<TabsState & TabsActions>()(
  persist(
    set => ({
      pinnedTabs: [],
      openTabs: [],
      tabGroups: [],
      activeTabId: null,
      isTabBarVisible: true,
      splitView: {
        enabled: false,
        orientation: 'vertical',
        panes: [''],
        sizes: [50, 50],
        splitPair: null,
        activePaneIndex: 0,
      },

      openTab: noteId =>
        set((s) => {
          const isAlreadyOpen
            = s.pinnedTabs.includes(noteId) || s.openTabs.includes(noteId);

          // Check if this tab is part of a split pair
          const splitPair = s.splitView.splitPair;
          const isInPair = splitPair && splitPair.includes(noteId);

          let newSplitView = s.splitView;

          if (isInPair && splitPair) {
            // Restore the split view with this pair
            newSplitView = {
              enabled: true,
              orientation: s.splitView.orientation,
              panes: splitPair,
              sizes: s.splitView.sizes,
              splitPair,
              activePaneIndex: s.splitView.activePaneIndex,
            };
          }
          else if (s.splitView.enabled) {
            // Not in split pair, hide split but keep pair remembered
            newSplitView = {
              ...s.splitView,
              enabled: false,
              panes: [noteId] as [string],
            };
          }
          else {
            // When not in split mode, sync pane0 with active tab
            newSplitView = { ...s.splitView, panes: [noteId] as [string] };
          }

          if (isAlreadyOpen) {
            return { activeTabId: noteId, splitView: newSplitView };
          }

          return {
            openTabs: [...s.openTabs, noteId],
            activeTabId: noteId,
            splitView: newSplitView,
          };
        }),

      closeTab: noteId =>
        set((s) => {
          const wasPinned = s.pinnedTabs.includes(noteId);
          const wasOpen = s.openTabs.includes(noteId);
          if (!wasPinned && !wasOpen)
            return s;

          const newPinned = wasPinned
            ? s.pinnedTabs.filter(id => id !== noteId)
            : s.pinnedTabs;
          const newOpen = wasOpen
            ? s.openTabs.filter(id => id !== noteId)
            : s.openTabs;

          const newTabGroups = s.tabGroups
            .map(group => group.filter(id => id !== noteId))
            .filter(group => group.length > 1);

          let newActiveId = s.activeTabId;
          if (s.activeTabId === noteId) {
            const allTabs = [...newPinned, ...newOpen];
            const oldAllTabs = [...s.pinnedTabs, ...s.openTabs];
            const oldIndex = oldAllTabs.indexOf(noteId);
            newActiveId
              = allTabs.length > 0
                ? (allTabs[Math.min(oldIndex, allTabs.length - 1)] ?? null)
                : null;
          }

          // Check if closed tab was part of split pair
          let newSplitView = s.splitView;
          if (s.splitView.splitPair?.includes(noteId)) {
            // Clear the split pair since one of the tabs is now closed
            const remainingTabId = s.splitView.splitPair.find(id => id !== noteId);
            newSplitView = {
              enabled: false,
              orientation: 'vertical',
              panes: [remainingTabId || newActiveId || ''] as [string],
              sizes: [50, 50],
              splitPair: null,
              activePaneIndex: 0,
            };
            // If we closed the active tab in split, set remaining as active
            if (s.activeTabId === noteId && remainingTabId) {
              newActiveId = remainingTabId;
            }
          }

          return {
            pinnedTabs: newPinned,
            openTabs: newOpen,
            tabGroups: newTabGroups,
            activeTabId: newActiveId,
            splitView: newSplitView,
          };
        }),

      pinTab: noteId =>
        set(s => ({
          openTabs: s.openTabs.filter(id => id !== noteId),
          pinnedTabs: s.pinnedTabs.includes(noteId)
            ? s.pinnedTabs
            : [...s.pinnedTabs, noteId],
        })),

      unpinTab: noteId =>
        set(s =>
          !s.pinnedTabs.includes(noteId)
            ? s
            : {
                pinnedTabs: s.pinnedTabs.filter(id => id !== noteId),
                openTabs: s.openTabs.includes(noteId)
                  ? s.openTabs
                  : [...s.openTabs, noteId],
              },
        ),

      reorderTabs: (activeId, overId, section) =>
        set((s) => {
          const list = section === 'pinned' ? s.pinnedTabs : s.openTabs;
          const oldIndex = list.indexOf(activeId);
          const newIndex = list.indexOf(overId);

          if (oldIndex === -1 || newIndex === -1)
            return s;

          const reordered = arrayMove(list, oldIndex, newIndex);
          return section === 'pinned'
            ? { pinnedTabs: reordered }
            : { openTabs: reordered };
        }),

      setActiveTab: noteId =>
        set((s) => {
          // Check if this tab is part of a split pair
          const splitPair = s.splitView.splitPair;
          const isInPair = splitPair && splitPair.includes(noteId);

          if (isInPair && splitPair) {
            // Restore the split view with this pair
            return {
              activeTabId: noteId,
              splitView: {
                enabled: true,
                orientation: s.splitView.orientation,
                panes: splitPair,
                sizes: s.splitView.sizes,
                splitPair,
                activePaneIndex: s.splitView.activePaneIndex,
              },
            };
          }

          if (s.splitView.enabled) {
            // Not in current split pair, hide split but keep pair remembered
            return {
              activeTabId: noteId,
              splitView: {
                ...s.splitView,
                enabled: false,
                panes: [noteId] as [string],
              },
            };
          }

          // When not in split mode, sync pane0 with active tab
          return {
            activeTabId: noteId,
            splitView: { ...s.splitView, panes: [noteId] as [string] },
          };
        }),

      cycleTab: direction =>
        set((s) => {
          const { notes } = useNotesStore.getState();

          const seen = new Set<string>();
          const orderedIds: string[] = [];

          const append = (noteId: string) => {
            if (seen.has(noteId))
              return;
            if (!notes.has(noteId))
              return;

            const group = s.tabGroups.find(g => g.includes(noteId));
            const ids = group ? group.filter(id => notes.has(id)) : [noteId];
            ids.forEach((id) => {
              if (!seen.has(id)) {
                seen.add(id);
                orderedIds.push(id);
              }
            });
          };

          s.pinnedTabs.forEach(append);
          s.openTabs.forEach(append);

          if (orderedIds.length === 0)
            return s;

          let nextActiveId: string | null = null;

          if (!s.activeTabId || !notes.has(s.activeTabId)) {
            nextActiveId
              = direction === 1
                ? orderedIds[0]
                : orderedIds[orderedIds.length - 1];
          }
          else {
            if (!seen.has(s.activeTabId))
              orderedIds.push(s.activeTabId);

            const currentIndex = orderedIds.indexOf(s.activeTabId);
            const safeIndex = currentIndex === -1 ? 0 : currentIndex;

            const nextIndex
              = (safeIndex + direction + orderedIds.length) % orderedIds.length;
            nextActiveId = orderedIds[nextIndex] ?? null;
          }

          if (!nextActiveId || nextActiveId === s.activeTabId)
            return s;

          // Apply same logic as setActiveTab for split view handling
          const splitPair = s.splitView.splitPair;
          const isInPair = splitPair && splitPair.includes(nextActiveId);

          if (isInPair && splitPair) {
            return {
              activeTabId: nextActiveId,
              splitView: {
                enabled: true,
                orientation: s.splitView.orientation,
                panes: splitPair,
                sizes: s.splitView.sizes,
                splitPair,
                activePaneIndex: s.splitView.activePaneIndex,
              },
            };
          }

          if (s.splitView.enabled) {
            return {
              activeTabId: nextActiveId,
              splitView: {
                ...s.splitView,
                enabled: false,
                panes: [nextActiveId] as [string],
              },
            };
          }

          return {
            activeTabId: nextActiveId,
            splitView: { ...s.splitView, panes: [nextActiveId] as [string] },
          };
        }),

      cyclePane: _direction =>
        set((s) => {
          if (!s.splitView.enabled || s.splitView.panes.length < 2)
            return s;

          const newIndex = s.splitView.activePaneIndex === 0 ? 1 : 0;
          const newActiveNoteId = s.splitView.panes[newIndex];

          if (!newActiveNoteId)
            return s;

          return {
            activeTabId: newActiveNoteId,
            splitView: {
              ...s.splitView,
              activePaneIndex: newIndex as 0 | 1,
            },
          };
        }),

      toggleTabBar: () => set(s => ({ isTabBarVisible: !s.isTabBarVisible })),

      addToGroup: (targetId, anchorId) =>
        set((s) => {
          const otherGroups = s.tabGroups.filter(
            g => !g.includes(targetId) && !g.includes(anchorId),
          );
          let newGroup = [targetId, anchorId];

          const existingAnchorGroup = s.tabGroups.find(g =>
            g.includes(anchorId),
          );
          if (existingAnchorGroup)
            newGroup = [...new Set([...existingAnchorGroup, targetId])];

          return { tabGroups: [...otherGroups, newGroup] };
        }),

      removeFromGroup: id =>
        set((s) => {
          const newGroups = s.tabGroups
            .map(g => g.filter(noteId => noteId !== id))
            .filter(g => g.length > 1);
          return { tabGroups: newGroups };
        }),

      // Split view actions
      createSplit: (targetNoteId, orientation, draggedFirst = false) =>
        set((s) => {
          // Use activeTabId or fallback to current pane0 as the anchor note
          const currentNoteId = s.activeTabId || s.splitView.panes[0];

          if (!currentNoteId || currentNoteId === targetNoteId) {
            return s;
          }

          // Ensure target note is in open tabs
          const newOpenTabs = s.openTabs.includes(targetNoteId)
            ? s.openTabs
            : [...s.openTabs, targetNoteId];

          const splitPair: [string, string] = draggedFirst
            ? [targetNoteId, currentNoteId]
            : [currentNoteId, targetNoteId];

          return {
            openTabs: newOpenTabs,
            splitView: {
              enabled: true,
              orientation,
              panes: splitPair,
              sizes: [50, 50] as [number, number],
              splitPair,
              activePaneIndex: 1,
            },
            activeTabId: targetNoteId,
          };
        }),

      closeSplit: paneIndex =>
        set((s) => {
          if (!s.splitView.enabled || s.splitView.panes.length < 2)
            return s;

          const remainingPaneIndex = paneIndex === 0 ? 1 : 0;
          const remainingNoteId = s.splitView.panes[remainingPaneIndex];

          if (!remainingNoteId)
            return s;

          // Clear the splitPair when explicitly closing the split
          return {
            splitView: {
              enabled: false,
              orientation: 'vertical',
              panes: [remainingNoteId],
              sizes: [50, 50],
              splitPair: null,
              activePaneIndex: 0,
            },
            activeTabId: remainingNoteId,
          };
        }),

      closeSplitPair: () =>
        set((s) => {
          // Just clear the splitPair, keeping the current view as-is
          if (!s.splitView.splitPair)
            return s;

          const currentNoteId = s.activeTabId || s.splitView.panes[0];
          return {
            splitView: {
              enabled: false,
              orientation: 'vertical',
              panes: currentNoteId ? [currentNoteId] : [''],
              sizes: [50, 50],
              splitPair: null,
              activePaneIndex: 0,
            },
          };
        }),

      setSplitSizes: sizes =>
        set(s => ({
          splitView: { ...s.splitView, sizes },
        })),

      swapPanes: () =>
        set((s) => {
          if (!s.splitView.enabled || s.splitView.panes.length < 2)
            return s;

          const [pane0, pane1] = s.splitView.panes as [string, string];
          const newPanes: [string, string] = [pane1, pane0];
          return {
            splitView: {
              ...s.splitView,
              panes: newPanes,
              sizes: [s.splitView.sizes[1], s.splitView.sizes[0]],
              splitPair: newPanes,
            },
          };
        }),

      toggleOrientation: () =>
        set((s) => {
          if (!s.splitView.enabled)
            return s;

          const newOrientation
            = s.splitView.orientation === 'horizontal' ? 'vertical' : 'horizontal';
          return {
            splitView: {
              ...s.splitView,
              orientation: newOrientation,
            },
          };
        }),

      replacePaneContent: (paneIndex, noteId) =>
        set((s) => {
          if (!s.splitView.enabled) {
            // No split, just set the active note
            return {
              activeTabId: noteId,
              splitView: { ...s.splitView, panes: [noteId] },
            };
          }

          const newPanes = [...s.splitView.panes] as [string, string];
          newPanes[paneIndex] = noteId;

          // Ensure note is in open tabs
          const newOpenTabs = s.openTabs.includes(noteId)
            ? s.openTabs
            : [...s.openTabs, noteId];

          return {
            openTabs: newOpenTabs,
            activeTabId: noteId,
            splitView: { ...s.splitView, panes: newPanes },
          };
        }),
    }),
    {
      name: 'notara:tabs',
      onRehydrateStorage: () => (state) => {
        // After hydration, ensure there's a valid active tab
        if (!state)
          return;

        const { notes } = useNotesStore.getState();

        // Validate tabs
        state.pinnedTabs = state.pinnedTabs.filter(id => notes.has(id));
        state.openTabs = state.openTabs.filter(id => notes.has(id));

        // Validate splitView panes
        const validPanes = state.splitView.panes.filter(
          id => id && notes.has(id),
        );
        if (validPanes.length === 0 && state.activeTabId && notes.has(state.activeTabId)) {
          // No valid panes but we have an active tab - use it
          state.splitView = {
            ...state.splitView,
            enabled: false,
            panes: [state.activeTabId],
          };
        }
        else if (validPanes.length === 1) {
          state.splitView = {
            ...state.splitView,
            enabled: false,
            panes: [validPanes[0]!],
          };
        }
        else if (validPanes.length >= 2) {
          state.splitView = {
            ...state.splitView,
            panes: [validPanes[0]!, validPanes[1]!],
          };
        }

        if (state.activeTabId && notes.has(state.activeTabId)) {
          if (
            !state.pinnedTabs.includes(state.activeTabId)
            && !state.openTabs.includes(state.activeTabId)
          ) {
            state.openTabs = [...state.openTabs, state.activeTabId];
          }

          // Ensure pane0 is set if empty
          if (!state.splitView.panes[0] || state.splitView.panes[0] === '') {
            state.splitView = {
              ...state.splitView,
              panes: [state.activeTabId],
            };
          }

          return;
        }

        // Select first valid tab as active
        const validTabs = [...state.pinnedTabs, ...state.openTabs];
        if (validTabs.length > 0) {
          state.activeTabId = validTabs[0]!;
          // Also update pane0
          if (!state.splitView.panes[0] || state.splitView.panes[0] === '') {
            state.splitView = {
              ...state.splitView,
              panes: [validTabs[0]!],
            };
          }
        }
      },
    },
  ),
);

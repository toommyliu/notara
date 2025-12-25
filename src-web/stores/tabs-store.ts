import { create } from "zustand";
import { persist } from "zustand/middleware";
import { arrayMove } from "@dnd-kit/sortable";
import { useNotesStore } from "./notes-store";

type TabsState = {
    pinnedTabs: string[];
    openTabs: string[];
    tabGroups: string[][];
    activeTabId: string | null;
    isTabBarVisible: boolean;
};

type TabsActions = {
    openTab: (noteId: string) => void;
    closeTab: (noteId: string) => void;
    pinTab: (noteId: string) => void;
    unpinTab: (noteId: string) => void;
    reorderTabs: (activeId: string, overId: string, section: "pinned" | "open") => void;
    setActiveTab: (noteId: string) => void;
    cycleTab: (direction: 1 | -1) => void;
    toggleTabBar: () => void;
    addToGroup: (targetId: string, anchorId: string) => void;
    removeFromGroup: (id: string) => void;
};

export const useTabsStore = create<TabsState & TabsActions>()(
    persist(
        (set) => ({
            pinnedTabs: [],
            openTabs: [],
            tabGroups: [],
            activeTabId: null,
            isTabBarVisible: true,

            openTab: (noteId) =>
                set((s) =>
                    s.pinnedTabs.includes(noteId) || s.openTabs.includes(noteId)
                        ? { activeTabId: noteId }
                        : { openTabs: [...s.openTabs, noteId], activeTabId: noteId }
                ),

            closeTab: (noteId) =>
                set((s) => {
                    const wasPinned = s.pinnedTabs.includes(noteId);
                    const wasOpen = s.openTabs.includes(noteId);
                    if (!wasPinned && !wasOpen) return s;

                    const newPinned = wasPinned ? s.pinnedTabs.filter((id) => id !== noteId) : s.pinnedTabs;
                    const newOpen = wasOpen ? s.openTabs.filter((id) => id !== noteId) : s.openTabs;

                    const newTabGroups = s.tabGroups.map(group => group.filter(id => id !== noteId))
                        .filter(group => group.length > 1);

                    let newActiveId = s.activeTabId;
                    if (s.activeTabId === noteId) {
                        const allTabs = [...newPinned, ...newOpen];
                        const oldAllTabs = [...s.pinnedTabs, ...s.openTabs];
                        const oldIndex = oldAllTabs.indexOf(noteId);
                        newActiveId = allTabs.length > 0
                            ? allTabs[Math.min(oldIndex, allTabs.length - 1)] ?? null
                            : null;
                    }

                    return {
                        pinnedTabs: newPinned,
                        openTabs: newOpen,
                        tabGroups: newTabGroups,
                        activeTabId: newActiveId
                    };
                }),

            pinTab: (noteId) =>
                set((s) => ({
                    openTabs: s.openTabs.filter((id) => id !== noteId),
                    pinnedTabs: s.pinnedTabs.includes(noteId) ? s.pinnedTabs : [...s.pinnedTabs, noteId],
                })),

            unpinTab: (noteId) =>
                set((s) =>
                    !s.pinnedTabs.includes(noteId)
                        ? s
                        : {
                            pinnedTabs: s.pinnedTabs.filter((id) => id !== noteId),
                            openTabs: s.openTabs.includes(noteId) ? s.openTabs : [...s.openTabs, noteId],
                        }
                ),

            reorderTabs: (activeId, overId, section) =>
                set((s) => {
                    const list = section === "pinned" ? s.pinnedTabs : s.openTabs;
                    const oldIndex = list.indexOf(activeId);
                    const newIndex = list.indexOf(overId);

                    if (oldIndex === -1 || newIndex === -1)
                        return s;

                    const reordered = arrayMove(list, oldIndex, newIndex);
                    return section === "pinned" ? { pinnedTabs: reordered } : { openTabs: reordered };
                }),

            setActiveTab: (noteId) => set({ activeTabId: noteId }),

            cycleTab: (direction) => set((s) => {
                const { notes } = useNotesStore.getState();

                const seen = new Set<string>();
                const orderedIds: string[] = [];

                const append = (noteId: string) => {
                    if (seen.has(noteId)) return;
                    if (!notes.has(noteId)) return;

                    const group = s.tabGroups.find(g => g.includes(noteId));
                    const ids = group ? group.filter(id => notes.has(id)) : [noteId];
                    ids.forEach(id => {
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

                if (!s.activeTabId || !notes.has(s.activeTabId)) {
                    const nextActiveId = direction === 1 ? orderedIds[0] : orderedIds[orderedIds.length - 1];
                    return nextActiveId ? { activeTabId: nextActiveId } : s;
                }

                if (!seen.has(s.activeTabId))
                    orderedIds.push(s.activeTabId);

                const currentIndex = orderedIds.indexOf(s.activeTabId);
                const safeIndex = currentIndex === -1 ? 0 : currentIndex;

                const nextIndex = (safeIndex + direction + orderedIds.length) % orderedIds.length;
                const nextActiveId = orderedIds[nextIndex];

                if (!nextActiveId || nextActiveId === s.activeTabId)
                    return s;

                return { activeTabId: nextActiveId };
            }),

            toggleTabBar: () => set((s) => ({ isTabBarVisible: !s.isTabBarVisible })),

            addToGroup: (targetId, anchorId) => set((s) => {
                const otherGroups = s.tabGroups.filter(g => !g.includes(targetId) && !g.includes(anchorId));
                let newGroup = [targetId, anchorId];

                const existingAnchorGroup = s.tabGroups.find(g => g.includes(anchorId));
                if (existingAnchorGroup)
                    newGroup = [...new Set([...existingAnchorGroup, targetId])];

                return { tabGroups: [...otherGroups, newGroup] };
            }),

            removeFromGroup: (id) => set((s) => {
                const newGroups = s.tabGroups.map(g => g.filter(noteId => noteId !== id))
                    .filter(g => g.length > 1);
                return { tabGroups: newGroups };
            })
        }),
        {
            name: "notara:tabs",
            onRehydrateStorage: () => (state) => {
                // After hydration, ensure there's a valid active tab
                if (!state)
                    return;

                const { notes } = useNotesStore.getState();

                // Validate tabs
                state.pinnedTabs = state.pinnedTabs.filter((id) => notes.has(id));
                state.openTabs = state.openTabs.filter((id) => notes.has(id));

                if (state.activeTabId && notes.has(state.activeTabId)) {
                    if (!state.pinnedTabs.includes(state.activeTabId) && !state.openTabs.includes(state.activeTabId))
                        state.openTabs = [...state.openTabs, state.activeTabId];

                    return;
                }

                // Select first valid tab as active
                const validTabs = [...state.pinnedTabs, ...state.openTabs];
                if (validTabs.length > 0)
                    state.activeTabId = validTabs[0]!;
            },
        }
    )
);

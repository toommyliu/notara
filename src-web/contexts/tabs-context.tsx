import { createContext, useCallback, useState, type PropsWithChildren } from "react";
import { arrayMove } from "@dnd-kit/sortable";

const TABS_STORAGE_KEY = "notara:tabs";

type TabsState = {
    pinnedTabs: string[];
    openTabs: string[];
    activeTabId: string | null;
    isTabBarVisible: boolean;
};

type TabsContextValue = TabsState & {
    openTab: (noteId: string) => void;
    closeTab: (noteId: string) => void;
    pinTab: (noteId: string) => void;
    unpinTab: (noteId: string) => void;
    reorderTabs: (activeId: string, overId: string, section: "pinned" | "open") => void;
    setActiveTab: (noteId: string) => void;
    toggleTabBar: () => void;
};

export const TabsContext = createContext<TabsContextValue | null>(null);

const DEFAULT_STATE: TabsState = {
    pinnedTabs: [],
    openTabs: [],
    activeTabId: null,
    isTabBarVisible: true,
};

function loadTabsState(): TabsState {
    try {
        const stored = localStorage.getItem(TABS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored) as Partial<TabsState>;
            return {
                pinnedTabs: Array.isArray(parsed.pinnedTabs) ? parsed.pinnedTabs : [],
                openTabs: Array.isArray(parsed.openTabs) ? parsed.openTabs : [],
                activeTabId: parsed.activeTabId ?? null,
                isTabBarVisible: typeof parsed.isTabBarVisible === "boolean" ? parsed.isTabBarVisible : true,
            };
        }
    } catch {
        // Ignore parse errors
    }
    return DEFAULT_STATE;
}

function saveTabsState(state: TabsState) {
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(state));
}

export function TabsProvider({ children }: PropsWithChildren) {
    const [state, setState] = useState<TabsState>(loadTabsState);

    const updateState = useCallback((updater: (prev: TabsState) => TabsState) => {
        setState((prev) => {
            const next = updater(prev);
            saveTabsState(next);
            return next;
        });
    }, []);

    const openTab = useCallback((noteId: string) => {
        updateState((prev) => {
            // If already pinned or open, just activate
            if (prev.pinnedTabs.includes(noteId) || prev.openTabs.includes(noteId)) {
                return { ...prev, activeTabId: noteId };
            }

            // Add to open tabs
            return {
                ...prev,
                openTabs: [...prev.openTabs, noteId],
                activeTabId: noteId,
            };
        });
    }, [updateState]);

    const closeTab = useCallback((noteId: string) => {
        updateState((prev) => {
            const wasPinned = prev.pinnedTabs.includes(noteId);
            const wasOpen = prev.openTabs.includes(noteId);

            if (!wasPinned && !wasOpen) return prev;

            const newPinned = wasPinned ? prev.pinnedTabs.filter((id) => id !== noteId) : prev.pinnedTabs;
            const newOpen = wasOpen ? prev.openTabs.filter((id) => id !== noteId) : prev.openTabs;

            // If closing active tab, switch to adjacent
            let newActiveId = prev.activeTabId;
            if (prev.activeTabId === noteId) {
                const allTabs = [...newPinned, ...newOpen];
                const oldAllTabs = [...prev.pinnedTabs, ...prev.openTabs];
                const oldIndex = oldAllTabs.indexOf(noteId);

                if (allTabs.length > 0) {
                    // Try to activate the tab at the same position, or the one before
                    newActiveId = allTabs[Math.min(oldIndex, allTabs.length - 1)] ?? allTabs[allTabs.length - 1] ?? null;
                } else {
                    newActiveId = null;
                }
            }

            return {
                ...prev,
                pinnedTabs: newPinned,
                openTabs: newOpen,
                activeTabId: newActiveId,
            };
        });
    }, [updateState]);

    const pinTab = useCallback((noteId: string) => {
        updateState((prev) => {
            // Remove from open tabs if present
            const newOpen = prev.openTabs.filter((id) => id !== noteId);
            // Add to pinned if not already
            const newPinned = prev.pinnedTabs.includes(noteId)
                ? prev.pinnedTabs
                : [...prev.pinnedTabs, noteId];

            return {
                ...prev,
                pinnedTabs: newPinned,
                openTabs: newOpen,
            };
        });
    }, [updateState]);

    const unpinTab = useCallback((noteId: string) => {
        updateState((prev) => {
            if (!prev.pinnedTabs.includes(noteId)) return prev;

            // Move from pinned to open
            return {
                ...prev,
                pinnedTabs: prev.pinnedTabs.filter((id) => id !== noteId),
                openTabs: prev.openTabs.includes(noteId)
                    ? prev.openTabs
                    : [...prev.openTabs, noteId],
            };
        });
    }, [updateState]);

    const reorderTabs = useCallback((activeId: string, overId: string, section: "pinned" | "open") => {
        updateState((prev) => {
            const list = section === "pinned" ? prev.pinnedTabs : prev.openTabs;
            const oldIndex = list.indexOf(activeId);
            const newIndex = list.indexOf(overId);

            if (oldIndex === -1 || newIndex === -1) return prev;

            const reordered = arrayMove(list, oldIndex, newIndex);

            return section === "pinned"
                ? { ...prev, pinnedTabs: reordered }
                : { ...prev, openTabs: reordered };
        });
    }, [updateState]);

    const setActiveTab = useCallback((noteId: string) => {
        updateState((prev) => ({ ...prev, activeTabId: noteId }));
    }, [updateState]);

    const toggleTabBar = useCallback(() => {
        updateState((prev) => ({ ...prev, isTabBarVisible: !prev.isTabBarVisible }));
    }, [updateState]);

    return (
        <TabsContext.Provider
            value={{
                ...state,
                openTab,
                closeTab,
                pinTab,
                unpinTab,
                reorderTabs,
                setActiveTab,
                toggleTabBar,
            }}
        >
            {children}
        </TabsContext.Provider>
    );
}

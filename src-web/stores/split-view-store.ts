import { create } from "zustand";
import { nanoid } from "nanoid";

export type Pane = {
    id: string;
    noteId: string | null;
};

type SplitViewState = {
    panes: Pane[];
    activePaneId: string;
};

type SplitViewActions = {
    /** Open a note in a specific pane */
    openInPane: (paneId: string, noteId: string) => void;
    /** Add a new pane at position with optional note */
    addPane: (position: "left" | "right", noteId?: string) => void;
    /** Remove a pane by ID, collapsing split if only one remains */
    removePane: (paneId: string) => void;
    /** Set which pane is currently active/focused */
    setActivePane: (paneId: string) => void;
    /** Open note in the currently active pane */
    openInActivePane: (noteId: string) => void;
    /** Reset to single-pane view */
    resetToSinglePane: () => void;
    /** Swap the contents of the two panes */
    swapPanes: () => void;
};

const createDefaultPane = (): Pane => ({
    id: nanoid(8),
    noteId: null,
});

const initialPane = createDefaultPane();

export const useSplitViewStore = create<SplitViewState & SplitViewActions>()((set, get) => ({
    panes: [initialPane],
    activePaneId: initialPane.id,

    openInPane: (paneId, noteId) =>
        set((s) => ({
            panes: s.panes.map((p) =>
                p.id === paneId ? { ...p, noteId } : p
            ),
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

            const newPanes =
                position === "left"
                    ? [newPane, ...s.panes]
                    : [...s.panes, newPane];

            return {
                panes: newPanes,
                activePaneId: newPane.id,
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
                    ? remainingPanes[0]?.id ?? s.activePaneId
                    : s.activePaneId,
            };
        }),

    setActivePane: (paneId) => set({ activePaneId: paneId }),

    openInActivePane: (noteId) => {
        const { activePaneId } = get();
        set((s) => ({
            panes: s.panes.map((p) =>
                p.id === activePaneId ? { ...p, noteId } : p
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
            if (s.panes.length !== 2)
                return s;

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
}));

export const useActivePaneNoteId = () =>
    useSplitViewStore((s) => {
        const activePane = s.panes.find((p) => p.id === s.activePaneId);
        return activePane?.noteId ?? null;
    });

export const useIsSplitView = () =>
    useSplitViewStore((s) => s.panes.length > 1);

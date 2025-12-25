import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";

import type { BlockTypeValue } from "~/components/editor/utils/block-utils";

export type Block = {
    id: string;
    type: BlockTypeValue;
    content: string;
    indent?: number;
    language?: string;
};

export type Note = {
    id: string;
    title: string;
    emoji: string;
    content?: Block[];
    showTOC?: boolean;
};

export type SortOrder = "manual" | "a-z" | "z-a" | "newest" | "oldest";

export type Group = {
    id: string;
    title: string;
    isCollapsed: boolean;
    noteIds: string[];
    sortOrder: SortOrder;
    displayLimit: number | null;
};

type NotesState = {
    groups: Group[];
    notes: Map<string, Note>;
    activeNoteId: string | null;
};

type NotesActions = {
    selectNote: (noteId: string) => void;
    addNote: (groupId?: string, title?: string, emoji?: string) => string;
    updateNote: (noteId: string, updates: Partial<Omit<Note, "id">>) => void;
    duplicateNote: (noteId: string) => string | null;
    deleteNote: (noteId: string) => void;
    addGroup: (title?: string) => void;
    toggleGroupCollapse: (groupId: string) => void;
    reorderGroups: (activeId: string, overId: string) => void;
    moveNote: (noteId: string, fromGroupId: string, toGroupId: string, overNoteId?: string) => void;
    reorderNotesInGroup: (groupId: string, activeId: string, overId: string) => void;
    sortGroup: (groupId: string, sortOrder: SortOrder) => void;
    setGroupDisplayLimit: (groupId: string, limit: number | null) => void;
    sortData: () => void;
};

type NotesStore = NotesState & NotesActions & {
    activeNote: Note | null;
};

const INITIAL_NOTES: Note[] = [
    { id: "note-1", title: "My First Note", emoji: "📝", content: [{ id: "b1", type: "text", content: "Welcome to Notara!" }] },
    { id: "note-2", title: "Project Ideas", emoji: "💡" },
    { id: "note-3", title: "Meeting Notes", emoji: "📋" },
    { id: "note-4", title: "Reading List", emoji: "📚" },
    { id: "note-5", title: "Travel Plans", emoji: "✈️" },
];

const INITIAL_GROUPS: Group[] = [
    { id: "group-ungrouped", title: "Ungrouped", isCollapsed: false, noteIds: [], sortOrder: "manual", displayLimit: null },
    { id: "group-private", title: "Private", isCollapsed: false, noteIds: ["note-1", "note-2", "note-3"], sortOrder: "manual", displayLimit: null },
    { id: "group-work", title: "Work", isCollapsed: false, noteIds: ["note-4", "note-5"], sortOrder: "manual", displayLimit: null },
];

export const useNotesStore = create<NotesStore>()((set, get) => ({
    groups: INITIAL_GROUPS,
    notes: new Map(INITIAL_NOTES.map((n) => [n.id, n])),
    activeNoteId: "note-1",

    get activeNote() {
        const { activeNoteId, notes } = get();
        return activeNoteId ? notes.get(activeNoteId) ?? null : null;
    },

    selectNote: (noteId) => set({ activeNoteId: noteId }),

    addNote: (groupId, title = "Untitled", emoji = "📝") => {
        const id = `note-${crypto.randomUUID()}`;
        const targetGroupId = groupId || "group-ungrouped";

        const sampleBlocks: Block[] = [
            { id: crypto.randomUUID(), type: "h1", content: "Sample Note with Markdown" },
            { id: crypto.randomUUID(), type: "text", content: "This note contains **bold**, *italic*, and `inline code` for testing." },
            { id: crypto.randomUUID(), type: "h2", content: "A Second Heading" },
            { id: crypto.randomUUID(), type: "bullet", content: "First bullet point" },
            { id: crypto.randomUUID(), type: "bullet", content: "Second bullet with **bold text**" },
            { id: crypto.randomUUID(), type: "quote", content: "This is a blockquote for testing" },
            { id: crypto.randomUUID(), type: "text", content: "" },
        ];

        set((s) => {
            const newNotes = new Map(s.notes);
            newNotes.set(id, { id, title, emoji, content: sampleBlocks });

            return {
                notes: newNotes,
                groups: s.groups.map((g) =>
                    g.id === targetGroupId ? { ...g, noteIds: [...g.noteIds, id] } : g
                ),
                activeNoteId: id,
            };
        });

        return id;
    },

    updateNote: (noteId, updates) =>
        set((s) => {
            const note = s.notes.get(noteId);
            if (!note) return s;

            const newNotes = new Map(s.notes);
            newNotes.set(noteId, { ...note, ...updates });
            return { notes: newNotes };
        }),

    duplicateNote: (noteId) => {
        const note = get().notes.get(noteId);
        if (!note) return null;

        const newId = `note-${crypto.randomUUID()}`;
        const newNote: Note = {
            ...note,
            id: newId,
            title: `${note.title} (copy)`,
            content: note.content ? [...note.content] : undefined,
        };

        set((s) => {
            const newNotes = new Map(s.notes);
            newNotes.set(newId, newNote);

            // Find which group contains the original and insert after it
            const groups = s.groups.map((g) => {
                const idx = g.noteIds.indexOf(noteId);
                if (idx !== -1) {
                    const newNoteIds = [...g.noteIds];
                    newNoteIds.splice(idx + 1, 0, newId);
                    return { ...g, noteIds: newNoteIds };
                }
                return g;
            });

            return { notes: newNotes, groups, activeNoteId: newId };
        });

        return newId;
    },

    deleteNote: (noteId) =>
        set((s) => {
            const newNotes = new Map(s.notes);
            newNotes.delete(noteId);

            const groups = s.groups.map((g) => ({
                ...g,
                noteIds: g.noteIds.filter((id) => id !== noteId),
            }));

            // Update active note if we deleted the active one
            let activeNoteId = s.activeNoteId;
            if (activeNoteId === noteId) {
                const allNoteIds = groups.flatMap((g) => g.noteIds);
                activeNoteId = allNoteIds[0] ?? null;
            }

            return { notes: newNotes, groups, activeNoteId };
        }),

    addGroup: (title) =>
        set((s) => ({
            groups: [...s.groups, { id: `group-${crypto.randomUUID()}`, title: title || "New Group", isCollapsed: false, noteIds: [], sortOrder: "manual" as const, displayLimit: null }],
        })),

    toggleGroupCollapse: (groupId) =>
        set((s) => ({
            groups: s.groups.map((g) => (g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g)),
        })),

    reorderGroups: (activeId, overId) =>
        set((s) => {
            const oldIndex = s.groups.findIndex((g) => g.id === activeId);
            const newIndex = s.groups.findIndex((g) => g.id === overId);

            if (oldIndex === -1 || newIndex === -1)
                return s;

            return { groups: arrayMove(s.groups, oldIndex, newIndex) };
        }),

    moveNote: (noteId, fromGroupId, toGroupId, overNoteId) =>
        set((s) => ({
            groups: s.groups.map((group) => {
                if (group.id === fromGroupId)
                    return { ...group, noteIds: group.noteIds.filter((id) => id !== noteId) };

                if (group.id === toGroupId) {
                    const newNoteIds = group.noteIds.filter((id) => id !== noteId);
                    if (overNoteId) {
                        const overIndex = newNoteIds.indexOf(overNoteId);
                        if (overIndex !== -1) {
                            newNoteIds.splice(overIndex, 0, noteId);
                        } else {
                            newNoteIds.push(noteId);
                        }
                    } else {
                        newNoteIds.push(noteId);
                    }

                    return { ...group, noteIds: newNoteIds };
                }
                return group;
            }),
        })),

    reorderNotesInGroup: (groupId, activeId, overId) =>
        set((s) => ({
            groups: s.groups.map((group) => {
                if (group.id !== groupId)
                    return group;

                const oldIndex = group.noteIds.indexOf(activeId);
                const newIndex = group.noteIds.indexOf(overId);

                if (oldIndex === -1 || newIndex === -1)
                    return group;

                return { ...group, noteIds: arrayMove(group.noteIds, oldIndex, newIndex) };
            }),
        })),

    sortData: () =>
        set((s) => {
            // Sort groups alphabetically
            const sortedGroups = [...s.groups].sort((a, b) => a.title.localeCompare(b.title));

            // Sort notes within each group alphabetically
            const sortedGroupsWithSortedNotes = sortedGroups.map((group) => {
                const groupNotes = group.noteIds
                    .map((id) => s.notes.get(id))
                    .filter((n): n is Note => n !== undefined);

                groupNotes.sort((a, b) => a.title.localeCompare(b.title));

                return {
                    ...group,
                    noteIds: groupNotes.map((n) => n.id),
                };
            });

            return { groups: sortedGroupsWithSortedNotes };
        }),

    sortGroup: (groupId, sortOrder) =>
        set((s) => ({
            groups: s.groups.map((group) => {
                if (group.id !== groupId)
                    return group;

                if (sortOrder === "manual")
                    return { ...group, sortOrder };

                const groupNotes = group.noteIds
                    .map((id) => s.notes.get(id))
                    .filter((n): n is Note => n !== undefined);

                if (sortOrder === "a-z") {
                    groupNotes.sort((a, b) => a.title.localeCompare(b.title));
                } else if (sortOrder === "z-a") {
                    groupNotes.sort((a, b) => b.title.localeCompare(a.title));
                }

                return {
                    ...group,
                    sortOrder,
                    noteIds: groupNotes.map((n) => n.id),
                };
            }),
        })),

    setGroupDisplayLimit: (groupId, limit) =>
        set((s) => ({
            groups: s.groups.map((g) => (g.id === groupId ? { ...g, displayLimit: limit } : g)),
        })),
}));

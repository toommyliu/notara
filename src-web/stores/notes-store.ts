import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";

export type Note = {
    id: string;
    title: string;
    emoji: string;
};

export type Group = {
    id: string;
    title: string;
    isCollapsed: boolean;
    noteIds: string[];
};

type NotesState = {
    groups: Group[];
    notes: Map<string, Note>;
    activeNoteId: string | null;
};

type NotesActions = {
    selectNote: (noteId: string) => void;
    addNote: (groupId: string, title?: string, emoji?: string) => string;
    updateNote: (noteId: string, updates: Partial<Omit<Note, "id">>) => void;
    addGroup: (title?: string) => void;
    toggleGroupCollapse: (groupId: string) => void;
    reorderGroups: (activeId: string, overId: string) => void;
    moveNote: (noteId: string, fromGroupId: string, toGroupId: string, overNoteId?: string) => void;
    reorderNotesInGroup: (groupId: string, activeId: string, overId: string) => void;
};

type NotesStore = NotesState & NotesActions & {
    activeNote: Note | null;
};

const INITIAL_NOTES: Note[] = [
    { id: "note-1", title: "My First Note", emoji: "📝" },
    { id: "note-2", title: "Project Ideas", emoji: "💡" },
    { id: "note-3", title: "Meeting Notes", emoji: "📋" },
    { id: "note-4", title: "Reading List", emoji: "📚" },
    { id: "note-5", title: "Travel Plans", emoji: "✈️" },
];

const INITIAL_GROUPS: Group[] = [
    { id: "group-private", title: "Private", isCollapsed: false, noteIds: ["note-1", "note-2", "note-3"] },
    { id: "group-work", title: "Work", isCollapsed: false, noteIds: ["note-4", "note-5"] },
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
        set((s) => {
            const newNotes = new Map(s.notes);
            newNotes.set(id, { id, title, emoji });
            return {
                notes: newNotes,
                groups: s.groups.map((g) =>
                    g.id === groupId ? { ...g, noteIds: [...g.noteIds, id] } : g
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

    addGroup: (title) =>
        set((s) => ({
            groups: [...s.groups, { id: `group-${crypto.randomUUID()}`, title: title || "New Group", isCollapsed: false, noteIds: [] }],
        })),

    toggleGroupCollapse: (groupId) =>
        set((s) => ({
            groups: s.groups.map((g) => (g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g)),
        })),

    reorderGroups: (activeId, overId) =>
        set((s) => {
            const oldIndex = s.groups.findIndex((g) => g.id === activeId);
            const newIndex = s.groups.findIndex((g) => g.id === overId);
            if (oldIndex === -1 || newIndex === -1) return s;
            return { groups: arrayMove(s.groups, oldIndex, newIndex) };
        }),

    moveNote: (noteId, fromGroupId, toGroupId, overNoteId) =>
        set((s) => ({
            groups: s.groups.map((group) => {
                if (group.id === fromGroupId) {
                    return { ...group, noteIds: group.noteIds.filter((id) => id !== noteId) };
                }
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
                if (group.id !== groupId) return group;
                const oldIndex = group.noteIds.indexOf(activeId);
                const newIndex = group.noteIds.indexOf(overId);
                if (oldIndex === -1 || newIndex === -1) return group;
                return { ...group, noteIds: arrayMove(group.noteIds, oldIndex, newIndex) };
            }),
        })),
}));

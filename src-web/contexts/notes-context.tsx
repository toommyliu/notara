import { createContext, useCallback, useState, type PropsWithChildren } from "react";
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

type NotesContextState = {
    groups: Group[];
    notes: Map<string, Note>;
    activeNoteId: string | null;
    activeNote: Note | null;

    // Actions
    selectNote: (noteId: string) => void;
    addNote: (groupId: string, title?: string, emoji?: string) => string;
    updateNote: (noteId: string, updates: Partial<Omit<Note, 'id'>>) => void;
    addGroup: (title?: string) => void;
    toggleGroupCollapse: (groupId: string) => void;
    reorderGroups: (activeId: string, overId: string) => void;
    moveNote: (noteId: string, fromGroupId: string, toGroupId: string, overNoteId?: string) => void;
    reorderNotesInGroup: (groupId: string, activeId: string, overId: string) => void;
};

export const NotesContext = createContext<NotesContextState | null>(null);

const INITIAL_NOTES: Note[] = [
    { id: "note-1", title: "My First Note", emoji: "📝" },
    { id: "note-2", title: "Project Ideas", emoji: "💡" },
    { id: "note-3", title: "Meeting Notes", emoji: "📋" },
    { id: "note-4", title: "Reading List", emoji: "📚" },
    { id: "note-5", title: "Travel Plans", emoji: "✈️" },
];

const INITIAL_GROUPS: Group[] = [
    {
        id: "group-private",
        title: "Private",
        isCollapsed: false,
        noteIds: ["note-1", "note-2", "note-3"],
    },
    {
        id: "group-work",
        title: "Work",
        isCollapsed: false,
        noteIds: ["note-4", "note-5"],
    },
];

export function NotesProvider({ children }: PropsWithChildren) {
    const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
    const [notes, setNotes] = useState<Map<string, Note>>(
        () => new Map(INITIAL_NOTES.map((n) => [n.id, n]))
    );
    const [activeNoteId, setActiveNoteId] = useState<string | null>("note-1");

    const activeNote = activeNoteId ? notes.get(activeNoteId) ?? null : null;

    const selectNote = useCallback((noteId: string) => {
        setActiveNoteId(noteId);
    }, []);

    const addNote = useCallback((groupId: string, title = "Untitled", emoji = "📝"): string => {
        const id = `note-${crypto.randomUUID()}`;
        const newNote: Note = { id, title, emoji };

        setNotes((prev) => {
            const next = new Map(prev);
            next.set(id, newNote);
            return next;
        });

        setGroups((prev) =>
            prev.map((g) =>
                g.id === groupId
                    ? { ...g, noteIds: [...g.noteIds, id] }
                    : g
            )
        );

        setActiveNoteId(id);
        return id;
    }, []);

    const updateNote = useCallback((noteId: string, updates: Partial<Omit<Note, 'id'>>) => {
        setNotes((prev) => {
            const note = prev.get(noteId);
            if (!note) return prev;
            const next = new Map(prev);
            next.set(noteId, { ...note, ...updates });
            return next;
        });
    }, []);

    const addGroup = useCallback((title?: string) => {
        const id = `group-${crypto.randomUUID()}`;
        setGroups((prev) => [
            ...prev,
            {
                id,
                title: title || "New Group",
                isCollapsed: false,
                noteIds: [],
            },
        ]);
    }, []);

    const toggleGroupCollapse = useCallback((groupId: string) => {
        setGroups((prev) =>
            prev.map((g) =>
                g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g
            )
        );
    }, []);

    const reorderGroups = useCallback((activeId: string, overId: string) => {
        setGroups((prev) => {
            const oldIndex = prev.findIndex((g) => g.id === activeId);
            const newIndex = prev.findIndex((g) => g.id === overId);
            if (oldIndex === -1 || newIndex === -1) return prev;
            return arrayMove(prev, oldIndex, newIndex);
        });
    }, []);

    const moveNote = useCallback(
        (noteId: string, fromGroupId: string, toGroupId: string, overNoteId?: string) => {
            setGroups((prev) => {
                return prev.map((group) => {
                    if (group.id === fromGroupId) {
                        // Remove from source group
                        return {
                            ...group,
                            noteIds: group.noteIds.filter((id) => id !== noteId),
                        };
                    }

                    if (group.id === toGroupId) {
                        // Add to target group
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
                });
            });
        },
        []
    );

    const reorderNotesInGroup = useCallback(
        (groupId: string, activeId: string, overId: string) => {
            setGroups((prev) =>
                prev.map((group) => {
                    if (group.id !== groupId) return group;
                    const oldIndex = group.noteIds.indexOf(activeId);
                    const newIndex = group.noteIds.indexOf(overId);
                    if (oldIndex === -1 || newIndex === -1) return group;
                    return {
                        ...group,
                        noteIds: arrayMove(group.noteIds, oldIndex, newIndex),
                    };
                })
            );
        },
        []
    );

    return (
        <NotesContext.Provider
            value={{
                groups,
                notes,
                activeNoteId,
                activeNote,
                selectNote,
                addNote,
                updateNote,
                addGroup,
                toggleGroupCollapse,
                reorderGroups,
                moveNote,
                reorderNotesInGroup,
            }}
        >
            {children}
        </NotesContext.Provider>
    );
}

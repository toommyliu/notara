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

    // Actions
    selectNote: (noteId: string) => void;
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
    const [notes] = useState<Map<string, Note>>(
        () => new Map(INITIAL_NOTES.map((n) => [n.id, n]))
    );
    const [activeNoteId, setActiveNoteId] = useState<string | null>("note-1");

    const selectNote = useCallback((noteId: string) => {
        setActiveNoteId(noteId);
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
                selectNote,
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

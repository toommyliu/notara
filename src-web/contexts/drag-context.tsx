import { createContext, useContext, useState, useCallback, type PropsWithChildren } from "react";

interface DragState {
    isDragging: boolean;
    draggedNoteId: string | null;
    source: "sidebar" | "tabs" | null;
}

interface DragContextValue extends DragState {
    startDrag: (noteId: string, source: "sidebar" | "tabs") => void;
    endDrag: () => void;
}

const DragContext = createContext<DragContextValue | null>(null);

export function useDragContext() {
    const context = useContext(DragContext);
    if (!context)
        throw new Error("useDragContext must be used within a DragProvider");

    return context;
}

type DragProviderProps = PropsWithChildren;

export function DragProvider({ children }: DragProviderProps) {
    const [dragState, setDragState] = useState<DragState>({
        isDragging: false,
        draggedNoteId: null,
        source: null,
    });

    const startDrag = useCallback((noteId: string, source: "sidebar" | "tabs") => {
        setDragState({
            isDragging: true,
            draggedNoteId: noteId,
            source,
        });
    }, []);

    const endDrag = useCallback(() => {
        setDragState({
            isDragging: false,
            draggedNoteId: null,
            source: null,
        });
    }, []);

    return (
        <DragContext.Provider
            value={{
                ...dragState,
                startDrag,
                endDrag,
            }}
        >
            {children}
        </DragContext.Provider>
    );
}

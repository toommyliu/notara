import { useState, useRef, useCallback, type WheelEvent } from "react";
import {
    DndContext,
    DragOverlay,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
    SortableContext,
    useSortable,
    horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import IconX from "~icons/lucide/x";

import { useTabs } from "~/hooks/use-tabs";
import { useNotes } from "~/hooks/use-notes";

import { cn } from "~/lib/utils";

type TabItemProps = {
    noteId: string;
    isActive: boolean;
    isPinned: boolean;
    onActivate: () => void;
    onClose: () => void;
};

function TabItem({
    noteId,
    isActive,
    isPinned,
    onActivate,
    onClose,
}: TabItemProps) {
    const { notes } = useNotes();
    const note = notes.get(noteId);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: noteId,
        data: { section: isPinned ? "pinned" : "open" },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (!note) return null;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative flex items-center gap-2 select-none",
                "transition-all duration-150 ease-out",
                "px-3 py-1.5 rounded-md shrink-0",
                isActive
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                isDragging && "opacity-50 shadow-lg"
            )}
            {...attributes}
            {...listeners}
        >
            <button
                onClick={onActivate}
                className="absolute inset-0 z-0"
                aria-label={`Open ${note.title}`}
            />

            <span className="text-sm shrink-0 relative z-10 pointer-events-none">
                {note.emoji}
            </span>

            <span className="text-sm font-medium relative z-10 pointer-events-none max-w-[120px] truncate">
                {note.title}
            </span>

            <div
                className={cn(
                    "relative z-10 flex items-center gap-0.5 shrink-0",
                    "opacity-0 group-hover:opacity-100 transition-opacity"
                )}
            >
                <button
                    onClick={(ev) => {
                        ev.stopPropagation();
                        onClose();
                    }}
                    className="p-0.5 rounded hover:bg-background/60 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close tab"
                >
                    <IconX className="size-3" />
                </button>
            </div>
        </div>
    );
}

function TabSection({
    noteIds,
    isPinned,
}: {
    noteIds: string[];
    isPinned: boolean;
}) {
    const { activeTabId, setActiveTab, closeTab } = useTabs();

    if (noteIds.length === 0) return null;

    return (
        <SortableContext
            items={noteIds}
            strategy={horizontalListSortingStrategy}
        >
            <div className="flex items-center gap-1">
                {noteIds.map((noteId) => (
                    <TabItem
                        key={noteId}
                        noteId={noteId}
                        isActive={activeTabId === noteId}
                        isPinned={isPinned}
                        onActivate={() => setActiveTab(noteId)}
                        onClose={() => closeTab(noteId)}
                    />
                ))}
            </div>
        </SortableContext>
    );
}

export function TabBar() {
    const { pinnedTabs, openTabs, reorderTabs, isTabBarVisible } = useTabs();
    const { notes } = useNotes();
    const [activeDragId, setActiveDragId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);

        if (!over || active.id === over.id) return;

        const activeSection = active.data.current?.section as "pinned" | "open";
        const overSection = over.data.current?.section as "pinned" | "open";

        // Only reorder within same section
        if (activeSection === overSection) {
            reorderTabs(active.id as string, over.id as string, activeSection);
        }
    };

    const draggedNote = activeDragId ? notes.get(activeDragId) : null;
    const hasTabs = pinnedTabs.length > 0 || openTabs.length > 0;

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleWheel = useCallback((ev: WheelEvent<HTMLDivElement>) => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Convert vertical scroll to horizontal scroll
        if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
            ev.preventDefault();
            container.scrollLeft += ev.deltaY;
        }
    }, []);

    if (!hasTabs || !isTabBarVisible) return null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div
                ref={scrollContainerRef}
                onWheel={handleWheel}
                className="h-10 border-b border-border/40 flex items-center px-2 overflow-x-auto overflow-y-hidden shrink-0 bg-background/80 backdrop-blur-sm scrollbar-custom"
                style={{
                    overscrollBehavior: 'contain',
                    touchAction: 'pan-x',
                }}
            >
                <TabSection
                    noteIds={pinnedTabs}
                    isPinned={true}
                />
                {pinnedTabs.length > 0 && openTabs.length > 0 && (
                    <div className="w-px h-5 bg-border/40 mx-1 shrink-0" />
                )}
                <TabSection
                    noteIds={openTabs}
                    isPinned={false}
                />
            </div>

            <DragOverlay dropAnimation={null}>
                {draggedNote && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-background border rounded-md shadow-lg text-sm">
                        <span>{draggedNote.emoji}</span>
                        <span className="font-medium">{draggedNote.title}</span>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}

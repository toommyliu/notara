import { useState, useRef, useEffect, type WheelEvent, type RefObject, type CSSProperties } from "react";
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
import IconPlus from "~icons/lucide/plus";

import { useTabs } from "~/hooks/use-tabs";
import { useNotes } from "~/hooks/use-notes";

import { cn } from "~/lib/utils";

type HeaderTabItemProps = {
    noteId: string;
    isActive: boolean;
    isPinned: boolean;
    onActivate: () => void;
    onClose: () => void;
};

function HeaderTabItem({
    noteId,
    isActive,
    isPinned,
    onActivate,
    onClose,
}: HeaderTabItemProps) {
    const { notes } = useNotes();
    const note = notes.get(noteId);
    const tabRef = useRef<HTMLDivElement>(null);

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

    // Scroll active tab into view
    useEffect(() => {
        if (isActive && tabRef.current) {
            tabRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        }
    }, [isActive]);

    if (!note) return null;

    return (
        <div
            ref={(node) => {
                setNodeRef(node);
                (tabRef as RefObject<HTMLDivElement | null>).current = node;
            }}
            style={style}
            className={cn(
                "group relative flex items-center gap-1.5 px-3 py-1 select-none shrink-0",
                "transition-all duration-200 ease-out cursor-pointer",
                isActive
                    ? "bg-muted/80 text-foreground rounded-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg",
                isDragging && "opacity-50"
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

            <span className="text-[13px] font-medium relative z-10 pointer-events-none max-w-[100px] truncate">
                {note.title}
            </span>

            <button
                onClick={(ev) => {
                    ev.stopPropagation();
                    onClose();
                }}
                className={cn(
                    "relative z-10 p-0.5 rounded-sm transition-all",
                    "opacity-0 group-hover:opacity-100",
                    "text-muted-foreground/60 hover:text-foreground hover:bg-background/80"
                )}
                aria-label="Close tab"
            >
                <IconX className="size-3" />
            </button>
        </div>
    );
}

export function HeaderTabs() {
    const { pinnedTabs, openTabs, activeTabId, setActiveTab, closeTab, reorderTabs, isTabBarVisible } = useTabs();
    const { notes, groups, addNote } = useNotes();
    const [activeDragId, setActiveDragId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleDragStart = (ev: DragStartEvent) => {
        setActiveDragId(ev.active.id as string);
    };

    const handleDragEnd = (ev: DragEndEvent) => {
        const { active, over } = ev;
        setActiveDragId(null);

        if (!over || active.id === over.id) return;

        const activeSection = active.data.current?.section as "pinned" | "open";
        const overSection = over.data.current?.section as "pinned" | "open";

        if (activeSection === overSection) {
            reorderTabs(active.id as string, over.id as string, activeSection);
        }
    };

    const handleNewTab = () => {
        // Add note to the first group
        const firstGroup = groups[0];
        if (firstGroup) {
            const newNoteId = addNote(firstGroup.id, "Untitled", "📄");
            setActiveTab(newNoteId);
        }
    };

    // Convert vertical wheel scroll to horizontal scroll for mouse users
    const handleWheel = (ev: WheelEvent) => {
        if (scrollContainerRef.current && ev.deltaY !== 0) {
            ev.preventDefault();
            scrollContainerRef.current.scrollLeft += ev.deltaY;
        }
    };

    // Only render when visible
    if (!isTabBarVisible) return null;

    const hasTabs = pinnedTabs.length > 0 || openTabs.length > 0;
    if (!hasTabs) return null;

    const draggedNote = activeDragId ? notes.get(activeDragId) : null;
    const allTabs = [...pinnedTabs, ...openTabs];

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
                className="flex items-center gap-0.5 min-w-0 overflow-x-scroll overflow-y-hidden scrollbar-none pb-2 -mb-2"
                style={{ WebkitAppRegion: "no-drag", overscrollBehavior: "contain" } as CSSProperties}
                onWheel={handleWheel}
            >
                <SortableContext items={allTabs} strategy={horizontalListSortingStrategy}>
                    {pinnedTabs.map((noteId) => (
                        <HeaderTabItem
                            key={noteId}
                            noteId={noteId}
                            isActive={activeTabId === noteId}
                            isPinned={true}
                            onActivate={() => setActiveTab(noteId)}
                            onClose={() => closeTab(noteId)}
                        />
                    ))}

                    {pinnedTabs.length > 0 && openTabs.length > 0 && (
                        <div className="w-px h-4 bg-border/40 mx-1 shrink-0" />
                    )}

                    {openTabs.map((noteId) => (
                        <HeaderTabItem
                            key={noteId}
                            noteId={noteId}
                            isActive={activeTabId === noteId}
                            isPinned={false}
                            onActivate={() => setActiveTab(noteId)}
                            onClose={() => closeTab(noteId)}
                        />
                    ))}
                </SortableContext>

                <button
                    onClick={handleNewTab}
                    className={cn(
                        "shrink-0 p-1.5 rounded-md transition-colors",
                        "text-muted-foreground/60 hover:text-foreground hover:bg-muted/40"
                    )}
                    aria-label="New tab"
                >
                    <IconPlus className="size-3.5" />
                </button>
            </div>

            <DragOverlay dropAnimation={null}>
                {draggedNote && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-background border rounded-md shadow-lg text-sm">
                        <span>{draggedNote.emoji}</span>
                        <span className="font-medium">{draggedNote.title}</span>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}

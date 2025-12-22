import { useState } from "react";
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
import { restrictToVerticalAxis, restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import IconX from "~icons/lucide/x";
import IconPin from "~icons/lucide/pin";
import IconPinOff from "~icons/lucide/pin-off";

import { useTabs } from "~/hooks/use-tabs";
import { useNotes } from "~/hooks/use-notes";

import { cn } from "~/lib/utils";

type TabItemProps = {
    noteId: string;
    isActive: boolean;
    isPinned: boolean;
    orientation: "horizontal" | "vertical";
    onActivate: () => void;
    onClose: () => void;
    onPin: () => void;
    onUnpin: () => void;
};

function TabItem({
    noteId,
    isActive,
    isPinned,
    orientation,
    onActivate,
    onClose,
    onPin,
    onUnpin,
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

    const isVertical = orientation === "vertical";

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative flex items-center gap-2 select-none",
                "transition-all duration-150 ease-out",
                isVertical
                    ? "px-3 py-2 rounded-lg mx-1"
                    : "px-3 py-1.5 rounded-md shrink-0",
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

            {isPinned && isVertical && (
                <span className="text-[10px] text-muted-foreground/60 shrink-0">
                    <IconPin className="size-3" />
                </span>
            )}

            <span className="text-sm shrink-0 relative z-10 pointer-events-none">
                {note.emoji}
            </span>

            <span
                className={cn(
                    "text-sm font-medium relative z-10 pointer-events-none",
                    isVertical ? "truncate flex-1" : "max-w-[120px] truncate"
                )}
            >
                {note.title}
            </span>

            <div
                className={cn(
                    "relative z-10 flex items-center gap-0.5 shrink-0",
                    "opacity-0 group-hover:opacity-100 transition-opacity"
                )}
            >
                {isVertical && (
                    <button
                        onClick={(ev) => {
                            ev.stopPropagation();
                            isPinned ? onUnpin() : onPin();
                        }}
                        className="p-0.5 rounded hover:bg-background/60 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={isPinned ? "Unpin tab" : "Pin tab"}
                    >
                        {isPinned ? (
                            <IconPinOff className="size-3" />
                        ) : (
                            <IconPin className="size-3" />
                        )}
                    </button>
                )}

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
    title,
    noteIds,
    isPinned,
    orientation,
}: {
    title?: string;
    noteIds: string[];
    isPinned: boolean;
    orientation: "horizontal" | "vertical";
}) {
    const { activeTabId, setActiveTab, closeTab, pinTab, unpinTab } = useTabs();
    const isVertical = orientation === "vertical";

    if (noteIds.length === 0) return null;

    return (
        <div className={cn(isVertical && "mb-2")}>
            {title && isVertical && (
                <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {title}
                </div>
            )}
            <SortableContext
                items={noteIds}
                strategy={isVertical ? verticalListSortingStrategy : horizontalListSortingStrategy}
            >
                <div
                    className={cn(
                        isVertical ? "flex flex-col gap-0.5" : "flex items-center gap-1"
                    )}
                >
                    {noteIds.map((noteId) => (
                        <TabItem
                            key={noteId}
                            noteId={noteId}
                            isActive={activeTabId === noteId}
                            isPinned={isPinned}
                            orientation={orientation}
                            onActivate={() => setActiveTab(noteId)}
                            onClose={() => closeTab(noteId)}
                            onPin={() => pinTab(noteId)}
                            onUnpin={() => unpinTab(noteId)}
                        />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
}

export function TabBar() {
    const { pinnedTabs, openTabs, orientation, reorderTabs } = useTabs();
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
    const isVertical = orientation === "vertical";
    const hasTabs = pinnedTabs.length > 0 || openTabs.length > 0;

    if (!hasTabs) return null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[isVertical ? restrictToVerticalAxis : restrictToHorizontalAxis]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div
                className={cn(
                    "bg-background/80 backdrop-blur-sm border-border/40",
                    isVertical
                        ? "w-56 border-r flex flex-col py-2 overflow-y-auto h-full shrink-0"
                        : "h-10 border-b flex items-center px-2 overflow-x-auto shrink-0"
                )}
            >
                {isVertical ? (
                    <>
                        {pinnedTabs.length > 0 && (
                            <>
                                <TabSection
                                    title="Pinned"
                                    noteIds={pinnedTabs}
                                    isPinned={true}
                                    orientation={orientation}
                                />
                                {openTabs.length > 0 && (
                                    <div className="mx-3 my-1 border-t border-border/30" />
                                )}
                            </>
                        )}
                        <TabSection
                            title={pinnedTabs.length > 0 ? "Open" : undefined}
                            noteIds={openTabs}
                            isPinned={false}
                            orientation={orientation}
                        />
                    </>
                ) : (
                    <>
                        <TabSection
                            noteIds={pinnedTabs}
                            isPinned={true}
                            orientation={orientation}
                        />
                        {pinnedTabs.length > 0 && openTabs.length > 0 && (
                            <div className="w-px h-5 bg-border/40 mx-1 shrink-0" />
                        )}
                        <TabSection
                            noteIds={openTabs}
                            isPinned={false}
                            orientation={orientation}
                        />
                    </>
                )}
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

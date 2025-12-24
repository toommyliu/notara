import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
    DndContext,
    DragOverlay,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
    type CollisionDetection,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "~/components/ui/tooltip";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupAction,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "~/ui/sidebar";

import IconAdd from "~icons/lucide/plus";
import IconFolderPlus from "~icons/lucide/folder-plus";
import IconSort from "~icons/lucide/arrow-down-a-z";
import IconMoreHorizontal from "~icons/lucide/more-horizontal";

import { type Group, type Note, useNotesStore } from "~/stores/notes-store";
import { useTabsStore } from "~/stores/tabs-store";
import { usePlatformLayout } from "~/hooks/use-platform";
import { useDragContext } from "~/contexts/drag-context";

import { cn } from "~/lib/utils";

type DropIndicatorProps = {
    position?: "top" | "bottom";
};

function DropIndicator({ position = "top" }: DropIndicatorProps) {
    return (
        <div
            className={cn(
                "absolute left-2 right-2 h-[2px] z-20 pointer-events-none",
                position === "top" ? "-top-px" : "-bottom-px"
            )}
        >
            <div className="w-full h-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)] rounded-full animate-in fade-in zoom-in-95 duration-200" />
            <div className="absolute -left-1 -top-1 size-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
        </div>
    );
}

type GroupDropZoneProps = {
    groupId: string;
    isVisible: boolean;
};

function GroupDropZone({ groupId, isVisible }: GroupDropZoneProps) {
    const { isOver, setNodeRef } = useDroppable({
        id: `${groupId}-end`,
        data: { type: "group-end", groupId },
    });

    if (!isVisible) return null;

    return (
        <div
            ref={setNodeRef}
            className="relative h-4 mt-2 -mx-2 flex items-center"
        >
            <div
                className={cn(
                    "absolute left-4 right-4 h-px transition-all duration-200",
                    isOver ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)] h-[2px]" : "bg-border/20"
                )}
            />
            {isOver && (
                <div className="absolute left-3 size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
            )}
        </div>
    );
}

function GroupsEndDropZone({ isVisible }: { isVisible: boolean }) {
    const { isOver, setNodeRef } = useDroppable({
        id: "groups-end-list",
        data: { type: "group-end-list" },
    });

    if (!isVisible) return null;

    return (
        <div ref={setNodeRef} className="h-6 relative mt-1 flex items-center">
            {isOver && <DropIndicator position="top" />}
        </div>
    );
}

function SidebarActionStrip() {
    const { addNote, addGroup, sortData } = useNotesStore();
    const { openTab } = useTabsStore();
    const navigate = useNavigate();

    const handleAddNote = () => {
        const id = addNote();
        openTab(id);
        navigate({ to: "/notes" });
    };

    return (
        <div className="flex items-center justify-center gap-1 py-1">
            <Tooltip>
                <TooltipTrigger
                    onClick={handleAddNote}
                    className="flex items-center justify-center p-1 text-muted-foreground hover:text-foreground rounded-sm transition-colors duration-200 cursor-pointer"
                >
                    <IconAdd className="size-4" />
                    <span className="sr-only">New Page</span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">New Page</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger
                    onClick={() => addGroup()}
                    className="flex items-center justify-center p-1 text-muted-foreground hover:text-foreground rounded-sm transition-colors duration-200 cursor-pointer"
                >
                    <IconFolderPlus className="size-4" />
                    <span className="sr-only">New Group</span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">New Group</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger
                    onClick={sortData}
                    className="flex items-center justify-center p-1 text-muted-foreground hover:text-foreground rounded-sm transition-colors duration-200 cursor-pointer"
                >
                    <IconSort className="size-4" />
                    <span className="sr-only">Sort</span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Sort Alphabetically</TooltipContent>
            </Tooltip>
        </div>
    );
}

type SortableNoteProps = {
    note: Note;
    groupId: string | null;
    isActive: boolean;
    onSelect: () => void;
    activeDragType: "note" | "group" | null;
};
function SortableNote({ note, groupId, isActive, onSelect, activeDragType }: SortableNoteProps) {
    const navigate = useNavigate();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
    } = useSortable({
        id: note.id,
        data: { type: "note", groupId },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleClick = () => {
        onSelect();
        navigate({ to: "/notes" });
    };

    const showIndicator = isOver && !isDragging && activeDragType === "note";

    return (
        <SidebarMenuItem ref={setNodeRef} style={style} className="relative">
            {showIndicator && <DropIndicator position="top" />}
            <Link
                to="/notes"
                onClick={handleClick}
                draggable={false}
                onDragStart={(ev) => {
                    ev.preventDefault();
                }}
            >
                <SidebarMenuButton
                    isActive={isActive}
                    tooltip={note.title}
                    className={cn(
                        "cursor-grab active:cursor-grabbing",
                        "data-[active=true]:bg-background data-[active=true]:ring-1 data-[active=true]:ring-border/50 data-[active=true]:text-foreground data-[active=true]:shadow-sm",
                        isDragging && "opacity-30"
                    )}
                    {...attributes}
                    {...listeners}
                >
                    <span>{note.emoji}</span>
                    <span className="flex-1 truncate">{note.title}</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
    );
}

type SortableGroupProps = {
    group: Group;
    notes: Note[];
    activeNoteId: string | null;
    isDragSelected: boolean;
    showDropBackground: boolean;
    onNoteSelect: (noteId: string) => void;
    onToggleCollapse: () => void;
    onAddNote: () => void;
    activeDragType: "note" | "group" | null;
    isLast: boolean;
};
function SortableGroup({
    group,
    notes,
    activeNoteId,
    isDragSelected,
    showDropBackground,
    onNoteSelect,
    onToggleCollapse,
    onAddNote,
    activeDragType,
}: SortableGroupProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
    } = useSortable({
        id: group.id,
        data: { type: "group" },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const showTopIndicator = isOver && !isDragging && activeDragType === "group";

    return (
        <SidebarGroup
            ref={setNodeRef}
            style={style}
            className={cn(
                "group/sidebar-group relative rounded-md px-2 py-1 transition-colors duration-200",
                isDragSelected && "bg-sidebar-accent/30 ring-1 ring-sidebar-border",
                isDragging && "opacity-30",
                showDropBackground && isOver && !isDragging && activeDragType === "note" && "bg-primary/5 ring-1 ring-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.05)]"
            )}
        >
            {showTopIndicator && <DropIndicator position="top" />}

            <div className="group/header relative">
                <SidebarGroupLabel
                    className={cn(
                        "w-full min-w-0 text-sm text-muted-foreground cursor-grab active:cursor-grabbing rounded-sm transition-all duration-200",
                        "group-hover/header:bg-background group-hover/header:ring-1 group-hover/header:ring-border/50 group-hover/header:shadow-sm"
                    )}
                    {...attributes}
                    {...listeners}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleCollapse();
                        }}
                        className="flex-1 min-w-0 text-left cursor-grab active:cursor-grabbing"
                    >
                        <span className="truncate">{group.title}</span>
                    </button>
                </SidebarGroupLabel>
                <SidebarGroupAction
                    title="More options"
                    className="top-1/2 -translate-y-1/2 right-8 rounded-sm opacity-0 group-hover/header:opacity-100 transition-opacity"
                >
                    <IconMoreHorizontal className="size-4" />
                    <span className="sr-only">More options</span>
                </SidebarGroupAction>
                <SidebarGroupAction
                    title="New Page"
                    onClick={onAddNote}
                    className="top-1/2 -translate-y-1/2 rounded-sm opacity-0 group-hover/header:opacity-100 transition-opacity"
                >
                    <IconAdd className="size-4" />
                    <span className="sr-only">New Page</span>
                </SidebarGroupAction>
            </div>

            {!group.isCollapsed && (
                <SidebarGroupContent className="mt-1">
                    <SortableContext
                        items={group.noteIds}
                        strategy={verticalListSortingStrategy}
                    >
                        <SidebarMenu className="gap-1">
                            {notes.map((note) => (
                                <SortableNote
                                    key={note.id}
                                    note={note}
                                    groupId={group.id}
                                    isActive={activeNoteId === note.id}
                                    onSelect={() => onNoteSelect(note.id)}
                                    activeDragType={activeDragType}
                                />
                            ))}
                        </SidebarMenu>
                    </SortableContext>
                    <GroupDropZone groupId={group.id} isVisible={activeDragType === "note"} />
                </SidebarGroupContent>
            )}
        </SidebarGroup>
    );
}

export function AppSidebar() {
    const layout = usePlatformLayout();
    const navigate = useNavigate();
    const {
        groups,
        notes,
        addNote,
        toggleGroupCollapse,
        reorderGroups,
        moveNote,
        reorderNotesInGroup,
    } = useNotesStore();
    const { openTab, activeTabId } = useTabsStore();
    const dragContext = useDragContext();

    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeDragType, setActiveDragType] = useState<"note" | "group" | null>(null);
    const activeDragTypeRef = useRef<"note" | "group" | null>(null);
    const sidebarContentRef = useRef<HTMLDivElement>(null);

    const draggingGroupId = activeDragType === "group" ? activeDragId : null;
    const isDraggingGroup = activeDragType === "group";

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    // Only restrict to vertical axis when dragging groups, not notes
    const conditionalVerticalRestriction = (args: Parameters<typeof restrictToVerticalAxis>[0]) => {
        if (activeDragTypeRef.current === "group") {
            return restrictToVerticalAxis(args);
        }

        return args.transform;
    };

    const collisionDetection: CollisionDetection = (args) => {
        const activeType = args.active.data.current?.type ?? activeDragTypeRef.current;

        // Check if pointer is within sidebar
        if (sidebarContentRef.current && args.pointerCoordinates) {
            const rect = sidebarContentRef.current.getBoundingClientRect();
            const { x, y } = args.pointerCoordinates;

            const isInside = (
                x >= rect.left &&
                x <= rect.right &&
                y >= rect.top &&
                y <= rect.bottom
            );

            if (!isInside) return [];
        }

        const droppableContainers =
            activeType === "group"
                ? args.droppableContainers.filter(
                    (container) => container.data.current?.type === "group"
                )
                : args.droppableContainers;

        return closestCenter({ ...args, droppableContainers });
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveDragId(active.id as string);
        const type = active.data.current?.type ?? null;
        setActiveDragType(type);
        activeDragTypeRef.current = type;

        // Broadcast to split view if dragging a note
        if (type === "note" && dragContext) {
            dragContext.startDrag(active.id as string, "sidebar");
        }
    };

    const handleDragCancel = () => {
        setActiveDragId(null);
        setActiveDragType(null);
        activeDragTypeRef.current = null;
        dragContext?.endDrag();
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveDragId(null);
        setActiveDragType(null);
        activeDragTypeRef.current = null;

        dragContext?.endDrag();

        if (!over || active.id === over.id) return;

        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;

        // Reorder groups
        if (activeType === "group") {
            if (overType === "group") {
                reorderGroups(active.id as string, over.id as string);
            } else if (overType === "group-end-list") {
                const lastGroup = groups[groups.length - 1];
                if (lastGroup && active.id !== lastGroup.id) {
                    reorderGroups(active.id as string, lastGroup.id);
                }
            }
            return;
        }

        // Reorder or move notes
        if (activeType === "note") {
            const activeGroupId = active.data.current?.groupId;

            if (overType === "note") {
                const overGroupId = over.data.current?.groupId;

                if (activeGroupId === overGroupId) {
                    // Reorder within same group
                    reorderNotesInGroup(activeGroupId, active.id as string, over.id as string);
                } else {
                    // Move to different group
                    moveNote(active.id as string, activeGroupId, overGroupId, over.id as string);
                }
            } else if (overType === "group") {
                // Drop on group header - add to end of that group
                if (activeGroupId !== over.id) {
                    moveNote(active.id as string, activeGroupId, over.id as string);
                }
            } else if (overType === "group-end") {
                // Drop at end of group
                const targetGroupId = over.data.current?.groupId;
                if (activeGroupId !== targetGroupId) {
                    moveNote(active.id as string, activeGroupId, targetGroupId);
                }
            }
        }
    };

    const getDragOverlayContent = () => {
        if (!activeDragId || activeDragType !== "note") return null;

        const note = notes.get(activeDragId);
        if (!note)
            return null;

        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-background border rounded-md shadow-lg text-sm z-50 pointer-events-none">
                <span>{note.emoji}</span>
                <span>{note.title}</span>
            </div>
        );
    };

    return (
        <Sidebar
            collapsible="offcanvas"
            className="border-r border-border/40"
            style={{
                top: 0,
                height: "100vh",
            }}
        >
            <SidebarHeader
                className="px-3 pb-0"
                style={{ paddingTop: `calc(${layout.titlebarHeight}px + 0.5rem)` }}
            >
                <SidebarActionStrip />
            </SidebarHeader>

            <SidebarContent className="overflow-x-hidden px-2 pb-4">
                <div ref={sidebarContentRef} className="flex flex-col">
                    <DndContext
                        sensors={sensors}
                        autoScroll={false}
                        collisionDetection={collisionDetection}
                        modifiers={[conditionalVerticalRestriction]}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragCancel={handleDragCancel}
                    >
                        <SortableContext
                            items={groups.map((g) => g.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {groups.map((group, index) => {
                                const groupNotes = group.noteIds
                                    .map((id) => notes.get(id))
                                    .filter((n): n is Note => n !== undefined);

                                return (
                                    <SortableGroup
                                        key={group.id}
                                        group={group}
                                        notes={groupNotes}
                                        activeNoteId={activeTabId}
                                        isDragSelected={draggingGroupId === group.id}
                                        showDropBackground={!isDraggingGroup}
                                        onNoteSelect={openTab}
                                        onToggleCollapse={() => toggleGroupCollapse(group.id)}
                                        onAddNote={() => {
                                            const id = addNote(group.id);
                                            openTab(id);
                                            navigate({ to: "/notes" });
                                        }}
                                        activeDragType={activeDragType}
                                        isLast={index === groups.length - 1}
                                    />
                                );
                            })}
                        </SortableContext>
                        <GroupsEndDropZone isVisible={activeDragType === "group"} />

                        <DragOverlay dropAnimation={null}>
                            {getDragOverlayContent()}
                        </DragOverlay>
                    </DndContext>
                </div>
            </SidebarContent>

            <SidebarRail />
        </Sidebar>
    );
}

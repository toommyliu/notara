import { Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
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

import { type Group, type Note, useNotesStore } from "~/stores/notes-store";
import { useTabsStore } from "~/stores/tabs-store";
import { usePlatformLayout } from "~/hooks/use-platform";
import { useDragContext } from "~/contexts/drag-context";

import { cn } from "~/lib/utils";

function DropIndicator() {
    return (
        <div className="absolute -top-0.5 left-2 right-2 h-0.5 bg-blue-500/50 rounded-full z-10" />
    );
}

type GroupDropZoneProps = {
    groupId: string;
};
function GroupDropZone({ groupId }: GroupDropZoneProps) {
    const { isOver, setNodeRef } = useDroppable({
        id: `${groupId}-end`,
        data: { type: "group-end", groupId },
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "h-1.5 mt-0.5 mx-2 rounded-full transition-colors",
                isOver && "bg-blue-500/50"
            )}
        />
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
                    className="flex items-center justify-center p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors duration-200 cursor-pointer"
                >
                    <IconAdd className="size-4" />
                    <span className="sr-only">New Page</span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">New Page</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger
                    onClick={() => addGroup()}
                    className="flex items-center justify-center p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors duration-200 cursor-pointer"
                >
                    <IconFolderPlus className="size-4" />
                    <span className="sr-only">New Group</span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">New Group</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger
                    onClick={sortData}
                    className="flex items-center justify-center p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors duration-200 cursor-pointer"
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
};
function SortableNote({ note, groupId, isActive, onSelect }: SortableNoteProps) {
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

    return (
        <SidebarMenuItem ref={setNodeRef} style={style} className="relative">
            {isOver && <DropIndicator />}
            <Link to="/notes" onClick={handleClick}>
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

    return (
        <SidebarGroup
            ref={setNodeRef}
            style={style}
            className={cn(
                "group/sidebar-group relative rounded-md px-2 py-1 transition-colors duration-200",
                isDragSelected && "bg-sidebar-accent/30 ring-1 ring-sidebar-border",
                isDragging && "opacity-30",
                showDropBackground && isOver && !isDragging && "bg-blue-500/10"
            )}
        >
            {isOver && <DropIndicator />}

            <SidebarGroupLabel
                className="w-full min-w-0 text-sm text-muted-foreground cursor-grab active:cursor-grabbing"
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
                title="New Page"
                onClick={onAddNote}
                className="top-2 rounded-sm opacity-0 group-hover/sidebar-group:opacity-100 transition-opacity"
            >
                <IconAdd className="size-4" />
                <span className="sr-only">New Page</span>
            </SidebarGroupAction>

            {!group.isCollapsed && (
                <SidebarGroupContent>
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
                                />
                            ))}
                        </SidebarMenu>
                    </SortableContext>
                    <GroupDropZone groupId={group.id} />
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
        if (activeType === "group" && overType === "group") {
            reorderGroups(active.id as string, over.id as string);
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
            <div className="flex items-center gap-2 px-3 py-1.5 bg-background border rounded-md shadow-lg text-sm">
                <span>{note.emoji}</span>
                <span>{note.title}</span>
            </div>
        );
    };

    return (
        <Sidebar
            collapsible="offcanvas"
            className="border-r-0"
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
                            {groups.map((group) => {
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
                                    />
                                );
                            })}
                        </SortableContext>

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

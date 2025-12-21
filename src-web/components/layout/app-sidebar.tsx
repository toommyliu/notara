import { Link } from "@tanstack/react-router";
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
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupAction,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
} from "~/ui/sidebar";
import { ModeToggle } from "~/components/mode-toggle";
import { type Group, type Note } from "~/contexts/notes-context";
import { useNotes } from "~/hooks/use-notes";
import { usePlatformLayout } from "~/hooks/use-platform";
import { cn } from "~/lib/utils";

import IconAdd from "~icons/lucide/plus";
import IconDelete from "~icons/lucide/trash";
import IconFolderPlus from "~icons/lucide/folder-plus";
import IconHome from "~icons/lucide/home";
import IconSearch from "~icons/lucide/search";
import IconSettings from "~icons/lucide/settings";

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

type SortableNoteProps = {
    note: Note;
    groupId: string;
    isActive: boolean;
    onSelect: () => void;
};
function SortableNote({ note, groupId, isActive, onSelect }: SortableNoteProps) {
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

    return (
        <SidebarMenuItem ref={setNodeRef} style={style} className="relative">
            {isOver && <DropIndicator />}
            <SidebarMenuButton
                onClick={onSelect}
                isActive={isActive}
                tooltip={note.title}
                className={cn(
                    "cursor-grab active:cursor-grabbing",
                    isDragging && "opacity-30"
                )}
                {...attributes}
                {...listeners}
            >
                <span>{note.emoji}</span>
                <span className="flex-1 truncate">{note.title}</span>
            </SidebarMenuButton>
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
                    className="flex-1 min-w-0 text-left"
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
                        <SidebarMenu>
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
    const {
        groups,
        notes,
        activeNoteId,
        selectNote,
        addNote,
        addGroup,
        toggleGroupCollapse,
        reorderGroups,
        moveNote,
        reorderNotesInGroup,
    } = useNotes();

    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeDragType, setActiveDragType] = useState<"note" | "group" | null>(null);
    const activeDragTypeRef = useRef<"note" | "group" | null>(null);

    const draggingGroupId = activeDragType === "group" ? activeDragId : null;
    const isDraggingGroup = activeDragType === "group";

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const collisionDetection: CollisionDetection = (args) => {
        const activeType = args.active.data.current?.type ?? activeDragTypeRef.current;

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
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);
        setActiveDragType(null);
        activeDragTypeRef.current = null;

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

    // Get the currently dragged item for the overlay
    const getDragOverlayContent = () => {
        if (!activeDragId || activeDragType !== "note") return null;

        const note = notes.get(activeDragId);
        if (!note) return null;
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
                top: layout.titlebarHeight,
                height: `calc(100vh - ${layout.titlebarHeight}px)`,
            }}
        >
            <SidebarContent
                className="overflow-x-hidden"
            // style={{ paddingTop: layout.isMac ? layout.titlebarHeight / 2 : undefined }}
            >
                <SidebarGroup className="py-2">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <Link to="/">
                                    <SidebarMenuButton tooltip="Home">
                                        <IconHome className="size-4" />
                                        <span>Home</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Search">
                                    <IconSearch className="size-4" />
                                    <span>Search</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator />

                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar overscroll-contain">
                    <DndContext
                        sensors={sensors}
                        autoScroll={false}
                        collisionDetection={collisionDetection}
                        modifiers={[restrictToVerticalAxis]}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
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
                                        activeNoteId={activeNoteId}
                                        isDragSelected={draggingGroupId === group.id}
                                        showDropBackground={!isDraggingGroup}
                                        onNoteSelect={selectNote}
                                        onToggleCollapse={() => toggleGroupCollapse(group.id)}
                                        onAddNote={() => addNote(group.id)}
                                    />
                                );
                            })}
                        </SortableContext>

                        <DragOverlay dropAnimation={null}>
                            {getDragOverlayContent()}
                        </DragOverlay>
                    </DndContext>
                </div>

                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="New Group"
                                    className="text-muted-foreground"
                                    onClick={() => addGroup()}
                                >
                                    <IconFolderPlus className="size-4" />
                                    <span>New Group</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Trash" className="text-muted-foreground">
                                    <IconDelete className="size-4" />
                                    <span>Trash</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="pb-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Settings">
                            <IconSettings className="size-4" />
                            <span>Settings</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <ModeToggle />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}

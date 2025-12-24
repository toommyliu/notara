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
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "~/components/ui/context-menu";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from "~/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";

import IconAdd from "~icons/lucide/plus";
import IconFolderPlus from "~icons/lucide/folder-plus";
import IconSort from "~icons/lucide/arrow-down-a-z";
import IconMoreHorizontal from "~icons/lucide/more-horizontal";
import IconStar from "~icons/lucide/star";
import IconCopy from "~icons/lucide/copy";
import IconPencil from "~icons/lucide/pencil";
import IconFolderInput from "~icons/lucide/folder-input";
import IconTrash from "~icons/lucide/trash-2";
import IconExternalLink from "~icons/lucide/external-link";
import IconAppWindow from "~icons/lucide/app-window";
import IconColumns from "~icons/lucide/columns-2";
import IconPanelRight from "~icons/lucide/panel-right";
import IconArrowDownAZ from "~icons/lucide/arrow-down-a-z";
import IconArrowUpZA from "~icons/lucide/arrow-up-z-a";
import IconListOrdered from "~icons/lucide/list-ordered";
import IconCheck from "~icons/lucide/check";
import IconInfinity from "~icons/lucide/infinity";

import { type Block, type Group, type Note, type SortOrder, useNotesStore } from "~/stores/notes-store";
import { useTabsStore } from "~/stores/tabs-store";
import { useSplitViewStore } from "~/stores/split-view-store";
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

type NoteMenuContentProps = {
    note: Note;
    groupId: string | null;
    variant: "context" | "dropdown";
};
function NoteMenuContent({ note, groupId, variant }: NoteMenuContentProps) {
    const navigate = useNavigate();
    const { groups, duplicateNote, deleteNote, moveNote } = useNotesStore();
    const { openTab } = useTabsStore();
    const { addPane } = useSplitViewStore();

    const Item = variant === "context" ? ContextMenuItem : DropdownMenuItem;
    const Separator = variant === "context" ? ContextMenuSeparator : DropdownMenuSeparator;
    const Sub = variant === "context" ? ContextMenuSub : DropdownMenuSub;
    const SubTrigger = variant === "context" ? ContextMenuSubTrigger : DropdownMenuSubTrigger;
    const SubContent = variant === "context" ? ContextMenuSubContent : DropdownMenuSubContent;

    const handleDuplicate = () => {
        const newId = duplicateNote(note.id);
        if (newId) {
            openTab(newId);
            navigate({ to: "/notes" });
        }
    };

    const handleDelete = () => {
        deleteNote(note.id);
    };

    const handleOpenInNewTab = () => {
        openTab(note.id);
        navigate({ to: "/notes" });
    };

    const handleOpenInSplitView = () => {
        addPane("right", note.id);
        navigate({ to: "/notes" });
    };

    const handleMoveToGroup = (targetGroupId: string) => {
        if (groupId && groupId !== targetGroupId) {
            moveNote(note.id, groupId, targetGroupId);
        }
    };

    const availableGroups = groups.filter((g) => g.id !== groupId);

    return (
        <>
            <Item disabled>
                <IconStar className="size-4" />
                Add to Favorites
            </Item>
            <Item onClick={handleDuplicate}>
                <IconCopy className="size-4" />
                Duplicate
            </Item>
            <Item disabled>
                <IconPencil className="size-4" />
                Rename
            </Item>
            <Separator />
            <Sub>
                <SubTrigger>
                    <IconFolderInput className="size-4" />
                    Move to
                </SubTrigger>
                <SubContent>
                    {availableGroups.length > 0 ? (
                        availableGroups.map((g) => (
                            <Item key={g.id} onClick={() => handleMoveToGroup(g.id)}>
                                {g.title}
                            </Item>
                        ))
                    ) : (
                        <Item disabled>No other groups</Item>
                    )}
                </SubContent>
            </Sub>
            <Item variant="destructive" onClick={handleDelete}>
                <IconTrash className="size-4" />
                Move to Trash
            </Item>
            <Separator />
            <Item onClick={handleOpenInNewTab}>
                <IconExternalLink className="size-4" />
                Open in New Tab
            </Item>
            <Item disabled>
                <IconAppWindow className="size-4" />
                Open in New Window
            </Item>
            <Item onClick={handleOpenInSplitView}>
                <IconColumns className="size-4" />
                Open in Split View
            </Item>
            <Item disabled>
                <IconPanelRight className="size-4" />
                Open in Side Peek
            </Item>
        </>
    );
}

const DISPLAY_LIMITS = [
    { value: 5, label: "Show 5 items" },
    { value: 10, label: "Show 10 items" },
    { value: 20, label: "Show 20 items" },
    { value: null, label: "Show all" },
] as const;

const SORT_OPTIONS: { value: SortOrder; label: string; icon: typeof IconArrowDownAZ }[] = [
    { value: "manual", label: "Manual", icon: IconListOrdered },
    { value: "a-z", label: "A → Z", icon: IconArrowDownAZ },
    { value: "z-a", label: "Z → A", icon: IconArrowUpZA },
];

type GroupMenuContentProps = {
    group: Group;
    variant: "context" | "dropdown";
};
function GroupMenuContent({ group, variant }: GroupMenuContentProps) {
    const { sortGroup, setGroupDisplayLimit } = useNotesStore();

    const Item = variant === "context" ? ContextMenuItem : DropdownMenuItem;
    const Separator = variant === "context" ? ContextMenuSeparator : DropdownMenuSeparator;
    const Sub = variant === "context" ? ContextMenuSub : DropdownMenuSub;
    const SubTrigger = variant === "context" ? ContextMenuSubTrigger : DropdownMenuSubTrigger;
    const SubContent = variant === "context" ? ContextMenuSubContent : DropdownMenuSubContent;

    return (
        <>
            <span className="text-muted-foreground px-2 py-1 text-xs font-medium select-none">
                Sort by
            </span>
            {SORT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = group.sortOrder === option.value;
                return (
                    <Item
                        key={option.value}
                        onClick={() => sortGroup(group.id, option.value)}
                    >
                        <Icon className="size-4" />
                        {option.label}
                        {isActive && <IconCheck className="size-3.5 ml-auto text-primary" />}
                    </Item>
                );
            })}
            <Separator />
            <Sub>
                <SubTrigger>
                    <IconListOrdered className="size-4" />
                    Display limit
                </SubTrigger>
                <SubContent>
                    {DISPLAY_LIMITS.map((option) => {
                        const isActive = group.displayLimit === option.value;
                        return (
                            <Item
                                key={String(option.value)}
                                onClick={() => setGroupDisplayLimit(group.id, option.value)}
                            >
                                {option.value === null ? (
                                    <IconInfinity className="size-4" />
                                ) : (
                                    <span className="w-4 text-center text-xs font-medium text-muted-foreground">
                                        {option.value}
                                    </span>
                                )}
                                {option.label}
                                {isActive && <IconCheck className="size-3.5 ml-auto text-primary" />}
                            </Item>
                        );
                    })}
                </SubContent>
            </Sub>
        </>
    );
}

type HiddenNotesPopoverProps = {
    notes: Note[];
    activeNoteId: string | null;
    onNoteSelect: (noteId: string) => void;
};

function HiddenNotesPopover({
    notes,
    activeNoteId,
    onNoteSelect,
}: HiddenNotesPopoverProps) {
    const navigate = useNavigate();
    const { openTab } = useTabsStore();

    const handleNoteClick = (noteId: string) => {
        onNoteSelect(noteId);
        openTab(noteId);
        navigate({ to: "/notes" });
    };

    return (
        <li className="relative">
            <Popover>
                <PopoverTrigger
                    render={
                        <button
                            className={cn(
                                "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs",
                                "text-muted-foreground/70 hover:text-muted-foreground",
                                "hover:bg-sidebar-accent/40 transition-colors duration-150",
                                "cursor-pointer select-none group/more"
                            )}
                        >
                            <span className="text-muted-foreground/50">+{notes.length}</span>
                            <span>more</span>
                            <svg
                                className="size-3 ml-auto opacity-50 group-hover/more:opacity-100 transition-opacity"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                            </svg>
                        </button>
                    }
                />
                <PopoverContent
                    side="right"
                    align="start"
                    sideOffset={8}
                    className="w-56 p-1.5 max-h-64 overflow-y-auto scrollbar-custom"
                >
                    <div className="space-y-0.5">
                        {notes.map((note) => (
                            <button
                                key={note.id}
                                onClick={() => handleNoteClick(note.id)}
                                className={cn(
                                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm",
                                    "hover:bg-accent transition-colors duration-100",
                                    "text-left cursor-pointer",
                                    activeNoteId === note.id && "bg-accent/50 text-accent-foreground"
                                )}
                            >
                                <span className="text-base leading-none">{note.emoji}</span>
                                <span className="flex-1 truncate">{note.title}</span>
                            </button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </li>
    );
}

type NoteHeadingsProps = {
    blocks: Block[];
};
function NoteHeadings({ blocks }: NoteHeadingsProps) {
    const headings = blocks.filter(b => b.type === "h1" || b.type === "h2" || b.type === "h3");

    if (headings.length === 0) return null;

    const handleHeadingClick = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element as HTMLElement).focus();
        }
    };

    return (
        <SidebarMenuSub className="mt-1 gap-0.5">
            {headings.map((heading) => (
                <SidebarMenuSubItem key={heading.id}>
                    <SidebarMenuSubButton
                        onClick={(ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            handleHeadingClick(heading.id);
                        }}
                        className={cn(
                            "cursor-pointer text-muted-foreground/60 hover:text-foreground hover:bg-sidebar-accent/50",
                            "h-7 py-0"
                        )}
                    >
                        <span
                            className={cn(
                                "truncate text-[11px]",
                                heading.type === "h1" && "pl-0 font-medium text-muted-foreground/80",
                                heading.type === "h2" && "pl-3",
                                heading.type === "h3" && "pl-6"
                            )}
                        >
                            {heading.content || "Untitled"}
                        </span>
                    </SidebarMenuSubButton>
                </SidebarMenuSubItem>
            ))}
        </SidebarMenuSub>
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
    const [isHovered, setIsHovered] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

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
    const showDotsButton = isHovered || dropdownOpen;

    return (
        <ContextMenu>
            <ContextMenuTrigger
                render={
                    <SidebarMenuItem
                        ref={setNodeRef}
                        style={style}
                        className="relative group/note"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    />
                }
            >
                {showIndicator && <DropIndicator position="top" />}
                <div className="relative">
                    <SidebarMenuButton
                        isActive={isActive}
                        tooltip={note.title}
                        className={cn(
                            "cursor-grab active:cursor-grabbing pr-8",
                            "data-[active=true]:bg-background data-[active=true]:ring-1 data-[active=true]:ring-border/50 data-[active=true]:text-foreground data-[active=true]:shadow-sm",
                            isDragging && "opacity-30"
                        )}
                        {...attributes}
                        {...listeners}
                        render={
                            <Link
                                to="/notes"
                                onClick={handleClick}
                                draggable={false}
                                onDragStart={(ev) => {
                                    ev.preventDefault();
                                }}
                            />
                        }
                    >
                        <span>{note.emoji}</span>
                        <span className="flex-1 truncate">{note.title}</span>
                    </SidebarMenuButton>

                    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                        <DropdownMenuTrigger
                            render={
                                <button
                                    className={cn(
                                        "absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-sm",
                                        "text-muted-foreground hover:text-foreground",
                                        "transition-all duration-150",
                                        showDotsButton ? "opacity-100" : "opacity-0",
                                        "focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
                                        isActive
                                            ? "hover:bg-border/40 hover:ring-1 hover:ring-border/50"
                                            : "hover:bg-accent"
                                    )}
                                >
                                    <IconMoreHorizontal className="size-4" />
                                </button>
                            }
                        />
                        <DropdownMenuContent side="right" align="start" className="min-w-48">
                            <NoteMenuContent note={note} groupId={groupId} variant="dropdown" />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {isActive && note.content && (
                    <NoteHeadings blocks={note.content} />
                )}
            </ContextMenuTrigger>

            <ContextMenuContent>
                <NoteMenuContent note={note} groupId={groupId} variant="context" />
            </ContextMenuContent>
        </ContextMenu>
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
                "group/sidebar-group relative rounded-md pl-2 pr-1 py-1 transition-colors duration-200",
                isDragSelected && "bg-sidebar-accent/30 ring-1 ring-sidebar-border",
                isDragging && "opacity-30",
                showDropBackground && isOver && !isDragging && activeDragType === "note" && "bg-primary/5 ring-1 ring-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.05)]"
            )}
        >
            {showTopIndicator && <DropIndicator position="top" />}

            <ContextMenu>
                <ContextMenuTrigger
                    render={<div className="group/header relative" />}
                >
                    <SidebarGroupLabel
                        className={cn(
                            "w-full min-w-0 cursor-grab active:cursor-grabbing transition-colors duration-150 p-0",
                            "group-hover/header:bg-sidebar-accent group-hover/header:text-sidebar-accent-foreground"
                        )}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleCollapse();
                            }}
                            className="flex-1 min-w-0 h-full px-2 flex items-center text-left cursor-grab active:cursor-grabbing outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring rounded-md"
                            {...attributes}
                            {...listeners}
                        >
                            <span className="truncate text-xs font-medium">{group.title}</span>
                        </button>
                    </SidebarGroupLabel>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <SidebarGroupAction
                                    title="More options"
                                    className="top-1/2 -translate-y-1/2 right-8 rounded-sm opacity-0 group-hover/header:opacity-100 focus-visible:opacity-100 transition-opacity"
                                >
                                    <IconMoreHorizontal className="size-4" />
                                    <span className="sr-only">More options</span>
                                </SidebarGroupAction>
                            }
                        />
                        <DropdownMenuContent side="right" align="start" className="min-w-48">
                            <GroupMenuContent group={group} variant="dropdown" />
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <SidebarGroupAction
                        title="New Page"
                        onClick={onAddNote}
                        className="top-1/2 -translate-y-1/2 rounded-sm opacity-0 group-hover/header:opacity-100 focus-visible:opacity-100 transition-opacity"
                    >
                        <IconAdd className="size-4" />
                        <span className="sr-only">New Page</span>
                    </SidebarGroupAction>
                </ContextMenuTrigger>
                <ContextMenuContent className="min-w-48">
                    <GroupMenuContent group={group} variant="context" />
                </ContextMenuContent>
            </ContextMenu>

            {!group.isCollapsed && (
                <SidebarGroupContent className="mt-1">
                    <SortableContext
                        items={group.noteIds}
                        strategy={verticalListSortingStrategy}
                    >
                        <SidebarMenu className="gap-1">
                            {(group.displayLimit ? notes.slice(0, group.displayLimit) : notes).map((note) => (
                                <SortableNote
                                    key={note.id}
                                    note={note}
                                    groupId={group.id}
                                    isActive={activeNoteId === note.id}
                                    onSelect={() => onNoteSelect(note.id)}
                                    activeDragType={activeDragType}
                                />
                            ))}
                            {group.displayLimit && notes.length > group.displayLimit && (
                                <HiddenNotesPopover
                                    notes={notes.slice(group.displayLimit)}
                                    activeNoteId={activeNoteId}
                                    onNoteSelect={onNoteSelect}
                                />
                            )}
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

            <SidebarContent className="overflow-x-hidden pl-2 pr-1 pb-4" style={{ scrollbarGutter: "stable" }}>
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

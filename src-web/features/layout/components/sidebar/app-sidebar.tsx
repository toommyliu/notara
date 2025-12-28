import type {
  CollisionDetection,
  DragEndEvent,
  DragOverEvent,

  DragStartEvent,
  Modifier,
} from '@dnd-kit/core';
import type { Group, SortOrder } from '~/features/notes/store';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link, useNavigate } from '@tanstack/react-router';

import { useRef, useState } from 'react';
import IconAppWindow from '~icons/lucide/app-window';
import IconSort from '~icons/lucide/arrow-down-a-z';
import IconArrowDownAZ from '~icons/lucide/arrow-down-a-z';
import IconArrowUpZA from '~icons/lucide/arrow-up-z-a';

import IconCheck from '~icons/lucide/check';

import IconCopy from '~icons/lucide/copy';
import IconExternalLink from '~icons/lucide/external-link';
import IconFolderInput from '~icons/lucide/folder-input';
import IconFolderPlus from '~icons/lucide/folder-plus';
import IconInfinity from '~icons/lucide/infinity';
import IconListOrdered from '~icons/lucide/list-ordered';
import IconMoreHorizontal from '~icons/lucide/more-horizontal';
import IconPanelRight from '~icons/lucide/panel-right';
import IconPencil from '~icons/lucide/pencil';
import IconAdd from '~icons/lucide/plus';
import IconStar from '~icons/lucide/star';
import IconTrash from '~icons/lucide/trash-2';
import { useTabsStore } from '~/features/layout/stores/tabs-store';
import { useNoteMetadata, useNotesStore } from '~/features/notes/store';
import { HapticFeedbackPattern, useHaptics } from '~/hooks/use-haptics';
import { usePlatformLayout } from '~/hooks/use-platform';
import { cn } from '~/lib/utils';

import { useDragContext } from '~/providers/drag-context';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '~/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '~/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '~/ui/popover';
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
} from '~/ui/sidebar';

import { Tooltip, TooltipContent, TooltipTrigger } from '~/ui/tooltip';

interface DropIndicatorProps {
  position?: 'top' | 'bottom';
}
function DropIndicator({ position = 'top' }: DropIndicatorProps) {
  return (
    <div
      className={cn(
        'absolute left-2 right-2 h-1 z-20 pointer-events-none bg-blue-300',
        position === 'top' ? '-top-0.5' : '-bottom-0.5',
      )}
    />
  );
}

interface GroupDropZoneProps {
  groupId: string;
  isVisible: boolean;
}
function GroupDropZone({ groupId, isVisible }: GroupDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `${groupId}-end`,
    data: { type: 'group-end', groupId },
  });

  if (!isVisible)
    return null;

  return (
    <div ref={setNodeRef} className="relative h-4 mt-2 -mx-2 flex items-center">
      <div
        className={cn(
          'absolute left-4 right-4 h-px transition-all duration-200',
          isOver
            ? 'bg-blue-300 h-1'
            : 'bg-border/20',
        )}
      />
    </div>
  );
}

function GroupsEndDropZone({ isVisible }: { isVisible: boolean }) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'groups-end-list',
    data: { type: 'group-end-list' },
  });

  if (!isVisible)
    return null;

  return (
    <div ref={setNodeRef} className="h-6 relative mt-1 flex items-center">
      {isOver && <DropIndicator position="top" />}
    </div>
  );
}

function SidebarActionStrip() {
  const addNote = useNotesStore(s => s.addNote);
  const addGroup = useNotesStore(s => s.addGroup);
  const sortData = useNotesStore(s => s.sortData);
  const { openTab } = useTabsStore();

  const navigate = useNavigate();

  const handleAddNote = () => {
    const id = addNote();
    openTab(id);
    navigate({ to: '/notes' });
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
        <TooltipContent side="bottom" className="text-xs">
          New Page
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          onClick={() => addGroup()}
          className="flex items-center justify-center p-1 text-muted-foreground hover:text-foreground rounded-sm transition-colors duration-200 cursor-pointer"
        >
          <IconFolderPlus className="size-4" />
          <span className="sr-only">New Group</span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          New Group
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          onClick={sortData}
          className="flex items-center justify-center p-1 text-muted-foreground hover:text-foreground rounded-sm transition-colors duration-200 cursor-pointer"
        >
          <IconSort className="size-4" />
          <span className="sr-only">Sort</span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Sort Alphabetically
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

interface NoteMenuContentProps {
  noteId: string;
  groupId: string | null;
  variant: 'context' | 'dropdown';
}
function NoteMenuContent({ noteId, groupId, variant }: NoteMenuContentProps) {
  const navigate = useNavigate();
  const groups = useNotesStore(s => s.groups);
  const duplicateNote = useNotesStore(s => s.duplicateNote);
  const deleteNote = useNotesStore(s => s.deleteNote);
  const moveNote = useNotesStore(s => s.moveNote);

  const { openTab } = useTabsStore();

  const Item = variant === 'context' ? ContextMenuItem : DropdownMenuItem;
  const Separator
    = variant === 'context' ? ContextMenuSeparator : DropdownMenuSeparator;
  const Sub = variant === 'context' ? ContextMenuSub : DropdownMenuSub;
  const SubTrigger
    = variant === 'context' ? ContextMenuSubTrigger : DropdownMenuSubTrigger;
  const SubContent
    = variant === 'context' ? ContextMenuSubContent : DropdownMenuSubContent;

  const handleDuplicate = () => {
    const newId = duplicateNote(noteId);
    if (newId) {
      openTab(newId);
      navigate({ to: '/notes' });
    }
  };

  const handleDelete = () => {
    deleteNote(noteId);
  };

  const handleOpenInNewTab = () => {
    openTab(noteId);
    navigate({ to: '/notes' });
  };

  const handleMoveToGroup = (targetGroupId: string) => {
    if (groupId && groupId !== targetGroupId) {
      moveNote(noteId, groupId, targetGroupId);
    }
  };

  const availableGroups = groups.filter(g => g.id !== groupId);

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
          {availableGroups.length > 0
            ? (
                availableGroups.map(g => (
                  <Item key={g.id} onClick={() => handleMoveToGroup(g.id)}>
                    {g.title}
                  </Item>
                ))
              )
            : (
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

      <Item disabled>
        <IconPanelRight className="size-4" />
        Open in Side Peek
      </Item>
    </>
  );
}

const DISPLAY_LIMITS = [
  { value: 5, label: 'Show 5 items' },
  { value: 10, label: 'Show 10 items' },
  { value: 20, label: 'Show 20 items' },
  { value: null, label: 'Show all' },
] as const;

const SORT_OPTIONS: {
  value: SortOrder;
  label: string;
  icon: typeof IconArrowDownAZ;
}[] = [
  { value: 'manual', label: 'Manual', icon: IconListOrdered },
  { value: 'a-z', label: 'A → Z', icon: IconArrowDownAZ },
  { value: 'z-a', label: 'Z → A', icon: IconArrowUpZA },
];

interface GroupMenuContentProps {
  group: Group;
  variant: 'context' | 'dropdown';
}
function GroupMenuContent({ group, variant }: GroupMenuContentProps) {
  const sortGroup = useNotesStore(s => s.sortGroup);
  const setGroupDisplayLimit = useNotesStore(s => s.setGroupDisplayLimit);

  const Item = variant === 'context' ? ContextMenuItem : DropdownMenuItem;
  const Separator
    = variant === 'context' ? ContextMenuSeparator : DropdownMenuSeparator;
  const Sub = variant === 'context' ? ContextMenuSub : DropdownMenuSub;
  const SubTrigger
    = variant === 'context' ? ContextMenuSubTrigger : DropdownMenuSubTrigger;
  const SubContent
    = variant === 'context' ? ContextMenuSubContent : DropdownMenuSubContent;

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
            {isActive && (
              <IconCheck className="size-3.5 ml-auto text-primary" />
            )}
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
                {option.value === null
                  ? (
                      <IconInfinity className="size-4" />
                    )
                  : (
                      <span className="w-4 text-center text-xs font-medium text-muted-foreground">
                        {option.value}
                      </span>
                    )}
                {option.label}
                {isActive && (
                  <IconCheck className="size-3.5 ml-auto text-primary" />
                )}
              </Item>
            );
          })}
        </SubContent>
      </Sub>
    </>
  );
}

interface HiddenNotesPopoverProps {
  noteIds: string[];
  activeNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
}

function HiddenNoteItem({
  noteId,
  isActive,
  onClick,
}: {
  noteId: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const note = useNoteMetadata(noteId);
  if (!note) {
    return null;
  }
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm',
        'hover:bg-accent transition-colors duration-100',
        'text-left cursor-pointer',
        isActive && 'bg-accent/50 text-accent-foreground',
      )}
    >
      <span className="text-base leading-none">{note.emoji}</span>
      <span className="flex-1 truncate">{note.title}</span>
    </button>
  );
}

function HiddenNotesPopover({
  noteIds,
  activeNoteId,
  onNoteSelect,
}: HiddenNotesPopoverProps) {
  const navigate = useNavigate();
  const { openTab } = useTabsStore();

  const handleNoteClick = (noteId: string) => {
    onNoteSelect(noteId);
    openTab(noteId);

    navigate({ to: '/notes' });
  };

  return (
    <li className="relative">
      <Popover>
        <PopoverTrigger
          render={(
            <button
              className={cn(
                'w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs',
                'text-muted-foreground/70 hover:text-muted-foreground',
                'hover:bg-sidebar-accent/40 transition-colors duration-150',
                'cursor-pointer select-none group/more',
              )}
            >
              <span className="text-muted-foreground/50">
                +
                {noteIds.length}
              </span>
              <span>more</span>
              <svg
                className="size-3 ml-auto opacity-50 group-hover/more:opacity-100 transition-opacity"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m9 5 7 7-7 7"
                />
              </svg>
            </button>
          )}
        />
        <PopoverContent
          side="right"
          align="start"
          sideOffset={8}
          className="w-56 p-1.5 max-h-64 overflow-y-auto scrollbar-custom"
        >
          <div className="space-y-0.5">
            {noteIds.map(noteId => (
              <HiddenNoteItem
                key={noteId}
                noteId={noteId}
                isActive={activeNoteId === noteId}
                onClick={() => handleNoteClick(noteId)}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </li>
  );
}

// TODO: Re-implement TOC extraction from Lexical serialized state
// For now, TOC feature is disabled until we can properly parse SerializedEditorState
/*
type NoteHeadingsProps = {
    content: unknown;
};
function NoteHeadings({ content }: NoteHeadingsProps) {
    // Placeholder component - TOC from Lexical state needs implementation
    return null;
}
*/

function SidebarDragOverlay({
  noteId,
  isNoteDrag,
}: {
  noteId: string | null;
  isNoteDrag: boolean;
}) {
  const note = useNoteMetadata(noteId ?? '');
  if (!noteId || !isNoteDrag || !note) {
    return null;
  }
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-background border rounded-md shadow-lg text-sm z-50 pointer-events-none">
      <span>{note.emoji}</span>
      <span>{note.title}</span>
    </div>
  );
}

interface SortableNoteProps {
  noteId: string;
  groupId: string | null;
  isActive: boolean;
  onSelect: () => void;
  activeDragType: 'note' | 'group' | null;
}
function SortableNote({
  noteId,
  groupId,
  isActive,
  onSelect,
  activeDragType,
}: SortableNoteProps) {
  const navigate = useNavigate();
  const note = useNoteMetadata(noteId);
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
    id: noteId,
    data: { type: 'note', groupId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (ev: React.MouseEvent) => {
    if (ev.metaKey || ev.ctrlKey)
      ev.preventDefault();

    onSelect();
    navigate({ to: '/notes' });
  };

  const showIndicator = isOver && !isDragging && activeDragType === 'note';
  const showDotsButton = isHovered || dropdownOpen;

  if (!note)
    return null;

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={(
          <SidebarMenuItem
            ref={setNodeRef}
            style={style}
            className="relative group/note"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          />
        )}
      >
        {showIndicator && <DropIndicator position="top" />}
        <div className="relative">
          <SidebarMenuButton
            isActive={isActive}
            className={cn(
              'cursor-grab active:cursor-grabbing pr-8',
              'data-[active=true]:bg-background data-[active=true]:ring-1 data-[active=true]:ring-border/50 data-[active=true]:text-foreground data-[active=true]:shadow-sm',
              'group-hover/note:bg-sidebar-accent',
              isDragging && 'opacity-30',
            )}
            {...attributes}
            {...listeners}
            render={(
              <Link
                to="/notes"
                onClick={handleClick}
                draggable={false}
                onDragStart={(ev) => {
                  ev.preventDefault();
                }}
              />
            )}
          >
            <span>{note.emoji}</span>
            <span className="flex-1 truncate">{note.title}</span>
          </SidebarMenuButton>

          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <Tooltip>
                <TooltipTrigger
                  render={(
                    <DropdownMenuTrigger
                      render={(
                        <button
                          className={cn(
                            'p-1 rounded-sm',
                            'text-sidebar-foreground/90 hover:text-sidebar-foreground',
                            'transition-all duration-150',
                            showDotsButton ? 'opacity-100' : 'opacity-0',
                            'focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none',
                            isActive
                              ? 'hover:bg-border/40 hover:ring-1 hover:ring-border/50'
                              : 'hover:bg-sidebar-accent-foreground/5',
                          )}
                        >
                          <IconMoreHorizontal className="size-4" />
                        </button>
                      )}
                    />
                  )}
                />
                <TooltipContent side="top">More actions</TooltipContent>
              </Tooltip>
              <DropdownMenuContent
                side="right"
                align="start"
                className="min-w-48"
              >
                <NoteMenuContent
                  noteId={noteId}
                  groupId={groupId}
                  variant="dropdown"
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <NoteMenuContent noteId={noteId} groupId={groupId} variant="context" />
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface SortableGroupProps {
  group: Group;
  activeNoteId: string | null;
  isDragSelected: boolean;
  showDropBackground: boolean;
  onNoteSelect: (noteId: string) => void;
  onToggleCollapse: () => void;
  onAddNote: () => void;
  activeDragType: 'note' | 'group' | null;
  isLast: boolean;
}
function SortableGroup({
  group,
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
    data: { type: 'group' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const showTopIndicator = isOver && !isDragging && activeDragType === 'group';

  return (
    <SidebarGroup
      ref={setNodeRef}
      style={style}
      className={cn(
        'group/sidebar-group relative rounded-md pl-2 pr-1 py-1 transition-colors duration-200',
        isDragSelected && 'bg-sidebar-accent/30 ring-1 ring-sidebar-border',
        isDragging && 'opacity-30',
        showDropBackground
        && isOver
        && !isDragging
        && activeDragType === 'note'
        && 'bg-primary/5 ring-1 ring-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.05)]',
      )}
    >
      {showTopIndicator && <DropIndicator position="top" />}

      <ContextMenu>
        <ContextMenuTrigger render={<div className="group/header relative" />}>
          <SidebarGroupLabel
            className={cn(
              'w-full min-w-0 cursor-grab active:cursor-grabbing transition-colors duration-150 p-0',
              'group-hover/header:bg-sidebar-accent group-hover/header:text-sidebar-accent-foreground',
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
              <span className="truncate text-xs font-medium">
                {group.title}
              </span>
            </button>
          </SidebarGroupLabel>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={(
                  <DropdownMenuTrigger
                    render={(
                      <SidebarGroupAction className="top-1/2 -translate-y-1/2 right-8 rounded-sm opacity-0 group-hover/header:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-sidebar-accent-foreground/5 text-sidebar-foreground/90">
                        <IconMoreHorizontal className="size-4" />
                        <span className="sr-only">More options</span>
                      </SidebarGroupAction>
                    )}
                  />
                )}
              />
              <TooltipContent side="top">More options</TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              side="right"
              align="start"
              className="min-w-48"
            >
              <GroupMenuContent group={group} variant="dropdown" />
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger
              render={(
                <SidebarGroupAction
                  onClick={onAddNote}
                  className="top-1/2 -translate-y-1/2 rounded-sm opacity-0 group-hover/header:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-sidebar-accent-foreground/5 text-sidebar-foreground/90"
                >
                  <IconAdd className="size-4" />
                  <span className="sr-only">New Page</span>
                </SidebarGroupAction>
              )}
            />
            <TooltipContent side="top">New Page</TooltipContent>
          </Tooltip>
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
              {(group.displayLimit
                ? group.noteIds.slice(0, group.displayLimit)
                : group.noteIds
              ).map(noteId => (
                <SortableNote
                  key={noteId}
                  noteId={noteId}
                  groupId={group.id}
                  isActive={activeNoteId === noteId}
                  onSelect={() => onNoteSelect(noteId)}
                  activeDragType={activeDragType}
                />
              ))}
              {group.displayLimit && group.noteIds.length > group.displayLimit && (
                <HiddenNotesPopover
                  noteIds={group.noteIds.slice(group.displayLimit)}
                  activeNoteId={activeNoteId}
                  onNoteSelect={onNoteSelect}
                />
              )}
            </SidebarMenu>
          </SortableContext>
          <GroupDropZone
            groupId={group.id}
            isVisible={activeDragType === 'note'}
          />
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const layout = usePlatformLayout();
  const navigate = useNavigate();
  const groups = useNotesStore(s => s.groups);
  const addNote = useNotesStore(s => s.addNote);
  const toggleGroupCollapse = useNotesStore(s => s.toggleGroupCollapse);
  const reorderGroups = useNotesStore(s => s.reorderGroups);
  const moveNote = useNotesStore(s => s.moveNote);
  const reorderNotesInGroup = useNotesStore(s => s.reorderNotesInGroup);
  const { openTab, activeTabId } = useTabsStore();

  const dragContext = useDragContext();

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<'note' | 'group' | null>(
    null,
  );
  const activeDragTypeRef = useRef<'note' | 'group' | null>(null);
  const sidebarContentRef = useRef<HTMLDivElement>(null);
  const lastOverId = useRef<string | null>(null);

  const { perform } = useHaptics();

  const draggingGroupId = activeDragType === 'group' ? activeDragId : null;
  const isDraggingGroup = activeDragType === 'group';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // Only restrict to vertical axis when dragging groups, not notes
  const conditionalVerticalRestriction: Modifier = (args) => {
    // Restricting to sidebar bounds
    const { transform, draggingNodeRect } = args;

    if (!sidebarContentRef.current || !draggingNodeRect) {
      return transform;
    }

    const value = { ...transform };

    if (activeDragTypeRef.current === 'group') {
      const verticalTransform = restrictToVerticalAxis(args);
      value.x = verticalTransform.x;
      value.y = verticalTransform.y;
    }

    const containerRect = sidebarContentRef.current.getBoundingClientRect();
    const minTop = containerRect.top;
    const maxBottom = containerRect.bottom;

    const minY = minTop - draggingNodeRect.top;
    const maxY = maxBottom - draggingNodeRect.bottom;

    value.y = Math.max(minY, Math.min(value.y, maxY));

    // Also restrict X for notes/groups so they don't fly off too far
    const minX = containerRect.left - draggingNodeRect.left;
    const maxX = containerRect.right - draggingNodeRect.right;

    value.x = Math.max(minX, Math.min(value.x, maxX));

    return value;
  };

  const collisionDetection: CollisionDetection = (args) => {
    const activeType
      = args.active.data.current?.type ?? activeDragTypeRef.current;

    // Check if pointer is within sidebar
    if (sidebarContentRef.current && args.pointerCoordinates) {
      const rect = sidebarContentRef.current.getBoundingClientRect();
      const { x, y } = args.pointerCoordinates;

      const isInside
        = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

      if (!isInside)
        return [];
    }

    const droppableContainers
      = activeType === 'group'
        ? args.droppableContainers.filter(
            container => container.data.current?.type === 'group',
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
    if (type === 'note' && dragContext) {
      dragContext.startDrag(active.id as string, 'sidebar');
    }

    perform(HapticFeedbackPattern.Alignment);
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
    setActiveDragType(null);
    activeDragTypeRef.current = null;
    lastOverId.current = null;
    dragContext?.endDrag();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveDragId(null);
    setActiveDragType(null);
    activeDragTypeRef.current = null;
    lastOverId.current = null;

    dragContext?.endDrag();

    if (!over || active.id === over.id)
      return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Reorder groups
    if (activeType === 'group') {
      if (overType === 'group') {
        reorderGroups(active.id as string, over.id as string);
      }
      else if (overType === 'group-end-list') {
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && active.id !== lastGroup.id) {
          reorderGroups(active.id as string, lastGroup.id);
        }
      }
      return;
    }

    // Reorder or move notes
    if (activeType === 'note') {
      const activeGroupId = active.data.current?.groupId;

      if (overType === 'note') {
        const overGroupId = over.data.current?.groupId;

        if (activeGroupId === overGroupId) {
          // Reorder within same group
          reorderNotesInGroup(
            activeGroupId,
            active.id as string,
            over.id as string,
          );
        }
        else {
          // Move to different group
          moveNote(
            active.id as string,
            activeGroupId,
            overGroupId,
            over.id as string,
          );
        }
      }
      else if (overType === 'group') {
        // Drop on group header - add to end of that group
        if (activeGroupId !== over.id) {
          moveNote(active.id as string, activeGroupId, over.id as string);
        }
      }
      else if (overType === 'group-end') {
        // Drop at end of group
        const targetGroupId = over.data.current?.groupId;
        if (activeGroupId !== targetGroupId) {
          moveNote(active.id as string, activeGroupId, targetGroupId);
        }
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;

    if (over && over.id !== lastOverId.current) {
      lastOverId.current = over.id as string;
      perform(HapticFeedbackPattern.Alignment);
    }
  };

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-border/40"
      style={{
        top: 0,
        height: '100vh',
      }}
    >
      <SidebarHeader
        className="px-3 pb-0"
        style={{ paddingTop: `calc(${layout.titlebarHeight}px + 0.5rem)` }}
      >
        <SidebarActionStrip />
      </SidebarHeader>

      <SidebarContent
        className="overflow-x-hidden pl-2 pr-1 pb-4"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div ref={sidebarContentRef} className="flex flex-col">
          <DndContext
            sensors={sensors}
            autoScroll={false}
            collisionDetection={collisionDetection}
            modifiers={[conditionalVerticalRestriction]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            onDragOver={handleDragOver}
          >
            <SortableContext
              items={groups.map(g => g.id)}
              strategy={verticalListSortingStrategy}
            >
              {groups.map((group, index) => (
                <SortableGroup
                  key={group.id}
                  group={group}
                  activeNoteId={activeTabId}
                  isDragSelected={draggingGroupId === group.id}
                  showDropBackground={!isDraggingGroup}
                  onNoteSelect={(noteId) => {
                    openTab(noteId);
                  }}
                  onToggleCollapse={() => toggleGroupCollapse(group.id)}
                  onAddNote={() => {
                    const id = addNote(group.id);
                    openTab(id);

                    navigate({ to: '/notes' });
                  }}
                  activeDragType={activeDragType}
                  isLast={index === groups.length - 1}
                />
              ))}
            </SortableContext>
            <GroupsEndDropZone isVisible={activeDragType === 'group'} />

            <DragOverlay dropAnimation={null}>
              <SidebarDragOverlay noteId={activeDragId} isNoteDrag={activeDragType === 'note'} />
            </DragOverlay>
          </DndContext>
        </div>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

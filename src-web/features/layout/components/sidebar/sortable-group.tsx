import type { SortingStrategy } from '@dnd-kit/sortable';
import type { Group } from '~/features/notes/store';

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import IconMoreHorizontal from '~icons/lucide/more-horizontal';
import IconAdd from '~icons/lucide/plus';
import { cn } from '~/lib/utils';
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '~/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '~/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '~/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/ui/tooltip';

import { DropIndicator } from './drop-indicator';
import { GroupDropZone } from './drop-zones';
import { GroupMenuContent } from './group-menu-content';
import { HiddenNotesPopover } from './hidden-notes-popover';
import { SortableNote } from './sortable-note';

interface SortableGroupProps {
  group: Group;
  activeNoteId: string | null;
  isDragSelected: boolean;
  showDropBackground: boolean;
  onNoteSelect: (noteId: string) => void;
  onToggleCollapse: () => void;
  onAddNote: () => void;
  activeDragType: 'note' | 'group' | null;
  activeDragId: string | null;
  isSidebarFrozen: boolean;
  sortingStrategy: SortingStrategy;
}

export function SortableGroup({
  group,
  activeNoteId,
  isDragSelected,
  showDropBackground,
  onNoteSelect,
  onToggleCollapse,
  onAddNote,
  activeDragType,
  activeDragId,
  isSidebarFrozen,
  sortingStrategy,
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
            strategy={sortingStrategy}
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
                  activeDragId={activeDragId}
                  isSidebarFrozen={isSidebarFrozen}
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

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import IconMoreHorizontal from '~icons/lucide/more-horizontal';
import { useDragStore } from '~/features/layout/stores/drag-store';
import { useNoteMetadata } from '~/features/notes/store';
import { cn } from '~/lib/utils';
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '~/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '~/ui/dropdown-menu';
import { SidebarMenuButton, SidebarMenuItem } from '~/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/ui/tooltip';

import { DropIndicator } from './drop-indicator';
import { NoteMenuContent } from './note-menu-content';

interface SortableNoteProps {
  noteId: string;
  groupId: string | null;
  isActive: boolean;
  onSelect: () => void;
  activeDragType: 'note' | 'group' | null;
  activeDragId: string | null;
  isSidebarFrozen: boolean;
}

export function SortableNote({
  noteId,
  groupId,
  isActive,
  onSelect,
  activeDragType,
  activeDragId,
  isSidebarFrozen,
}: SortableNoteProps) {
  const navigate = useNavigate();
  const note = useNoteMetadata(noteId);
  const [isHovered, setIsHovered] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isOutsideSidebar = useDragStore(s => s.isOutsideSidebar);

  const isFrozenDraggedItem = isSidebarFrozen && activeDragId === noteId;
  const disableLayoutAnimation = isSidebarFrozen || isOutsideSidebar;

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
    animateLayoutChanges: () => !disableLayoutAnimation,
  });

  const style = {
    transform: disableLayoutAnimation ? 'none' : CSS.Transform.toString(transform),
    transition: disableLayoutAnimation ? 'none' : transition,
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
              (isDragging || isFrozenDraggedItem) && 'opacity-30',
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

import type { RefObject } from 'react';
import type { HeaderTabItemHandle } from './types';
import type { Pane, PaneId } from '~/features/layout/stores/tabs-store';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useEffect, useImperativeHandle, useRef } from 'react';

import IconX from '~icons/lucide/x';
import { useNoteMetadata } from '~/features/notes/store';
import { cn } from '~/lib/utils';

interface SplitPaneProps {
  noteId: string;
  side: 'left' | 'right';
  isPaneActive: boolean;
  onActivateSide: (side: 'left' | 'right') => void;
  onCloseNote: (noteId: string) => void;
  buttonRef: (side: 'left' | 'right', el: HTMLButtonElement | null) => void;
}

function SplitPane({
  noteId,
  side,
  isPaneActive,
  onActivateSide,
  onCloseNote,
  buttonRef,
}: SplitPaneProps) {
  const note = useNoteMetadata(noteId);

  if (!note) {
    return null;
  }

  return (
    <div className="group/pane relative flex items-center">
      <button
        ref={el => buttonRef(side, el)}
        onClick={(ev) => {
          ev.stopPropagation();
          onActivateSide(side);
        }}
        role="tab"
        aria-selected={isPaneActive}
        className={cn(
          'flex items-center gap-2 pl-2.5 pr-7 py-0.5 rounded-sm transition-all outline-none',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
          isPaneActive
            ? 'bg-muted/50 text-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
        )}
      >
        <span className="text-[14px] shrink-0">{note.emoji}</span>
        <span className="text-[13px] font-medium truncate max-w-[100px]">
          {note.title}
        </span>
      </button>

      <button
        onClick={(ev) => {
          ev.stopPropagation();
          onCloseNote(noteId);
        }}
        tabIndex={-1}
        className={cn(
          'absolute right-1.5 top-1/2 -translate-y-1/2 z-10 p-0.5 rounded-sm transition-all duration-150',
          'text-muted-foreground/40 hover:text-foreground hover:bg-muted/60',
          'focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none',
          isPaneActive
            ? 'opacity-100'
            : 'opacity-0 group-hover/pane:opacity-100',
        )}
        aria-label="Close pane"
      >
        <IconX className="size-3" />
      </button>
    </div>
  );
}

interface SplitTabItemProps {
  paneId: PaneId;
  pane: Extract<Pane, { type: 'split' }>;
  isActive: boolean;
  isPinned: boolean;
  onActivate: () => void;
  onActivateSide: (side: 'left' | 'right') => void;
  onClose: () => void;
  onCloseNote: (noteId: string) => void;
  ref?: ((handle: HeaderTabItemHandle | null) => void) | React.RefObject<HeaderTabItemHandle | null>;
}

export function SplitTabItem({
  ref,
  paneId,
  pane,
  isActive,
  isPinned,
  onActivateSide,
  onCloseNote,
}: SplitTabItemProps) {
  const tabRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<'left' | 'right', HTMLButtonElement>>(new Map());

  const handleButtonRef = (side: 'left' | 'right', el: HTMLButtonElement | null) => {
    if (el) {
      buttonRefs.current.set(side, el);
    }
    else {
      buttonRefs.current.delete(side);
    }
  };

  useImperativeHandle(ref, () => ({
    focus: () => {
      const activeSide = pane.activeSide;
      if (buttonRefs.current.has(activeSide)) {
        buttonRefs.current.get(activeSide)?.focus();
      }
      else {
        buttonRefs.current.get('left')?.focus();
      }
    },
  }));

  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({
    id: paneId,
    data: { section: isPinned ? 'pinned' : 'open' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (isActive && tabRef.current) {
      tabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [isActive]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (tabRef as RefObject<HTMLDivElement | null>).current = node;
      }}
      style={style}
      className={cn(
        'group relative flex items-center select-none shrink-0 rounded-md outline-none p-0.5 gap-0.5',
        'transition-all duration-200 ease-out cursor-grab active:cursor-grabbing ring-1 ring-transparent',
        isActive
          ? 'bg-background ring-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
          : 'bg-muted/30 hover:bg-muted/50 hover:ring-border/40',
        isDragging && 'opacity-50',
      )}
      {...attributes}
      {...listeners}
      data-no-drag
      role="presentation"
      tabIndex={-1}
    >
      <SplitPane
        noteId={pane.left}
        side="left"
        isPaneActive={pane.activeSide === 'left'}
        onActivateSide={onActivateSide}
        onCloseNote={onCloseNote}
        buttonRef={handleButtonRef}
      />
      <SplitPane
        noteId={pane.right}
        side="right"
        isPaneActive={pane.activeSide === 'right'}
        onActivateSide={onActivateSide}
        onCloseNote={onCloseNote}
        buttonRef={handleButtonRef}
      />
    </div>
  );
}

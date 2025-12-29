import { useNavigate } from '@tanstack/react-router';

import { useTabsStore } from '~/features/layout/stores/tabs-store';
import { useNoteMetadata } from '~/features/notes/store';
import { cn } from '~/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '~/ui/popover';

interface HiddenNoteItemProps {
  noteId: string;
  isActive: boolean;
  onClick: () => void;
}

function HiddenNoteItem({ noteId, isActive, onClick }: HiddenNoteItemProps) {
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

interface HiddenNotesPopoverProps {
  noteIds: string[];
  activeNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
}

export function HiddenNotesPopover({
  noteIds,
  activeNoteId,
  onNoteSelect,
}: HiddenNotesPopoverProps) {
  const navigate = useNavigate();
  const openNote = useTabsStore(s => s.openNote);

  const handleNoteClick = (noteId: string) => {
    onNoteSelect(noteId);
    openNote(noteId);

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

import IconCheck from '~icons/lucide/check';

import { useNoteMetadata } from '~/features/notes/store';
import { cn } from '~/lib/utils';
import { DropdownMenuItem } from '~/ui/dropdown-menu';

interface TabDropdownItemProps {
  noteId: string;
  isActive: boolean;
  onClick: () => void;
}

export function TabDropdownItem({ noteId, isActive, onClick }: TabDropdownItemProps) {
  const note = useNoteMetadata(noteId);
  if (!note) {
    return null;
  }
  return (
    <DropdownMenuItem onClick={onClick} className="gap-2">
      <span className="text-sm shrink-0">{note.emoji}</span>
      <span
        className={cn(
          'truncate flex-1 font-medium',
          !isActive && 'text-muted-foreground text-normal',
        )}
      >
        {note.title}
      </span>
      {isActive && <IconCheck className="size-3.5 text-primary ml-auto" />}
    </DropdownMenuItem>
  );
}

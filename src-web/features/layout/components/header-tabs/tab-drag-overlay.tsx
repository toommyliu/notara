import { useNoteMetadata } from '~/features/notes/store';

interface TabDragOverlayProps {
  noteId: string | null;
}

export function TabDragOverlay({ noteId }: TabDragOverlayProps) {
  const note = useNoteMetadata(noteId ?? '');
  if (!noteId || !note) {
    return null;
  }
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 bg-background border rounded-md shadow-lg text-sm whitespace-nowrap z-50 pointer-events-none"
      data-no-drag
    >
      <span>{note.emoji}</span>
      <span className="font-medium">{note.title}</span>
    </div>
  );
}

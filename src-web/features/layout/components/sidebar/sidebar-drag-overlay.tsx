import { useNoteMetadata } from '~/features/notes/store';

interface SidebarDragOverlayProps {
  noteId: string | null;
  isNoteDrag: boolean;
}

export function SidebarDragOverlay({ noteId, isNoteDrag }: SidebarDragOverlayProps) {
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

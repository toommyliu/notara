'use client';

import { useNotesStore } from '~/features/notes';
import { useCodeMirror } from './use-codemirror';

interface NoteEditorProps {
  noteId: string;
}

export function NoteEditor({ noteId }: NoteEditorProps) {
  const content = useNotesStore((s) => s.notes.get(noteId)?.content ?? '');
  const updateNote = useNotesStore((s) => s.updateNote);

  const handleChange = (value: string) => {
    updateNote(noteId, { content: value });
  };

  const { containerRef } = useCodeMirror({
    initialValue: content,
    onChange: handleChange,
  });

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-background text-foreground"
    />
  );
}

import { Plate, usePlateEditor } from 'platejs/react';

import { useNotesStore } from '~/features/notes/store';

import { Editor, EditorContainer } from './components/editor';
import { EditorUIProvider } from './contexts/editor-ui-context';
import { BaseEditorKit } from './editor-base-kit';

interface NoteEditorProps {
  noteId: string;
}

export function NoteEditor({ noteId }: NoteEditorProps) {
  const note = useNotesStore(s => s.notes.get(noteId));
  const updateNote = useNotesStore(s => s.updateNote);

  const editor = usePlateEditor({
    id: noteId,
    plugins: BaseEditorKit,
    value: note?.content ?? undefined,
  });

  return (
    <EditorUIProvider
      noteId={noteId}
      noteTitle={note?.title ?? 'Untitled'}
      noteEmoji={note?.emoji ?? ''}
    >
      <Plate
        editor={editor}
        onValueChange={({ value }) => {
          updateNote(noteId, { content: value });
        }}
      >
        <EditorContainer>
          <Editor placeholder="Start writing..." />
        </EditorContainer>
      </Plate>
    </EditorUIProvider>
  );
}

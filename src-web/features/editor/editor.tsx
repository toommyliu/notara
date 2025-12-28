import { Plate, usePlateEditor } from 'platejs/react';

import { useNotesStore } from '~/features/notes/store';

import { Editor, EditorContainer } from './components/editor';
import { EditorUIProvider } from './contexts/editor-ui-context';
import { EditorKit } from './editor-kit';

interface NoteEditorProps {
  noteId: string;
}

export function NoteEditor({ noteId }: NoteEditorProps) {
  const note = useNotesStore(s => s.notes.get(noteId));
  const updateNote = useNotesStore(s => s.updateNote);

  const editor = usePlateEditor({
    id: noteId,
    plugins: EditorKit,
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
        <EditorContainer className="scrollbar-custom">
          <Editor placeholder="Type '/' to open commands..." />
        </EditorContainer>
      </Plate>
    </EditorUIProvider>
  );
}

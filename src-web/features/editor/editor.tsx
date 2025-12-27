import { Plate, usePlateEditor } from 'platejs/react';

import { Editor, EditorContainer } from './components/editor';
import { EditorUIProvider } from './contexts/editor-ui-context';
import { BaseEditorKit } from './editor-base-kit';

export function NoteEditor() {
  const editor = usePlateEditor({
    plugins: BaseEditorKit,
  });

  return (
    <EditorUIProvider>
      <Plate editor={editor}>
        <EditorContainer>
          <Editor placeholder="Start writing..." />
        </EditorContainer>
      </Plate>
    </EditorUIProvider>
  );
}

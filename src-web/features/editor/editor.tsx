import { Plate, usePlateEditor } from 'platejs/react';

import { Editor, EditorContainer } from './components/editor';
import { BaseEditorKit } from './editor-base-kit';

export function NoteEditor() {
    const editor = usePlateEditor({
        plugins: BaseEditorKit
    });

    return (
        <Plate editor={editor}>
            <EditorContainer>
                <Editor placeholder="Start writing..." />
            </EditorContainer>
        </Plate>
    );
}

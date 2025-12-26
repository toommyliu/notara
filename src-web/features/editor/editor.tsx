import { Plate, usePlateEditor } from 'platejs/react';

import { BasicNodesKit } from '~/components/editor/plugins/basic-nodes-kit';
import { Editor, EditorContainer } from '~/components/ui/editor';

export function NoteEditor() {
    const editor = usePlateEditor({
        plugins: BasicNodesKit,
    });

    return (
        <Plate editor={editor}>
            <EditorContainer>
                <Editor placeholder="Start writing..." />
            </EditorContainer>
        </Plate>
    );
}


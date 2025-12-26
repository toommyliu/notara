import { Plate, usePlateEditor } from 'platejs/react';

import { AutoformatKit } from '~/components/editor/plugins/autoformat-kit';
import { BasicNodesKit } from '~/components/editor/plugins/basic-nodes-kit';
import { BlockMenuKit } from '~/components/editor/plugins/block-menu-kit';
import { CodeBlockKit } from '~/components/editor/plugins/code-block-kit';
import { ListKit } from '~/components/editor/plugins/list-kit';
import { Editor, EditorContainer } from '~/components/ui/editor';

export function NoteEditor() {
    const editor = usePlateEditor({
        plugins: [
            ...BasicNodesKit,
            ...CodeBlockKit,
            ...ListKit,
            ...BlockMenuKit,
            ...AutoformatKit,
        ],
    });

    return (
        <Plate editor={editor}>
            <EditorContainer>
                <Editor placeholder="Start writing..." />
            </EditorContainer>
        </Plate>
    );
}



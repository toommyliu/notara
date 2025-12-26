import { Plate, usePlateEditor } from 'platejs/react';

import { AutoformatKit } from '~/components/editor/plugins/autoformat-kit';
import { BasicNodesKit } from '~/components/editor/plugins/basic-nodes-kit';
import { BlockMenuKit } from '~/components/editor/plugins/block-menu-kit';
import { BlockPlaceholderKit } from '~/components/editor/plugins/block-placeholder-kit';
import { BlockSelectionKit } from '~/components/editor/plugins/block-selection-kit';
import { CalloutKit } from '~/components/editor/plugins/callout-kit';
import { CodeBlockKit } from '~/components/editor/plugins/code-block-kit';
import { ColumnKit } from '~/components/editor/plugins/column-kit';
import { CursorOverlayKit } from '~/components/editor/plugins/cursor-overlay-kit';
import { DateKit } from '~/components/editor/plugins/date-kit';
import { DndKit } from '~/components/editor/plugins/dnd-kit';
import { EmojiKit } from '~/components/editor/plugins/emoji-kit';
import { ExitBreakKit } from '~/components/editor/plugins/exit-break-kit';
import { FixedToolbarKit } from '~/components/editor/plugins/fixed-toolbar-kit';
import { FloatingToolbarKit } from '~/components/editor/plugins/floating-toolbar-kit';
import { IndentKit } from '~/components/editor/plugins/indent-kit';
import { LinkKit } from '~/components/editor/plugins/link-kit';
import { ListKit } from '~/components/editor/plugins/list-kit';
import { MediaKit } from '~/components/editor/plugins/media-kit';
import { SlashKit } from '~/components/editor/plugins/slash-kit';
import { TableKit } from '~/components/editor/plugins/table-kit';
import { TocKit } from '~/components/editor/plugins/toc-kit';
import { ToggleKit } from '~/components/editor/plugins/toggle-kit';
import { Editor, EditorContainer } from '~/components/ui/editor';

export function NoteEditor() {
    const editor = usePlateEditor({
        plugins: [
            // Basic Blocks
            ...BasicNodesKit, // Headings, block quote, horizontal rule, bold, italic, etc...
            ...CalloutKit, // Tip, Warning, Success
            ...CodeBlockKit, // Code block
            ...ColumnKit, // Column
            ...DateKit,
            ...LinkKit,
            ...ListKit,
            ...MediaKit,
            ...TableKit,
            ...TocKit,
            ...ToggleKit,

            // Styles
            ...IndentKit,

            // Functionality
            ...ExitBreakKit, // cmd + enter, cmd + shift + enter
            ...AutoformatKit, // autoapplies markdown formatting as we type
            ...BlockMenuKit, // Notion-like block menu
            ...BlockPlaceholderKit, // block placeholder text
            ...BlockSelectionKit,
            ...EmojiKit, // emoji picker :)
            ...SlashKit, // block slash menu
            ...CursorOverlayKit, // selection cursor keeps showing when editor loses focus
            ...DndKit, // block drag and drop
            ...FixedToolbarKit,
            ...FloatingToolbarKit
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

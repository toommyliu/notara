import { Plate, usePlateEditor } from 'platejs/react';

import { AutoformatKit } from '~/features/editor/plugins/autoformat-kit';
import { BasicNodesKit } from '~/features/editor/plugins/basic-nodes-kit';
import { BlockMenuKit } from '~/features/editor/plugins/block-menu-kit';
import { BlockPlaceholderKit } from '~/features/editor/plugins/block-placeholder-kit';
import { BlockSelectionKit } from '~/features/editor/plugins/block-selection-kit';
import { CalloutKit } from '~/features/editor/plugins/callout-kit';
import { CodeBlockKit } from '~/features/editor/plugins/code-block-kit';
import { ColumnKit } from '~/features/editor/plugins/column-kit';
import { CursorOverlayKit } from '~/features/editor/plugins/cursor-overlay-kit';
import { DateKit } from '~/features/editor/plugins/date-kit';
import { DndKit } from '~/features/editor/plugins/dnd-kit';
import { EmojiKit } from '~/features/editor/plugins/emoji-kit';
import { ExitBreakKit } from '~/features/editor/plugins/exit-break-kit';
import { FixedToolbarKit } from '~/features/editor/plugins/fixed-toolbar-kit';
import { FloatingToolbarKit } from '~/features/editor/plugins/floating-toolbar-kit';
import { IndentKit } from '~/features/editor/plugins/indent-kit';
import { LinkKit } from '~/features/editor/plugins/link-kit';
import { ListKit } from '~/features/editor/plugins/list-kit';
import { MediaKit } from '~/features/editor/plugins/media-kit';
import { SlashKit } from '~/features/editor/plugins/slash-kit';
import { TableKit } from '~/features/editor/plugins/table-kit';
import { TocKit } from '~/features/editor/plugins/toc-kit';
import { ToggleKit } from '~/features/editor/plugins/toggle-kit';
import { Editor, EditorContainer } from '~/features/editor/components/editor';
import { BaseEditorKit } from './editor-base-kit';
import { CommentKit } from '~/features/editor/plugins/comment-kit';
import { SuggestionKit } from '~/features/editor/plugins/suggestion-kit';

export function NoteEditor() {
    const editor = usePlateEditor({
        plugins: [
            ...BaseEditorKit,

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
            ...CommentKit,
            ...SuggestionKit,

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

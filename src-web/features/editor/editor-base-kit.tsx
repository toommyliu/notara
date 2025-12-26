import { BaseAlignKit } from './plugins/align-base-kit';
import { AutoformatKit } from './plugins/autoformat-kit';
import { BaseBasicBlocksKit } from './plugins/basic-blocks-base-kit';
import { BaseBasicMarksKit } from './plugins/basic-marks-base-kit';
import { BasicNodesKit } from './plugins/basic-nodes-kit';
import { BlockMenuKit } from './plugins/block-menu-kit';
import { BlockPlaceholderKit } from './plugins/block-placeholder-kit';
import { BlockSelectionKit } from './plugins/block-selection-kit';
import { BaseCalloutKit } from './plugins/callout-base-kit';
import { CalloutKit } from './plugins/callout-kit';
import { BaseCodeBlockKit } from './plugins/code-block-base-kit';
import { CodeBlockKit } from './plugins/code-block-kit';
import { BaseColumnKit } from './plugins/column-base-kit';
import { ColumnKit } from './plugins/column-kit';
import { BaseCommentKit } from './plugins/comment-base-kit';
import { CommentKit } from './plugins/comment-kit';
import { CursorOverlayKit } from './plugins/cursor-overlay-kit';
import { BaseDateKit } from './plugins/date-base-kit';
import { DateKit } from './plugins/date-kit';
import { DndKit } from './plugins/dnd-kit';
import { EmojiKit } from './plugins/emoji-kit';
import { ExitBreakKit } from './plugins/exit-break-kit';
import { FixedToolbarKit } from './plugins/fixed-toolbar-kit';
import { FloatingToolbarKit } from './plugins/floating-toolbar-kit';
import { BaseFontKit } from './plugins/font-base-kit';
import { IndentKit } from './plugins/indent-kit';
import { BaseLineHeightKit } from './plugins/line-height-base-kit';
import { BaseLinkKit } from './plugins/link-base-kit';
import { LinkKit } from './plugins/link-kit';
import { BaseListKit } from './plugins/list-base-kit';
import { ListKit } from './plugins/list-kit';
import { MarkdownKit } from './plugins/markdown-kit';
import { BaseMathKit } from './plugins/math-base-kit';
import { BaseMediaKit } from './plugins/media-base-kit';
import { MediaKit } from './plugins/media-kit';
import { BaseMentionKit } from './plugins/mention-base-kit';
import { SlashKit } from './plugins/slash-kit';
import { BaseSuggestionKit } from './plugins/suggestion-base-kit';
import { SuggestionKit } from './plugins/suggestion-kit';
import { BaseTableKit } from './plugins/table-base-kit';
import { TableKit } from './plugins/table-kit';
import { BaseTocKit } from './plugins/toc-base-kit';
import { TocKit } from './plugins/toc-kit';
import { BaseToggleKit } from './plugins/toggle-base-kit';
import { ToggleKit } from './plugins/toggle-kit';

export const BaseEditorKit = [
  ...BaseBasicBlocksKit,
  ...BaseCodeBlockKit,
  ...BaseTableKit,
  ...BaseToggleKit,
  ...BaseTocKit,
  ...BaseMediaKit,
  ...BaseCalloutKit,
  ...BaseColumnKit,
  ...BaseMathKit,
  ...BaseDateKit,
  ...BaseLinkKit,
  ...BaseMentionKit,
  ...BaseBasicMarksKit,
  ...BaseFontKit,
  ...BaseListKit,
  ...BaseAlignKit,
  ...BaseLineHeightKit,
  ...BaseCommentKit,
  ...BaseSuggestionKit,
  ...MarkdownKit,

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
];

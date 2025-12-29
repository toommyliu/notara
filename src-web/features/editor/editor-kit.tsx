'use client';

import { AutoformatKit } from './plugins/autoformat-kit';
import { BasicBlocksKit } from './plugins/basic-blocks-kit';
import { BasicMarksKit } from './plugins/basic-marks-kit';
import { BlockMenuKit } from './plugins/block-menu-kit';
import { BlockPlaceholderKit } from './plugins/block-placeholder-kit';
import { BlockSelectionKit } from './plugins/block-selection-kit';
import { CalloutKit } from './plugins/callout-kit';
import { CodeBlockKit } from './plugins/code-block-kit';
import { ColumnKit } from './plugins/column-kit';
import { CommentKit } from './plugins/comment-kit';
import { CursorOverlayKit } from './plugins/cursor-overlay-kit';
import { DateKit } from './plugins/date-kit';
import { DndKit } from './plugins/dnd-kit';
import { EmojiKit } from './plugins/emoji-kit';
import { ExitBreakKit } from './plugins/exit-break-kit';
import { FloatingToolbarKit } from './plugins/floating-toolbar-kit';
import { IndentKit } from './plugins/indent-kit';
import { LinkKit } from './plugins/link-kit';
import { ListKit } from './plugins/list-kit';
import { MediaKit } from './plugins/media-kit';
import { PageHeaderKit } from './plugins/page-header-kit';
import { PageNavBarKit } from './plugins/page-navbar-kit';
import { SlashKit } from './plugins/slash-kit';
import { SuggestionKit } from './plugins/suggestion-kit';
import { TableKit } from './plugins/table-kit';
import { TocKit } from './plugins/toc-kit';
import { ToggleKit } from './plugins/toggle-kit';

export const EditorKit = [
  // Basic Blocks
  ...BasicBlocksKit,
  ...BasicMarksKit,
  ...CalloutKit,
  ...CodeBlockKit,
  ...ColumnKit,
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
  ...ExitBreakKit,
  ...AutoformatKit,
  ...BlockMenuKit,
  ...BlockPlaceholderKit,
  ...BlockSelectionKit,
  ...EmojiKit,
  ...SlashKit,
  ...CursorOverlayKit,
  ...DndKit,

  ...FloatingToolbarKit,
  ...PageNavBarKit,
  ...PageHeaderKit,
];

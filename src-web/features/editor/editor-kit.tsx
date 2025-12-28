'use client';

import { BasicBlocksKit } from './plugins/basic-blocks-kit';
import { BasicMarksKit } from './plugins/basic-marks-kit';
import { CalloutKit } from './plugins/callout-kit';
import { CodeBlockKit } from './plugins/code-block-kit';
import { ColumnKit } from './plugins/column-kit';
import { CommentKit } from './plugins/comment-kit';
import { DateKit } from './plugins/date-kit';
import { LinkKit } from './plugins/link-kit';
import { ListKit } from './plugins/list-kit';
import { MediaKit } from './plugins/media-kit';
import { TableKit } from './plugins/table-kit';
import { TocKit } from './plugins/toc-kit';
import { ToggleKit } from './plugins/toggle-kit';
import { SuggestionKit } from './plugins/suggestion-kit';
import { IndentKit } from './plugins/indent-kit';
import { ExitBreakKit } from './plugins/exit-break-kit';
import { AutoformatKit } from './plugins/autoformat-kit';
import { BlockMenuKit } from './plugins/block-menu-kit';
import { BlockPlaceholderKit } from './plugins/block-placeholder-kit';
import { BlockSelectionKit } from './plugins/block-selection-kit';
import { EmojiKit } from './plugins/emoji-kit';
import { SlashKit } from './plugins/slash-kit';
import { CursorOverlayKit } from './plugins/cursor-overlay-kit';
import { DndKit } from './plugins/dnd-kit';
import { FloatingToolbarKit } from './plugins/floating-toolbar-kit';
import { PageNavBarKit } from './plugins/page-navbar-kit';
import { PageHeaderKit } from './plugins/page-header-kit';

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

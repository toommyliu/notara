'use client';

import {
  BoldIcon,
  Code2Icon,
  ItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorReadOnly } from 'platejs/react';

import { getModKeyLabel } from '~/hooks/use-platform';
import { ToolbarGroup } from '~/ui/toolbar';

import { CommentToolbarButton } from './comment-toolbar-button';
import { EmojiToolbarButton } from './emoji-toolbar-button';
import { InlineEquationToolbarButton } from './equation-toolbar-button';
import { FontColorToolbarButton } from './font-color-toolbar-button';
import { LinkToolbarButton } from './link-toolbar-button';
import { MarkToolbarButton } from './mark-toolbar-button';
import { MoreToolbarButton } from './more-toolbar-button';
import { SuggestionToolbarButton } from './suggestion-toolbar-button';
import { TurnIntoToolbarButton } from './turn-into-toolbar-button';

export function FloatingToolbarButtons() {
  const readOnly = useEditorReadOnly();

  return (
    <>
      <ToolbarGroup>
        <CommentToolbarButton />

        <EmojiToolbarButton />

        <SuggestionToolbarButton />
      </ToolbarGroup>

      {!readOnly && (
        <ToolbarGroup>
          <TurnIntoToolbarButton />

          <MarkToolbarButton
            nodeType={KEYS.bold}
            tooltip={`Bold (${getModKeyLabel()}+B)`}
          >
            <BoldIcon />
          </MarkToolbarButton>

          <MarkToolbarButton
            nodeType={KEYS.italic}
            tooltip={`Italic (${getModKeyLabel()}+I)`}
          >
            <ItalicIcon />
          </MarkToolbarButton>

          <MarkToolbarButton
            nodeType={KEYS.underline}
            tooltip={`Underline (${getModKeyLabel()}+U)`}
          >
            <UnderlineIcon />
          </MarkToolbarButton>

          <MarkToolbarButton
            nodeType={KEYS.strikethrough}
            tooltip={`Strikethrough (${getModKeyLabel()}+⇧+M)`}
          >
            <StrikethroughIcon />
          </MarkToolbarButton>

          <MarkToolbarButton
            nodeType={KEYS.code}
            tooltip={`Code (${getModKeyLabel()}+E)`}
          >
            <Code2Icon />
          </MarkToolbarButton>

          <InlineEquationToolbarButton />

          <LinkToolbarButton />

          <FontColorToolbarButton />
        </ToolbarGroup>
      )}

      {!readOnly && (
        <ToolbarGroup>
          <MoreToolbarButton />
        </ToolbarGroup>
      )}
    </>
  );
}

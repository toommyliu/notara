'use client';

import { createPlatePlugin } from 'platejs/react';
import * as React from 'react';

import { PageNavBar } from '~/features/editor/components/page-navbar';
import { useEditorUi } from '~/features/editor/contexts/editor-ui-context';
import { useNotesStore } from '~/features/notes/store';

function ConnectedPageNavBar() {
  const { noteId, noteTitle, noteEmoji } = useEditorUi();
  const updateNote = useNotesStore(s => s.updateNote);

  const handleTitleChange = React.useCallback((title: string) => {
    if (noteId) {
      updateNote(noteId, { title });
    }
  }, [noteId, updateNote]);

  const handleEmojiChange = React.useCallback((emoji: string) => {
    if (noteId) {
      updateNote(noteId, { emoji });
    }
  }, [noteId, updateNote]);

  return (
    <PageNavBar
      title={noteTitle}
      icon={noteEmoji}
      onTitleChange={handleTitleChange}
      onEmojiChange={handleEmojiChange}
    />
  );
}

export const PageNavBarKit = [
  createPlatePlugin({
    key: 'page-nav-bar',
    render: {
      beforeEditable: () => <ConnectedPageNavBar />,
    },
  }),
];

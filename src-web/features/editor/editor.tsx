'use client';

import type { KeyboardEvent } from 'react';
import * as React from 'react';
import { useNotesStore } from '~/features/notes';
import { useCodeMirror } from './use-codemirror';

interface NoteEditorProps {
  noteId: string;
}

export function NoteEditor({ noteId }: NoteEditorProps) {
  const content = useNotesStore(s => s.notes.get(noteId)?.content ?? '');
  const title = useNotesStore(s => s.notes.get(noteId)?.title ?? '');
  const updateNote = useNotesStore(s => s.updateNote);

  const titleRef = React.useRef<HTMLDivElement>(null);
  const editorWrapperRef = React.useRef<HTMLDivElement>(null);

  const handleContentChange = (value: string) => {
    updateNote(noteId, { content: value });
  };

  const { containerRef } = useCodeMirror({
    initialValue: content,
    onChange: handleContentChange,
  });

  React.useEffect(() => {
    if (titleRef.current && titleRef.current.textContent !== title) {
      titleRef.current.textContent = title;
    }
  }, [title, noteId]);

  const handleTitleBlur = React.useCallback(() => {
    if (titleRef.current) {
      const newTitle = titleRef.current.textContent?.trim() || 'Untitled';
      if (newTitle !== title) {
        updateNote(noteId, { title: newTitle });
      }
    }
  }, [noteId, title, updateNote]);

  const handleTitleKeyDown = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      titleRef.current?.blur();
      containerRef.current?.querySelector<HTMLElement>('.cm-content')?.focus();
    }

    if (ev.key === 'Escape') {
      ev.preventDefault();
      if (titleRef.current)
        titleRef.current.textContent = title;

      titleRef.current?.blur();
    }
  };

  return (
    <div ref={editorWrapperRef} className="editor-wrapper">
      <div
        ref={titleRef}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onBlur={handleTitleBlur}
        onKeyDown={handleTitleKeyDown}
        className="editor-title"
        data-placeholder="Untitled"
      />
      <div
        ref={containerRef}
        className="editor-content"
      />
    </div>
  );
}

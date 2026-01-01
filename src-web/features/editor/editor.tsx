'use client';

import type { KeyboardEvent } from 'react';
import * as React from 'react';
import { useNotesStore } from '~/features/notes';
import { EditorHeader } from './components/editor-header';
import { useCodeMirror } from './use-codemirror';

interface NoteEditorProps {
  noteId: string;
}

export function NoteEditor({ noteId }: NoteEditorProps) {
  const content = useNotesStore(s => s.notes.get(noteId)?.content ?? '');
  const title = useNotesStore(s => s.notes.get(noteId)?.title ?? '');
  const updateNote = useNotesStore(s => s.updateNote);

  const titleRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

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

  const handleHeaderTitleChange = React.useCallback((newTitle: string) => {
    updateNote(noteId, { title: newTitle });
  }, [noteId, updateNote]);

  return (
    <div className="relative flex flex-col h-full w-full bg-background">
      <EditorHeader
        title={title}
        onTitleChange={handleHeaderTitleChange}
      />
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-9">
        <div className="flex flex-col min-h-full w-full max-w-[850px] mx-auto">
          <div
            ref={titleRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="shrink-0 px-12 pt-6 pb-2 text-4xl font-bold leading-[1.15] tracking-tight text-foreground bg-transparent border-none outline-none caret-foreground break-words whitespace-pre-wrap empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground focus:outline-none"
            data-placeholder="Untitled"
          />
          <div
            ref={containerRef}
            className="flex-1 pb-[50vh]"
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import type { KeyboardEvent } from 'react';
import * as React from 'react';

interface EditorHeaderProps {
  title: string;
  onTitleChange?: (newTitle: string) => void;
}

export function EditorHeader({
  title,
  onTitleChange,
}: EditorHeaderProps) {
  const titleRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (titleRef.current && titleRef.current.textContent !== title) {
      titleRef.current.textContent = title;
    }
  }, [title]);

  const handleTitleBlur = React.useCallback(() => {
    if (titleRef.current && onTitleChange) {
      const newTitle = titleRef.current.textContent?.trim() || 'Untitled';
      if (newTitle !== title) {
        onTitleChange(newTitle);
      }
    }
  }, [title, onTitleChange]);

  const handleTitleKeyDown = (ev: KeyboardEvent<HTMLSpanElement>) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      titleRef.current?.blur();
    }

    if (ev.key === 'Escape') {
      ev.preventDefault();
      if (titleRef.current) {
        titleRef.current.textContent = title;
      }
      titleRef.current?.blur();
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-10 h-9 flex items-center justify-center bg-background">
      <div className="flex items-center justify-center max-w-full px-3">
        <span
          ref={titleRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          className="text-[0.8125rem] font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px] outline-none border-none bg-transparent text-center empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground focus:outline-none"
          data-placeholder="Untitled"
        />
      </div>
    </header>
  );
}

import * as React from 'react';

import IconImage from '~icons/lucide/image';
import IconSmile from '~icons/lucide/smile';

import { useEditorUi } from '~/features/editor/contexts/editor-ui-context';
import { useNotesStore } from '~/features/notes/store';
import { cn } from '~/lib/utils';
import {
  EmojiPicker,
  EmojiPickerCategoryNav,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
  EmojiPickerSkinToneDropdown,
} from '~/ui/emoji-picker';

export interface PageHeaderProps {
  className?: string;
}

export function PageHeader({ className }: PageHeaderProps) {
  const { noteId, noteTitle, noteEmoji } = useEditorUi();
  const updateNote = useNotesStore(s => s.updateNote);
  const note = useNotesStore(s => (noteId ? s.notes.get(noteId) : null));

  const coverUrl = note?.content ? (note as any).coverUrl : undefined;
  const [showIconPicker, setShowIconPicker] = React.useState(false);
  const titleRef = React.useRef<HTMLDivElement>(null);
  const pickerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!showIconPicker)
      return;

    const handleClickOutside = (ev: MouseEvent) => {
      const target = ev.target as Node;
      if (
        pickerRef.current
        && !pickerRef.current.contains(target)
        && triggerRef.current
        && !triggerRef.current.contains(target)
      ) {
        setShowIconPicker(false);
      }
    };

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setShowIconPicker(false);
        triggerRef.current?.focus();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showIconPicker]);

  // Set initial title value (uncontrolled contentEditable)
  React.useEffect(() => {
    if (titleRef.current && noteTitle !== undefined) {
      if (titleRef.current.textContent !== (noteTitle || '')) {
        titleRef.current.textContent = noteTitle || '';
      }
    }
  }, [noteId, noteTitle]); // Sync when noteTitle changes, but guard prevents reset

  const handleTitleInput = React.useCallback(
    (ev: React.FormEvent<HTMLDivElement>) => {
      const newTitle = ev.currentTarget.textContent || '';
      if (noteId) {
        updateNote(noteId, { title: newTitle });
      }
    },
    [noteId, updateNote],
  );

  const handleTitleKeyDown = React.useCallback(
    (ev: React.KeyboardEvent<HTMLDivElement>) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        (ev.target as HTMLDivElement).blur();
      }
    },
    [],
  );

  const handleIconSelect = React.useCallback(
    (emoji: string) => {
      if (noteId) {
        updateNote(noteId, { emoji });
      }
      setShowIconPicker(false);
    },
    [noteId, updateNote],
  );

  const handleRemoveIcon = React.useCallback(() => {
    if (noteId) {
      updateNote(noteId, { emoji: '' });
    }
    setShowIconPicker(false);
  }, [noteId, updateNote]);

  const handleCoverChange = React.useCallback(
    (url: string | null) => {
      if (noteId) {
        updateNote(noteId, { coverUrl: url } as any);
      }
    },
    [noteId, updateNote],
  );

  return (
    <div className={cn('relative group w-full', className)}>
      {coverUrl
        ? (
            <div className="relative h-[30vh] min-h-50 max-h-70 w-full overflow-hidden">
              <img
                src={coverUrl}
                alt="Page cover"
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent" />

              <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <button
                  onClick={() => handleCoverChange(null)}
                  className="rounded-md bg-background/80 px-3 py-1.5 text-sm font-medium text-foreground/80 backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground"
                >
                  Remove
                </button>
              </div>
            </div>
          )
        : (
            <div className="flex h-12 items-center justify-end px-16 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:px-[max(64px,calc(50%-350px))]">
              <button
                onClick={() => {
                  handleCoverChange(
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
                  );
                }}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <IconImage className="h-3.5 w-3.5" />
                <span>Add cover</span>
              </button>
            </div>
          )}

      <div
        className={cn(
          'relative px-16 sm:px-[max(64px,calc(50%-350px))]',
          coverUrl ? '-mt-12' : 'pt-8',
        )}
      >
        <div className="relative mb-3 flex items-end gap-3">
          {noteEmoji
            ? (
                <div className="relative">
                  <button
                    ref={triggerRef}
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="group relative flex h-24 w-24 items-center justify-center rounded-2xl bg-muted/30 text-6xl transition-all duration-200 hover:bg-muted/50 hover:scale-[1.02]"
                  >
                    <span className="drop-shadow-sm">{noteEmoji}</span>
                  </button>

                  {showIconPicker && (
                    <div
                      ref={pickerRef}
                      className="absolute left-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 duration-150"
                    >
                      <EmojiPicker
                        className="h-80"
                        onEmojiSelect={emoji => handleIconSelect(emoji.emoji)}
                      >
                        <EmojiPickerSearch />
                        <EmojiPickerContent className="scrollbar-custom" />
                        <EmojiPickerFooter>
                          <div className="flex items-center gap-1">
                            <EmojiPickerCategoryNav />
                            <div className="h-4 w-px bg-border" />
                            <button
                              onClick={handleRemoveIcon}
                              className="rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              Remove
                            </button>
                            <EmojiPickerSkinToneDropdown />
                          </div>
                        </EmojiPickerFooter>
                      </EmojiPicker>
                    </div>
                  )}
                </div>
              )
            : (
                <button
                  ref={triggerRef}
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground opacity-0 transition-all duration-200 hover:bg-muted hover:text-foreground group-hover:opacity-100"
                >
                  <IconSmile className="h-3.5 w-3.5" />
                  <span>Add icon</span>
                </button>
              )}

          {!noteEmoji && showIconPicker && (
            <div
              ref={pickerRef}
              className="absolute left-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 duration-150"
            >
              <EmojiPicker
                className="h-80"
                onEmojiSelect={emoji => handleIconSelect(emoji.emoji)}
              >
                <EmojiPickerSearch />
                <EmojiPickerContent className="scrollbar-custom" />
                <EmojiPickerFooter>
                  <div className="flex items-center gap-1">
                    <EmojiPickerCategoryNav />
                    <div className="h-4 w-px bg-border" />
                    <EmojiPickerSkinToneDropdown />
                  </div>
                </EmojiPickerFooter>
              </EmojiPicker>
            </div>
          )}
        </div>

        <div
          ref={titleRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleTitleInput}
          onKeyDown={handleTitleKeyDown}
          data-placeholder="Untitled"
          className={cn(
            'relative mb-4 max-w-full cursor-text wrap-break-word font-bold text-foreground outline-none',
            'text-4xl leading-tight tracking-tight md:text-6xl',
            'empty:before:pointer-events-none empty:before:absolute empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/30',
            'focus:before:content-none',
          )}
        />
      </div>
    </div>
  );
}

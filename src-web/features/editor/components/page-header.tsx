import * as React from 'react';

import {
  EmojiPicker,
  EmojiPickerSearch,
  EmojiPickerContent,
  EmojiPickerCategoryNav,
  EmojiPickerFooter,
  EmojiPickerSkinToneDropdown
} from '~/ui/emoji-picker';

import IconSmile from '~icons/lucide/smile';
import IconImage from '~icons/lucide/image';

import { cn } from '~/lib/utils';

export type PageHeaderProps = {
  title?: string;
  icon?: string;
  coverUrl?: string;
  onTitleChange?: (title: string) => void;
  onIconChange?: (icon: string) => void;
  onCoverChange?: (url: string | null) => void;
  className?: string;
};

export function PageHeader({
  title = '',
  icon,
  coverUrl,
  onTitleChange,
  onIconChange,
  onCoverChange,
  className
}: PageHeaderProps) {
  const [showIconPicker, setShowIconPicker] = React.useState(false);
  const titleRef = React.useRef<HTMLDivElement>(null);
  const pickerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!showIconPicker) return;

    const handleClickOutside = (ev: MouseEvent) => {
      const target = ev.target as Node;
      if (
        pickerRef.current &&
        !pickerRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
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

  const handleTitleInput = React.useCallback(
    (ev: React.FormEvent<HTMLDivElement>) => {
      const newTitle = ev.currentTarget.textContent || '';
      onTitleChange?.(newTitle);
    },
    [onTitleChange]
  );

  const handleTitleKeyDown = React.useCallback((ev: React.KeyboardEvent<HTMLDivElement>) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      (ev.target as HTMLDivElement).blur();
    }
  }, []);

  const handleIconSelect = React.useCallback(
    (emoji: string) => {
      onIconChange?.(emoji);
      setShowIconPicker(false);
    },
    [onIconChange]
  );

  const handleRemoveIcon = React.useCallback(() => {
    onIconChange?.('');
    setShowIconPicker(false);
  }, [onIconChange]);

  return (
    <div className={cn('relative w-full group', className)}>
      {coverUrl ? (
        <div className="relative h-[30vh] min-h-50 max-h-70 w-full overflow-hidden">
          <img src={coverUrl} alt="Page cover" className="h-full w-full object-cover" />

          <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent" />

          <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              onClick={() => onCoverChange?.(null)}
              className="rounded-md bg-background/80 px-3 py-1.5 text-sm font-medium text-foreground/80 backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="flex h-12 items-center justify-end px-16 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:px-[max(64px,calc(50%-350px))]">
          <button
            onClick={() => {
              onCoverChange?.('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80');
            }}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <IconImage className="h-3.5 w-3.5" />
            <span>Add cover</span>
          </button>
        </div>
      )}

      <div className={cn('relative px-16 sm:px-[max(64px,calc(50%-350px))]', coverUrl ? '-mt-12' : 'pt-8')}>
        <div className="relative mb-3 flex items-end gap-3">
          {icon ? (
            <div className="relative">
              <button
                ref={triggerRef}
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="group relative flex h-18 w-18 items-center justify-center rounded-xl bg-muted/50 text-5xl transition-all duration-200 hover:bg-muted hover:scale-105"
              >
                <span className="drop-shadow-sm">{icon}</span>
              </button>

              {showIconPicker && (
                <div
                  ref={pickerRef}
                  className="absolute left-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 duration-150"
                >
                  <EmojiPicker className="h-80" onEmojiSelect={(emoji) => handleIconSelect(emoji.emoji)}>
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
          ) : (
            <button
              ref={triggerRef}
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground opacity-0 transition-all duration-200 hover:bg-muted hover:text-foreground group-hover:opacity-100"
            >
              <IconSmile className="h-3.5 w-3.5" />
              <span>Add icon</span>
            </button>
          )}

          {!icon && showIconPicker && (
            <div
              ref={pickerRef}
              className="absolute left-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 duration-150"
            >
              <EmojiPicker className="h-80" onEmojiSelect={(emoji) => handleIconSelect(emoji.emoji)}>
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
            'text-4xl leading-tight tracking-tight md:text-5xl',
            'empty:before:pointer-events-none empty:before:absolute empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50',
            'focus:before:content-none'
          )}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

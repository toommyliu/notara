'use client';

import * as React from 'react';


import IconGlobe from '~icons/lucide/globe';
import IconLock from '~icons/lucide/lock';
import IconMoreHorizontal from '~icons/lucide/more-horizontal';
import IconSmile from '~icons/lucide/smile';
import IconStar from '~icons/lucide/star';


import { cn } from '~/lib/utils';

import { Button } from '~/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/ui/dropdown-menu';
import {
  EmojiPicker,
  EmojiPickerCategoryNav,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
  EmojiPickerSkinToneDropdown,
} from '~/ui/emoji-picker';
import { Toggle } from '~/ui/toggle';
import { Separator } from '~/ui/separator';


interface PageNavBarProps {
  title?: string;
  icon?: string;
  isPrivate?: boolean;
  isStarred?: boolean;
  onPrivacyChange?: (isPrivate: boolean) => void;
  onStarChange?: (isStarred: boolean) => void;
  onTitleChange?: (title: string) => void;
  onEmojiChange?: (emoji: string) => void;
  className?: string;
}

export function PageNavBar({
  title = 'Untitled',
  icon,
  isPrivate = true,
  isStarred = false,
  onPrivacyChange,
  onStarChange,
  onTitleChange,
  onEmojiChange,
  className,
}: PageNavBarProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [editDropdownOpen, setEditDropdownOpen] = React.useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);



  const titleRef = React.useRef<HTMLDivElement>(null);
  const editDropdownRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!editDropdownOpen)
      return;

    const handleClickOutside = (ev: MouseEvent) => {
      const target = ev.target as Node;
      if (
        editDropdownRef.current
        && !editDropdownRef.current.contains(target)
        && triggerRef.current
        && !triggerRef.current.contains(target)
      ) {
        setEditDropdownOpen(false);
        setShowEmojiPicker(false);
      }
    };

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setEditDropdownOpen(false);
        setShowEmojiPicker(false);
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
  }, [editDropdownOpen]);

  // Sync title value to contentEditable div
  React.useEffect(() => {
    if (editDropdownOpen && titleRef.current?.textContent !== (title || ''))
      titleRef.current!.textContent = title || '';
  }, [editDropdownOpen, title]);

  // Auto-focus and select all on open
  React.useEffect(() => {
    if (editDropdownOpen) {
      const timeoutId = setTimeout(() => {
        if (titleRef.current) {
          titleRef.current.focus();
          const range = document.createRange();
          range.selectNodeContents(titleRef.current);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [editDropdownOpen]);

  const handleTitleInput = React.useCallback(
    (ev: React.FormEvent<HTMLDivElement>) => {
      const newTitle = ev.currentTarget.textContent || '';
      onTitleChange?.(newTitle);
    },
    [onTitleChange],
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

  const handleEmojiSelect = React.useCallback(
    (emoji: string) => {
      onEmojiChange?.(emoji);
      setShowEmojiPicker(false);
    },
    [onEmojiChange],
  );

  const handleRemoveEmoji = React.useCallback(() => {
    onEmojiChange?.('');
    setShowEmojiPicker(false);
  }, [onEmojiChange]);

  return (
    <div
      className={cn('flex h-12 items-center justify-between px-3', className)}
      data-tauri-drag-region
    >
      {/* Left section */}
      <div className="flex items-center gap-2 min-w-0" data-no-drag>
        <div className="relative">
          <button
            ref={triggerRef}
            onClick={() => setEditDropdownOpen(!editDropdownOpen)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              'relative flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors duration-150',
              (isHovered || editDropdownOpen) && 'bg-muted/50',
            )}
          >
            {icon
              ? <span className="text-base">{icon}</span>
              : <IconSmile className="h-4 w-4 text-muted-foreground/50" />}
            <span className="truncate text-sm text-foreground/70 max-w-xs">
              {title || 'Untitled'}
            </span>
          </button>

          {editDropdownOpen && (
            <div
              ref={editDropdownRef}
              className="absolute left-0 top-full z-50 mt-1 flex items-center gap-1 rounded-md border border-border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95 duration-150"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                {icon || <IconSmile className="h-3.5 w-3.5 text-muted-foreground" />}
              </Button>

              <Separator orientation="vertical" className="h-5 !self-center" />
              <div
                ref={titleRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleTitleInput}
                onKeyDown={handleTitleKeyDown}
                data-placeholder="Untitled"
                className={cn(
                  'w-80 wrap-break-word rounded border border-border bg-background px-1.5 py-0.5 text-sm text-foreground outline-none transition-colors',
                  'focus:border-ring',
                  'empty:before:pointer-events-none empty:before:text-muted-foreground/40 empty:before:content-[attr(data-placeholder)]',
                )}
              />
            </div>
          )}

          {showEmojiPicker && (
            <div
              className="absolute left-0 top-full z-[60] mt-14 overflow-hidden rounded-xl border border-border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 duration-150"
            >
              <EmojiPicker
                className="h-72 w-72"
                onEmojiSelect={emoji => handleEmojiSelect(emoji.emoji)}
              >
                <EmojiPickerSearch />
                <EmojiPickerContent className="scrollbar-custom" />
                <EmojiPickerFooter>
                  <div className="flex items-center gap-1">
                    <EmojiPickerCategoryNav />
                    {icon && (
                      <>
                        <div className="h-4 w-px bg-border" />
                        <button
                          onClick={handleRemoveEmoji}
                          className="rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          Remove
                        </button>
                      </>
                    )}
                    <EmojiPickerSkinToneDropdown />
                  </div>
                </EmojiPickerFooter>
              </EmojiPicker>
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={(
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground/50 hover:text-foreground/70"
              >
                {isPrivate
                  ? <IconLock className="size-3.5" />
                  : <IconGlobe className="size-3.5" />}
                <span className="hidden sm:inline">
                  {isPrivate ? 'Private' : 'Public'}
                </span>
              </Button>
            )}
          />
          <DropdownMenuContent align="start" sideOffset={4}>
            <DropdownMenuItem
              onClick={() => onPrivacyChange?.(true)}
              className={cn(
                isPrivate && 'text-foreground/80',
                !isPrivate && 'text-foreground/50',
              )}
            >
              <IconLock className="size-3.5" />
              <span>Private</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onPrivacyChange?.(false)}
              className={cn(
                !isPrivate && 'text-foreground/80',
                isPrivate && 'text-foreground/50',
              )}
            >
              <IconGlobe className="size-3.5" />
              <span>Public</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1" data-no-drag>
        <Toggle
          size="icon-sm"
          pressed={isStarred}
          onPressedChange={onStarChange}
        >
          <IconStar className={cn('size-4', isStarred && 'fill-yellow-500 text-yellow-500')} />
        </Toggle>



        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger
            render={(
              <Toggle
                size="icon-sm"
                pressed={dropdownOpen}
              >
                <IconMoreHorizontal className="size-4" />
              </Toggle>
            )}
          />
          <DropdownMenuContent align="end" sideOffset={4}>
            <DropdownMenuItem>
              i am more options...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

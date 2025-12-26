'use client';

import React from 'react';
import {
  type EmojiPickerListCategoryHeaderProps,
  type EmojiPickerListEmojiProps,
  type EmojiPickerListRowProps,
  EmojiPicker as EmojiPickerPrimitive
} from 'frimousse';

import { Tooltip, TooltipContent, TooltipTrigger } from '~/ui/tooltip';

import LoaderIcon from '~icons/lucide/loader';
import SearchIcon from '~icons/lucide/search';
import XIcon from '~icons/lucide/x';

import { cn } from '~/lib/utils';

const EMOJI_CATEGORIES = [
  { id: 'Smileys & emotion', icon: '😀' },
  { id: 'People & body', icon: '👋' },
  { id: 'Animals & nature', icon: '🐱' },
  { id: 'Food & drink', icon: '🍔' },
  { id: 'Travel & places', icon: '✈️' },
  { id: 'Activities', icon: '⚽' },
  { id: 'Objects', icon: '💡' },
  { id: 'Symbols', icon: '❤️' },
  { id: 'Flags', icon: '🏳️' }
] as const;

function EmojiPicker({ className, ...props }: React.ComponentProps<typeof EmojiPickerPrimitive.Root>) {
  return (
    <EmojiPickerPrimitive.Root
      className={cn(
        'bg-popover text-popover-foreground isolate flex h-full w-fit flex-col overflow-hidden rounded-md',
        className
      )}
      data-slot="emoji-picker"
      {...props}
    />
  );
}

function EmojiPickerSearch({ className, ...props }: React.ComponentProps<typeof EmojiPickerPrimitive.Search>) {
  const [value, setValue] = React.useState('');

  return (
    <div className={cn('flex h-8 items-center gap-2 border-b px-2', className)} data-slot="emoji-picker-search-wrapper">
      <SearchIcon className="size-3.5 shrink-0 opacity-50" />
      <EmojiPickerPrimitive.Search
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="outline-hidden placeholder:text-muted-foreground flex h-8 w-full rounded-md bg-transparent py-2 text-sm appearance-none disabled:cursor-not-allowed disabled:opacity-50"
        data-slot="emoji-picker-search"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          className="shrink-0 rounded-sm p-0.5 opacity-50 transition-opacity hover:opacity-100"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function EmojiPickerRow({ children, ...props }: EmojiPickerListRowProps) {
  return (
    <div {...props} className="flex scroll-my-1 px-1" data-slot="emoji-picker-row">
      {children}
    </div>
  );
}

function EmojiPickerEmoji({ emoji, className, ...props }: EmojiPickerListEmojiProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={() => (
          <button
            {...props}
            className={cn(
              'data-active:bg-accent flex size-7 items-center justify-center rounded-sm text-base',
              className
            )}
            data-slot="emoji-picker-emoji"
          >
            {emoji.emoji}
          </button>
        )}
      />
      <TooltipContent>
        <p className="capitalize">{emoji.label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function EmojiPickerCategoryHeader({ category, ...props }: EmojiPickerListCategoryHeaderProps) {
  return (
    <div
      {...props}
      className="bg-popover text-muted-foreground px-3 pb-2 pt-3.5 text-xs leading-none"
      data-slot="emoji-picker-category-header"
      data-category-id={category.label}
    >
      {category.label}
    </div>
  );
}

function EmojiPickerCategoryNav({ className, ...props }: React.ComponentProps<'div'>) {
  const scrollToCategory = (categoryId: string) => {
    const header = document.querySelector(`[data-category-id="${categoryId}"]`);
    if (header) {
      header.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={cn('flex items-center', className)} {...props}>
      {EMOJI_CATEGORIES.map((category) => (
        <Tooltip key={category.id}>
          <TooltipTrigger
            render={() => (
              <button
                type="button"
                onClick={() => scrollToCategory(category.id)}
                className="flex size-6 items-center justify-center rounded text-sm transition-colors hover:bg-accent"
              >
                {category.icon}
              </button>
            )}
          />
          <TooltipContent side="bottom">
            <p>{category.id}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

function EmojiPickerContent({ className, ...props }: React.ComponentProps<typeof EmojiPickerPrimitive.Viewport>) {
  return (
    <EmojiPickerPrimitive.Viewport
      className={cn('outline-hidden relative flex-1', className)}
      data-slot="emoji-picker-viewport"
      {...props}
    >
      <EmojiPickerPrimitive.Loading
        className="absolute inset-0 flex items-center justify-center text-muted-foreground"
        data-slot="emoji-picker-loading"
      >
        <LoaderIcon className="size-4 animate-spin" />
      </EmojiPickerPrimitive.Loading>
      <EmojiPickerPrimitive.Empty
        className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm"
        data-slot="emoji-picker-empty"
      >
        No emoji found.
      </EmojiPickerPrimitive.Empty>
      <EmojiPickerPrimitive.List
        className="select-none pb-1"
        components={{
          Row: EmojiPickerRow,
          Emoji: EmojiPickerEmoji,
          CategoryHeader: EmojiPickerCategoryHeader
        }}
        data-slot="emoji-picker-list"
      />
    </EmojiPickerPrimitive.Viewport>
  );
}

function EmojiPickerSkinToneSelector({
  className,
  ...props
}: React.ComponentProps<typeof EmojiPickerPrimitive.SkinToneSelector>) {
  return (
    <EmojiPickerPrimitive.SkinToneSelector
      className={cn(
        'flex size-7 items-center justify-center rounded-sm text-base transition-colors hover:bg-accent',
        className
      )}
      data-slot="emoji-picker-skin-tone-selector"
      {...props}
    />
  );
}

function EmojiPickerSkinToneDropdown({
  className,
  emoji = '👋',
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & { emoji?: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={cn('relative', className)} {...props}>
      <EmojiPickerPrimitive.SkinTone emoji={emoji}>
        {({ skinTone, setSkinTone, skinToneVariations }) => (
          <>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex size-7 items-center justify-center rounded-sm text-base transition-colors hover:bg-accent"
            >
              {skinToneVariations.find((v) => v.skinTone === skinTone)?.emoji ?? emoji}
            </button>
            {isOpen && (
              <div className="absolute bottom-full right-0 mb-1 flex gap-0.5 rounded-md border border-border bg-popover p-1 shadow-lg animate-in fade-in-0 slide-in-from-bottom-2 duration-150">
                {skinToneVariations.map((variation) => (
                  <button
                    key={variation.skinTone}
                    type="button"
                    onClick={() => {
                      setSkinTone(variation.skinTone);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'flex size-7 items-center justify-center rounded-sm text-base transition-colors hover:bg-accent',
                      skinTone === variation.skinTone && 'bg-accent'
                    )}
                  >
                    {variation.emoji}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </EmojiPickerPrimitive.SkinTone>
    </div>
  );
}

function EmojiPickerFooter({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex w-full min-w-0 items-center justify-between gap-2 border-t px-2 py-1.5', className)}
      data-slot="emoji-picker-footer"
      {...props}
    >
      {children}
    </div>
  );
}

export {
  EmojiPicker,
  EmojiPickerSearch,
  EmojiPickerContent,
  EmojiPickerCategoryNav,
  EmojiPickerSkinToneSelector,
  EmojiPickerSkinToneDropdown,
  EmojiPickerFooter
};

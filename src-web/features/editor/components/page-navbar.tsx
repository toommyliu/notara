'use client';

import {useState} from 'react';

import IconGlobe from '~icons/lucide/globe';
import IconLock from '~icons/lucide/lock';
import IconMoreHorizontal from '~icons/lucide/more-horizontal';
import IconStar from '~icons/lucide/star';

import { cn } from '~/lib/utils';

import { Button } from '~/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/ui/dropdown-menu';
import { Toggle } from '~/ui/toggle';

import { useEditorUi } from '../contexts/editor-ui-context';

interface PageNavBarProps {
  title?: string;
  icon?: string;
  isPrivate?: boolean;
  isStarred?: boolean;
  onPrivacyChange?: (isPrivate: boolean) => void;
  onStarChange?: (isStarred: boolean) => void;
  className?: string;
}

export function PageNavBar({
  title = 'Untitled',
  icon,
  isPrivate = true,
  isStarred = false,
  onPrivacyChange,
  onStarChange,
  className,
}: PageNavBarProps) {
  const { showFixedToolbar, setShowFixedToolbar } = useEditorUi();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div
      className={cn('flex h-12 items-center justify-between px-3', className)}
      data-tauri-drag-region
    >
      {/* Left section */}
      <div className="flex items-center gap-2 min-w-0" data-no-drag>
        {icon && <span className="text-base shrink-0">{icon}</span>}
        <span className="truncate text-sm text-foreground/70">
          {title || 'Untitled'}
        </span>

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
          <IconStar className={cn('size-4', isStarred && 'fill-current')} />
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

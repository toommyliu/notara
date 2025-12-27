'use client';

import * as React from 'react';

import IconChevronDown from '~icons/lucide/chevron-down';
import IconGlobe from '~icons/lucide/globe';
import IconLock from '~icons/lucide/lock';
import IconMoreHorizontal from '~icons/lucide/more-horizontal';
import IconPanelTop from '~icons/lucide/panel-top';
import IconStar from '~icons/lucide/star';

import { cn } from '~/lib/utils';

import { useEditorUi } from '../contexts/editor-ui-context';

interface PageNavBarProps {
  title?: string;
  icon?: string;
  isPrivate?: boolean;
  isStarred?: boolean;
  onPrivacyChange?: (isPrivate: boolean) => void;
  onStarChange?: (isStarred: boolean) => void;
  onShare?: () => void;
  onMoreClick?: () => void;
  className?: string;
}

export function PageNavBar({
  title = 'Untitled',
  icon,
  isPrivate = true,
  isStarred = false,
  onPrivacyChange,
  onStarChange,
  onShare,
  onMoreClick,
  className,
}: PageNavBarProps) {
  const [showPrivacyMenu, setShowPrivacyMenu] = React.useState(false);
  const { showFixedToolbar, setShowFixedToolbar } = useEditorUi();
  const privacyMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!showPrivacyMenu)
      return;

    const handleClickOutside = (e: MouseEvent) => {
      if (privacyMenuRef.current && !privacyMenuRef.current.contains(e.target as Node)) {
        setShowPrivacyMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPrivacyMenu]);

  return (
    <div
      className={cn(
        'flex h-11 items-center justify-between border-b border-border/50 bg-background/80 px-3 backdrop-blur-sm',
        className,
      )}
      data-tauri-drag-region
    >
      {/* Left section: Page title with icon */}
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className="text-base shrink-0">{icon}</span>}
        <span className="truncate text-sm font-medium text-foreground/90">{title || 'Untitled'}</span>

        {/* Privacy dropdown */}
        <div className="relative" ref={privacyMenuRef}>
          <button
            onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            data-no-drag
          >
            {isPrivate ? <IconLock className="h-3 w-3" /> : <IconGlobe className="h-3 w-3" />}
            <span>{isPrivate ? 'Private' : 'Public'}</span>
            <IconChevronDown className="h-3 w-3 opacity-60" />
          </button>

          {/* Privacy dropdown menu */}
          {showPrivacyMenu && (
            <div className="absolute left-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95 duration-100">
              <button
                onClick={() => {
                  onPrivacyChange?.(true);
                  setShowPrivacyMenu(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                  isPrivate && 'bg-muted/50',
                )}
              >
                <IconLock className="h-3.5 w-3.5" />
                <span>Private</span>
              </button>
              <button
                onClick={() => {
                  onPrivacyChange?.(false);
                  setShowPrivacyMenu(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                  !isPrivate && 'bg-muted/50',
                )}
              >
                <IconGlobe className="h-3.5 w-3.5" />
                <span>Public</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right section: Actions */}
      <div className="flex items-center gap-0.5" data-no-drag>
        <button
          onClick={onShare}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <span>Share</span>
        </button>

        <button
          onClick={() => onStarChange?.(!isStarred)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-muted',
            isStarred ? 'text-amber hover:text-amber-muted' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <IconStar className={cn('h-4 w-4', isStarred && 'fill-current')} />
        </button>

        <button
          onClick={() => setShowFixedToolbar(!showFixedToolbar)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-muted',
            showFixedToolbar ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
          title={showFixedToolbar ? 'Hide toolbar' : 'Show toolbar'}
        >
          <IconPanelTop className="h-4 w-4" />
        </button>

        <button
          onClick={onMoreClick}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <IconMoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

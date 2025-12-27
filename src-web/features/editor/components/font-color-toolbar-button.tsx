'use client';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import {
  FontBackgroundColorPlugin,
  FontColorPlugin,
} from '@platejs/basic-styles/react';
import { KEYS } from 'platejs';
import { useEditorPlugin, useEditorSelector } from 'platejs/react';
import * as React from 'react';

import { cn } from '~/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '~/ui/dropdown-menu';
import { ToolbarButton } from '~/ui/toolbar';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/ui/tooltip';

const NOTION_TEXT_COLORS: ColorOption[] = [
  { displayColor: 'currentColor', name: 'Default', value: undefined },
  { name: 'Gray', value: 'var(--color-gray-text, rgb(155, 154, 151))' },
  { name: 'Brown', value: 'rgb(159, 107, 83)' },
  { name: 'Orange', value: 'rgb(217, 115, 13)' },
  { name: 'Yellow', value: 'rgb(203, 145, 47)' },
  { name: 'Green', value: 'rgb(68, 131, 97)' },
  { name: 'Blue', value: 'rgb(51, 126, 169)' },
  { name: 'Purple', value: 'rgb(144, 101, 176)' },
  { name: 'Pink', value: 'rgb(193, 76, 138)' },
  { name: 'Red', value: 'rgb(212, 76, 71)' },
];

const NOTION_BACKGROUND_COLORS: ColorOption[] = [
  { displayColor: 'transparent', name: 'Default', value: undefined },
  { name: 'Gray', value: 'var(--color-gray-bg, rgba(155, 154, 151, 0.2))' },
  { name: 'Brown', value: 'rgba(159, 107, 83, 0.2)' },
  { name: 'Orange', value: 'rgba(217, 115, 13, 0.2)' },
  { name: 'Yellow', value: 'rgba(203, 145, 47, 0.2)' },
  { name: 'Green', value: 'rgba(68, 131, 97, 0.2)' },
  { name: 'Blue', value: 'rgba(51, 126, 169, 0.2)' },
  { name: 'Purple', value: 'rgba(144, 101, 176, 0.2)' },
  { name: 'Pink', value: 'rgba(193, 76, 138, 0.2)' },
  { name: 'Red', value: 'rgba(212, 76, 71, 0.2)' },
];

const RECENTLY_USED_KEY = 'notara:editor:recently-used-colors';

interface RecentColor {
  type: 'background' | 'text';
  value: string;
}

interface ColorOption {
  displayColor?: string;
  name: string;
  value: string | undefined;
}

function getRecentlyUsed(): RecentColor[] {
  if (typeof window === 'undefined')
    return [];

  try {
    const stored = localStorage.getItem(RECENTLY_USED_KEY);
    return stored ? JSON.parse(stored) : [];
  }
  catch {
    return [];
  }
}

function addRecentlyUsed(color: RecentColor) {
  if (typeof window === 'undefined')
    return;

  try {
    const current = getRecentlyUsed();
    const filtered = current.filter(
      c => !(c.type === color.type && c.value === color.value),
    );
    const updated = [color, ...filtered].slice(0, 5);
    localStorage.setItem(RECENTLY_USED_KEY, JSON.stringify(updated));
  }
  catch {
  }
}

function ColorSwatch({
  color,
  displayColor,
  isDefault,
  isSelected,
  name,
  onSelect,
  type,
}: {
  color?: string;
  displayColor?: string;
  isDefault?: boolean;
  isSelected: boolean;
  name: string;
  onSelect: () => void;
  type: 'background' | 'text';
}) {
  const swatchColor = displayColor ?? color;

  return (
    <Tooltip>
      <TooltipTrigger
        render={props => (
          <button
            {...props}
            className={cn(
              'flex size-6.5 items-center justify-center rounded transition-all hover:bg-muted',
              isSelected && 'ring-1 ring-primary/70',
            )}
            onClick={(e) => {
              props.onClick?.(e);
              onSelect();
            }}
            onMouseDown={(e) => {
              props.onMouseDown?.(e);
              e.preventDefault();
            }}
            type="button"
          >
            {type === 'text'
              ? (
                  <span
                    className="flex size-full items-center justify-center text-sm font-bold"
                    style={{ color: isDefault ? 'var(--foreground)' : swatchColor }}
                  >
                    A
                  </span>
                )
              : (
                  <span
                    className="size-5 rounded-[3px] border border-border/10"
                    style={{ backgroundColor: swatchColor }}
                  />
                )}
          </button>
        )}
      />
      <TooltipContent side="top" className="text-xs capitalize">
        {name}
      </TooltipContent>
    </Tooltip>
  );
}

function ColorSection({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div className={cn('px-2 py-2', className)}>
      <div className="mb-1.5 px-0.5 select-none font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
        {label}
      </div>
      <div className="grid grid-cols-5 gap-0.5">
        {children}
      </div>
    </div>
  );
}

export function FontColorToolbarButton({
  children,
  tooltip,
}: {
  tooltip?: string;
} & DropdownMenuProps) {
  const { editor, tf: fontColorTf } = useEditorPlugin(FontColorPlugin);
  const { tf: bgColorTf } = useEditorPlugin(FontBackgroundColorPlugin);

  const lastSelectionRef = React.useRef(editor.selection);

  const captureSelection = React.useCallback(() => {
    const selection = editor.selection;
    if (!selection) {
      return;
    }

    lastSelectionRef.current = {
      anchor: { ...selection.anchor },
      focus: { ...selection.focus },
    };
  }, [editor]);

  const ensureSelection = React.useCallback(() => {
    if (editor.selection) {
      return true;
    }
    const lastSelection = lastSelectionRef.current;
    if (!lastSelection) {
      return false;
    }

    editor.tf.select(lastSelection);
    return true;
  }, [editor]);

  const textColor = useEditorSelector(
    editor => editor.api.marks()?.[KEYS.color] as string | undefined,
    [],
  );

  const backgroundColor = useEditorSelector(
    editor => editor.api.marks()?.[KEYS.backgroundColor] as string | undefined,
    [],
  );

  const [open, setOpen] = React.useState(false);
  const [recentColors, setRecentColors] = React.useState<RecentColor[]>(
    getRecentlyUsed,
  );

  const refreshRecentColors = React.useCallback(() => {
    setRecentColors(getRecentlyUsed());
  }, []);

  const applyTextColor = React.useCallback(
    (value?: string) => {
      captureSelection();
      if (!ensureSelection()) {
        editor.tf.focus();
        return;
      }

      if (value) {
        fontColorTf.color.addMark(value);
        addRecentlyUsed({ type: 'text', value });
        refreshRecentColors();
      }
      else {
        editor.tf.removeMarks(KEYS.color);
      }

      editor.tf.focus();
    },
    [captureSelection, editor, ensureSelection, fontColorTf, refreshRecentColors],
  );

  const applyBackgroundColor = React.useCallback(
    (value?: string) => {
      captureSelection();
      if (!ensureSelection()) {
        editor.tf.focus();
        return;
      }

      if (value) {
        bgColorTf.backgroundColor.addMark(value);
        addRecentlyUsed({ type: 'background', value });
        refreshRecentColors();
      }
      else {
        editor.tf.removeMarks(KEYS.backgroundColor);
      }
      editor.tf.focus();
    },
    [bgColorTf, captureSelection, editor, ensureSelection, refreshRecentColors],
  );

  const getColorName = React.useCallback((recent: RecentColor) => {
    const list = recent.type === 'text' ? NOTION_TEXT_COLORS : NOTION_BACKGROUND_COLORS;
    const found = list.find(c => c.value === recent.value);
    return found ? `${found.name} ${recent.type}` : `${recent.type === 'text' ? 'Text' : 'Background'} color`;
  }, []);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(value) => {
        if (value) {
          captureSelection();
          refreshRecentColors();
        }
        setOpen(value);
      }}
      modal={false}
    >
      <DropdownMenuTrigger
        render={props => (
          <ToolbarButton
            {...props}
            pressed={open}
            tooltip={tooltip ?? 'Color'}
            onMouseDown={(e) => {
              props.onMouseDown?.(e as React.MouseEvent<HTMLButtonElement>);
              captureSelection();
              e.preventDefault();
            }}
            onClick={(e) => {
              props.onClick?.(e as React.MouseEvent<HTMLButtonElement>);
            }}
          >
            {children ?? (
              <div className="relative flex size-full items-center justify-center">
                <div
                  className={cn(
                    'flex items-center justify-center rounded px-0.5 min-w-5 h-5',
                    backgroundColor && 'border border-border/30',
                  )}
                  style={{
                    backgroundColor: backgroundColor ?? 'transparent',
                  }}
                >
                  <span
                    className="text-sm font-bold leading-none"
                    style={{ color: textColor ?? 'currentColor' }}
                  >
                    A
                  </span>
                </div>
                {!backgroundColor && (
                  <div
                    className="absolute -bottom-0.5 left-[15%] right-[15%] h-0.5 rounded-full"
                    style={{
                      backgroundColor: textColor ?? 'currentColor',
                    }}
                  />
                )}
              </div>
            )}
          </ToolbarButton>
        )}
      />

      <DropdownMenuContent
        align="start"
        className="ignore-click-outside/toolbar w-44 p-0"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.tf.focus();
        }}
      >
        <div className="flex flex-col gap-0">
          {recentColors.length > 0 && (
            <>
              <ColorSection label="Recently used" className="px-2 py-2">
                {recentColors.map((recent, idx) => (
                  <ColorSwatch
                    key={`recent-${recent.type}-${recent.value}-${String(idx)}`}
                    type={recent.type}
                    color={recent.value}
                    name={getColorName(recent)}
                    isSelected={
                      recent.type === 'text'
                        ? textColor === recent.value
                        : backgroundColor === recent.value
                    }
                    onSelect={() =>
                      recent.type === 'text'
                        ? applyTextColor(recent.value)
                        : applyBackgroundColor(recent.value)}
                  />
                ))}
              </ColorSection>
              <div className="mx-1 h-px bg-border/40" />
            </>
          )}

          {/* Text color */}
          <ColorSection label="Text color">
            {NOTION_TEXT_COLORS.map(colorOption => (
              <ColorSwatch
                key={colorOption.name}
                type="text"
                color={colorOption.value}
                displayColor={colorOption.displayColor}
                name={colorOption.name}
                isDefault={!colorOption.value}
                isSelected={textColor === colorOption.value}
                onSelect={() => applyTextColor(colorOption.value)}
              />
            ))}
          </ColorSection>

          <div className="mx-1 h-px bg-border/40" />

          {/* Background color */}
          <ColorSection label="Background color">
            {NOTION_BACKGROUND_COLORS.map(colorOption => (
              <ColorSwatch
                key={colorOption.name}
                type="background"
                color={colorOption.value}
                displayColor={colorOption.displayColor}
                name={colorOption.name}
                isDefault={!colorOption.value}
                isSelected={backgroundColor === colorOption.value}
                onSelect={() => applyBackgroundColor(colorOption.value)}
              />
            ))}
          </ColorSection>

          {(textColor || backgroundColor) && (
            <>
              <div className="mx-1 h-px bg-border/40" />
              <div className="px-2 py-1.5">
                <button
                  className="w-full rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left"
                  onClick={() => {
                    captureSelection();
                    if (!ensureSelection()) {
                      editor.tf.focus();
                      setOpen(false);
                      return;
                    }
                    editor.tf.removeMarks([KEYS.color, KEYS.backgroundColor]);
                    editor.tf.focus();
                    setOpen(false);
                  }}
                  onMouseDown={e => e.preventDefault()}
                  type="button"
                >
                  Clear formatting
                </button>
              </div>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

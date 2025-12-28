'use client';

import type { FloatingToolbarState } from '@platejs/floating';
import {
  flip,
  offset,
  useFloatingToolbar,
  useFloatingToolbarState,
} from '@platejs/floating';

import { useComposedRef } from '@udecode/cn';
import { KEYS } from 'platejs';
import {
  useEditorId,
  useEventEditorValue,
  usePluginOption,
} from 'platejs/react';
import * as React from 'react';

import { cn } from '~/lib/utils';

import { Toolbar } from '~/ui/toolbar';

export function FloatingToolbar({
  children,
  className,
  state,
  ...props
}: React.ComponentProps<typeof Toolbar> & {
  state?: FloatingToolbarState;
}) {
  const editorId = useEditorId();
  const focusedEditorId = useEventEditorValue('focus');
  const isFloatingLinkOpen = !!usePluginOption({ key: KEYS.link }, 'mode');

  const floatingToolbarState = useFloatingToolbarState({
    editorId,
    focusedEditorId,
    hideToolbar: isFloatingLinkOpen,
    ...state,
    floatingOptions: {
      middleware: [
        offset(12),
        flip({
          fallbackPlacements: [
            'top-start',
            'top-end',
            'bottom-start',
            'bottom-end',
          ],
          padding: 12,
        }),
      ],
      placement: 'top',
      ...state?.floatingOptions,
    },
  });

  const {
    clickOutsideRef,
    hidden,
    props: rootProps,
    ref: floatingRef,
  } = useFloatingToolbar(floatingToolbarState);

  const ref = useComposedRef<HTMLDivElement>(props.ref, floatingRef);

  if (hidden)
    return null;

  return (
    <div ref={clickOutsideRef}>
      <Toolbar
        {...props}
        {...rootProps}
        ref={ref}
        className={cn(
          'scrollbar-hide absolute z-50 overflow-x-auto whitespace-nowrap rounded-md border bg-popover p-1 opacity-100 shadow-md print:hidden',
          'max-w-[80vw]',
          '[&_button]:h-6 [&_button]:px-1',
          '[&_button_svg]:size-3',
          '[&_.mx-2.my-1]:mx-0.5 [&_.mx-2.my-1]:h-3.5 [&_.mx-2.my-1]:my-auto', // ToolbarSeparator
          '[&_.mx-1\\.5.h-4]:mx-0.5 [&_.mx-1\\.5.h-4]:h-3', // ToolbarGroup separator
          // Blue active on "marks"
          '[&_button[data-mark][data-pressed=true]]:bg-transparent [&_button[data-mark][data-pressed=true]]:text-brand',
          '[&_button[data-mark][aria-pressed=true]]:bg-transparent [&_button[data-mark][aria-pressed=true]]:text-brand',
          '[&_button[data-mark][aria-checked=true]]:bg-transparent [&_button[data-mark][aria-checked=true]]:text-brand',
          '[&_.group-data-\[pressed\=true\]]:bg-transparent [&_.group-data-\[pressed\=true\]]:text-brand',
          className,
        )}
      >
        {children}
      </Toolbar>
    </div>
  );
}

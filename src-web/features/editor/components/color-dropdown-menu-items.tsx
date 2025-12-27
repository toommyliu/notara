'use client';

/* eslint-disable react-refresh/only-export-components */

import * as React from 'react';

import { cn } from '~/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/ui/tooltip';

export interface TColor {
  isBrightColor: boolean;
  name: string;
  value: string;
}

export const DEFAULT_COLORS: TColor[] = [
  { isBrightColor: false, name: 'black', value: '#000000' },
  { isBrightColor: false, name: 'dark grey 4', value: '#434343' },
  { isBrightColor: false, name: 'dark grey 3', value: '#666666' },
  { isBrightColor: false, name: 'dark grey 2', value: '#999999' },
  { isBrightColor: false, name: 'dark grey 1', value: '#B7B7B7' },
  { isBrightColor: false, name: 'grey', value: '#CCCCCC' },
  { isBrightColor: false, name: 'light grey 1', value: '#D9D9D9' },
  { isBrightColor: true, name: 'light grey 2', value: '#EFEFEF' },
  { isBrightColor: true, name: 'light grey 3', value: '#F3F3F3' },
  { isBrightColor: true, name: 'white', value: '#FFFFFF' },
  { isBrightColor: false, name: 'red berry', value: '#980100' },
  { isBrightColor: false, name: 'red', value: '#FE0000' },
  { isBrightColor: false, name: 'orange', value: '#FE9900' },
  { isBrightColor: true, name: 'yellow', value: '#FEFF00' },
  { isBrightColor: false, name: 'green', value: '#00FF00' },
  { isBrightColor: false, name: 'cyan', value: '#00FFFF' },
  { isBrightColor: false, name: 'cornflower blue', value: '#4B85E8' },
  { isBrightColor: false, name: 'blue', value: '#1300FF' },
  { isBrightColor: false, name: 'purple', value: '#9900FF' },
  { isBrightColor: false, name: 'magenta', value: '#FF0FFF' },
];

export function ColorDropdownMenuItems({
  className,
  color,
  colors,
  updateColor,
  ...props
}: {
  colors: TColor[];
  updateColor: (color: string) => void;
  className?: string;
  color?: string;
} & React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid grid-cols-[repeat(10,1fr)] place-items-center gap-x-1',
        className,
      )}
      {...props}
    >
      {colors.map(({ name, value }) => (
        <Tooltip key={name ?? value}>
          <TooltipTrigger
            render={props => (
              <button
                {...props}
                className={cn(
                  'my-1 flex size-6 items-center justify-center rounded-md border border-solid p-0 transition-all hover:scale-110',
                  color === value && 'ring-2 ring-inset',
                )}
                style={{
                  'backgroundColor': value,
                  'borderColor': 'rgba(0,0,0,0.06)',
                  '--tw-ring-color': color === value ? 'rgba(0,0,0,0.15)' : 'transparent',
                } as React.CSSProperties}
                onClick={(e) => {
                  props.onClick?.(e);
                  updateColor(value);
                }}
                type="button"
              />
            )}
          />
          <TooltipContent className="mb-1 capitalize">{name}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

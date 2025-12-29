import { cn } from '~/lib/utils';

interface DropIndicatorProps {
  position?: 'top' | 'bottom';
}

export function DropIndicator({ position = 'top' }: DropIndicatorProps) {
  return (
    <div
      className={cn(
        'absolute left-2 right-2 h-1 z-20 pointer-events-none bg-blue-300',
        position === 'top' ? '-top-0.5' : '-bottom-0.5',
      )}
    />
  );
}

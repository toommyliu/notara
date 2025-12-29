import { useDroppable } from '@dnd-kit/core';

import { cn } from '~/lib/utils';

import { DropIndicator } from './drop-indicator';

interface GroupDropZoneProps {
  groupId: string;
  isVisible: boolean;
}

export function GroupDropZone({ groupId, isVisible }: GroupDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `${groupId}-end`,
    data: { type: 'group-end', groupId },
  });

  if (!isVisible)
    return null;

  return (
    <div ref={setNodeRef} className="relative h-4 mt-2 -mx-2 flex items-center">
      <div
        className={cn(
          'absolute left-4 right-4 h-px transition-all duration-200',
          isOver
            ? 'bg-blue-300 h-1'
            : 'bg-border/20',
        )}
      />
    </div>
  );
}

export function GroupsEndDropZone({ isVisible }: { isVisible: boolean }) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'groups-end-list',
    data: { type: 'group-end-list' },
  });

  if (!isVisible)
    return null;

  return (
    <div ref={setNodeRef} className="h-6 relative mt-1 flex items-center">
      {isOver && <DropIndicator position="top" />}
    </div>
  );
}

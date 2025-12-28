import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

import {
  SplitDropZoneOverlay,
  SplitViewContainer,
} from '~/features/layout/components/split-view';
import { useTabsStore } from '~/features/layout/stores/tabs-store';
import {
  getOrientationFromZone,
  isDraggedTabFirst,
} from '~/features/layout/types';
import type { SplitDropZone } from '~/features/layout/types';

import { useDragContext } from '~/providers/drag-context';

const NoteEditor = lazy(() =>
  import('~/features/editor').then((mod) => ({ default: mod.NoteEditor })),
);

export const Route = createFileRoute('/notes')({
  component: NotesPage,
});

function NotesPage() {
  const splitView = useTabsStore(useShallow((s) => s.splitView));
  const createSplit = useTabsStore((s) => s.createSplit);
  const replacePaneContent = useTabsStore((s) => s.replacePaneContent);
  const setActiveTab = useTabsStore((s) => s.setActiveTab);

  const { isDragging, draggedNoteId, setSplitDropTarget } = useDragContext();

  const handleZoneChange = useCallback(
    (zone: SplitDropZone | null) => {
      setSplitDropTarget(zone);
    },
    [setSplitDropTarget],
  );

  const handleDrop = useCallback(
    (zone: SplitDropZone, noteId: string) => {
      const orientation = getOrientationFromZone(zone);

      if (orientation) {
        const draggedFirst = isDraggedTabFirst(zone);
        createSplit(noteId, orientation, draggedFirst);
      } else {
        replacePaneContent(0, noteId);
      }
    },
    [createSplit, replacePaneContent],
  );

  // No panes
  if (!splitView.panes.length || !splitView.panes[0]) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground relative">
        No note selected

        <SplitDropZoneOverlay
          isActive={isDragging}
          draggedNoteId={draggedNoteId}
          onZoneChange={handleZoneChange}
          onDrop={handleDrop}
        />
      </div>
    );
  }

  const pane0Id = splitView.panes[0];
  const pane1Id = splitView.enabled && splitView.panes.length > 1 ? splitView.panes[1] : null;

  const handlePaneClick = useCallback(
    (paneIndex: 0 | 1) => {
      const noteId = paneIndex === 0 ? pane0Id : pane1Id;
      if (noteId) {
        setActiveTab(noteId);
      }
    },
    [pane0Id, pane1Id, setActiveTab],
  );

  return (
    <div className="flex-1 flex min-h-0 relative">
      <SplitViewContainer className="flex-1" onPaneClick={handlePaneClick}>
        <Suspense fallback={<div className="flex-1" />}>
          <NoteEditor key={pane0Id} noteId={pane0Id} />
        </Suspense>
        {pane1Id && (
          <Suspense fallback={<div className="flex-1" />}>
            <NoteEditor key={pane1Id} noteId={pane1Id} />
          </Suspense>
        )}
      </SplitViewContainer>

      <SplitDropZoneOverlay
        isActive={isDragging && !splitView.enabled}
        draggedNoteId={draggedNoteId}
        onZoneChange={handleZoneChange}
        onDrop={handleDrop}
      />
    </div>
  );
}



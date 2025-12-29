import type { SplitDropZone } from '~/features/layout/types';

import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense, useCallback, useMemo, useState } from 'react';

import {
  SplitDropZoneOverlay,
  SplitViewContainer,
} from '~/features/layout/components/split-view';
import { useDragStore } from '~/features/layout/stores/drag-store';
import {
  useActivePane,
  useTabsStore,
} from '~/features/layout/stores/tabs-store';
import { getOrientationFromZone, isDraggedTabFirst } from '~/features/layout/types';

const NoteEditor = lazy(() =>
  import('~/features/editor').then(mod => ({ default: mod.NoteEditor })),
);

export const Route = createFileRoute('/notes')({
  component: NotesPage,
});

function SplitPreview({
  orientation,
  leftNoteId,
  rightNoteId,
  activeSide,
}: {
  orientation: 'horizontal' | 'vertical';
  leftNoteId: string;
  rightNoteId: string;
  activeSide: 'left' | 'right';
}) {
  const [sizes, setSizes] = useState<[number, number]>([50, 50]);

  const pane = useMemo(
    () => ({
      type: 'split' as const,
      orientation,
      left: leftNoteId,
      right: rightNoteId,
      sizes,
      activeSide,
    }),
    [activeSide, leftNoteId, orientation, rightNoteId, sizes],
  );

  return (
    <SplitViewContainer
      className="flex-1"
      paneId="__preview__"
      pane={pane}
      onSizesChange={setSizes}
    >
      <Suspense fallback={<div className="flex-1" />}>
        <NoteEditor key={`preview:${leftNoteId}`} noteId={leftNoteId} />
      </Suspense>
      <Suspense fallback={<div className="flex-1" />}>
        <NoteEditor key={`preview:${rightNoteId}`} noteId={rightNoteId} />
      </Suspense>
    </SplitViewContainer>
  );
}

function NotesPage() {
  const activePane = useActivePane();
  const activePaneId = useTabsStore(s => s.activePaneId);
  const splitPane = useTabsStore(s => s.splitPane);
  const openNote = useTabsStore(s => s.openNote);
  const setActiveSide = useTabsStore(s => s.setActiveSide);

  const isDragging = useDragStore(s => s.isDragging);
  const draggedNoteId = useDragStore(s => s.draggedNoteId);
  const wasCancelled = useDragStore(s => s.wasCancelled);
  const splitDropTarget = useDragStore(s => s.splitDropTarget);
  const setSplitDropTarget = useDragStore(s => s.setSplitDropTarget);

  const handleZoneChange = useCallback(
    (zone: SplitDropZone | null) => {
      setSplitDropTarget(zone);
    },
    [setSplitDropTarget],
  );

  const handleDrop = useCallback(
    (zone: SplitDropZone, noteId: string) => {
      const orientation = getOrientationFromZone(zone);
      const placement = isDraggedTabFirst(zone) ? 'first' : 'second';

      if (orientation && activePaneId && activePane?.type === 'single') {
        splitPane(activePaneId, noteId, orientation, placement);
      }
      else {
        openNote(noteId);
      }
    },
    [activePaneId, activePane, splitPane, openNote],
  );

  if (!activePane) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground relative">
        No note selected

        <SplitDropZoneOverlay
          isActive={isDragging}
          draggedNoteId={draggedNoteId}
          wasCancelled={wasCancelled}
          onZoneChange={handleZoneChange}
          onDrop={handleDrop}
        />
      </div>
    );
  }

  const handlePaneClick = (paneIndex: 0 | 1) => {
    const side = paneIndex === 0 ? 'left' : 'right';
    setActiveSide(side);
  };

  if (activePane.type === 'single') {
    const previewZone = isDragging ? splitDropTarget : null;
    const previewOrientation = previewZone
      ? getOrientationFromZone(previewZone)
      : null;
    const previewPlacement = previewZone && isDraggedTabFirst(previewZone)
      ? 'first'
      : 'second';
    const showSplitPreview = Boolean(
      previewOrientation
      && isDragging
      && draggedNoteId
      && activePane?.type === 'single',
    );

    const canShowPreview = showSplitPreview && draggedNoteId !== activePane.noteId;

    const leftNoteId = canShowPreview
      ? (previewPlacement === 'first' ? draggedNoteId! : activePane.noteId)
      : activePane.noteId;
    const rightNoteId = canShowPreview
      ? (previewPlacement === 'first' ? activePane.noteId : draggedNoteId!)
      : activePane.noteId;
    const activeSide = previewPlacement === 'first' ? 'left' : 'right';

    return (
      <div className="flex-1 flex min-h-0 relative">
        {canShowPreview && previewOrientation
          ? (
              <SplitPreview
                key={`split-preview:${previewOrientation}:${previewPlacement}:${activePane.noteId}:${draggedNoteId}`}
                orientation={previewOrientation}
                leftNoteId={leftNoteId}
                rightNoteId={rightNoteId}
                activeSide={activeSide}
              />
            )
          : (
              <Suspense fallback={<div className="flex-1" />}>
                <NoteEditor key={activePane.noteId} noteId={activePane.noteId} />
              </Suspense>
            )}

        <SplitDropZoneOverlay
          isActive={isDragging}
          draggedNoteId={draggedNoteId}
          wasCancelled={wasCancelled}
          onZoneChange={handleZoneChange}
          onDrop={handleDrop}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-0 relative">
      <SplitViewContainer
        className="flex-1"
        paneId={activePaneId!}
        pane={activePane}
        onPaneClick={handlePaneClick}
      >
        <Suspense fallback={<div className="flex-1" />}>
          <NoteEditor key={activePane.left} noteId={activePane.left} />
        </Suspense>
        <Suspense fallback={<div className="flex-1" />}>
          <NoteEditor key={activePane.right} noteId={activePane.right} />
        </Suspense>
      </SplitViewContainer>

      <SplitDropZoneOverlay
        isActive={false}
        draggedNoteId={draggedNoteId}
        wasCancelled={wasCancelled}
        onZoneChange={handleZoneChange}
        onDrop={handleDrop}
      />
    </div>
  );
}

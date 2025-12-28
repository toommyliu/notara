import type { Pane } from '~/features/layout/stores/split-view-store';
import type { Note } from '~/features/notes/store';

import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

import { SplitViewContainer } from '~/features/layout';

const NoteEditor = lazy(() =>
  import('~/features/editor').then(mod => ({ default: mod.NoteEditor })),
);

const StaticNotePreview = lazy(() =>
  import('~/features/editor').then(mod => ({ default: mod.StaticNotePreview })),
);

export const Route = createFileRoute('/notes')({
  component: NotesPage,
});

function NotesPage() {
  const renderPane = (pane: Pane, _isActive: boolean) => {
    if (!pane.noteId) {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          No note selected
        </div>
      );
    }
    return (
      <Suspense fallback={<div className="flex-1" />}>
        <NoteEditor key={pane.noteId} noteId={pane.noteId} />
      </Suspense>
    );
  };

  const renderPreview = (note: Note) => (
    <Suspense fallback={<div className="flex-1" />}>
      <StaticNotePreview note={note} />
    </Suspense>
  );

  return <SplitViewContainer renderPane={renderPane} renderPreview={renderPreview} />;
}

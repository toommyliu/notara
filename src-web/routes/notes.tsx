import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

import { useTabsStore } from '~/features/layout/stores/tabs-store';

const NoteEditor = lazy(() =>
  import('~/features/editor').then(mod => ({ default: mod.NoteEditor })),
);

export const Route = createFileRoute('/notes')({
  component: NotesPage,
});

function NotesPage() {
  const activeTabId = useTabsStore(s => s.activeTabId);

  if (!activeTabId) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">No note selected</div>;
  }

  return (
    <Suspense fallback={<div className="flex-1" />}>
      <NoteEditor key={activeTabId} noteId={activeTabId} />
    </Suspense>
  );
}

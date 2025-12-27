import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const NoteEditor = lazy(() =>
  import('~/features/editor').then((mod) => ({ default: mod.NoteEditor })),
);

export const Route = createFileRoute('/notes')({
  component: NotesPage,
});

function NotesPage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <NoteEditor />
    </Suspense>
  );
}

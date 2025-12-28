import type { Note } from '~/features/notes/store';
import { cn } from '~/lib/utils';

interface StaticNotePreviewProps {
  note: Note;
  orientation?: 'horizontal' | 'vertical';
}

export function StaticNotePreview({
  note,
  orientation = 'horizontal',
}: StaticNotePreviewProps) {
  const isVertical = orientation === 'vertical';

  return (
    <div className="relative h-full flex flex-col items-center overflow-y-auto scrollbar-none select-none bg-background">
      <div
        className={cn(
          'w-full max-w-3xl px-12 opacity-60',
          isVertical ? 'pt-8' : 'pt-16',
        )}
      >
        {note.emoji && (
          <div
            className={cn(
              'flex justify-start',
              isVertical ? 'mb-2' : 'mb-4',
            )}
          >
            <span
              className={cn(
                'opacity-80',
                isVertical ? 'text-5xl' : 'text-7xl',
              )}
            >
              {note.emoji}
            </span>
          </div>
        )}

        <h1
          className={cn(
            'font-bold mb-4 leading-tight text-foreground/70 select-text',
            isVertical ? 'text-2xl' : 'text-4xl',
          )}
        >
          {note.title || 'Untitled'}
        </h1>

        <div className="space-y-2 text-muted-foreground/40 select-text pb-16">
          <p
            className={cn(
              'leading-relaxed italic',
              isVertical ? 'text-sm' : 'text-base',
            )}
          >
            Start typing to add content...
          </p>
        </div>
      </div>
    </div>
  );
}

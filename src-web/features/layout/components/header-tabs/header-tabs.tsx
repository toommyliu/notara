import type {
  CollisionDetection,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import type { CSSProperties, WheelEvent } from 'react';
import type { HeaderTabItemHandle } from './types';
import type { Pane, PaneId } from '~/features/layout/stores/tabs-store';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  horizontalListSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable';
import { useNavigate } from '@tanstack/react-router';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import IconCheck from '~icons/lucide/check';
import IconChevronDown from '~icons/lucide/chevron-down';
import IconPlus from '~icons/lucide/plus';
import IconSearch from '~icons/lucide/search';

import {
  getPaneNoteIds,
  useActiveNoteId,
  useOrderedPanes,
  useTabsStore,
} from '~/features/layout/stores/tabs-store';
import {
  useNoteMetadata,
  useNotesStore,
  useNoteTitles,
} from '~/features/notes/store';

import { cn } from '~/lib/utils';

import { useDragContext } from '~/providers/drag-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/ui/dropdown-menu';
import { Input } from '~/ui/input';
import { HeaderTabItem } from './header-tab-item';

import { SplitTabItem } from './split-tab-item';

interface TabDropdownItemProps {
  noteId: string;
  isActive: boolean;
  onClick: () => void;
}

function TabDropdownItem({ noteId, isActive, onClick }: TabDropdownItemProps) {
  const note = useNoteMetadata(noteId);
  if (!note) {
    return null;
  }
  return (
    <DropdownMenuItem onClick={onClick} className="gap-2">
      <span className="text-sm shrink-0">{note.emoji}</span>
      <span
        className={cn(
          'truncate flex-1 font-medium',
          !isActive && 'text-muted-foreground text-normal',
        )}
      >
        {note.title}
      </span>
      {isActive && <IconCheck className="size-3.5 text-primary ml-auto" />}
    </DropdownMenuItem>
  );
}

interface TabDragOverlayContentProps {
  noteId: string | null;
}

function TabDragOverlayContent({ noteId }: TabDragOverlayContentProps) {
  const note = useNoteMetadata(noteId ?? '');
  if (!noteId || !note) {
    return null;
  }
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 bg-background border rounded-md shadow-lg text-sm whitespace-nowrap z-50 pointer-events-none"
      data-no-drag
    >
      <span>{note.emoji}</span>
      <span className="font-medium">{note.title}</span>
    </div>
  );
}

export function HeaderTabs() {
  const orderedPanes = useOrderedPanes();
  const activeNoteId = useActiveNoteId();
  const activePaneId = useTabsStore(s => s.activePaneId);

  const openNote = useTabsStore(s => s.openNote);
  const setActivePane = useTabsStore(s => s.setActivePane);
  const setActiveSide = useTabsStore(s => s.setActiveSide);
  const closePane = useTabsStore(s => s.closePane);
  const closeNoteInPane = useTabsStore(s => s.closeNoteInPane);
  const reorderPanes = useTabsStore(s => s.reorderPanes);
  const isTabBarVisible = useTabsStore(s => s.isTabBarVisible);

  const groups = useNotesStore(s => s.groups);
  const addNote = useNotesStore(s => s.addNote);

  const allNoteIds = useMemo(
    () => orderedPanes.flatMap(({ pane }) => getPaneNoteIds(pane)),
    [orderedPanes],
  );
  const noteTitles = useNoteTitles(allNoteIds);
  const dragContext = useDragContext();
  const navigate = useNavigate();

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tabRefs = useRef<Map<string, HeaderTabItemHandle>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const tabListRef = useRef<HTMLDivElement>(null);
  const collisionDetection: CollisionDetection = args => {
    if (tabListRef.current && args.pointerCoordinates) {
      const rect = tabListRef.current.getBoundingClientRect();
      const { x, y } = args.pointerCoordinates;

      const isInside
        = x >= rect.left
          && x <= rect.right
          && y >= rect.top - 20
          && y <= rect.bottom + 20;

      if (!isInside) {
        return [];
      }
    }

    return closestCenter(args);
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateFades = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth }
        = scrollContainerRef.current;
      setShowLeftFade(scrollLeft > 10);
      setShowRightFade(scrollLeft + clientWidth < scrollWidth - 10);
    }
  }, []);

  const panesLength = orderedPanes.length;
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      updateFades();
      window.addEventListener('resize', updateFades);
      return () => window.removeEventListener('resize', updateFades);
    }
  }, [updateFades, panesLength]);

  const handleDragStart = (ev: DragStartEvent) => {
    const paneId = ev.active.id as string;
    setActiveDragId(paneId);
    const pane = orderedPanes.find(p => p.id === paneId)?.pane;
    const noteId = pane?.type === 'single' ? pane.noteId : pane?.left;
    if (noteId) {
      dragContext?.startDrag(noteId, 'tabs');
    }
  };

  const handleDragEnd = (ev: DragEndEvent) => {
    const { active, over } = ev;
    setActiveDragId(null);
    dragContext?.endDrag();

    if (!over || active.id === over.id) {
      return;
    }

    reorderPanes(active.id as string, over.id as string);
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
    dragContext?.endDrag(true);
  };

  const handleNewTab = () => {
    const firstGroup = groups[0];
    if (firstGroup) {
      const newNoteId = addNote(firstGroup.id, 'Untitled', '📄');
      openNote(newNoteId);
      navigate({ to: '/notes' });
    }
  };

  const handleWheel = (ev: WheelEvent) => {
    if (scrollContainerRef.current && ev.deltaY !== 0) {
      ev.preventDefault();
      scrollContainerRef.current.scrollLeft += ev.deltaY;
      updateFades();
    }
  };

  const handleScroll = () => {
    updateFades();
  };

  const handlePaneClick = (paneId: PaneId) => {
    setActivePane(paneId);
    navigate({ to: '/notes' });
  };

  const handleClosePane = (paneId: PaneId) => {
    closePane(paneId);
  };

  const handleCloseNoteInPane = (paneId: PaneId, noteId: string) => {
    closeNoteInPane(paneId, noteId);
  };

  const handleActivateSide = (side: 'left' | 'right', paneId: PaneId) => {
    setActivePane(paneId);
    setActiveSide(side);
    navigate({ to: '/notes' });
  };

  // Filter panes for dropdown search
  const filterPanes = (panes: typeof orderedPanes) => {
    if (!searchQuery) {
      return panes;
    }
    const query = searchQuery.toLowerCase();
    return panes.filter(({ pane }) => {
      const noteIds = getPaneNoteIds(pane);
      return noteIds.some((id) => {
        const title = noteTitles.get(id);
        return title?.toLowerCase().includes(query);
      });
    });
  };

  const pinnedPanes = orderedPanes.filter(p => p.isPinned);
  const openPanes = orderedPanes.filter(p => !p.isPinned);
  const filteredPinned = filterPanes(pinnedPanes);
  const filteredOpen = filterPanes(openPanes);

  if (!isTabBarVisible) {
    return null;
  }

  if (orderedPanes.length === 0) {
    return null;
  }

  const renderPane = ({ id, pane, isPinned }: { id: PaneId; pane: Pane; isPinned: boolean }) => {
    const isActive = id === activePaneId;

    if (pane.type === 'split') {
      return (
        <SplitTabItem
          key={id}
          ref={handle => {
            if (handle) {
              tabRefs.current.set(id, handle);
            }
            else {
              tabRefs.current.delete(id);
            }
          }}
          paneId={id}
          pane={pane}
          isActive={isActive}
          isPinned={isPinned}
          onActivate={() => handlePaneClick(id)}
          onActivateSide={side => handleActivateSide(side, id)}
          onClose={() => handleClosePane(id)}
          onCloseNote={noteId => handleCloseNoteInPane(id, noteId)}
        />
      );
    }

    return (
      <HeaderTabItem
        key={id}
        ref={handle => {
          if (handle) {
            tabRefs.current.set(id, handle);
          }
          else {
            tabRefs.current.delete(id);
          }
        }}
        noteId={pane.noteId}
        paneId={id}
        isActive={isActive}
        isPinned={isPinned}
        onActivate={() => handlePaneClick(id)}
        onClose={() => handleClosePane(id)}
      />
    );
  };

  const paneIds = orderedPanes.map(p => p.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className="flex items-center w-full pointer-events-auto"
        data-no-drag
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div
          ref={tabListRef}
          className="relative flex items-center min-w-0 group/tabs outline-none"
          role="tablist"
          aria-orientation="horizontal"
        >
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-1.5 min-w-0 overflow-x-auto overflow-y-hidden scrollbar-none pb-2 -mb-2 pl-2"
            style={
              {
                overscrollBehavior: 'contain',
                maskImage: `linear-gradient(to right,
                            ${showLeftFade ? 'transparent' : 'black'} 0px,
                            black 40px,
                            black calc(100% - 40px),
                            ${showRightFade ? 'transparent' : 'black'} 100%)`,
                WebkitMaskImage: `linear-gradient(to right,
                            ${showLeftFade ? 'transparent' : 'black'} 0px,
                            black 40px,
                            black calc(100% - 40px),
                            ${showRightFade ? 'transparent' : 'black'} 100%)`,
              } as CSSProperties
            }
            onWheel={handleWheel}
            onScroll={handleScroll}
          >
            <SortableContext
              items={paneIds}
              strategy={horizontalListSortingStrategy}
            >
              {pinnedPanes.map(renderPane)}

              {pinnedPanes.length > 0 && openPanes.length > 0 && (
                <div className="w-px h-3.5 mx-1 shrink-0 bg-border/60" />
              )}

              {openPanes.map(renderPane)}
            </SortableContext>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-1 shrink-0 px-1 py-0.5 relative z-20" data-no-drag>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                'p-1.5 rounded-md transition-colors outline-none',
                'text-muted-foreground/60 hover:text-foreground hover:bg-muted/40',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                'data-[state=open]:text-foreground data-[state=open]:bg-muted/40',
              )}
              aria-label="All tabs"
            >
              <IconChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-64 max-h-80 flex flex-col">
              <div className="p-2 border-b sticky top-0 bg-popover z-10">
                <div className="relative">
                  <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search tabs..."
                    className="h-8 pl-8 text-xs"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.stopPropagation()}
                    autoFocus
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                {filteredPinned.length > 0 && (
                  <>
                    <DropdownMenuLabel>Pinned</DropdownMenuLabel>
                    {filteredPinned.flatMap(({ id, pane }) =>
                      getPaneNoteIds(pane).map(noteId => (
                        <TabDropdownItem
                          key={`${id}-${noteId}`}
                          noteId={noteId}
                          isActive={activeNoteId === noteId}
                          onClick={() => {
                            openNote(noteId);
                            setSearchQuery('');
                            navigate({ to: '/notes' });
                          }}
                        />
                      )),
                    )}
                    {filteredOpen.length > 0 && <DropdownMenuSeparator />}
                  </>
                )}

                {filteredOpen.length > 0 && (
                  <>
                    {filteredPinned.length > 0 && <DropdownMenuLabel>Open</DropdownMenuLabel>}
                    {filteredOpen.flatMap(({ id, pane }) =>
                      getPaneNoteIds(pane).map(noteId => (
                        <TabDropdownItem
                          key={`${id}-${noteId}`}
                          noteId={noteId}
                          isActive={activeNoteId === noteId}
                          onClick={() => {
                            openNote(noteId);
                            setSearchQuery('');
                            navigate({ to: '/notes' });
                          }}
                        />
                      )),
                    )}
                  </>
                )}

                {filteredPinned.length === 0 && filteredOpen.length === 0 && (
                  <div className="p-4 text-xs text-center text-muted-foreground">
                    {searchQuery ? 'No results found' : 'No open tabs'}
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={handleNewTab}
            className={cn(
              'p-1.5 rounded-md transition-colors outline-none',
              'text-muted-foreground/60 hover:text-foreground hover:bg-muted/40',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
            )}
            aria-label="New tab"
          >
            <IconPlus className="size-3.5" />
          </button>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        <TabDragOverlayContent noteId={activeDragId} />
      </DragOverlay>
    </DndContext>
  );
}

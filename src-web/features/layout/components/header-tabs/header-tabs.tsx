import type {
  CollisionDetection,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import type { CSSProperties, WheelEvent } from 'react';
import type { HeaderTabItemHandle } from './types';
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

import { useCallback, useEffect, useRef, useState } from 'react';

import IconChevronDown from '~icons/lucide/chevron-down';
import IconPlus from '~icons/lucide/plus';
import IconCheck from '~icons/lucide/check';
import IconSearch from '~icons/lucide/search';

import { useTabsStore } from '~/features/layout/stores/tabs-store';
import { useNotesStore } from '~/features/notes/store';
import { useDragContext } from '~/providers/drag-context';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '~/ui/dropdown-menu';
import { Input } from '~/ui/input';
import { HeaderTabItem } from './header-tab-item';
import { SplitTabItem } from './split-tab-item';

import { cn } from '~/lib/utils';

export function HeaderTabs() {
  const {
    pinnedTabs,
    openTabs,
    openTab,
    activeTabId,
    setActiveTab,
    closeTab,
    reorderTabs,
    isTabBarVisible,
    tabGroups,
    removeFromGroup,
    splitView,
    closeSplitPair,
  } = useTabsStore();

  const notes = useNotesStore((s) => s.notes);
  const groups = useNotesStore((s) => s.groups);
  const addNote = useNotesStore((s) => s.addNote);
  const dragContext = useDragContext();
  const navigate = useNavigate();

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tabRefs = useRef<Map<string, HeaderTabItemHandle>>(new Map());

  const splitPair = splitView.splitPair;

  const getGroupForTab = (noteId: string) => {
    if (splitPair && splitPair.includes(noteId)) return splitPair;
    return tabGroups.find((g) => g.includes(noteId));
  };

  const handleClosePane = (id: string) => {
    if (splitPair && splitPair.includes(id)) {
      closeSplitPair();
    } else {
      removeFromGroup(id);
    }
  };

  const processTabs = (tabIds: string[]) => {
    const processed: string[] = [];
    const seenInGroup = new Set<string>();

    for (const id of tabIds) {
      if (seenInGroup.has(id)) continue;

      const group = getGroupForTab(id);
      if (group) {
        processed.push(id);
        group.forEach((gid) => seenInGroup.add(gid));
      } else {
        processed.push(id);
      }
    }
    return processed;
  };

  const visiblePinned = processTabs(pinnedTabs);

  const processedInPinned = new Set<string>();
  visiblePinned.forEach((id) => {
    const group = getGroupForTab(id);
    if (group) {
      group.forEach((gid) => processedInPinned.add(gid));
    } else {
      processedInPinned.add(id);
    }
  });

  const visibleOpen = processTabs(
    openTabs.filter((id) => !processedInPinned.has(id)),
  );
  const allVisibleTabs = [...visiblePinned, ...visibleOpen];

  const filterTabs = (ids: string[]) => {
    if (!searchQuery) return ids;
    const query = searchQuery.toLowerCase();
    return ids.filter((id) => {
      const note = notes.get(id);
      return note?.title.toLowerCase().includes(query);
    });
  };

  const filteredPinned = filterTabs(pinnedTabs);
  const filteredOpen = filterTabs(openTabs.filter((id) => !pinnedTabs.includes(id)));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const tabListRef = useRef<HTMLDivElement>(null);
  const collisionDetection: CollisionDetection = (args) => {
    if (tabListRef.current && args.pointerCoordinates) {
      const rect = tabListRef.current.getBoundingClientRect();
      const { x, y } = args.pointerCoordinates;

      const isInside =
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top - 20 &&
        y <= rect.bottom + 20;

      if (!isInside) return [];
    }

    return closestCenter(args);
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateFades = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftFade(scrollLeft > 10);
      setShowRightFade(scrollLeft + clientWidth < scrollWidth - 10);
    }
  }, [allVisibleTabs.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      updateFades();
      window.addEventListener('resize', updateFades);
      return () => window.removeEventListener('resize', updateFades);
    }
  }, [updateFades, allVisibleTabs.length]);

  const handleDragStart = (ev: DragStartEvent) => {
    const noteId = ev.active.id as string;
    setActiveDragId(noteId);
    dragContext?.startDrag(noteId, 'tabs');
  };

  const handleDragEnd = (ev: DragEndEvent) => {
    const { active, over } = ev;
    setActiveDragId(null);

    dragContext?.endDrag();

    if (!over || active.id === over.id) return;

    const activeSection = active.data.current?.section as 'pinned' | 'open';
    const overSection = over.data.current?.section as 'pinned' | 'open';

    if (activeSection === overSection)
      reorderTabs(active.id as string, over.id as string, activeSection);
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
    dragContext?.endDrag();
  };

  const handleNewTab = () => {
    const firstGroup = groups[0];
    if (firstGroup) {
      const newNoteId = addNote(firstGroup.id, 'Untitled', '📄');
      openTab(newNoteId);

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

  if (!isTabBarVisible) return null;

  const hasTabs = pinnedTabs.length > 0 || openTabs.length > 0;
  if (!hasTabs) return null;

  const draggedNote = activeDragId ? notes.get(activeDragId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className="flex items-center min-w-0 pointer-events-auto"
        data-no-drag
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
              items={allVisibleTabs}
              strategy={horizontalListSortingStrategy}
            >
              {visiblePinned.map((noteId) => {
                const group = getGroupForTab(noteId);
                if (group) {
                  return (
                    <SplitTabItem
                      key={noteId}
                      ref={(handle) => {
                        if (handle) {
                          tabRefs.current.set(noteId, handle);
                        } else {
                          tabRefs.current.delete(noteId);
                        }
                      }}
                      noteId={noteId}
                      isActive={group.includes(activeTabId || '')}
                      isPinned={true}
                      noteIds={group}
                      onActivatePane={(id) => {
                        setActiveTab(id);

                        navigate({ to: '/notes' });
                      }}
                      onActivate={() => {
                        setActiveTab(noteId);

                      }}
                      onClose={() => closeTab(noteId)}
                      onClosePane={handleClosePane}
                    />
                  );
                }
                return (
                  <HeaderTabItem
                    key={noteId}
                    ref={(handle) => {
                      if (handle) {
                        tabRefs.current.set(noteId, handle);
                      } else {
                        tabRefs.current.delete(noteId);
                      }
                    }}
                    noteId={noteId}
                    isActive={activeTabId === noteId}
                    isPinned={true}
                    onActivate={() => {
                      setActiveTab(noteId);

                      navigate({ to: '/notes' });
                    }}
                    onClose={() => closeTab(noteId)}
                  />
                );
              })}

              {visiblePinned.length > 0 && visibleOpen.length > 0 && (
                <div className="w-px h-3.5 mx-1 shrink-0 bg-border/60" />
              )}

              {visibleOpen.map((noteId) => {
                const group = getGroupForTab(noteId);
                if (group) {
                  return (
                    <SplitTabItem
                      key={noteId}
                      ref={(handle) => {
                        if (handle) {
                          tabRefs.current.set(noteId, handle);
                        } else {
                          tabRefs.current.delete(noteId);
                        }
                      }}
                      noteId={noteId}
                      isActive={group.includes(activeTabId || '')}
                      isPinned={false}
                      noteIds={group}
                      onActivatePane={(id) => {
                        setActiveTab(id);

                        navigate({ to: '/notes' });
                      }}
                      onActivate={() => {
                        setActiveTab(noteId);

                      }}
                      onClose={() => closeTab(noteId)}
                      onClosePane={handleClosePane}
                    />
                  );
                }
                return (
                  <HeaderTabItem
                    key={noteId}
                    ref={(handle) => {
                      if (handle) tabRefs.current.set(noteId, handle);
                      else tabRefs.current.delete(noteId);
                    }}
                    noteId={noteId}
                    isActive={activeTabId === noteId}
                    isPinned={false}
                    onActivate={() => {
                      setActiveTab(noteId);

                      navigate({ to: '/notes' });
                    }}
                    onClose={() => closeTab(noteId)}
                  />
                );
              })}
            </SortableContext>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-1 shrink-0 px-1 py-0.5 relative z-20">
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                {filteredPinned.length > 0 && (
                  <>
                    <DropdownMenuLabel>Pinned</DropdownMenuLabel>
                    {filteredPinned.map((noteId) => {
                      const note = notes.get(noteId);
                      if (!note) return null;
                      const isActive = activeTabId === noteId;
                      return (
                        <DropdownMenuItem
                          key={noteId}
                          onClick={() => {
                            setActiveTab(noteId);
                            setSearchQuery('');
                            navigate({ to: '/notes' });
                          }}
                          className="gap-2"
                        >
                          <span className="text-sm shrink-0">{note.emoji}</span>
                          <span className={cn("truncate flex-1 font-medium", !isActive && "text-muted-foreground text-normal")}>
                            {note.title}
                          </span>
                          {isActive && <IconCheck className="size-3.5 text-primary ml-auto" />}
                        </DropdownMenuItem>
                      );
                    })}
                    {filteredOpen.length > 0 && <DropdownMenuSeparator />}
                  </>
                )}

                {filteredOpen.length > 0 && (
                  <>
                    {(filteredPinned.length > 0) && <DropdownMenuLabel>Open</DropdownMenuLabel>}
                    {filteredOpen.map((noteId) => {
                      const note = notes.get(noteId);
                      if (!note) return null;
                      const isActive = activeTabId === noteId;
                      return (
                        <DropdownMenuItem
                          key={noteId}
                          onClick={() => {
                            setActiveTab(noteId);
                            setSearchQuery('');
                            navigate({ to: '/notes' });
                          }}
                          className="gap-2"
                        >
                          <span className="text-sm shrink-0">{note.emoji}</span>
                          <span className={cn("truncate flex-1 font-medium", !isActive && "text-muted-foreground text-normal")}>
                            {note.title}
                          </span>
                          {isActive && <IconCheck className="size-3.5 text-primary ml-auto" />}
                        </DropdownMenuItem>
                      );
                    })}
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
        {draggedNote && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 bg-background border rounded-md shadow-lg text-sm whitespace-nowrap z-50 pointer-events-none"
            data-no-drag
          >
            <span>{draggedNote.emoji}</span>
            <span className="font-medium">{draggedNote.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

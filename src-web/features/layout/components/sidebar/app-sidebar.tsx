import type {
  CollisionDetection,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  Modifier,
} from '@dnd-kit/core';
import type { SortingStrategy } from '@dnd-kit/sortable';

import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useDragStore } from '~/features/layout/stores/drag-store';
import { useActiveNoteId, useTabsStore } from '~/features/layout/stores/tabs-store';
import { useNotesStore } from '~/features/notes/store';
import { HapticFeedbackPattern, useHaptics } from '~/hooks/use-haptics';
import { usePlatformLayout } from '~/hooks/use-platform';
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from '~/ui/sidebar';

import { GroupsEndDropZone } from './drop-zones';
import { SidebarActionStrip } from './sidebar-action-strip';
import { SidebarDragOverlay } from './sidebar-drag-overlay';
import { SortableGroup } from './sortable-group';

export function AppSidebar() {
  const layout = usePlatformLayout();
  const navigate = useNavigate();
  const groups = useNotesStore(s => s.groups);
  const addNote = useNotesStore(s => s.addNote);
  const toggleGroupCollapse = useNotesStore(s => s.toggleGroupCollapse);
  const reorderGroups = useNotesStore(s => s.reorderGroups);
  const moveNote = useNotesStore(s => s.moveNote);
  const reorderNotesInGroup = useNotesStore(s => s.reorderNotesInGroup);
  const openNote = useTabsStore(s => s.openNote);
  const activeNoteId = useActiveNoteId();

  const setIsOutsideSidebar = useDragStore(s => s.setIsOutsideSidebar);
  const startDrag = useDragStore(s => s.startDrag);
  const endDrag = useDragStore(s => s.endDrag);
  const splitDropTarget = useDragStore(s => s.splitDropTarget);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<'note' | 'group' | null>(
    null,
  );
  const [hasHorizontalIntent, setHasHorizontalIntent] = useState(false);
  const activeDragTypeRef = useRef<'note' | 'group' | null>(null);
  const sidebarContentRef = useRef<HTMLDivElement>(null);
  const lastOverId = useRef<string | null>(null);
  const disableSortingRef = useRef(false);
  const dragStartXRef = useRef<number | null>(null);
  const freezeSidebarDnDRef = useRef(false);
  const horizontalIntentRef = useRef(false);
  const isSplitDropActiveRef = useRef(false);

  // Threshold in pixels - if user moves right more than this, assume editor-drop intent
  const HORIZONTAL_INTENT_THRESHOLD = 30;

  const { perform } = useHaptics();

  const draggingGroupId = activeDragType === 'group' ? activeDragId : null;
  const isDraggingGroup = activeDragType === 'group';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const conditionalSortingStrategy: SortingStrategy = useCallback(
    (args) => {
      if (disableSortingRef.current || freezeSidebarDnDRef.current)
        return { x: 0, y: 0, scaleX: 1, scaleY: 1 };

      return verticalListSortingStrategy(args);
    },
    [],
  );

  // Only restrict to vertical axis when dragging groups, not notes
  const conditionalVerticalRestriction: Modifier = (args) => {
    const { transform, draggingNodeRect } = args;

    // When the editor split-drop zones are active, freeze sidebar visuals.
    if (freezeSidebarDnDRef.current) {
      return { x: 0, y: 0, scaleX: 1, scaleY: 1 };
    }

    if (!sidebarContentRef.current || !draggingNodeRect) {
      return transform;
    }

    const value = { ...transform };

    if (activeDragTypeRef.current === 'group') {
      const verticalTransform = restrictToVerticalAxis(args);
      value.x = verticalTransform.x;
      value.y = verticalTransform.y;
    }
    else if (activeDragTypeRef.current === 'note') {
      // Notes should only move vertically inside the sidebar.
      value.x = 0;
    }

    const containerRect = sidebarContentRef.current.getBoundingClientRect();
    const minTop = containerRect.top;
    const maxBottom = containerRect.bottom;

    const minY = minTop - draggingNodeRect.top;
    const maxY = maxBottom - draggingNodeRect.bottom;

    value.y = Math.max(minY, Math.min(value.y, maxY));

    // Also restrict X for notes/groups so they don't fly off too far
    const minX = containerRect.left - draggingNodeRect.left;
    const maxX = containerRect.right - draggingNodeRect.right;

    value.x = Math.max(minX, Math.min(value.x, maxX));

    return value;
  };

  const collisionDetection: CollisionDetection = (args) => {
    const activeType
      = args.active.data.current?.type ?? activeDragTypeRef.current;

    if (freezeSidebarDnDRef.current)
      return [];

    // Check if pointer is within sidebar OR has moved significantly to the right (horizontal intent)
    if (sidebarContentRef.current && args.pointerCoordinates) {
      const rect = sidebarContentRef.current.getBoundingClientRect();
      const { x, y } = args.pointerCoordinates;

      const isInside
        = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

      // Detect horizontal intent: if user moved right more than threshold, assume editor-drop
      const hasHorizontalIntent
        = dragStartXRef.current !== null
          && (x - dragStartXRef.current) > HORIZONTAL_INTENT_THRESHOLD;

      if (!isInside || hasHorizontalIntent)
        return [];
    }

    const droppableContainers
      = activeType === 'group'
        ? args.droppableContainers.filter(
            container => container.data.current?.type === 'group',
          )
        : args.droppableContainers;

    return closestCenter({ ...args, droppableContainers });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveDragId(active.id as string);
    const type = active.data.current?.type ?? null;
    setActiveDragType(type);
    activeDragTypeRef.current = type;

    const activatorEvent = event.activatorEvent as PointerEvent;
    dragStartXRef.current = activatorEvent.clientX;
    horizontalIntentRef.current = false;
    isSplitDropActiveRef.current = false;
    freezeSidebarDnDRef.current = false;
    setHasHorizontalIntent(false);

    // Broadcast to split view if dragging a note
    if (type === 'note') {
      startDrag(active.id as string, 'sidebar');
    }

    perform(HapticFeedbackPattern.Alignment);
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
    setActiveDragType(null);
    activeDragTypeRef.current = null;
    lastOverId.current = null;
    disableSortingRef.current = false;
    dragStartXRef.current = null;
    freezeSidebarDnDRef.current = false;
    horizontalIntentRef.current = false;
    isSplitDropActiveRef.current = false;
    setHasHorizontalIntent(false);
    endDrag(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveDragId(null);
    setActiveDragType(null);
    activeDragTypeRef.current = null;
    lastOverId.current = null;
    disableSortingRef.current = false;
    dragStartXRef.current = null;
    freezeSidebarDnDRef.current = false;
    horizontalIntentRef.current = false;
    isSplitDropActiveRef.current = false;
    setHasHorizontalIntent(false);

    const wasSplitDrop = splitDropTarget !== null;
    endDrag();

    if (wasSplitDrop || !over || active.id === over.id) {
      return;
    }

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Reorder groups
    if (activeType === 'group') {
      if (overType === 'group') {
        reorderGroups(active.id as string, over.id as string);
      }
      else if (overType === 'group-end-list') {
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && active.id !== lastGroup.id) {
          reorderGroups(active.id as string, lastGroup.id);
        }
      }
      return;
    }

    // Reorder or move notes
    if (activeType === 'note') {
      const activeGroupId = active.data.current?.groupId;

      if (overType === 'note') {
        const overGroupId = over.data.current?.groupId;

        if (activeGroupId === overGroupId) {
          // Reorder within same group
          reorderNotesInGroup(
            activeGroupId,
            active.id as string,
            over.id as string,
          );
        }
        else {
          // Move to different group
          moveNote(
            active.id as string,
            activeGroupId,
            overGroupId,
            over.id as string,
          );
        }
      }
      else if (overType === 'group') {
        // Drop on group header - add to end of that group
        if (activeGroupId !== over.id) {
          moveNote(active.id as string, activeGroupId, over.id as string);
        }
      }
      else if (overType === 'group-end') {
        // Drop at end of group
        const targetGroupId = over.data.current?.groupId;
        if (activeGroupId !== targetGroupId) {
          moveNote(active.id as string, activeGroupId, targetGroupId);
        }
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;

    if (over && over.id !== lastOverId.current) {
      lastOverId.current = over.id as string;
      perform(HapticFeedbackPattern.Alignment);
    }
  };

  // Track actual cursor position with native mousemove when dragging notes
  // (dnd-kit's event.delta is constrained by the restrictToVerticalAxis modifier)
  useEffect(() => {
    if (activeDragType !== 'note') {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const container = sidebarContentRef.current;
      if (!container)
        return;

      const rect = container.getBoundingClientRect();
      const isInside
        = e.clientX >= rect.left
          && e.clientX <= rect.right
          && e.clientY >= rect.top
          && e.clientY <= rect.bottom;

      const shouldDisable = !isInside;

      const hasHorizontalIntent
        = dragStartXRef.current !== null
          && (e.clientX - dragStartXRef.current) > HORIZONTAL_INTENT_THRESHOLD;

      if (horizontalIntentRef.current !== hasHorizontalIntent) {
        horizontalIntentRef.current = hasHorizontalIntent;
        setHasHorizontalIntent(hasHorizontalIntent);
      }

      freezeSidebarDnDRef.current
        = activeDragTypeRef.current === 'note'
          && (isSplitDropActiveRef.current || hasHorizontalIntent);

      // Only update if the value changed to avoid infinite re-renders
      if (disableSortingRef.current !== shouldDisable) {
        disableSortingRef.current = shouldDisable;
        setIsOutsideSidebar(shouldDisable);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      disableSortingRef.current = false;
      setIsOutsideSidebar(false);
    };
  }, [activeDragType, setIsOutsideSidebar]);

  useEffect(() => {
    isSplitDropActiveRef.current = splitDropTarget !== null;
    freezeSidebarDnDRef.current
      = activeDragTypeRef.current === 'note'
        && (isSplitDropActiveRef.current || horizontalIntentRef.current);
  }, [activeDragType, splitDropTarget]);

  const isSidebarFrozen
    = activeDragType === 'note'
      && (splitDropTarget !== null || hasHorizontalIntent);

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-border/40"
      style={{
        top: 0,
        height: '100vh',
      }}
    >
      <SidebarHeader
        className="px-3 pb-0"
        style={{ paddingTop: `calc(${layout.titlebarHeight}px + 0.5rem)` }}
      >
        <SidebarActionStrip />
      </SidebarHeader>

      <SidebarContent
        className="overflow-x-hidden pl-2 pr-1 pb-4"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div ref={sidebarContentRef} className="flex flex-col">
          <DndContext
            sensors={sensors}
            autoScroll={false}
            collisionDetection={collisionDetection}
            modifiers={[conditionalVerticalRestriction]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            onDragOver={handleDragOver}
          >
            <SortableContext
              items={groups.map(g => g.id)}
              strategy={conditionalSortingStrategy}
            >
              {groups.map(group => (
                <SortableGroup
                  key={group.id}
                  group={group}
                  activeNoteId={activeNoteId}
                  isDragSelected={draggingGroupId === group.id}
                  showDropBackground={!isDraggingGroup}
                  activeDragId={activeDragId}
                  isSidebarFrozen={isSidebarFrozen}
                  onNoteSelect={(noteId) => {
                    openNote(noteId);
                  }}
                  onToggleCollapse={() => toggleGroupCollapse(group.id)}
                  onAddNote={() => {
                    const id = addNote(group.id);
                    openNote(id);

                    navigate({ to: '/notes' });
                  }}
                  activeDragType={activeDragType}
                  sortingStrategy={conditionalSortingStrategy}
                />
              ))}
            </SortableContext>
            <GroupsEndDropZone isVisible={activeDragType === 'group'} />

            {!isSidebarFrozen && (
              <DragOverlay dropAnimation={null}>
                <SidebarDragOverlay
                  noteId={activeDragId}
                  isNoteDrag={activeDragType === 'note'}
                />
              </DragOverlay>
            )}
          </DndContext>
        </div>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

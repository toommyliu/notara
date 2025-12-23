import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { WheelEvent, CSSProperties } from "react";
import {
    DndContext,
    DragOverlay,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "~/ui/dropdown-menu";
import { HeaderTabItem } from "./header-tab-item";
import { SplitTabItem } from "./split-tab-item";

import IconX from "~icons/lucide/x";
import IconPlus from "~icons/lucide/plus";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconColumns from "~icons/lucide/columns-2";
import IconArrowLeftRight from "~icons/lucide/arrow-left-right";

import { useTabsStore } from "~/stores/tabs-store";
import { useNotesStore } from "~/stores/notes-store";
import { useSplitViewStore, useIsSplitView } from "~/stores/split-view-store";
import { useDragContext } from "~/contexts/drag-context";

import { cn } from "~/lib/utils";

import type { HeaderTabItemHandle } from "./types";

export function HeaderTabs() {
    const { pinnedTabs, openTabs, activeTabId, setActiveTab, closeTab, reorderTabs, isTabBarVisible, tabGroups, removeFromGroup } = useTabsStore();
    const { notes, groups, addNote } = useNotesStore();
    const { swapPanes } = useSplitViewStore();
    const isSplitView = useIsSplitView();
    const dragContext = useDragContext();
    const navigate = useNavigate();

    const [activeDragId, setActiveDragId] = useState<string | null>(null);

    const tabRefs = useRef<Map<string, HeaderTabItemHandle>>(new Map());

    const getGroupForTab = (noteId: string) => tabGroups.find(g => g.includes(noteId));

    const processTabs = (tabIds: string[]) => {
        const processed: string[] = [];
        const seenInGroup = new Set<string>();

        for (const id of tabIds) {
            if (seenInGroup.has(id)) continue;

            const group = getGroupForTab(id);
            if (group) {
                processed.push(id);
                group.forEach(gid => seenInGroup.add(gid));
            } else {
                processed.push(id);
            }
        }
        return processed;
    };

    const visiblePinned = processTabs(pinnedTabs);

    const processedInPinned = new Set<string>();
    visiblePinned.forEach(id => {
        const group = getGroupForTab(id);
        if (group) {
            group.forEach(gid => processedInPinned.add(gid));
        } else {
            processedInPinned.add(id);
        }
    });

    const visibleOpen = processTabs(openTabs.filter(id => !processedInPinned.has(id)));
    const allVisibleTabs = [...visiblePinned, ...visibleOpen];

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftFade, setShowLeftFade] = useState(false);
    const [showRightFade, setShowRightFade] = useState(false);

    const updateFades = useCallback(() => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setShowLeftFade(scrollLeft > 10);
            setShowRightFade(scrollLeft + clientWidth < scrollWidth - 10);
        }
    }, [allVisibleTabs.length]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            updateFades();
            window.addEventListener("resize", updateFades);
            return () => window.removeEventListener("resize", updateFades);
        }
    }, [updateFades, allVisibleTabs.length]);

    const handleDragStart = (ev: DragStartEvent) => {
        const noteId = ev.active.id as string;
        setActiveDragId(noteId);
        dragContext?.startDrag(noteId, "tabs");
    };

    const handleDragEnd = (ev: DragEndEvent) => {
        const { active, over } = ev;
        setActiveDragId(null);

        dragContext?.endDrag();

        if (!over || active.id === over.id) return;

        const activeSection = active.data.current?.section as "pinned" | "open";
        const overSection = over.data.current?.section as "pinned" | "open";

        if (activeSection === overSection) {
            reorderTabs(active.id as string, over.id as string, activeSection);
        }
    };

    const handleDragCancel = () => {
        setActiveDragId(null);
        dragContext?.endDrag();
    };

    const handleNewTab = () => {
        const firstGroup = groups[0];
        if (firstGroup) {
            const newNoteId = addNote(firstGroup.id, "Untitled", "📄");
            setActiveTab(newNoteId);
            navigate({ to: "/notes" });
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

    const handleCloseSplit = () => {
        if (!activeTabId)
            return;

        removeFromGroup(activeTabId);
    };

    if (!isTabBarVisible) return null;

    const hasTabs = pinnedTabs.length > 0 || openTabs.length > 0;
    if (!hasTabs) return null;

    const draggedNote = activeDragId ? notes.get(activeDragId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div
                className="relative flex items-center min-w-0 flex-1 group/tabs outline-none"
                role="tablist"
                aria-orientation="horizontal"
            >
                <div
                    ref={scrollContainerRef}
                    className="flex items-center gap-1 min-w-0 overflow-x-auto overflow-y-hidden scrollbar-none pb-2 -mb-2 pl-1.5"
                    style={{
                        WebkitAppRegion: "no-drag",
                        overscrollBehavior: "contain",
                        maskImage: `linear-gradient(to right, 
                            ${showLeftFade ? 'transparent' : 'black'} 0px, 
                            black 40px, 
                            black calc(100% - 40px), 
                            ${showRightFade ? 'transparent' : 'black'} 100%)`,
                        WebkitMaskImage: `linear-gradient(to right, 
                            ${showLeftFade ? 'transparent' : 'black'} 0px, 
                            black 40px, 
                            black calc(100% - 40px), 
                            ${showRightFade ? 'transparent' : 'black'} 100%)`
                    } as CSSProperties}
                    onWheel={handleWheel}
                    onScroll={handleScroll}
                >
                    <SortableContext items={allVisibleTabs} strategy={horizontalListSortingStrategy}>
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
                                        isActive={group.includes(activeTabId || "")}
                                        isPinned={true}
                                        noteIds={group}
                                        onActivatePane={(id) => {
                                            setActiveTab(id);
                                            navigate({ to: "/notes" });
                                        }}
                                        onActivate={() => setActiveTab(noteId)}
                                        onClose={() => closeTab(noteId)}
                                        onClosePane={(id) => removeFromGroup(id)}
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
                                        navigate({ to: "/notes" });
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
                                        isActive={group.includes(activeTabId || "")}
                                        isPinned={false}
                                        noteIds={group}
                                        onActivatePane={(id) => {
                                            setActiveTab(id);
                                            navigate({ to: "/notes" });
                                        }}
                                        onActivate={() => setActiveTab(noteId)}
                                        onClose={() => closeTab(noteId)}
                                        onClosePane={(id) => removeFromGroup(id)}
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
                                        navigate({ to: "/notes" });
                                    }}
                                    onClose={() => closeTab(noteId)}
                                />
                            );
                        })}
                    </SortableContext>
                </div>

                <div className="flex items-center gap-0.5 ml-1 shrink-0 px-1 py-0.5 relative z-20">
                    {isSplitView && (
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                className={cn(
                                    "p-1 rounded-md transition-colors outline-none mr-1",
                                    "text-muted-foreground/60 hover:text-foreground hover:bg-muted/40",
                                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                                )}
                                aria-label="Split options"
                            >
                                <IconColumns className="size-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" sideOffset={8} className="w-48">
                                <DropdownMenuItem onClick={() => swapPanes()}>
                                    <IconArrowLeftRight className="size-3.5 mr-2" />
                                    Swap Panes
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleCloseSplit}>
                                    <IconX className="size-3.5 mr-2" />
                                    Close Split View
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger
                            className={cn(
                                "p-1 rounded-md transition-colors outline-none",
                                "text-muted-foreground/60 hover:text-foreground hover:bg-muted/40",
                                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                            )}
                            aria-label="All tabs"
                        >
                            <IconChevronDown className="size-3.5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={8} className="w-48">
                            {pinnedTabs.map((noteId) => {
                                const note = notes.get(noteId);
                                if (!note) return null;
                                return (
                                    <DropdownMenuItem key={noteId} onClick={() => {
                                        setActiveTab(noteId);
                                        navigate({ to: "/notes" });
                                    }}>
                                        <span className="mr-2 text-xs">{note.emoji}</span>
                                        <span className="truncate">{note.title}</span>
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <button
                        onClick={handleNewTab}
                        className={cn(
                            "p-1 rounded-md transition-colors outline-none",
                            "text-muted-foreground/60 hover:text-foreground hover:bg-muted/40",
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                        )}
                        aria-label="New tab"
                    >
                        <IconPlus className="size-3.5" />
                    </button>
                </div>
            </div>

            <DragOverlay dropAnimation={null}>
                {draggedNote && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-background border rounded-md shadow-lg text-sm">
                        <span>{draggedNote.emoji}</span>
                        <span className="font-medium">{draggedNote.title}</span>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}

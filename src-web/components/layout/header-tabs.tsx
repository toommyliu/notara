import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { WheelEvent, RefObject, CSSProperties } from "react";
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
import {
    SortableContext,
    useSortable,
    horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";

import IconX from "~icons/lucide/x";
import IconPlus from "~icons/lucide/plus";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconColumns from "~icons/lucide/columns-2";
import IconArrowLeftRight from "~icons/lucide/arrow-left-right";

import { useTabsStore } from "~/stores/tabs-store";
import { useNotesStore } from "~/stores/notes-store";
import { useSplitViewStore, useIsSplitView, type Pane } from "~/stores/split-view-store";
import { useDragContext } from "~/contexts/drag-context";

import { cn } from "~/lib/utils";

export type HeaderTabItemHandle = {
    focus: () => void;
};

type HeaderTabItemProps = {
    noteId: string;
    isActive: boolean;
    isPinned: boolean;
    onActivate: () => void;
    onClose: () => void;
    compact?: boolean;
};

const HeaderTabItem = forwardRef<HeaderTabItemHandle, HeaderTabItemProps>(
    function HeaderTabItem({ noteId, isActive, isPinned, onActivate, onClose, compact }, ref) {
        const { notes } = useNotesStore();
        const note = notes.get(noteId);
        const tabRef = useRef<HTMLDivElement>(null);
        const buttonRef = useRef<HTMLButtonElement>(null);

        useImperativeHandle(ref, () => ({
            focus: () => buttonRef.current?.focus(),
        }));

        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({
            id: noteId,
            data: { section: isPinned ? "pinned" : "open" },
        });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
        };

        useEffect(() => {
            if (isActive && tabRef.current) {
                tabRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            }
        }, [isActive]);

        if (!note) return null;

        return (
            <div
                ref={(node) => {
                    setNodeRef(node);
                    (tabRef as RefObject<HTMLDivElement | null>).current = node;
                }}
                style={style}
                aria-selected={isActive}
                className={cn(
                    "group relative flex items-center gap-1.5 px-3 py-1 select-none shrink-0 rounded-md outline-none",
                    "transition-all duration-150 ease-out cursor-pointer",
                    compact && "px-2",
                    isActive
                        ? "text-foreground bg-background ring-1 ring-border/50"
                        : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/40",
                    isDragging && "opacity-50",
                )}
                {...attributes}
                {...listeners}
                role="tab"
                tabIndex={-1}
            >
                <button
                    ref={buttonRef}
                    onClick={onActivate}
                    tabIndex={0}
                    className={cn(
                        "absolute inset-0 z-0 rounded-md",
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    )}
                    aria-label={`Open ${note.title}`}
                />

                <span className="text-sm shrink-0 relative z-10 pointer-events-none">
                    {note.emoji}
                </span>

                <span className={cn(
                    "text-[13px] font-medium relative z-10 pointer-events-none truncate",
                    compact ? "max-w-[60px]" : "max-w-[100px]"
                )}>
                    {note.title}
                </span>

                <button
                    onClick={(ev) => {
                        ev.stopPropagation();
                        onClose();
                    }}
                    tabIndex={-1}
                    className={cn(
                        "relative z-10 p-0.5 rounded-sm transition-all",
                        "opacity-0 group-hover:opacity-100",
                        "text-muted-foreground/60 hover:text-foreground hover:bg-background/80",
                        "focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none"
                    )}
                    aria-label="Close tab"
                >
                    <IconX className="size-3" />
                </button>
            </div>
        );
    }
);

type SplitTabItemProps = HeaderTabItemProps & {
    panes: Pane[];
    activePaneId: string;
    onSwap: () => void;
    onCloseSplit: () => void;
    onActivatePane: (paneId: string) => void;
};

const SplitTabItem = forwardRef<HeaderTabItemHandle, SplitTabItemProps>(
    function SplitTabItem({ noteId, isActive, isPinned, panes, activePaneId, onActivatePane }, ref) {
        const { notes } = useNotesStore();
        const tabRef = useRef<HTMLDivElement>(null);
        const navigate = useNavigate();

        useImperativeHandle(ref, () => ({
            focus: () => {
                tabRef.current?.focus();
            },
        }));

        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({
            id: noteId,
            data: { section: isPinned ? "pinned" : "open" },
        });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
        };

        useEffect(() => {
            if (isActive && tabRef.current) {
                tabRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            }
        }, [isActive]);

        return (
            <div
                ref={(node) => {
                    setNodeRef(node);
                    (tabRef as RefObject<HTMLDivElement | null>).current = node;
                }}
                style={style}
                className={cn(
                    "group relative flex items-center select-none shrink-0 rounded-md outline-none border border-border/50",
                    "transition-all duration-150 ease-out bg-background/50",
                    isDragging && "opacity-50"
                )}
                {...attributes}
                {...listeners}
            >
                {panes.map((pane, index) => {
                    const note = pane.noteId ? notes.get(pane.noteId) : null;
                    const isPaneActive = pane.id === activePaneId;

                    return (
                        <div key={pane.id} className="flex items-center">
                            {index > 0 && <div className="w-px h-3 bg-border" />}

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onActivatePane(pane.id);
                                    navigate({ to: "/notes" });
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 transition-colors hover:bg-muted/50",
                                    isPaneActive && "bg-muted/30 font-medium"
                                )}
                            >
                                <span className="text-sm shrink-0">{note?.emoji}</span>
                                <span className="text-[13px] truncate max-w-[80px]">{note?.title}</span>
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    }
);

export function HeaderTabs() {
    const { pinnedTabs, openTabs, activeTabId, setActiveTab, closeTab, reorderTabs, isTabBarVisible } = useTabsStore();
    const { notes, groups, addNote } = useNotesStore();
    const { panes, activePaneId, setActivePane, removePane, swapPanes } = useSplitViewStore();
    const isSplitView = useIsSplitView();
    const dragContext = useDragContext();
    const navigate = useNavigate();

    const [activeDragId, setActiveDragId] = useState<string | null>(null);

    const tabRefs = useRef<Map<string, HeaderTabItemHandle>>(new Map());

    const splitNoteIds = isSplitView ? new Set(panes.map(p => p.noteId).filter(Boolean) as string[]) : new Set<string>();

    const processTabs = (tabIds: string[]) => {
        if (!isSplitView) return tabIds;

        const processed: string[] = [];
        let splitFound = false;

        for (const id of tabIds) {
            if (splitNoteIds.has(id)) {
                if (!splitFound) {
                    processed.push(id);
                    splitFound = true;
                }
            } else {
                processed.push(id);
            }
        }
        return processed;
    };

    const visiblePinned = processTabs(pinnedTabs);
    const splitInPinned = visiblePinned.some(id => splitNoteIds.has(id));

    const visibleOpen = openTabs.filter(id => {
        if (splitInPinned && splitNoteIds.has(id)) return false;
        return true;
    });

    const finalVisibleOpen = splitInPinned ? visibleOpen : processTabs(visibleOpen);
    const allVisibleTabs = [...visiblePinned, ...finalVisibleOpen];

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
        // Close the non-active pane
        const toKeep = panes.find(p => p.id === activePaneId) || panes[0];
        const others = panes.filter(p => p.id !== toKeep.id);
        others.forEach(p => removePane(p.id));
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
                    className="flex items-center gap-0.5 min-w-0 overflow-x-auto overflow-y-hidden scrollbar-none pb-2 -mb-2 pl-1.5"
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
                            if (isSplitView && splitNoteIds.has(noteId)) {
                                return (
                                    <SplitTabItem
                                        key={noteId}
                                        noteId={noteId}
                                        isActive={splitNoteIds.has(activeTabId || "")}
                                        isPinned={true}
                                        panes={panes}
                                        activePaneId={activePaneId}
                                        onActivate={() => setActiveTab(noteId)}
                                        onClose={() => closeTab(noteId)}
                                        onSwap={swapPanes}
                                        onCloseSplit={handleCloseSplit}
                                        onActivatePane={setActivePane}
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

                        {visiblePinned.length > 0 && finalVisibleOpen.length > 0 && (
                            <div className="w-px h-3.5 mx-1 shrink-0 bg-border/60" />
                        )}

                        {finalVisibleOpen.map((noteId) => {
                            if (isSplitView && splitNoteIds.has(noteId)) {
                                return (
                                    <SplitTabItem
                                        key={noteId}
                                        noteId={noteId}
                                        isActive={splitNoteIds.has(activeTabId || "")}
                                        isPinned={false}
                                        panes={panes}
                                        activePaneId={activePaneId}
                                        onActivate={() => setActiveTab(noteId)}
                                        onClose={() => closeTab(noteId)}
                                        onSwap={swapPanes}
                                        onCloseSplit={handleCloseSplit}
                                        onActivatePane={setActivePane}
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

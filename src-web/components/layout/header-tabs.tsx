import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
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
} from "~/components/ui/dropdown-menu";

import IconX from "~icons/lucide/x";
import IconPlus from "~icons/lucide/plus";
import IconChevronDown from "~icons/lucide/chevron-down";

import { useTabs } from "~/hooks/use-tabs";
import { useNotes } from "~/hooks/use-notes";

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
};

const HeaderTabItem = forwardRef<HeaderTabItemHandle, HeaderTabItemProps>(
    function HeaderTabItem({ noteId, isActive, isPinned, onActivate, onClose }, ref) {
        const { notes } = useNotes();
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

        // Scroll active tab into view
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
                role="tab"
                aria-selected={isActive}
                className={cn(
                    "group relative flex items-center gap-1.5 px-3 py-1 select-none shrink-0 rounded-md outline-none",
                    "transition-all duration-150 ease-out cursor-pointer",
                    isActive
                        ? "text-foreground bg-muted/60"
                        : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/30",
                    isDragging && "opacity-50",
                )}
                {...attributes}
                {...listeners}
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

                <span className="text-[13px] font-medium relative z-10 pointer-events-none max-w-[100px] truncate">
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

export function HeaderTabs() {
    const { pinnedTabs, openTabs, activeTabId, setActiveTab, closeTab, reorderTabs, isTabBarVisible } = useTabs();
    const { notes, groups, addNote } = useNotes();
    const [activeDragId, setActiveDragId] = useState<string | null>(null);

    const tabRefs = useRef<Map<string, HeaderTabItemHandle>>(new Map());

    const allTabs = [...pinnedTabs, ...openTabs];

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
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            updateFades();
            window.addEventListener("resize", updateFades);
            return () => window.removeEventListener("resize", updateFades);
        }
    }, [updateFades, pinnedTabs.length, openTabs.length]);

    const handleDragStart = (ev: DragStartEvent) => {
        setActiveDragId(ev.active.id as string);
    };

    const handleDragEnd = (ev: DragEndEvent) => {
        const { active, over } = ev;
        setActiveDragId(null);

        if (!over || active.id === over.id) return;

        const activeSection = active.data.current?.section as "pinned" | "open";
        const overSection = over.data.current?.section as "pinned" | "open";

        if (activeSection === overSection) {
            reorderTabs(active.id as string, over.id as string, activeSection);
        }
    };

    const handleNewTab = () => {
        // Add note to the first group
        const firstGroup = groups[0];
        if (firstGroup) {
            const newNoteId = addNote(firstGroup.id, "Untitled", "📄");
            setActiveTab(newNoteId);
        }
    };

    // Convert vertical wheel scroll to horizontal scroll for mouse users
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
            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div
                className="relative flex items-center min-w-0 flex-1 group/tabs outline-none"
                role="tablist"
                aria-orientation="horizontal"
            >
                <div
                    ref={scrollContainerRef}
                    className="flex items-center gap-0.5 min-w-0 overflow-x-auto overflow-y-hidden scrollbar-none pb-2 -mb-2"
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
                    <SortableContext items={allTabs} strategy={horizontalListSortingStrategy}>
                        {pinnedTabs.map((noteId) => (
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
                                onActivate={() => setActiveTab(noteId)}
                                onClose={() => closeTab(noteId)}
                            />
                        ))}

                        {pinnedTabs.length > 0 && openTabs.length > 0 && (
                            <div className="w-px h-3.5 mx-1 shrink-0 bg-border/60" />
                        )}

                        {openTabs.map((noteId) => (
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
                                isPinned={false}
                                onActivate={() => setActiveTab(noteId)}
                                onClose={() => closeTab(noteId)}
                            />
                        ))}
                    </SortableContext>
                </div>

                <div className="flex items-center gap-0.5 ml-1 shrink-0 px-1 py-0.5 relative z-20">
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
                                    <DropdownMenuItem
                                        key={noteId}
                                        onClick={() => setActiveTab(noteId)}
                                        className={cn(activeTabId === noteId && "bg-muted font-medium")}
                                    >
                                        <span className="mr-2 text-xs">{note.emoji}</span>
                                        <span className="truncate">{note.title}</span>
                                        <span className="ml-auto text-[10px] text-muted-foreground opacity-50">Pinned</span>
                                    </DropdownMenuItem>
                                );
                            })}
                            {pinnedTabs.length > 0 && openTabs.length > 0 && <div className="h-px bg-border my-1" />}
                            {openTabs.map((noteId) => {
                                const note = notes.get(noteId);
                                if (!note) return null;
                                return (
                                    <DropdownMenuItem
                                        key={noteId}
                                        onClick={() => setActiveTab(noteId)}
                                        className={cn(activeTabId === noteId && "bg-muted font-medium")}
                                    >
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

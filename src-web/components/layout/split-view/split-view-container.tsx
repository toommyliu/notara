import type { ReactNode } from "react";
import { useState, useRef, useCallback } from "react";
import { Group, Panel, Separator, type GroupImperativeHandle, type Layout } from "react-resizable-panels";

import { SplitDropZone } from "./split-drop-zone";

import { useSplitViewStore, type Pane } from "~/stores/split-view-store";
import { useHaptics, HapticFeedbackPattern } from "~/hooks/use-haptics";
import { useDragContext } from "~/contexts/drag-context";
import { useNotesStore, type Note } from "~/stores/notes-store";
import { useTabsStore } from "~/stores/tabs-store";

import { cn } from "~/lib/utils";

type SplitViewContainerProps = {
    renderPane: (pane: Pane, isActive: boolean) => ReactNode;
    renderPreview?: (note: Note) => ReactNode;
    contentPadding?: number;
};

const SNAP_THRESHOLD = 5; // Snap when within 5% of 50%
const ESCAPE_THRESHOLD = 8; // Must drag past 8% to escape snap

export function SplitViewContainer({ renderPane, renderPreview, contentPadding }: SplitViewContainerProps) {
    const { activeTabId, setActiveTab } = useTabsStore();
    const { panes, activePaneId, setActivePane, orientation } = useSplitViewStore();
    const [hoverSide, setHoverSide] = useState<"left" | "right" | "top" | "bottom" | null>(null);
    const groupRef = useRef<GroupImperativeHandle>(null);
    const isSnappedRef = useRef(false);
    const { perform } = useHaptics();

    const dragContext = useDragContext();
    const { notes } = useNotesStore();

    const draggedNote = dragContext?.isDragging && dragContext.draggedNoteId
        ? notes.get(dragContext.draggedNoteId) ?? null
        : null;

    const triggerHaptic = useCallback(() => {
        perform(HapticFeedbackPattern.Generic);
    }, [perform]);

    const handleLayoutChange = useCallback((layout: Layout) => {
        const panelIds = Object.keys(layout);
        if (panelIds.length !== 2 || panes.length !== 2) return;

        const [pane1Id, pane2Id] = panelIds;
        const firstSize = layout[pane1Id];
        const diff = Math.abs(firstSize - 50);

        if (isSnappedRef.current) {
            // Already snapped - only escape if dragged past escape threshold
            if (diff > ESCAPE_THRESHOLD) {
                isSnappedRef.current = false;
            } else if (diff > 0.1) {
                // Keep it locked at center
                groupRef.current?.setLayout({ [pane1Id]: 50, [pane2Id]: 50 });
            }
        } else {
            // Not snapped - check if we should snap
            if (diff > 0.5 && diff < SNAP_THRESHOLD) {
                isSnappedRef.current = true;
                groupRef.current?.setLayout({ [pane1Id]: 50, [pane2Id]: 50 });
                triggerHaptic();
            }
        }
    }, [panes, triggerHaptic]);
    // Determine preview orientation based on hover side
    const isVerticalPreview = hoverSide === "top" || hoverSide === "bottom";

    // Get the current note for the split preview
    const activePane = panes.find(p => p.id === activePaneId);
    const currentNote = activePane?.noteId ? notes.get(activePane.noteId) ?? null : null;

    return (
        <div className="relative flex-1 min-h-0 flex overflow-hidden">
            {/* Existing content - stays stationary */}
            <div className={cn(
                "absolute inset-0 flex flex-col",
                "transition-opacity duration-200 ease-out",
                hoverSide ? "opacity-0" : "opacity-100"
            )}>
                <Group
                    groupRef={groupRef}
                    orientation={orientation}
                    className="flex-1"
                    onLayoutChange={handleLayoutChange}
                >
                    {panes.map((pane, index) => (
                        <SplitPane
                            key={pane.id}
                            pane={pane}
                            isActive={pane.id === activePaneId}
                            isFirst={index === 0}
                            paneCount={panes.length}
                            orientation={orientation}
                            isPreviewingSplit={hoverSide !== null}
                            onActivate={() => {
                                if (activePaneId !== pane.id) {
                                    setActivePane(pane.id);
                                }

                                if (pane.noteId && activeTabId !== pane.noteId) {
                                    setActiveTab(pane.noteId);
                                }
                            }}
                        >
                            {renderPane(pane, pane.id === activePaneId)}
                        </SplitPane>
                    ))}
                </Group>
            </div>

            {/* Full split preview - shows both notes side by side */}
            <div
                className={cn(
                    "absolute inset-0 z-10 pointer-events-none flex gap-1 p-0.5",
                    "transition-opacity duration-200 ease-out",
                    isVerticalPreview ? "flex-col" : "flex-row",
                    hoverSide ? "opacity-100" : "opacity-0"
                )}
            >
                {/* First pane - dragged note if left/top, current note if right/bottom */}
                <div className="flex-1 min-w-0 min-h-0">
                    {hoverSide && (hoverSide === "left" || hoverSide === "top") && draggedNote && (
                        <NotePreview
                            note={draggedNote}
                            orientation={isVerticalPreview ? "vertical" : "horizontal"}
                            renderPreview={renderPreview}
                        />
                    )}
                    {hoverSide && (hoverSide === "right" || hoverSide === "bottom") && currentNote && (
                        <NotePreview
                            note={currentNote}
                            orientation={isVerticalPreview ? "vertical" : "horizontal"}
                            renderPreview={renderPreview}
                        />
                    )}
                </div>

                {/* Second pane - current note if left/top, dragged note if right/bottom */}
                <div className="flex-1 min-w-0 min-h-0">
                    {hoverSide && (hoverSide === "left" || hoverSide === "top") && currentNote && (
                        <NotePreview
                            note={currentNote}
                            orientation={isVerticalPreview ? "vertical" : "horizontal"}
                            renderPreview={renderPreview}
                        />
                    )}
                    {hoverSide && (hoverSide === "right" || hoverSide === "bottom") && draggedNote && (
                        <NotePreview
                            note={draggedNote}
                            orientation={isVerticalPreview ? "vertical" : "horizontal"}
                            renderPreview={renderPreview}
                        />
                    )}
                </div>
            </div>

            <SplitDropZone
                position="left"
                contentPadding={contentPadding}
                anchorNoteId={activeTabId || undefined}
                onHoverChange={(isHovering) => setHoverSide(isHovering ? "left" : null)}
            />
            <SplitDropZone
                position="right"
                contentPadding={contentPadding}
                anchorNoteId={activeTabId || undefined}
                onHoverChange={(isHovering) => setHoverSide(isHovering ? "right" : null)}
            />
            <SplitDropZone
                position="top"
                contentPadding={contentPadding}
                anchorNoteId={activeTabId || undefined}
                onHoverChange={(isHovering) => setHoverSide(isHovering ? "top" : null)}
            />
            <SplitDropZone
                position="bottom"
                contentPadding={contentPadding}
                anchorNoteId={activeTabId || undefined}
                onHoverChange={(isHovering) => setHoverSide(isHovering ? "bottom" : null)}
            />
        </div>
    );
}

type NotePreviewProps = {
    note: Note;
    orientation: "horizontal" | "vertical";
    renderPreview?: (note: Note) => ReactNode;
};

function NotePreview({ note, orientation, renderPreview }: NotePreviewProps) {
    if (renderPreview) {
        return (
            <div className="h-full w-full p-0.5">
                <div
                    className={cn(
                        "h-full w-full overflow-hidden",
                        "rounded-xl border shadow-sm bg-background",
                        "pointer-events-none"
                    )}
                >
                    {renderPreview(note)}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full p-0.5">
            <div
                className={cn(
                    "h-full w-full overflow-hidden",
                    "rounded-xl border shadow-sm bg-background"
                )}
            >
                <div className="absolute inset-0 bg-background/30 z-10 rounded-xl pointer-events-none" />

                <div className="relative h-full flex flex-col items-center overflow-y-auto scrollbar-none">
                    <div className={cn(
                        "w-full max-w-3xl px-12",
                        orientation === "vertical" ? "py-8" : "py-16"
                    )}>
                        <div className={cn(
                            "flex justify-start",
                            orientation === "vertical" ? "mb-2" : "mb-4"
                        )}>
                            <span className={cn(
                                "opacity-80",
                                orientation === "vertical" ? "text-5xl" : "text-7xl"
                            )}>{note.emoji}</span>
                        </div>

                        <h1 className={cn(
                            "font-bold mb-4 leading-tight text-foreground/70",
                            orientation === "vertical" ? "text-2xl" : "text-4xl"
                        )}>
                            {note.title || "Untitled"}
                        </h1>
                        {note.content && note.content.length > 0 && (
                            <div className="space-y-2 text-muted-foreground/60">
                                {note.content.slice(0, orientation === "vertical" ? 3 : 5).map((block) => (
                                    <p key={block.id} className={cn(
                                        "leading-relaxed",
                                        orientation === "vertical" ? "text-sm" : "text-base"
                                    )}>
                                        {block.content || "\u00A0"}
                                    </p>
                                ))}
                                {note.content.length > (orientation === "vertical" ? 3 : 5) && (
                                    <p className="text-sm italic">
                                        +{note.content.length - (orientation === "vertical" ? 3 : 5)} more blocks...
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

type SplitPaneProps = {
    pane: Pane;
    isActive: boolean;
    isFirst: boolean;
    paneCount: number;
    orientation: "horizontal" | "vertical";
    isPreviewingSplit?: boolean;
    onActivate: () => void;
    children: ReactNode;
};

function SplitPane({ pane, isActive, isFirst, paneCount, orientation, isPreviewingSplit, onActivate, children }: SplitPaneProps) {
    const isSplit = paneCount > 1;
    const showFrame = isSplit || isPreviewingSplit;

    return (
        <>
            {!isFirst && (
                <Separator className={cn(
                    "split-divider group z-10",
                    orientation === "horizontal" ? "w-1 h-full" : "h-1 w-full"
                )}>
                    <div className="w-full h-full flex items-center justify-center">
                        <div className={cn(
                            "rounded-full bg-border/50 group-hover:bg-border group-data-[resize-handle-state=drag]:bg-primary transition-colors",
                            orientation === "horizontal" ? "w-0.5 h-8" : "h-0.5 w-8"
                        )} />
                    </div>
                </Separator>
            )}
            <Panel
                id={pane.id}
                minSize={20}
                defaultSize={100 / paneCount}
                className={cn(
                    "relative flex flex-col",
                    // Horizontal split: vertical padding always
                    showFrame && orientation === "horizontal" && "py-1",
                    showFrame && orientation === "horizontal" && isFirst && "pl-1",
                    showFrame && orientation === "horizontal" && !isFirst && paneCount === 2 && "pr-1",
                    // Vertical split: horizontal padding always
                    showFrame && orientation === "vertical" && "px-1",
                    showFrame && orientation === "vertical" && isFirst && "pt-1",
                    showFrame && orientation === "vertical" && !isFirst && paneCount === 2 && "pb-1"
                )}
            >
                <div
                    className={cn(
                        "h-full w-full flex flex-col overflow-hidden bg-background",
                        // Only transition specific properties for frame appearance
                        "transition-[border-radius,border-color,box-shadow] duration-200 ease-out",
                        showFrame
                            ? "rounded-xl border shadow-sm"
                            : "",
                        showFrame && isActive && "ring-1 ring-inset ring-primary/20 border-primary/20",
                        showFrame && !isActive && "after:absolute after:inset-0 after:bg-background/5 after:pointer-events-none"
                    )}
                    onClickCapture={onActivate}
                >
                    {children}
                </div>
            </Panel>
        </>
    );
}

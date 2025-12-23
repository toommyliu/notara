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
    const { activeTabId } = useTabsStore();
    const { panes, activePaneId, setActivePane } = useSplitViewStore();
    const [hoverSide, setHoverSide] = useState<"left" | "right" | null>(null);
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
        const leftSize = layout[pane1Id];
        const diff = Math.abs(leftSize - 50);

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

    return (
        <div className="relative flex-1 min-h-0 flex overflow-hidden">
            <div
                className={cn(
                    "transition-[width] duration-300 ease-out bg-transparent shrink-0 overflow-hidden",
                    hoverSide === "left" ? "w-1/2" : "w-0"
                )}
            >
                {hoverSide === "left" && draggedNote && (
                    <NotePreview note={draggedNote} renderPreview={renderPreview} />
                )}
            </div>

            <div className="flex-1 flex min-w-0">
                <Group
                    groupRef={groupRef}
                    orientation="horizontal"
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
                            isPreviewingSplit={hoverSide !== null}
                            onActivate={() => setActivePane(pane.id)}
                        >
                            {renderPane(pane, pane.id === activePaneId)}
                        </SplitPane>
                    ))}
                </Group>
            </div>

            {/* Right preview area */}
            <div
                className={cn(
                    "transition-[width] duration-300 ease-out bg-transparent shrink-0 overflow-hidden",
                    hoverSide === "right" ? "w-1/2" : "w-0"
                )}
            >
                {hoverSide === "right" && draggedNote && (
                    <NotePreview note={draggedNote} renderPreview={renderPreview} />
                )}
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
        </div>
    );
}

type NotePreviewProps = {
    note: Note;
    renderPreview?: (note: Note) => ReactNode;
};

function NotePreview({ note, renderPreview }: NotePreviewProps) {
    if (renderPreview) {
        return (
            <div className="h-full w-full p-1">
                <div
                    className={cn(
                        "h-full w-full overflow-hidden",
                        "rounded-xl border shadow-sm bg-background",
                        "opacity-70 pointer-events-none",
                        "animate-in fade-in-0 duration-200"
                    )}
                >
                    {renderPreview(note)}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full p-1">
            <div
                className={cn(
                    "h-full w-full overflow-hidden",
                    "rounded-xl border shadow-sm bg-background",
                    "animate-in fade-in-0 duration-200"
                )}
            >
                <div className="absolute inset-0 bg-background/30 z-10 rounded-xl pointer-events-none" />

                <div className="relative h-full flex flex-col items-center overflow-y-auto scrollbar-custom">
                    <div className="w-full max-w-3xl py-16 px-12">
                        <div className="flex justify-start mb-4">
                            <span className="text-7xl opacity-80">{note.emoji}</span>
                        </div>

                        <h1 className="text-4xl font-bold mb-4 leading-tight text-foreground/70">
                            {note.title || "Untitled"}
                        </h1>
                        {note.content && note.content.length > 0 && (
                            <div className="space-y-2 text-muted-foreground/60">
                                {note.content.slice(0, 5).map((block) => (
                                    <p key={block.id} className="text-base leading-relaxed">
                                        {block.content || "\u00A0"}
                                    </p>
                                ))}
                                {note.content.length > 5 && (
                                    <p className="text-sm italic">
                                        +{note.content.length - 5} more blocks...
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
    isPreviewingSplit?: boolean;
    onActivate: () => void;
    children: ReactNode;
};

function SplitPane({ pane, isActive, isFirst, paneCount, isPreviewingSplit, onActivate, children }: SplitPaneProps) {
    const isSplit = paneCount > 1;
    const showFrame = isSplit || isPreviewingSplit;

    return (
        <>
            {!isFirst && (
                <Separator className="split-divider group w-1.5 z-10">
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-0.5 h-8 rounded-full bg-border/50 group-hover:bg-border group-data-[resize-handle-state=drag]:bg-primary transition-colors" />
                    </div>
                </Separator>
            )}
            <Panel
                id={pane.id}
                minSize={20}
                defaultSize={100 / paneCount}
                className={cn(
                    "relative flex flex-col",
                    showFrame && "py-1 first:pl-1 last:pr-1"
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

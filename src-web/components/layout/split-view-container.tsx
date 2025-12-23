import type { ReactNode } from "react";
import { useState, useRef, useCallback } from "react";
import { Group, Panel, Separator, type GroupImperativeHandle, type Layout } from "react-resizable-panels";

import { SplitDropZone } from "./split-drop-zone";

import { useSplitViewStore, type Pane } from "~/stores/split-view-store";
import { useHaptics, HapticFeedbackPattern } from "~/hooks/use-haptics";

import { cn } from "~/lib/utils";

type SplitViewContainerProps = {
    renderPane: (pane: Pane, isActive: boolean) => ReactNode;
    contentPadding?: number;
};

const SNAP_THRESHOLD = 5; // Snap when within 5% of 50%
const ESCAPE_THRESHOLD = 8; // Must drag past 8% to escape snap

export function SplitViewContainer({ renderPane, contentPadding }: SplitViewContainerProps) {
    const { panes, activePaneId, setActivePane } = useSplitViewStore();
    const [hoverSide, setHoverSide] = useState<"left" | "right" | null>(null);
    const groupRef = useRef<GroupImperativeHandle>(null);
    const isSnappedRef = useRef(false);
    const { perform } = useHaptics();

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
            />

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

            <div
                className={cn(
                    "transition-[width] duration-300 ease-out bg-transparent shrink-0 overflow-hidden",
                    hoverSide === "right" ? "w-1/2" : "w-0"
                )}
            />

            <SplitDropZone
                position="left"
                contentPadding={contentPadding}
                onHoverChange={(isHovering) => setHoverSide(isHovering ? "left" : null)}
            />
            <SplitDropZone
                position="right"
                contentPadding={contentPadding}
                onHoverChange={(isHovering) => setHoverSide(isHovering ? "right" : null)}
            />
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

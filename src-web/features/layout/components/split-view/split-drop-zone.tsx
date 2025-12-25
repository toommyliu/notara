import { useEffect, useRef, useState } from "react";
import { useDragContext } from "~/providers/drag-context";
import { useSplitViewStore } from "~/features/layout/stores/split-view-store";
import { useTabsStore } from "~/features/layout/stores/tabs-store";
import { cn } from "~/lib/utils";

type SplitDropZoneProps = {
    position: "left" | "right" | "top" | "bottom" | "center";
    paneId?: string; // Required for position === "center"
    anchorNoteId?: string; // The note to group with if creating a new split
    onHoverChange?: (isHovering: boolean) => void;
    contentPadding?: number; // px
    contentWidth?: number; // max-width px (e.g. 768 for max-w-3xl)
};

export function SplitDropZone({
    position,
    paneId,
    anchorNoteId,
    onHoverChange,
    contentPadding = 48,
    contentWidth = 768
}: SplitDropZoneProps) {
    const dragContext = useDragContext();
    const { panes, addPane, openInPane } = useSplitViewStore();
    const { addToGroup } = useTabsStore();

    const zoneRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        onHoverChange?.(isHovering);
    }, [isHovering, onHoverChange]);

    const draggedNoteIdRef = useRef<string | null>(null);
    const shouldShow = dragContext?.isDragging && (position === "center" || panes.length < 2);

    useEffect(() => {
        if (dragContext?.draggedNoteId) {
            draggedNoteIdRef.current = dragContext.draggedNoteId;
        }
    }, [dragContext?.draggedNoteId]);

    useEffect(() => {
        if (!shouldShow) {
            setIsHovering(false);
            return;
        }

        const handleMouseMove = (ev: MouseEvent) => {
            if (!zoneRef.current) return;

            const rect = zoneRef.current.getBoundingClientRect();
            const isOver = (
                ev.clientX >= rect.left &&
                ev.clientX <= rect.right &&
                ev.clientY >= rect.top &&
                ev.clientY <= rect.bottom
            );
            setIsHovering(isOver);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [shouldShow]);

    useEffect(() => {
        if (!shouldShow) return;

        const handlePointerUp = () => {
            if (isHovering && draggedNoteIdRef.current && dragContext?.isDragging) {
                const noteId = draggedNoteIdRef.current;
                draggedNoteIdRef.current = null;

                if (position === "center" && paneId) {
                    openInPane(paneId, noteId);
                } else if (position !== "center") {
                    if (anchorNoteId) {
                        addToGroup(noteId, anchorNoteId);
                    }
                    addPane(position, noteId);
                }
            }
        };

        window.addEventListener("pointerup", handlePointerUp, { capture: true });
        return () => window.removeEventListener("pointerup", handlePointerUp, { capture: true });
    }, [shouldShow, isHovering, position, addPane, openInPane, paneId, dragContext?.isDragging, anchorNoteId, addToGroup]);

    useEffect(() => {
        if (!dragContext?.isDragging) {
            const timer = setTimeout(() => {
                draggedNoteIdRef.current = null;
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [dragContext?.isDragging]);

    if (!shouldShow) return null;

    // trigger area configuration, w.r.t. to the content width
    const halfContentWidth = contentWidth / 2;
    const triggerWidth = position === "center"
        ? "100%"
        : (position === "left" || position === "right")
            ? `calc(50vw - min(50vw, ${halfContentWidth}px) + ${contentPadding}px)`
            : `calc(50vh - min(50vh, ${halfContentWidth}px) + ${contentPadding}px)`;

    return (
        <>
            <div
                ref={zoneRef}
                className={cn(
                    "absolute z-10 transition-all duration-200",
                    position === "left" && "left-0 top-0 bottom-0",
                    position === "right" && "right-0 top-0 bottom-0",
                    position === "top" && "top-0 left-0 right-0",
                    position === "bottom" && "bottom-0 left-0 right-0",
                    position === "center" && "inset-0",
                    position !== "center" && "z-50" // edges take priority 
                )}
                style={position === "left" || position === "right"
                    ? { width: triggerWidth }
                    : position === "top" || position === "bottom"
                        ? { height: triggerWidth }
                        : undefined
                }
            />

            {/* <div
                className={cn(
                    "absolute z-40 rounded-xl border-2 border-solid border-primary/20 bg-background/80 backdrop-blur-sm shadow-xl",
                    "transition-all duration-300 ease-out",
                    "flex flex-col items-center justify-center gap-3",
                    isHovering ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none",
                    position === "left" && "top-4 bottom-4 left-4 right-[52%]",
                    position === "right" && "top-4 bottom-4 left-[52%] right-4",
                    position === "center" && "inset-4 shadow-centered border-dashed" // Center zone visual
                )}
            >
                <div className="p-3 rounded-full bg-muted shadow-sm ring-1 ring-border/50">
                    {position === "center" ? (
                        <IconMaximize className="size-6 text-primary" />
                    ) : (
                        <IconColumns className="size-6 text-primary" />
                    )}
                </div>
                <span className="text-sm font-medium text-foreground/80">
                    {position === "center" ? "Open in this pane" : "Open in Split View"}
                </span>
            </div> */}
        </>
    );
}

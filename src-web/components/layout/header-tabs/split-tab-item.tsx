import { forwardRef, useRef, useEffect, useImperativeHandle } from "react";
import type { RefObject } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import IconX from "~icons/lucide/x";

import { useNotesStore } from "~/stores/notes-store";
import { useTabsStore } from "~/stores/tabs-store";
import { cn } from "~/lib/utils";
import type { HeaderTabItemHandle, SplitTabItemProps } from "./types";

export const SplitTabItem = forwardRef<HeaderTabItemHandle, SplitTabItemProps>(
    function SplitTabItem({ noteId, isActive, isPinned, noteIds, onActivatePane, onClosePane }, ref) {
        const { notes } = useNotesStore();
        const tabRef = useRef<HTMLDivElement>(null);
        const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
        const { activeTabId } = useTabsStore();

        useImperativeHandle(ref, () => ({
            focus: () => {
                if (activeTabId && buttonRefs.current.has(activeTabId)) {
                    buttonRefs.current.get(activeTabId)?.focus();
                } else if (noteIds.length > 0) {
                    buttonRefs.current.get(noteIds[0])?.focus();
                }
            },
        }));

        const {
            setNodeRef,
            transform,
            transition,
            isDragging,
            attributes,
            listeners,
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
                    "group relative flex items-center select-none shrink-0 rounded-md outline-none",
                    "transition-all duration-150 ease-out",
                    isActive
                        ? "bg-muted/30 ring-1 ring-border/50"
                        : "bg-muted/15",
                    isDragging && "opacity-50"
                )}
                {...attributes}
                {...listeners}
            >
                {noteIds.map((id, index) => {
                    const note = notes.get(id);
                    const isPaneActive = id === activeTabId;

                    return (
                        <div key={id} className="group/pane relative flex items-center h-full">
                            {index > 0 && (
                                <div className={cn(
                                    "w-px h-3 bg-border/20 mx-0.5 transition-opacity duration-150",
                                    (isPaneActive || noteIds[index - 1] === activeTabId) ? "opacity-0" : "opacity-100"
                                )} />
                            )}

                            <button
                                ref={(el) => {
                                    if (el) buttonRefs.current.set(id, el);
                                    else buttonRefs.current.delete(id);
                                }}
                                onClick={(ev) => {
                                    ev.stopPropagation();
                                    onActivatePane(id);
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 pl-2 pr-5 py-1 rounded-[calc(var(--radius-md)-2px)] transition-all h-full outline-none",
                                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                                    isPaneActive
                                        ? "bg-background text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.05),0_0_1px_rgba(0,0,0,0.1)]"
                                        : "text-muted-foreground/70 hover:text-foreground hover:bg-background/20"
                                )}
                            >
                                <span className="text-sm shrink-0">{note?.emoji}</span>
                                <span className="text-[13px] font-medium truncate max-w-[80px]">{note?.title}</span>
                            </button>

                            {isActive && (
                                <button
                                    onClick={(ev) => {
                                        ev.stopPropagation();
                                        onClosePane(id);
                                    }}
                                    tabIndex={-1}
                                    className={cn(
                                        "absolute right-0.5 top-1/2 -translate-y-1/2 z-10 p-0.5 rounded-sm transition-colors",
                                        "text-muted-foreground/50 hover:text-foreground hover:bg-muted/60",
                                        "focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none"
                                    )}
                                    aria-label="Close pane"
                                >
                                    <IconX className="size-3" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }
);

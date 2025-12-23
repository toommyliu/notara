import { forwardRef, useRef, useEffect, useImperativeHandle } from "react";
import type { RefObject } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import IconX from "~icons/lucide/x";

import { useNotesStore } from "~/stores/notes-store";
import { cn } from "~/lib/utils";

import type { HeaderTabItemHandle, HeaderTabItemProps } from "./types";

export const HeaderTabItem = forwardRef<HeaderTabItemHandle, HeaderTabItemProps>(
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

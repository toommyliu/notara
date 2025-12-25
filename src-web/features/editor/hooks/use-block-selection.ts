import { useState, useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";

import type { Block } from "~/features/notes/store";

type UseBlockSelectionOptions = {
    containerRef: RefObject<HTMLDivElement | null>;
    blockRefs: RefObject<Map<string, HTMLElement>>;
    blocks: Block[];
    isMac: boolean;
    onDeleteBlocks?: (blockIds: Set<string>) => void;
};

export function useBlockSelection({
    containerRef,
    blockRefs,
    blocks,
    isMac,
    onDeleteBlocks,
}: UseBlockSelectionOptions) {
    const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
    const lastSelectAllBlockIdRef = useRef<string | null>(null);

    const selectAllBlocks = useCallback(() => {
        setSelectedBlockIds(new Set(blocks.map((b) => b.id)));
        // Clear native browser text selection
        window.getSelection()?.removeAllRanges();
    }, [blocks]);

    const clearBlockSelection = useCallback(() => {
        if (selectedBlockIds.size > 0)
            setSelectedBlockIds(new Set());
    }, [selectedBlockIds.size]);

    // Cmd+A cascade and Escape handling
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleKeyDown = (ev: globalThis.KeyboardEvent) => {
            const modKey = isMac ? ev.metaKey : ev.ctrlKey;

            if (ev.key === "a" && modKey && !ev.shiftKey) {
                // If all blocks are already selected, prevent any action
                if (selectedBlockIds.size === blocks.length) {
                    ev.preventDefault();
                    return;
                }

                const selection = window.getSelection();
                if (!selection)
                    return;

                // Find which block has focus
                const activeElement = document.activeElement;
                const focusedBlockEl = activeElement?.closest("[data-block-id]") as HTMLElement | null ||
                    Array.from(blockRefs.current?.values() ?? []).find(el => el.contains(selection.anchorNode));

                if (!focusedBlockEl)
                    return;

                const blockId = focusedBlockEl.getAttribute("data-block-id") ||
                    focusedBlockEl.id ||
                    Array.from(blockRefs.current?.entries() ?? []).find(([, el]) => el === focusedBlockEl)?.[0];

                // If this is the same block we already pressed Cmd+A on, expand to all blocks
                // We don't check selection state - the second Cmd+A always expands
                if (lastSelectAllBlockIdRef.current === blockId) {
                    ev.preventDefault();
                    lastSelectAllBlockIdRef.current = null;
                    selectAllBlocks();
                } else {
                    // First Cmd+A in this block - let browser select all text, track the block
                    lastSelectAllBlockIdRef.current = blockId ?? null;
                }
            } else if (ev.key === "Escape") {
                // Escape clears block selection
                if (selectedBlockIds.size > 0) {
                    ev.preventDefault();
                    setSelectedBlockIds(new Set());
                    window.getSelection()?.removeAllRanges();
                }
                lastSelectAllBlockIdRef.current = null;
            } else if ((ev.key === "Backspace" || ev.key === "Delete") && selectedBlockIds.size > 0) {
                // Delete all selected blocks
                ev.preventDefault();
                ev.stopPropagation();
                onDeleteBlocks?.(selectedBlockIds);
                setSelectedBlockIds(new Set());
                lastSelectAllBlockIdRef.current = null;
            } else {
                // Reset on any other key
                lastSelectAllBlockIdRef.current = null;
            }
        };

        container.addEventListener("keydown", handleKeyDown, true);
        return () => container.removeEventListener("keydown", handleKeyDown, true);
    }, [blocks, selectedBlockIds, selectAllBlocks, isMac, containerRef, blockRefs, onDeleteBlocks]);

    return {
        selectedBlockIds,
        selectAllBlocks,
        clearBlockSelection,
    };
}

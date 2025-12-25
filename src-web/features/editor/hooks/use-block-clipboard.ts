import { useEffect, useCallback, type RefObject } from "react";

import { BLOCK_MIME_TYPE, createBlock, formatBlocksAsPlainText, parseMarkdownToBlocks } from "../utils/block-utils";

import type { Block } from "~/features/notes/store";

type UseBlockClipboardOptions = {
    containerRef: RefObject<HTMLDivElement | null>;
    blockRefs: RefObject<Map<string, HTMLElement>>;
    blocks: Block[];
    selectedBlockIds: Set<string>;
    focusedBlockId: string | null;
    onInsertBlocks: (newBlocks: Block[], afterId: string | null) => void;
};

export function useBlockClipboard({
    containerRef,
    blockRefs,
    blocks,
    selectedBlockIds,
    focusedBlockId,
    onInsertBlocks,
}: UseBlockClipboardOptions) {
    const getSelectedBlocksFromSelection = useCallback((): Block[] => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed)
            return [];

        // If we have explicit block selection
        if (selectedBlockIds.size > 0)
            return blocks.filter(b => selectedBlockIds.has(b.id));

        // Otherwise find blocks within selection range
        const range = selection.getRangeAt(0);
        const container = containerRef.current;
        if (!container)
            return [];

        const selectedBlocks: Block[] = [];
        for (const block of blocks) {
            const el = blockRefs.current?.get(block.id) || document.getElementById(block.id);
            if (el && range.intersectsNode(el))
                selectedBlocks.push(block);
        }

        return selectedBlocks;
    }, [blocks, selectedBlockIds, containerRef, blockRefs]);

    // Copy handler
    useEffect(() => {
        const container = containerRef.current;
        if (!container)
            return;

        const handleCopy = (ev: ClipboardEvent) => {
            const selectedBlocks = getSelectedBlocksFromSelection();

            // Only intercept if multiple blocks are selected
            if (selectedBlocks.length > 1) {
                ev.preventDefault();

                // Format as clean plain text
                const plainText = formatBlocksAsPlainText(selectedBlocks);
                ev.clipboardData?.setData("text/plain", plainText);

                // Store structured data for internal paste
                ev.clipboardData?.setData(BLOCK_MIME_TYPE, JSON.stringify(selectedBlocks));
            }
        };

        container.addEventListener("copy", handleCopy);
        return () => container.removeEventListener("copy", handleCopy);
    }, [containerRef, getSelectedBlocksFromSelection]);

    // Paste handler
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handlePaste = (ev: ClipboardEvent) => {
            const target = ev.target as HTMLElement;
            // codeblocks have their own paste handlers
            if (target.closest("[data-code-block-id]"))
                return;

            const clipboardData = ev.clipboardData;
            if (!clipboardData)
                return;

            // Check for internal block data first (from our copy handler)
            const blockData = clipboardData.getData(BLOCK_MIME_TYPE);
            if (blockData) {
                ev.preventDefault();
                try {
                    const pastedBlocks = JSON.parse(blockData) as Block[];
                    // Create new blocks with fresh IDs
                    const newBlocks = pastedBlocks.map(b =>
                        createBlock(b.type, b.content, b.indent)
                    );

                    onInsertBlocks(newBlocks, focusedBlockId);

                    // Focus the last inserted block
                    setTimeout(() => {
                        const lastBlock = newBlocks[newBlocks.length - 1];
                        const el = blockRefs.current?.get(lastBlock.id) || document.getElementById(lastBlock.id);
                        el?.focus();
                    }, 0);

                    return;
                } catch {
                }
            }

            const plainText = clipboardData.getData("text/plain");
            if (!plainText)
                return;

            const newBlocks = parseMarkdownToBlocks(plainText);
            if (newBlocks.length === 0)
                return;

            if (newBlocks.length === 1 && !plainText.includes("\n"))
                return;

            ev.preventDefault();
            onInsertBlocks(newBlocks, focusedBlockId);

            setTimeout(() => {
                const lastBlock = newBlocks[newBlocks.length - 1];
                const el = blockRefs.current?.get(lastBlock.id) || document.getElementById(lastBlock.id);
                el?.focus();
            }, 0);
        };

        container.addEventListener("paste", handlePaste);
        return () => container.removeEventListener("paste", handlePaste);
    }, [containerRef, blockRefs, focusedBlockId, onInsertBlocks]);
}

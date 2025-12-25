import { useRef, useState, useCallback, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { SlashMenu } from "./slash-menu";
import { SortableBlock } from "./sortable-block";
import { BlockType, createBlock, type BlockTypeValue } from "./utils/block-utils";

import { useBlockClipboard } from "./hooks/use-block-clipboard";
import { useBlockSelection } from "./hooks/use-block-selection";
import { usePlatformLayout } from "~/hooks/use-platform";
import type { Block } from "~/stores/notes-store";

import { cn } from "~/lib/utils";

type BlockEditorProps = {
    initialBlocks?: Block[];
    onChange?: (blocks: Block[]) => void;
};

export function BlockEditor({ initialBlocks, onChange }: BlockEditorProps) {
    const [blocks, setBlocks] = useState<Block[]>(
        initialBlocks || [createBlock("text", "")]
    );

    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
    const [_activeDragId, setActiveDragId] = useState<string | null>(null);
    const [slashMenu, setSlashMenu] = useState<{
        isOpen: boolean;
        blockId: string;
        position: { top: number; left: number };
        query: string;
    }>({
        isOpen: false,
        blockId: "",
        position: { top: 0, left: 0 },
        query: "",
    });

    const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);

    const { isMac } = usePlatformLayout();

    const handleDeleteBlocks = useCallback((blockIds: Set<string>) => {
        setBlocks(prev => {
            const remaining = prev.filter(b => !blockIds.has(b.id));
            // Always keep at least one block
            if (remaining.length === 0) {
                const newBlock = createBlock("text", "");
                setTimeout(() => {
                    const el = blockRefs.current.get(newBlock.id) || document.getElementById(newBlock.id);
                    el?.focus();
                }, 0);
                return [newBlock];
            }
            // Focus the first remaining block after deletion
            setTimeout(() => {
                const el = blockRefs.current.get(remaining[0].id) || document.getElementById(remaining[0].id);
                el?.focus();
            }, 0);
            return remaining;
        });
    }, []);

    const { selectedBlockIds, clearBlockSelection } = useBlockSelection({
        containerRef,
        blockRefs,
        blocks,
        isMac,
        onDeleteBlocks: handleDeleteBlocks,
    });

    const handleInsertBlocks = useCallback((newBlocks: Block[], afterId: string | null) => {
        setBlocks(prev => {
            const insertIndex = afterId
                ? prev.findIndex(b => b.id === afterId) + 1
                : prev.length;
            const result = [...prev];
            result.splice(insertIndex, 0, ...newBlocks);
            return result;
        });
    }, []);

    useBlockClipboard({
        containerRef,
        blockRefs,
        blocks,
        selectedBlockIds,
        focusedBlockId,
        onInsertBlocks: handleInsertBlocks,
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (ev: DragStartEvent) => {
        setActiveDragId(ev.active.id as string);
    };

    const handleDragEnd = (ev: DragEndEvent) => {
        const { active, over } = ev;

        if (over && active.id !== over.id) {
            setBlocks((items) => {
                const oldIndex = items.findIndex((b) => b.id === active.id);
                const newIndex = items.findIndex((b) => b.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setActiveDragId(null);
    };

    const updateBlock = (id: string, updates: Partial<Block>) => {
        setBlocks((prev) =>
            prev.map((block) => (block.id === id ? { ...block, ...updates } : block))
        );
    };

    const scrollIntoComfortableView = useCallback((element: HTMLElement) => {
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        const bottomThreshold = 200;
        const distanceFromBottom = viewportHeight - rect.bottom;

        if (distanceFromBottom < bottomThreshold) {
            const scrollContainer = element.closest(".overflow-y-auto") as HTMLElement;
            if (scrollContainer) {
                const targetFromBottom = viewportHeight * 0.4;
                const scrollAmount = bottomThreshold - distanceFromBottom + (bottomThreshold - targetFromBottom);

                scrollContainer.scrollBy({
                    top: scrollAmount,
                    behavior: "instant"
                });
            }
        }
    }, []);

    const addBlockAfter = (afterId: string, type: BlockTypeValue = BlockType.TEXT, indent: number = 0) => {
        const newBlock = createBlock(type, "", indent);
        setBlocks((prev) => {
            const index = prev.findIndex((b) => b.id === afterId);
            const newBlocks = [...prev];
            newBlocks.splice(index + 1, 0, newBlock);
            return newBlocks;
        });

        setTimeout(() => {
            const el = blockRefs.current.get(newBlock.id) || document.getElementById(newBlock.id);
            if (el) {
                el.focus();
                requestAnimationFrame(() => scrollIntoComfortableView(el));
            }
        }, 0);
        return newBlock.id;
    };

    const handleSlashSelect = (type: BlockTypeValue) => {
        updateBlock(slashMenu.blockId, { type });
        setSlashMenu((prev) => ({ ...prev, isOpen: false }));
        setTimeout(() => {
            blockRefs.current.get(slashMenu.blockId)?.focus();
        }, 0);
    };

    useEffect(() => {
        onChange?.(blocks);
    }, [blocks, onChange]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={blocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
            >
                <div ref={containerRef} className={cn("space-y-0.5", selectedBlockIds.size > 0 && "blocks-selected")} tabIndex={-1}>
                    {blocks.map((b) => (
                        <SortableBlock
                            key={b.id}
                            block={b}
                            onAddAfter={() => addBlockAfter(b.id)}
                            onUpdateBlock={(updates) => updateBlock(b.id, updates)}
                            onFocus={() => {
                                setFocusedBlockId(b.id);
                                clearBlockSelection();
                                const el = blockRefs.current.get(b.id) || document.getElementById(b.id);
                                if (el) requestAnimationFrame(() => scrollIntoComfortableView(el));
                            }}
                            onBlur={() => setFocusedBlockId(null)}
                            onUpdateSlashQuery={(query) => {
                                if (slashMenu.isOpen && slashMenu.blockId === b.id)
                                    setSlashMenu(prev => ({ ...prev, query }));
                            }}
                            onSlashMenu={(position) => {
                                setSlashMenu({
                                    isOpen: true,
                                    blockId: b.id,
                                    position,
                                    query: "",
                                });
                            }}
                            isSelected={selectedBlockIds.has(b.id)}
                        />
                    ))}
                </div>
            </SortableContext>

            <DragOverlay dropAnimation={null} />

            <SlashMenu
                isOpen={slashMenu.isOpen}
                position={slashMenu.position}
                searchQuery={slashMenu.query}
                onSelect={handleSlashSelect}
                onClose={() => {
                    setSlashMenu((prev) => ({ ...prev, isOpen: false }));
                    setTimeout(() => {
                        blockRefs.current.get(slashMenu.blockId)?.focus();
                    }, 0);
                }}
            />
        </DndContext>
    );
}

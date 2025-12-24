import { KeyboardEvent, useRef, useState, useCallback, useEffect } from "react";
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
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { SlashMenu } from "./slash-menu";

import IconGripVertical from "~icons/lucide/grip-vertical";
import IconPlus from "~icons/lucide/plus";

import { usePlatformLayout } from "~/hooks/use-platform";

import { cn } from "~/lib/utils";

import { type Block } from "~/stores/notes-store";


type BlockEditorProps = {
    initialBlocks?: Block[];
    onChange?: (blocks: Block[]) => void;
};

const CREATE_BLOCK = (type: string = "text", content: string = "", indent: number = 0): Block => ({
    id: crypto.randomUUID(),
    type,
    content,
    indent,
});

const MAX_INDENT = 4;

const GET_BLOCK_STYLES = (type: string) => {
    switch (type) {
        case "h1":
            return "text-3xl font-sans font-bold";
        case "h2":
            return "text-2xl font-sans font-semibold";
        case "h3":
            return "text-xl font-sans font-medium";
        case "bullet":
            return "pl-6 before:content-['•'] before:absolute before:left-0 before:text-muted-foreground relative";
        case "numbered":
            return "pl-6";
        case "quote":
            return "pl-4 border-l-2 border-amber/50 italic text-muted-foreground";
        case "code":
            return "font-mono text-sm bg-muted px-3 py-2 rounded-md";
        case "todo":
            return "pl-6";
        default:
            return "";
    }
};

const GET_PLACEHOLDER = (type: string) => {
    switch (type) {
        case "h1":
            return "Heading 1";
        case "h2":
            return "Heading 2";
        case "h3":
            return "Heading 3";
        case "bullet":
        case "numbered":
            return "List item";
        case "quote":
            return "Quote";
        case "code":
            return "Code";
        case "todo":
            return "To-do";
        default:
            return "Type '/' for commands...";
    }
};

type SortableBlockProps = {
    block: Block;
    onAddAfter: () => void;
    onUpdateBlock: (updates: Partial<Block>) => void;
    onKeyDown: (ev: KeyboardEvent, block: Block) => void;
    onFocus: () => void;
    onBlur: () => void;
    isSelected: boolean;
    blockRef: (el: HTMLElement | null) => void;
};

function SortableBlock({
    block,
    onAddAfter,
    onUpdateBlock,
    onKeyDown,
    onFocus,
    onBlur,
    isSelected,
    blockRef,
}: SortableBlockProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginLeft: block.indent ? `calc(-0.5rem + ${block.indent * 1.5}rem)` : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative flex items-start -mx-2 px-2 rounded-sm transition-all",
                isDragging && "opacity-30",
                isSelected
                    ? "bg-amber/10"
                    : "hover:bg-accent/30"
            )}
        >
            <div
                className={cn(
                    "absolute left-0 -translate-x-full flex items-center gap-0.5 py-1.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                )}
            >
                <button
                    className="p-0.5 rounded hover:bg-accent text-muted-foreground"
                    onClick={onAddAfter}
                >
                    <IconPlus className="size-4" />
                </button>
                <button
                    className="p-0.5 rounded hover:bg-accent text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
                    {...attributes}
                    {...listeners}
                >
                    <IconGripVertical className="size-4" />
                </button>
            </div>

            {block.type === "todo" && (
                <input
                    type="checkbox"
                    className="mt-1.5 size-4 rounded border-border accent-amber"
                />
            )}

            {block.type === "divider" ? (
                <hr className="flex-1 my-4 border-border" />
            ) : (
                <div
                    ref={blockRef}
                    contentEditable
                    suppressContentEditableWarning
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onInput={(ev) =>
                        onUpdateBlock({
                            content: ev.currentTarget.textContent || "",
                        })
                    }
                    onKeyDown={(ev) => onKeyDown(ev, block)}
                    data-placeholder={GET_PLACEHOLDER(block.type)}
                    className={cn(
                        "flex-1 outline-none py-1 min-w-0 overflow-hidden relative",
                        "wrap-anywhere",
                        "text-lg leading-relaxed",
                        "text-ink",
                        "empty:after:content-[attr(data-placeholder)]",
                        "empty:after:text-muted-foreground/40",
                        "empty:after:absolute empty:after:top-1",
                        "empty:after:whitespace-nowrap empty:after:pointer-events-none",
                        "selection:bg-amber/20",
                        GET_BLOCK_STYLES(block.type)
                    )}
                />
            )}
        </div>
    );
}

export function BlockEditor({ initialBlocks, onChange }: BlockEditorProps) {
    const [blocks, setBlocks] = useState<Block[]>(
        initialBlocks || [CREATE_BLOCK("text", "")]
    );

    const [_activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
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

    const lastSelectAllPressRef = useRef<number>(0);
    const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());

    const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);

    const { isMac } = usePlatformLayout();

    const selectAllBlocks = useCallback(() => {
        const selection = window.getSelection();
        const container = containerRef.current;
        if (!selection || !container) return;

        setSelectedBlockIds(new Set(blocks.map((b) => b.id)));

        const range = document.createRange();
        range.selectNodeContents(container);
        selection.removeAllRanges();
        selection.addRange(range);
    }, [blocks]);

    const clearBlockSelection = useCallback(() => {
        if (selectedBlockIds.size > 0) {
            setSelectedBlockIds(new Set());
        }
    }, [selectedBlockIds.size]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // prevent accidental drags
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

    const addBlockAfter = (afterId: string, type: string = "text", indent: number = 0) => {
        const newBlock = CREATE_BLOCK(type, "", indent);
        setBlocks((prev) => {
            const index = prev.findIndex((b) => b.id === afterId);
            const newBlocks = [...prev];
            newBlocks.splice(index + 1, 0, newBlock);
            return newBlocks;
        });

        setTimeout(() => {
            blockRefs.current.get(newBlock.id)?.focus();
        }, 0);
        return newBlock.id;
    };

    const deleteBlock = (id: string) => {
        setBlocks((prev) => {
            if (prev.length === 1)
                return prev; // Don't delete the last block

            return prev.filter((b) => b.id !== id);
        });
    };

    const moveBlock = useCallback((id: string, direction: "up" | "down") => {
        setBlocks((prev) => {
            const index = prev.findIndex((b) => b.id === id);
            if (index === -1) return prev;

            const newIndex = direction === "up" ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= prev.length) return prev;

            return arrayMove(prev, index, newIndex);
        });
    }, []);

    const focusBlock = (id: string, position: "start" | "end" = "end") => {
        setTimeout(() => {
            const el = blockRefs.current.get(id);
            if (el) {
                el.focus();
                const range = document.createRange();
                const sel = window.getSelection();

                if (position === "end" && el.textContent) {
                    // Move cursor to end
                    range.selectNodeContents(el);
                    range.collapse(false);
                } else if (el.firstChild) {
                    // Move cursor to start
                    range.setStart(el.firstChild, 0);
                    range.collapse(true);
                } else {
                    // Empty element - just select it
                    range.selectNodeContents(el);
                    range.collapse(true);
                }

                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }, 0);
    };

    const handleBlockKeyDown = (ev: KeyboardEvent, block: Block) => {
        const element = blockRefs.current.get(block.id);
        if (!element) return;

        const blockIndex = blocks.findIndex((b) => b.id === block.id);
        const modKey = isMac ? ev.metaKey : ev.ctrlKey;

        // mod + a: Select current block on first press, all blocks on quick double-press
        if (ev.key === "a" && modKey && !ev.shiftKey) {
            ev.preventDefault();

            const now = Date.now();
            const timeSinceLastPress = now - lastSelectAllPressRef.current;
            lastSelectAllPressRef.current = now;

            // If all blocks are already selected, do nothing
            if (selectedBlockIds.size === blocks.length) {
                return;
            }

            // Double-press within 400ms: select all blocks
            if (timeSinceLastPress < 400 && timeSinceLastPress > 0) {
                selectAllBlocks();
                return;
            }

            // Single press: select current block content
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(element);
            selection?.removeAllRanges();
            selection?.addRange(range);
            return;
        }

        // Escape: Close slash menu if open, clear selection state, or blur the current block
        if (ev.key === "Escape") {
            ev.preventDefault();
            if (slashMenu.isOpen) {
                setSlashMenu((prev) => ({ ...prev, isOpen: false }));
            } else if (selectedBlockIds.size > 0) {
                clearBlockSelection();
                window.getSelection()?.removeAllRanges();
            } else {
                element.blur();
            }
            return;
        }

        // mod + shift + arrow up: Move block up
        if (ev.key === "ArrowUp" && modKey && ev.shiftKey) {
            ev.preventDefault();
            moveBlock(block.id, "up");
            setTimeout(() => focusBlock(block.id), 0);
            return;
        }

        // mod + shift + arrow down: Move block down
        if (ev.key === "ArrowDown" && modKey && ev.shiftKey) {
            ev.preventDefault();
            moveBlock(block.id, "down");
            setTimeout(() => focusBlock(block.id), 0);
            return;
        }

        // Tab: Indent list items
        if (ev.key === "Tab" && !ev.shiftKey) {
            if (block.type === "bullet" || block.type === "numbered" || block.type === "todo") {
                ev.preventDefault();
                const currentIndent = block.indent || 0;
                if (currentIndent < MAX_INDENT) {
                    updateBlock(block.id, { indent: currentIndent + 1 });
                }
                return;
            }
        }

        // Shift+Tab: Outdent list items or convert back to text
        if (ev.key === "Tab" && ev.shiftKey) {
            if (block.type === "bullet" || block.type === "numbered" || block.type === "todo") {
                ev.preventDefault();
                const currentIndent = block.indent || 0;
                if (currentIndent > 0) {
                    updateBlock(block.id, { indent: currentIndent - 1 });
                } else {
                    // At indent 0, convert to text
                    updateBlock(block.id, { type: "text", indent: 0 });
                }
                return;
            }
        }

        // mod + d: Duplicate block
        if (ev.key === "d" && modKey && !ev.shiftKey) {
            ev.preventDefault();
            const newBlock = CREATE_BLOCK(block.type, block.content, block.indent);
            setBlocks((prev) => {
                const index = prev.findIndex((b) => b.id === block.id);
                const newBlocks = [...prev];
                newBlocks.splice(index + 1, 0, newBlock);
                return newBlocks;
            });
            setTimeout(() => {
                const newElement = blockRefs.current.get(newBlock.id);
                if (newElement) {
                    newElement.textContent = block.content;
                    focusBlock(newBlock.id);
                }
            }, 0);
            return;
        }

        // Backspace: delete block or merge with previous
        if (ev.key === "Backspace") {
            const selection = window.getSelection();
            const isAtStart =
                selection?.anchorOffset === 0 &&
                selection?.focusOffset === 0 &&
                (selection?.anchorNode === element ||
                    selection?.anchorNode === element.firstChild);

            // If block is empty and not the first block, delete it
            if (element.textContent === "" && blockIndex > 0) {
                ev.preventDefault();
                // Check if we are indented, if so unindent
                if ((block.indent || 0) > 0) {
                    updateBlock(block.id, { indent: (block.indent || 0) - 1 });
                    return;
                }

                const prevBlock = blocks[blockIndex - 1];
                deleteBlock(block.id);
                focusBlock(prevBlock.id, "end");
                return;
            }

            // If cursor is at the start and not the first block, merge with previous
            if (isAtStart && blockIndex > 0 && element.textContent !== "") {
                ev.preventDefault();

                // If indented, unindent first
                if ((block.indent || 0) > 0) {
                    updateBlock(block.id, { indent: (block.indent || 0) - 1 });
                    return;
                }

                const prevBlock = blocks[blockIndex - 1];
                const prevElement = blockRefs.current.get(prevBlock.id);
                const currentContent = element.textContent || "";
                const prevContent = prevElement?.textContent || "";

                // Update previous block with merged content
                updateBlock(prevBlock.id, { content: prevContent + currentContent });
                if (prevElement) {
                    prevElement.textContent = prevContent + currentContent;
                }

                // Delete current block and focus previous at merge point
                deleteBlock(block.id);
                setTimeout(() => {
                    const el = blockRefs.current.get(prevBlock.id);
                    if (el) {
                        el.focus();
                        // Position cursor at the merge point
                        const range = document.createRange();
                        const sel = window.getSelection();
                        if (el.firstChild) {
                            range.setStart(el.firstChild, prevContent.length);
                            range.collapse(true);
                            sel?.removeAllRanges();
                            sel?.addRange(range);
                        }
                    }
                }, 0);
                return;
            }
        }

        // Arrow Up: move to previous block when at start
        if (ev.key === "ArrowUp" && blockIndex > 0) {
            const selection = window.getSelection();
            const isAtStart =
                selection?.anchorOffset === 0 &&
                (selection?.anchorNode === element ||
                    selection?.anchorNode === element.firstChild);

            if (isAtStart || element.textContent === "") {
                ev.preventDefault();
                focusBlock(blocks[blockIndex - 1].id, "end");
                return;
            }
        }

        // Arrow Down: move to next block when at end
        if (ev.key === "ArrowDown" && blockIndex < blocks.length - 1) {
            const selection = window.getSelection();
            const textLength = element.textContent?.length || 0;
            const isAtEnd =
                selection?.anchorOffset === textLength &&
                (selection?.anchorNode === element ||
                    selection?.anchorNode === element.firstChild);

            if (isAtEnd || element.textContent === "") {
                ev.preventDefault();
                focusBlock(blocks[blockIndex + 1].id, "start");
                return;
            }
        }

        // Enter: new block (continue list if in list block)
        if (ev.key === "Enter" && !ev.shiftKey) {
            ev.preventDefault();

            const isListBlock = block.type === "bullet" || block.type === "numbered" || block.type === "todo";

            // If in an empty list block, convert to text (end the list)
            if (isListBlock && element.textContent === "") {
                // If deeply indented, we might want to outdent first? 
                // Currently just converting to text is fine to break the list.
                // But typically enter on empty nested list outdents it.
                if ((block.indent || 0) > 0) {
                    updateBlock(block.id, { indent: (block.indent || 0) - 1 });
                    return;
                }

                updateBlock(block.id, { type: "text" });
                return;
            }

            // Continue the list with same type and indentation, or create text block
            addBlockAfter(block.id, isListBlock ? block.type : "text", isListBlock ? block.indent : 0);
        }

        // /: slash command menu
        if (ev.key === "/" && element.textContent === "") {
            ev.preventDefault();
            const rect = element.getBoundingClientRect();
            setSlashMenu({
                isOpen: true,
                blockId: block.id,
                position: { top: rect.bottom + 4, left: rect.left },
                query: "",
            });
        }

        // Markdown shortcuts
        const text = element.textContent || "";
        if (ev.key === " ") {
            // Headings
            if (text === "#") {
                ev.preventDefault();
                element.textContent = "";
                updateBlock(block.id, { type: "h1", content: "" });
            } else if (text === "##") {
                ev.preventDefault();
                element.textContent = "";
                updateBlock(block.id, { type: "h2", content: "" });
            } else if (text === "###") {
                ev.preventDefault();
                element.textContent = "";
                updateBlock(block.id, { type: "h3", content: "" });
            }

            // Lists
            else if (text === "-" || text === "*") {
                ev.preventDefault();
                element.textContent = "";
                updateBlock(block.id, { type: "bullet", content: "" });
            } else if (text === "1.") {
                ev.preventDefault();
                element.textContent = "";
                updateBlock(block.id, { type: "numbered", content: "" });
            }

            // Quote
            else if (text === ">") {
                ev.preventDefault();
                element.textContent = "";
                updateBlock(block.id, { type: "quote", content: "" });
            }

            // Todo
            else if (text === "[]" || text === "[ ]") {
                ev.preventDefault();
                element.textContent = "";
                updateBlock(block.id, { type: "todo", content: "" });
            }

            // Divider
            else if (text === "---") {
                ev.preventDefault();
                element.textContent = "";
                updateBlock(block.id, { type: "divider", content: "" });
                addBlockAfter(block.id);
            }
        }
    };

    const handleSlashSelect = (type: string) => {
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
                <div ref={containerRef} className="space-y-0.5" tabIndex={-1}>
                    {blocks.map((b) => (
                        <SortableBlock
                            key={b.id}
                            block={b}
                            onAddAfter={() => addBlockAfter(b.id)}
                            onUpdateBlock={(updates) => updateBlock(b.id, updates)}
                            onKeyDown={handleBlockKeyDown}
                            onFocus={() => {
                                setActiveBlockId(b.id);
                                clearBlockSelection();
                            }}
                            onBlur={() => setActiveBlockId(null)}
                            isSelected={selectedBlockIds.has(b.id)}
                            blockRef={(el) => {
                                if (el) {
                                    blockRefs.current.set(b.id, el);
                                    if (el.textContent === "" && b.content)
                                        el.textContent = b.content;
                                }
                            }}
                        />
                    ))}
                </div>
            </SortableContext>

            <DragOverlay dropAnimation={null}>
                {activeDragId ? (
                    <div className="max-w-prose px-3 py-1.5 text-lg leading-relaxed wrap-anywhere opacity-70">
                        {blocks.find((b) => b.id === activeDragId)?.content}
                    </div>
                ) : null}
            </DragOverlay>

            <SlashMenu
                isOpen={slashMenu.isOpen}
                position={slashMenu.position}
                searchQuery={slashMenu.query}
                onSelect={handleSlashSelect}
                onClose={() => {
                    setSlashMenu((prev) => ({ ...prev, isOpen: false }));
                    // Re-focus the block that triggered the menu
                    setTimeout(() => {
                        blockRefs.current.get(slashMenu.blockId)?.focus();
                    }, 0);
                }}
            />
        </DndContext>
    );
}

import { KeyboardEvent, useRef, useState } from "react";

import { SlashMenu } from "~/components/slash-menu";

import IconGripVertical from "~icons/lucide/grip-vertical";
import IconPlus from "~icons/lucide/plus";

import { cn } from "~/lib/utils";

type Block = {
    id: string;
    type: string;
    content: string;
}
type BlockEditorProps = {
    initialBlocks?: Block[];
    onChange?: (blocks: Block[]) => void;
}

const createBlock = (type: string = "text", content: string = ""): Block => ({
    id: crypto.randomUUID(),
    type,
    content,
});

export function BlockEditor({ initialBlocks }: BlockEditorProps) {
    const [blocks, setBlocks] = useState<Block[]>(
        initialBlocks || [createBlock("text", "")]
    );
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
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

    const updateBlock = (id: string, updates: Partial<Block>) => {
        setBlocks((prev) =>
            prev.map((block) => (block.id === id ? { ...block, ...updates } : block))
        );
    };

    const addBlockAfter = (afterId: string, type: string = "text") => {
        const newBlock = createBlock(type, "");
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
        if (blocks.length === 1)
            return;

        const index = blocks.findIndex((b) => b.id === id);
        const prevBlock = blocks[index - 1];
        setBlocks((prev) => prev.filter((b) => b.id !== id));
        if (prevBlock) {
            setTimeout(() => {
                blockRefs.current.get(prevBlock.id)?.focus();
            }, 0);
        }
    };

    const handleBlockKeyDown = (ev: KeyboardEvent, block: Block) => {
        const element = blockRefs.current.get(block.id);
        if (!element) return;

        // Enter: new block
        if (ev.key === "Enter" && !ev.shiftKey) {
            ev.preventDefault();
            addBlockAfter(block.id);
        }

        // Backspace: delete block if empty
        if (ev.key === "Backspace" && element.textContent === "") {
            ev.preventDefault();
            deleteBlock(block.id);
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

    const getBlockStyles = (type: string) => {
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

    const getPlaceholder = (type: string) => {
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

    return (
        <div className="space-y-0.5">
            {blocks.map((block) => (
                <div
                    key={block.id}
                    className={cn(
                        "group relative flex items-start gap-1 hover:bg-accent/30 -mx-2 px-2 rounded-sm transition-colors"
                    )}
                >
                    <div
                        className={cn(
                            "flex items-center gap-0.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity -ml-12 w-10"
                        )}
                    >
                        <button
                            className="p-0.5 rounded hover:bg-accent text-muted-foreground"
                            onClick={() => addBlockAfter(block.id)}
                        >
                            <IconPlus className="size-4" />
                        </button>
                        <button className="p-0.5 rounded hover:bg-accent text-muted-foreground cursor-grab">
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
                            ref={(el) => {
                                if (el) {
                                    blockRefs.current.set(block.id, el);
                                    if (el.textContent === "" && block.content)
                                        el.textContent = block.content;
                                }
                            }}
                            contentEditable
                            suppressContentEditableWarning
                            onFocus={() => setActiveBlockId(block.id)}
                            onBlur={() => setActiveBlockId(null)}
                            onInput={(ev) =>
                                updateBlock(block.id, {
                                    content: ev.currentTarget.textContent || "",
                                })
                            }
                            onKeyDown={(e) => handleBlockKeyDown(e, block)}
                            data-placeholder={getPlaceholder(block.type)}
                            className={cn(
                                "flex-1 outline-none py-1",
                                "font-serif text-lg leading-relaxed",
                                "text-ink",
                                "empty:before:content-[attr(data-placeholder)]",
                                "empty:before:text-muted-foreground/40",
                                "selection:bg-amber/20",
                                getBlockStyles(block.type)
                            )}
                        />
                    )}
                </div>
            ))}

            <SlashMenu
                isOpen={slashMenu.isOpen}
                position={slashMenu.position}
                searchQuery={slashMenu.query}
                onSelect={handleSlashSelect}
                onClose={() => setSlashMenu((prev) => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}

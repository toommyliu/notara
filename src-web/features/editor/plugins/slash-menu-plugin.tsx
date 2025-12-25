import { useEffect, useState, useCallback, useRef } from "react";
import {
    $getSelection,
    $isRangeSelection,
    $createParagraphNode,
} from "lexical";
import { $createHeadingNode } from "@lexical/rich-text";
import { $createQuoteNode } from "@lexical/rich-text";
import { $createListNode, $createListItemNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { $createCodeBlockNode } from "../nodes/code-block-node";

import IconType from "~icons/lucide/type";
import IconHeading1 from "~icons/lucide/heading-1";
import IconHeading2 from "~icons/lucide/heading-2";
import IconHeading3 from "~icons/lucide/heading-3";
import IconList from "~icons/lucide/list";
import IconListOrdered from "~icons/lucide/list-ordered";
import IconQuote from "~icons/lucide/quote";
import IconCode from "~icons/lucide/code";
import IconMinus from "~icons/lucide/minus";

import { cn } from "~/lib/utils";

type SlashMenuItem = {
    id: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    action: () => void;
};

export function SlashMenuPlugin() {
    const [editor] = useLexicalComposerContext();
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    const menuItems: SlashMenuItem[] = [
        {
            id: "text",
            label: "Text",
            description: "Plain text paragraph",
            icon: IconType,
            action: () => {
                editor.update(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) return;
                    const node = selection.anchor.getNode().getTopLevelElement();
                    if (node) {
                        const paragraph = $createParagraphNode();
                        node.replace(paragraph);
                        paragraph.selectStart();
                    }
                });
            },
        },
        {
            id: "h1",
            label: "Heading 1",
            description: "Large section heading",
            icon: IconHeading1,
            action: () => {
                editor.update(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) return;
                    const node = selection.anchor.getNode().getTopLevelElement();
                    if (node) {
                        const heading = $createHeadingNode("h1");
                        node.replace(heading);
                        heading.selectStart();
                    }
                });
            },
        },
        {
            id: "h2",
            label: "Heading 2",
            description: "Medium section heading",
            icon: IconHeading2,
            action: () => {
                editor.update(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) return;
                    const node = selection.anchor.getNode().getTopLevelElement();
                    if (node) {
                        const heading = $createHeadingNode("h2");
                        node.replace(heading);
                        heading.selectStart();
                    }
                });
            },
        },
        {
            id: "h3",
            label: "Heading 3",
            description: "Small section heading",
            icon: IconHeading3,
            action: () => {
                editor.update(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) return;
                    const node = selection.anchor.getNode().getTopLevelElement();
                    if (node) {
                        const heading = $createHeadingNode("h3");
                        node.replace(heading);
                        heading.selectStart();
                    }
                });
            },
        },
        {
            id: "bullet",
            label: "Bullet List",
            description: "Create a bulleted list",
            icon: IconList,
            action: () => {
                editor.update(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) return;
                    const node = selection.anchor.getNode().getTopLevelElement();
                    if (node) {
                        const list = $createListNode("bullet");
                        const listItem = $createListItemNode();
                        list.append(listItem);
                        node.replace(list);
                        listItem.selectStart();
                    }
                });
            },
        },
        {
            id: "numbered",
            label: "Numbered List",
            description: "Create a numbered list",
            icon: IconListOrdered,
            action: () => {
                editor.update(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) return;
                    const node = selection.anchor.getNode().getTopLevelElement();
                    if (node) {
                        const list = $createListNode("number");
                        const listItem = $createListItemNode();
                        list.append(listItem);
                        node.replace(list);
                        listItem.selectStart();
                    }
                });
            },
        },
        {
            id: "quote",
            label: "Quote",
            description: "Create a blockquote",
            icon: IconQuote,
            action: () => {
                editor.update(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) return;
                    const node = selection.anchor.getNode().getTopLevelElement();
                    if (node) {
                        const quote = $createQuoteNode();
                        node.replace(quote);
                        quote.selectStart();
                    }
                });
            },
        },
        {
            id: "code",
            label: "Code Block",
            description: "Create a code block",
            icon: IconCode,
            action: () => {
                editor.update(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) return;
                    const node = selection.anchor.getNode().getTopLevelElement();
                    if (node) {
                        const codeBlock = $createCodeBlockNode("plaintext");
                        node.replace(codeBlock);
                    }
                });
            },
        },
        {
            id: "divider",
            label: "Divider",
            description: "Insert a horizontal line",
            icon: IconMinus,
            action: () => {
                editor.update(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) return;
                    const node = selection.anchor.getNode().getTopLevelElement();
                    if (node) {
                        const paragraph = $createParagraphNode();
                        node.replace(paragraph);
                        paragraph.selectStart();
                    }
                });
            },
        },
    ];

    const filteredItems = menuItems.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
    );

    const handleSelect = useCallback((item: SlashMenuItem) => {
        item.action();
        setIsOpen(false);
        setQuery("");
        setSelectedIndex(0);
    }, []);

    // Listen for "/" key on empty paragraphs
    useEffect(() => {
        const rootElement = editor.getRootElement();
        if (!rootElement) return;

        const handleKeyDown = (ev: KeyboardEvent) => {
            if (isOpen) {
                if (ev.key === "Escape") {
                    ev.preventDefault();
                    setIsOpen(false);
                    setQuery("");
                    return;
                }

                if (ev.key === "ArrowDown") {
                    ev.preventDefault();
                    setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
                    return;
                }

                if (ev.key === "ArrowUp") {
                    ev.preventDefault();
                    setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
                    return;
                }

                if (ev.key === "Enter") {
                    ev.preventDefault();
                    const item = filteredItems[selectedIndex];
                    if (item) handleSelect(item);
                    return;
                }

                if (ev.key === "Backspace" && query === "") {
                    setIsOpen(false);
                    return;
                }

                // Update query for alphanumeric keys
                if (ev.key.length === 1 && !ev.metaKey && !ev.ctrlKey) {
                    setQuery((prev) => prev + ev.key);
                    setSelectedIndex(0);
                    ev.preventDefault();
                    return;
                }

                if (ev.key === "Backspace") {
                    setQuery((prev) => prev.slice(0, -1));
                    setSelectedIndex(0);
                    ev.preventDefault();
                    return;
                }
            }

            // Open menu on "/" in empty paragraph
            if (ev.key === "/" && !isOpen) {
                editor.getEditorState().read(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) return;

                    const node = selection.anchor.getNode();
                    const topLevel = node.getTopLevelElement();
                    const text = topLevel?.getTextContent() || "";

                    if (text === "") {
                        ev.preventDefault();

                        // Get cursor position for menu placement using the DOM element
                        const domElement = editor.getElementByKey(topLevel!.getKey());

                        if (domElement) {
                            const rect = domElement.getBoundingClientRect();
                            setPosition({
                                top: rect.bottom + 4,
                                left: rect.left,
                            });
                        } else {
                            // Fallback to editor position
                            const editorRect = rootElement.getBoundingClientRect();
                            setPosition({
                                top: editorRect.top + 60,
                                left: editorRect.left + 48,
                            });
                        }

                        setIsOpen(true);
                        setQuery("");
                        setSelectedIndex(0);
                    }
                });
            }
        };

        rootElement.addEventListener("keydown", handleKeyDown);
        return () => rootElement.removeEventListener("keydown", handleKeyDown);
    }, [editor, isOpen, query, filteredItems, selectedIndex, handleSelect]);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClick = (ev: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(ev.target as Node)) {
                setIsOpen(false);
                setQuery("");
            }
        };

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            ref={menuRef}
            className="fixed z-50 min-w-[220px] rounded-lg border bg-popover shadow-xl animate-in fade-in-0 zoom-in-95"
            style={{ top: position.top, left: position.left }}
        >
            {query && (
                <div className="px-3 py-2 text-xs text-muted-foreground border-b">
                    Searching: <span className="font-medium text-foreground">{query}</span>
                </div>
            )}
            <div className="py-1 max-h-[300px] overflow-y-auto">
                {filteredItems.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
                ) : (
                    filteredItems.map((item, index) => (
                        <button
                            key={item.id}
                            type="button"
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                                index === selectedIndex
                                    ? "bg-accent text-accent-foreground"
                                    : "hover:bg-accent/50"
                            )}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div className="shrink-0 size-8 rounded bg-muted flex items-center justify-center">
                                <item.icon className="size-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">{item.label}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                    {item.description}
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

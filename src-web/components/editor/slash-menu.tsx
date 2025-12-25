import { useState, useRef, useEffect, useLayoutEffect } from "react";

import IconCheckSquare from "~icons/lucide/check-square";
import IconCode from "~icons/lucide/code-2";
import IconHeading1 from "~icons/lucide/heading-1";
import IconHeading2 from "~icons/lucide/heading-2";
import IconHeading3 from "~icons/lucide/heading-3";
import IconList from "~icons/lucide/list";
import IconListOrdered from "~icons/lucide/list-ordered";
import IconMinus from "~icons/lucide/minus";
import IconQuote from "~icons/lucide/quote";
import IconText from "~icons/lucide/type";

import { BlockType, type BlockTypeValue } from "./utils/block-utils";

import { cn } from "~/lib/utils";

type SlashMenuProps = {
    isOpen: boolean;
    position: { top: number; left: number };
    onSelect: (blockType: BlockTypeValue) => void;
    onClose: () => void;
    searchQuery: string;
}

const MENU_ITEMS = [
    { type: BlockType.TEXT, label: "Text", description: "Plain text block", icon: IconText, shortcut: null },
    { type: BlockType.H1, label: "Heading 1", description: "Large section heading", icon: IconHeading1, shortcut: "#" },
    { type: BlockType.H2, label: "Heading 2", description: "Medium section heading", icon: IconHeading2, shortcut: "##" },
    { type: BlockType.H3, label: "Heading 3", description: "Small section heading", icon: IconHeading3, shortcut: "###" },
    { type: BlockType.BULLET, label: "Bulleted List", description: "Create a bullet list", icon: IconList, shortcut: "-" },
    { type: BlockType.NUMBERED, label: "Numbered List", description: "Create a numbered list", icon: IconListOrdered, shortcut: "1." },
    { type: BlockType.TODO, label: "To-do", description: "Track tasks with checkboxes", icon: IconCheckSquare, shortcut: "[]" },
    { type: BlockType.QUOTE, label: "Quote", description: "Capture a quote", icon: IconQuote, shortcut: ">" },
    { type: BlockType.CODE, label: "Code", description: "Capture a code snippet", icon: IconCode, shortcut: "```" },
    { type: BlockType.DIVIDER, label: "Divider", description: "Visual separator", icon: IconMinus, shortcut: "---" },
] as const;

export function SlashMenu({
    isOpen,
    position,
    onSelect,
    onClose,
    searchQuery,
}: SlashMenuProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [adjustedPosition, setAdjustedPosition] = useState(position);
    const menuRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

    const filteredItems = MENU_ITEMS.filter(
        (item) =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useLayoutEffect(() => {
        if (!isOpen || !menuRef.current) return;

        const rect = menuRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        let { top, left } = position;

        // Vertical overflow check
        if (top + rect.height > viewportHeight - 16) {
            // Position above if it overflows the bottom
            top = top - rect.height - 40;
        }

        // Horizontal overflow check
        if (left + rect.width > viewportWidth - 16) {
            left = viewportWidth - rect.width - 16;
        }

        // Ensure it doesn't go off the top or left
        top = Math.max(16, top);
        left = Math.max(16, left);

        setAdjustedPosition({ top, left });
    }, [isOpen, position, filteredItems.length]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);

    useEffect(() => {
        if (isOpen && itemRefs.current.get(selectedIndex)) {
            itemRefs.current.get(selectedIndex)?.scrollIntoView({
                block: "nearest",
                behavior: "smooth",
            });
        }
    }, [selectedIndex, isOpen]);

    useEffect(() => {
        const handleKeyDown = (ev: KeyboardEvent) => {
            if (!isOpen || filteredItems.length === 0) return;

            const handledKeys = ["ArrowDown", "ArrowUp", "Tab", "Enter", "Escape", "Backspace"];
            if (handledKeys.includes(ev.key)) {
                ev.preventDefault();
                ev.stopPropagation();
            }

            switch (ev.key) {
                case "ArrowDown":
                    setSelectedIndex((idx) => (idx + 1) % filteredItems.length);
                    break;
                case "ArrowUp":
                    setSelectedIndex((idx) => (idx - 1 + filteredItems.length) % filteredItems.length);
                    break;
                case "Tab":
                    if (ev.shiftKey) {
                        setSelectedIndex((idx) => (idx - 1 + filteredItems.length) % filteredItems.length);
                    } else {
                        setSelectedIndex((idx) => (idx + 1) % filteredItems.length);
                    }
                    break;
                case "Enter":
                    if (filteredItems[selectedIndex])
                        onSelect(filteredItems[selectedIndex].type);
                    break;
                case "Escape":
                case "Backspace":
                    onClose();
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown, true);
        return () => document.removeEventListener("keydown", handleKeyDown, true);
    }, [isOpen, selectedIndex, filteredItems, onSelect, onClose]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (ev: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(ev.target as Node))
                onClose();
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen || filteredItems.length === 0) return null;

    return (
        <div
            ref={menuRef}
            className={cn(
                "fixed z-100 w-72 max-h-80 overflow-y-auto scrollbar-custom",
                "bg-popover border border-border rounded-lg shadow-xl",
                "animate-in fade-in zoom-in-95 duration-150"
            )}
            style={{ top: adjustedPosition.top, left: adjustedPosition.left }}
        >
            <div className="p-1">
                <div className="px-2 py-1.5 text-[11px] font-sans font-medium text-muted-foreground uppercase tracking-wider">
                    Basic blocks
                </div>
                {filteredItems.map((item, index) => (
                    <button
                        key={item.type}
                        ref={(el) => {
                            if (el) itemRefs.current.set(index, el);
                            else itemRefs.current.delete(index);
                        }}
                        onClick={() => onSelect(item.type)}
                        className={cn(
                            "w-full flex items-center gap-3 px-2 py-2 rounded-md",
                            "text-left transition-colors",
                            index === selectedIndex
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-accent/50"
                        )}
                    >
                        <div
                            className={cn(
                                "size-10 rounded-md border border-border",
                                "flex items-center justify-center",
                                "bg-background"
                            )}
                        >
                            <item.icon className="size-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-sans font-medium">{item.label}</div>
                            <div className="text-xs text-muted-foreground truncate">
                                {item.description}
                            </div>
                        </div>
                        {item.shortcut && (
                            <code className="text-[10px] font-mono text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded">
                                {item.shortcut}
                            </code>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

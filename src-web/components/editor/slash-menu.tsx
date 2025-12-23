import { useState, useRef, useEffect } from "react";

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

import { cn } from "~/lib/utils";

type SlashMenuProps = {
    isOpen: boolean;
    position: { top: number; left: number };
    onSelect: (blockType: string) => void;
    onClose: () => void;
    searchQuery: string;
}

const MENU_ITEMS = [
    { type: "text", label: "Text", description: "Plain text block", icon: IconText },
    { type: "h1", label: "Heading 1", description: "Large section heading", icon: IconHeading1 },
    { type: "h2", label: "Heading 2", description: "Medium section heading", icon: IconHeading2 },
    { type: "h3", label: "Heading 3", description: "Small section heading", icon: IconHeading3 },
    { type: "bullet", label: "Bulleted List", description: "Create a bullet list", icon: IconList },
    { type: "numbered", label: "Numbered List", description: "Create a numbered list", icon: IconListOrdered },
    { type: "todo", label: "To-do", description: "Track tasks with checkboxes", icon: IconCheckSquare },
    { type: "quote", label: "Quote", description: "Capture a quote", icon: IconQuote },
    { type: "code", label: "Code", description: "Capture a code snippet", icon: IconCode },
    { type: "divider", label: "Divider", description: "Visual separator", icon: IconMinus },
] as const;

export function SlashMenu({
    isOpen,
    position,
    onSelect,
    onClose,
    searchQuery,
}: SlashMenuProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    const filteredItems = MENU_ITEMS.filter(
        (item) =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);

    useEffect(() => {
        const handleKeyDown = (ev: KeyboardEvent) => {
            if (!isOpen) return;

            switch (ev.key) {
                case "ArrowDown":
                    ev.preventDefault();
                    setSelectedIndex((idx) => (idx + 1) % filteredItems.length);
                    break;
                case "ArrowUp":
                    ev.preventDefault();
                    setSelectedIndex((idx) => (idx - 1 + filteredItems.length) % filteredItems.length);
                    break;
                case "Enter":
                    ev.preventDefault();
                    if (filteredItems[selectedIndex]) {
                        onSelect(filteredItems[selectedIndex].type);
                    }
                    break;
                case "Escape":
                case "Backspace":
                    ev.preventDefault();
                    onClose();
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, selectedIndex, filteredItems, onSelect, onClose]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (ev: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(ev.target as Node)) {
                onClose();
            }
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
            style={{ top: position.top, left: position.left }}
        >
            <div className="p-1">
                <div className="px-2 py-1.5 text-[11px] font-sans font-medium text-muted-foreground uppercase tracking-wider">
                    Basic blocks
                </div>
                {filteredItems.map((item, index) => (
                    <button
                        key={item.type}
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
                    </button>
                ))}
            </div>
        </div>
    );
}

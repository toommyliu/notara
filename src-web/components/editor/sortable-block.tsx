import { memo } from "react";
import type { LexicalBlockEditorRef } from "./lexical-editor";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { LexicalBlockEditor } from "./lexical-editor";
import { CodeBlock } from "./code-block";
import { BlockType, getBlockStyles, getPlaceholder } from "./utils/block-utils";

import IconGripVertical from "~icons/lucide/grip-vertical";
import IconPlus from "~icons/lucide/plus";

import type { Block } from "~/stores/notes-store";

import { cn } from "~/lib/utils";

export type SortableBlockProps = {
    block: Block;
    onAddAfter: () => void;
    onUpdateBlock: (updates: Partial<Block>) => void;
    onConvertToCode: (language?: string) => void;
    onFocus: () => void;
    onBlur: () => void;
    onUpdateSlashQuery?: (query: string) => void;
    onSlashMenu?: (position: { top: number; left: number }) => void;
    onNavigatePrev?: (type: "up" | "left") => void;
    onNavigateNext?: (type: "down" | "right") => void;
    isSelected: boolean;
    innerRef?: (ref: LexicalBlockEditorRef | null) => void;
    containerRef?: (el: HTMLDivElement | null) => void;
};

export const SortableBlock = memo(function SortableBlock({
    block,
    onAddAfter,
    onUpdateBlock,
    onConvertToCode,
    onFocus,
    onBlur,
    onUpdateSlashQuery,
    onSlashMenu,
    onNavigatePrev,
    onNavigateNext,
    isSelected,
    innerRef,
    containerRef,
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
            ref={(node) => {
                setNodeRef(node);
                if (containerRef) containerRef(node as HTMLDivElement | null);
            }}
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
                    "absolute left-0 top-1 -translate-x-full flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity"
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

            {block.type === BlockType.TODO && (
                <input
                    type="checkbox"
                    className="mt-1.5 size-4 rounded border-border accent-amber"
                />
            )}

            {block.type === BlockType.DIVIDER ? (
                <hr className="flex-1 my-4 border-border" />
            ) : block.type === BlockType.CODE ? (
                <CodeBlock
                    ref={innerRef}
                    blockId={block.id}
                    content={block.content}
                    language={block.language}
                    isSelected={isSelected}
                    onContentChange={(text) => {
                        onUpdateBlock({ content: text });
                    }}
                    onLanguageChange={(language) => {
                        onUpdateBlock({ language });
                    }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onEnter={onAddAfter}
                    onNavigatePrev={onNavigatePrev}
                    onNavigateNext={onNavigateNext}
                />
            ) : (
                <LexicalBlockEditor
                    ref={innerRef}
                    blockId={block.id}
                    blockType={block.type}
                    content={block.content}
                    placeholder={getPlaceholder(block.type)}
                    onChange={(text) => {
                        if (/^```\w*$/.test(text)) return;

                        onUpdateBlock({ content: text });
                        onUpdateSlashQuery?.(text);
                    }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onEnter={onAddAfter}
                    onNavigatePrev={onNavigatePrev}
                    onNavigateNext={onNavigateNext}
                    onSlashMenu={onSlashMenu}
                    onConvertToCode={onConvertToCode}
                    className={cn(
                        "py-1",
                        getBlockStyles(block.type)
                    )}
                />
            )}
        </div>
    );
});

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Extension } from "@tiptap/core";
import { forwardRef, useImperativeHandle, useEffect, type KeyboardEvent } from "react";

import { cn } from "~/lib/utils";

type TipTapEditorProps = {
    content?: string;
    placeholder?: string;
    onChange?: (html: string, text: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onKeyDown?: (ev: KeyboardEvent) => void;
    onEnter?: () => void;
    onBackspaceAtStart?: () => void;
    className?: string;
    editable?: boolean;
};

export type TipTapEditorRef = {
    focus: () => void;
    getText: () => string;
    getHTML: () => string;
    isEmpty: () => boolean;
};

// Custom extension to handle keyboard events for block editor integration
const BlockEditorKeymap = Extension.create({
    name: "blockEditorKeymap",

    addOptions() {
        return {
            onEnter: () => { },
            onBackspaceAtStart: () => { },
            onSlash: () => { },
        };
    },

    addKeyboardShortcuts() {
        return {
            Enter: ({ editor }) => {
                // Only handle Enter at end of content, let TipTap handle it mid-content
                const { from } = editor.state.selection;
                const docEnd = editor.state.doc.content.size - 1;

                // If at end or empty, create new block
                if (from === to && from >= docEnd - 1) {
                    this.options.onEnter?.();
                    return true;
                }
                return false;
            },
            Backspace: ({ editor }) => {
                const { from, to, empty } = editor.state.selection;
                // If at start of editor with empty selection
                if (empty && from === 1) {
                    this.options.onBackspaceAtStart?.();
                    return true;
                }
                return false;
            },
        };
    },
});

export const TipTapEditor = forwardRef<TipTapEditorRef, TipTapEditorProps>(
    function TipTapEditor(
        {
            content = "",
            placeholder = "Type something...",
            onChange,
            onFocus,
            onBlur,
            onKeyDown,
            onEnter,
            onBackspaceAtStart,
            className,
            editable = true,
        },
        ref
    ) {
        const editor = useEditor({
            extensions: [
                StarterKit.configure({
                    // Keep headings enabled
                    heading: {
                        levels: [1, 2, 3],
                    },
                    // Disable block-level features we handle at block level
                    bulletList: false,
                    orderedList: false,
                    blockquote: false,
                    codeBlock: false,
                    horizontalRule: false,
                    listItem: false,
                }),
                BlockEditorKeymap.configure({
                    onEnter,
                    onBackspaceAtStart,
                }),
            ],
            content: content ? `<p>${content}</p>` : "",
            editable,
            editorProps: {
                attributes: {
                    class: cn(
                        "outline-none min-h-[1.5em]",
                        // Style inline formatting
                        "[&_strong]:font-semibold",
                        "[&_em]:italic",
                        "[&_s]:line-through [&_s]:text-muted-foreground",
                        "[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[0.875em]",
                        "[&_code]:font-[ui-monospace,'SF_Mono','Cascadia_Code',monospace]",
                        // Heading styles
                        "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight",
                        "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight",
                        "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-snug",
                        "[&_p]:m-0",
                        className
                    ),
                    "data-placeholder": placeholder,
                },
                handleKeyDown: (_view, event) => {
                    // Forward slash key for slash menu
                    if (event.key === "/") {
                        onKeyDown?.(event as unknown as KeyboardEvent);
                    }
                    // Forward arrow keys for block navigation
                    if (["ArrowUp", "ArrowDown"].includes(event.key)) {
                        onKeyDown?.(event as unknown as KeyboardEvent);
                    }
                    return false; // Let TipTap continue handling
                },
            },
            onUpdate: ({ editor }) => {
                onChange?.(editor.getHTML(), editor.getText());
            },
            onFocus: () => onFocus?.(),
            onBlur: () => onBlur?.(),
        });

        // Expose methods via ref
        useImperativeHandle(ref, () => ({
            focus: () => editor?.commands.focus(),
            getText: () => editor?.getText() ?? "",
            getHTML: () => editor?.getHTML() ?? "",
            isEmpty: () => editor?.isEmpty ?? true,
        }));

        // Update content when prop changes
        useEffect(() => {
            if (editor && content !== editor.getText()) {
                editor.commands.setContent(content ? `<p>${content}</p>` : "");
            }
        }, [content, editor]);

        if (!editor) return null;

        return <EditorContent editor={editor} className="flex-1" />;
    }
);

export { useEditor, EditorContent };

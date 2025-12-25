import { useEffect, useCallback, forwardRef, useImperativeHandle } from "react";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $createParagraphNode, $createTextNode, KEY_ENTER_COMMAND, COMMAND_PRIORITY_HIGH, type EditorState, type LexicalEditor } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { ListNode, ListItemNode } from "@lexical/list";
import { TRANSFORMERS } from "@lexical/markdown";

import { cn } from "~/lib/utils";

type LexicalBlockEditorProps = {
    blockId?: string;
    content?: string;
    placeholder?: string;
    onChange?: (text: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onEnter?: () => void;
    onSlashMenu?: (position: { top: number; left: number }) => void;
    className?: string;
};

export type LexicalBlockEditorRef = {
    focus: () => void;
    getText: () => string;
};

const theme = {
    paragraph: "m-0",
    text: {
        bold: "font-semibold",
        italic: "italic",
        strikethrough: "line-through text-muted-foreground",
        code: "bg-muted px-1.5 py-0.5 rounded text-[0.875em] font-[ui-monospace,'SF_Mono','Cascadia_Code',monospace]",
        underline: "underline",
    },
    heading: {
        h1: "text-3xl font-bold leading-tight m-0",
        h2: "text-2xl font-semibold leading-tight m-0",
        h3: "text-xl font-semibold leading-snug m-0",
    },
    code: "bg-muted rounded p-3 font-mono text-sm",
    link: "text-amber underline underline-offset-2",
};

function onError(error: Error) {
    console.error("[Lexical Error]", error);
}

// Plugin to handle Enter key for block creation
function EnterKeyPlugin({ onEnter }: { onEnter?: () => void }) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            KEY_ENTER_COMMAND,
            (event) => {
                // Shift+Enter: let Lexical handle (line break within block)
                if (event?.shiftKey) {
                    return false;
                }

                // Regular Enter: always create new block
                event?.preventDefault();
                onEnter?.();
                return true;
            },
            COMMAND_PRIORITY_HIGH
        );
    }, [editor, onEnter]);

    return null;
}

// Plugin to forward keyboard events for slash menu
function SlashMenuPlugin({
    onSlashMenu
}: {
    onSlashMenu?: (position: { top: number; left: number }) => void
}) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        const rootElement = editor.getRootElement();
        if (!rootElement) return;

        const handleKeyDown = (ev: KeyboardEvent) => {
            // Check for / on empty editor
            if (ev.key === "/") {
                editor.getEditorState().read(() => {
                    const root = $getRoot();
                    const text = root.getTextContent();
                    if (text === "") {
                        ev.preventDefault();
                        const rect = rootElement.getBoundingClientRect();
                        onSlashMenu?.({ top: rect.bottom + 4, left: rect.left });
                    }
                });
            }
        };

        rootElement.addEventListener("keydown", handleKeyDown);
        return () => rootElement.removeEventListener("keydown", handleKeyDown);
    }, [editor, onSlashMenu]);

    return null;
}

// Plugin to set initial content
function InitialContentPlugin({ content }: { content?: string }) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!content) return;

        editor.update(() => {
            const root = $getRoot();
            // Only set if empty
            if (root.getTextContent() === "") {
                root.clear();
                const paragraph = $createParagraphNode();
                paragraph.append($createTextNode(content));
                root.append(paragraph);
            }
        });
    }, [editor, content]);

    return null;
}

// Plugin to expose editor methods via ref
function EditorRefPlugin({ editorRef }: { editorRef: React.RefObject<LexicalBlockEditorRef | null> }) {
    const [editor] = useLexicalComposerContext();

    useImperativeHandle(editorRef, () => ({
        focus: () => editor.focus(),
        getText: () => {
            let text = "";
            editor.getEditorState().read(() => {
                text = $getRoot().getTextContent();
            });
            return text;
        },
    }));

    return null;
}

export const LexicalBlockEditor = forwardRef<LexicalBlockEditorRef, LexicalBlockEditorProps>(
    function LexicalBlockEditor(
        {
            blockId,
            content = "",
            placeholder = "Type something...",
            onChange,
            onFocus,
            onBlur,
            onEnter,
            onSlashMenu,
            className,
        },
        ref
    ) {
        const initialConfig = {
            namespace: "BlockEditor",
            theme,
            onError,
            nodes: [
                HeadingNode,
                QuoteNode,
                CodeNode,
                CodeHighlightNode,
                LinkNode,
                AutoLinkNode,
                ListNode,
                ListItemNode,
            ],
        };

        const handleChange = useCallback(
            (editorState: EditorState, _editor: LexicalEditor) => {
                editorState.read(() => {
                    const text = $getRoot().getTextContent();
                    onChange?.(text);
                });
            },
            [onChange]
        );

        const internalRef = { current: null as LexicalBlockEditorRef | null };

        return (
            <LexicalComposer initialConfig={initialConfig}>
                <div className={cn("relative flex-1", className)}>
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable
                                id={blockId}
                                data-block-id={blockId}
                                className={cn(
                                    "outline-none min-h-[1.5em]",
                                    "text-lg leading-relaxed text-ink"
                                )}
                                onFocus={onFocus}
                                onBlur={onBlur}
                            />
                        }
                        placeholder={
                            <div className="absolute top-1 left-0 text-muted-foreground/40 pointer-events-none text-lg leading-relaxed">
                                {placeholder}
                            </div>
                        }
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                    <OnChangePlugin onChange={handleChange} />
                    <EnterKeyPlugin onEnter={onEnter} />
                    <SlashMenuPlugin onSlashMenu={onSlashMenu} />
                    <InitialContentPlugin content={content} />
                    <EditorRefPlugin editorRef={ref as React.RefObject<LexicalBlockEditorRef | null> ?? internalRef} />
                </div>
            </LexicalComposer>
        );
    }
);

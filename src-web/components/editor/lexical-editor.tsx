import { useEffect, useCallback, forwardRef, useImperativeHandle, useState } from "react";
import type { RefObject } from "react";

import { $getRoot, $createParagraphNode, $createTextNode, KEY_ENTER_COMMAND, KEY_ARROW_UP_COMMAND, KEY_ARROW_DOWN_COMMAND, KEY_ARROW_LEFT_COMMAND, KEY_ARROW_RIGHT_COMMAND, COMMAND_PRIORITY_HIGH, COMMAND_PRIORITY_LOW } from "lexical";
import { PASTE_COMMAND, $insertNodes, $getSelection, $isRangeSelection, TextNode, RootNode } from "lexical";
import type { EditorState, LexicalEditor, RangeSelection } from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { ListNode, ListItemNode } from "@lexical/list";
import { TRANSFORMERS } from "@lexical/markdown";

import { cn } from "~/lib/utils";

const INLINE_MARKDOWN_PATTERN = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|~~(.+?)~~)/g;
const INLINE_MARKDOWN_CHECK = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/;
const INLINE_MARKDOWN_FULL_PATTERN = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|~~(.+?)~~|\[(.+?)\]\((.+?)\))/g;

type LexicalBlockEditorProps = {
    blockId?: string;
    content?: string;
    placeholder?: string;
    onChange?: (text: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onEnter?: () => void;
    onNavigatePrev?: (type: "up" | "left") => void;
    onNavigateNext?: (type: "down" | "right") => void;
    onSlashMenu?: (position: { top: number; left: number }) => void;
    className?: string;
};

export type LexicalBlockEditorRef = {
    focus: () => void;
    focusStart: () => void;
    focusEnd: () => void;
    getText: () => string;
    clear: () => void;
};

const LEXICAL_THEME = {
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
} as const;

const LEXICAL_NODES = [
    HeadingNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    LinkNode,
    AutoLinkNode,
    ListNode,
    ListItemNode,
] as const;

function onError(error: Error) {
    console.error("[Lexical Error]", error);
}

// Plugin to handle Enter key for block creation
function EnterKeyPlugin({ onEnter }: { onEnter?: () => void }) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            KEY_ENTER_COMMAND,
            (ev) => {
                // Shift+Enter: let Lexical handle (line break within block)
                if (ev?.shiftKey) {
                    return false;
                }

                // Regular Enter: always create new block
                ev?.preventDefault();
                onEnter?.();
                return true;
            },
            COMMAND_PRIORITY_HIGH
        );
    }, [editor, onEnter]);

    return null;
}

// Helper to check if selection is at the very start of the editor content
function $isAtStart(selection: RangeSelection): boolean {
    if (selection.anchor.offset !== 0) return false;
    let curr = selection.anchor.getNode();
    while (curr && !(curr instanceof RootNode)) {
        if (curr.getPreviousSibling() !== null) return false;
        curr = curr.getParentOrThrow();
    }
    return true;
}

// Helper to check if selection is at the very end of the editor content
function $isAtEnd(selection: RangeSelection): boolean {
    const node = selection.anchor.getNode();
    if (selection.anchor.offset !== node.getTextContentSize()) return false;
    let curr = node;
    while (curr && !(curr instanceof RootNode)) {
        if (curr.getNextSibling() !== null) return false;
        curr = curr.getParentOrThrow();
    }
    return true;
}

// Plugin to handle arrow keys for navigation between blocks
function ArrowKeyNavigationPlugin({
    onNavigatePrev,
    onNavigateNext,
}: {
    onNavigatePrev?: (type: "up" | "left") => void;
    onNavigateNext?: (type: "down" | "right") => void;
}) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        const handlePrev = (ev: KeyboardEvent, type: "up" | "left") => {
            const selection = $getSelection();
            if ($isRangeSelection(selection) && selection.isCollapsed() && $isAtStart(selection)) {
                ev.preventDefault();
                onNavigatePrev?.(type);
                return true;
            }
            return false;
        };

        const handleNext = (ev: KeyboardEvent, type: "down" | "right") => {
            const selection = $getSelection();
            if ($isRangeSelection(selection) && selection.isCollapsed() && $isAtEnd(selection)) {
                ev.preventDefault();
                onNavigateNext?.(type);
                return true;
            }
            return false;
        };

        const listeners = [
            editor.registerCommand(KEY_ARROW_UP_COMMAND, (ev) => handlePrev(ev, "up"), COMMAND_PRIORITY_LOW),
            editor.registerCommand(KEY_ARROW_LEFT_COMMAND, (ev) => handlePrev(ev, "left"), COMMAND_PRIORITY_LOW),
            editor.registerCommand(KEY_ARROW_DOWN_COMMAND, (ev) => handleNext(ev, "down"), COMMAND_PRIORITY_LOW),
            editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, (ev) => handleNext(ev, "right"), COMMAND_PRIORITY_LOW),
        ];

        return () => {
            listeners.forEach(remove => remove());
        };
    }, [editor, onNavigatePrev, onNavigateNext]);

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

// Plugin to set initial content with markdown parsing
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

                // Parse markdown and create formatted nodes
                const nodes = parseInlineMarkdownToNodes(content);
                for (const node of nodes)
                    paragraph.append(node);

                root.append(paragraph);
            }
        });
    }, [editor, content]);

    return null;
}

// Parse inline markdown into formatted TextNodes
function parseInlineMarkdownToNodes(text: string): TextNode[] {
    // Reset lastIndex since we reuse the module-scope regex
    INLINE_MARKDOWN_PATTERN.lastIndex = 0;

    let lastIndex = 0;
    let match;
    const nodes: TextNode[] = [];

    while ((match = INLINE_MARKDOWN_PATTERN.exec(text)) !== null) {
        // Add text before this match
        if (match.index > lastIndex) {
            nodes.push($createTextNode(text.slice(lastIndex, match.index)));
        }

        const fullMatch = match[0];

        if (fullMatch.startsWith("**")) {
            // Bold
            const node = $createTextNode(match[2]);
            node.toggleFormat("bold");
            nodes.push(node);
        } else if (fullMatch.startsWith("~~")) {
            // Strikethrough
            const node = $createTextNode(match[5]);
            node.toggleFormat("strikethrough");
            nodes.push(node);
        } else if (fullMatch.startsWith("`")) {
            // Code
            const node = $createTextNode(match[4]);
            node.toggleFormat("code");
            nodes.push(node);
        } else if (fullMatch.startsWith("*")) {
            // Italic (single asterisk)
            const node = $createTextNode(match[3]);
            node.toggleFormat("italic");
            nodes.push(node);
        }

        lastIndex = match.index + fullMatch.length;
    }

    // Add remaining text after last match
    if (lastIndex < text.length) {
        nodes.push($createTextNode(text.slice(lastIndex)));
    }

    // If no markdown was found, just return plain text
    if (nodes.length === 0) {
        nodes.push($createTextNode(text));
    }

    return nodes;
}

// Plugin to expose editor methods via ref
function EditorRefPlugin({ editorRef }: { editorRef: RefObject<LexicalBlockEditorRef | null> }) {
    const [editor] = useLexicalComposerContext();

    useImperativeHandle(editorRef, () => ({
        focus: () => editor.focus(),
        focusStart: () => {
            editor.focus();
            editor.update(() => {
                const root = $getRoot();
                const firstChild = root.getFirstChild();
                if (firstChild) {
                    firstChild.selectStart();
                }
            });
        },
        focusEnd: () => {
            editor.focus();
            editor.update(() => {
                const root = $getRoot();
                const lastChild = root.getLastChild();
                if (lastChild) {
                    lastChild.selectEnd();
                }
            });
        },
        getText: () => {
            let text = "";
            editor.getEditorState().read(() => {
                text = $getRoot().getTextContent();
            });
            return text;
        },
        clear: () => {
            editor.update(() => {
                const root = $getRoot();
                root.clear();
                const paragraph = $createParagraphNode();
                root.append(paragraph);
                paragraph.selectStart();
            });
        },
    }));

    return null;
}

// Plugin to convert markdown on paste (bold, italic, links, etc.)
function MarkdownPastePlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            PASTE_COMMAND,
            (ev: ClipboardEvent) => {
                const clipboardData = ev.clipboardData;
                if (!clipboardData)
                    return false;

                const text = clipboardData.getData("text/plain");
                if (!text)
                    return false;

                if (text.includes("\n"))
                    return false;

                const hasInlineMarkdown = INLINE_MARKDOWN_CHECK.test(text);
                if (!hasInlineMarkdown) return false; // Let default paste handle plain text

                // Single-line with inline markdown - handle it here
                ev.preventDefault();

                editor.update(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) return;

                    // Remove current selection if any
                    if (!selection.isCollapsed()) {
                        selection.removeText();
                    }

                    // Parse and insert inline markdown
                    parseAndInsertInlineMarkdown(selection, text);
                });

                return true;
            },
            COMMAND_PRIORITY_LOW
        );
    }, [editor]);

    return null;
}

// Parse inline markdown and insert formatted text nodes
function parseAndInsertInlineMarkdown(selection: RangeSelection, text: string) {
    // Reset lastIndex since we reuse the module-scope regex
    INLINE_MARKDOWN_FULL_PATTERN.lastIndex = 0;

    let lastIndex = 0;
    let match;
    const nodes: TextNode[] = [];

    while ((match = INLINE_MARKDOWN_FULL_PATTERN.exec(text)) !== null) {
        // Add text before this match
        if (match.index > lastIndex) {
            nodes.push($createTextNode(text.slice(lastIndex, match.index)));
        }

        const fullMatch = match[0];

        if (fullMatch.startsWith("**")) {
            // Bold
            const node = $createTextNode(match[2]);
            node.toggleFormat("bold");
            nodes.push(node);
        } else if (fullMatch.startsWith("~~")) {
            // Strikethrough
            const node = $createTextNode(match[5]);
            node.toggleFormat("strikethrough");
            nodes.push(node);
        } else if (fullMatch.startsWith("`")) {
            // Code
            const node = $createTextNode(match[4]);
            node.toggleFormat("code");
            nodes.push(node);
        } else if (fullMatch.startsWith("[")) {
            // Link - just insert as plain text for now (links need special handling)
            const linkText = match[6];
            nodes.push($createTextNode(linkText));
        } else if (fullMatch.startsWith("*")) {
            // Italic (single asterisk)
            const node = $createTextNode(match[3]);
            node.toggleFormat("italic");
            nodes.push(node);
        }

        lastIndex = match.index + fullMatch.length;
    }

    // Add remaining text after last match
    if (lastIndex < text.length)
        nodes.push($createTextNode(text.slice(lastIndex)));

    // If no markdown was found, just insert plain text
    if (nodes.length === 0) {
        selection.insertRawText(text);
        return;
    }

    // Insert all nodes
    $insertNodes(nodes);
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
            onNavigatePrev,
            onNavigateNext,
            onSlashMenu,
            className,
        },
        ref
    ) {
        const initialConfig = {
            namespace: "BlockEditor",
            theme: LEXICAL_THEME,
            onError,
            nodes: [...LEXICAL_NODES],
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

        const [isFocused, setIsFocused] = useState(false);

        const handleFocus = useCallback((_ev: React.FocusEvent) => {
            setIsFocused(true);
            onFocus?.();
        }, [onFocus]);

        const handleBlur = useCallback((_ev: React.FocusEvent) => {
            setIsFocused(false);
            onBlur?.();
        }, [onBlur]);

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
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                            />
                        }
                        placeholder={
                            isFocused ? (
                                <div className="absolute inset-0 p-[inherit] text-muted-foreground/40 pointer-events-none text-lg leading-relaxed">
                                    {placeholder}
                                </div>
                            ) : null
                        }
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                    <OnChangePlugin onChange={handleChange} />
                    <EnterKeyPlugin onEnter={onEnter} />
                    <ArrowKeyNavigationPlugin onNavigatePrev={onNavigatePrev} onNavigateNext={onNavigateNext} />
                    <SlashMenuPlugin onSlashMenu={onSlashMenu} />
                    <MarkdownPastePlugin />
                    <InitialContentPlugin content={content} />
                    <EditorRefPlugin editorRef={ref as React.RefObject<LexicalBlockEditorRef | null> ?? internalRef} />
                </div>
            </LexicalComposer>
        );
    }
);

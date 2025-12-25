import { useCallback, forwardRef } from "react";
import type { RefObject } from "react";

import type { EditorState, LexicalEditor, SerializedEditorState } from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { TRANSFORMERS } from "@lexical/markdown";

import { SlashMenuPlugin } from "../plugins/slash-menu-plugin";
import { SelectAllPlugin } from "../plugins/select-all-plugin";
import { InitialStatePlugin } from "../plugins/initial-state-plugin";
import { CodeBlockShortcutPlugin } from "../plugins/code-block-shortcut-plugin";
import { EditorRefPlugin } from "../plugins/editor-ref-plugin";

import { NODES } from "../nodes";
import { THEME } from "../theme";
import { cn } from "~/lib/utils";

export type DocumentEditorRef = {
    focus: () => void;
    clear: () => void;
    getSerializedState: () => SerializedEditorState | null;
};

type DocumentEditorProps = {
    initialState?: SerializedEditorState | null;
    onChange?: (state: SerializedEditorState) => void;
    placeholder?: string;
    className?: string;
};

function onError(error: Error) {
    console.error("[DocumentEditor Error]", error);
}

export const DocumentEditor = forwardRef<DocumentEditorRef, DocumentEditorProps>(
    function DocumentEditor(
        {
            initialState,
            onChange,
            placeholder = "Start typing, or press '/' for commands...",
            className,
        },
        ref
    ) {
        const initialConfig = {
            namespace: "DocumentEditor",
            theme: THEME,
            onError,
            nodes: NODES,
        };

        const handleChange = useCallback(
            (editorState: EditorState, _editor: LexicalEditor) => {
                onChange?.(editorState.toJSON());
            },
            [onChange]
        );

        return (
            <LexicalComposer initialConfig={initialConfig}>
                <div className={cn("relative", className)}>
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable
                                className={cn(
                                    "outline-none min-h-[200px]",
                                    "text-lg text-ink"
                                )}
                            />
                        }
                        placeholder={
                            <div className="absolute top-0 left-0 text-muted-foreground/40 pointer-events-none text-lg">
                                {placeholder}
                            </div>
                        }
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <ListPlugin />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                    <OnChangePlugin onChange={handleChange} />
                    <CodeBlockShortcutPlugin />
                    <SlashMenuPlugin />
                    <SelectAllPlugin />
                    <InitialStatePlugin initialState={initialState} />
                    <EditorRefPlugin editorRef={ref as RefObject<DocumentEditorRef | null>} />
                </div>
            </LexicalComposer>
        );
    }
);

import { useImperativeHandle, type RefObject } from "react";
import { $getRoot, $createParagraphNode } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import type { DocumentEditorRef } from "../components/document-editor";

type EditorRefPluginProps = {
    editorRef: RefObject<DocumentEditorRef | null>;
};

export function EditorRefPlugin({ editorRef }: EditorRefPluginProps) {
    const [editor] = useLexicalComposerContext();

    useImperativeHandle(editorRef, () => ({
        focus: () => editor.focus(),
        clear: () => {
            editor.update(() => {
                const root = $getRoot();
                root.clear();
                const paragraph = $createParagraphNode();
                root.append(paragraph);
                paragraph.selectStart();
            });
        },
        getSerializedState: () => {
            return editor.getEditorState().toJSON();
        },
    }));

    return null;
}

import { useEffect } from "react";
import { $getSelection, $isRangeSelection } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { $createCodeBlockNode } from "../nodes/code-block-node";

export function CodeBlockShortcutPlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerTextContentListener((text) => {
            const lines = text.split("\n");
            const lastLine = lines[lines.length - 1];
            const match = lastLine?.match(/^```(\w*)$/);

            if (match) {
                editor.update(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection))
                        return;

                    const anchorNode = selection.anchor.getNode();
                    const topLevelNode = anchorNode.getTopLevelElement();

                    if (topLevelNode) {
                        const codeBlock = $createCodeBlockNode(match[1] || "plaintext");
                        topLevelNode.replace(codeBlock);
                    }
                });
            }
        });
    }, [editor]);

    return null;
}

import { useEffect, useState } from "react";
import type { SerializedEditorState } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

type InitialStatePluginProps = {
    initialState?: SerializedEditorState | null;
};

export function InitialStatePlugin({ initialState }: InitialStatePluginProps) {
    const [editor] = useLexicalComposerContext();
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (isInitialized)
            return;

        if (initialState) {
            const parsedState = editor.parseEditorState(initialState);
            editor.setEditorState(parsedState);
        }

        setIsInitialized(true);
    }, [editor, initialState, isInitialized]);

    return null;
}

import { useEffect } from "react";
import {
    $getRoot,
    KEY_DOWN_COMMAND,
    COMMAND_PRIORITY_HIGH,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { isModKey } from "~/hooks/use-platform";

export function SelectAllPlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            KEY_DOWN_COMMAND,
            (ev: KeyboardEvent) => {
                const isSelectAll = isModKey(ev) && ev.key === "a";

                if (isSelectAll) {
                    ev.preventDefault();

                    editor.update(() => {
                        const root = $getRoot();
                        root.select(0, root.getChildrenSize());
                    });

                    return true;
                }

                return false;
            },
            COMMAND_PRIORITY_HIGH
        );
    }, [editor]);

    return null;
}

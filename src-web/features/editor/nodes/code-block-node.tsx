import type { JSX } from "react";

import {
    DecoratorNode,
    $applyNodeReplacement,
    type LexicalNode,
    type NodeKey,
    type SerializedLexicalNode,
    type Spread,
    type DOMConversionMap,
    type DOMExportOutput,
    type EditorConfig,
    type LexicalEditor,
} from "lexical";
import { Suspense, lazy } from "react";

// Lazy load the CodeBlock component to avoid circular dependencies
const CodeBlockComponent = lazy(() =>
    import("../components/code-block").then((mod) => ({ default: mod.CodeBlock }))
);

export type SerializedCodeBlockNode = Spread<
    {
        code: string;
        language: string;
    },
    SerializedLexicalNode
>;

export class CodeBlockNode extends DecoratorNode<JSX.Element> {
    __code: string;
    __language: string;

    static getType(): string {
        return "code-block";
    }

    static clone(node: CodeBlockNode): CodeBlockNode {
        return new CodeBlockNode(node.__code, node.__language, node.__key);
    }

    constructor(code: string = "", language: string = "plaintext", key?: NodeKey) {
        super(key);
        this.__code = code;
        this.__language = language;
    }

    // Getters (use getLatest() for reading)
    getCode(): string {
        return this.getLatest().__code;
    }

    getLanguage(): string {
        return this.getLatest().__language;
    }

    // Setters (use getWritable() for writing)
    setCode(code: string): void {
        const writable = this.getWritable();
        writable.__code = code;
    }

    setLanguage(language: string): void {
        const writable = this.getWritable();
        writable.__language = language;
    }

    // Serialization
    static importJSON(serializedNode: SerializedCodeBlockNode): CodeBlockNode {
        return $createCodeBlockNode(serializedNode.language, serializedNode.code);
    }

    exportJSON(): SerializedCodeBlockNode {
        return {
            type: "code-block",
            version: 1,
            code: this.__code,
            language: this.__language,
        };
    }

    // DOM
    createDOM(_config: EditorConfig): HTMLElement {
        const div = document.createElement("div");
        div.className = "code-block-wrapper my-2";
        return div;
    }

    updateDOM(): false {
        return false;
    }

    exportDOM(_editor: LexicalEditor): DOMExportOutput {
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.className = `language-${this.__language}`;
        code.textContent = this.__code;
        pre.appendChild(code);
        return { element: pre };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            pre: () => ({
                conversion: (element: HTMLElement) => {
                    const code = element.querySelector("code");
                    const text = code?.textContent || element.textContent || "";
                    const langMatch = code?.className.match(/language-(\w+)/);
                    const language = langMatch?.[1] || "plaintext";
                    return { node: $createCodeBlockNode(language, text) };
                },
                priority: 1,
            }),
        };
    }

    // Make it behave as a block-level node
    isInline(): false {
        return false;
    }

    // Decorator render
    decorate(editor: LexicalEditor, _config: EditorConfig): JSX.Element {
        return (
            <Suspense fallback={<div className="bg-muted rounded-lg p-4 animate-pulse h-24" />}>
                <CodeBlockComponent
                    content={this.__code}
                    language={this.__language}
                    onContentChange={(newCode) => {
                        editor.update(() => {
                            const node = this.getWritable();
                            node.__code = newCode;
                        });
                    }}
                    onLanguageChange={(newLanguage) => {
                        editor.update(() => {
                            const node = this.getWritable();
                            node.__language = newLanguage;
                        });
                    }}
                    onEnter={() => {
                        // Insert new paragraph after code block on Shift+Enter
                        editor.update(() => {
                            const { $createParagraphNode } = require("lexical");
                            const paragraph = $createParagraphNode();
                            this.insertAfter(paragraph);
                            paragraph.selectStart();
                        });
                    }}
                />
            </Suspense>
        );
    }
}

export function $createCodeBlockNode(language: string = "plaintext", code: string = ""): CodeBlockNode {
    return $applyNodeReplacement(new CodeBlockNode(code, language));
}

export function $isCodeBlockNode(node: LexicalNode | null | undefined): node is CodeBlockNode {
    return node instanceof CodeBlockNode;
}

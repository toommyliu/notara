import { useCallback, useRef, memo } from "react";
import type { RefObject } from "react";

import { cn } from "~/lib/utils";

type TokenType = "text" | "bold" | "italic" | "code" | "strikethrough" | "link";
type Token = {
    type: TokenType;
    content: string;
    raw: string; // Original markdown syntax
    start: number;
    end: number;
};

const PATTERNS = {
    bold: /\*\*(.+?)\*\*/g,
    italic: /(?<!\*)\*([^*]+)\*(?!\*)/g,
    code: /`([^`]+)`/g,
    strikethrough: /~~(.+?)~~/g,
    link: /\[([^\]]+)\]\(([^)]+)\)/g,
} as const;

/**
 * Parse content into tokens, identifying markdown syntax
 */
function tokenize(content: string): Token[] {
    if (!content) return [];

    const tokens: Token[] = [];
    const matches: { type: TokenType; match: RegExpExecArray; content: string; raw: string }[] = [];

    // Find all matches for each pattern
    for (const [type, pattern] of Object.entries(PATTERNS)) {
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;
        while ((match = regex.exec(content)) !== null) {
            matches.push({
                type: type as TokenType,
                match,
                content: match[1],
                raw: match[0],
            });
        }
    }

    matches.sort((a, b) => a.match.index - b.match.index);

    let lastEnd = 0;

    for (const { type, match, content: matchContent, raw } of matches) {
        const start = match.index;
        const end = start + raw.length;

        if (start < lastEnd)
            continue;

        if (start > lastEnd) {
            tokens.push({
                type: "text",
                content: content.slice(lastEnd, start),
                raw: content.slice(lastEnd, start),
                start: lastEnd,
                end: start,
            });
        }

        tokens.push({
            type,
            content: matchContent,
            raw,
            start,
            end,
        });

        lastEnd = end;
    }

    if (lastEnd < content.length) {
        tokens.push({
            type: "text",
            content: content.slice(lastEnd),
            raw: content.slice(lastEnd),
            start: lastEnd,
            end: content.length,
        });
    }

    return tokens;
}

/**
 * Check if cursor is within a token's syntax markers (should show raw)
 */
function isCursorInSyntax(token: Token, cursorPosition: number): boolean {
    if (token.type === "text")
        return false;

    if (cursorPosition >= token.start && cursorPosition <= token.end)
        return true;

    return cursorPosition === token.end;
}

/**
 * Check if token is "complete" (has space/punctuation after it)
 */
function isTokenComplete(content: string, token: Token): boolean {
    if (token.type === "text") return true;

    const charAfter = content[token.end];
    if (!charAfter) return false;

    // Complete if followed by space, punctuation, or newline
    return /[\s.,!?;:\n]/.test(charAfter);
}

type LiveInlineRendererProps = {
    content: string;
    cursorPosition: number;
    className?: string;
};

/**
 * Renders inline markdown with cursor-aware live preview.
 */
export const LiveInlineRenderer = memo(function LiveInlineRenderer({
    content,
    cursorPosition,
    className,
}: LiveInlineRendererProps) {
    const tokens = tokenize(content);

    return (
        <span className={cn("inline-live-preview", className)}>
            {tokens.map((token, index) => {
                const shouldShowRaw =
                    isCursorInSyntax(token, cursorPosition) ||
                    !isTokenComplete(content, token);

                if (shouldShowRaw || token.type === "text") {
                    return <span key={index}>{token.raw}</span>;
                }

                switch (token.type) {
                    case "bold":
                        return (
                            <strong key={index} className="font-semibold">
                                {token.content}
                            </strong>
                        );
                    case "italic":
                        return (
                            <em key={index} className="italic">
                                {token.content}
                            </em>
                        );
                    case "code":
                        return (
                            <code key={index} className="inline-code">
                                {token.content}
                            </code>
                        );
                    case "strikethrough":
                        return (
                            <del key={index} className="line-through text-muted-foreground">
                                {token.content}
                            </del>
                        );
                    case "link":
                        return (
                            <a key={index} className="inline-link" href="#">
                                {token.content}
                            </a>
                        );
                    default:
                        return <span key={index}>{token.raw}</span>;
                }
            })}
        </span>
    );
});

export function useCursorPosition(elementRef: RefObject<HTMLElement | null>) {
    const positionRef = useRef<number>(0);

    const updatePosition = useCallback(() => {
        const element = elementRef.current;
        if (!element) return 0;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return positionRef.current;

        const range = selection.getRangeAt(0);

        // Only track if selection is within our element
        if (!element.contains(range.commonAncestorContainer)) {
            return positionRef.current;
        }

        // Calculate offset from start of element
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        positionRef.current = preCaretRange.toString().length;

        return positionRef.current;
    }, [elementRef]);

    const restorePosition = useCallback((position: number) => {
        const element = elementRef.current;
        if (!element) return;

        const selection = window.getSelection();
        if (!selection) return;

        // Find the text node and offset for the given position
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
        let currentOffset = 0;
        let node: Text | null = null;

        while ((node = walker.nextNode() as Text | null)) {
            const nodeLength = node.textContent?.length ?? 0;
            if (currentOffset + nodeLength >= position) {
                const range = document.createRange();
                range.setStart(node, position - currentOffset);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                return;
            }
            currentOffset += nodeLength;
        }
    }, [elementRef]);

    return { updatePosition, restorePosition, positionRef };
}
